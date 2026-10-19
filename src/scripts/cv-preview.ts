type CvLanguage = 'en' | 'zh';
type CvSource = { image: string; pdf: string; width: number; height: number };

function setupCvPreview() {
  const dialog = document.querySelector<HTMLDialogElement>('#cv-dialog');
  const image = document.querySelector<HTMLImageElement>('#cv-page');
  const scroll = document.querySelector<HTMLElement>('.cv-scroll');
  const status = document.querySelector<HTMLElement>('[data-cv-status]');
  const original = document.querySelector<HTMLAnchorElement>('[data-cv-original]');
  const scale = document.querySelector<HTMLElement>('[data-cv-scale]');
  if (!dialog || !image || !scroll || !status || !original || !scale) return;
  const sources: Record<CvLanguage, CvSource> = JSON.parse(dialog.dataset.cvSources ?? '{}');
  let zoom = 1;
  let returnFocus: HTMLElement | undefined;
  let previousOverflow = '';

  function setZoom(next: number, preservePosition = true) {
    const ratio = next / zoom;
    const left = (scroll!.scrollLeft + scroll!.clientWidth / 2) * ratio - scroll!.clientWidth / 2;
    const top = (scroll!.scrollTop + scroll!.clientHeight / 2) * ratio - scroll!.clientHeight / 2;
    zoom = next;
    image!.style.width = `${zoom * 100}%`;
    scale!.textContent = `${Math.round(zoom * 100)}%`;
    const minus = dialog!.querySelector<HTMLButtonElement>('[data-cv-zoom="out"]');
    const plus = dialog!.querySelector<HTMLButtonElement>('[data-cv-zoom="in"]');
    if (minus) minus.disabled = zoom <= 1;
    if (plus) plus.disabled = zoom >= 3;
    scroll!.scrollLeft = preservePosition ? left : 0;
    scroll!.scrollTop = preservePosition ? top : 0;
  }

  function showLanguage(language: CvLanguage) {
    const source = sources[language];
    if (!source) return;
    dialog!.dataset.cvLanguage = language;
    dialog!.querySelectorAll<HTMLButtonElement>('[data-cv-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.cvLanguage === language));
    });
    image!.hidden = true;
    status!.hidden = false;
    status!.textContent = status!.dataset.loading ?? '';
    scroll!.setAttribute('aria-busy', 'true');
    image!.width = source.width;
    image!.height = source.height;
    image!.alt = language === 'zh' ? '韩晨曦的中文简历' : 'Chenxi Han’s curriculum vitae';
    original!.href = source.pdf;
    setZoom(1, false);
    image!.src = source.image;
  }

  image.addEventListener('load', () => {
    image.hidden = false;
    status.hidden = true;
    scroll.removeAttribute('aria-busy');
  });
  image.addEventListener('error', () => {
    status.textContent = status.dataset.error ?? '';
    status.hidden = false;
    scroll.removeAttribute('aria-busy');
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-open-cv]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      returnFocus = trigger;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      showLanguage(dialog.dataset.defaultLanguage === 'zh' ? 'zh' : 'en');
    });
  });
  dialog.querySelectorAll<HTMLButtonElement>('[data-cv-language]').forEach(button => {
    button.addEventListener('click', () => showLanguage(button.dataset.cvLanguage === 'zh' ? 'zh' : 'en'));
  });
  dialog.querySelectorAll<HTMLButtonElement>('[data-cv-zoom]').forEach(button => {
    button.addEventListener('click', () => {
      setZoom(button.dataset.cvZoom === 'fit' ? 1 : Math.min(3, Math.max(1, zoom + (button.dataset.cvZoom === 'in' ? 0.25 : -0.25))));
    });
  });
  dialog.querySelector('[data-close-cv]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    image.hidden = true;
    document.body.style.overflow = previousOverflow;
    returnFocus?.focus({ preventScroll: true });
  });
}

setupCvPreview();
export {};
