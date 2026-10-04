/* resume.js: fills resume.html from content.js (SETTINGS, RESUME).
   Edit the words in content.js; this file only lays them out. */

(function () {
  "use strict";

  function make(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }

  function link(href, text) {
    const a = make("a", null, text);
    a.href = href;
    if (/^https?:/.test(href)) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    return a;
  }

  // ----- Top bar -----
  document.querySelector('[data-label="back"]').textContent = "← " + RESUME.backLabel;
  const print = document.querySelector('[data-label="print"]');
  print.textContent = RESUME.printLabel;
  print.addEventListener("click", () => window.print());

  // ----- Name, tagline, contact -----
  document.title = `${SETTINGS.displayName}: Resume`;
  document.querySelector(".head__name").textContent = SETTINGS.displayName;
  // "Cameron Carr · she/they", as in the link-preview image.
  const aka = [SETTINGS.fullName, SETTINGS.pronouns].filter((s) => s && s !== SETTINGS.displayName);
  document.querySelector(".head__aka").textContent = aka.join(" · ");
  document.querySelector(".head__tagline").textContent = SETTINGS.tagline || "";

  const contact = document.querySelector(".head__contact");
  function addContact(el) {
    const li = document.createElement("li");
    li.append(el);
    contact.append(li);
  }
  // Assembled at runtime, like the main page, so the address isn't in the HTML.
  const [user, domain] = SETTINGS.email.split("@");
  const email = user + "@" + domain;
  addContact(link("mail" + "to:" + email, email));
  if (SETTINGS.showPhone && SETTINGS.phone) {
    addContact(link("tel:+1" + SETTINGS.phone.replace(/\D/g, ""), SETTINGS.phone));
  }
  // Written out in full, so the links still work on a printed copy.
  const bare = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  if (/^https?:/.test(SETTINGS.linkedin)) addContact(link(SETTINGS.linkedin, bare(SETTINGS.linkedin)));
  if (SETTINGS.github && !/PLACEHOLDER/.test(SETTINGS.github)) {
    const gh = /^https?:/.test(SETTINGS.github) ? SETTINGS.github : "https://github.com/" + SETTINGS.github;
    addContact(link(gh, bare(gh)));
  }
  if (RESUME.site) addContact(link("https://" + RESUME.site + "/", RESUME.site));

  // ----- Sections -----
  const sections = document.querySelector(".sections");
  for (const sec of RESUME.sections) {
    const s = make("section", "section");
    s.append(make("h2", "section__heading", sec.heading));

    if (sec.list) {
      s.append(make("p", "section__list", sec.list.join(" · ")));
    }

    for (const en of sec.entries || []) {
      const e = make("div", "entry");
      const top = make("div", "entry__top");
      const what = make("p", "entry__what");
      what.append(make("span", "entry__title", en.title));
      if (en.org) what.append(make("span", "entry__org", en.org));
      top.append(what);
      if (en.dates) top.append(make("p", "entry__dates", en.dates));
      e.append(top);

      if (en.bullets && en.bullets.length) {
        const ul = make("ul", "entry__bullets");
        for (const b of en.bullets) ul.append(make("li", null, b));
        e.append(ul);
      }
      if (en.link) {
        const p = make("p", "entry__link");
        p.append(link(en.link.url, en.link.label));
        e.append(p);
      }
      s.append(e);
    }
    sections.append(s);
  }
})();
