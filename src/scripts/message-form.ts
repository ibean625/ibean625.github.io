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
  const object = dialog.querySelector<HTMLElement>('[data-letter-object]')!;
  const content = sheet.querySelector<HTMLElement>('.letter-content')!;
  const iconSlot = launcher.querySelector<HTMLElement>('.message-launcher-icon')!;

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
  const movingParts = [object, sheet, content, dock, flap, thanks];
  let folded = '';
  let closing = false;
  const applyFrame = (element: Element, frame: Keyframe) => {
    const style = (element as HTMLElement | SVGElement).style;
    if (frame.transform !== undefined) style.transform = String(frame.transform);
    if (frame.opacity !== undefined) style.opacity = String(frame.opacity);
    if (frame.filter !== undefined) style.filter = String(frame.filter);
  };
  const cancelMotion = (preserve = false) => {
    // Preserve the current pose when interrupted, so the return starts here.
    if (preserve) animations.forEach(animation => { try { animation.commitStyles(); } catch {} });
    animations.forEach(animation => animation.cancel());
    animations.clear();
  };
  async function animate(element: Element, keyframes: Keyframe[], duration: number, token: number, delay = 0, easing = 'cubic-bezier(.22,1,.36,1)') {
    if (token !== epoch || !dialog.open) return false;
    if (reducedMotion.matches) { applyFrame(element, keyframes.at(-1)!); return true; }
    const animation = element.animate(keyframes, { duration, delay, easing, fill: 'both' });
    animations.add(animation);
    try {
      await animation.finished;
      if (token !== epoch || !dialog.open) return false;
      applyFrame(element, keyframes.at(-1)!);
      return true;
    } catch { return false; }
    finally { animations.delete(animation); animation.cancel(); }
  }
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) animations.forEach(animation => { try { animation.finish(); } catch {} });
  });
  function resetMotion() {
    movingParts.forEach(part => {
      part.style.removeProperty('transform');
      part.style.removeProperty('opacity');
      part.style.removeProperty('filter');
      part.style.removeProperty('transform-origin');
    });
    object.style.removeProperty('height');
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
    iconSlot.append(envelope);
    resetMotion();
  }
  function foldedTransform() {
    const paper = sheet.getBoundingClientRect();
    const mail = envelope.getBoundingClientRect();
    const scale = mail.width * .88 / paper.width;
    const x = mail.left + mail.width / 2 - paper.left - paper.width * scale / 2;
    const y = mail.bottom - paper.top - paper.height * scale - 8;
    return `translate3d(${x}px,${y}px,0) scale(${scale})`;
  }
  function iconTransform(target: { left: number; top: number; width: number }) {
    const saved = object.style.transform;
    object.style.transform = 'none';
    const bounds = object.getBoundingClientRect();
    const mail = envelope.getBoundingClientRect();
    object.style.transform = saved;
    const scale = target.width / mail.width;
    return `translate3d(${target.left - bounds.left - (mail.left - bounds.left) * scale}px,${target.top - bounds.top - (mail.top - bounds.top) * scale}px,0) scale(${scale})`;
  }
  function showReceipt() {
    phase('sent');
    sheet.hidden = true;
    sheet.inert = true;
    thanks.hidden = false;
    object.style.opacity = '0';
    dialog.setAttribute('aria-labelledby', 'message-thanks-title');
    dialog.setAttribute('aria-describedby', 'message-thanks-description');
    if (dialog.open) { receiptSeen = true; thanks.focus({ preventScroll: true }); }
  }
  async function openLetter() {
    if (dialog.open) return;
    const token = ++epoch;
    closing = false;
    cancelMotion();
    resetMotion();
    const from = envelope.getBoundingClientRect();
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sheet.hidden = false;
    sheet.inert = true;
    thanks.hidden = true;
    envelope.dataset.open = 'true';
    delete envelope.dataset.sealed;
    dock.append(envelope);
    phase('opening');
    dialog.setAttribute('aria-labelledby', 'message-title');
    dialog.setAttribute('aria-describedby', 'message-privacy');
    dialog.showModal();
    if (delivered) { object.style.height = `${object.offsetHeight}px`; showReceipt(); return; }
    // Read geometry once, then let transform/opacity run together on the compositor.
    folded = foldedTransform();
    const start = iconTransform(from);
    const complete = await Promise.all([
      animate(object, [{ transform: `${start} rotate(-5deg)` }, { transform: 'translate3d(-4px,3px,0) rotate(-.6deg)', offset: .78 }, { transform: 'none' }], 760, token),
      animate(flap, [{ transform: 'perspective(900px) rotateX(0deg)' }, { transform: 'perspective(900px) rotateX(-178deg)' }], 500, token, 90),
      animate(sheet, [{ transform: folded, opacity: 0 }, { transform: folded, opacity: 1, offset: .12 }, { transform: 'none', opacity: 1 }], 510, token, 260),
      animate(content, [{ opacity: 0 }, { opacity: 1 }], 300, token, 360),
      animate(dock, [{ opacity: 1 }, { opacity: 1, offset: .25 }, { opacity: 0 }], 310, token, 460),
    ]);
    if (complete.some(result => !result) || token !== epoch) return;
    phase('writing');
    sheet.inert = false;
  }
  async function closeLetter() {
    if (!dialog.open || closing) return;
    const previousPhase = dialog.dataset.phase;
    closing = true;
    const token = ++epoch;
    cancelMotion(true);
    if (delivered || previousPhase === 'sent' || reducedMotion.matches) { dialog.close(); return; }
    phase('closing');
    sheet.inert = true;
    const slot = iconSlot.getBoundingClientRect();
    const target = iconTransform({ left: slot.left + (slot.width - 23) / 2, top: slot.top + (slot.height - 16) / 2, width: 23 });
    await Promise.all([
      animate(object, [{ transform: getComputedStyle(object).transform }, { transform: target }], 420, token, 0, 'cubic-bezier(.4,0,.2,1)'),
      animate(content, [{ opacity: getComputedStyle(content).opacity }, { opacity: 0 }], 140, token),
      animate(sheet, [{ transform: getComputedStyle(sheet).transform, opacity: getComputedStyle(sheet).opacity }, { transform: folded, opacity: 0 }], 320, token),
      animate(dock, [{ opacity: getComputedStyle(dock).opacity }, { opacity: 1 }], 200, token),
      animate(flap, [{ transform: getComputedStyle(flap).transform }, { transform: 'perspective(900px) rotateX(0deg)' }], 300, token, 40),
    ]);
    if (token === epoch && dialog.open) dialog.close();
  }
  let fontSheet: Promise<void> | undefined;
  const warmFonts = () => {
    void document.fonts.load('21px "Caveat"', 'Hello there').catch(() => {});
    if (!document.documentElement.lang.startsWith('zh')) return;
    fontSheet ??= new Promise<void>(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/fonts/letter/wenkai.css';
      link.onload = () => resolve();
      link.onerror = () => resolve();
      document.head.append(link);
    });
    void fontSheet.then(() => document.fonts.load('21px "LXGW WenKai TC"', '邮箱微信手机号想聊什么写在这里')).catch(() => {});
  };
  launcher.addEventListener('pointerenter', warmFonts, { once: true });
  launcher.addEventListener('pointerdown', warmFonts, { once: true });
  launcher.addEventListener('focus', warmFonts, { once: true });
  launcher.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opening = openLetter();
  });
  dialog.querySelectorAll('[data-close-message]').forEach(close => close.addEventListener('click', () => { void closeLetter(); }));
  dialog.addEventListener('cancel', event => { event.preventDefault(); void closeLetter(); });
  dialog.addEventListener('click', event => { if (event.target === dialog || event.target === scene) void closeLetter(); });
  dialog.addEventListener('close', () => {
    ++epoch;
    closing = false;
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
    if (!dialog.open || closing || dialog.dataset.phase === 'sent') return;
    const token = epoch;
    phase('packing');
    sheet.inert = true;
    folded = foldedTransform();
    object.style.height = `${object.offsetHeight}px`;
    object.style.transformOrigin = '50% 75%';
    const mail = envelope.getBoundingClientRect();
    const x = innerWidth - (mail.left + mail.width / 2) + 130;
    const y = -(mail.top + mail.height / 2) - 100;
    const cx = mail.left + mail.width / 2;
    const cy = mail.top + mail.height / 2;
    const wind = dialog.querySelector<SVGSVGElement>('.letter-wind')!;
    wind.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    wind.querySelectorAll('path').forEach((path, index) => {
      const shift = index * 7;
      path.setAttribute('d', `M${cx} ${cy + shift} C${cx - 65} ${cy - 30 + shift},${cx + x * .2} ${cy + y * .38 + shift},${cx + x} ${cy + y}`);
    });
    const flight: Keyframe[] = Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      const px = 3 * (1 - t) ** 2 * t * -65 + 3 * (1 - t) * t ** 2 * x * .2 + t ** 3 * x;
      const py = 3 * (1 - t) ** 2 * t * -30 + 3 * (1 - t) * t ** 2 * y * .38 + t ** 3 * y;
      const turn = Math.sin(t * Math.PI * 2) * 9 - t * 24;
      return { transform: `translate3d(${px}px,${py}px,0) rotate(${turn}deg) scale(${1 - .7 * t})`, opacity: t < .8 ? 1 : (1 - t) * 5, filter: `blur(${Math.sin(t * Math.PI) * .65}px)`, offset: t };
    });
    const flyAt = reducedMotion.matches ? 0 : 700;
    if (!reducedMotion.matches) setTimeout(() => { if (token === epoch && dialog.open) phase('flying'); }, flyAt);
    const paperMotion = animate(sheet, [{ transform: 'none', opacity: 1 }, { opacity: 1, offset: .7 }, { transform: folded, opacity: 0 }], 550, token).then(done => {
      if (!done || token !== epoch) return false;
      sheet.hidden = true;
      form.reset();
      clearAttachments();
      phase('sealing');
      return true;
    });
    envelope.dataset.open = 'false';
    const complete = await Promise.all([
      paperMotion,
      animate(content, [{ opacity: 1 }, { opacity: 0 }], 180, token),
      animate(dock, [{ opacity: 0 }, { opacity: 1 }], 250, token, 80),
      animate(flap, [{ transform: 'perspective(900px) rotateX(-178deg)' }, { transform: 'perspective(900px) rotateX(0deg)' }], 430, token, 350, 'cubic-bezier(.4,0,.2,1)').then(done => {
        if (done && token === epoch) envelope.dataset.sealed = 'true';
        return done;
      }),
      animate(object, flight, 1100, token, flyAt, 'cubic-bezier(.35,0,.6,1)'),
    ]);
    if (complete.every(Boolean) && token === epoch) showReceipt();
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
