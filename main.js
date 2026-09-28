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
  // The innermost era is the personal side, behind the wall prompt.
  const WALL_DEPTH = eraDepth.get("personal") ?? MAX_DEPTH;
  const depthOfItem = (it) => (it.layer === "personal" ? WALL_DEPTH : eraDepth.get(it.era));

  // Sub-zooms from content.js (DETAILS is optional there).
  const SUBZOOMS = typeof DETAILS !== "undefined" ? DETAILS : {};

  const WALL_KEY = "camcar.wallCrossed";

  const state = {
    level: START_DEPTH, // the era we're at or heading to (integer depth)
    z: START_DEPTH,     // the camera's current depth (continuous, animates)
    raf: 0,
    crossed: loadCrossed(),
    openItem: null,
    pendingWall: null,  // where to go if the visitor says yes at the wall
    k: 0,               // sub-zoom amount (see applyCamera)
    detail: null,       // id of the item whose sub-zoom is open, or null
    anchor: null,       // item the sub-zoom zooms toward (kept while closing)
    tag: null,          // the active tag filter, or null
    edges: [],          // constellation lines for the active tag: [itemA, itemB]
  };

  const els = {
    stage: document.getElementById("stage"),
    world: document.getElementById("world"),
    detail: document.getElementById("detail"),
    detailScroll: document.querySelector(".detail__scroll"),
    sky: document.getElementById("sky"),
    nav: document.querySelector(".era-nav"),
    navList: document.querySelector(".era-nav__list"),
    posEra: document.querySelector(".position__era"),
    posSub: document.querySelector(".position__sub"),
    posSky: document.querySelector(".position__sky"),
    zoomIn: document.querySelector('[data-zoom="in"]'),
    zoomOut: document.querySelector('[data-zoom="out"]'),
    panel: document.querySelector(".panel"),
    wall: document.querySelector(".wall"),
    opening: document.querySelector(".opening"),
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
    if (SUBZOOMS[it.id]) {
      // Opens its own sub-zoom rather than the text panel.
      b.classList.add("item--zoomable");
      b.setAttribute("aria-controls", "detail");
    } else {
      b.setAttribute("aria-controls", "panel");
    }
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

      // The era's NASA photograph, faint behind the generative stars.
      if (era.sky && era.sky.image) {
        const sky = make("div", "era__sky");
        sky.style.backgroundImage = `url("${era.sky.image}")`;
        sky.setAttribute("aria-hidden", "true");
        el.append(sky);
      }

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

      els.world.append(el);
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

  // The camera has two numbers, both animated:
  //   state.z  depth through the eras (0 = Future, MAX_DEPTH = innermost)
  //   state.k  how far we've zoomed into one item's own sky (0 = not, 1 = in)
  //
  // An era at depth d is scaled by ZOOM_FACTOR^(z - d): 1 when we're at it,
  // larger when we've zoomed past it into the past, smaller when it's still
  // ahead of us. For a sub-zoom, the whole world also grows toward the item
  // (state.anchor) while the item's sky opens out of it.
  function applyCamera() {
    const { z, k } = state;
    els.eras.forEach((el, d) => {
      const t = z - d;
      const scale = Math.pow(ZOOM_FACTOR, t);
      const opacity = t >= 0
        ? clamp(1 - t * 1.9, 0, 1)       // outer eras fade quickly as they grow past us
        : clamp(1 + t * 0.6, 0, 1);      // the next era in is a faint preview; beyond that, gone
      el.style.transform = `scale(${scale})`;
      // An era's photo shows only while that era fills the view.
      el.style.setProperty("--sky-fade", t >= 0 ? "1" : clamp(1 + t * 1.6, 0, 1).toFixed(3));
      el.style.opacity = opacity.toFixed(3);
      el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
    });

    // Sub-zoom. [px, py] is the anchor item's offset from the screen center.
    const [px, py] = anchorOffset();
    const m = Math.pow(ZOOM_FACTOR, k);
    const worldFade = clamp(1 - k * 1.6, 0, 1);
    els.world.style.transform = k ? `translate(${-px * m * k}px, ${-py * m * k}px) scale(${m})` : "";
    els.world.style.opacity = k ? worldFade.toFixed(3) : "";
    els.lines.style.opacity = k ? worldFade.toFixed(3) : "";
    const detailFade = clamp((k - 0.15) / 0.6, 0, 1);
    const ds = Math.pow(ZOOM_FACTOR, k - 1);
    els.detail.style.transform =
      `translate(${px * m * (1 - k)}px, ${py * m * (1 - k)}px) scale(${ds})`;
    els.detail.style.opacity = detailFade.toFixed(3);
    els.detail.style.visibility = detailFade < 0.01 ? "hidden" : "visible";

    els.nav.style.setProperty("--pos", (MAX_DEPTH - z).toFixed(4));
    els.figure.style.setProperty("--figure-h", (FIGURE_BASE * Math.pow(FIGURE_GROWTH, z)).toFixed(2) + "px");
    Starfield.setDepth(z + k * 0.6);
    drawLines();
  }

  function anchorOffset() {
    const slot = state.anchor && els.itemSlots.get(state.anchor);
    if (!slot) return [0, 0];
    return [(slot[0] - 50) / 100 * innerWidth, (slot[1] - 50) / 100 * innerHeight];
  }

  // Update everything that depends on where the camera is headed: which era
  // is current, and whether we're inside an item's sub-zoom.
  function setActive(level, detailId) {
    const era = ERAS[level];
    const inDetail = !!detailId;
    const focusWasInMap = els.stage.contains(document.activeElement) ||
      els.detail.contains(document.activeElement);

    els.eras.forEach((el, d) => {
      const active = d === level && !inDetail;
      el.classList.toggle("is-active", active);
      el.inert = !active;
      if (active) el.removeAttribute("aria-hidden");
      else el.setAttribute("aria-hidden", "true");
    });
    els.detail.inert = !inDetail;
    document.body.classList.toggle("in-detail", inDetail);

    els.navButtons.forEach((b, d) => {
      if (d === level) b.setAttribute("aria-current", "location");
      else b.removeAttribute("aria-current");
    });

    els.posEra.textContent = era.label;
    els.posSub.textContent = inDetail ? SUBZOOMS[detailId].title : era.subtitle;
    els.posSky.textContent = era.sky
      ? `${UI_TEXT.skyLabel || "Sky"}: ${era.sky.title} · ${era.sky.credit}`
      : "";

    els.zoomIn.setAttribute("aria-disabled", String(inDetail || level >= MAX_DEPTH));
    els.zoomOut.setAttribute("aria-disabled", String(!inDetail && level <= 0));

    // If focus was on something that just went inert, move it somewhere sensible.
    if (focusWasInMap) {
      (inDetail ? els.detail.querySelector(".detail__title") : els.eraTitles[level])
        .focus({ preventScroll: true });
    }
  }

  // For visitors who ask their system for reduced motion: a short fade out,
  // a jump to the new view, and a fade back in, instead of the zoom.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const FADE_MS = 160;
  let fadeTimer = 0;

  function fadeCamera(z, k) {
    cancelAnimationFrame(state.raf);
    clearTimeout(fadeTimer);
    document.body.classList.add("is-fading");
    fadeTimer = setTimeout(() => {
      state.z = z;
      state.k = k;
      applyCamera();
      document.body.classList.remove("is-fading");
    }, FADE_MS);
  }

  // Move the camera to era `level`, zoomed into item `detailId` (or null).
  function moveTo(level, detailId, instant) {
    level = clamp(level, 0, MAX_DEPTH);
    detailId = detailId || null;
    const toK = detailId ? 1 : 0;
    const changed = level !== state.level || detailId !== state.detail;

    if (detailId) {
      state.anchor = detailId;
      renderDetail(detailId);
    }
    state.level = level;
    state.detail = detailId;
    if (changed || instant) setActive(level, detailId);

    if (instant) {
      cancelAnimationFrame(state.raf);
      state.z = level;
      state.k = toK;
      applyCamera();
      return;
    }
    if (!changed) return;
    if (reducedMotion.matches) return fadeCamera(level, toK);

    const from = { z: state.z, k: state.k };
    const distance = Math.abs(level - from.z) + Math.abs(toK - from.k);
    const duration = STEP_MS * (0.6 + 0.4 * distance);
    const start = performance.now();

    cancelAnimationFrame(state.raf);
    function frame(now) {
      const e = easeInOut(Math.min(1, (now - start) / duration));
      state.z = from.z + (level - from.z) * e;
      state.k = from.k + (toK - from.k) * e;
      applyCamera();
      if (e < 1) state.raf = requestAnimationFrame(frame);
    }
    state.raf = requestAnimationFrame(frame);
  }

  // -------------------------------------------------------------------------
  // Sub-zooms (DETAILS in content.js)
  // -------------------------------------------------------------------------

  let renderedDetail = null;

  function renderDetail(id) {
    if (renderedDetail === id) return;
    renderedDetail = id;
    els.detailScroll.scrollTop = 0;
    const data = SUBZOOMS[id];
    const item = itemById.get(id);
    const eraLabel = ERAS[depthOfItem(item)].label;
    const root = els.detail;

    const back = root.querySelector(".detail__back");
    back.textContent = "← " + UI_TEXT.backFromDetail.replace("{era}", eraLabel);
    back.onclick = () => go(ERAS[depthOfItem(item)].id);
    root.querySelector(".detail__title").textContent = data.title;
    root.querySelector(".detail__subtitle").textContent = data.subtitle || "";
    root.querySelector(".detail__stats").replaceChildren(
      ...(data.stats || []).map((s) => make("li", null, s)));

    const groups = root.querySelector(".detail__groups");
    groups.replaceChildren(...data.groups.map((g, gi) => {
      const section = make("section", "cluster");
      const headingId = `cluster-${id}-${gi}`;
      const h = make("h3", "cluster__label", g.label);
      h.id = headingId;
      const list = make("ol", "cluster__list");
      list.setAttribute("aria-labelledby", headingId);
      g.entries.forEach((c, ci) => {
        const li = make("li", "course");
        li.style.setProperty("--dx", CLUSTER_OFFSETS[ci % CLUSTER_OFFSETS.length] + "px");
        const star = make("span", "course__star");
        star.setAttribute("aria-hidden", "true");
        const top = make("span", "course__top");
        top.append(make("span", "course__name", c.name));
        if (c.grade) {
          const grade = make("span", "course__grade", c.grade.replace(/-/g, "−"));
          grade.setAttribute("aria-label", "Grade " + c.grade.replace(/-/g, " minus").replace(/\+/g, " plus"));
          top.append(grade);
        }
        const meta = make("span", "course__meta", [c.code, c.term].filter(Boolean).join(" · "));
        li.append(star, top, meta);
        list.append(li);
      });
      section.append(h, list);
      return section;
    }));
    requestAnimationFrame(drawClusterLines);
  }

  // Each list's stars sit at slightly different offsets, joined by a thin
  // line, so every group reads as a small constellation.
  const CLUSTER_OFFSETS = [6, 17, 3, 13, 8, 19];

  function drawClusterLines() {
    els.detail.querySelectorAll(".cluster__list").forEach((list) => {
      list.querySelector(".cluster__lines")?.remove();
      // Measure on screen, then undo the layer's current zoom scale.
      const lr = list.getBoundingClientRect();
      const sc = lr.width / list.offsetWidth || 1;
      const pts = [...list.querySelectorAll(".course__star")].map((s) => {
        const r = s.getBoundingClientRect();
        return `${((r.left + r.width / 2 - lr.left) / sc).toFixed(1)},` +
               `${((r.top + r.height / 2 - lr.top) / sc).toFixed(1)}`;
      });
      if (pts.length < 2) return;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "cluster__lines");
      svg.setAttribute("aria-hidden", "true");
      const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      line.setAttribute("points", pts.join(" "));
      svg.append(line);
      list.prepend(svg);
    });
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

    const links = p.querySelector(".panel__links");
    const validLinks = (it.links || []).filter((l) => l && l.url && !isPlaceholder(l.url));
    links.replaceChildren(...validLinks.map((l) => {
      const li = document.createElement("li");
      const a = make("a", "btn btn--primary", `${l.label || "Open link"} ↗`);
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener";
      li.append(a);
      return li;
    }));
    links.hidden = validLinks.length === 0;

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
    els.wall.querySelector(".wall__title").textContent = UI_TEXT.wallTitle || "";
    els.wall.querySelector(".wall__note").replaceChildren(
      ...(UI_TEXT.wallNote || []).map((t) => make("p", null, t)));
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
  // The opening line: once per visit, over the map. It fades on its own after
  // a few seconds, or as soon as the visitor clicks, scrolls, or presses a key.
  // -------------------------------------------------------------------------

  const OPENING_KEY = "camcar.openingSeen";
  const OPENING_MS = 4200;
  const DISMISS_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"];

  function showOpening() {
    if (!UI_TEXT.openingLine || els.wall.open) return;
    try {
      if (sessionStorage.getItem(OPENING_KEY)) return;
      sessionStorage.setItem(OPENING_KEY, "1");
    } catch (e) { /* private mode: show it anyway */ }

    const el = els.opening;
    el.querySelector(".opening__line").textContent = UI_TEXT.openingLine;
    el.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-shown")));

    let timer = 0;
    function close() {
      clearTimeout(timer);
      DISMISS_EVENTS.forEach((t) => window.removeEventListener(t, close, true));
      el.classList.remove("is-shown");
      setTimeout(() => { el.hidden = true; }, 900);
    }
    timer = setTimeout(close, OPENING_MS);
    DISMISS_EVENTS.forEach((t) => window.addEventListener(t, close, { capture: true, passive: true }));
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
    if (!it) return null;
    return { era: depthOfItem(it), item: it, detail: SUBZOOMS[it.id] ? it.id : null };
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
    if (r.item && !r.detail) openPanel(r.item);
    else closePanel();
    moveTo(r.era, r.detail, instant);
  }

  // +1 = zoom in (back in time), -1 = zoom out (forward in time).
  function step(dir) {
    // Inside a sub-zoom, zooming out returns to the era; zooming in does nothing.
    if (state.detail) {
      if (dir < 0) go(ERAS[state.level].id);
      return;
    }
    const target = clamp(state.level + dir, 0, MAX_DEPTH);
    if (target !== state.level) go(ERAS[target].id);
  }

  // -------------------------------------------------------------------------
  // Inputs
  // -------------------------------------------------------------------------

  // One wheel gesture = one step. A gesture ends after a short pause, which
  // keeps trackpad momentum from skipping through several eras at once.
  const wheel = { acc: 0, used: false, timer: 0 };

  function canScroll(el, dy) {
    return dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
  }

  function onWheel(e) {
    // The first scroll just dismisses the opening line.
    if (!els.opening.hidden) {
      e.preventDefault();
      return;
    }
    const scroller = e.target.closest && e.target.closest("[data-scrollable]");
    const endGestureSoon = () => {
      clearTimeout(wheel.timer);
      wheel.timer = setTimeout(() => {
        wheel.acc = 0;
        wheel.used = false;
      }, 180);
    };
    // The item panel always keeps its own scrolling. A sub-zoom scrolls while
    // it can; a fresh gesture at its top or bottom zooms instead. A gesture
    // that started as a scroll never turns into a zoom.
    if (scroller && (scroller !== els.detailScroll || canScroll(scroller, e.deltaY))) {
      if (scroller === els.detailScroll) {
        wheel.used = true;
        endGestureSoon();
      }
      return;
    }
    e.preventDefault();
    if (els.wall.open) return;

    endGestureSoon();
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
    if (e.key === "Escape" && (state.openItem || state.detail)) {
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
    window.addEventListener("resize", () => {
      resizeLines();
      applyCamera();
      drawClusterLines();
    });
    document.fonts?.ready.then(drawClusterLines);
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
  Starfield.init(els.sky, { zoomFactor: ZOOM_FACTOR });
  setActive(state.level, null);
  applyCamera();
  route(true);
  showOpening();
})();
