import {
  AssessmentCategory,
  AssessmentQuestion,
  CandidateProfile,
  Mentor,
  Opportunity,
  SkillBridgeState,
} from '../types';

export const DEFAULT_CANDIDATE: CandidateProfile = {
  preferredName: 'Amina Hassan',
  location: 'Nairobi',
  roleSought: 'Junior Web Developer or Community Data Fellow',
  yearsExperience: '2–3 years',
  professionalSummary: '',
  skills: [
    { name: 'HTML', proficiency: 'Advanced' },
    { name: 'CSS', proficiency: 'Intermediate' },
    { name: 'Spreadsheets', proficiency: 'Advanced' },
    { name: 'Communication', proficiency: 'Intermediate' },
    { name: 'Digital Literacy', proficiency: 'Beginner' },
  ],
  languages: ['English', 'Swahili', 'Somali'],
  availability: 'Full-time fellowship (35–40 hrs/week)',
  projects: [
    {
      id: 'proj-1',
      title: 'Neighbourhood Learning Schedule Page',
      url: 'https://example.org/demo-schedule-page',
      summary:
        'Built a mobile-friendly HTML and CSS timetable for weekly adult digital literacy classes so learners can check session times on basic smartphones.',
      skillsUsed: ['HTML', 'CSS', 'Communication'],
    },
  ],
  assessment: null,
  linkedInImport: null,
};

export interface SkillCategoryGroup {
  category: string;
  skills: string[];
}

export const SKILL_CATEGORIES: SkillCategoryGroup[] = [
  {
    category: 'Web & Software',
    skills: [
      'HTML',
      'CSS',
      'JavaScript',
      'Git',
      'Responsive Design',
      'Accessibility',
      'Form Validation',
    ],
  },
  {
    category: 'Data & Operations',
    skills: [
      'Spreadsheets',
      'Data Quality',
      'Inventory Tracking',
      'Reporting',
      'Record Keeping',
      'Scheduling',
    ],
  },
  {
    category: 'Training & Community',
    skills: [
      'Facilitation',
      'Digital Literacy',
      'Curriculum Planning',
      'Communication',
      'Research',
      'Translation',
    ],
  },
  {
    category: 'Workplace & Coordination',
    skills: [
      'Team Coordination',
      'Documentation',
      'Community Outreach',
      'Problem Solving',
      'Time Management',
    ],
  },
];

export const SUGGESTED_SKILLS: string[] = SKILL_CATEGORIES.flatMap(
  (group) => group.skills
);

export const AVAILABILITY_OPTIONS: string[] = [
  'Full-time fellowship (35–40 hrs/week)',
  'Part-time fellowship (15–20 hrs/week)',
  'Remote mentorship (2–4 hrs/week)',
  'Weekend or evening workshops',
  'Flexible schedule',
];

export const EXPERIENCE_OPTIONS: string[] = [
  'Less than 1 year',
  '1–2 years',
  '2–3 years',
  '3–5 years',
  '5+ years',
];

export const LOCATION_SUGGESTIONS: string[] = [
  'Nairobi',
  'Garissa',
  'Turkana',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Remote',
];

