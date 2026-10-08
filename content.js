/* content.js: all site content and settings.
   Edit text here. Nothing in this file controls layout.
   Anything marked [PLACEHOLDER: ...] is waiting for the owner to write it. */

// ---------------------------------------------------------------------------
// Settings. Every place the site shows the name, pronouns, or contact details
// reads from here.
// ---------------------------------------------------------------------------
const SETTINGS = {
  displayName: "Cam Carr",
  fullName: "Cameron Carr",
  tagline: "Vanderbilt \u201926 history honors grad, pursuing questions of human flourishing in a world increasingly shaped by AI.",
  // The work they're looking for: under the tagline in Now, and on the resume.
  seeking: "Looking for frontier work that advances society in a prosocial way.",
  // Where and when they can start: under the seeking line, and on the resume.
  // Time-bound: update or clear after the move (mid-November 2026).
  availability: "Moving to the Berkeley area in mid-November 2026, and available to start right away.",
  pronouns: "they/them",       // shown in the header; change here only
  email: "CameronCarr55@gmail.com",
  phone: "",                   // left blank on purpose: this file is public
  showPhone: false,            // set true (and fill in phone) to show a number
  linkedin: "https://www.linkedin.com/in/cam-carr-4432a0285/",
  github: "CameronCarr-LikesFish",
};

// ---------------------------------------------------------------------------
// Eras: the zoom levels, from outermost (zoomed out, the future) to innermost
// (zoomed in, the personal side). The site opens on START_ERA.
// ---------------------------------------------------------------------------
// short (optional): a shorter name for the timeline along the bottom.
// place (optional): what that era's map shows, read out to screen readers.
// see: how the zoom bubbles name this era ("Zoom in to see my time at Vanderbilt").
// sky (optional): a NASA photograph shown faintly behind the stars while that
// era is in view (public domain; credit shown on the page).
const ERAS = [
  { id: "future",   label: "Goals, hopes, and dreams", short: "Hopes & dreams", see: "my hopes and dreams",
    subtitle: "I hope to learn more than I'll ever know",
    place: "Earth's horizon at night, a small figure standing on it under a wide sky" },
  { id: "now",      label: "Now",        subtitle: "After graduation, 2026", see: "where I am now",
    place: "the whole Earth, with Florida lit" },
  { id: "college",  label: "Vanderbilt", subtitle: "Law, History, and Society", see: "my time at Vanderbilt",
    place: "Tennessee, with Nashville marked" },
  { id: "personal", label: "Personal",   subtitle: "Thoughts, history, and reasons", see: "the personal side",
    place: "Florida, with Gainesville and Fort Myers marked" },
];

const START_ERA = "now";   // the site opens on the present day

// ---------------------------------------------------------------------------
// Interface text: the wall prompt and a few labels.
// ---------------------------------------------------------------------------
const UI_TEXT = {
  // Shown once per visit, over the map, when the site first opens.
  openingLine: "Through our own authenticity we may see the world's beauty.",
  // The window before the personal side.
  wallTitle: "A note on authenticity",
  wallNote: [
    "We're living through a crisis of authenticity. Part of it is AI and social media. Part of it is a globalized, hypercompetitive world that pushes people to present a manicured, exceptional self instead of a real one.",
    "This site is my small answer to that. It's custom-made, and it has a personal side: my thoughts, some of my life history, and the reasons behind my interests and choices.",
    "People with deep authenticity have inspired me. I hope to be that kind of model, here and in every interaction I have.",
  ],
  wallPrompt: "Want to see the personal side?",
  wallYes: "Yes, show me",
  wallNo: "No, take me back",
  backToProfessional: "Back to the professional side",
  beneathLabel: "Behind",         // shown as "Behind: The Soul of Transhumanism"
  beneathThis: "The story behind this", // heading in a professional item's panel
  // The first-visit hint beside the + and − buttons. It goes away after the
  // first zoom.
  hintScroll: "Scroll up to go back in time, down to go forward.",
  hintTouch: "Swipe or pinch to move through time.",
  hintButtons: "Or use the + and − buttons.",
  // Speech bubbles beside the + and − buttons, naming where each one goes.
  zoomInBubble: "Zoom in to see {see}",
  zoomOutBubble: "Zoom out to see {see}",
  backFromDetail: "Back to {era}",  // button at the top of a sub-zoom
  skyLabel: "Sky",                  // "Sky: <photo title> · <credit>"
  resumeLink: "Resume",             // top right in Now: opens resume.html
};

