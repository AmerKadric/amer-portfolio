// All site content lives here — edit this file to update the portfolio.

export const profile = {
  name: 'Amer Kadric',
  role: 'Information Technology Manager',
  location: 'Detroit, Michigan',
  email: 'hd0761@wayne.edu',
  github: 'https://github.com/AmerKadric',
  linkedin: 'https://www.linkedin.com/in/amerkadric',
  resume: '/resume.pdf',
  version: 'Portfolio v2.0',
}

export const splashes = [
  'Over 100 locations!',
  'Turn it off and on again!',
  'Now with LTE!',
  'Wayne State grad!',
  '3.72 GPA!',
  'Uptime is a lifestyle!',
  'Detroit made!',
  'Certified fixer!',
  'Also try Lady Jane\'s!',
]

export const experience = [
  {
    title: 'IT Manager',
    company: "Lady Jane's Haircuts for Men",
    location: 'Birmingham, MI',
    period: 'Jan 2026 – Present',
    current: true,
    description:
      'Leading IT operations and network infrastructure across a 100+ location national salon franchise.',
    bullets: [
      'Manage IT infrastructure across 100+ salon locations, ensuring network reliability, system availability, and continuous business operations',
      'Administer Cradlepoint LTE routers through NetCloud Manager, monitoring connectivity, device health, network performance, and system alerts',
      'Coordinate with ISPs and technology vendors to troubleshoot service disruptions, manage network deployments, and implement infrastructure upgrades',
      'Support and maintain critical business technology, including VoIP systems, network switches, POS terminals, and end-user devices',
      'Administer Google Workspace, overseeing user provisioning, access management, authentication, and account security',
      'Provide Tier 1–2 technical support, resolving complex hardware, software, and connectivity issues across multiple locations',
      'Maintain and enhance corporate websites through front-end development, content management, and technical troubleshooting',
    ],
    tags: ['NetCloud Manager', 'Cradlepoint', 'Google Workspace', 'VoIP', 'Network Mgmt', 'Web Maintenance'],
  },
  {
    title: 'Student Intern',
    company: 'National Security Innovation Network (NSIN)',
    location: 'Remote',
    period: 'Aug 2024 – Jan 2025',
    description:
      'Built an Android app with a cross-functional team, powered by a multi-agent system of machine learning models, that turns unstructured voice and text input into structured, actionable data.',
    bullets: [
      'Collaborated on an AI/ML project to enhance battlefield communication and situational awareness by transforming unstructured voice and text inputs into structured data',
      'Developed an Android application prototype integrating speech recognition and machine learning models to process and organize military communications',
      'Designed and implemented front-end features and UI/UX improvements, enhancing message input, navigation, data presentation, and application usability',
      'Performed functional testing, debugging, and performance optimization to improve application reliability and processing efficiency',
      'Authored technical documentation, including system design specifications, software requirements, use cases, and implementation procedures',
    ],
    tags: ['Android Studio', 'Kotlin', 'Java', 'System Architecture', 'Agile', 'Documentation'],
  },
  {
    title: 'Administrative Assistant',
    company: 'My Virtual Academy',
    location: 'Remote',
    period: 'Nov 2021 – Jan 2026',
    description:
      'Administrative and communication support in a fast-paced virtual environment.',
    bullets: [
      'Managed daily administrative operations, including incoming calls, visitor assistance, and email correspondence, ensuring professional and timely communication',
    ],
    tags: ['Communication', 'Organization', 'Remote Work', 'Customer Service'],
  },
]

export const projects = [
  {
    title: 'Daily Sales Automation',
    year: 2026,
    icon: 'SE',
    color: '#217346',
    description:
      "A daily sales reconciliation pipeline built for the accounting department at Lady Jane's Haircuts for Men, posting 100+ salons into QuickBooks. I designed the Excel system it runs on: a Sales Express ledger that books eight revenue and payment categories per salon and must balance to zero on every row, plus three QuickBooks upload workbooks that use dynamic-array spill formulas to turn 840 ledger lines into journal entries. A Python engine parses the raw point-of-sale export, normalizes currency formats, matches salons through an alias table, and plugs rounding so each salon balances to the cent. It drives Excel through COM automation so native formulas and filters recalculate exactly as they do by hand, then validates every file's line counts, salon alignment, dates, and reference numbers before it can be downloaded. A Streamlit front end turns the daily close into one upload and one click.",
    tags: ['Python', 'Streamlit', 'pandas', 'Excel', 'Workbook Design', 'Excel Automation', 'pywin32', 'QuickBooks'],
    status: 'In Use',
    github: null,
    demo: null,
  },
  {
    title: 'JD Capital Group Website',
    year: 2026,
    icon: 'JD',
    color: '#b6903f',
    description:
      'A complete rebuild of the live website for JD Capital Group, a business consulting and growth advisory firm in Birmingham, Michigan. Built from scratch in HTML, CSS, and JavaScript with a custom client-side router for smooth page transitions and clean URLs, plus photo-carousel and video case studies, a client showcase, and a working contact form.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Responsive Design', 'Vercel'],
    status: 'Live',
    github: 'https://github.com/AmerKadric/jd-capital-group-redesign',
    demo: 'https://jd-capitalgrp.com',
  },
  {
    title: 'COP-C Project',
    year: 2025,
    icon: 'CP',
    color: '#2f6f9f',
    description:
      'The COP-C Project is a project submitted to the National Security Innovation Network. This project leverages artificial intelligence (AI) and machine learning (ML) to enhance battlefield communication by digitizing information received through voice and text channels. The solution addresses the critical issue of integrating alternative communication mechanisms into digital workflows, thereby improving situational awareness and information dissemination across military units.',
    tags: ['Android Studio', 'Kotlin', 'Java', 'Python', 'TensorFlow Lite', 'AI/ML', 'NLP / NER', 'RealmDB', 'Biometric Auth'],
    status: 'Completed',
    github: null,
    demo: null,
  },
  {
    title: 'Minecraft Portfolio',
    year: 2026,
    icon: 'AK',
    color: '#5d8f3a',
    description:
      'This site — a Minecraft-style title screen with a procedurally generated, rotating 3D voxel world drawn with a custom WebGL renderer. No game assets used.',
    tags: ['React', 'Vite', 'WebGL', 'Web Workers', 'Web Audio', 'Vercel'],
    status: 'Deployed',
    github: 'https://github.com/AmerKadric/amer-portfolio',
    demo: null,
  },
]

