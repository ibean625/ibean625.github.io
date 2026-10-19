export async function deliverLetter(payload: FormData, endpoint: string, signal: AbortSignal, recipient: string): Promise<void> {
  const hasFiles = [...payload.values()].some(value => value instanceof File);
  if (!hasFiles) {
    const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: payload, signal });
    const result = await response.json();
    if (!response.ok || (result.success !== true && result.success !== 'true')) throw new Error('Delivery not confirmed');
    return;
  }

  // The regular multipart endpoint preserves files; the JSON/AJAX endpoint
  // silently drops them. Its successful redirect confirms receipt of the form.
  const receipt = new URL('/letter-receipt/', location.origin);
  receipt.searchParams.set('receipt', crypto.randomUUID());
  payload.set('_next', receipt.href);
  // File delivery requires an email field. When the sender only gives a phone
  // or WeChat ID, use the receiving mailbox for routing, never as their identity.
  if (!payload.has('email')) {
    payload.set('email', recipient);
    payload.set('reply_note', 'The sender provided no email. Please use their contact details above.');
  }
  const response = await fetch(endpoint.replace('/ajax/', '/'), {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: payload,
    signal,
  });
  if (!response.ok || !response.redirected || response.url !== receipt.href) throw new Error('Upload not confirmed');
}
