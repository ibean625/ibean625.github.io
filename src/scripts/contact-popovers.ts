for (const popover of document.querySelectorAll<HTMLElement>('[data-contact-popover]')) {
  const trigger = document.querySelector<HTMLButtonElement>(`[popovertarget="${popover.id}"]`);
  const copyButton = popover.querySelector<HTMLButtonElement>('.contact-copy');

  if (trigger && popover && copyButton) {
    let reset: ReturnType<typeof setTimeout> | undefined;
    const position = () => {
      if (!popover.matches(':popover-open')) return;
      const anchor = trigger.getBoundingClientRect();
      const left = Math.max(20, Math.min(anchor.left, innerWidth - popover.offsetWidth - 20));
      const below = anchor.bottom + 8;
      const preferredTop = below + popover.offsetHeight <= innerHeight - 12 ? below : anchor.top - popover.offsetHeight - 8;
      const top = Math.max(12, Math.min(preferredTop, innerHeight - popover.offsetHeight - 12));
      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
    };
    popover.addEventListener('toggle', () => {
      position();
      if (!popover.matches(':popover-open')) {
        clearTimeout(reset);
        copyButton.textContent = copyButton.dataset.default ?? '';
      }
    });
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, { passive: true });
    copyButton.addEventListener('click', async () => {
      clearTimeout(reset);
      try {
        await navigator.clipboard.writeText(copyButton.dataset.value ?? '');
        copyButton.textContent = copyButton.dataset.copied ?? '';
      } catch {
        copyButton.textContent = copyButton.dataset.fallback ?? '';
        const number = popover.querySelector('.contact-value');
        if (number) {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(number);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
      position();
      reset = setTimeout(() => { copyButton.textContent = copyButton.dataset.default ?? ''; }, 2500);
    });
  }
}

export {};
