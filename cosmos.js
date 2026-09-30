/* cosmos.js: the map you zoom through, drawn under the eras.
   Each era is a place with its own focus, so the view drifts as it pulls
   out rather than staying pinned to one centre. It never leaves Earth:
     Personal (childhood to high school): Florida
     Vanderbilt (college): Tennessee
     Now: the whole Earth, gently rocking, with Florida (home again) lit
     Future: standing on Earth's curved horizon at night, under a wide sky
   Map outlines come from geo.js. Drawn minimally, in thin starlight lines. */

const Cosmos = (function () {
  "use strict";

  const R_EARTH = 6371;                 // km
  const LAT0 = 32, LON0 = -84;          // the globe faces the southeastern US
  const INNER_SPAN = 1250;              // km across the screen's short side at the innermost era

  // Where each level looks.
  const FOCUS = {
    personal: [-82.9, 28.1],            // Florida
    college: [-86.3, 35.9],             // Tennessee
    now: [LON0, LAT0],                  // the globe's centre
  };
  const NASHVILLE = [-86.78, 36.16];
  // Where home was, shown on the Florida view: Gainesville, then Fort Myers
  // for high school.
  const HOMETOWNS = [
    { name: "Gainesville", lon: -82.32, lat: 29.65 },
    { name: "Fort Myers", lon: -81.87, lat: 26.64 },
  ];

  // The Future level: Earth's edge becomes the horizon.
  const HORIZON_Y = 0.8;                // where the horizon sits, as a fraction of screen height
  const HORIZON_RADIUS = 6;             // Earth's radius on screen, in screen short sides (a gentle curve)

  // The globe rocks gently back and forth at Now (never turning home away).
  const ROCK_DEGREES = 32;
  const ROCK_SECONDS = 48;

  // Colours: a calm ocean blue, land darker than the ocean, and the night
  // side of Earth for the Future horizon.
  const OCEAN_LIGHT = [24, 64, 108];
  const OCEAN = [14, 44, 84];
  const OCEAN_EDGE = [10, 34, 68];
  const LAND = [11, 19, 34];
  const NIGHT = [6, 10, 20];
  const AIR = [110, 160, 225];          // the thin line of atmosphere above the horizon
  const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;

  let projected = null;                 // map rings, projected to km
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
  }

  // ----- Camera ---------------------------------------------------------------

  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // Screen scale (px per km) and world focus at an integer level.
  function level(d, unit, h) {
    if (d >= 1) {
      const span = INNER_SPAN * Math.pow(zoomFactor, maxDepth - d);
      const key = ["now", "college", "personal"][Math.min(2, d - 1)];
      const [x, y] = project(...FOCUS[key]);
      return { s: unit / span, x, y };
    }
    // Future: Earth's top edge sits at HORIZON_Y of the screen, curving
    // gently away to either side.
    const s = (HORIZON_RADIUS * unit) / R_EARTH;
    return { s, x: 0, y: R_EARTH + ((HORIZON_Y - 0.5) * h) / s };
  }

  // Between levels, zoom around the point that stays fixed on screen, so the
  // view drifts smoothly toward the next focus.
  function camera(z, unit, h) {
    const zc = Math.min(maxDepth, Math.max(0, z));
    const lo = Math.floor(zc), hi = Math.min(maxDepth, lo + 1);
    const a = level(lo, unit, h), b = level(hi, unit, h);
    const f = zc - lo;
    const s = Math.pow(a.s, 1 - f) * Math.pow(b.s, f);
    const g = hi === lo ? 0 : (1 / s - 1 / a.s) / (1 / b.s - 1 / a.s);
    const cam = { s, x: a.x + (b.x - a.x) * g, y: a.y + (b.y - a.y) * g };
    // Past the innermost level (e.g. inside a sub-zoom) keep zooming in.
    if (z > maxDepth) cam.s *= Math.pow(zoomFactor, z - maxDepth);
    return cam;
  }

  // ----- Drawing --------------------------------------------------------------

  function offscreen(box, cam, w, h) {
    const cx = w / 2, cy = h / 2, s = cam.s;
    return (box[2] - cam.x) * s + cx < 0 || (box[0] - cam.x) * s + cx > w ||
      cy - (box[3] - cam.y) * s > h || cy - (box[1] - cam.y) * s < 0;
  }

  function strokeRing(ctx, ring, cam, w, h) {
    const { xy, vis, box } = ring;
    if (offscreen(box, cam, w, h)) return;
    const cx = w / 2, cy = h / 2, s = cam.s;
    let pen = false;
    for (let i = 0; i < vis.length; i++) {
      if (!vis[i]) { pen = false; continue; }
      const x = cx + (xy[i * 2] - cam.x) * s;
      const y = cy - (xy[i * 2 + 1] - cam.y) * s;
      if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
    }
  }

  // Trace a ring for filling. Where land runs behind the globe, the outline
  // follows the globe's edge (the shorter way round) from where it leaves to
  // where it comes back, instead of cutting straight across the face.
  function traceRing(ctx, ring, cam, w, h) {
    const { xy, vis, box } = ring;
    if (offscreen(box, cam, w, h)) return;
    const n = vis.length;
    let start = -1;
    for (let i = 0; i < n; i++) if (vis[i]) { start = i; break; }
    if (start < 0) return;                       // entirely out of sight
    const cx = w / 2, cy = h / 2, s = cam.s;
    const gx = cx - cam.x * s, gy = cy + cam.y * s, gr = R_EARTH * s;
    const px = (i) => cx + (xy[i * 2] - cam.x) * s;
    const py = (i) => cy - (xy[i * 2 + 1] - cam.y) * s;
    const edgeAngle = (i) => Math.atan2(py(i) - gy, px(i) - gx);

    ctx.moveTo(px(start), py(start));
    let k = 1;
    while (k < n) {
      const i = (start + k) % n;
      if (vis[i]) {
        ctx.lineTo(px(i), py(i));
        k++;
        continue;
      }
      // A hidden run: find where the ring comes back into view.
      const exit = (start + k - 1) % n;
      let run = k;
      while (run < n && !vis[(start + run) % n]) run++;
      const entry = (start + run) % n;
      const a0 = edgeAngle(exit), a1 = edgeAngle(entry);
      let delta = a1 - a0;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      ctx.arc(gx, gy, gr, a0, a0 + delta, delta < 0);
      if (run < n) ctx.lineTo(px(entry), py(entry));
      k = run + 1;
    }
    ctx.closePath();
  }

  function toScreen(x, y, cam, w, h) {
    return [w / 2 + (x - cam.x) * cam.s, h / 2 - (y - cam.y) * cam.s];
  }

  function label(ctx, text, x, y, alpha, size, align = "center") {
    if (alpha < 0.02) return;
    ctx.font = `500 ${size}px "Site Body", system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.fillStyle = rgba([236, 239, 247], alpha);
    ctx.fillText(text, x, y);
  }

  // time: ms, for the globe's gentle rocking (0 = hold still, e.g. reduced motion).
  function draw(ctx, w, h, z, time = 0) {
    if (!w || !h) return;                   // e.g. a tab opened in the background
    prepare();
    if (!projected) return;
    const unit = Math.min(w, h);
    const cam = camera(z, unit, h);
    ctx.lineWidth = 1;
    ctx.lineJoin = "round";

    // At Now the globe rocks slowly; it settles back to face the southeastern
    // US as you zoom in, and holds still at the Future horizon.
    const rockW = smooth(0.3, 0.8, z) * (1 - smooth(1.1, 1.7, z));
    rotate(Math.sin((time / 1000) * ((2 * Math.PI) / ROCK_SECONDS)) * ROCK_DEGREES * rockW);

    // How much of each layer shows at this depth.
    const nightA = 1 - smooth(0.2, 0.75, z);               // the Future: Earth's night side
    const landA = smooth(0.35, 1.0, z) * (1 - smooth(1.35, 1.9, z));
    const statesA = smooth(1.2, 1.9, z);
    const floridaA = smooth(1.2, 2.0, z) * (0.35 + 0.25 * smooth(2.2, 2.9, z));
    const tennesseeA = smooth(1.2, 1.9, z) * (0.6 - 0.28 * smooth(2.2, 2.9, z));
    const homeA = smooth(0.55, 0.95, z) * (1 - smooth(1.25, 1.7, z));   // Florida lit on the globe

    const [gx, gy] = toScreen(0, 0, cam, w, h);
    const gr = R_EARTH * cam.s;

    // Ocean. Close in, the globe is bigger than the screen, so the ocean
    // surrounds Florida and Tennessee.
    const lit = Math.min(gr, unit * 1.2);
    const ocean = ctx.createRadialGradient(gx - lit * 0.3, gy - lit * 0.35, lit * 0.05, gx, gy, gr);
    ocean.addColorStop(0, rgba(OCEAN_LIGHT, 1));
    ocean.addColorStop(Math.min(1, (lit * 1.1) / gr), rgba(OCEAN, 1));
    ocean.addColorStop(1, rgba(OCEAN_EDGE, 1));
    ctx.fillStyle = ocean;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.fill();

    // Land, darker than the ocean.
    const coarseA = 1 - smooth(1.9, 2.4, z);
    ctx.fillStyle = rgba(LAND, 1);
    ctx.beginPath();
    projected.land.forEach((r) => {
      if (!r.northAmerica || coarseA > 0.5) traceRing(ctx, r, cam, w, h);
    });
    ctx.fill();
    const fineA = smooth(1.5, 2.1, z);
    if (fineA > 0.01) {
      ctx.fillStyle = rgba(LAND, fineA);
      ctx.beginPath();
      projected.states.forEach((st) => st.rings.forEach((r) => traceRing(ctx, r, cam, w, h)));
      ctx.fill();
    }

    // Coastlines on the globe.
    if (landA > 0.01) {
      ctx.strokeStyle = rgba([200, 220, 245], 0.38 * landA);
      ctx.beginPath();
      projected.land.forEach((r) => strokeRing(ctx, r, cam, w, h));
      ctx.stroke();
    }

    // Florida, home again, lit on the globe at Now.
    if (homeA > 0.01) {
      const fl = projected.states.find((s) => s.name === "Florida");
      ctx.beginPath();
      fl.rings.forEach((r) => traceRing(ctx, r, cam, w, h));
      ctx.fillStyle = rgba([227, 169, 179], 0.55 * homeA);
      ctx.fill();
      const [hx, hy] = toScreen(...project(-81.6, 28.3, lastDLon).slice(0, 2), cam, w, h);
      label(ctx, "Florida", hx + 34, hy + 4, 0.6 * homeA, 11);
    }

    // US states, faint; Florida and Tennessee brighter, with a soft fill.
    if (statesA > 0.01) {
      ctx.strokeStyle = rgba([236, 239, 247], 0.11 * statesA);
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
        ctx.strokeStyle = rgba([236, 239, 247], a);
        ctx.stroke();
        ctx.beginPath();
        st.rings.forEach((r) => traceRing(ctx, r, cam, w, h));
        ctx.fillStyle = rgba([227, 169, 179], 0.06 * a);
        ctx.fill();
      });

      // Place names.
      const [fx, fy] = toScreen(...project(-81.6, 27.6).slice(0, 2), cam, w, h);
      label(ctx, "FLORIDA", fx, fy, 0.5 * smooth(1.7, 2.4, z), 12);
      const [tx, ty] = toScreen(...project(-86.3, 34.55).slice(0, 2), cam, w, h);   // just below the state
      label(ctx, "TENNESSEE", tx, ty, 0.5 * smooth(1.4, 1.9, z) * (1 - smooth(2.4, 2.9, z)), 12);
      const [nx, ny] = toScreen(...project(...NASHVILLE).slice(0, 2), cam, w, h);
      const nA = smooth(1.4, 1.9, z) * (1 - smooth(2.5, 3, z));
      if (nA > 0.02) {
        ctx.fillStyle = rgba([227, 169, 179], 0.9 * nA);
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
        label(ctx, "Nashville", nx, ny - 8, 0.55 * nA, 11);
      }

      // Hometowns, on the Florida view.
      const townA = smooth(2.3, 2.85, z);
      if (townA > 0.02) {
        HOMETOWNS.forEach((t) => {
          const [x, y] = toScreen(...project(t.lon, t.lat).slice(0, 2), cam, w, h);
          ctx.fillStyle = rgba([227, 169, 179], 0.9 * townA);
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          label(ctx, t.name, x + 7, y + 4, 0.6 * townA, 11, "left");
        });
      }
    }

    // The Future: Earth's night side becomes the ground, with a thin line of
    // atmosphere along the horizon and the whole sky above.
    if (nightA > 0.01) {
      ctx.fillStyle = rgba(NIGHT, nightA);
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }
    const airW = Math.max(3, gr * 0.018);
    const air = ctx.createRadialGradient(gx, gy, gr * 0.995, gx, gy, gr + airW);
    air.addColorStop(0, rgba(AIR, 0.5));
    air.addColorStop(0.35, rgba(AIR, 0.18));
    air.addColorStop(1, rgba(AIR, 0));
    ctx.fillStyle = air;
    ctx.beginPath();
    ctx.arc(gx, gy, gr + airW, 0, Math.PI * 2);
    ctx.arc(gx, gy, gr * 0.995, 0, Math.PI * 2, true);
    ctx.fill();
  }

  // Screen y of the ground (Earth's top edge) at screen x, or null, plus how
  // strongly the Future horizon is in play (0 to 1). main.js uses it to stand
  // the small figure on the horizon.
  function groundAt(x, w, h, z) {
    if (!w || !h) return { y: null, weight: 0 };
    const unit = Math.min(w, h);
    const cam = camera(z, unit, h);
    const [gx, gy] = toScreen(0, 0, cam, w, h);
    const gr = R_EARTH * cam.s;
    const dx = x - gx;
    if (Math.abs(dx) >= gr) return { y: null, weight: 0 };
    return { y: gy - Math.sqrt(gr * gr - dx * dx), weight: 1 - smooth(0.25, 0.8, z) };
  }

  return {
    configure(opts) {
      if (opts.zoomFactor) zoomFactor = opts.zoomFactor;
      if (opts.maxDepth != null) maxDepth = opts.maxDepth;
    },
    draw,
    groundAt,
  };
})();
