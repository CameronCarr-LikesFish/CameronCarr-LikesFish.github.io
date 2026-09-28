/* starfield.js: generative background.
   Stars are drawn in code from a fixed seed, so the sky is the same on every
   visit. The zoom depth drives the look:
   - Zoomed out (the future): the widest sky, dense with small, cool stars.
   - Zoomed in (the past): the sky pulls in close. Fewer, larger, warmer stars
     and a soft glow, like being indoors at night. */

const Starfield = (function () {
  "use strict";

  const SEED = 20260927;
  const MAX_DEPTH = typeof ERAS !== "undefined" ? ERAS.length - 1 : 3;

  // Three layers for parallax. Near layers spread faster as you zoom in.
  // density = stars per pixel of screen area at the widest zoom.
  const LAYERS = [
    { density: 0.00050, spread: 1.20, size: [0.35, 0.9] },
    { density: 0.00020, spread: 1.45, size: [0.6, 1.3] },
    { density: 0.00006, spread: 1.85, size: [0.9, 1.9] },
  ];

  // Sky colors at the widest zoom (future) and the closest (past).
  const SKY = {
    future: { top: [3, 5, 14], bottom: [10, 15, 34] },
    past:   { top: [16, 10, 24], bottom: [40, 24, 40] },
  };
  const STAR_COOL = [214, 224, 255];
  const STAR_WARM = [255, 212, 196];
  const GLOW = [227, 169, 179];   // the rose accent

  let canvas = null;
  let ctx = null;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let stars = [];
  let nebulae = [];
  let depth = 0;
  let still = false;            // true when the visitor prefers reduced motion
  let raf = 0;
  let lastFrame = 0;
  let dirty = false;
  let glowSprite = null;

  // Small, fast, seeded random number generator (mulberry32).
  function seeded(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (c1, c2, t) => c1.map((v, i) => Math.round(lerp(v, c2[i], t)));
  const rgb = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

  function build() {
    const rand = seeded(SEED);
    stars = [];
    LAYERS.forEach((layer, li) => {
      const n = Math.round(w * h * layer.density);
      for (let i = 0; i < n; i++) {
        stars.push({
          x: rand() - 0.5,            // position at the widest zoom, as a
          y: rand() - 0.5,            // fraction of the screen from center
          layer: li,
          r: lerp(layer.size[0], layer.size[1], rand()),
          alpha: lerp(0.35, 0.9, rand()),
          warmth: rand(),
          phase: rand() * Math.PI * 2,
          speed: lerp(0.2, 0.7, rand()),
          bright: rand() < 0.035,
        });
      }
    });

    // A few very faint clouds of color, attached to the far layer.
    nebulae = [
      { x: -0.28, y: -0.22, r: 0.45, color: [120, 90, 170], a: 0.07 },
      { x: 0.3, y: 0.18, r: 0.4, color: GLOW, a: 0.05 },
      { x: 0.05, y: 0.35, r: 0.5, color: [60, 90, 160], a: 0.06 },
    ];

    // Pre-rendered soft glow for the brightest stars.
    glowSprite = document.createElement("canvas");
    glowSprite.width = glowSprite.height = 32;
    const g = glowSprite.getContext("2d");
    const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,255,255,0.9)");
    grad.addColorStop(0.2, "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    draw(performance.now());
  }

  function draw(now) {
    const t = Math.min(1, Math.max(0, depth / MAX_DEPTH)); // 0 future, 1 past
    const cx = w / 2;
    const cy = h / 2;

    // Sky gradient, cooler and darker toward the future.
    const top = mix(SKY.future.top, SKY.past.top, t);
    const bottom = mix(SKY.future.bottom, SKY.past.bottom, t);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, rgb(top, 1));
    sky.addColorStop(1, rgb(bottom, 1));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Nebulae drift with the far layer.
    const farScale = Math.pow(LAYERS[0].spread, depth);
    nebulae.forEach((n) => {
      const x = cx + n.x * w * farScale;
      const y = cy + n.y * h * farScale;
      const r = n.r * Math.max(w, h) * farScale;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, rgb(n.color, n.a * (1 - t * 0.5)));
      grad.addColorStop(1, rgb(n.color, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    // A close, warm glow that grows toward the past.
    if (t > 0) {
      const r = Math.max(w, h) * 0.7;
      const glow = ctx.createRadialGradient(cx, cy * 1.1, 0, cx, cy * 1.1, r);
      glow.addColorStop(0, rgb(GLOW, 0.1 * t));
      glow.addColorStop(1, rgb(GLOW, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }

    // Stars.
    const scales = LAYERS.map((l) => Math.pow(l.spread, depth));
    const time = now / 1000;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const k = scales[s.layer];
      const x = cx + s.x * w * k;
      const y = cy + s.y * h * k;
      if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;

      // Stars grow a little as they come closer.
      const r = s.r * Math.pow(k, 0.35);
      const twinkle = still ? 1 : 0.85 + 0.15 * Math.sin(time * s.speed + s.phase);
      const color = mix(STAR_COOL, STAR_WARM, Math.min(1, t * 0.8 + s.warmth * 0.3));
      const a = s.alpha * twinkle;

      if (s.bright) {
        const g = r * 7;
        ctx.globalAlpha = a * 0.6;
        ctx.drawImage(glowSprite, x - g, y - g, g * 2, g * 2);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = rgb(color, a);
      if (r < 1.1) {
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // The places you zoom through (cosmos.js), over the stars.
    if (typeof Cosmos !== "undefined") Cosmos.draw(ctx, w, h, depth, still ? 0 : now);
  }

  // Redraws right away while the zoom is moving; otherwise a slow twinkle at
  // about 30 frames a second. Skipped for reduced motion.
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!dirty && now - lastFrame < 33) return;
    dirty = false;
    lastFrame = now;
    draw(now);
  }

  function setStill(value) {
    still = value;
    cancelAnimationFrame(raf);
    if (still) draw(performance.now());
    else raf = requestAnimationFrame(loop);
  }

  return {
    // Called once with the <canvas> element. options.zoomFactor must match
    // the eras' zoom factor so the map zooms in step with them.
    init(el, options = {}) {
      canvas = el;
      if (typeof Cosmos !== "undefined") Cosmos.configure({ zoomFactor: options.zoomFactor, maxDepth: MAX_DEPTH });
      ctx = canvas.getContext("2d");
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      still = motion.matches;
      motion.addEventListener?.("change", (e) => setStill(e.matches));
      window.addEventListener("resize", resize);
      resize();
      setStill(still);
    },
    // Called every animation frame with the continuous zoom depth
    // (0 = Future, outermost; MAX_DEPTH = Personal, innermost).
    setDepth(z) {
      if (z === depth) return;
      depth = z;
      dirty = true;
      if (still && ctx) draw(performance.now());
    },
  };
})();
