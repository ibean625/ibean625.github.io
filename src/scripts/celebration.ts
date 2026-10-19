/** A few translucent heart bubbles drift quietly above the thank-you card. */
export function celebrateLetter(container: HTMLElement, card: HTMLElement, reducedMotion: MediaQueryList): () => void {
  if (reducedMotion.matches || document.hidden) return () => {};
  const layer = document.createElement('div');
  layer.className = 'letter-celebration';
  layer.setAttribute('aria-hidden', 'true');
  container.append(layer);
  const rect = card.getBoundingClientRect();
  const animations: Animation[] = [];
  const count = innerWidth < 600 ? 7 : 9;
  let stopped = false;
  let watchdog: ReturnType<typeof setTimeout>;
  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(watchdog);
    animations.forEach(animation => animation.cancel());
    layer.remove();
    document.removeEventListener('visibilitychange', hide);
    window.removeEventListener('resize', cleanup);
    reducedMotion.removeEventListener('change', cleanup);
  };
  const hide = () => { if (document.hidden) cleanup(); };
  document.addEventListener('visibilitychange', hide);
  window.addEventListener('resize', cleanup);
  reducedMotion.addEventListener('change', cleanup);

  for (let i = 0; i < count; i++) {
    const bubble = document.createElement('span');
    bubble.className = 'letter-heart-bubble';
    bubble.dataset.heartBubble = '';
    const size = 25 + Math.random() * 13;
    const x = rect.left + rect.width * (.08 + .84 * i / (count - 1)) + (Math.random() - .5) * 14;
    const y = rect.top + 12 + Math.random() * 24;
    Object.assign(bubble.style, {
      left: `${Math.max(8, Math.min(innerWidth - size - 8, x - size / 2))}px`,
      top: `${y}px`, width: `${size}px`, height: `${size}px`,
    });
    const heart = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    heart.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 20S3 14.5 3 8.5a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1C21 14.5 12 20 12 20Z');
    heart.append(path); bubble.append(heart); layer.append(bubble);
    const drift = (Math.random() - .5) * 28;
    const rise = 115 + Math.random() * 55;
    const turn = (Math.random() - .5) * 14;
    const animation = bubble.animate([
      { transform: 'translate3d(0,0,0) scale(.88)', opacity: 0 },
      { transform: `translate3d(${drift * .2}px,${-rise * .22}px,0) rotate(${turn * .3}deg) scale(.98)`, opacity: .5, offset: .24 },
      { transform: `translate3d(${drift * .7}px,${-rise * .7}px,0) rotate(${turn}deg) scale(1.04)`, opacity: .4, offset: .72 },
      { transform: `translate3d(${drift}px,${-rise}px,0) rotate(${turn * .7}deg) scale(1.08)`, opacity: 0 },
    ], { duration: 2800 + Math.random() * 650, delay: i * 100, easing: 'linear', fill: 'both' });
    animations.push(animation);
  }
  watchdog = setTimeout(cleanup, 4300);
  void Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(cleanup);
  return cleanup;
}
