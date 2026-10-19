type Spark = { angle: number; speed: number; life: number; size: number; color: string };

/** Three bright, silent fireworks around the receipt; its text stays clear. */
export function celebrateLetter(container: HTMLElement, card: HTMLElement, reducedMotion: MediaQueryList): () => void {
  if (reducedMotion.matches || document.hidden) return () => {};
  const layer = document.createElement('div');
  layer.className = 'letter-celebration';
  layer.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  canvas.className = 'letter-fireworks';
  canvas.dataset.fireworks = '';
  layer.append(canvas); container.append(layer);
  const owner = container.closest<HTMLElement>('.message-dialog');
  const context = canvas.getContext('2d');
  if (!context) { layer.remove(); return () => {}; }
  if (owner) owner.dataset.celebrating = 'true';
  const width = innerWidth;
  const height = innerHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  context.scale(ratio, ratio);
  const rect = card.getBoundingClientRect();
  const mobile = width < 600;
  const top = Math.max(65, Math.min(height * .18, rect.top - 100));
  const palette = ['#ffc45b', '#4de4ff', '#ff74b7', '#b49cff'];
  const burstPositions = mobile
    ? [{ x: width * .22, y: top, at: .35 }, { x: width * .78, y: top + 28, at: .85 }, { x: width * .5, y: Math.max(65, top - 26), at: 1.3 }]
    : [{ x: Math.max(120, rect.left - 70), y: height * .35, at: .35 }, { x: Math.min(width - 120, rect.right + 70), y: height * .28, at: .85 }, { x: width * .5, y: Math.max(95, rect.top - 80), at: 1.3 }];
  const bursts = burstPositions.map((position, index) => ({
    ...position,
    color: palette[index],
    sparks: Array.from({ length: mobile ? 72 : 90 }, (_, i): Spark => ({
      angle: i / (mobile ? 72 : 90) * Math.PI * 2 + (Math.random() - .5) * .07,
      speed: (mobile ? 235 : 275) * (.65 + Math.random() * .45),
      life: 1.3 + Math.random() * .5,
      size: 1.6 + Math.random() * 1.3,
      color: i % 5 === 0 ? '#fff5d9' : palette[(index + (i % 7 === 0 ? 1 : 0)) % palette.length],
    })),
  }));
  let frame = 0;
  let stopped = false;
  const start = performance.now();
  const cleanup = () => {
    if (stopped) return;
    stopped = true; cancelAnimationFrame(frame); clearTimeout(watchdog); layer.remove();
    canvas.width = 0; canvas.height = 0;
    if (owner) delete owner.dataset.celebrating;
    document.removeEventListener('visibilitychange', hide);
    window.removeEventListener('resize', cleanup);
    reducedMotion.removeEventListener('change', cleanup);
  };
  const hide = () => { if (document.hidden) cleanup(); };
  const watchdog = setTimeout(cleanup, 3600);
  document.addEventListener('visibilitychange', hide);
  window.addEventListener('resize', cleanup);
  reducedMotion.addEventListener('change', cleanup);
  function position(spark: Spark, age: number) {
    const travel = (1 - Math.exp(-1.6 * age)) / 1.6;
    return { x: Math.cos(spark.angle) * spark.speed * travel, y: Math.sin(spark.angle) * spark.speed * travel + 34 * age * age };
  }
  function draw(now: number) {
    if (stopped) return;
    const time = (now - start) / 1000;
    if (time > 3.25) { cleanup(); return; }
    const ctx = context!;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    // Paint over the backdrop, but leave the entire receipt unobstructed.
    ctx.beginPath(); ctx.rect(0, 0, width, height);
    ctx.rect(rect.left - 8, rect.top - 8, rect.width + 16, rect.height + 16);
    ctx.clip('evenodd');
    ctx.globalCompositeOperation = 'lighter';
    for (const burst of bursts) {
      const age = time - burst.at;
      if (age < 0 && age > -.35) {
        const progress = (age + .35) / .35;
        const launchY = height + 20;
        const y = launchY + (burst.y - launchY) * progress;
        ctx.globalAlpha = .85;
        ctx.strokeStyle = burst.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(burst.x, y + 28); ctx.lineTo(burst.x, y); ctx.stroke();
        continue;
      }
      if (age < 0) continue;
      if (age < .25) {
        const glow = ctx.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, 26);
        glow.addColorStop(0, '#fff9db'); glow.addColorStop(.2, burst.color); glow.addColorStop(1, 'transparent');
        ctx.globalAlpha = (1 - age / .25) * .9; ctx.fillStyle = glow;
        ctx.fillRect(burst.x - 26, burst.y - 26, 52, 52);
      }
      for (const spark of burst.sparks) {
        if (age >= spark.life) continue;
        const current = position(spark, age);
        const tail = position(spark, Math.max(0, age - .16));
        const alpha = Math.pow(1 - age / spark.life, .9);
        ctx.globalAlpha = alpha * .95; ctx.strokeStyle = spark.color; ctx.lineWidth = spark.size;
        ctx.shadowColor = spark.color; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.moveTo(burst.x + tail.x, burst.y + tail.y); ctx.lineTo(burst.x + current.x, burst.y + current.y); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = alpha; ctx.fillStyle = '#fff7dc';
        ctx.beginPath(); ctx.arc(burst.x + current.x, burst.y + current.y, spark.size * .72, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return cleanup;
}
