type PublicationMediaSource = { title: string; image: string; video?: string; alt: string };

export function setupPublicationMedia() {
  const dialogElement = document.querySelector<HTMLDialogElement>('#media-dialog');
  const titleElement = document.querySelector<HTMLElement>('#media-dialog-title');
  const imageElement = document.querySelector<HTMLImageElement>('#media-dialog-image');
  const playerElement = document.querySelector<HTMLVideoElement>('#media-dialog-video');
  const originalElement = document.querySelector<HTMLAnchorElement>('#media-original');
  const errorElement = document.querySelector<HTMLElement>('[data-media-error]');
  if (!dialogElement || !titleElement || !imageElement || !playerElement || !originalElement || !errorElement) return;
  const dialog = dialogElement;
  const title = titleElement;
  const image = imageElement;
  const player = playerElement;
  const original = originalElement;
  const errorMessage = errorElement;
  const panel = dialog.querySelector<HTMLElement>('.media-dialog-panel')!;
  const flightLayer = dialog.querySelector<HTMLElement>('.media-flight-layer')!;

  const mediaElements = [...document.querySelectorAll<HTMLElement>('[data-paper-media]')];
  const requested = new WeakSet<HTMLElement>();
  const previewVersion = new WeakMap<HTMLElement, number>();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
  let active: PublicationMediaSource | undefined;
  let returnFocus: HTMLElement | undefined;
  let previousOverflow = '';
  let thumbnail: HTMLImageElement | undefined;
  let thumbnailVisibility = '';
  let flyingImage: HTMLImageElement | undefined;
  let transition = 0;
  const motions = new Set<Animation>();

  function stopMotion(preserve = false) {
    if (preserve) motions.forEach(animation => { try { animation.commitStyles(); } catch {} });
    motions.forEach(animation => animation.cancel());
    motions.clear();
  }
  async function move(element: HTMLElement, frames: Keyframe[], duration: number, token: number, delay = 0, easing = 'cubic-bezier(.22,.72,.3,1)') {
    if (token !== transition || !dialog.open) return;
    if (reduceMotion.matches) {
      const last = frames.at(-1)!;
      if (last.opacity !== undefined) element.style.opacity = String(last.opacity);
      if (last.transform !== undefined) element.style.transform = String(last.transform);
      return;
    }
    let animation: Animation;
    try { animation = element.animate(frames, { duration, delay, fill: 'both', easing }); }
    catch {
      const last = frames.at(-1)!;
      if (last.opacity !== undefined) element.style.opacity = String(last.opacity);
      if (last.transform !== undefined) element.style.transform = String(last.transform);
      return;
    }
    motions.add(animation);
    let watchdog: ReturnType<typeof setTimeout>;
    try {
      await Promise.race([animation.finished.catch(() => {}), new Promise<void>(resolve => { watchdog = setTimeout(resolve, duration + delay + 180); })]);
      if (token !== transition || !dialog.open) return;
      const last = frames.at(-1)!;
      if (last.opacity !== undefined) element.style.opacity = String(last.opacity);
      if (last.transform !== undefined) element.style.transform = String(last.transform);
    } finally { clearTimeout(watchdog!); motions.delete(animation); animation.cancel(); }
  }
  function paintedBox(element: HTMLImageElement) {
    const rect = element.getBoundingClientRect();
    const source = element === image && thumbnail?.naturalWidth ? thumbnail : element;
    const width = source.naturalWidth || source.width || rect.width;
    const height = source.naturalHeight || source.height || rect.height;
    const scale = Math.min(rect.width / width, rect.height / height);
    return { left: rect.left + (rect.width - width * scale) / 2, top: rect.top + (rect.height - height * scale) / 2, width: width * scale, height: height * scale };
  }
  function makeFlight(box: ReturnType<typeof paintedBox>) {
    flyingImage?.remove();
    const flight = document.createElement('img');
    flight.src = active!.image;
    flight.alt = '';
    flight.decoding = 'async';
    flight.className = 'media-flight-image';
    Object.assign(flight.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    flightLayer.append(flight);
    flyingImage = flight;
    return flight;
  }
  function imageFrames(from: ReturnType<typeof paintedBox>, to: ReturnType<typeof paintedBox>, base: ReturnType<typeof paintedBox>, returning = false): Keyframe[] {
    if ([from.width, from.height, to.width, to.height, base.width, base.height].some(value => !Number.isFinite(value) || value <= 0)) return [{ opacity: 1 }, { opacity: 0 }];
    const fromX = from.left + from.width / 2;
    const fromY = from.top + from.height / 2;
    const toX = to.left + to.width / 2;
    const toY = to.top + to.height / 2;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy) || 1;
    const bend = Math.min(30, distance * .06) * (returning ? -1 : 1);
    // A damped approach with a tangent-matched soft stop. Logarithmic scale
    // keeps the perceived zoom speed even for very different image sizes.
    const normalized = (t: number) => (1 - (1 + 3 * t) * Math.exp(-3 * t)) / (1 - 4 * Math.exp(-3));
    const settleAt = .76;
    const settled = normalized(settleAt);
    const tangent = 9 * settleAt * Math.exp(-3 * settleAt) / (1 - 4 * Math.exp(-3)) * (1 - settleAt);
    const response = (t: number) => {
      if (t <= settleAt) return normalized(t);
      const u = (t - settleAt) / (1 - settleAt);
      return (2 * u ** 3 - 3 * u ** 2 + 1) * settled + (u ** 3 - 2 * u ** 2 + u) * tangent + (-2 * u ** 3 + 3 * u ** 2);
    };
    return Array.from({ length: 61 }, (_, index) => {
      const t = index / 60;
      const progress = index === 60 ? 1 : response(t);
      const arc = 4 * progress * (1 - progress) * bend;
      const x = fromX + dx * progress - dy / distance * arc;
      const y = fromY + dy * progress + dx / distance * arc;
      const scaleX = Math.exp(Math.log(from.width / base.width) * (1 - progress) + Math.log(to.width / base.width) * progress);
      const scaleY = Math.exp(Math.log(from.height / base.height) * (1 - progress) + Math.log(to.height / base.height) * progress);
      return { offset: t, transform: `translate3d(${x - base.left - base.width / 2}px,${y - base.top - base.height / 2}px,0) scale(${scaleX},${scaleY})` };
    });
  }
  function hideThumbnail() {
    if (thumbnail) thumbnail.style.visibility = 'hidden';
  }
  function restoreThumbnail() {
    if (thumbnail) thumbnail.style.visibility = thumbnailVisibility;
  }


  function clearVideo(video: HTMLVideoElement) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  function stopPreview(media: HTMLElement) {
    previewVersion.set(media, (previewVersion.get(media) ?? 0) + 1);
    requested.delete(media);
    delete media.dataset.previewing;
    const video = media.querySelector<HTMLVideoElement>('.thumbnail-video');
    if (video?.hasAttribute('src')) clearVideo(video);
  }

  const stopPreviews = () => mediaElements.forEach(stopPreview);

  function startPreview(media: HTMLElement) {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!hoverPointer.matches || reduceMotion.matches || saveData || dialog!.open) return;
    const video = media.querySelector<HTMLVideoElement>('.thumbnail-video');
    const src = media.dataset.video;
    if (!video || !src) return;
    const version = (previewVersion.get(media) ?? 0) + 1;
    previewVersion.set(media, version);
    requested.add(media);
    video.muted = true;
    video.src = src;
    void video.play().catch(() => {
      if (previewVersion.get(media) === version) stopPreview(media);
    });
  }

  for (const media of mediaElements) {
    media.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') startPreview(media);
    });
    media.addEventListener('pointerleave', () => stopPreview(media));
    const video = media.querySelector<HTMLVideoElement>('.thumbnail-video');
    video?.addEventListener('playing', () => {
      if (requested.has(media) && !dialog!.open) media.dataset.previewing = 'true';
      else stopPreview(media);
    });
    video?.addEventListener('error', () => stopPreview(media));
  }

  function showMode(mode: 'figure' | 'video') {
    if (!active) return;
    const isVideo = mode === 'video' && !!active.video;
    errorMessage!.hidden = true;
    image!.hidden = isVideo;
    player!.hidden = !isVideo;
    dialog!.dataset.mode = isVideo ? 'video' : 'figure';
    original!.href = isVideo ? active.video! : active.image;
    dialog!.querySelectorAll<HTMLButtonElement>('[data-media-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.mediaMode === (isVideo ? 'video' : 'figure')));
      if (button.dataset.mediaMode === 'video') button.hidden = !active!.video;
    });
    if (isVideo) {
      player!.src = active.video!;
      player!.poster = active.image;
      void player!.play().catch(() => {
        // Browser autoplay restrictions can require a second explicit press on
        // the native controls. Only a real media error needs the fallback text.
        if (player!.error) errorMessage!.hidden = false;
      });
    } else {
      clearVideo(player!);
      image!.src = active.image;
      image!.alt = active.alt;
    }
  }

  async function openMedia(trigger: HTMLElement, mode: 'figure' | 'video') {
    if (dialog.open) return;
    const paper = trigger.closest('.publication');
    const media = paper?.querySelector<HTMLElement>('[data-paper-media]');
    if (!media?.dataset.image) return;
    stopPreviews();
    active = { title: media.dataset.title ?? '', image: media.dataset.image, video: media.dataset.video, alt: media.querySelector('img')?.alt ?? '' };
    thumbnail = media.querySelector<HTMLImageElement>('img') ?? undefined;
    thumbnailVisibility = thumbnail?.style.visibility ?? '';
    const from = thumbnail ? paintedBox(thumbnail) : undefined;
    returnFocus = trigger;
    title.textContent = active.title;
    if (thumbnail?.naturalWidth) { image.width = thumbnail.naturalWidth; image.height = thumbnail.naturalHeight; }
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const token = ++transition;
    dialog.dataset.state = 'opening';
    panel.inert = true;
    panel.style.opacity = '0';
    dialog.showModal();
    showMode(mode);
    if (mode === 'figure' && from && from.width > 0 && from.height > 0 && !reduceMotion.matches) {
      const to = paintedBox(image);
      const flight = makeFlight(to);
      image.style.visibility = 'hidden';
      hideThumbnail();
      await Promise.all([
        move(flight, imageFrames(from, to, to), 860, token, 0, 'linear'),
        move(panel, [{ opacity: 0 }, { opacity: 1 }], 360, token, 280),
      ]);
    } else {
      await move(panel, [{ opacity: 0, transform: 'translateY(8px) scale(.985)' }, { opacity: 1, transform: 'none' }], 280, token);
    }
    if (token !== transition || !dialog.open) return;
    image.style.removeProperty('visibility');
    flyingImage?.remove(); flyingImage = undefined;
    panel.style.opacity = '1'; panel.inert = false;
    dialog.dataset.state = 'open';
    dialog.querySelector<HTMLButtonElement>('[data-close-media]')?.focus({ preventScroll: true });
  }

  async function closeMedia() {
    if (!dialog.open || dialog.dataset.state === 'closing') return;
    const currentFlight = flyingImage?.getBoundingClientRect();
    const startOpacity = getComputedStyle(panel).opacity;
    const token = ++transition;
    stopMotion(true);
    dialog.dataset.state = 'closing';
    panel.inert = true;
    player.pause();
    if (dialog.dataset.mode === 'figure' && thumbnail?.isConnected && !reduceMotion.matches) {
      const from = currentFlight ?? paintedBox(image);
      const to = paintedBox(thumbnail);
      const flight = makeFlight(from);
      image.style.visibility = 'hidden'; hideThumbnail();
      await Promise.all([
        move(flight, imageFrames(from, to, from, true), 740, token, 0, 'linear'),
        move(panel, [{ opacity: startOpacity }, { opacity: 0 }], 180, token),
      ]);
    } else {
      await move(panel, [{ opacity: startOpacity, transform: 'none' }, { opacity: 0, transform: 'translateY(8px) scale(.985)' }], 240, token);
    }
    if (token === transition && dialog.open) dialog.close();
  }

  document.querySelectorAll<HTMLAnchorElement>('[data-open-figure], [data-open-video]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      // Preserve the normal browser behavior for opening an original file in a
      // new tab, and keep the links useful when JavaScript is unavailable.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      void openMedia(trigger, trigger.hasAttribute('data-open-video') ? 'video' : 'figure');
    });
  });
  dialog.querySelector('[data-close-media]')?.addEventListener('click', () => { void closeMedia(); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); void closeMedia(); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) void closeMedia();
  });
  dialog.querySelectorAll<HTMLButtonElement>('[data-media-mode]').forEach(button => {
    button.addEventListener('click', () => { if (dialog.dataset.state === 'open') showMode(button.dataset.mediaMode === 'video' ? 'video' : 'figure'); });
  });
  player.addEventListener('error', () => {
    if (dialog.open && dialog.dataset.mode === 'video') errorMessage.hidden = false;
  });
  dialog.addEventListener('close', () => {
    ++transition; stopMotion(); restoreThumbnail();
    flyingImage?.remove(); flyingImage = undefined;
    image.style.removeProperty('visibility'); panel.style.removeProperty('opacity'); panel.style.removeProperty('transform'); panel.inert = false;
    dialog.dataset.state = 'closed';
    clearVideo(player);
    player.hidden = true;
    image.hidden = true;
    image.removeAttribute('src');
    errorMessage.hidden = true;
    document.body.style.overflow = previousOverflow;
    active = undefined; thumbnail = undefined;
    returnFocus?.focus({ preventScroll: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopPreviews();
      player.pause();
    } else {
      motions.forEach(animation => { try { animation.finish(); } catch {} });
    }
  });
  window.addEventListener('blur', stopPreviews);
  reduceMotion.addEventListener('change', () => { stopPreviews(); if (reduceMotion.matches) motions.forEach(animation => { try { animation.finish(); } catch {} }); });
  window.addEventListener('resize', () => motions.forEach(animation => { try { animation.finish(); } catch {} }));
  hoverPointer.addEventListener('change', stopPreviews);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (!entry.isIntersecting) stopPreview(entry.target as HTMLElement); });
  });
  mediaElements.forEach(media => observer.observe(media));
}

setupPublicationMedia();
