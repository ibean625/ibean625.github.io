export type DeliveryFailure = 'timeout' | 'offline' | 'cancelled' | 'unconfirmed';
export class DeliveryError extends Error {
  constructor(public kind: DeliveryFailure) { super(kind); this.name = 'DeliveryError'; }
}

async function postLetter(payload: FormData, endpoint: string, signal: AbortSignal, recipient: string) {
  const hasFiles = [...payload.values()].some(value => value instanceof File);
  if (!hasFiles) {
    const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: payload, signal, credentials: 'omit' });
    const result = await response.json();
    if (!response.ok || (result.success !== true && result.success !== 'true')) throw new DeliveryError('unconfirmed');
    return;
  }
  const receipt = new URL('/letter-receipt/', location.origin);
  receipt.searchParams.set('receipt', crypto.randomUUID());
  payload.set('_next', receipt.href);
  if (!payload.has('email')) {
    payload.set('email', recipient);
    payload.set('reply_note', 'The sender provided no email. Please use their contact details above.');
  }
  const response = await fetch(endpoint.replace('/ajax/', '/'), {
    method: 'POST', headers: { Accept: 'application/json' }, body: payload, signal, credentials: 'omit',
  });
  if (!response.ok || !response.redirected || response.url !== receipt.href) throw new DeliveryError('unconfirmed');
}

export async function deliverLetter(payload: FormData, endpoint: string, signal: AbortSignal, recipient: string): Promise<void> {
  if (!navigator.onLine) throw new DeliveryError('offline');
  if (signal.aborted) throw new DeliveryError('cancelled');
  const timeoutMs = [...payload.values()].some(value => value instanceof File) ? 25_000 : 10_000;
  const deadline = Date.now() + timeoutMs;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  let fail: (reason: DeliveryFailure) => void = () => {};
  const stop = new Promise<never>((_, reject) => {
    fail = reason => { controller.abort(); reject(new DeliveryError(reason)); };
    timer = setTimeout(() => fail('timeout'), timeoutMs);
  });
  const cancel = () => fail('cancelled');
  const resume = () => { if (Date.now() >= deadline) fail('timeout'); };
  signal.addEventListener('abort', cancel, { once: true });
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pageshow', resume);
  try {
    // Race the deadline as well as aborting fetch: an unresponsive fetch/body
    // or a suspended Safari request must never hold the UI indefinitely.
    await Promise.race([postLetter(payload, endpoint, controller.signal, recipient), stop]);
  } finally {
    clearTimeout(timer!);
    signal.removeEventListener('abort', cancel);
    document.removeEventListener('visibilitychange', resume);
    window.removeEventListener('pageshow', resume);
  }
}
