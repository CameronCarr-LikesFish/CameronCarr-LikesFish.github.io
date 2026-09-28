/* main.js: zoom, navigation, and state.
   Reads everything it shows from content.js
   (SETTINGS, ERAS, START_ERA, UI_TEXT, TAGS, ITEMS). */

(function () {
  "use strict";

  // How much smaller each earlier era is than the one around it.
  const ZOOM_FACTOR = 3.5;
  // The figure's height in px at the Future (depth 0), and how much it grows
  // with each step into the past.
  const FIGURE_BASE = 18;
  const FIGURE_GROWTH = 1.65;
  // Length of a one-step zoom, in ms. Multi-step jumps take a little longer.
  const STEP_MS = 700;
  // false: map convention, scroll up zooms in (back in time).
  // true: scroll down zooms in.
  const WHEEL_DOWN_ZOOMS_IN = false;

  const MAX_DEPTH = ERAS.length - 1;
  const eraDepth = new Map(ERAS.map((e, i) => [e.id, i]));
  const itemById = new Map(ITEMS.map((it) => [it.id, it]));
  const tagById = new Map(TAGS.map((t) => [t.id, t]));
  const START_DEPTH = eraDepth.get(START_ERA) ?? 0;
  // The innermost era sits beneath the wall; personal items live there.
  const WALL_DEPTH = eraDepth.get("beneath") ?? MAX_DEPTH;
  const depthOfItem = (it) => (it.layer === "personal" ? WALL_DEPTH : eraDepth.get(it.era));

  const WALL_KEY = "camcar.wallCrossed";

  const state = {
    level: START_DEPTH, // the era we're at or heading to (integer depth)
    z: START_DEPTH,     // the camera's current depth (continuous, animates)
    raf: 0,
    crossed: loadCrossed(),
    openItem: null,
    pendingWall: null,  // where to go if the visitor says yes at the wall
    tag: null,          // the active tag filter, or null
    edges: [],          // constellation lines for the active tag: [itemA, itemB]
  };

  const els = {
    stage: document.getElementById("stage"),
    sky: document.getElementById("sky"),
    nav: document.querySelector(".era-nav"),
    navList: document.querySelector(".era-nav__list"),
    posEra: document.querySelector(".position__era"),
    posSub: document.querySelector(".position__sub"),
    zoomIn: document.querySelector('[data-zoom="in"]'),
    zoomOut: document.querySelector('[data-zoom="out"]'),
    panel: document.querySelector(".panel"),
    wall: document.querySelector(".wall"),
    lines: document.getElementById("lines"),
    figure: document.querySelector(".figure"),
    tagBar: document.querySelector(".tag-bar"),
    tagStatus: document.querySelector(".tag-bar__status"),
    tagClear: document.querySelector(".tag-bar__clear"),
    eras: [],
    eraTitles: [],
    navButtons: [],
    itemButtons: new Map(),
    itemSlots: new Map(),  // item id -> [x%, y%] within its era
    tagButtons: new Map(),
  };

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const isPlaceholder = (v) => !v || /^\s*PLACEHOLDER/i.test(v);
  const hasPlaceholderText = (v) => /\[PLACEHOLDER/i.test(v);

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function loadCrossed() {
    try { return sessionStorage.getItem(WALL_KEY) === "1"; } catch (e) { return false; }
  }

  function saveCrossed() {
    try { sessionStorage.setItem(WALL_KEY, "1"); } catch (e) { /* private mode: memory only */ }
  }

  // -------------------------------------------------------------------------
  // Header and contact (from SETTINGS)
  // -------------------------------------------------------------------------

  function renderSettings() {
    document.title = `${SETTINGS.displayName} (${SETTINGS.fullName})`;
    document.querySelector(".identity__name").textContent = SETTINGS.displayName;
    document.querySelector(".identity__pronouns").textContent = SETTINGS.pronouns;
    document.querySelector(".identity__full").textContent = SETTINGS.fullName;
    renderContact();
    const touchFirst = window.matchMedia("(pointer: coarse)").matches;
    document.querySelector(".hint").textContent = touchFirst
      ? "Swipe or pinch to move through time."
      : WHEEL_DOWN_ZOOMS_IN
        ? "Scroll down to go back in time, up to go forward."
        : "Scroll up to go back in time, down to go forward.";
  }

  function renderContact() {
    const list = document.querySelector(".contact");

    function add(label, href, text) {
      const li = document.createElement("li");
      if (href) {
        const a = make("a", null, text);
        a.href = href;
        a.setAttribute("aria-label", `${label}: ${text}`);
        if (/^https?:/.test(href)) {
          a.target = "_blank";
          a.rel = "noopener";
        }
        li.append(a);
      } else {
        li.className = "placeholder";
        li.textContent = `[${label}: placeholder]`;
      }
      list.append(li);
    }

    // Email and phone are assembled here at runtime, so they never appear in
    // the page's HTML source.
    const [user, domain] = SETTINGS.email.split("@");
    const email = user + "@" + domain;
    add("Email", "mail" + "to:" + email, email);

    if (SETTINGS.showPhone && SETTINGS.phone) {
      add("Phone", "tel:+1" + SETTINGS.phone.replace(/\D/g, ""), SETTINGS.phone);
    }

    add("LinkedIn", isPlaceholder(SETTINGS.linkedin) ? null : SETTINGS.linkedin, "LinkedIn");

    const gh = SETTINGS.github;
    const ghUrl = isPlaceholder(gh) ? null : /^https?:/.test(gh) ? gh : "https://github.com/" + gh;
    add("GitHub", ghUrl, "GitHub");
  }

  // -------------------------------------------------------------------------
  // Eras, items, and navigation
  // -------------------------------------------------------------------------

  // Item positions, as % of the screen. The middle of every era is kept
  // clear because the next-earlier era shows there.
  const SLOT_POS = {
    L1: [18, 36], L2: [18, 52], L3: [18, 68], L4: [18, 82],
    R1: [82, 36], R2: [82, 52], R3: [82, 68], R4: [82, 82],
    B: [50, 78],
  };
  const SLOT_ORDER = ["L2", "R2", "L1", "R1", "L3", "R3"];

  // Pick balanced slots for n items, returned in reading order
  // (left column top to bottom, then bottom center, then right column).
  function slotsFor(n) {
    let names;
    if (n <= 6) names = n % 2 ? SLOT_ORDER.slice(0, n - 1).concat("B") : SLOT_ORDER.slice(0, n);
    else names = SLOT_ORDER.concat("B", "L4", "R4").slice(0, n);
    if (n > 9) console.warn(`An era has ${n} items; only 9 fit. Add slots in main.js.`);
    const rank = (s) => { const col = { L: 0, B: 1, R: 2 }[s[0]]; return col * 100 + SLOT_POS[s][1]; };
    return names.sort((a, b) => rank(a) - rank(b)).map((s) => SLOT_POS[s]);
  }

  function itemsForDepth(d) {
    if (d === WALL_DEPTH) return ITEMS.filter((it) => it.layer === "personal");
    return ITEMS.filter((it) => it.layer !== "personal" && eraDepth.get(it.era) === d);
  }

  function renderItem(it, [x, y]) {
    const b = make("button", "item");
    b.type = "button";
    b.dataset.item = it.id;
    b.style.left = x + "%";
    b.style.top = y + "%";

    const star = make("span", "item__star");
    star.setAttribute("aria-hidden", "true");
    b.append(star);

    const parent = itemById.get(it.parent);
    if (it.layer === "personal" && parent) {
      b.append(make("span", "item__parent", `${UI_TEXT.beneathLabel}: ${parent.title}`));
    }
    b.append(make("span", "item__title", it.title));
    const summary = make("span", "item__summary", it.summary);
    if (hasPlaceholderText(it.summary)) summary.classList.add("placeholder");
    summary.id = "summary-" + it.id;
    b.append(summary);

    // Screen readers hear the title (and what it sits beneath) as the name,
    // and the summary as the description. applyFilter() adds "matches <tag>".
    b.dataset.label = it.layer === "personal" && parent
      ? `${it.title}, ${UI_TEXT.beneathLabel.toLowerCase()} ${parent.title}`
      : it.title;
    b.setAttribute("aria-label", b.dataset.label);
    b.setAttribute("aria-describedby", summary.id);
    b.setAttribute("aria-controls", "panel");
    b.setAttribute("aria-expanded", "false");
    b.addEventListener("click", () => go(it.id));
    els.itemButtons.set(it.id, b);
    return b;
  }

  function renderEras() {
    ERAS.forEach((era, d) => {
      const el = make("section", "era");
      el.id = "era-" + era.id;
      el.dataset.era = era.id;
      el.setAttribute("aria-labelledby", "era-title-" + era.id);

      const head = make("header", "era__head");
      const title = make("h2", "era__title", era.label);
      title.id = "era-title-" + era.id;
      title.tabIndex = -1;
      head.append(title, make("p", "era__subtitle", era.subtitle));
      if (d === WALL_DEPTH && d > 0) {
        const back = make("button", "btn era__back", UI_TEXT.backToProfessional);
        back.type = "button";
        back.addEventListener("click", () => go(ERAS[WALL_DEPTH - 1].id));
        head.append(back);
      }
      el.append(head);

      const items = itemsForDepth(d);
      const slots = slotsFor(items.length);
      items.forEach((it, i) => {
        if (!slots[i]) return;
        els.itemSlots.set(it.id, slots[i]);
        el.append(renderItem(it, slots[i]));
      });

      // The window in the middle where the next-earlier era shows through.
      // It comes after the items so keyboard users meet the items first.
      const next = ERAS[d + 1];
      if (next) {
        const portal = make("button", "era__portal");
        portal.type = "button";
        portal.setAttribute("aria-label", `Zoom in to ${next.label}`);
        portal.addEventListener("click", () => go(next.id));
        el.append(portal);
      }

      els.stage.append(el);
      els.eras.push(el);
      els.eraTitles.push(title);
    });
  }

  // The nav is a timeline: the past on the left, the future on the right.
  function renderNav() {
    els.nav.style.setProperty("--nav-count", ERAS.length);
    ERAS.forEach((era, d) => {
      const b = make("button", "era-nav__btn", era.label);
      b.type = "button";
      b.addEventListener("click", () => go(era.id));
      const li = document.createElement("li");
      li.append(b);
      els.navList.prepend(li);
      els.navButtons[d] = b;
    });
  }

  // -------------------------------------------------------------------------
  // Camera
  // -------------------------------------------------------------------------

  // Draw every era for a camera at depth z. An era at depth d is scaled by
  // ZOOM_FACTOR^(z - d): 1 when we're at it, larger when we've zoomed past it
  // into the past, smaller when it's still ahead of us.
  function applyCamera(z) {
    els.eras.forEach((el, d) => {
      const t = z - d;
      const scale = Math.pow(ZOOM_FACTOR, t);
      const opacity = t >= 0
        ? clamp(1 - t * 1.9, 0, 1)       // outer eras fade quickly as they grow past us
        : Math.max(0.3, 1 + t * 0.3);    // inner eras stay visible but quieter
      el.style.transform = `scale(${scale})`;
      el.style.opacity = opacity.toFixed(3);
      el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
    });
    els.nav.style.setProperty("--pos", (MAX_DEPTH - z).toFixed(4));
    els.figure.style.setProperty("--figure-h", (FIGURE_BASE * Math.pow(FIGURE_GROWTH, z)).toFixed(2) + "px");
    Starfield.setDepth(z);
    drawLines();
  }

  // Update everything that depends on which era is current.
  function setActive(level) {
    const era = ERAS[level];
    const focusWasInEra = els.eras.some((el) => el.contains(document.activeElement));

    els.eras.forEach((el, d) => {
      const active = d === level;
      el.classList.toggle("is-active", active);
      el.inert = !active;
      if (active) el.removeAttribute("aria-hidden");
      else el.setAttribute("aria-hidden", "true");
    });

    els.navButtons.forEach((b, d) => {
      if (d === level) b.setAttribute("aria-current", "location");
      else b.removeAttribute("aria-current");
    });

    els.posEra.textContent = era.label;
    els.posSub.textContent = era.subtitle;

    els.zoomIn.setAttribute("aria-disabled", String(level >= MAX_DEPTH));
    els.zoomOut.setAttribute("aria-disabled", String(level <= 0));

    // If focus was inside an era that just went inert, move it to the new one.
    if (focusWasInEra) els.eraTitles[level].focus({ preventScroll: true });
  }

  // For visitors who ask their system for reduced motion: a short fade out,
  // a jump to the new era, and a fade back in, instead of the zoom.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const FADE_MS = 160;
  let fadeTimer = 0;

  function fadeTo(target) {
    cancelAnimationFrame(state.raf);
    state.level = target;
    setActive(target);
    clearTimeout(fadeTimer);
    document.body.classList.add("is-fading");
    fadeTimer = setTimeout(() => {
      state.z = target;
      applyCamera(target);
      document.body.classList.remove("is-fading");
    }, FADE_MS);
  }

  function moveTo(target, instant) {
    target = clamp(target, 0, MAX_DEPTH);

    if (instant) {
      cancelAnimationFrame(state.raf);
      state.level = state.z = target;
      setActive(target);
      applyCamera(target);
      return;
    }
    if (target === state.level) return;
    if (reducedMotion.matches) return fadeTo(target);

    state.level = target;
    setActive(target);

    const from = state.z;
    const duration = STEP_MS * (0.6 + 0.4 * Math.abs(target - from));
    const start = performance.now();

    cancelAnimationFrame(state.raf);
    function frame(now) {
      const p = Math.min(1, (now - start) / duration);
      state.z = from + (target - from) * easeInOut(p);
      applyCamera(state.z);
      if (p < 1) state.raf = requestAnimationFrame(frame);
    }
    state.raf = requestAnimationFrame(frame);
  }

  // -------------------------------------------------------------------------
  // Tags and constellations
  // -------------------------------------------------------------------------

  function renderTagBar() {
    els.tagBar.setAttribute("aria-label", UI_TEXT.tagBarLabel);
    els.tagClear.textContent = UI_TEXT.clearFilter;
    els.tagClear.addEventListener("click", () => setTag(null));

    const groups = [
      ["theme", UI_TEXT.themesLabel],
      ["skill", UI_TEXT.skillsLabel],
    ];
    const wrap = els.tagBar.querySelector(".tag-bar__groups");
    groups.forEach(([family, label]) => {
      const tags = TAGS.filter((t) => t.family === family);
      if (!tags.length) return;
      const group = make("div", "tag-group");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", label);
      const heading = make("span", "tag-group__label", label);
      heading.setAttribute("aria-hidden", "true");
      group.append(heading);
      tags.forEach((t) => {
        const b = make("button", "tag", t.label);
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", () => setTag(state.tag === t.id ? null : t.id));
        group.append(b);
        els.tagButtons.set(t.id, b);
      });
      wrap.append(group);
    });
  }

  function setTag(id) {
    state.tag = id;
    els.tagButtons.forEach((b, tid) => b.setAttribute("aria-pressed", String(tid === id)));
    applyFilter();
  }

  // Items that light up for the active tag. Personal items only count once
  // the visitor has crossed the wall.
  function litItems() {
    if (!state.tag) return [];
    return ITEMS.filter((it) =>
      it.tags.includes(state.tag) &&
      els.itemSlots.has(it.id) &&
      (it.layer !== "personal" || state.crossed));
  }

  function applyFilter() {
    const lit = litItems();
    const litIds = new Set(lit.map((it) => it.id));
    document.body.classList.toggle("is-filtering", !!state.tag);
    const matchText = state.tag ? ` (matches ${tagById.get(state.tag).label})` : "";
    els.itemButtons.forEach((b, id) => {
      const lit = litIds.has(id);
      b.classList.toggle("is-lit", lit);
      b.setAttribute("aria-label", b.dataset.label + (lit ? matchText : ""));
    });

    state.edges = constellation(lit);

    if (state.tag) {
      const label = tagById.get(state.tag).label;
      const eraCount = new Set(lit.map(depthOfItem)).size;
      els.tagStatus.textContent = lit.length
        ? `${label}: ${lit.length} ${lit.length === 1 ? "item" : "items"} across ` +
          `${eraCount} ${eraCount === 1 ? "era" : "eras"}`
        : UI_TEXT.noMatches.replace("{tag}", label);
    } else {
      els.tagStatus.textContent = "";
    }
    els.tagClear.hidden = !state.tag;
    drawLines();
  }

  // Where an item sits when the whole map is zoomed all the way out. Using
  // this fixed frame keeps each constellation's shape stable while zooming.
  function refPoint(it) {
    const [x, y] = els.itemSlots.get(it.id);
    const s = Math.pow(ZOOM_FACTOR, -depthOfItem(it));
    return [(x - 50) * 1.6 * s, (y - 50) * s];
  }

  // Lines for the lit items: within each era, the shortest set of lines that
  // joins them; between eras, one line from each era to the next one in time.
  function constellation(items) {
    const byDepth = new Map();
    items.forEach((it) => {
      const d = depthOfItem(it);
      if (!byDepth.has(d)) byDepth.set(d, []);
      byDepth.get(d).push(it);
    });
    const groups = [...byDepth.keys()].sort((a, b) => a - b).map((d) => byDepth.get(d));

    const edges = groups.flatMap(spanningTree);
    for (let g = 1; g < groups.length; g++) {
      let best = null;
      groups[g - 1].forEach((a) => groups[g].forEach((b) => {
        const [p, q] = [refPoint(a), refPoint(b)];
        const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (!best || d < best.d) best = { d, a, b };
      }));
      edges.push([best.a, best.b]);
    }
    return edges;
  }

  // Minimum spanning tree (Prim's algorithm) over a handful of items.
  function spanningTree(items) {
    if (items.length < 2) return [];
    const pts = items.map(refPoint);
    const inTree = [true];
    const best = pts.map((p) => Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]));
    const from = pts.map(() => 0);
    const edges = [];
    for (let n = 1; n < pts.length; n++) {
      let k = -1;
      for (let i = 0; i < pts.length; i++) {
        if (!inTree[i] && (k < 0 || best[i] < best[k])) k = i;
      }
      inTree[k] = true;
      edges.push([items[from[k]], items[k]]);
      for (let i = 0; i < pts.length; i++) {
        const d = Math.hypot(pts[i][0] - pts[k][0], pts[i][1] - pts[k][1]);
        if (!inTree[i] && d < best[i]) {
          best[i] = d;
          from[i] = k;
        }
      }
    }
    return edges;
  }

  let lineColor = "rgba(255, 255, 255, 0.5)";

  function resizeLines() {
    const css = getComputedStyle(document.documentElement).getPropertyValue("--constellation").trim();
    if (css) lineColor = css;
    const dpr = window.devicePixelRatio || 1;
    els.lines.width = Math.round(innerWidth * dpr);
    els.lines.height = Math.round(innerHeight * dpr);
    els.lines.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLines();
  }

  function starCenter(id) {
    const star = els.itemButtons.get(id)?.querySelector(".item__star");
    if (!star) return null;
    const r = star.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  // Redrawn every animation frame, so the lines follow the zoom.
  function drawLines() {
    const ctx = els.lines.getContext("2d");
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (!state.edges.length) return;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    state.edges.forEach(([a, b]) => {
      const p = starCenter(a.id);
      const q = starCenter(b.id);
      if (!p || !q) return;
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
    });
    ctx.stroke();
  }

  // -------------------------------------------------------------------------
  // Item panel
  // -------------------------------------------------------------------------

  function markSelected(id, on) {
    const b = els.itemButtons.get(id);
    if (!b) return;
    b.classList.toggle("is-selected", on);
    b.setAttribute("aria-expanded", String(on));
  }

  function openPanel(it) {
    const p = els.panel;
    const parent = itemById.get(it.parent);

    if (state.openItem) markSelected(state.openItem.id, false);
    state.openItem = it;
    markSelected(it.id, true);

    p.querySelector(".panel__era").textContent = ERAS[depthOfItem(it)].label;
    p.querySelector(".panel__parent").textContent =
      it.layer === "personal" && parent ? `${UI_TEXT.beneathLabel}: ${parent.title}` : "";
    p.querySelector(".panel__title").textContent = it.title;

    const summary = p.querySelector(".panel__summary");
    summary.textContent = it.summary;
    summary.classList.toggle("placeholder", hasPlaceholderText(it.summary));

    const body = p.querySelector(".panel__body");
    body.replaceChildren(...String(it.body || "").split(/\n\s*\n/).filter(Boolean).map((para) => {
      const el = make("p", null, para.trim());
      if (hasPlaceholderText(para)) el.classList.add("placeholder");
      return el;
    }));

    const tags = p.querySelector(".panel__tags");
    tags.replaceChildren(...it.tags.map((id) => make("li", null, tagById.get(id)?.label ?? id)));
    tags.hidden = it.tags.length === 0;

    // Personal items beneath this one (only once the wall is crossed).
    const children = p.querySelector(".panel__children");
    const kids = state.crossed ? ITEMS.filter((c) => c.parent === it.id) : [];
    children.replaceChildren();
    if (kids.length) {
      children.append(make("h3", null, UI_TEXT.beneathThis));
      kids.forEach((c) => {
        const b = make("button", "btn", c.title);
        b.type = "button";
        b.addEventListener("click", () => go(c.id));
        children.append(b);
      });
    }

    const back = p.querySelector(".panel__back");
    back.hidden = !(it.layer === "personal");
    back.textContent = UI_TEXT.backToProfessional;
    back.onclick = () => go(parent ? parent.id : ERAS[WALL_DEPTH - 1].id);

    p.hidden = false;
    p.scrollTop = 0;
    requestAnimationFrame(() => p.classList.add("is-open"));
    p.querySelector(".panel__title").focus({ preventScroll: true });
  }

  function closePanel() {
    const it = state.openItem;
    if (!it) return;
    state.openItem = null;

    const hadFocus = els.panel.contains(document.activeElement);
    els.panel.classList.remove("is-open");
    els.panel.hidden = true;

    const btn = els.itemButtons.get(it.id);
    markSelected(it.id, false);
    if (hadFocus) {
      const target = btn && !btn.closest("[inert]") ? btn : els.eraTitles[state.level];
      target.focus({ preventScroll: true });
    }
  }

  // -------------------------------------------------------------------------
  // The wall
  // -------------------------------------------------------------------------

  function openWall(targetId) {
    state.pendingWall = targetId;
    if (!els.wall.open) els.wall.showModal();
  }

  function crossWall() {
    state.crossed = true;
    saveCrossed();
    document.body.classList.add("wall-crossed");
    applyFilter(); // personal items can light up now
    const target = state.pendingWall;
    state.pendingWall = null;
    els.wall.close();
    if (target) go(target);
  }

  function declineWall() {
    state.pendingWall = null;
    if (els.wall.open) els.wall.close();
    // Back to the starting view. If the URL itself points past the wall
    // (a shared link), replace it rather than adding a history entry.
    const startId = ERAS[START_DEPTH].id;
    const r = routeFor(currentHashId());
    if (r && r.era >= WALL_DEPTH) location.replace("#" + startId);
    else go(startId);
  }

  function renderWall() {
    els.wall.querySelector(".wall__text").textContent = UI_TEXT.wallPrompt;
    const yes = els.wall.querySelector('[data-wall="yes"]');
    const no = els.wall.querySelector('[data-wall="no"]');
    yes.textContent = UI_TEXT.wallYes;
    no.textContent = UI_TEXT.wallNo;
    yes.addEventListener("click", crossWall);
    no.addEventListener("click", declineWall);
    // Escape counts as "No".
    els.wall.addEventListener("cancel", (e) => { e.preventDefault(); declineWall(); });
  }

  // -------------------------------------------------------------------------
  // URLs. The hash is the source of truth: #college, #now, #thesis, ...
  // go() is what every control calls; route() applies whatever the URL says.
  // -------------------------------------------------------------------------

  function currentHashId() {
    try { return decodeURIComponent(location.hash.slice(1)); } catch (e) { return ""; }
  }

  function routeFor(id) {
    if (!id) return { era: START_DEPTH, item: null };
    if (eraDepth.has(id)) return { era: eraDepth.get(id), item: null };
    const it = itemById.get(id);
    return it ? { era: depthOfItem(it), item: it } : null;
  }

  function go(id) {
    const r = routeFor(id);
    if (!r) return;
    if (r.era >= WALL_DEPTH && !state.crossed) return openWall(id);
    if (currentHashId() === id) route(false);
    else location.hash = id;
  }

  function route(instant) {
    let r = routeFor(currentHashId());
    if (!r) {
      // Unknown hash: drop it and show the starting view.
      history.replaceState(null, "", location.pathname + location.search);
      r = routeFor("");
    }
    if (r.era >= WALL_DEPTH && !state.crossed) return openWall(currentHashId());
    if (els.wall.open) {
      state.pendingWall = null;
      els.wall.close();
    }
    moveTo(r.era, instant);
    if (r.item) openPanel(r.item);
    else closePanel();
  }

  // +1 = zoom in (back in time), -1 = zoom out (forward in time).
  function step(dir) {
    const target = clamp(state.level + dir, 0, MAX_DEPTH);
    if (target !== state.level) go(ERAS[target].id);
  }

  // -------------------------------------------------------------------------
  // Inputs
  // -------------------------------------------------------------------------

  // One wheel gesture = one step. A gesture ends after a short pause, which
  // keeps trackpad momentum from skipping through several eras at once.
  const wheel = { acc: 0, used: false, timer: 0 };

  function onWheel(e) {
    // Scrollable areas (the item panel) keep their normal scrolling.
    if (e.target.closest && e.target.closest("[data-scrollable]")) return;
    e.preventDefault();
    if (els.wall.open) return;

    clearTimeout(wheel.timer);
    wheel.timer = setTimeout(() => {
      wheel.acc = 0;
      wheel.used = false;
    }, 180);
    if (wheel.used) return;

    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    wheel.acc += e.deltaY * unit;
    if (Math.abs(wheel.acc) < 30) return;

    let zoomIn;
    if (e.ctrlKey) zoomIn = wheel.acc < 0; // trackpad pinch: spreading fingers zooms in
    else zoomIn = WHEEL_DOWN_ZOOMS_IN ? wheel.acc > 0 : wheel.acc < 0;

    wheel.used = true;
    step(zoomIn ? 1 : -1);
  }

  function onKey(e) {
    if (els.wall.open) return; // the dialog handles its own keys
    if (e.key === "Escape" && state.openItem) {
      e.preventDefault();
      go(ERAS[state.level].id);
      return;
    }
    if (e.key === "Escape" && state.tag) {
      e.preventDefault();
      setTag(null);
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser zoom alone
    const t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (t.closest && t.closest("[data-scrollable]")) return; // let the panel scroll

    switch (e.key) {
      case "+":
      case "=":
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        step(1);
        break;
      case "-":
      case "_":
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        step(-1);
        break;
    }
  }

  // Touch: pinch to zoom (spread = back in time), or swipe up/down like the
  // scroll wheel. One step per gesture. Only on the map itself, so the tag
  // row and the panel keep their own scrolling.
  const touch = { fingers: 0, startDist: 0, x: 0, y: 0, used: false };
  const fingerGap = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  function onTouchStart(e) {
    touch.fingers = e.touches.length;
    touch.used = false;
    if (e.touches.length === 2) {
      touch.startDist = fingerGap(e.touches);
    } else if (e.touches.length === 1) {
      touch.x = e.touches[0].clientX;
      touch.y = e.touches[0].clientY;
    }
  }

  function onTouchMove(e) {
    if (els.wall.open) return;
    if (e.touches.length === 2) {
      e.preventDefault(); // this pinch zooms the map, not the page
      if (touch.used || !touch.startDist) return;
      const ratio = fingerGap(e.touches) / touch.startDist;
      if (ratio > 1.25 || ratio < 0.8) {
        touch.used = true;
        step(ratio > 1 ? 1 : -1);
      }
    } else if (e.touches.length === 1 && touch.fingers === 1 && !touch.used) {
      const dx = e.touches[0].clientX - touch.x;
      const dy = e.touches[0].clientY - touch.y;
      if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx) * 1.5) {
        e.preventDefault();
        touch.used = true;
        // Dragging down is like scrolling up.
        const scrollUp = dy > 0;
        step((WHEEL_DOWN_ZOOMS_IN ? !scrollUp : scrollUp) ? 1 : -1);
      }
    }
  }

  function bindInputs() {
    els.stage.addEventListener("touchstart", onTouchStart, { passive: true });
    els.stage.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", () => route(false));
    window.addEventListener("resize", resizeLines);
    els.zoomIn.addEventListener("click", () => step(1));
    els.zoomOut.addEventListener("click", () => step(-1));
    els.panel.querySelector(".panel__close").addEventListener("click", () => go(ERAS[state.level].id));
  }

  // -------------------------------------------------------------------------
  // Start
  // -------------------------------------------------------------------------

  document.documentElement.style.setProperty("--zoom-factor", ZOOM_FACTOR);
  document.body.classList.toggle("wall-crossed", state.crossed);
  renderSettings();
  renderEras();
  renderNav();
  renderTagBar();
  renderWall();
  bindInputs();
  resizeLines();
  Starfield.init(els.sky);
  setActive(state.level);
  applyCamera(state.z);
  route(true);
})();
