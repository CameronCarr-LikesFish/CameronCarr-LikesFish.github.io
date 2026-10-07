# Cam Carr: a map of a life

Live at **https://cameroncarr-likesfish.github.io/**

A personal site for Cam Carr (Cameron Carr, she/they), a 2026 Vanderbilt graduate in Law, History, and Society with Honors in History. It is a zoomable map: zooming out moves forward in time, and zooming in moves back.

| Era | The map shows |
|---|---|
| **Goals, hopes, and dreams** | Earth's curved horizon at night, with a small figure standing on it under a wide sky |
| **Now** | The whole Earth, gently rocking, with Florida marked (home again). This is where the site opens, with her name, tagline, the work she's looking for, contact links, her resume, and her portfolio projects. |
| **Vanderbilt** | The Southeast, with Tennessee outlined and Nashville marked: the professional core of her college years |
| **Personal** | Florida, where she grew up. It sits behind a short note on authenticity, and holds the stories behind the professional items. |

## Getting around

- **Scroll** to move through time: scroll up to go back (zoom in), down to go forward (zoom out). On a phone, swipe or pinch.
- **The + and − buttons** (bottom right) do the same, one step at a time. So do the arrow keys and the + and − keys.
- **The timeline** along the bottom jumps straight to any era.
- On a first visit, a short hint beside the + and − buttons explains this. It goes away after the first zoom.
- **Items** are small cards that open into panels. "Selected coursework" zooms into its own view of the courses.
- **Explore by tag** (bottom centre, or the tags in any item's panel) opens everything with that tag, from the future back to the past, e.g. `#tag-leadership`. Each entry jumps to its item on the map.
- **Resume** (top right, in Now) opens a plain, one-page resume for visitors who'd rather not zoom. It prints cleanly or saves as a PDF.

## How it was made

The site was built with **Claude Code** from a written brief, in short working sessions across several days.

- **The brief** set the concept: a zoomable map of a life, with the professional picture readable in 10 seconds. It also set six build phases: skeleton and zoom; items, the wall, and URLs; tags and constellations; visual style; accessibility and mobile; deploy.
- **Check-ins.** Each phase ended with a check-in with Cam in a browser before moving on. Every decision went into a running log, so any new session could pick up where the last one stopped.
- **Iteration, led by Cam's reactions.** Some examples:
  - The scroll direction changed to follow maps.
  - NASA photographs were tried as backgrounds and removed as too noisy.
  - The zoom first went out to the solar system. Cam pulled it back to Earth, because going further felt arrogant.
  - "Beneath the wall" became "Personal", with a note on authenticity in front of it.
- **The words are Cam's.** The personal stories come from interview-style conversations. Claude drafted text from her answers and trimmed it without polishing it up, and Cam approved each piece before it went live.
- **An outside critique.** A separate Claude agent reviewed the design and quality as a critical outside reader. Its findings led to fixes: a rendering bug on the globe, a startup edge case, panel placement, contrast, and a clearer introduction line.

Every change, and the reason for it, is recorded in [CHANGELOG.md](CHANGELOG.md).

## How it works

Plain HTML, CSS, and JavaScript, with no framework and no build step.

| File | What it does |
|---|---|
| `index.html` | Page structure and link-preview tags |
| `content.js` | **All text and settings**: eras, items, tags, the coursework sub-zoom, the resume, interface text. Editing words never means touching layout code. |
| `main.js` | Zoom, navigation, URLs (every era, item, and tag has its own `#link`), panels, the tag views, the wall prompt, the zoom hint, keyboard, touch, and reduced-motion handling |
| `cosmos.js` | The map under the content, drawn on a canvas: an orthographic Earth, state outlines, the horizon. Each level has its own focus, so the view drifts as it zooms. |
| `starfield.js` | Generative stars from a fixed seed, so the sky is the same on every visit |
| `geo.js` | Simplified map outlines (generated): world land, US states, and finer North American coasts for the close views |
| `styles.css` | All colours and fonts as CSS variables |
| `resume.html`, `resume.js`, `resume.css` | The plain resume page, filled from `RESUME` in `content.js`, with print styles for one letter-size page |

It's designed to be accessible:
- Keyboard navigation with visible focus.
- Screen-reader labels and live regions.
- Fades instead of zooms for visitors who ask for reduced motion.
- Pinch and swipe on phones.

To run it locally, open `index.html`, or serve the folder with `python -m http.server`.

## Credits

- Fonts: [Cormorant Garamond](https://github.com/CatharsisFonts/Cormorant) and [Inter](https://rsms.me/inter/), both under the SIL Open Font License. The license files are in `fonts/`.
- Map data, public domain: US state shapes from the US Census Bureau (via [us-atlas](https://github.com/topojson/us-atlas)), and world land from [Natural Earth](https://www.naturalearthdata.com/) (via [world-atlas](https://github.com/topojson/world-atlas); the 1:50m coasts for the close views).
