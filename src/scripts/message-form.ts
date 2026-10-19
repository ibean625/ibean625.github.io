import { deliverLetter } from './letter-delivery';

type Attachment = { file: File; preview?: string };

function setupLetter() {
  const formElement = document.querySelector<HTMLFormElement>('.message-form');
  const dialogElement = document.querySelector<HTMLDialogElement>('#message-dialog');
  const launcherElement = document.querySelector<HTMLAnchorElement>('[data-open-message]');
  const envelopeElement = document.querySelector<HTMLElement>('[data-letter-envelope]');
  const dockElement = dialogElement?.querySelector<HTMLElement>('[data-letter-dock]');
  const sheetElement = dialogElement?.querySelector<HTMLElement>('.letter-sheet');
  const thanksElement = dialogElement?.querySelector<HTMLElement>('.message-thanks');
  const sceneElement = dialogElement?.querySelector<HTMLElement>('.letter-scene');
  if (!formElement || !dialogElement || !launcherElement || !envelopeElement || !dockElement || !sheetElement || !thanksElement || !sceneElement) return;
  const form = formElement;
  const dialog = dialogElement;
  const launcher = launcherElement;
  const envelope = envelopeElement;
  const dock = dockElement;
  const sheet = sheetElement;
  const thanks = thanksElement;
  const scene = sceneElement;

  const flap = envelope.querySelector<SVGElement>('.letter-flap')!;
  const fields = form.querySelector<HTMLFieldSetElement>('.message-fields')!;
  const button = form.querySelector<HTMLButtonElement>('.message-submit')!;
  const status = form.querySelector<HTMLElement>('.message-status')!;
  const contact = form.elements.namedItem('contact') as HTMLInputElement;
  const message = form.elements.namedItem('message') as HTMLTextAreaElement;
  const fileInput = form.querySelector<HTMLInputElement>('[data-attachment-input]')!;
  const addFile = form.querySelector<HTMLButtonElement>('[data-add-attachment]')!;
  const fileList = form.querySelector<HTMLElement>('[data-attachment-list]')!;
  const errorEmail = form.querySelector<HTMLElement>('[data-error-email]')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set<Animation>();
  const attachments: Attachment[] = [];
  let epoch = 0;
  let sending = false;
  let delivered = false;
  let receiptSeen = false;
  let previousOverflow = '';
  let opening: Promise<void> = Promise.resolve();

  const phase = (value: string) => { dialog.dataset.phase = value; };
  const cancelMotion = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
  async function animate(element: Element, keyframes: Keyframe[], duration: number, token: number, easing = 'cubic-bezier(.22,.7,.2,1)') {
    if (token !== epoch || !dialog.open) return false;
    if (reducedMotion.matches) return true;
    const animation = element.animate(keyframes, { duration, easing, fill: 'both' });
    animations.add(animation);
    try { await animation.finished; } catch { return false; }
    finally { animations.delete(animation); animation.cancel(); }
    return token === epoch && dialog.open;
  }
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) animations.forEach(animation => { try { animation.finish(); } catch {} });
  });

  function clearAttachments() {
    attachments.forEach(item => { if (item.preview) URL.revokeObjectURL(item.preview); });
    attachments.length = 0;
    fileInput.value = '';
    fileList.replaceChildren();
  }
  function renderAttachments() {
    fileList.replaceChildren();
    attachments.forEach((item, index) => {
      const row = document.createElement('li');
      row.className = 'letter-attachment';
      if (item.preview) {
        const image = document.createElement('img');
        image.src = item.preview;
        image.alt = '';
        image.addEventListener('error', () => image.remove());
        row.append(image);
      }
      const name = document.createElement('span');
      name.textContent = item.file.name;
      name.title = item.file.name;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.disabled = sending;
      remove.setAttribute('aria-label', `${form.dataset.removeFile}: ${item.file.name}`);
      remove.addEventListener('click', () => {
        if (sending) return;
        if (item.preview) URL.revokeObjectURL(item.preview);
        attachments.splice(index, 1);
        renderAttachments();
      });
      row.append(name, remove);
      fileList.append(row);
    });
  }
  addFile.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const chosen = [...(fileInput.files ?? [])].filter(file => !attachments.some(item => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified));
    if ([...attachments.map(item => item.file), ...chosen].reduce((sum, file) => sum + file.size, 0) > 10_000_000) {
      status.textContent = form.dataset.fileLimit ?? '';
      status.dataset.state = 'error';
      status.hidden = false;
      fileInput.value = '';
      return;
    }
    chosen.forEach(file => attachments.push({ file, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined }));
    fileInput.value = '';
    renderAttachments();
    status.hidden = true;
  });

  function restoreEnvelope() {
    envelope.dataset.open = 'false';
    delete envelope.dataset.sealed;
    envelope.style.removeProperty('opacity');
    envelope.style.removeProperty('transform-origin');
    launcher.append(envelope);
  }
  function foldedTransform() {
    const paper = sheet.getBoundingClientRect();
    const mail = envelope.getBoundingClientRect();
    return `translate(${mail.left + mail.width * .08 - paper.left}px, ${mail.top + mail.height * .06 - paper.top}px) scale(${mail.width * .84 / paper.width}, ${mail.height * .72 / paper.height})`;
  }
  function showReceipt() {
    phase('sent');
    sheet.hidden = true;
    sheet.inert = true;
    thanks.hidden = false;
    envelope.style.opacity = '0';
    dialog.setAttribute('aria-labelledby', 'message-thanks-title');
    dialog.setAttribute('aria-describedby', 'message-thanks-description');
    if (dialog.open) { receiptSeen = true; thanks.focus({ preventScroll: true }); }
  }
  async function openLetter() {
    if (dialog.open) return;
    const token = ++epoch;
    cancelMotion();
    const from = envelope.getBoundingClientRect();
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sheet.hidden = true;
    sheet.inert = true;
    thanks.hidden = true;
    envelope.style.removeProperty('opacity');
    envelope.style.removeProperty('transform-origin');
    envelope.dataset.open = 'false';
    delete envelope.dataset.sealed;
    dock.append(envelope);
    phase('opening');
    dialog.setAttribute('aria-labelledby', 'message-title');
    dialog.setAttribute('aria-describedby', 'message-privacy');
    dialog.showModal();
    if (delivered) { showReceipt(); return; }
    const to = envelope.getBoundingClientRect();
    const start = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
    if (!await animate(envelope, [{ transform: start }, { transform: 'none' }], 650, token)) return;
    envelope.dataset.open = 'true';
    if (!await animate(flap, [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-180deg)' }], 500, token)) return;
    sheet.hidden = false;
    phase('unfolding');
    if (!await animate(sheet, [{ transform: foldedTransform(), opacity: .3 }, { transform: 'none', opacity: 1 }], 650, token)) return;
    phase('writing');
    sheet.inert = false;
  }
  function closeLetter() {
    ++epoch;
    cancelMotion();
    dialog.close();
  }
  launcher.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opening = openLetter();
  });
  dialog.querySelectorAll('[data-close-message]').forEach(close => close.addEventListener('click', closeLetter));
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeLetter(); });
  dialog.addEventListener('click', event => { if (event.target === dialog || event.target === scene) closeLetter(); });
  dialog.addEventListener('close', () => {
    ++epoch;
    cancelMotion();
    restoreEnvelope();
    sheet.hidden = true;
    sheet.inert = true;
    thanks.hidden = true;
    phase('closed');
    document.body.style.overflow = previousOverflow;
    launcher.focus({ preventScroll: true });
    if (receiptSeen) { delivered = false; receiptSeen = false; }
    if (delivered) { form.reset(); clearAttachments(); }
  });

  async function sendLetter() {
    await opening;
    if (!dialog.open || dialog.dataset.phase === 'sent') return;
    const token = epoch;
    phase('packing');
    sheet.inert = true;
    if (!await animate(sheet, [
      { transform: 'none', opacity: 1, zIndex: 6, offset: 0 },
      { zIndex: 6, offset: .35 }, { zIndex: 1, offset: .36 },
      { transform: foldedTransform(), opacity: 1, zIndex: 1, offset: 1 },
    ], 700, token)) return;
    sheet.hidden = true;
    form.reset();
    clearAttachments();
    envelope.dataset.open = 'false';
    phase('sealing');
    if (!await animate(flap, [{ transform: 'rotateX(-180deg)' }, { transform: 'rotateX(0deg)' }], 650, token, 'ease-in-out')) return;
    envelope.dataset.sealed = 'true';
    phase('flying');
    const rect = envelope.getBoundingClientRect();
    const x = innerWidth - rect.left + rect.width;
    const y = -rect.bottom - 100;
    envelope.style.opacity = '0';
    envelope.style.transformOrigin = '50% 50%';
    if (!await animate(envelope, [
      { transform: 'none', opacity: 1, offset: 0 },
      { transform: 'translate(0,-14px) rotate(-4deg)', opacity: 1, offset: .22 },
      { transform: `translate(${x * .3}px,${y * .3}px) rotate(-13deg) scale(.95)`, opacity: 1, offset: .55 },
      { transform: `translate(${x}px,${y}px) rotate(-24deg) scale(.65)`, opacity: 0, offset: 1 },
    ], 1200, token, 'cubic-bezier(.4,.05,.65,.8)')) return;
    showReceipt();
  }

  for (const field of [contact, message]) field.addEventListener('input', () => field.setCustomValidity(''));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || delivered) return;
    contact.value = contact.value.trim().replace(/^(?:微信|wechat|电话|手机(?:号)?|phone|邮箱|e-?mail)(?:\s*[/、]\s*(?:微信|wechat|电话|手机(?:号)?|phone|邮箱|e-?mail))*\s*[:：]\s*/i, '');
    for (const field of [contact, message]) {
      field.value = field.value.trim();
      field.setCustomValidity(field.value ? '' : form.dataset.required ?? 'Required');
    }
    if (!form.reportValidity()) return;
    const payload = new FormData(form);
    payload.delete('attachment');
    attachments.forEach((item, index) => payload.append(index ? `attachment_${index + 1}` : 'attachment', item.file, item.file.name));
    const email = document.createElement('input');
    email.type = 'email'; email.value = contact.value;
    if (email.checkValidity()) { payload.set('email', contact.value); payload.set('_replyto', contact.value); }
    sending = true;
    fields.disabled = true;
    addFile.disabled = true;
    fileInput.disabled = true;
    fileList.querySelectorAll<HTMLButtonElement>('button').forEach(remove => { remove.disabled = true; });
    button.disabled = true;
    button.textContent = form.dataset.sending ?? '';
    form.setAttribute('aria-busy', 'true');
    status.hidden = true;
    errorEmail.hidden = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), attachments.length ? 60000 : 30000);
    try {
      await deliverLetter(payload, form.dataset.endpoint!, controller.signal, form.dataset.recipient!);
      clearTimeout(timeout);
      delivered = true;
      if (dialog.open) await sendLetter();
      if (!dialog.open) { form.reset(); clearAttachments(); }
    } catch {
      status.dataset.state = 'error';
      status.textContent = form.dataset.error ?? '';
      status.hidden = false;
      errorEmail.hidden = false;
      if (dialog.open && dialog.dataset.phase === 'writing') status.focus({ preventScroll: true });
    } finally {
      clearTimeout(timeout);
      sending = false;
      fields.disabled = false;
      addFile.disabled = false;
      fileInput.disabled = false;
      fileList.querySelectorAll<HTMLButtonElement>('button').forEach(remove => { remove.disabled = false; });
      button.disabled = false;
      button.textContent = button.dataset.label ?? '';
      form.removeAttribute('aria-busy');
    }
  });
}

setupLetter();
export {};
