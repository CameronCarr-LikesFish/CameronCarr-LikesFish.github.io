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
    buildCosmos();
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

    drawCosmos(cx, cy);
  }

  // -------------------------------------------------------------------------
  // The cosmos: a minimal model centred on Earth, drawn under the eras.
  // Each era reveals the next ring of structure, and whatever sits in the
  // middle of the screen always contains the level before it:
  //   Personal: Earth close up
  //   Vanderbilt: Earth and the Moon's orbit
  //   Now: the inner solar system, the Sun off to the left
  //   Future: every planet's orbit, the Kuiper belt, the Oort cloud's haze
  // Units are the screen's shorter side at the innermost era. Distances are
  // compressed (orbit radius ~ sqrt of the real one) so every level fits.
  // -------------------------------------------------------------------------

  let zoomFactor = 3.5;         // set by main.js to match the eras
  const EARTH_R = 0.075;
  const MOON_ORBIT = 0.36;
  const MOON_R = 0.02;
  const SUN_DIST = 3.8;         // Earth to Sun
  // Direction from Earth to the Sun (radians; 0 = right, positive = down).
  // Lower left keeps the Sun clear of the item columns and titles.
  const SUN_ANGLE = (125 * Math.PI) / 180;
  const MOON_ANGLE = (62 * Math.PI) / 180;   // lower right, clear of the items
  const SUN_R = 0.32;
  // Planets: orbit radius in Earth-orbits, dot size in px, colour, angle.
  const PLANETS = [
    { a: 0.62, size: 1.3, color: [200, 190, 180], angle: 2.3 },   // Mercury
    { a: 0.85, size: 1.8, color: [235, 215, 180], angle: 4.1 },   // Venus
    { a: 1.23, size: 1.6, color: [225, 150, 120], angle: 0.9 },   // Mars
    { a: 2.28, size: 2.6, color: [225, 200, 170], angle: 5.2 },   // Jupiter
    { a: 3.09, size: 2.3, color: [230, 210, 160], angle: 1.7 },   // Saturn
    { a: 4.38, size: 2.0, color: [170, 215, 225], angle: 3.4 },   // Uranus
    { a: 5.49, size: 2.0, color: [130, 160, 235], angle: 0.2 },   // Neptune
  ];
  const KUIPER = [6.2, 7.2];    // in Earth-orbits
  const OORT = [9, 14];
  let belt = [];                // seeded dust for the Kuiper belt and Oort cloud

  function buildCosmos() {
    const rand = seeded(SEED + 7);
    belt = [];
    const add = (range, n, alpha) => {
      for (let i = 0; i < n; i++) {
        const r = lerp(range[0], range[1], Math.sqrt(rand()));
        belt.push({ r, angle: rand() * Math.PI * 2, alpha: alpha * lerp(0.4, 1, rand()) });
      }
    };
    add(KUIPER, 260, 0.35);
    add(OORT, 520, 0.22);
  }

  // Fade a line or ring in and out by its size on screen, so each level
  // shows only what reads at that scale.
  function sizeFade(px, unit) {
    const r = px / unit;
    const fadeIn = Math.min(1, Math.max(0, (r - 0.02) / 0.06));
    const fadeOut = 1 - Math.min(1, Math.max(0, (r - 1.6) / 2.4));
    return fadeIn * fadeOut;
  }

  function drawCosmos(cx, cy) {
    const unit = Math.min(w, h);
    const k = unit * Math.pow(zoomFactor, depth - MAX_DEPTH);   // px per model unit
    const sunX = cx + Math.cos(SUN_ANGLE) * SUN_DIST * k;
    const sunY = cy + Math.sin(SUN_ANGLE) * SUN_DIST * k;
    const orbit = (x, y, r, alpha) => {
      if (alpha <= 0.003) return;
      ctx.strokeStyle = `rgba(236, 239, 247, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    };
    ctx.lineWidth = 1;

    // Oort cloud and Kuiper belt: faint dust around the Sun.
    for (let i = 0; i < belt.length; i++) {
      const b = belt[i];
      const r = b.r * SUN_DIST * k;
      const x = sunX + Math.cos(b.angle) * r;
      const y = sunY + Math.sin(b.angle) * r;
      if (x < 0 || y < 0 || x > w || y > h) continue;
      const a = b.alpha * sizeFade(r, unit * 0.5);
      if (a < 0.01) continue;
      ctx.fillStyle = `rgba(210, 220, 240, ${a.toFixed(3)})`;
      ctx.fillRect(x, y, 1, 1);
    }

    // Planet orbits and planets.
    PLANETS.forEach((p) => {
      const r = p.a * SUN_DIST * k;
      const fade = sizeFade(r, unit);
      orbit(sunX, sunY, r, 0.13 * fade);
      if (fade > 0.05) {
        ctx.fillStyle = rgb(p.color, 0.85 * fade);
        ctx.beginPath();
        ctx.arc(sunX + Math.cos(p.angle) * r, sunY + Math.sin(p.angle) * r, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Earth's own orbit passes through the centre of the screen.
    orbit(sunX, sunY, SUN_DIST * k, 0.16 * sizeFade(SUN_DIST * k, unit));

    // The Sun.
    const sr = Math.max(2, SUN_R * k);
    if (sunX + sr * 4 > 0 && sunY - sr * 4 < h) {
      const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sr * 4);
      glow.addColorStop(0, "rgba(255, 244, 220, 0.95)");
      glow.addColorStop(0.22, "rgba(255, 214, 150, 0.55)");
      glow.addColorStop(1, "rgba(255, 190, 120, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(sunX - sr * 4, sunY - sr * 4, sr * 8, sr * 8);
    }

    // The Moon's orbit and the Moon.
    const mo = MOON_ORBIT * k;
    const moonFade = sizeFade(mo, unit);
    orbit(cx, cy, mo, 0.2 * moonFade);
    if (moonFade > 0.05) {
      const mx = cx + Math.cos(MOON_ANGLE) * mo;
      const my = cy + Math.sin(MOON_ANGLE) * mo;
      const mr = Math.max(1.2, MOON_R * k);
      const lx = Math.cos(SUN_ANGLE), ly = Math.sin(SUN_ANGLE);   // lit from the Sun's side
      const mg = ctx.createRadialGradient(mx + lx * mr * 0.45, my + ly * mr * 0.45, mr * 0.1, mx, my, mr);
      mg.addColorStop(0, rgb([225, 222, 215], moonFade));
      mg.addColorStop(1, rgb([95, 95, 105], moonFade));
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Earth, lit from the Sun's side. Far out it becomes a pale blue dot.
    const er = EARTH_R * k;
    if (er < 2.2) {
      ctx.fillStyle = "rgba(150, 195, 240, 0.95)";
      ctx.beginPath();
      ctx.arc(cx, cy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const atmo = ctx.createRadialGradient(cx, cy, er * 0.9, cx, cy, er * 1.35);
      atmo.addColorStop(0, "rgba(120, 175, 235, 0.35)");
      atmo.addColorStop(1, "rgba(120, 175, 235, 0)");
      ctx.fillStyle = atmo;
      ctx.beginPath();
      ctx.arc(cx, cy, er * 1.35, 0, Math.PI * 2);
      ctx.fill();
      const lx = Math.cos(SUN_ANGLE), ly = Math.sin(SUN_ANGLE);   // lit from the Sun's side
      const body = ctx.createRadialGradient(cx + lx * er * 0.45, cy + ly * er * 0.45, er * 0.05, cx, cy, er);
      body.addColorStop(0, "#a8d4f0");
      body.addColorStop(0.45, "#3b7fb8");
      body.addColorStop(0.85, "#16304f");
      body.addColorStop(1, "#0b1830");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, er, 0, Math.PI * 2);
      ctx.fill();
    }
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
    // the eras' zoom factor so the cosmos lines up with them.
    init(el, options = {}) {
      canvas = el;
      if (options.zoomFactor) zoomFactor = options.zoomFactor;
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
