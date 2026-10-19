type PublicationMediaSource = { title: string; image: string; video?: string; alt: string };

export function setupPublicationMedia() {
  const dialog = document.querySelector<HTMLDialogElement>('#media-dialog');
  const title = document.querySelector<HTMLElement>('#media-dialog-title');
  const image = document.querySelector<HTMLImageElement>('#media-dialog-image');
  const player = document.querySelector<HTMLVideoElement>('#media-dialog-video');
  const original = document.querySelector<HTMLAnchorElement>('#media-original');
  const errorMessage = document.querySelector<HTMLElement>('[data-media-error]');
  if (!dialog || !title || !image || !player || !original || !errorMessage) return;

  const mediaElements = [...document.querySelectorAll<HTMLElement>('[data-paper-media]')];
  const requested = new WeakSet<HTMLElement>();
  const previewVersion = new WeakMap<HTMLElement, number>();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
  let active: PublicationMediaSource | undefined;
  let returnFocus: HTMLElement | undefined;
  let previousOverflow = '';

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

  function openMedia(trigger: HTMLElement, mode: 'figure' | 'video') {
    const paper = trigger.closest('.publication');
    const media = paper?.querySelector<HTMLElement>('[data-paper-media]');
    if (!media?.dataset.image) return;
    stopPreviews();
    active = {
      title: media.dataset.title ?? '',
      image: media.dataset.image,
      video: media.dataset.video,
      alt: media.querySelector('img')?.alt ?? '',
    };
    returnFocus = trigger;
    title!.textContent = active.title;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog!.showModal();
    showMode(mode);
  }

  document.querySelectorAll<HTMLAnchorElement>('[data-open-figure], [data-open-video]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      // Preserve the normal browser behavior for opening an original file in a
      // new tab, and keep the links useful when JavaScript is unavailable.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openMedia(trigger, trigger.hasAttribute('data-open-video') ? 'video' : 'figure');
    });
  });
  dialog.querySelector('[data-close-media]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.querySelectorAll<HTMLButtonElement>('[data-media-mode]').forEach(button => {
    button.addEventListener('click', () => showMode(button.dataset.mediaMode === 'video' ? 'video' : 'figure'));
  });
  player.addEventListener('error', () => {
    if (dialog.open && dialog.dataset.mode === 'video') errorMessage.hidden = false;
  });
  dialog.addEventListener('close', () => {
    clearVideo(player);
    player.hidden = true;
    image.hidden = true;
    image.removeAttribute('src');
    errorMessage.hidden = true;
    document.body.style.overflow = previousOverflow;
    active = undefined;
    returnFocus?.focus({ preventScroll: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopPreviews();
      player.pause();
    }
  });
  window.addEventListener('blur', stopPreviews);
  reduceMotion.addEventListener('change', stopPreviews);
  hoverPointer.addEventListener('change', stopPreviews);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (!entry.isIntersecting) stopPreview(entry.target as HTMLElement); });
  });
  mediaElements.forEach(media => observer.observe(media));
}

setupPublicationMedia();
