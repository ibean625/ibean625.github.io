import { deliverLetter, DeliveryError } from './letter-delivery';

type Attachment = { file: File; preview?: string };
type DeliveryState = 'idle' | 'pending' | 'sent' | 'error';

function setupLetter() {
  const formElement = document.querySelector<HTMLFormElement>('.message-form');
  const dialogElement = document.querySelector<HTMLDialogElement>('#message-dialog');
  const launcherElement = document.querySelector<HTMLAnchorElement>('[data-open-message]');
  if (!formElement || !dialogElement || !launcherElement) return;
  const form = formElement;
  const dialog = dialogElement;
  const launcher = launcherElement;
  const envelope = launcher.querySelector<HTMLElement>('[data-letter-envelope]')!;
  const iconSlot = launcher.querySelector<HTMLElement>('.message-launcher-icon')!;
  const scene = dialog.querySelector<HTMLElement>('.letter-scene')!;
  const object = dialog.querySelector<HTMLElement>('[data-letter-object]')!;
  const dock = dialog.querySelector<HTMLElement>('[data-letter-dock]')!;
  const sheet = dialog.querySelector<HTMLElement>('.letter-sheet')!;
  const content = sheet.querySelector<HTMLElement>('.letter-content')!;
  const front = envelope.querySelector<SVGElement>('.letter-front')!;
  const flap = envelope.querySelector<SVGElement>('.letter-flap')!;
  const thanks = dialog.querySelector<HTMLElement>('.message-thanks')!;
  const pending = dialog.querySelector<HTMLElement>('.message-pending')!;
  const pendingStatus = dialog.querySelector<HTMLElement>('[data-pending-status]')!;
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
  const attachments: Attachment[] = [];
  const animations = new Set<Animation>();
  const moving = [object, front, flap, content];
  let epoch = 0;
  let sending = false;
  let outgoing = false;
  let closing = false;
  let receiptSeen = false;
  let deliveryState: DeliveryState = 'idle';
  let failureMessage = '';
  let previousOverflow = '';
  let activeRequest: AbortController | undefined;

  const phase = (value: string) => { dialog.dataset.phase = value; };
  function applyFrame(element: HTMLElement | SVGElement, frame: Keyframe) {
    if (frame.transform !== undefined) element.style.transform = String(frame.transform);
    if (frame.opacity !== undefined) element.style.opacity = String(frame.opacity);
  }
  function cancelMotion(preserve = false) {
    if (preserve) animations.forEach(animation => { try { animation.commitStyles(); } catch {} });
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  async function animate(element: HTMLElement | SVGElement, frames: Keyframe[], duration: number, token: number, delay = 0, easing = 'cubic-bezier(.25,.8,.25,1)') {
    if (token !== epoch || !dialog.open) return false;
    if (reducedMotion.matches) { applyFrame(element, frames.at(-1)!); return true; }
    let animation: Animation;
    try { animation = element.animate(frames, { duration, delay, fill: 'both', easing }); }
    catch { applyFrame(element, frames.at(-1)!); return true; }
    animations.add(animation);
    let watchdog: ReturnType<typeof setTimeout>;
    try {
      // Animation promises are visual only. A throttled/cancelled Safari
      // timeline must not block either the form or delivery confirmation.
      await Promise.race([
        animation.finished.catch(() => {}),
        new Promise<void>(resolve => { watchdog = setTimeout(resolve, duration + delay + 120); }),
      ]);
      if (token !== epoch || !dialog.open) return false;
      applyFrame(element, frames.at(-1)!);
      return true;
    } finally { clearTimeout(watchdog!); animations.delete(animation); animation.cancel(); }
  }
  const finishMotion = () => { animations.forEach(animation => { try { animation.finish(); } catch { animation.cancel(); } }); };
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) finishMotion(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) finishMotion(); });
  window.addEventListener('pageshow', finishMotion);

  function resetPose() {
    moving.forEach(part => { part.style.removeProperty('transform'); part.style.removeProperty('opacity'); });
    object.style.removeProperty('height');
    object.style.removeProperty('transform-origin');
    delete envelope.dataset.sealed;
  }
  function unlockScene() { ['position', 'left', 'top', 'width'].forEach(key => scene.style.removeProperty(key)); }
  function freezeScene() {
    const bounds = scene.getBoundingClientRect();
    scene.style.position = 'fixed';
    scene.style.left = `${bounds.left}px`;
    scene.style.top = `${bounds.top}px`;
    scene.style.width = `${bounds.width}px`;
    object.style.height = `${object.offsetHeight}px`;
  }
  function setBusy(busy: boolean) {
    sending = busy;
    fields.disabled = busy;
    addFile.disabled = busy;
    fileInput.disabled = busy;
    fileList.querySelectorAll<HTMLButtonElement>('button').forEach(remove => { remove.disabled = busy; });
    button.disabled = busy;
    button.textContent = busy ? form.dataset.sending! : button.dataset.label!;
    if (busy) form.setAttribute('aria-busy', 'true'); else form.removeAttribute('aria-busy');
  }
  function clearAttachments() {
    attachments.forEach(item => { if (item.preview) URL.revokeObjectURL(item.preview); });
    attachments.length = 0;
    fileInput.value = '';
    fileList.replaceChildren();
  }
  function renderAttachments() {
    fileList.replaceChildren();
    attachments.forEach((item, index) => {
      const row = document.createElement('li'); row.className = 'letter-attachment';
      if (item.preview) {
        const image = document.createElement('img'); image.src = item.preview; image.alt = '';
        image.addEventListener('error', () => image.remove()); row.append(image);
      }
      const name = document.createElement('span'); name.textContent = item.file.name; name.title = item.file.name;
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.disabled = sending;
      remove.setAttribute('aria-label', `${form.dataset.removeFile}: ${item.file.name}`);
      remove.addEventListener('click', () => {
        if (sending) return;
        if (item.preview) URL.revokeObjectURL(item.preview);
        attachments.splice(index, 1); renderAttachments();
      });
      row.append(name, remove); fileList.append(row);
    });
  }
  addFile.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const chosen = [...(fileInput.files ?? [])].filter(file => !attachments.some(item => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified));
    if ([...attachments.map(item => item.file), ...chosen].reduce((sum, file) => sum + file.size, 0) > 10_000_000) {
      status.textContent = form.dataset.fileLimit!; status.dataset.state = 'error'; status.hidden = false; fileInput.value = ''; return;
    }
    chosen.forEach(file => attachments.push({ file, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined }));
    fileInput.value = ''; renderAttachments(); status.hidden = true;
  });

  function updateEmailDraft() {
    const files = attachments.length ? `\n\nFiles to attach: ${attachments.map(item => item.file.name).join(', ')}` : '';
    const body = `${contact.value.trim()}\n\n${message.value.trim()}${files}`;
    const url = `mailto:${form.dataset.recipient}?subject=${encodeURIComponent((form.elements.namedItem('_subject') as HTMLInputElement).value)}&body=${encodeURIComponent(body)}`;
    dialog.querySelectorAll<HTMLAnchorElement>('[data-compose-email]').forEach(link => { link.href = url; });
    dialog.querySelectorAll<HTMLElement>('[data-mail-file-note]').forEach(note => { note.hidden = !attachments.length; });
  }
  dialog.querySelectorAll('[data-compose-email]').forEach(link => link.addEventListener('click', () => { updateEmailDraft(); activeRequest?.abort(); }));
  dialog.querySelector('[data-cancel-delivery]')?.addEventListener('click', () => activeRequest?.abort());

  function showPending() {
    unlockScene();
    phase('waiting'); sheet.hidden = true; sheet.inert = true; object.style.opacity = '0';
    pending.hidden = false; thanks.hidden = true;
    dialog.setAttribute('aria-labelledby', 'message-pending-title');
    dialog.setAttribute('aria-describedby', 'message-pending-status');
  }
  function showReceipt() {
    unlockScene();
    phase('sent'); sheet.hidden = true; sheet.inert = true; object.style.opacity = '0';
    pending.hidden = true; thanks.hidden = false; receiptSeen = true;
    dialog.setAttribute('aria-labelledby', 'message-thanks-title');
    dialog.setAttribute('aria-describedby', 'message-thanks-description');
    form.reset(); clearAttachments(); thanks.focus({ preventScroll: true });
  }
  function showDraft() {
    resetPose(); unlockScene(); envelope.dataset.open = 'true';
    sheet.hidden = false; sheet.inert = false; content.style.opacity = '1';
    pending.hidden = true; thanks.hidden = true; phase('writing');
    dialog.setAttribute('aria-labelledby', 'message-title');
    dialog.setAttribute('aria-describedby', 'message-privacy');
    status.dataset.state = 'error'; status.textContent = failureMessage; status.hidden = false; errorEmail.hidden = false;
  }
  function settle() {
    if (!dialog.open || outgoing || closing) return;
    if (deliveryState === 'pending') showPending();
    else if (deliveryState === 'sent') showReceipt();
    else if (deliveryState === 'error') showDraft();
  }
  async function openLetter() {
    if (dialog.open) return;
    const token = ++epoch; closing = false; cancelMotion(); resetPose(); unlockScene();
    const from = envelope.getBoundingClientRect();
    previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    sheet.hidden = false; sheet.inert = true; pending.hidden = true; thanks.hidden = true;
    dock.append(envelope); envelope.append(sheet); envelope.removeAttribute('aria-hidden'); envelope.dataset.open = 'true';
    phase('opening'); dialog.setAttribute('aria-labelledby', 'message-title'); dialog.setAttribute('aria-describedby', 'message-privacy');
    dialog.showModal();
    if (deliveryState === 'pending' || deliveryState === 'sent') { freezeScene(); outgoing = false; settle(); return; }
    const bounds = object.getBoundingClientRect();
    const start = `translate3d(${from.left - bounds.left}px,${from.top - bounds.top}px,0) scale(${from.width / bounds.width},${from.height / bounds.height})`;
    await Promise.all([
      animate(object, [{ transform: start }, { transform: 'none' }], 520, token),
      animate(front, [{ transform: 'perspective(1000px) rotateX(0deg)' }, { transform: 'perspective(1000px) rotateX(175deg)' }], 430, token, 30, 'cubic-bezier(.4,0,.2,1)'),
      animate(flap, [{ transform: 'perspective(1000px) rotateX(0deg)' }, { transform: 'perspective(1000px) rotateX(-175deg)' }], 410, token, 0, 'cubic-bezier(.4,0,.2,1)'),
      animate(content, [{ opacity: 0 }, { opacity: 1 }], 180, token, 90),
    ]);
    if (token !== epoch || !dialog.open) return;
    phase('writing'); sheet.inert = false;
  }
  async function closeLetter() {
    if (!dialog.open || closing) return;
    closing = true; const token = ++epoch; cancelMotion(true);
    if (outgoing || deliveryState === 'pending' || deliveryState === 'sent' || reducedMotion.matches) { dialog.close(); return; }
    freezeScene(); phase('closing'); sheet.inert = true;
    const from = object.getBoundingClientRect(); const icon = iconSlot.getBoundingClientRect();
    const target = `translate3d(${icon.left + (icon.width - 23) / 2 - from.left}px,${icon.top + (icon.height - 16) / 2 - from.top}px,0) scale(${23 / from.width},${16 / from.height})`;
    await Promise.all([
      animate(object, [{ transform: getComputedStyle(object).transform }, { transform: target }], 400, token),
      animate(front, [{ transform: getComputedStyle(front).transform }, { transform: 'perspective(1000px) rotateX(0deg)' }], 300, token),
      animate(flap, [{ transform: getComputedStyle(flap).transform }, { transform: 'perspective(1000px) rotateX(0deg)' }], 320, token),
      animate(content, [{ opacity: getComputedStyle(content).opacity }, { opacity: 0 }], 130, token),
    ]);
    if (token === epoch && dialog.open) dialog.close();
  }
  async function departLetter() {
    const token = epoch; outgoing = true; phase('packing'); sheet.inert = true;
    freezeScene();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const bounds = object.getBoundingClientRect();
    object.style.transformOrigin = '50% 50%';
    const ratio = bounds.width * 11 / 16 / bounds.height;
    const x = innerWidth - (bounds.left + bounds.width / 2) + 120;
    const y = -bounds.top - bounds.height / 2 - 120;
    const frames: Keyframe[] = [{ transform: 'none', opacity: 1 }];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12; const scale = .74 * (1 - .7 * t);
      const px = 3 * (1 - t) ** 2 * t * -45 + t ** 3 * x;
      const py = 3 * (1 - t) ** 2 * t * -25 + 3 * (1 - t) * t ** 2 * y * .4 + t ** 3 * y;
      frames.push({ transform: `translate3d(${px}px,${py}px,0) rotate(${Math.sin(t * Math.PI * 2) * 7 - t * 20}deg) scale(${scale},${scale * ratio})`, opacity: t < .8 ? 1 : (1 - t) * 5, offset: .34 + .66 * t });
    }
    const wind = dialog.querySelector<SVGSVGElement>('.letter-wind')!;
    wind.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    wind.querySelectorAll('path').forEach((path, i) => path.setAttribute('d', `M${bounds.left + bounds.width / 2} ${bounds.top + bounds.height / 2 + i * 6} q-45 -25 ${x} ${y}`));
    const mark = setTimeout(() => { if (token === epoch && dialog.open) { envelope.dataset.sealed = 'true'; phase('flying'); } }, reducedMotion.matches ? 0 : 370);
    await Promise.all([
      animate(content, [{ opacity: 1 }, { opacity: 0 }], 160, token),
      animate(front, [{ transform: 'perspective(1000px) rotateX(175deg)' }, { transform: 'perspective(1000px) rotateX(0deg)' }], 320, token),
      animate(flap, [{ transform: 'perspective(1000px) rotateX(-175deg)' }, { transform: 'perspective(1000px) rotateX(0deg)' }], 340, token, 20),
      animate(object, frames, 1120, token),
    ]);
    clearTimeout(mark); outgoing = false; settle();
  }

  let fontSheet: Promise<void> | undefined;
  function warm() {
    if (!document.querySelector('[data-mail-preconnect]')) {
      const link = document.createElement('link'); link.rel = 'preconnect'; link.href = 'https://formsubmit.co'; link.dataset.mailPreconnect = ''; document.head.append(link);
    }
    void document.fonts.load('21px "Caveat"', 'Hello there').catch(() => {});
    if (!document.documentElement.lang.startsWith('zh')) return;
    fontSheet ??= new Promise<void>(resolve => { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/fonts/letter/wenkai.css'; link.onload = link.onerror = () => resolve(); document.head.append(link); });
    void fontSheet.then(() => document.fonts.load('21px "LXGW WenKai TC"', '邮箱微信手机号想聊什么写在这里')).catch(() => {});
  }
  launcher.addEventListener('pointerenter', warm, { once: true }); launcher.addEventListener('pointerdown', warm, { once: true }); launcher.addEventListener('focus', warm, { once: true });
  launcher.addEventListener('click', event => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); void openLetter(); });
  dialog.querySelectorAll('[data-close-message]').forEach(close => close.addEventListener('click', () => { void closeLetter(); }));
  dialog.addEventListener('cancel', event => { event.preventDefault(); void closeLetter(); });
  dialog.addEventListener('click', event => { if (event.target === dialog || event.target === scene) void closeLetter(); });
  dialog.addEventListener('close', () => {
    ++epoch; closing = false; cancelMotion(); resetPose(); unlockScene();
    sheet.hidden = true; sheet.inert = true; object.append(sheet); envelope.dataset.open = 'false'; envelope.setAttribute('aria-hidden', 'true'); iconSlot.append(envelope);
    pending.hidden = true; thanks.hidden = true; phase('closed'); document.body.style.overflow = previousOverflow; launcher.focus({ preventScroll: true });
    if (deliveryState === 'sent' && receiptSeen) { deliveryState = 'idle'; receiptSeen = false; }
  });
  for (const field of [contact, message]) field.addEventListener('input', () => field.setCustomValidity(''));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || outgoing || deliveryState === 'sent') return;
    contact.value = contact.value.trim().replace(/^(?:微信|wechat|电话|手机(?:号)?|phone|邮箱|e-?mail)(?:\s*[/、]\s*(?:微信|wechat|电话|手机(?:号)?|phone|邮箱|e-?mail))*\s*[:：]\s*/i, '');
    for (const field of [contact, message]) { field.value = field.value.trim(); field.setCustomValidity(field.value ? '' : form.dataset.required!); }
    if (!form.reportValidity()) return;
    const payload = new FormData(form); payload.delete('attachment');
    attachments.forEach((item, i) => payload.append(i ? `attachment_${i + 1}` : 'attachment', item.file, item.file.name));
    const email = document.createElement('input'); email.type = 'email'; email.value = contact.value;
    if (email.checkValidity()) { payload.set('email', contact.value); payload.set('_replyto', contact.value); }
    updateEmailDraft(); setBusy(true); deliveryState = 'pending'; status.hidden = true; errorEmail.hidden = true; pendingStatus.textContent = form.dataset.waiting!;
    activeRequest = new AbortController();
    const slow = setTimeout(() => { if (deliveryState === 'pending') pendingStatus.textContent = form.dataset.slow!; }, 4000);
    void departLetter();
    try {
      await deliverLetter(payload, form.dataset.endpoint!, activeRequest.signal, form.dataset.recipient!);
      deliveryState = 'sent';
      if (!dialog.open) { form.reset(); clearAttachments(); }
    } catch (error) {
      deliveryState = 'error';
      const kind = error instanceof DeliveryError ? error.kind : 'unconfirmed';
      failureMessage = kind === 'timeout' ? form.dataset.timeout! : kind === 'offline' ? form.dataset.offline! : kind === 'cancelled' ? form.dataset.cancelled! : form.dataset.error!;
    } finally {
      clearTimeout(slow); activeRequest = undefined; setBusy(false); settle();
    }
  });
}

setupLetter();
