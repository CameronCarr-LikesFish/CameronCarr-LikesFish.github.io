# Changelog

A record of every change to [Cam Carr's site](https://cameroncarr-likesfish.github.io/), newest first. Each entry says **what** changed and **why**, because the reasons are the interesting part: most changes came from Cam reacting to what she saw.

**How entries work**
- Grouped by date. Within a day, each release lists its commits (`abc1234`), so any change can be traced in the repository history.
- *Added / Changed / Removed / Fixed* say what happened. **Why** gives the intent.
- **Maintaining it:** every change published with `git push` gets an entry here, in the same commit or the next one. Decisions still open are listed under *Open*, at the top.

---

## Open (not yet decided or done)

- **Tone:** trim superlatives the design review flagged. "First woman president" and "a club first" each appear twice. Also "only a handful of history students…", "Florida's first non-binary YMCA camp counselor", and a self-assessment line in the Positive AI Labs item.
- **An honest note that Claude built the site and the words are Cam's.** The authenticity note names AI as part of the problem, so saying this plainly turns a tension into a strength.
- **The Awards tag:** keep, rename, or drop it. The review felt it reads as a trophy case.
- **A Future item on the work Cam wants next** (from the interview).
- **Interview topics still to cover:** Youth in Government (and which item it belongs behind), why Law, History, and Society, and the fish story.
- **Pinned for near the end:**
  - A short first-visit note explaining that scrolling zooms in and out, deferred while the design keeps changing.
  - The thesis's Vanderbilt repository link, for when that site works again.
- **Smaller:** whether "No, take me back" at the Personal window should return to Now (current) or to Vanderbilt.

---

## 2026-09-30

### Declutter, and open on Now (`2a5b299`, `ccbdfca`, `9ba9fc3`, `3ac1bd6`, `41197eb`)

**Changed**
- **The site opens on Now** instead of Vanderbilt. The first screen has Cam's name, tagline, contact links, the globe, and her current AI work.
- **The header belongs to Now.** Name and pronouns show everywhere. The tagline and contact links show only in Now and fade out in the other eras. The separate "Cameron Carr" line is gone.
- **Items on the map show titles only.** Summaries live in each item's panel, and screen readers still hear them as the item's description.
- **Map simplified:** only Florida and Tennessee have borders, both the same quiet light outline with a faint tint. Other state lines are gone.
- **Florida on the globe** is a quiet outline, not a bright pink fill.

**Removed**
- The top-right "You are in" box. It stays for screen readers only; the big era title and the timeline already say where you are.
- The TENNESSEE and FLORIDA map labels. Real places stay marked: Nashville, Gainesville, Fort Myers, and a small "Florida" on the globe.

**Tried and reverted**
- Text-only items, with no dots at rest (`41197eb`, reverted in `3ac1bd6`). The dots over the map read like pins ("this happened here"), but taking them away worked less well. The map was quietened instead.

**Why:** Cam found the screen "very crowded", and she felt her present-day self (name, tagline, how to reach her) belongs in Now. Opening there puts the professional picture on the first screen. That was the brief's 10-second goal and the design review's top concern.

### Fixes from an outside design review (`d217290`)

A separate Claude agent reviewed the site as a critical outside reader (hiring manager and designer) and reported ranked issues. Cam approved all the bug and polish fixes.

**Fixed**
- **A dark stripe across the globe.** When the globe rocked far enough, land running behind its edge filled as a band across the face. Land now follows the globe's edge where it passes out of sight. Checked at every rock angle.
- **A blank start in a zero-size window,** e.g. a tab opened in the background. Drawing is now skipped until there's a size, and a starfield failure can no longer stop the rest of the site from starting.
- **The opening line felt stuck.** It's shorter (2.5 s) and no longer swallows the first click or scroll.
- **A placeholder showing on the live site** (Youth in Government).
- **Vanderbilt Gaming tense:** past tense throughout, since Cam has graduated.

**Added**
- **A tagline under the name:** "Vanderbilt '26 history honors grad, pursuing questions of human flourishing in a world increasingly shaped by AI." (Cam's idea. "Increasingly shaped by AI" replaced her tentative "AI dominated".)
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
- **Family roots** (behind the meditation club): her dad's words on hard nights, "may you be well, may you be loved."
- **Years of play** (behind Vanderbilt Gaming): from Pokémon Pearl and *Super Mario Galaxy* to finding lifelong friends through Minecraft chat, and being "the best worst player."
- **Common ground,** a new item behind Vanderbilt Gaming: holding her ground as a transgender player until the club became inclusive (including the university's "no consequences" answer), and what a team with deep differences taught her about bridging divides.
- **Vanderbilt Gaming (professional):** grew out of the League of Legends club; handed to its first woman president, with a board close to evenly split by gender.

**Changed**
- **Short names in "Behind: …" labels** (e.g. "Behind: Vanderbilt Gaming").
- **Roomier layout** for eras with four or five items.

**Why:** these came from interview-style conversations. Claude drafted from Cam's answers, trimming without polishing, and she approved each piece before it went live. She chose to include being transgender and the university's response: "part of authenticity."

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

**Why:** Cam wanted the scale to be real places from her life (Florida until high school, Tennessee for college, then the world), and she asked why everything had to stay centred.

### From boxes to a cosmos (`c91c3e3`, `c4bd633`)

**Changed**
- **"Beneath the wall" became "Personal"** ("Thoughts, history, and reasons"). Personal items now say "Behind: …".
- **The square era boxes were replaced** by a minimal cosmos drawn in code. It started centred on Earth, then moved to the Sun: "the world isn't centred on me."
- **Most NASA photos were removed** as too noisy.

**Added**
- **The authenticity note.** A one-time opening line ("Through our own authenticity we may see the world's beauty.") and "A note on authenticity" in the window before the Personal side.

**Why:** "beneath the wall" felt odd. Cam wanted the site to answer what she sees as a crisis of authenticity: people pressured to present a manicured, exceptional self instead of a real one.

### NASA backgrounds and link previews (`abf3277`)

**Added**
- **A NASA photo for each era,** ordered far to near: Webb's First Deep Field, the Cosmic Cliffs, the Pillars of Creation, and the Orion Nebula.
- **Link-preview tags and a preview image,** so shared links look right on LinkedIn and elsewhere.

**Why:** Cam asked whether the most beautiful NASA images could serve as backgrounds. She kept one (Orion), and it was removed later in favour of the ocean.

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
