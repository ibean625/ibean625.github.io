const form = document.querySelector<HTMLFormElement>('.message-form');
const dialog = document.querySelector<HTMLDialogElement>('#message-dialog');
const thanks = dialog?.querySelector<HTMLElement>('.message-thanks');
const composeHeading = dialog?.querySelector<HTMLElement>('[data-message-compose-heading]');

function resetMessageView() {
  if (!dialog || !form || !thanks || !composeHeading) return;
  form.hidden = false;
  composeHeading.hidden = false;
  thanks.hidden = true;
  delete dialog.dataset.state;
  dialog.setAttribute('aria-labelledby', 'message-title');
  dialog.setAttribute('aria-describedby', 'message-intro');
  const status = form.querySelector<HTMLElement>('.message-status');
  if (status) status.hidden = true;
}

if (dialog) {
  let returnFocus: HTMLElement | undefined;
  let previousOverflow = '';
  document.querySelectorAll<HTMLAnchorElement>('[data-open-message]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      returnFocus = trigger;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    });
  });
  dialog.querySelectorAll('[data-close-message]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    returnFocus?.focus({ preventScroll: true });
    if (dialog.dataset.state === 'sent') resetMessageView();
  });
}

if (form) {
  const fields = form.querySelector<HTMLFieldSetElement>('.message-fields')!;
  const button = form.querySelector<HTMLButtonElement>('.message-submit')!;
  const status = form.querySelector<HTMLElement>('.message-status')!;
  const contact = form.elements.namedItem('contact') as HTMLInputElement;
  const message = form.elements.namedItem('message') as HTMLTextAreaElement;
  let sending = false;

  for (const field of [contact, message]) {
    field.addEventListener('input', () => field.setCustomValidity(''));
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    for (const field of [contact, message]) {
      field.value = field.value.trim();
      field.setCustomValidity(field.value ? '' : form.dataset.required ?? 'Required');
    }
    if (!form.reportValidity()) return;

    const payload = Object.fromEntries(new FormData(form).entries());
    const replyAddress = document.createElement('input');
    replyAddress.type = 'email';
    replyAddress.value = contact.value;
    if (replyAddress.checkValidity()) {
      payload.email = contact.value;
      payload._replyto = contact.value;
    }
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
      if (dialog && thanks && composeHeading) {
        form.hidden = true;
        composeHeading.hidden = true;
        thanks.hidden = false;
        dialog.dataset.state = 'sent';
        dialog.setAttribute('aria-labelledby', 'message-thanks-title');
        dialog.setAttribute('aria-describedby', 'message-thanks-description');
        dialog.scrollTop = 0;
      }
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
      status.hidden = dialog?.dataset.state === 'sent';
      if (dialog?.open) (dialog.dataset.state === 'sent' ? thanks : status)?.focus({ preventScroll: true });
    }
  });
}

export {};
