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
// Tags are a first pass; adjust freely.
// ---------------------------------------------------------------------------
const ITEMS = [
  // ----- College (professional core) -----
  {
    id: "major",
    title: "Law, History, and Society",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Major at Vanderbilt, with Honors in History.",
    body: "[PLACEHOLDER: longer description of the major and the honors program.]",
    tags: ["writing", "research"],
    image: null,
  },
  {
    id: "scholarship",
    title: "Full-ride scholarship",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Attended Vanderbilt on a full-ride scholarship.",
    body: "[PLACEHOLDER: name of the scholarship and what it meant.]",
    tags: [],
    image: null,
  },
  {
    id: "thesis",
    title: "Senior thesis: transhumanism",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "An honors thesis of about 100 pages on transhumanism.",
    body: "[PLACEHOLDER: thesis title, question, and main argument.]",
    tags: ["transhumanism", "writing", "research"],
    image: null,
  },
  {
    id: "classes",
    title: "Selected classes",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "[PLACEHOLDER: a few standout courses.]",
    body: "[PLACEHOLDER: list of selected classes, with a line on each.]",
    tags: [],
    image: null,
  },
  {
    id: "meditation-club",
    title: "Meditation club",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "[PLACEHOLDER: your role in the meditation club, in one line.]",
    body: "[PLACEHOLDER: what the club did and your part in it.]",
    tags: ["meditation"],
    image: null,
  },
  {
    id: "gaming-coach",
    title: "Vanderbilt Gaming team coach",
    era: "college",
    layer: "professional",
    parent: null,
    summary: "Coached a Vanderbilt Gaming team.",
    body: "[PLACEHOLDER: which game, which team, and what coaching involved.]",
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
    summary: "QA on AI evaluation scenarios and automation pipelines. The only intern whose contract was extended.",
    body: "[PLACEHOLDER: longer description of the internship.]",
    tags: ["ai", "problem-solving"],
    image: null,
  },
  {
    id: "mmtcp",
    title: "Meditation teacher certification (MMTCP)",
    era: "now",
    layer: "professional",
    parent: null,
    summary: "Accepted to the MMTCP with a 75% scholarship.",
    body: "[PLACEHOLDER: what the program is and why you applied.]",
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
