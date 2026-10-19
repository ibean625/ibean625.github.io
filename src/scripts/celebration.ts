/** A short, non-blocking burst behind the thank-you card. */
export function celebrateLetter(container: HTMLElement, card: HTMLElement, reducedMotion: MediaQueryList): () => void {
  if (reducedMotion.matches || document.hidden) return () => {};
  const layer = document.createElement('div');
  layer.className = 'letter-celebration';
  layer.setAttribute('aria-hidden', 'true');
  container.append(layer);
  const animations: Animation[] = [];
  const colors = ['#d9aa68', '#82a79a', '#cf94a0', '#769eaf', '#c89575'];
  const rect = card.getBoundingClientRect();
  let stopped = false;
  let timer: ReturnType<typeof setTimeout>;
  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    animations.forEach(animation => animation.cancel());
    layer.remove();
    document.removeEventListener('visibilitychange', hide);
    reducedMotion.removeEventListener('change', cleanup);
  };
  const hide = () => { if (document.hidden) cleanup(); };
  document.addEventListener('visibilitychange', hide);
  reducedMotion.addEventListener('change', cleanup);
  const count = innerWidth < 600 ? 28 : 40;
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1;
    const piece = document.createElement('span');
    piece.className = 'letter-confetti';
    const x = side < 0 ? rect.left + 12 : rect.right - 12;
    const y = rect.top + 24;
    const reach = 30 + Math.random() * Math.min(180, rect.width * .55);
    const lift = 75 + Math.random() * 100;
    const turn = (Math.random() * 360 + 260) * side;
    Object.assign(piece.style, {
      left: `${x}px`, top: `${y}px`, background: colors[i % colors.length],
      width: `${4 + Math.random() * 3}px`, height: `${7 + Math.random() * 7}px`,
      borderRadius: i % 3 ? '1px' : '50%',
    });
    layer.append(piece);
    const animation = piece.animate([
      { transform: 'translate3d(0,0,0) rotate(0deg) rotateY(0deg)', opacity: 0 },
      { transform: `translate3d(${-side * reach * .16}px,${-lift * .5}px,0) rotate(${turn * .2}deg) rotateY(70deg)`, opacity: 1, offset: .15 },
      { transform: `translate3d(${-side * reach * .58}px,${-lift}px,0) rotate(${turn * .5}deg) rotateY(190deg)`, opacity: 1, offset: .45 },
      { transform: `translate3d(${-side * reach}px,${45 + Math.random() * 60}px,0) rotate(${turn}deg) rotateY(390deg)`, opacity: 0 },
    ], { duration: 1700 + Math.random() * 400, delay: Math.floor(i / 2) * 12, easing: 'cubic-bezier(.2,.55,.6,1)', fill: 'both' });
    animations.push(animation);
  }
  // The decoration never participates in the delivery state or blocks clicks.
  timer = setTimeout(cleanup, 2500);
  void Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(cleanup);
  return cleanup;
}
