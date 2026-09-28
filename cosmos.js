/* cosmos.js: the map you zoom through, drawn under the eras.
   Each era is a place, and each has its own focus, so the view drifts
   sideways as it pulls out rather than staying pinned to one centre:
     Personal (childhood to high school): Florida
     Vanderbilt (college): Tennessee
     Now: Earth
     Future: the solar system, with Earth a pale blue dot
   Map outlines come from geo.js. Drawn minimally, in thin starlight lines. */

const Cosmos = (function () {
  "use strict";

  const R_EARTH = 6371;                 // km
  const LAT0 = 32, LON0 = -84;          // the globe faces the southeastern US
  const INNER_SPAN = 1250;              // km across the screen's short side at the innermost era
  const FUTURE_EXTRA = 60;              // the last step out is far bigger than the others

  // Focus of each level, innermost first (index = MAX_DEPTH - depth).
  const FOCUS = {
    personal: [-82.9, 28.1],            // Florida
    college: [-86.3, 35.9],             // Tennessee
    now: [LON0, LAT0],                  // the globe's centre
  };
  const NASHVILLE = [-86.78, 36.16];

  // The solar system, in units of the screen's short side at the Future
  // level. Distances are compressed so everything fits. Angles in degrees
  // (0 = right, 90 = down).
  const SUN_DIR = 200;                  // from Earth: left and a little up
  const ORBITS = [
    { name: "Mercury", r: 0.040, size: 1.3, color: [200, 190, 180], angle: 70 },
    { name: "Venus",   r: 0.062, size: 1.7, color: [235, 215, 180], angle: 290 },
    { name: "Earth",   r: 0.085 },     // Earth's position is the globe itself
    { name: "Mars",    r: 0.120, size: 1.6, color: [225, 150, 120], angle: 230 },
    { name: "Jupiter", r: 0.240, size: 2.6, color: [225, 200, 170], angle: 130 },
    { name: "Saturn",  r: 0.320, size: 2.3, color: [230, 210, 160], angle: 320 },
    { name: "Uranus",  r: 0.400, size: 2.0, color: [170, 215, 225], angle: 185 },
    { name: "Neptune", r: 0.470, size: 2.0, color: [130, 160, 235], angle: 40 },
  ];
  const BELTS = [
    { range: [0.15, 0.19], n: 240, alpha: 0.28 },   // asteroid belt
    { range: [0.52, 0.60], n: 300, alpha: 0.32 },   // Kuiper belt
    { range: [0.78, 1.25], n: 600, alpha: 0.2 },    // Oort cloud
  ];

  // Colours: a calm ocean blue, and land darker than the ocean.
  const OCEAN_LIGHT = [30, 78, 128];
  const OCEAN = [16, 52, 96];
  const OCEAN_EDGE = [10, 34, 68];
  const LAND = [11, 19, 34];
  const TURN_SPEED = 3;                 // degrees per second: a slow, gentle turn
  const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;

  let projected = null;                 // map rings, projected to km
  let dust = [];
  let zoomFactor = 3.5;
  let maxDepth = 3;

  // ----- Projection: orthographic, centred on (LAT0, LON0) -------------------

  const rad = (d) => (d * Math.PI) / 180;
  const sinP0 = Math.sin(rad(LAT0)), cosP0 = Math.cos(rad(LAT0));

  // Returns [x, y, visible] in km, y pointing north. dLon turns the globe.
  function project(lon, lat, dLon = 0) {
    const p = rad(lat), l = rad(lon - LON0 - dLon);
    const cosC = sinP0 * Math.sin(p) + cosP0 * Math.cos(p) * Math.cos(l);
    return [
      R_EARTH * Math.cos(p) * Math.sin(l),
      R_EARTH * (cosP0 * Math.sin(p) - sinP0 * Math.cos(p) * Math.cos(l)),
      cosC >= 0,
    ];
  }

  function projectRing(flat, ring, dLon = 0) {
    const n = flat.length / 2;
    const xy = ring ? ring.xy : new Float32Array(n * 2);
    const vis = ring ? ring.vis : new Uint8Array(n);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      const [x, y, v] = project(flat[i * 2], flat[i * 2 + 1], dLon);
      xy[i * 2] = x; xy[i * 2 + 1] = y; vis[i] = v ? 1 : 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const box = [minX, minY, maxX, maxY];
    if (ring) { ring.box = box; return ring; }
    // The North American coast is coarse at this detail; up close it gives
    // way to the finer state outlines.
    let northAmerica = false;
    for (let i = 0; i < n && !northAmerica; i++) {
      const lon = flat[i * 2], lat = flat[i * 2 + 1];
      northAmerica = lon > -125 && lon < -60 && lat > 25 && lat < 50;
    }
    return { flat, xy, vis, box, northAmerica };
  }

  // Turn the globe: re-project every ring for a new rotation.
  let lastDLon = 0;
  function rotate(dLon) {
    if (Math.abs(dLon - lastDLon) < 0.01) return;
    lastDLon = dLon;
    projected.land.forEach((r) => projectRing(r.flat, r, dLon));
    projected.states.forEach((st) => st.rings.forEach((r) => projectRing(r.flat, r, dLon)));
  }

  function prepare() {
    if (projected || typeof GEO === "undefined") return;
    projected = {
      states: GEO.states.map((s) => ({ name: s.name, rings: s.rings.map((r) => projectRing(r)) })),
      land: GEO.land.map((r) => projectRing(r)),
    };
    // Seeded dust for the belts.
    let seed = 99;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    dust = [];
    BELTS.forEach((b) => {
      for (let i = 0; i < b.n; i++) {
        dust.push({
          r: b.range[0] + (b.range[1] - b.range[0]) * Math.sqrt(rand()),
          a: rand() * Math.PI * 2,
          alpha: b.alpha * (0.4 + 0.6 * rand()),
        });
      }
    });
  }

  // ----- Camera ---------------------------------------------------------------

  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // Screen scale (px per km) and world focus at an integer level.
  function level(d, unit) {
    const fromInner = maxDepth - d;                   // 0 = Personal
    if (d >= 1) {
      const span = INNER_SPAN * Math.pow(zoomFactor, fromInner);
      const key = ["now", "college", "personal"][Math.min(2, d - 1)];
      const [x, y] = project(...FOCUS[key]);
      return { s: unit / span, x, y };
    }
    // Future: centred on the Sun.
    const nowSpan = INNER_SPAN * Math.pow(zoomFactor, maxDepth - 1);
    const span = nowSpan * zoomFactor * FUTURE_EXTRA;
    const earthOrbit = 0.085 * span;
    const t = rad(SUN_DIR);
    return { s: unit / span, x: Math.cos(t) * earthOrbit, y: -Math.sin(t) * earthOrbit, span };
  }

  // Between levels, zoom around the point that stays fixed on screen, so the
  // view drifts smoothly toward the next focus as it pulls out.
  function camera(z, unit) {
    const zc = Math.min(maxDepth, Math.max(0, z));
    const lo = Math.floor(zc), hi = Math.min(maxDepth, lo + 1);
    const a = level(lo, unit), b = level(hi, unit);
    const f = zc - lo;
    let s = Math.pow(a.s, 1 - f) * Math.pow(b.s, f);
    let g = hi === lo ? 0 : (1 / s - 1 / a.s) / (1 / b.s - 1 / a.s);
    const cam = { s, x: a.x + (b.x - a.x) * g, y: a.y + (b.y - a.y) * g };
    // Past the innermost level (e.g. inside a sub-zoom) keep zooming in.
    if (z > maxDepth) cam.s *= Math.pow(zoomFactor, z - maxDepth);
    return cam;
  }

  // ----- Drawing --------------------------------------------------------------

  function strokeRing(ctx, ring, cam, w, h) {
    const { xy, vis, box } = ring;
    const cx = w / 2, cy = h / 2, s = cam.s;
    // Skip rings entirely off screen.
    if ((box[2] - cam.x) * s + cx < 0 || (box[0] - cam.x) * s + cx > w ||
        cy - (box[3] - cam.y) * s > h || cy - (box[1] - cam.y) * s < 0) return;
    let pen = false;
    for (let i = 0; i < vis.length; i++) {
      if (!vis[i]) { pen = false; continue; }
      const x = cx + (xy[i * 2] - cam.x) * s;
      const y = cy - (xy[i * 2 + 1] - cam.y) * s;
      if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
    }
  }

  // Trace a ring for filling. Points on the far side of the globe are pulled
  // onto its edge, so land that wraps around still fills cleanly.
  function traceRing(ctx, ring, cam, w, h) {
    const { xy, vis, box } = ring;
    const cx = w / 2, cy = h / 2, s = cam.s;
    if ((box[2] - cam.x) * s + cx < 0 || (box[0] - cam.x) * s + cx > w ||
        cy - (box[3] - cam.y) * s > h || cy - (box[1] - cam.y) * s < 0) return;
    for (let i = 0; i < vis.length; i++) {
      let x = xy[i * 2], y = xy[i * 2 + 1];
      if (!vis[i]) {
        const d = Math.hypot(x, y) || 1;
        x = (x / d) * R_EARTH; y = (y / d) * R_EARTH;
      }
      const X = cx + (x - cam.x) * s, Y = cy - (y - cam.y) * s;
      if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
    }
    ctx.closePath();
  }

  function toScreen(x, y, cam, w, h) {
    return [w / 2 + (x - cam.x) * cam.s, h / 2 - (y - cam.y) * cam.s];
  }

  function label(ctx, text, x, y, alpha, size) {
    if (alpha < 0.02) return;
    ctx.font = `500 ${size}px "Site Body", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = `rgba(236, 239, 247, ${alpha.toFixed(3)})`;
    ctx.fillText(text, x, y);
  }

  // time: ms, for the globe's slow turn (0 = hold still, e.g. reduced motion).
  function draw(ctx, w, h, z, time = 0) {
    prepare();
    if (!projected) return;
    const unit = Math.min(w, h);
    const cam = camera(z, unit);

    // The globe turns slowly at the Now level, and eases back to face the
    // southeastern US as you zoom in toward Tennessee.
    const turnW = smooth(0.15, 0.7, z) * (1 - smooth(1.1, 1.7, z));
    const turn = ((((time / 1000) * TURN_SPEED + 180) % 360) + 360) % 360 - 180;
    rotate(-turn * turnW);
    ctx.lineWidth = 1;
    ctx.lineJoin = "round";

    // How much of each layer shows at this depth.
    const globeA = smooth(0.25, 1.0, z);
    const landA = smooth(0.35, 1.0, z) * (1 - smooth(1.35, 1.9, z));
    const statesA = smooth(1.2, 1.9, z);
    const solarA = 1 - smooth(0.35, 0.95, z);
    const floridaA = smooth(1.2, 2.0, z) * (0.35 + 0.25 * smooth(2.2, 2.9, z));
    const tennesseeA = smooth(1.2, 1.9, z) * (0.6 - 0.28 * smooth(2.2, 2.9, z));

    // The globe.
    const [gx, gy] = toScreen(0, 0, cam, w, h);
    const gr = R_EARTH * cam.s;
    if (globeA > 0.01 && gr > 3) {
      // Ocean. Close in, the globe is bigger than the screen, so the ocean
      // surrounds Florida and Tennessee.
      const lit = Math.min(gr, unit * 1.2);
      const ocean = ctx.createRadialGradient(gx - lit * 0.3, gy - lit * 0.35, lit * 0.05, gx, gy, gr);
      ocean.addColorStop(0, rgba(OCEAN_LIGHT, globeA));
      ocean.addColorStop(Math.min(1, (lit * 1.1) / gr), rgba(OCEAN, globeA));
      ocean.addColorStop(1, rgba(OCEAN_EDGE, globeA));
      ctx.fillStyle = ocean;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba([150, 195, 245], 0.4 * globeA);
      ctx.stroke();

      // Land, darker than the ocean.
      const coarseA = 1 - smooth(1.9, 2.4, z);
      ctx.fillStyle = rgba(LAND, globeA);
      ctx.beginPath();
      projected.land.forEach((r) => {
        if (!r.northAmerica || coarseA > 0.5) traceRing(ctx, r, cam, w, h);
      });
      ctx.fill();
      const fineA = smooth(1.5, 2.1, z) * globeA;
      if (fineA > 0.01) {
        ctx.fillStyle = rgba(LAND, fineA);
        ctx.beginPath();
        projected.states.forEach((st) => st.rings.forEach((r) => traceRing(ctx, r, cam, w, h)));
        ctx.fill();
      }
    }

    // Coastlines on the globe.
    if (landA > 0.01) {
      ctx.strokeStyle = `rgba(200, 220, 245, ${(0.38 * landA).toFixed(3)})`;
      ctx.beginPath();
      projected.land.forEach((r) => strokeRing(ctx, r, cam, w, h));
      ctx.stroke();
    }

    // US states, faint; Florida and Tennessee brighter, with a soft fill.
    if (statesA > 0.01) {
      ctx.strokeStyle = `rgba(236, 239, 247, ${(0.11 * statesA).toFixed(3)})`;
      ctx.beginPath();
      projected.states.forEach((st) => {
        if (st.name !== "Florida" && st.name !== "Tennessee") st.rings.forEach((r) => strokeRing(ctx, r, cam, w, h));
      });
      ctx.stroke();
      [["Florida", floridaA], ["Tennessee", tennesseeA]].forEach(([name, a]) => {
        if (a < 0.01) return;
        const st = projected.states.find((s) => s.name === name);
        ctx.beginPath();
        st.rings.forEach((r) => strokeRing(ctx, r, cam, w, h));
        ctx.fillStyle = `rgba(227, 169, 179, ${(0.06 * a).toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(236, 239, 247, ${a.toFixed(3)})`;
        ctx.stroke();
      });

      // Place names.
      const [fx, fy] = toScreen(...project(-81.6, 27.6).slice(0, 2), cam, w, h);
      label(ctx, "FLORIDA", fx, fy, 0.5 * smooth(1.7, 2.4, z), 12);
      const [tx, ty] = toScreen(...project(-86.0, 35.55).slice(0, 2), cam, w, h);
      label(ctx, "TENNESSEE", tx, ty, 0.5 * smooth(1.4, 1.9, z) * (1 - smooth(2.4, 2.9, z)), 12);
      const [nx, ny] = toScreen(...project(...NASHVILLE).slice(0, 2), cam, w, h);
      const nA = smooth(1.4, 1.9, z) * (1 - smooth(2.5, 3, z));
      if (nA > 0.02) {
        ctx.fillStyle = `rgba(227, 169, 179, ${(0.9 * nA).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
        label(ctx, "Nashville", nx, ny - 8, 0.55 * nA, 11);
      }
    }

    // The solar system, centred on the Sun.
    const future = level(0, unit);
    const [sx, sy] = toScreen(future.x, future.y, cam, w, h);
    const k = future.span * cam.s;             // px per solar unit
    if (solarA > 0.01) {
      dust.forEach((d) => {
        const r = d.r * k;
        const x = sx + Math.cos(d.a) * r, y = sy + Math.sin(d.a) * r;
        if (x < 0 || y < 0 || x > w || y > h) return;
        ctx.fillStyle = `rgba(210, 220, 240, ${(d.alpha * solarA).toFixed(3)})`;
        ctx.fillRect(x, y, 1, 1);
      });
      ORBITS.forEach((o) => {
        const r = o.r * k;
        ctx.strokeStyle = `rgba(236, 239, 247, ${(0.14 * solarA).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.stroke();
        if (!o.size) return;
        const t = rad(o.angle);
        ctx.fillStyle = `rgba(${o.color.join(",")}, ${(0.9 * solarA).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx + Math.cos(t) * r, sy + Math.sin(t) * r, o.size, 0, Math.PI * 2);
        ctx.fill();
      });
      const sr = Math.max(1.8, 0.006 * k);
      const glowR = Math.max(10, sr * 4);
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
      glow.addColorStop(0, `rgba(255, 244, 222, ${(0.95 * solarA).toFixed(3)})`);
      glow.addColorStop(Math.min(0.5, sr / glowR), `rgba(255, 222, 165, ${(0.75 * solarA).toFixed(3)})`);
      glow.addColorStop(1, "rgba(255, 190, 120, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2);
    }

    // Far out, Earth is a pale blue dot.
    if (gr <= 3) {
      ctx.fillStyle = "rgba(150, 195, 245, 0.95)";
      ctx.beginPath();
      ctx.arc(gx, gy, 2, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, "Earth", gx, gy - 8, 0.5 * solarA, 11);
    }
  }

  return {
    configure(opts) {
      if (opts.zoomFactor) zoomFactor = opts.zoomFactor;
      if (opts.maxDepth != null) maxDepth = opts.maxDepth;
    },
    draw,
  };
})();