export const SAMPLE_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-web-nairobi',
    title: 'Junior Web Developer Fellowship',
    organization: 'KaziTech Civic Lab (Sample Org)',
    location: 'Nairobi',
    roleCategory: 'Web Development',
    format: 'Hybrid · Nairobi Hub',
    duration: '12 weeks · Illustrative fellowship',
    stipendNote: 'Demo learning stipend & workspace access',
    summary:
      'Work alongside senior civic technologists to maintain accessible community resource directories, build responsive web forms, and refine front-end components.',
    requiredSkills: ['HTML', 'CSS', 'JavaScript'],
    niceToHaveSkills: ['Git', 'Responsive Design'],
    responsibilities: [
      'Build clean, mobile-first web pages for low-bandwidth community access.',
      'Fix layout and accessibility issues using semantic HTML and CSS.',
      'Add interactive filtering and form validation with JavaScript.',
    ],
    demoNote:
      'Sample demo opportunity. Not a live vacancy; illustrative match only.',
  },
  {
    id: 'opp-data-garissa',
    title: 'Community Data Assistant Fellowship',
    organization: 'Sahel Health & Records Initiative (Sample Org)',
    location: 'Garissa',
    roleCategory: 'Data & Operations',
    format: 'On-site · Garissa County',
    duration: '16 weeks · Illustrative fellowship',
    stipendNote: 'Demo monthly fellowship allowance',
    summary:
      'Support local outreach teams in organizing attendance logs, validating survey spreadsheets, and preparing clear weekly summaries for program coordinators.',
    requiredSkills: ['Spreadsheets', 'Communication', 'Data Quality'],
    niceToHaveSkills: ['Reporting', 'Digital Literacy'],
    responsibilities: [
      'Review field spreadsheets for missing values, duplicates, and formatting errors.',
      'Summarize weekly outreach figures clearly for community coordinators.',
      'Support small-group workshops on consistent record keeping.',
    ],
    demoNote:
      'Sample demo opportunity. Not a live vacancy; illustrative match only.',
  },
  {
    id: 'opp-mentor-turkana',
    title: 'Digital Skills Mentor',
    organization: 'Rift Valley Learning Commons (Sample Org)',
    location: 'Turkana',
    roleCategory: 'Digital Facilitation & Training',
    format: 'In-person · Turkana Hub',
    duration: '10 weeks · Illustrative part-time fellowship',
    stipendNote: 'Demo facilitation stipend & transit support',
    summary:
      'Guide adult learners and youth cohorts through practical smartphone productivity, email safety, online document collaboration, and basic career portfolio setup.',
    requiredSkills: ['Facilitation', 'Digital Literacy'],
    niceToHaveSkills: ['Curriculum Planning', 'Communication'],
    responsibilities: [
      'Lead twice-weekly hands-on digital confidence clinics for 12–15 participants.',
      'Adapt practice exercises for learners with varying language comfort.',
      'Document common learner questions to improve shared training guides.',
    ],
    demoNote:
      'Sample demo opportunity. Not a live vacancy; illustrative match only.',
  },
  {
    id: 'opp-ops-mombasa',
    title: 'Operations & Logistics Coordinator Fellow',
    organization: 'Pwani Supply & Community Collective (Sample Org)',
    location: 'Mombasa',
    roleCategory: 'Data & Operations',
    format: 'On-site · Mombasa',
    duration: '12 weeks · Illustrative fellowship',
    stipendNote: 'Demo fellowship stipend',
    summary:
      'Coordinate supply kit inventories, maintain clean vendor dispatch spreadsheets, and liaise with neighbourhood distribution volunteers.',
    requiredSkills: ['Spreadsheets', 'Communication', 'Inventory Tracking'],
    niceToHaveSkills: ['Data Quality', 'Reporting'],
    responsibilities: [
      'Track incoming and outgoing training materials in shared workbooks.',
      'Coordinate weekly delivery schedules with local community hubs.',
      'Flag low stock levels early with concise written updates.',
    ],
    demoNote:
      'Sample demo opportunity. Not a live vacancy; illustrative match only.',
  },
  {
    id: 'opp-research-kisumu',
    title: 'Multilingual Community Research Fellow',
    organization: 'Lake Basin Civic Research Hub (Sample Org)',
    location: 'Kisumu',
    roleCategory: 'Digital Facilitation & Training',
    format: 'Hybrid · Kisumu / Remote',
    duration: '8 weeks · Illustrative fellowship',
    stipendNote: 'Demo research micro-grant',
    summary:
      'Conduct structured listening sessions with local tradespeople, organize qualitative notes, and verify clean data entry across multilingual surveys.',
    requiredSkills: ['Communication', 'Research', 'Data Quality'],
    niceToHaveSkills: ['Facilitation', 'Spreadsheets'],
    responsibilities: [
      'Facilitate respectful 1-on-1 feedback interviews in community spaces.',
      'Translate and structure notes into standardized summary templates.',
      'Verify survey logs for completeness prior to weekly team reviews.',
    ],
    demoNote:
      'Sample demo opportunity. Not a live vacancy; illustrative match only.',
  },
];

