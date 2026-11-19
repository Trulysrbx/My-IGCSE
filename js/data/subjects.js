// Cambridge IGCSE subjects. To add a subject, copy an entry and fill it in —
// see CONTRIBUTING.md. Fields:
//   code       4-digit syllabus code
//   slug       name used in archive URLs (e.g. "biology" in biology-0610)
//   papers     { paperNumber: description } — the components with written papers
//   inserts    paper numbers that come with an insert (reading booklet, source, etc.)
//   march      false if there is no Feb/March series
//   topics     syllabus topics for the confidence tracker (current syllabus)

export const SUBJECTS = [
  {
    code: '0580', name: 'Mathematics', slug: 'mathematics', group: 'Mathematics', icon: '∑',
    papers: { 1: 'Core (non-calculator)', 2: 'Extended (non-calculator)', 3: 'Core (calculator)', 4: 'Extended (calculator)' },
    note: 'From 2025 papers 1–2 are non-calculator and 3–4 calculator. Before 2025, papers 1/3 were Core and 2/4 Extended (all calculator).',
    topics: [
      'Number: types of number, HCF & LCM', 'Powers, roots & standard form', 'Fractions, decimals & percentages',
      'Ratio, proportion & rates', 'Bounds, estimation & rounding', 'Money, interest & depreciation',
      'Algebraic manipulation & factorising', 'Equations & inequalities', 'Simultaneous equations', 'Quadratics',
      'Sequences', 'Functions (composite & inverse)', 'Graphs of functions', 'Differentiation (Extended)',
      'Coordinate geometry: gradients & straight lines', 'Geometrical constructions & scale drawings',
      'Angle properties & polygons', 'Circle theorems', 'Similarity & congruence', 'Mensuration: area & volume',
      'Pythagoras & trigonometry', 'Sine & cosine rules, 3D trig', 'Transformations', 'Vectors',
      'Probability', 'Statistics: averages & charts', 'Cumulative frequency & histograms',
    ],
  },
  {
    code: '0606', name: 'Additional Mathematics', slug: 'mathematics-additional', group: 'Mathematics', icon: '∫',
    papers: { 1: 'Paper 1 (non-calculator)', 2: 'Paper 2 (calculator)' },
    march: true,
    topics: [
      'Functions', 'Quadratic functions', 'Factors of polynomials', 'Equations, inequalities & graphs',
      'Simultaneous equations', 'Logarithmic & exponential functions', 'Straight-line graphs', 'Coordinate geometry of the circle',
      'Circular measure', 'Trigonometry', 'Permutations & combinations', 'Series (binomial, AP, GP)',
      'Vectors in 2 dimensions', 'Differentiation', 'Integration', 'Kinematics',
    ],
  },
  {
    code: '0610', name: 'Biology', slug: 'biology', group: 'Sciences', icon: '🧬',
    papers: { 1: 'Multiple choice (Core)', 2: 'Multiple choice (Extended)', 3: 'Theory (Core)', 4: 'Theory (Extended)', 5: 'Practical test', 6: 'Alternative to practical' },
    topics: [
      'Characteristics & classification of living organisms', 'Organisation of the organism', 'Movement into & out of cells',
      'Biological molecules', 'Enzymes', 'Plant nutrition', 'Human nutrition', 'Transport in plants', 'Transport in animals',
      'Diseases & immunity', 'Gas exchange in humans', 'Respiration', 'Excretion in humans', 'Coordination & response',
      'Drugs', 'Reproduction', 'Inheritance', 'Variation & selection', 'Organisms & their environment',
      'Human influences on ecosystems', 'Biotechnology & genetic modification',
    ],
  },
  {
    code: '0620', name: 'Chemistry', slug: 'chemistry', group: 'Sciences', icon: '⚗️',
    papers: { 1: 'Multiple choice (Core)', 2: 'Multiple choice (Extended)', 3: 'Theory (Core)', 4: 'Theory (Extended)', 5: 'Practical test', 6: 'Alternative to practical' },
    topics: [
      'States of matter', 'Atoms, elements & compounds', 'Stoichiometry & the mole', 'Electrochemistry',
      'Chemical energetics', 'Chemical reactions: rates & equilibrium', 'Redox', 'Acids, bases & salts', 'The Periodic Table',
      'Metals & reactivity series', 'Extraction of metals', 'Chemistry of the environment', 'Organic chemistry: fuels & alkanes',
      'Alkenes, alcohols & carboxylic acids', 'Polymers', 'Experimental techniques', 'Chemical analysis & tests for ions',
    ],
  },
  {
    code: '0625', name: 'Physics', slug: 'physics', group: 'Sciences', icon: '⚛️',
    papers: { 1: 'Multiple choice (Core)', 2: 'Multiple choice (Extended)', 3: 'Theory (Core)', 4: 'Theory (Extended)', 5: 'Practical test', 6: 'Alternative to practical' },
    topics: [
      'Physical quantities & measurement', 'Motion', 'Mass, weight & density', 'Forces', 'Momentum',
      'Energy, work & power', 'Pressure', 'Kinetic particle model of matter', 'Thermal properties & temperature',
      'Transfer of thermal energy', 'General properties of waves', 'Light: reflection, refraction & lenses',
      'Electromagnetic spectrum', 'Sound', 'Magnetism', 'Electrical quantities', 'Electric circuits', 'Electrical safety',
      'Electromagnetic effects', 'Nuclear model of the atom', 'Radioactivity', 'Earth & the Solar System', 'Stars & the Universe',
    ],
  },
  {
    code: '0654', name: 'Co-ordinated Sciences (Double)', slug: 'co-ordinated-sciences-double', group: 'Sciences', icon: '🔬',
    papers: { 1: 'Multiple choice (Core)', 2: 'Multiple choice (Extended)', 3: 'Theory (Core)', 4: 'Theory (Extended)', 5: 'Practical test', 6: 'Alternative to practical' },
    topics: ['Biology topics (see 0610)', 'Chemistry topics (see 0620)', 'Physics topics (see 0625)'],
  },
  {
    code: '0478', name: 'Computer Science', slug: 'computer-science', group: 'Technology', icon: '💻',
    papers: { 1: 'Computer systems', 2: 'Algorithms, programming & logic' },
    topics: [
      'Data representation', 'Data transmission', 'Hardware', 'Software', 'The internet & its uses',
      'Automated & emerging technologies', 'Algorithm design & problem-solving', 'Programming', 'Databases', 'Boolean logic',
    ],
  },
  {
    code: '0417', name: 'Information & Communication Technology', slug: 'information-and-communication-technology', group: 'Technology', icon: '🖥️',
    papers: { 1: 'Theory', 2: 'Document production, databases & presentations', 3: 'Spreadsheets & website authoring' },
    topics: [
      'Types & components of computer systems', 'Input & output devices', 'Storage devices & media', 'Networks & the effects of using them',
      'Effects of using IT', 'ICT applications', 'The systems life cycle', 'Safety & security', 'Audience',
      'Communication', 'File management', 'Images', 'Layout', 'Styles', 'Proofing', 'Graphs & charts',
      'Document production', 'Databases', 'Presentations', 'Spreadsheets', 'Website authoring',
    ],
  },
  {
    code: '0500', name: 'English – First Language', slug: 'english-first-language', group: 'Languages', icon: '📖',
    papers: { 1: 'Reading', 2: 'Directed writing & composition' },
    inserts: [1],
    topics: ['Explicit & implicit meaning', 'Summary writing', 'Writer\'s effect / language analysis', 'Directed writing', 'Descriptive writing', 'Narrative writing', 'Spelling, punctuation & grammar'],
  },
  {
    code: '0510', name: 'English as a Second Language (Speaking endorsement)', slug: 'english-as-a-second-language-speaking-endorsement', group: 'Languages', icon: '🗣️',
    papers: { 1: 'Reading & writing (Core)', 2: 'Reading & writing (Extended)', 3: 'Listening (Core)', 4: 'Listening (Extended)' },
    topics: ['Reading for detail', 'Note-making', 'Summary writing', 'Informal writing (email/letter)', 'Formal writing (article/report/review)', 'Listening for gist & detail'],
  },
  {
    code: '0475', name: 'Literature in English', slug: 'literature-in-english', group: 'Languages', icon: '🎭',
    papers: { 1: 'Poetry & prose', 2: 'Drama', 3: 'Drama (open text)', 4: 'Unseen' },
    topics: ['Poetry set texts', 'Prose set texts', 'Drama set texts', 'Unseen poetry', 'Unseen prose', 'Essay structure & quotations'],
  },
  {
    code: '0520', name: 'French (Foreign Language)', slug: 'french-foreign-language', group: 'Languages', icon: '🇫🇷',
    papers: { 1: 'Listening', 2: 'Reading', 4: 'Writing' },
    topics: ['Everyday activities', 'Personal & social life', 'The world around us', 'The world of work', 'The international world', 'Grammar: tenses', 'Grammar: pronouns & agreement'],
  },
  {
    code: '0530', name: 'Spanish (Foreign Language)', slug: 'spanish-foreign-language', group: 'Languages', icon: '🇪🇸',
    papers: { 1: 'Listening', 2: 'Reading', 4: 'Writing' },
    topics: ['Everyday activities', 'Personal & social life', 'The world around us', 'The world of work', 'The international world', 'Grammar: tenses', 'Grammar: ser/estar & pronouns'],
  },
  {
    code: '0455', name: 'Economics', slug: 'economics', group: 'Humanities & Social Sciences', icon: '📈',
    papers: { 1: 'Multiple choice', 2: 'Structured questions' },
    topics: [
      'The basic economic problem', 'Allocation of resources: demand & supply', 'Price elasticity', 'Market failure & mixed economy',
      'Money & banking', 'Households & workers', 'Trade unions', 'Firms & production', 'Market structure',
      'Role of government & fiscal policy', 'Monetary & supply-side policy', 'Economic growth', 'Employment & unemployment',
      'Inflation & deflation', 'Living standards & poverty', 'Population', 'Development', 'International specialisation & free trade',
      'Globalisation & protection', 'Foreign exchange rates', 'Current account of the balance of payments',
    ],
  },
  {
    code: '0450', name: 'Business Studies', slug: 'business-studies', group: 'Humanities & Social Sciences', icon: '💼',
    papers: { 1: 'Short answer & data response', 2: 'Case study' },
    inserts: [2],
    topics: [
      'Business activity', 'Classification of businesses', 'Enterprise, growth & size', 'Types of business organisation',
      'Business objectives & stakeholders', 'Motivating employees', 'Organisation & management', 'Recruitment, selection & training',
      'Internal & external communication', 'Marketing, competition & the customer', 'Market research', 'Marketing mix',
      'Marketing strategy', 'Production of goods & services', 'Costs, scale & break-even', 'Quality', 'Location decisions',
      'Business finance', 'Cash flow forecasting & working capital', 'Income statements', 'Statement of financial position',
      'Analysis of accounts', 'Economic issues', 'Environmental & ethical issues', 'Business & the international economy',
    ],
  },
  {
    code: '0452', name: 'Accounting', slug: 'accounting', group: 'Humanities & Social Sciences', icon: '🧾',
    papers: { 1: 'Multiple choice', 2: 'Structured written paper' },
    topics: [
      'Introduction to accounting', 'Double-entry bookkeeping', 'Business documents', 'Books of prime entry', 'Verification of accounting records',
      'Bank reconciliation', 'Control accounts', 'Correction of errors', 'Accounting procedures: capital & revenue',
      'Depreciation & disposal', 'Irrecoverable debts', 'Accruals & prepayments', 'Financial statements: sole traders',
      'Partnerships', 'Limited companies', 'Clubs & societies', 'Manufacturing accounts', 'Incomplete records',
      'Analysis & interpretation (ratios)', 'Accounting principles & policies',
    ],
  },
  {
    code: '0460', name: 'Geography', slug: 'geography', group: 'Humanities & Social Sciences', icon: '🌍',
    papers: { 1: 'Geographical themes', 2: 'Geographical skills', 4: 'Alternative to coursework' },
    inserts: [1, 2],
    topics: [
      'Population dynamics', 'Migration', 'Population structure', 'Population density & distribution', 'Settlements & service provision',
      'Urban settlements', 'Urbanisation', 'Earthquakes & volcanoes', 'Rivers', 'Coasts', 'Weather', 'Climate & natural ecosystems',
      'Development', 'Food production', 'Industry', 'Tourism', 'Energy', 'Water', 'Environmental risks of economic development',
      'Map skills & grid references', 'Fieldwork skills',
    ],
  },
  {
    code: '0470', name: 'History', slug: 'history', group: 'Humanities & Social Sciences', icon: '🏛️',
    papers: { 1: 'Structured questions', 2: 'Source-based questions', 4: 'Alternative to coursework' },
    inserts: [2],
    topics: [
      'Were the peace treaties of 1919–23 fair?', 'To what extent was the League of Nations a success?',
      'Why had international peace collapsed by 1939?', 'Who was to blame for the Cold War?',
      'How effectively did the USA contain the spread of Communism?', 'How secure was the USSR\'s control over Eastern Europe, 1948–c.1989?',
      'Why did events in the Gulf matter, c.1970–2000?', 'Depth study (e.g. Germany 1918–45)', 'Source analysis skills',
    ],
  },
  {
    code: '0495', name: 'Sociology', slug: 'sociology', group: 'Humanities & Social Sciences', icon: '👥',
    papers: { 1: 'Paper 1', 2: 'Paper 2' },
    topics: ['Research methods', 'Identity: self & society', 'Social inequality', 'Family', 'Education', 'Crime, deviance & social control', 'Media'],
  },
  {
    code: '0457', name: 'Global Perspectives', slug: 'global-perspectives', group: 'Humanities & Social Sciences', icon: '🌐',
    papers: { 1: 'Written examination' },
    march: false,
    topics: ['Analysis', 'Evaluation', 'Reflection', 'Communication', 'Research skills', 'Collaboration'],
  },
];

export const subjectByCode = (code) => SUBJECTS.find((s) => s.code === code);

export function groupedSubjects(list = SUBJECTS) {
  const groups = new Map();
  for (const s of list) {
    if (!groups.has(s.group)) groups.set(s.group, []);
    groups.get(s.group).push(s);
  }
  return [...groups.entries()];
}