// ---------------------------------------------------------------------------
// Items.
//   era:    future | now | college
//   layer:  professional | personal (personal items live in the Personal era)
//   parent: for personal items, the id of the professional item it hangs under
//   short:  optional shorter name, used where personal items say "Behind: …"
//   links:  optional list of { label, url }, shown as buttons in the item's panel
// ---------------------------------------------------------------------------
const ITEMS = [
  // ----- College (professional core) -----
  // Source: resume and transcript (2026). On-screen order: left column top
  // to bottom, then bottom center, then right column top to bottom.
  {
    id: "major",
    title: "B.A., Honors in History",
    short: "The major",            // used in "Behind: …" labels
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Law, History, and Society major. GPA 3.7, Dean's List every year.",
    body: "Bachelor of Arts in Law, History, and Society from Vanderbilt University's College of Arts and Science, May 2026, with Honors in History.\n\nGPA 3.7 out of 4.0, and on the Dean's List all four years (2022–2026).",
    image: null,
  },
  {
    id: "scholarship",
    title: "Chancellor's Scholarship",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "A full-ride scholarship to Vanderbilt, awarded 2022.",
    body: "Attended Vanderbilt on the Chancellor's Scholarship, a full-ride scholarship awarded in 2022.\n\nI'm deeply grateful for it. Someone out there valued the diversity work I'd done, and that work opened this door for me. When I think of the people I helped, I'm filled with gratitude for how it changed my own life, both materially, through the scholarship, and spiritually.",
    image: null,
  },
  {
    id: "thesis",
    title: "Honors thesis: The Soul of Transhumanism",
    short: "The thesis",            // used in "Behind: …" labels
    era: "college",
    layer: "professional",
    parent: null,
    summary: "A 100-page senior honors thesis on the history of transhumanist thought.",
    body: "Senior honors thesis in History, 2024–2026: \"The Soul of Transhumanism: Rationalism and Dissent in the Early History of Transhumanism.\" Advised by Dr. Ole Molvig.\n\nThe thesis traces rationalism, elitism, and gendered ideology in transhumanist thought, from early 20th-century British scientific socialists to today's Silicon Valley AI culture. It argues that the values embedded in AI culture are historically contingent, not neutral or inevitable, which speaks directly to whose values get encoded into AI systems.\n\nIt earned Honors in History.",
    // The PDF is hosted with the site (signed approval page removed). If the
    // Vanderbilt repository link becomes available, it can be added here too.
    links: [{ label: "Read the thesis (PDF)", url: "files/carr-soul-of-transhumanism.pdf" }],
    image: null,
  },
  {
    id: "research-assistant",
    title: "Research assistant, Sociology AI Lab",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Co-designed a study of how students experience AI-driven academic deskilling.",
    body: "Paid research assistant at Vanderbilt's Sociology AI Lab, August 2025 to May 2026.\n\nCo-designed a human subjects survey instrument with Prof. Davis and graduate researchers on student perceptions of AI-driven academic deskilling, and coordinated participant recruitment, data collection protocols, the IRB protocol, and workflows for an interdisciplinary team.\n\nCITI certified.",
    image: null,
  },
  {
    id: "classes",
    title: "Selected coursework",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Ethics of AI, AI in Social Systems, Human Flourishing, and more. Zoom in to explore.",
    body: "Ethics of Artificial Intelligence (A)\n\nArtificial Intelligence in Social Systems (A)\n\nHuman Flourishing (A)\n\nFormal Logic (A)\n\nStatistics for Social Scientists (A)\n\nAdvanced Asian Philosophy (A)",
    image: null,
  },
  {
    id: "meditation-club",
    title: "Founder, Meditation & Mindfulness Club",
    short: "The meditation club",            // used in "Behind: …" labels
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Built a student wellness program from scratch, 2024–2026.",
    body: "Founded Vanderbilt's Meditation and Mindfulness Club and built its student wellness program from scratch. Facilitated sessions and supported students through mental health challenges.",
    image: null,
  },
  {
    id: "gaming-coach",
    title: "President, Coach & Captain of Vanderbilt Gaming",
    short: "Vanderbilt Gaming",            // used in "Behind: …" labels
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Led a club of 100+ active members. Its League of Legends team reached the NECC quarterfinals or better every year, a club first.",
    body: "President, coach, and team captain of Vanderbilt Gaming, with 100+ active members and several hundred involved. Expanded Vanderbilt's League of Legends club into Vanderbilt Gaming. Team captain sophomore through junior year. On the board from sophomore year: Vice President sophomore year, co-president junior year, and President senior year. As coach, developed player skill, strategy, and team cohesion across Vanderbilt's competitive teams. Teams I led consistently beat higher-ranked opponents.\n\nPlayed on a League of Legends team that reached at least the quarterfinals of the NECC (National Esports Collegiate Conference) every year.\n\nRan the organization's operations and pushed to diversify a homogeneous board and membership into a more inclusive community, first as Vice President, where the diversity work was the explicit focus, and then as co-president and President. The board I led was male-dominated, and mostly chosen by the board before it, so I raised up younger, more diverse members to take things over. Its board is now far more balanced by gender and race. Also served as Event Chair.",
    image: null,
  },

  // ----- Now (post-graduation, 2026) -----
  // Four items: left column top to bottom, then right column.
  {
    id: "how-i-work",
    title: "How I work",
    era: "now",
    layer: "professional",
    parent: null,
    summary: "Operations and programs: spotting where systems break, building process, and helping people grow.",
    body: "I'm an operations and program person who learned startups by doing them, with a research background and a real commitment to AI safety. I notice where systems are breaking and fix them, and I'm good at helping people grow into their own ideas.\n\nSpotting cracks early. At Positive AI Labs I was the first to flag that the benchmark's source material was running out far faster than projected, and the first to propose fixes. A modified version of one of mine became the team's method.\n\nBuilding process. I designed a five-step AI pipeline that automated the slowest parts of our workflow.\n\nJudgment at volume. I was core QA on FlourishBench across complex human scenarios, handling confidential pre-release material.\n\nLeading people. I was president of Vanderbilt Gaming (100+ active members, several hundred involved), and teams I led consistently beat higher-ranked opponents. I created Vanderbilt Meditation and Mindfulness, and led extracurricular discussion groups for Vanderbilt's very popular Human Flourishing class.\n\nLearning fast. My role at PAL changed often and asked me to think on my feet, learn quickly, and wear many different hats.\n\nWhat I enjoy: untangling messy systems, building structure so work keeps running without me, connecting people, and mentoring early-stage people and organizations.\n\nI'm not a coder or a technical researcher. I want to be the person who makes the research and the organization run.",
    image: null,
  },
  {
    id: "positive-ai",
    title: "Operations intern, Positive AI Labs",
    era: "now",
    layer: "professional",
    parent: null,
    summary: "Core QA for FlourishBench, PAL's flagship AI benchmark. The only intern given a contract extension.",
    body: "Operations intern at Positive AI Labs, 2026 to October 2026.\n\nCore quality assurance for FlourishBench, PAL's flagship AI benchmark: reviewing and refining complex human scenarios for realism, nuance, and internal consistency before they enter the dataset, and handling confidential pre-release material.\n\nThe first to flag that the benchmark's source material was running out far faster than projected, and the first to propose fixes. A modified version of one became the team's method.\n\nDesigned a five-step AI pipeline that automated the slowest parts of the team's workflow, and built other AI-driven triggers and automations for routine operations. Organized and maintained datasets and internal information systems.\n\nThe role changed often: thinking on my feet, learning quickly, and wearing many hats.\n\nThe only intern to receive a contract extension.",
    image: null,
  },
  {
    id: "portfolio",
    title: "Portfolio projects",
    era: "now",
    layer: "professional",
    parent: null,
    summary: "This site, ScrimStats, and Open Loops, all built with Claude Code.",
    body: "This site: a map of a life that you move through by zooming, where zooming out moves forward in time. It was built from a written brief, and every change and the reason for it is in its changelog.\n\nScrimStats: a Windows app for reviewing my League of Legends team's scrim voice comms. It records each game's events, transcribes everyone's voice on the computer itself (in English and Mandarin), lines the two up on one clock, and tracks each player's communication habits over time: sharing information, shotcalling, talking over teammates, accountability, and overly negative critique aimed at teammates.\n\nOpen Loops: a to-do app for the things with no deadline. It opens when I sign in to my computer and hides each item behind a small word puzzle, so acknowledging it takes a moment of real attention instead of a reflex click. Every item has three honest ways out: I did it, it's still open, or I'm letting it go.",
    links: [
      { label: "See how this site is built", url: "https://github.com/CameronCarr-LikesFish/CameronCarr-LikesFish.github.io" },
      { label: "ScrimStats on GitHub", url: "https://github.com/CameronCarr-LikesFish/ScrimStats" },
    ],
    image: null,
  },
  {
    id: "mmtcp",
    title: "Mindfulness Meditation Teacher Certification",
    era: "now",
    layer: "professional",
    parent: null,
    summary: "Admitted in 2026 to the MMTCP with Jack Kornfield and Tara Brach, with a 75% scholarship.",
    body: "Admitted in 2026 to the Mindfulness Meditation Teacher Certification Program (MMTCP) led by Jack Kornfield and Tara Brach, with a 75% scholarship.\n\nThrough it, I hope to help people and to further explore my own psyche.",
    image: null,
  },

  // ----- Future -----
  {
    id: "where-next",
    title: "Where I want to be",
    era: "future",
    layer: "professional",
    parent: null,
    summary: "Operations and program work in AI safety, starting in the Bay Area.",
    body: "In one year: in the Bay Area, in an operations or program role inside the AI safety ecosystem, learning how these organizations run.\n\nIn two years: either owning a program or function (a fellowship, evals operations, or a team's ops) and building its processes and hiring, or finishing a master's in AI safety or a similar field.\n\nIn five years: leading operations or programs at an AI safety or human-centered AI organization, or building something of my own.\n\nThe roles that fit best: operations and program roles at AI safety organizations (fellowships, events, field-building); human-data, evals, QA, or safeguards operations at AI labs and startups; founding ops, chief of staff, or generalist roles at early-stage AI startups; and community, program, or customer success roles at AI companies.",
    image: null,
  },
  {
    id: "teacher-training",
    title: "Teaching meditation",
    era: "future",
    layer: "professional",
    parent: null,
    summary: "The hope ahead: teaching meditation to help people heal.",
    body: "Meditation has been a thread through my whole life. I was introduced to it as a young kid by my father, who gave me a hybrid of Buddhist and Christian practice.\n\nIn college it grew: founding the Meditation and Mindfulness Club, a course on Daoism, and a tai chi practice. Now it continues through the Mindfulness Meditation Teacher Certification Program.\n\nWhat I hope for next is to teach meditation as a way to help people heal.",
    image: null,
  },

  // ----- Personal (owner writes all text) -----
  {
    id: "youth-in-government",
    title: "Youth in Government",
    era: "college",
    layer: "personal",
    parent: "major",               // owner's choice to place it here; easy to move
    summary: "YMCA Youth in Government, Lee County, Florida, 2018–2022.",
    body: "Four years in YMCA Youth in Government in Lee County, Florida, working with disadvantaged youth and elected officials. A multi-year CONA delegate, and Florida's first non-binary YMCA camp counselor.",
    image: null,
  },
  {
    id: "personal-stakes",
    title: "Personal stakes",
    era: "college",
    layer: "personal",
    parent: "thesis",
    summary: "Why transhumanism is personal for me.",
    body: "I always felt out of place, and I always felt there was something tragic in the human experience.\n\nWhen my brother developed a rare and untreatable mental illness that causes a great deal of suffering, it occurred to me that humanity isn't stagnant. Medicine and society have already changed what it means to be human, and once you realize that, you realize how far it can go. That thought is more complicated than it sounds, and it isn't about looking down on anyone.\n\nFullmetal Alchemist got to me young for the same reason: the idea of transcending yourself and your mistakes, and of growth.",
    image: null,
  },
  {
    id: "family-roots",
    title: "Family roots",
    era: "college",
    layer: "personal",
    parent: "meditation-club",
    summary: "My dad's words on hard nights.",
    body: "Some nights, when things were hard, my dad would say a classic Christian prayer with me, and then something like \"may you be well, may you be loved.\" Basic mindfulness stuff. It would help. Not a ton, but it would help.",
    image: null,
  },
  {
    id: "years-of-play",
    title: "Years of play",
    era: "college",
    layer: "personal",
    parent: "gaming-coach",
    summary: "Games were where I found my friends.",
    body: "One of my first memories is playing Pokémon Pearl on my DS in the back of my mom's van. I was a lonely kid without many friends, and the Pokémon were my friends, in a series all about kindness. Then Super Mario Galaxy made me fall in love with space: the idea that anything could be out there, that the universe could hold whimsy, joy, and a beauty we can't fathom.\n\nIn middle school I had debilitating social anxiety and depression. I couldn't hold a conversation; my brain felt like it was moving through molasses. But I could type 120 words a minute. I talked in Minecraft chat rooms and on servers, and met many of my lifelong friends there. Through them I found League of Legends, and at Vanderbilt I joined the League club and later expanded it into Vanderbilt Gaming.\n\nA teammate called me \"the best worst player.\" I was never our most skilled player, and as a coach many of my players know the game better than I do. What I'm good at is the environment: centering people when things get stressful, taking weight off their shoulders. I don't think it's a coincidence we set records every year.",
    image: null,
  },
  {
    id: "common-ground",
    title: "Common ground",
    era: "college",
    layer: "personal",
    parent: "gaming-coach",
    summary: "What a team taught me about bridging divides.",
    body: "When I joined the team, people dropped slurs in Discord calls and at events. As a transgender person, it took over a year and a half before people used my correct pronouns. I asked Vanderbilt for help; they offered a conversation, and told me there would be no consequences if it kept happening. So I held my ground, because somebody had to bridge that divide, and in that moment that somebody was me.\n\nMy senior-year team, on paper, shouldn't have gotten along: deep political differences, a lot of toxic masculinity, and an international student who struggled to connect across a language gap. But playing together toward a common goal, for that time, we became friends. We were united.\n\nIf a semester of playing a game together can build mutual respect across differences like those, then the divides we live with can be mended too. That's part of why authenticity matters so much to me.\n\nThe board I led was male-dominated, and most of it was chosen before my time. So I pushed, and I raised up younger, more diverse students to hand things off to. When I left, I handed the club to its first woman president, to my knowledge, and today its board is far more balanced by gender and race. I'm very proud of that.",
    image: null,
  },
];

