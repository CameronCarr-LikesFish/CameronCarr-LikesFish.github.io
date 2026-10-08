/* main.js: zoom, navigation, and state.
   Reads everything it shows from content.js
   (SETTINGS, ERAS, START_ERA, UI_TEXT, ITEMS, DETAILS). */

(function () {
  "use strict";

  // How much smaller each earlier era is than the one around it.
  const ZOOM_FACTOR = 3.5;
  // The figure's height in px at the Future (depth 0), and how much it grows
  // with each step into the past.
  const FIGURE_BASE = 26;
  const FIGURE_GROWTH = 1.46;
  // Length of a one-step zoom, in ms. Multi-step jumps take a little longer.
  const STEP_MS = 700;
  // false: map convention, scroll up zooms in (back in time).
  // true: scroll down zooms in.
  const WHEEL_DOWN_ZOOMS_IN = false;

  const MAX_DEPTH = ERAS.length - 1;
  const eraDepth = new Map(ERAS.map((e, i) => [e.id, i]));
  const itemById = new Map(ITEMS.map((it) => [it.id, it]));
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
    figure: document.querySelector(".figure"),
    zoomHint: document.querySelector(".zoom-hint"),
    eras: [],
    eraTitles: [],
    navButtons: [],
    itemButtons: new Map(),
    itemSlots: new Map(),  // item id -> [x%, y%] within its era
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
    document.title = SETTINGS.displayName;
    document.querySelector(".identity__name").textContent = SETTINGS.displayName;
    document.querySelector(".identity__pronouns").textContent = SETTINGS.pronouns;
    document.querySelector(".identity__full").textContent = SETTINGS.fullName;
    document.querySelector(".identity__tagline").textContent = SETTINGS.tagline || "";
    document.querySelector(".identity__seeking").textContent = SETTINGS.seeking || "";
    document.querySelector(".resume-link").textContent = UI_TEXT.resumeLink || "Resume";
    renderContact();
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
    B: [50, 76],
  };
  // Which slots to use for n items: spread out vertically so taller items
  // (e.g. personal ones with a "Behind:" line) don't collide.
  const SLOT_SETS = {
    1: ["L2"], 2: ["L2", "R2"], 3: ["L2", "R2", "B"],
    4: ["L1", "L3", "R1", "R3"], 5: ["L1", "L3", "R1", "R3", "B"],
    6: ["L1", "L2", "L3", "R1", "R2", "R3"], 7: ["L1", "L2", "L3", "R1", "R2", "R3", "B"],
  };

  // Pick balanced slots for n items, returned in reading order
  // (left column top to bottom, then bottom center, then right column).
  function slotsFor(n) {
    let names = SLOT_SETS[n] ? SLOT_SETS[n].slice() : SLOT_SETS[7].concat("L4", "R4").slice(0, n);
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

    const parent = itemById.get(it.parent);
    if (it.layer === "personal" && parent) {
      b.append(make("span", "item__parent", `${UI_TEXT.beneathLabel}: ${parent.short || parent.title}`));
    }
    b.append(make("span", "item__title", it.title));
    const summary = make("span", "item__summary", it.summary);
    if (hasPlaceholderText(it.summary)) summary.classList.add("placeholder");
    summary.id = "summary-" + it.id;
    b.append(summary);

    // Screen readers hear the title (and what it sits beneath) as the name,
    // and the summary as the description.
    b.dataset.label = it.layer === "personal" && parent
      ? `${it.title}, ${UI_TEXT.beneathLabel.toLowerCase()} ${parent.short || parent.title}`
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
      if (era.place) head.append(make("p", "sr-only", `Map: ${era.place}`));
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
      const b = make("button", "era-nav__btn", era.short || era.label);
      if (era.short) b.setAttribute("aria-label", era.label);
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
        : clamp(1 + t * 1.3, 0, 1);      // inner eras stay hidden until you zoom toward them
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
    const detailFade = clamp((k - 0.15) / 0.6, 0, 1);
    const ds = Math.pow(ZOOM_FACTOR, k - 1);
    els.detail.style.transform =
      `translate(${px * m * (1 - k)}px, ${py * m * (1 - k)}px) scale(${ds})`;
    els.detail.style.opacity = detailFade.toFixed(3);
    els.detail.style.visibility = detailFade < 0.01 ? "hidden" : "visible";

    els.nav.style.setProperty("--pos", (MAX_DEPTH - z).toFixed(4));
    els.figure.style.setProperty("--figure-h", (FIGURE_BASE * Math.pow(FIGURE_GROWTH, z)).toFixed(2) + "px");
    Starfield.setDepth(z + k * 0.6);
    placeFigure(z + k * 0.6);
  }

  // At the Future level, the small figure walks out of its corner and stands
  // on Earth's horizon, right of centre, looking up at the open sky (as in
  // the link-preview image). Elsewhere it rests in its corner.
  const FIGURE_HORIZON_X = 0.68;        // where it stands, as a fraction of screen width
  let figureRest = null;                // its resting { left, bottom }, in px

  function placeFigure(depth) {
    if (typeof Cosmos === "undefined" || !Cosmos.groundAt) return;
    const f = els.figure;
    if (figureRest == null) {
      f.style.left = f.style.bottom = "";
      const cs = getComputedStyle(f);
      figureRest = { left: parseFloat(cs.left) || 0, bottom: parseFloat(cs.bottom) || 0 };
    }
    const width = f.getBoundingClientRect().width;
    const weight = Cosmos.groundAt(innerWidth / 2, innerWidth, innerHeight, depth).weight;
    if (weight <= 0) {
      f.style.left = f.style.bottom = "";
      return;
    }
    const left = figureRest.left + (innerWidth * FIGURE_HORIZON_X - width / 2 - figureRest.left) * weight;
    const g = Cosmos.groundAt(left + width / 2, innerWidth, innerHeight, depth);
    const bottom = g.y == null ? figureRest.bottom
      : figureRest.bottom + (innerHeight - g.y - figureRest.bottom) * weight;
    f.style.left = left.toFixed(1) + "px";
    f.style.bottom = bottom.toFixed(1) + "px";
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
    // The header shows the tagline and contact links only in Now (styles.css).
    document.body.dataset.era = era.id;
    els.posSub.textContent = inDetail ? SUBZOOMS[detailId].title : era.subtitle;
    els.posSky.textContent = era.sky
      ? `${UI_TEXT.skyLabel || "Sky"}: ${era.sky.title} · ${era.sky.credit}`
      : "";

    if (hint.shown && (level !== hint.level || inDetail)) hideHint(true);

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
      g.entries.forEach((c) => {
        const li = make("li", "course");
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
      it.layer === "personal" && parent ? `${UI_TEXT.beneathLabel}: ${parent.short || parent.title}` : "";
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

    const slot = els.itemSlots.get(it.id);
    p.classList.toggle("panel--left", !!slot && slot[0] > 50);
    positionPanel();
    p.hidden = false;
    p.scrollTop = 0;
    requestAnimationFrame(() => p.classList.add("is-open"));
    p.querySelector(".panel__title").focus({ preventScroll: true });
  }

  // A left-side panel must clear the header (name, tagline, contact). The
  // CSS gives a safe default; this fits it exactly when the header can be
  // measured. Re-run on resize.
  function positionPanel() {
    const p = els.panel;
    p.style.top = "";
    p.style.maxHeight = "";
    if (!p.classList.contains("panel--left") || window.matchMedia("(max-width: 700px)").matches) return;
    // Outside Now the header shows only the name, so clear just that.
    const header = document.body.dataset.era === "now" ? ".site-header" : ".identity";
    const bottom = document.querySelector(header).getBoundingClientRect().bottom;
    if (!(bottom > 0)) return;
    const top = Math.round(bottom + 12);
    p.style.top = `${top}px`;
    p.style.maxHeight = `calc(100vh - ${top}px - 6rem)`;
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
    const target = state.pendingWall;
    state.pendingWall = null;
    els.wall.close();
    if (target) go(target);
  }

  function declineWall() {
    state.pendingWall = null;
    if (els.wall.open) els.wall.close();
    // Stay where you were: the camera never moved for the prompt. Only a URL
    // that itself points past the wall (a shared link) needs somewhere else
    // to land, so it's replaced with the starting view.
    const r = routeFor(currentHashId());
    if (r && r.era >= WALL_DEPTH) location.replace("#" + ERAS[START_DEPTH].id);
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
  const OPENING_MS = 2500;
  const DISMISS_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"];

  // Returns true if the line is showing (the zoom hint waits for it).
  function showOpening() {
    if (!UI_TEXT.openingLine || els.wall.open) return false;
    try {
      if (sessionStorage.getItem(OPENING_KEY)) return false;
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
      setTimeout(showHint, 500);
    }
    timer = setTimeout(close, OPENING_MS);
    DISMISS_EVENTS.forEach((t) => window.addEventListener(t, close, { capture: true, passive: true }));
    return true;
  }

  // -------------------------------------------------------------------------
  // The zoom hint: on a first visit, a short note beside the + and − buttons
  // on how to move through time. It goes away after the first zoom and stays
  // away for the rest of the visit.
  // -------------------------------------------------------------------------

  const HINT_KEY = "camcar.hintDone";
  const hint = { shown: false, level: null };

  function showHint() {
    if (hint.shown || state.detail || els.wall.open) return;
    try { if (sessionStorage.getItem(HINT_KEY)) return; } catch (e) { /* show it */ }
    const touchFirst = window.matchMedia("(pointer: coarse)").matches;
    const how = touchFirst
      ? UI_TEXT.hintTouch
      : WHEEL_DOWN_ZOOMS_IN
        ? "Scroll down to go back in time, up to go forward."
        : UI_TEXT.hintScroll;
    els.zoomHint.replaceChildren(
      make("span", "zoom-hint__how", how),
      make("span", "zoom-hint__buttons", UI_TEXT.hintButtons));
    els.zoomHint.hidden = false;
    hint.shown = true;
    hint.level = state.level;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      els.zoomHint.classList.add("is-shown");
      document.body.classList.add("hint-on");
    }));
  }

  // done: the visitor has zoomed, so don't show it again this visit.
  function hideHint(done) {
    if (!hint.shown) return;
    hint.shown = false;
    if (done) {
      try { sessionStorage.setItem(HINT_KEY, "1"); } catch (e) { /* memory only */ }
    }
    els.zoomHint.classList.remove("is-shown");
    document.body.classList.remove("hint-on");
    setTimeout(() => { if (!hint.shown) els.zoomHint.hidden = true; }, 600);
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
  // scroll wheel. One step per gesture. Only on the map itself, so the
  // panel keeps its own scrolling.
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
      figureRest = null;
      positionPanel();
      applyCamera();
    });
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
  renderWall();
  bindInputs();
  try {
    Starfield.init(els.sky, { zoomFactor: ZOOM_FACTOR });
  } catch (err) {
    console.error("Starfield failed to start:", err);  // the site still works without it
  }
  setActive(state.level, null);
  applyCamera();
  route(true);
  if (!showOpening()) setTimeout(showHint, 700);
})();