export const SAMPLE_MENTORS: Mentor[] = [
  {
    id: 'mentor-daniel',
    name: 'Daniel Ochieng',
    role: 'Senior Front-End Engineer',
    organization: 'Savanna Civic Systems (Sample Org)',
    location: 'Nairobi',
    expertise: ['HTML', 'CSS', 'JavaScript', 'Portfolio Review'],
    languages: ['English', 'Swahili'],
    availability: 'Tuesdays & Thursdays, 17:30–19:00 EAT',
    format: 'Nairobi public library hub or moderated video call',
    bio: 'Mentors self-taught developers on building practical web projects without relying on formal degree transcripts.',
  },
  {
    id: 'mentor-fatuma',
    name: 'Fatuma Abdi',
    role: 'Monitoring & Data Systems Lead',
    organization: 'North Eastern Health Network (Sample Org)',
    location: 'Garissa',
    expertise: ['Spreadsheets', 'Data Quality', 'Reporting'],
    languages: ['Somali', 'Swahili', 'English'],
    availability: 'Wednesdays & Saturdays, 10:00–12:00 EAT',
    format: 'Garissa community learning center or phone/video',
    bio: 'Supports candidates transitioning operational and administrative experience into structured data assistant roles.',
  },
  {
    id: 'mentor-grace',
    name: 'Grace Ekiru',
    role: 'Community Digital Educator',
    organization: 'Turkana Skills Cooperative (Sample Org)',
    location: 'Turkana',
    expertise: ['Facilitation', 'Digital Literacy', 'Curriculum Planning'],
    languages: ['Swahili', 'English', 'Turkana'],
    availability: 'Mondays & Fridays, 14:00–16:30 EAT',
    format: 'Turkana learning commons (public group or 1:1 table)',
    bio: 'Coaches peer trainers on running accessible workshops and explaining technical concepts in plain language.',
  },
  {
    id: 'mentor-jean',
    name: 'Jean-Paul Ndayisaba',
    role: 'Operations & Logistics Advisor',
    organization: 'East Coast Logistics Studio (Sample Org)',
    location: 'Mombasa / Remote',
    expertise: ['Inventory Tracking', 'Spreadsheets', 'Communication'],
    languages: ['French', 'Swahili', 'English'],
    availability: 'Saturdays, 11:00–13:30 EAT',
    format: 'Organization-approved virtual session',
    bio: 'Former displaced logistics specialist helping candidates frame hands-on supply and team coordination experience.',
  },
];

export const ASSESSMENT_QUESTIONS: Record<AssessmentCategory, AssessmentQuestion[]> = {
  'Web Development': [
    {
      id: 'web-q1',
      prompt:
        'A community form needs to work smoothly for people using screen readers and keyboard-only navigation. Which HTML pattern is best?',
      options: [
        'Use <div> elements with click handlers and placeholder text instead of labels.',
        'Pair a native <label for="..."> with each <input> and use a native <button type="submit">.',
        'Hide labels with display: none so the layout stays minimal.',
      ],
      correctIndex: 1,
      explanation:
        'Explicit <label> associations and native <button> elements give screen readers and keyboard users built-in focus, announcement, and Enter/Space submission without extra scripts.',
    },
    {
      id: 'web-q2',
      prompt:
        'On a 360px mobile screen, a three-column CSS Grid cards section causes horizontal scrolling. What is the cleanest fix?',
      options: [
        'Use grid-template-columns: 1fr on mobile and switch to multi-column at larger breakpoints (e.g., md:grid-cols-3).',
        'Set overflow-x: hidden on the body so the clipped cards disappear.',
        'Give every card a fixed width of 400px so they look uniform.',
      ],
      correctIndex: 0,
      explanation:
        'Mobile-first responsive grids stack into a single readable column on small viewports and expand cleanly on wider screens without hiding content.',
    },
    {
      id: 'web-q3',
      prompt:
        'You want to filter a list of fellowships in JavaScript when a user types into a search box without mutating the original array. Which approach fits best?',
      options: [
        'Use Array.prototype.splice() directly on the original array on every keystroke.',
        'Use Array.prototype.filter() with normalized lowercase string matching to derive a filtered list.',
        'Reload the entire browser page after every character typed.',
      ],
      correctIndex: 1,
      explanation:
        'Array.prototype.filter() creates a new derived array without destroying the underlying data, keeping live search predictable and easy to clear.',
    },
  ],
  'Data & Operations': [
    {
      id: 'data-q1',
      prompt:
        'You receive an attendance spreadsheet where dates appear as "12/05/26", "May 12 2026", and "2026-05-12". What should you do first before counting weekly totals?',
      options: [
        'Delete rows that look different so only one format remains.',
        'Standardize all date values into a single consistent format (such as ISO YYYY-MM-DD) and verify ambiguous day/month entries.',
        'Leave them as text and count rows manually each week.',
      ],
      correctIndex: 1,
      explanation:
        'Consistent date formatting prevents sorting errors and broken pivot/COUNTIFS formulas. Checking ambiguous entries protects data accuracy.',
    },
    {
      id: 'data-q2',
      prompt:
        'A column of fellowship stipend amounts contains blank cells and one text note ("pending"). You want the average of recorded amounts. Which spreadsheet behavior matters most?',
      options: [
        'Replace blank cells with 0 without checking whether the person actually received 0.',
        'Keep missing values distinct from zero, clarify the "pending" row in a status column, and compute AVERAGE on numeric entries.',
        'Guess an estimate for the blank cells to make the sheet look complete.',
      ],
      correctIndex: 1,
      explanation:
        'Treating missing records as zero lowers averages inaccurately. Separating status notes from numeric columns keeps calculations honest and auditable.',
    },
    {
      id: 'data-q3',
      prompt:
        'Before sharing a community training summary sheet with an external coordinator, what is the best data quality and privacy step?',
      options: [
        'Remove sensitive personal identifiers not needed for the summary, double-check totals, and document any known gaps.',
        'Include full phone numbers and identity details in case someone asks later.',
        'Send the raw unreviewed working draft to save time.',
      ],
      correctIndex: 0,
      explanation:
        'Data minimization protects participants, while checking totals and noting gaps builds trust in your reporting.',
    },
  ],
  'Digital Facilitation & Training': [
    {
      id: 'fac-q1',
      prompt:
        'During a 12-person digital literacy session, three participants have never used a spreadsheet before while others already use formulas. How do you keep the group engaged?',
      options: [
        'Teach only advanced formulas so beginners catch up on their own.',
        'Run a short shared core walkthrough, then offer tiered practice tasks (basic entry vs. summary formula) and pair peer buddies.',
        'Ask the beginners to observe without touching a device.',
      ],
      correctIndex: 1,
      explanation:
        'Scaffolded tasks and peer pairing respect every learner’s starting point and build hands-on confidence across mixed skill levels.',
    },
    {
      id: 'fac-q2',
      prompt:
        'A learner asks a practical software question you are not 100% sure how to solve on the spot. What builds the strongest trust?',
      options: [
        'Guess an answer confidently and move on quickly.',
        'Acknowledge it openly, demonstrate how to look up or test the setting together, or follow up with a verified step after the break.',
        'Tell the learner that feature is not important.',
      ],
      correctIndex: 1,
      explanation:
        'Modeling calm problem-solving shows learners how to troubleshoot independently and reinforces psychological safety in the room.',
    },
    {
      id: 'fac-q3',
      prompt:
        'When guiding learners to create their first online work profile, which safeguarding instruction is essential?',
      options: [
        'Advise learners to upload photos of personal IDs so profiles look more official.',
        'Explain that profiles should highlight skills, sample work, and general city/region—never sensitive ID numbers or exact home addresses.',
        'Tell learners to share one shared password for the whole class.',
      ],
      correctIndex: 1,
      explanation:
        'Teaching digital privacy alongside practical job skills protects learners from identity misuse while still presenting strong work readiness.',
    },
  ],
};

