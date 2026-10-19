const form = document.querySelector<HTMLFormElement>('.message-form');

if (form) {
  const fields = form.querySelector<HTMLFieldSetElement>('.message-fields')!;
  const button = form.querySelector<HTMLButtonElement>('.message-submit')!;
  const status = form.querySelector<HTMLElement>('.message-status')!;
  const email = form.elements.namedItem('email') as HTMLInputElement;
  const subject = form.elements.namedItem('subject') as HTMLInputElement;
  const message = form.elements.namedItem('message') as HTMLTextAreaElement;
  let sending = false;

  for (const field of [email, subject, message]) {
    field.addEventListener('input', () => field.setCustomValidity(''));
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    for (const field of [email, subject, message]) {
      field.value = field.value.trim();
      field.setCustomValidity(field.value ? '' : form.dataset.required ?? 'Required');
    }
    if (!form.reportValidity()) return;

    const payload = Object.fromEntries(new FormData(form).entries());
    payload._subject = `[Website message] ${subject.value.replace(/[\r\n]+/g, ' ')}`;
    payload._replyto = email.value;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    sending = true;
    fields.disabled = true;
    button.disabled = true;
    button.textContent = form.dataset.sending ?? '';
    form.setAttribute('aria-busy', 'true');
    status.hidden = true;

    try {
      const response = await fetch(form.dataset.endpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== 'true')) throw new Error('Submission not confirmed');
      status.dataset.state = 'success';
      status.textContent = form.dataset.success ?? '';
      form.reset();
    } catch {
      status.dataset.state = 'error';
      status.textContent = form.dataset.error ?? '';
    } finally {
      clearTimeout(timeout);
      sending = false;
      fields.disabled = false;
      button.disabled = false;
      button.textContent = button.dataset.label ?? '';
      form.removeAttribute('aria-busy');
      status.hidden = false;
      status.focus({ preventScroll: true });
    }
  });
}

export {};