// ---------------------------------------------------------------------------
// Sub-zooms. An item listed here opens into its own small sky (zoom into its
// star) instead of a text panel. Keyed by item id.
//   stats:  short facts shown under the title
//   groups: groups of entries; each entry is { name, code, term, grade }
// Coursework source: unofficial transcript (2026), curated. Gen-eds are left out.
// ---------------------------------------------------------------------------
const DETAILS = {
  classes: {
    title: "Selected coursework",
    subtitle: "Vanderbilt University, 2022–2026",
    stats: ["GPA 3.7", "Dean's List all four years", "4.0 in the final semester", "Honors in History"],
    groups: [
      {
        label: "AI & technology",
        entries: [
          { name: "Ethics of Artificial Intelligence", code: "PHIL 3891", term: "Spring 2024", grade: "A" },
          { name: "Artificial Intelligence in Social Systems", code: "SOC 3242", term: "Spring 2025", grade: "A" },
          { name: "Independent Research: AI in Higher Education", code: "SOC 3851", term: "Fall 2025 & Spring 2026", grade: "A" },
          { name: "Science, Rhetoric, and Controversy", code: "CMST 2850", term: "Fall 2022", grade: "A" },
        ],
      },
      {
        label: "The honors thesis",
        entries: [
          { name: "Junior Honors Seminar", code: "HIST 3980W", term: "Spring 2025", grade: "A" },
          { name: "Senior Honors Research Seminar I", code: "HIST 4980", term: "Fall 2025", grade: "A" },
          { name: "Senior Honors Research Seminar II", code: "HIST 4981", term: "Spring 2026", grade: "A" },
          { name: "Senior Honors Thesis", code: "HIST 4999", term: "Spring 2026", grade: "A" },
        ],
      },
      {
        label: "History & law",
        entries: [
          { name: "The History Workshop: Transnational and Global History", code: "HIST 3000W", term: "Fall 2022", grade: "A" },
          { name: "The Historian and the Law", code: "HIST 2760", term: "Fall 2023", grade: "A" },
          { name: "The Politics of Asylum", code: "CAL 3890", term: "Fall 2024", grade: "A" },
          { name: "Sex and the Citizen", code: "HIST 2239", term: "Spring 2026", grade: "A" },
          { name: "Communism in Eastern Europe", code: "RUSS 2800", term: "Spring 2024", grade: "A" },
        ],
      },
      {
        label: "Philosophy & contemplation",
        entries: [
          { name: "Human Flourishing", code: "HIST 2790", term: "Fall 2023", grade: "A" },
          { name: "Formal Logic", code: "PHIL 3003", term: "Fall 2023", grade: "A" },
          { name: "Advanced Asian Philosophy", code: "PHIL 3004", term: "Spring 2024", grade: "A" },
          { name: "Dante's Divine Comedy", code: "ITA 3240", term: "Fall 2023", grade: "A" },
          { name: "Meditation for Musicians", code: "MWEL 1130", term: "Fall 2025", grade: "Pass" },
        ],
      },
      {
        label: "Society & research methods",
        entries: [
          { name: "Statistics for Social Scientists", code: "SOC 2100", term: "Fall 2025", grade: "A" },
          { name: "Human Behavior in Organizations", code: "SOC 3615", term: "Fall 2024", grade: "A" },
          { name: "Contemporary Social Issues", code: "SOC 1020", term: "Spring 2025", grade: "A" },
          { name: "Queer Rhetorics", code: "CMST 3890", term: "Fall 2022", grade: "A" },
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Resume: a plain, printable version of the professional side, for visitors
// who'd rather not zoom (resume.html). Same facts as the items above, in
// resume wording. Personal items stay off it.
//   sections: { heading, entries }
//   entry:    { title, org, dates, bullets, link: { label, url } (optional) }
//   A section can have `list` (one comma-separated line) instead of entries.
// ---------------------------------------------------------------------------
const RESUME = {
  site: "cameroncarr-likesfish.github.io",
  backLabel: "Back to the map",
  printLabel: "Print or save as PDF",
  sections: [
    {
      heading: "Education",
      entries: [
        {
          title: "B.A., Law, History, and Society, with Honors in History",
          org: "Vanderbilt University",
          dates: "2022 – May 2026",
          bullets: [
            "GPA 3.7. Dean's List all four years.",
            "Chancellor's Scholarship: a full-ride scholarship, awarded 2022.",
            "Senior honors thesis: “The Soul of Transhumanism: Rationalism and Dissent in the Early History of Transhumanism” (100 pages; adviser Dr. Ole Molvig), on the values embedded in AI and transhumanist culture.",
          ],
          link: { label: "Read the thesis (PDF)", url: "files/carr-soul-of-transhumanism.pdf" },
        },
      ],
    },
    {
      heading: "Experience",
      entries: [
        {
          title: "Operations Intern",
          org: "Positive AI Labs",
          dates: "2026 – Oct 2026",
          bullets: [
            "Core quality assurance for FlourishBench, PAL's flagship AI benchmark: reviewed and refined complex human scenarios for realism, nuance, and internal consistency, handling confidential pre-release material.",
            "First to flag that the benchmark's source material was running out far faster than projected, and first to propose fixes; a modified version of one became the team's method.",
            "Designed a five-step AI pipeline automating the slowest parts of the team's workflow; maintained datasets and systems.",
            "The only intern to receive a contract extension.",
          ],
        },
        {
          title: "Research Assistant",
          org: "Sociology AI Lab, Vanderbilt University",
          dates: "Aug 2025 – May 2026",
          bullets: [
            "Co-designed a human subjects survey instrument with Prof. Davis and graduate researchers on student perceptions of AI-driven academic deskilling.",
            "Coordinated participant recruitment, data collection protocols, the IRB protocol, and workflows for an interdisciplinary team. CITI certified.",
          ],
        },
      ],
    },
    {
      heading: "Leadership",
      entries: [
        {
          title: "President, Coach & Captain",
          org: "Vanderbilt Gaming",
          dates: "2022 – 2026",
          bullets: [
            "Expanded Vanderbilt's League of Legends club into Vanderbilt Gaming: 100+ active members, several hundred involved.",
            "Vice President sophomore year, co-president junior year, and President senior year; team captain sophomore through junior year; Event Chair. Ran the organization's operations.",
            "Coached competitive teams on skill, strategy, and cohesion; teams I led consistently beat higher-ranked opponents. My League of Legends team reached at least the NECC quarterfinals every year, a club first.",
            "Mentored younger, more diverse members to take over a male-dominated board; handed the club to its first woman president, and its board is now far more balanced by gender and race.",
          ],
        },
        {
          title: "Founder",
          org: "Meditation & Mindfulness Club, Vanderbilt University",
          dates: "2024 – 2026",
          bullets: [
            "Built a student wellness program from scratch; led sessions and supported students through mental health challenges.",
          ],
        },
        {
          title: "Discussion Group Leader",
          org: "Human Flourishing course, Vanderbilt University",
          bullets: ["Led extracurricular discussion groups for one of Vanderbilt's most popular classes."],
        },
        {
          title: "Youth in Government",
          org: "YMCA, Lee County, Florida",
          dates: "2018 – 2022",
          bullets: [
            "Revitalized the Lee County district's Youth in Government program after COVID-era funding cuts wiped out school clubs. Reached out to principals across the county for interested students; several schools now run their own programs.",
            "Recruited and mentored new members, coaching them to write bills, debate, and trust that their ideas were worth hearing.",
            "Selected twice to represent Florida at the YMCA's Conference on National Affairs (CONA).",
            "Volunteer YMCA camp counselor: the first non-binary camp counselor in Florida's YMCA.",
          ],
        },
      ],
    },
    {
      heading: "Training",
      entries: [
        {
          title: "Mindfulness Meditation Teacher Certification Program (MMTCP)",
          org: "with Jack Kornfield and Tara Brach",
          dates: "Admitted 2026",
          bullets: ["Admitted with a 75% scholarship."],
        },
      ],
    },
    {
      heading: "Tools",
      list: ["Claude and Claude Code", "Google Workspace", "Dataset organization and QA"],
    },
  ],
};