export const PROTOTYPE_IMPACT_METRICS = [
  {
    label: 'Sample candidate profiles',
    value: '48',
    detail: 'Fictional demo profiles modeled across 5 regional hubs',
  },
  {
    label: 'Illustrative fellowships',
    value: '18',
    detail: 'Sample tracks built around demonstrated skills, not transcripts',
  },
  {
    label: 'Demo mentor pairings',
    value: '24',
    detail: 'Simulated peer and senior practitioner introductions',
  },
  {
    label: 'Partner hub scenarios',
    value: '05',
    detail: 'Fictional community learning spaces in this prototype',
  },
];

export const INITIAL_STATE: SkillBridgeState = {
  profile: DEFAULT_CANDIDATE,
  savedOpportunityIds: ['opp-web-nairobi'],
  savedMentorIds: [],
  applications: {},
  mentorshipRequests: [],
  activityLog: [
    {
      id: 'act-seed-1',
      type: 'Saved Opportunity',
      detail: 'Junior Web Developer Fellowship — Nairobi',
      timestamp: 'Demo session initialized',
      targetTab: 'opportunities',
    },
  ],
  assistantTasks: [
    {
      id: 'task-seed-1',
      title: 'Review skill gaps on Junior Web Developer Fellowship',
      category: 'Opportunities',
      completed: false,
      source: 'user',
      createdAt: 'Demo session',
    },
    {
      id: 'task-seed-2',
      title: 'Add a second work sample or project link to Skills Passport',
      category: 'Passport',
      completed: false,
      source: 'user',
      createdAt: 'Demo session',
    },
    {
      id: 'task-seed-3',
      title: 'Bookmark a mentor who matches your language and focus area',
      category: 'Mentorship',
      completed: false,
      source: 'user',
      createdAt: 'Demo session',
    },
  ],
  assistantMessages: [],
};
