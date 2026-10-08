# Changelog

A record of every change to [Cam Carr's site](https://cameroncarr-likesfish.github.io/), newest first. Each entry says **what** changed and **why**, because the reasons are the interesting part: most changes came from Cam reacting to what they saw.

**How entries work**
- Grouped by date. Within a day, each release lists its commits (`abc1234`), so any change can be traced in the repository history.
- *Added / Changed / Removed / Fixed* say what happened. **Why** gives the intent.
- **Maintaining it:** every change published with `git push` gets an entry here, in the same commit or the next one. Decisions still open are listed under *Open*, at the top.

---

## Open (not yet decided or done)

- **An honest note that Claude built the site and the words are Cam's.** The authenticity note names AI as part of the problem, so saying this plainly turns a tension into a strength.
- **Interview topics still to cover:** why Law, History, and Society, and the fish story. (Youth in Government is on the resume now; its map item could grow from the same answers.)
- **The thesis's Vanderbilt repository link,** for when that site works again.
- **Cam's new resume** is coming; the resume page will be updated from it.
- **A custom domain,** once one is registered and verified.

---

## 2026-10-08 (evening)

### An introduction on the opening card

**Added**
- The first-visit card now introduces the site above the quote: "This is Cam Carr's personal website. Zoom in and out to navigate between different eras of my life and career." It stays up for 7 seconds instead of 2.5 (there's more to read), and still goes away at the first click, scroll, or key.

**Why:** Cam wanted visitors to know straight away what the site is and how to move around it.

---

## 2026-10-08 (later)

### From Cam's career profile; portfolio projects; zoom bubbles; steadier scrolling  (`b2cc543`, `aed9b4e`)

**Added**
- **Speech bubbles beside the + and − buttons** saying where each one goes from here, e.g. "Zoom in to see my time at Vanderbilt" and "Zoom out to see my hopes and dreams". They change with the era, and clicking one zooms. They're hidden in short windows, where they'd cover the cards. On screens up to 1200px wide, the + and − buttons sit just above the timeline so the bubbles can't run into it, and the first-visit scroll hint shows only on wider screens, where it has room.
- **ScrimStats** is described as tracking "overly negative critique aimed at teammates" (Cam's wording).
- **How I work** (Now): Cam's one-line summary, their strengths (spotting cracks early, building process, judgment at volume, leading people, learning fast), what they enjoy, and "I'm not a coder or a technical researcher. I want to be the person who makes the research and the organization run."
- **Where I want to be** (Goals, hopes, and dreams): one, two, and five years out, and the kinds of roles that fit best.
- **Portfolio projects** now describes three projects: this site, ScrimStats (with a link to its code), and Open Loops.
- **Moving to the Berkeley area in mid-November 2026, available to start right away,** under the header in Now and on the resume.

**Changed**
- **Pronouns are they/them** everywhere: the header, the resume, the link-preview image, and this site's notes.
- **The Resume button shows in every era again** (it had moved to Now only on 2026-10-07).
- **Positive AI Labs ended on October 2, 2026:** the item and the resume are in the past tense, with the end date.
- **Positive AI Labs:** first to flag that the benchmark's source material was running out, and a proposed fix that became the team's method; a five-step AI pipeline; confidential pre-release material.
- **Sociology AI Lab:** the IRB protocol and CITI certification.
- **Vanderbilt Gaming:** 100+ active members and several hundred involved; teams consistently beat higher-ranked opponents.
- **The thesis card** reads "Honors thesis: The Soul of Transhumanism".
- **The resume** adds the Human Flourishing discussion groups and a Tools line, and drops the coursework list (the site has its own coursework view) to stay on one page.
- **Scrolling:** after a scroll or swipe moves one era, more scrolling is ignored for 1.2 seconds (and until the gesture stops), so a long trackpad flick can't skip an era by accident. The buttons and keys aren't affected.

**Why:** Cam shared their career profile to fold into the site, asked for a guard against accidental skipping, and wanted something on screen that invites people to zoom.

---

## 2026-10-08

### No more tags; simpler grades (`8d16730`)

**Removed**
- **Tags,** everywhere: the "Filter by tag" button, the tag list in each item's panel, and the tags on items. A view listing everything with one tag, from the future back to the past, was built and tried first. With only a few items per tag it showed too little, so the tags went instead.

**Changed**
- **Coursework grades** are shown as plain letter grades, without plus or minus, at Cam's request ("so arbitrary"). Independent Research shows its final grade. The transcript has the exact grades.
- On phones, the + and − buttons and the figure sit lower now that the tag button is gone.

**Fixed**
- The desktop zoom hint sits just above the + and − buttons, so it can't overlap the timeline in a narrower window.

---

## 2026-10-07

### Cards instead of pins; portfolio and resume in Now (`85c465c`)

**Changed**
- **Items are cards** instead of glowing dots with labels. On a map, a dot above a label reads as a location pin ("this happened here"). Taking the dots away on their own (tried on 2026-09-30) made the titles stop looking clickable; cards fix both. "Selected coursework" says "Zoom in" on its card.
- **Portfolio projects moved to Now** (from Goals, hopes, and dreams), and dropped "in progress" from the name. The projects are current work, not a hope.
- **The Resume button lives in Now,** with the rest of the present-day header, instead of showing in every era.
- **A faded card comes back up on hover** while a tag filter is on, so it's clear it can still be opened.

**Removed**
- **Constellation lines,** everywhere: between matching items when a tag is on, and between the courses in the coursework view. The tag filter still lights up matching cards.

**Why:** Cam found the dots read as location pins. They compared three options (the dots, a small star beside each title, and cards) and chose cards.

---

## 2026-10-05

### Polish: a zoom hint, finer maps, a quieter filter (`9a64020`)

**Added**
- **A first-visit hint** beside the + and − buttons: "Scroll up to go back in time, down to go forward. Or use the + and − buttons." (On phones: swipe or pinch.) The buttons glow softly while it shows, and it goes away after the first zoom.
- **What Cam is looking for,** under their tagline in Now and on the resume: "Looking for frontier work that advances society in a prosocial way."

**Changed**
- **Finer coastlines up close.** Vanderbilt and Personal now use Natural Earth's 1:50m coasts instead of a coarse outline of the whole Americas, so Florida's outline lines up with the land under it.
- **Vanderbilt is framed tighter,** so Tennessee reads as the subject instead of the whole continent.
- **The tag bar is one "Filter by tag" button.** The tags open above it and close after a pick.
- **The figure walks out onto the horizon** in Goals, hopes, and dreams, right of centre (as in the link-preview image), and is a little taller there.
- **"No, take me back"** at the Personal window now keeps you where you were, instead of jumping to Now.
- "Goals, hopes, and dreams" fits on one line. "Back to the professional side" has a solid backing, so map lines don't run through it.

**Removed (superlatives)**
- "Which only a handful of history students receive each year" (thesis).
- "No other Vanderbilt Gaming league team… has reached the quarterfinals", which repeated "a club first".
- "First woman president" from the Vanderbilt Gaming item. It stays in "Common ground", where the story earns it.
- The self-assessment after "the only intern to receive a contract extension" (Positive AI Labs).

**Why:** the design review's main finding was that visitors couldn't tell the map zooms. The rest are its polish notes, plus superlatives Cam agreed to trim. "Florida's first non-binary YMCA camp counselor" stays: Cam reaffirmed it.

---

## 2026-10-04

### A plain resume, one click away (`21057e3`)

**Added**
- **A Resume button** in the top right, visible in every era.
- **A resume page** (`resume.html`): a traditional one-column resume on a light page. It covers education, experience, leadership, training, and selected coursework, with contact links. "Print or save as PDF" gives a clean, one-page letter-size copy. The text lives in `content.js` (`RESUME`), like everything else. It uses the same facts as the map, in resume wording, and leaves out the personal side.

**Fixed**
- **Vanderbilt Gaming, corrected by Cam.** The board they led was male-dominated, and mostly chosen before their time. It was not "close to evenly split by gender", as the site said. They raised up younger, more diverse members to take over, and the board is now far more balanced by gender and race. The Vanderbilt Gaming item and "Common ground" now say this. Their roles are also corrected: Vice President sophomore year, co-president junior year, and President senior year.

**Why:** not every visitor wants to explore a zoomable map. A hiring reader who wants the usual one-page view can now get it in one click, from anywhere on the site. Writing the resume also surfaced the wrong board claim, which Cam corrected.

---

## 2026-09-30

### Declutter, and open on Now (`2a5b299`, `ccbdfca`, `9ba9fc3`, `3ac1bd6`, `41197eb`)

**Changed**
- **The site opens on Now** instead of Vanderbilt. The first screen has Cam's name, tagline, contact links, the globe, and their current AI work.
- **The header belongs to Now.** Name and pronouns show everywhere. The tagline and contact links show only in Now and fade out in the other eras. The separate "Cameron Carr" line is gone.
- **Items on the map show titles only.** Summaries live in each item's panel, and screen readers still hear them as the item's description.
- **Map simplified:** only Florida and Tennessee have borders, both the same quiet light outline with a faint tint. Other state lines are gone.
- **Florida on the globe** is a quiet outline, not a bright pink fill.

**Removed**
- The top-right "You are in" box. It stays for screen readers only; the big era title and the timeline already say where you are.
- The TENNESSEE and FLORIDA map labels. Real places stay marked: Nashville, Gainesville, Fort Myers, and a small "Florida" on the globe.

**Tried and reverted**
- Text-only items, with no dots at rest (`41197eb`, reverted in `3ac1bd6`). The dots over the map read like pins ("this happened here"), but taking them away worked less well. The map was quietened instead.

**Why:** Cam found the screen "very crowded", and they felt their present-day self (name, tagline, how to reach them) belongs in Now. Opening there puts the professional picture on the first screen. That was the brief's 10-second goal and the design review's top concern.

### Fixes from an outside design review (`d217290`)

A separate Claude agent reviewed the site as a critical outside reader (hiring manager and designer) and reported ranked issues. Cam approved all the bug and polish fixes.

**Fixed**
- **A dark stripe across the globe.** When the globe rocked far enough, land running behind its edge filled as a band across the face. Land now follows the globe's edge where it passes out of sight. Checked at every rock angle.
- **A blank start in a zero-size window,** e.g. a tab opened in the background. Drawing is now skipped until there's a size, and a starfield failure can no longer stop the rest of the site from starting.
- **The opening line felt stuck.** It's shorter (2.5 s) and no longer swallows the first click or scroll.
- **A placeholder showing on the live site** (Youth in Government).
- **Vanderbilt Gaming tense:** past tense throughout, since Cam has graduated.

**Added**
- **A tagline under the name:** "Vanderbilt '26 history honors grad, pursuing questions of human flourishing in a world increasingly shaped by AI." (Cam's idea. "Increasingly shaped by AI" replaced their tentative "AI dominated".)
- **A README** on what the site is and how it was made with Claude Code.
- **Screen readers hear what each map shows,** e.g. "Map: Tennessee, with Nashville marked".

**Changed**
- **Panels open on the side away from the item,** so they don't cover the column you were reading, and they sit below the header.
- **Contrast:** a slightly deeper ocean and brighter secondary text.
- **On phones:** larger "Behind:" labels, and the duplicate era label is hidden.
- **Nashville and Tennessee labels** no longer collide.
- **A new link-preview image** in the current style: a small figure on Earth's horizon under a night sky, with the tagline.

**Why:** the review found strong craft and writing, but a professional picture that didn't come through quickly, plus two real rendering bugs. These are its bug and polish recommendations. Its content suggestions are listed under *Open*.

---

## 2026-09-28

### The personal side, in Cam's words (`da1623f`)

**Added**
- **Personal stakes** (behind the thesis): why transhumanism is personal, a family experience of illness, and *Fullmetal Alchemist*'s idea of transcending one's mistakes.
- **Family roots** (behind the meditation club): their dad's words on hard nights, "may you be well, may you be loved."
- **Years of play** (behind Vanderbilt Gaming): from Pokémon Pearl and *Super Mario Galaxy* to finding lifelong friends through Minecraft chat, and being "the best worst player."
- **Common ground,** a new item behind Vanderbilt Gaming: holding their ground as a transgender player until the club became inclusive (including the university's "no consequences" answer), and what a team with deep differences taught them about bridging divides.
- **Vanderbilt Gaming (professional):** grew out of the League of Legends club; handed to its first woman president, with a board close to evenly split by gender.

**Changed**
- **Short names in "Behind: …" labels** (e.g. "Behind: Vanderbilt Gaming").
- **Roomier layout** for eras with four or five items.

**Why:** these came from interview-style conversations. Claude drafted from Cam's answers, trimming without polishing, and they approved each piece before it went live. They chose to include being transgender and the university's response: "part of authenticity."

### Goals, hopes, and dreams; hometowns (`0383c39`)

**Changed**
- The outermost era "Future" is now **Goals, hopes, and dreams** ("Hopes & dreams" on the narrow timeline).

**Added**
- **Gainesville and Fort Myers** marked on the Florida view, where Cam grew up and went to high school.

### Never leave Earth (`deabc81`)

**Changed**
- **Goals, hopes, and dreams** is now Earth's curved horizon at night, with a thin line of atmosphere and a wide sky. The small figure stands on the horizon, looking up.
- **Now** is the whole Earth, rocking gently back and forth (never turning home out of view), with Florida marked because Cam is back there.

**Removed**
- The solar system.

**Why:** zooming out past Earth felt "arrogant". The brief always said the cosmic feeling should come from how much lies ahead, never from self-importance. The horizon view is the brief's original image of a tiny figure looking up.

### A new name, and a calmer globe (`5445413`, `cde1317`)

**Changed**
- **"Cam Carr", two words,** not "Camcar", everywhere: the tab title, the link previews, and the preview image. It was a misreading carried over from the brief.
- **The globe** has blue oceans and darker land. Up close, the ocean surrounds Florida and Tennessee.
- **Future subtitle:** "I hope to learn more than I'll ever know."

**Removed**
- The last NASA photograph (Orion, behind Florida). Cam preferred plain ocean blue.

### Zooming through real places (`fcce328`)

**Added**
- **A map under the site, drawn in code** (`cosmos.js`, with simplified public-domain outlines in `geo.js`). Personal is Florida, Vanderbilt is Tennessee, and Now is the globe.
- **Each level has its own focus,** so the view drifts sideways as it zooms instead of staying pinned to one centre.
- **Inner eras no longer preview** in the centre of the screen.

**Why:** Cam wanted the scale to be real places from their life (Florida until high school, Tennessee for college, then the world), and they asked why everything had to stay centred.

### From boxes to a cosmos (`c91c3e3`, `c4bd633`)

**Changed**
- **"Beneath the wall" became "Personal"** ("Thoughts, history, and reasons"). Personal items now say "Behind: …".
- **The square era boxes were replaced** by a minimal cosmos drawn in code. It started centred on Earth, then moved to the Sun: "the world isn't centred on me."
- **Most NASA photos were removed** as too noisy.

**Added**
- **The authenticity note.** A one-time opening line ("Through our own authenticity we may see the world's beauty.") and "A note on authenticity" in the window before the Personal side.

**Why:** "beneath the wall" felt odd. Cam wanted the site to answer what they see as a crisis of authenticity: people pressured to present a manicured, exceptional self instead of a real one.

### NASA backgrounds and link previews (`abf3277`)

**Added**
- **A NASA photo for each era,** ordered far to near: Webb's First Deep Field, the Cosmic Cliffs, the Pillars of Creation, and the Orion Nebula.
- **Link-preview tags and a preview image,** so shared links look right on LinkedIn and elsewhere.

**Why:** Cam asked whether the most beautiful NASA images could serve as backgrounds. They kept one (Orion), and it was removed later in favour of the ocean.

### Filling in the content (`6f0194c`)

**Changed**
- **Removed "The startup"** from the Future ("just ideas for now; it's distracting").
- **The portfolio item** starts with this site, with a link to its code.
- **"Teaching meditation"** tells the whole thread, from a father's blend of Buddhist and Christian practice to the MMTCP and the hope of teaching meditation to help people heal.
- **Reflections in Cam's words** for the Chancellor's Scholarship and the MMTCP.
- **Graduation** is May 2026.
- **Vanderbilt Gaming:** the role timeline, plus the League of Legends NECC quarterfinals record.
- **The Fish tag is gone;** a new Awards tag takes its place.

---

## 2026-09-27

### Resume content, the coursework sub-zoom, and git (`2acc54f`, `04ce17b`, `e0c612d`)

**Added**
- **Every Vanderbilt and Now item filled in** from Cam's resume and transcript, plus a new item for the Sociology AI Lab research assistantship.
- **The coursework sub-zoom:** "Selected coursework" opens into its own small sky of 22 courses in five constellations, with grades.
- **The thesis PDF,** hosted with the site. The signed approval page was removed because it carries three professors' handwritten signatures.
- **Self-hosted fonts:** Cormorant Garamond and Inter.
- **Item links:** buttons in panels, e.g. "Read the thesis".

**Changed**
- **Vanderbilt Gaming:** President, Coach & Captain; 300+ members (400+ on Discord); the quarterfinals record.
- **Publishing moved from web uploads to git.** Commits use GitHub's private no-reply address, so Cam's email isn't in the public history.

**Removed**
- **The phone number,** for privacy: blanked in the files too, not just hidden.

### First publish (`8d133c4`, `05c938c`, `792b7ee`, `df1944b`)

- Cam uploaded the site to GitHub Pages through the website.
- The repository name first had a stray trailing period, which put the site at the wrong address. Renaming it fixed the address.
- The font and PDF uploads landed at the top level, and `2acc54f` moved them into place.

### Before version control: the build (phases 1–5 of the brief)

Built locally from the brief, with a check-in with Cam after each phase:

1. **Skeleton and zoom:** four eras as nested boxes, and stepped zoom by scroll wheel, buttons, and keyboard.
2. **Items, the wall, and URLs:** item panels, the "want to see what's underneath?" prompt, and a link for every era and item, with back-button support.
3. **Tags and constellations:** a tag bar, and lines joining matching items across eras. Personal items light up only after the wall is crossed.
4. **Visual style:** a generative starfield, a small figure that shrinks toward the future, a rose accent, and a calm night palette.
5. **Accessibility and mobile:** pinch and swipe, a phone layout, full keyboard use, reduced-motion fades, and screen-reader labels.

**Decisions along the way:**
- Scrolling follows the map convention: scroll up to zoom in, back in time.
- The era nav became a timeline along the bottom, with the past on the left.
