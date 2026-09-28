/* content.js: all site content and settings.
   Edit text here. Nothing in this file controls layout.
   Anything marked [PLACEHOLDER: ...] is waiting for the owner to write it. */

// ---------------------------------------------------------------------------
// Settings. Every place the site shows the name, pronouns, or contact details
// reads from here.
// ---------------------------------------------------------------------------
const SETTINGS = {
  displayName: "Camcar",
  fullName: "Cameron Carr",
  pronouns: "she/they",        // shown in the header; change here only
  email: "CameronCarr55@gmail.com",
  phone: "",                   // left blank on purpose: this file is public
  showPhone: false,            // set true (and fill in phone) to show a number
  linkedin: "https://www.linkedin.com/in/cam-carr-4432a0285/",
  github: "CameronCarr-LikesFish",
};

// ---------------------------------------------------------------------------
// Eras: the zoom levels, from outermost (zoomed out, the future) to innermost
// (zoomed in, beneath the wall). The site opens on START_ERA.
// ---------------------------------------------------------------------------
const ERAS = [
  { id: "future",  label: "Future",           subtitle: "Mostly unwritten" },
  { id: "now",     label: "Now",              subtitle: "After graduation, 2026" },
  { id: "college", label: "Vanderbilt",       subtitle: "Law, History, and Society" },
  { id: "beneath", label: "Beneath the wall", subtitle: "Personal backstories" },
];

const START_ERA = "college";

// ---------------------------------------------------------------------------
// Interface text: the wall prompt and a few labels.
// ---------------------------------------------------------------------------
const UI_TEXT = {
  wallPrompt: "That's the professional side. Want to see what's underneath?",
  wallYes: "Yes, show me",
  wallNo: "No, take me back",
  backToProfessional: "Back to the professional side",
  beneathLabel: "Beneath",        // shown as "Beneath: Senior thesis"
  beneathThis: "Beneath this",    // heading in a professional item's panel
  tagBarLabel: "Filter by tag",
  themesLabel: "Themes",
  skillsLabel: "Skills",
  clearFilter: "Clear",
  noMatches: "Nothing tagged {tag} yet.",
  backFromDetail: "Back to {era}",  // button at the top of a sub-zoom
};

// ---------------------------------------------------------------------------
// Tags. Two families: themes and skills. Items refer to tags by id.
// ---------------------------------------------------------------------------
const TAGS = [
  { id: "meditation",      label: "Meditation",      family: "theme" },
  { id: "transhumanism",   label: "Transhumanism",   family: "theme" },
  { id: "ai",              label: "AI",              family: "theme" },
  { id: "gaming",          label: "Gaming",          family: "theme" },
  { id: "fish",            label: "Fish",            family: "theme" },
  { id: "writing",         label: "Writing",         family: "skill" },
  { id: "research",        label: "Research",        family: "skill" },
  { id: "problem-solving", label: "Problem solving", family: "skill" },
  { id: "leadership",      label: "Leadership",      family: "skill" },
  { id: "teaching",        label: "Teaching",        family: "skill" },
];