export const about = {
  bio: [
    "Hi, I'm Amer — a Bosnian-American Computer Science graduate from Wayne State University. I'm the IT Manager at Lady Jane's Haircuts for Men, keeping technology running across over 100 salon locations nationwide.",
    'My work is real-world IT operations: LTE network infrastructure, Google Workspace, hardware and VoIP troubleshooting, websites, and the support that keeps a business running day to day. I take full ownership of the systems I manage.',
  ],
  facts: [
    ['Role', 'IT Manager'],
    ['From', 'Detroit, MI'],
    ['Degree', 'B.S. Computer Science'],
  ],
  chips: ['IT Ops', 'Networking', 'Software'],
  highlights: [
    { kicker: 'Managing', title: 'Network & IT Management', desc: 'LTE-based connectivity and IT infrastructure across 100+ business locations with real uptime accountability.' },
    { kicker: 'Fixing', title: 'Technical Troubleshooting', desc: 'Hardware, software, VoIP, and network issues that directly impact business operations.' },
    { kicker: 'Maintaining', title: 'Web & Systems', desc: 'Company websites and internal systems — content updates, configuration, and production fixes.' },
    { kicker: 'Administering', title: 'Google Workspace', desc: 'User provisioning, access control, and authentication for the entire organization.' },
    { kicker: 'Supporting', title: 'End Users', desc: 'Tier 1–2 technical support and endpoint setup for staff across all locations.' },
    { kicker: 'Coordinating', title: 'Vendors & ISPs', desc: 'Working directly with ISPs and vendors to resolve network performance issues and escalations.' },
  ],
  education: {
    school: 'Wayne State University',
    college: 'College of Engineering',
    degree: 'B.S. Computer Science',
    period: 'Sep 2020 – Dec 2024',
    stats: [
      ['Cumulative GPA', '3.72'],
      ['Major GPA', '3.85'],
      ['Graduated', 'Dec 2024'],
    ],
    coursework: [
      'Data Structures & Algorithms', 'Object-Oriented Programming', 'Computer Architecture',
      'Operating Systems', 'Databases', 'Discrete Mathematics', 'Arduino Programming', 'Java',
    ],
  },
}

// level is 0–100; shown in-game as an enchantment level I–V
export const skills = [
  {
    label: 'IT & Networking',
    color: '#3f9f5f',
    items: [
      { name: 'Network Mgmt', abbr: 'NM', level: 88 },
      { name: 'LTE / Cradlepoint', abbr: 'LT', level: 85 },
      { name: 'Google Workspace', abbr: 'GW', level: 90 },
      { name: 'VoIP Support', abbr: 'VP', level: 82 },
      { name: 'Hardware Troubleshooting', abbr: 'HW', level: 85 },
      { name: 'Endpoint Setup', abbr: 'EP', level: 80 },
    ],
  },
  {
    label: 'Languages',
    color: '#c99a2e',
    items: [
      { name: 'Java', abbr: 'JV', level: 80 },
      { name: 'Kotlin', abbr: 'KT', level: 70 },
      { name: 'Python', abbr: 'PY', level: 70 },
      { name: 'JavaScript', abbr: 'JS', level: 72 },
      { name: 'HTML & CSS', abbr: 'HT', level: 78 },
    ],
  },
  {
    label: 'Tools & Platforms',
    color: '#b8662e',
    items: [
      { name: 'GitHub', abbr: 'GH', level: 85 },
      { name: 'VS Code', abbr: 'VS', level: 90 },
      { name: 'Android Studio', abbr: 'AS', level: 80 },
      { name: 'NetCloud Manager', abbr: 'NC', level: 88 },
      { name: 'IntelliJ IDEA', abbr: 'IJ', level: 78 },
      { name: 'Linux', abbr: 'LX', level: 72 },
      { name: 'Microsoft Suite', abbr: 'MS', level: 85 },
    ],
  },
  {
    label: 'Professional',
    color: '#3a7fb8',
    items: [
      { name: 'Problem Solving', abbr: 'PS', level: 95 },
      { name: 'Technical Support', abbr: 'TS', level: 92 },
      { name: 'Documentation', abbr: 'DC', level: 83 },
      { name: 'Collaboration', abbr: 'CO', level: 88 },
      { name: 'Adaptability', abbr: 'AD', level: 90 },
      { name: 'Critical Thinking', abbr: 'CT', level: 90 },
    ],
  },
]