// ---------------------------------------------------------------------------
// Items.
//   era:    future | now | college
//   layer:  professional | personal (personal items sit beneath the wall)
//   parent: for personal items, the id of the professional item it hangs under
//   links:  optional list of { label, url }, shown as buttons in the item's panel
// Tags are a first pass; adjust freely.
// ---------------------------------------------------------------------------
const ITEMS = [
  // ----- College (professional core) -----
  // Source: resume and transcript (2026). On-screen order: left column top
  // to bottom, then bottom center, then right column top to bottom.
  {
    id: "major",
    title: "B.A., Honors in History",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Law, History, and Society major. GPA 3.7, Dean's List every year.",
    body: "Bachelor of Arts in Law, History, and Society from Vanderbilt University's College of Arts and Science, 2026, with Honors in History.\n\nGPA 3.7 out of 4.0, and on the Dean's List all four years (2022–2026).",
    tags: ["writing", "research"],
    image: null,
  },
  {
    id: "scholarship",
    title: "Chancellor's Scholarship",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "A full-ride scholarship to Vanderbilt, awarded 2022.",
    body: "Attended Vanderbilt on the Chancellor's Scholarship, a full-ride scholarship awarded in 2022.\n\n[PLACEHOLDER: what the scholarship meant to you.]",
    tags: [],
    image: null,
  },
  {
    id: "thesis",
    title: "The Soul of Transhumanism",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "A 100-page senior honors thesis on the history of transhumanist thought.",
    body: "Senior honors thesis in History, 2024–2026: \"The Soul of Transhumanism: Rationalism and Dissent in the Early History of Transhumanism.\" Advised by Dr. Ole Molvig.\n\nThe thesis traces rationalism, elitism, and gendered ideology in transhumanist thought, from early 20th-century British scientific socialists to today's Silicon Valley AI culture. It argues that the values embedded in AI culture are historically contingent, not neutral or inevitable, which speaks directly to whose values get encoded into AI systems.\n\nIt earned Honors in History, which only a handful of history students receive each year.",
    tags: ["transhumanism", "ai", "writing", "research"],
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
    body: "Paid research assistant at Vanderbilt's Sociology AI Lab, August 2025 to May 2026.\n\nCo-designed a human subjects survey instrument with Prof. Davis and graduate researchers on student perceptions of AI-driven academic deskilling, and coordinated participant recruitment, data collection protocols, and workflows for an interdisciplinary team.",
    tags: ["ai", "research"],
    image: null,
  },
  {
    id: "classes",
    title: "Selected coursework",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Ethics of AI, AI in Social Systems, Human Flourishing, and more. Zoom in to explore.",
    body: "Ethics of Artificial Intelligence (A)\n\nArtificial Intelligence in Social Systems (A)\n\nHuman Flourishing (A)\n\nFormal Logic (A)\n\nStatistics for Social Scientists (A-)\n\nAdvanced Asian Philosophy (A-)",
    tags: ["ai", "research"],
    image: null,
  },
  {
    id: "meditation-club",
    title: "Founder, Meditation & Mindfulness Club",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Built a student wellness program from scratch, 2024–2026.",
    body: "Founded Vanderbilt's Meditation and Mindfulness Club and built its student wellness program from scratch. Facilitated sessions and supported students through mental health challenges.",
    tags: ["meditation", "leadership", "teaching"],
    image: null,
  },
  {
    id: "gaming-coach",
    title: "Coach, Vanderbilt Gaming",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Coach of the competitive teams; formerly Vice President, Event Chair, and Team Captain.",
    body: "Coach Vanderbilt's competitive gaming teams (2023 to present), developing player skill, strategy, and team cohesion.\n\nAs Vice President, ran operations for a 50+ member organization and spent three years deliberately diversifying a homogeneous board and membership into a more inclusive community. Earlier roles: Event Chair and Team Captain.",
    tags: ["gaming", "teaching", "leadership"],
    image: null,
  },

  // ----- Now (post-graduation, 2026) -----
  {
    id: "positive-ai",
    title: "Operations intern, Positive AI Labs",
    era: "now",
    layer: "professional",
    parent: null,
    summary: "Core QA for FlourishBench, PAL's flagship AI benchmark. The only intern given a contract extension.",
    body: "Operations intern at Positive AI Labs, 2026 to present.\n\nCore quality assurance for FlourishBench, PAL's flagship AI benchmark: reviewing and refining complex human scenarios for realism, nuance, and internal consistency before they enter the dataset.\n\nDesigns and deploys AI-driven triggers and automation pipelines that streamline routine and multi-step operational workflows, and organizes and maintains datasets and internal information systems.\n\nThe only intern to receive a contract extension, earned through independent ownership of work, sound judgment on when to escalate, and clear communication in a fast-paced startup.",
    tags: ["ai", "problem-solving", "writing"],
    image: null,
  },
  {
    id: "mmtcp",
    title: "Mindfulness Meditation Teacher Certification",
    era: "now",
    layer: "professional",
    parent: null,
    summary: "Admitted in 2026 to the MMTCP with Jack Kornfield and Tara Brach, with a 75% scholarship.",
    body: "Admitted in 2026 to the Mindfulness Meditation Teacher Certification Program (MMTCP) led by Jack Kornfield and Tara Brach, with a 75% scholarship.\n\n[PLACEHOLDER: why you applied and what you hope to teach.]",
    tags: ["meditation", "teaching"],
    image: null,
  },

  // ----- Future -----
  {
    id: "teacher-training",
    title: "Meditation teacher training",
    era: "future",
    layer: "professional",
    parent: null,
    summary: "[PLACEHOLDER: one line on the training ahead.]",
    body: "[PLACEHOLDER: longer description.]",
    tags: ["meditation", "teaching"],
    image: null,
  },
  {
    id: "startup",
    title: "The startup",
    era: "future",
    layer: "professional",
    parent: null,
    summary: "[PLACEHOLDER: one line on the startup.]",
    body: "[PLACEHOLDER: longer description.]",
    tags: [],
    image: null,
  },
  {
    id: "portfolio",
    title: "Portfolio projects in progress",
    era: "future",
    layer: "professional",
    parent: null,
    summary: "[PLACEHOLDER: one line on the portfolio.]",
    body: "[PLACEHOLDER: list of projects in progress.]",
    tags: ["ai"],
    image: null,
  },

  // ----- Beneath the wall (personal; owner writes all text) -----
  {
    id: "youth-in-government",
    title: "Youth in Government",
    era: "college",
    layer: "personal",
    parent: "major",               // owner's choice to place it here; easy to move
    summary: "YMCA Youth in Government, Lee County, Florida, 2018–2022.",
    body: "Four years in YMCA Youth in Government in Lee County, Florida, working with disadvantaged youth and elected officials. A multi-year CONA delegate, and Florida's first non-binary YMCA camp counselor.\n\n[PLACEHOLDER: the story of how this led to law and history.]",
    tags: ["leadership"],
    image: null,
  },
  {
    id: "personal-stakes",
    title: "Personal stakes",
    era: "college",
    layer: "personal",
    parent: "thesis",
    summary: "[PLACEHOLDER]",
    body: "[PLACEHOLDER]",
    tags: ["transhumanism"],
    image: null,
  },
  {
    id: "family-roots",
    title: "Family roots",
    era: "college",
    layer: "personal",
    parent: "meditation-club",
    summary: "[PLACEHOLDER]",
    body: "[PLACEHOLDER]",
    tags: ["meditation"],
    image: null,
  },
  {
    id: "years-of-play",
    title: "Years of play",
    era: "college",
    layer: "personal",
    parent: "gaming-coach",
    summary: "[PLACEHOLDER]",
    body: "[PLACEHOLDER]",
    tags: ["gaming"],
    image: null,
  },
];

// ---------------------------------------------------------------------------
// Sub-zooms. An item listed here opens into its own small sky (zoom into its
// star) instead of a text panel. Keyed by item id.
//   stats:  short facts shown under the title
//   groups: constellations of entries; each entry is { name, code, term, grade }
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
          { name: "Independent Research: AI in Higher Education", code: "SOC 3851", term: "Fall 2025 & Spring 2026", grade: "B+, A" },
          { name: "Science, Rhetoric, and Controversy", code: "CMST 2850", term: "Fall 2022", grade: "A-" },
        ],
      },
      {
        label: "The honors thesis",
        entries: [
          { name: "Junior Honors Seminar", code: "HIST 3980W", term: "Spring 2025", grade: "A-" },
          { name: "Senior Honors Research Seminar I", code: "HIST 4980", term: "Fall 2025", grade: "A" },
          { name: "Senior Honors Research Seminar II", code: "HIST 4981", term: "Spring 2026", grade: "A" },
          { name: "Senior Honors Thesis", code: "HIST 4999", term: "Spring 2026", grade: "A" },
        ],
      },
      {
        label: "History & law",
        entries: [
          { name: "The History Workshop: Transnational and Global History", code: "HIST 3000W", term: "Fall 2022", grade: "A" },
          { name: "The Historian and the Law", code: "HIST 2760", term: "Fall 2023", grade: "A-" },
          { name: "The Politics of Asylum", code: "CAL 3890", term: "Fall 2024", grade: "A" },
          { name: "Sex and the Citizen", code: "HIST 2239", term: "Spring 2026", grade: "A" },
          { name: "Communism in Eastern Europe", code: "RUSS 2800", term: "Spring 2024", grade: "A-" },
        ],
      },
      {
        label: "Philosophy & contemplation",
        entries: [
          { name: "Human Flourishing", code: "HIST 2790", term: "Fall 2023", grade: "A" },
          { name: "Formal Logic", code: "PHIL 3003", term: "Fall 2023", grade: "A" },
          { name: "Advanced Asian Philosophy", code: "PHIL 3004", term: "Spring 2024", grade: "A-" },
          { name: "Dante's Divine Comedy", code: "ITA 3240", term: "Fall 2023", grade: "A-" },
          { name: "Meditation for Musicians", code: "MWEL 1130", term: "Fall 2025", grade: "Pass" },
        ],
      },
      {
        label: "Society & research methods",
        entries: [
          { name: "Statistics for Social Scientists", code: "SOC 2100", term: "Fall 2025", grade: "A-" },
          { name: "Human Behavior in Organizations", code: "SOC 3615", term: "Fall 2024", grade: "A-" },
          { name: "Contemporary Social Issues", code: "SOC 1020", term: "Spring 2025", grade: "A" },
          { name: "Queer Rhetorics", code: "CMST 3890", term: "Fall 2022", grade: "A-" },
        ],
      },
    ],
  },
};
