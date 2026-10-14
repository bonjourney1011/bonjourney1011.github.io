// Experience, education, recognition and skills shown on the About page and homepage.
// Source: CV (2. Area/4. CV). Keep wording outcome-first: what changed for the business.

export const experience = [
  {
    org: 'Metric.vn — Data Science JSC',
    orgNote: 'E-commerce market intelligence platform, Vietnam',
    title: 'Data Analyst · Key Handler of the DA Team',
    period: '06/2025 — Present',
    points: [
      'Led an end-to-end livestream basket recommendation product (API → warehouse → dbt → ML → dashboards) that helped the company win a new client.',
      'Owned Beauty Care — the most complex category, ~50% of research revenue — serving 4 multinational brands with monthly Power BI reporting on 600K–740K SKU rows and 3+ more with ad-hoc analyses.',
      'Unified CRM (120K leads, 25K deals), Facebook Ads and GA4 into a full-funnel star schema behind 7 Power BI pages and 3 Metabase dashboards.',
      'Designed a combo revenue-restatement method that removed double-counted revenue while preserving market totals; presented in 3 internal seminars.',
    ],
  },
  {
    org: 'Dagoras Technology & Media',
    orgNote: 'Telecom & digital media',
    title: 'Data Scientist Intern',
    period: '05/2024 — 02/2025',
    points: [
      'Built churn models (Logistic Regression, Decision Tree) reaching 79% accuracy on at-risk customers.',
      'Profiled customer segments that tripled service-package conversion from 1% to 3%.',
    ],
  },
  {
    org: 'Math and Science Summer Program (MaSSP)',
    orgNote: 'Selective summer program',
    title: 'Data Science Mentee',
    period: '07/2023 — 08/2023',
    points: [
      'Built machine-learning models with Python, scikit-learn and TensorFlow.',
      'Completed a final project on tabular reinforcement learning (Q-Learning).',
    ],
  },
];

export const education = [
  {
    school: 'Foreign Trade University (FTU)',
    degree: 'Master of Applied Finance',
    period: '08/2026 — Present',
    note: 'Admitted ranked Top 6 of 90.',
  },
  {
    school: 'Foreign Trade University (FTU)',
    degree: 'B.A. International Economics — High Distinction',
    period: '2022 — 02/2026',
    note: 'GPA 3.74/4.0 · Thesis: Difference-in-Differences study of alcohol penalty policy on e-commerce (9.1/10).',
  },
];

export const recognition = [
  { year: '2026', title: 'Co-author, Scopus Q1 journal article', detail: 'Journal of Data Science and Intelligent Systems — commodity futures forecasting' },
  { year: '2026', title: 'Outstanding Student of FTU K61', detail: 'University-level honour' },
  { year: '2025', title: 'First Prize — FIT TechSpark 2025 (VNU-UET)', detail: 'InMentor, AI interview-prep startup · market research lead' },
  { year: '2025', title: 'Third Prize — FTU Student Research', detail: 'E-commerce return-fraud intent · team leader, 900+ responses' },
  { year: '2024', title: 'Top 11 nationally — MOSWC 2024', detail: 'Excel 365 Apps (VBA, Power Query) · 980/1000 qualifying score' },
  { year: '2023', title: 'Second Prize — FTU Calculus & Algebra Olympiad', detail: 'Plus Type A academic merit scholarships' },
];

export const skillGroups = [
  { group: 'Analysis & BI', items: ['SQL (CTEs, window functions)', 'Power BI — DAX, modelling, Power Query', 'Metabase', 'Excel / VBA'] },
  { group: 'Data engineering', items: ['dbt', 'ClickHouse (100M+ rows)', 'PostgreSQL', 'DuckDB', 'Airflow', 'Git'] },
  { group: 'Statistics & ML', items: ['Python (pandas, scikit-learn)', 'Gradient Boosting / LightGBM', 'Time-series forecasting', 'Econometrics (DiD)', 'SHAP'] },
  { group: 'Business domains', items: ['E-commerce & marketplaces', 'Unit economics & profitability', 'Financial markets', 'Market intelligence'] },
  { group: 'Data governance', items: ['Data quality tests', 'Freshness SLAs', 'Reconciliation', 'Star-schema design'] },
  { group: 'Languages', items: ['Vietnamese (native)', 'English (IELTS 6.5 equiv.)', 'Chinese (HSK 6)'] },
];

// "How I work" — the operating principles that make the analysis trustworthy.
export const workingPrinciples = [
  { step: '01', title: 'Frame the decision', text: 'Start from the decision a manager has to make, not the data that happens to exist.' },
  { step: '02', title: 'Audit before analysing', text: 'Check grain, freshness and reconciliation first — most "insights" are data artifacts.' },
  { step: '03', title: 'Model what moves money', text: 'Decompose results into volume, price and margin so every number has a business lever.' },
  { step: '04', title: 'Ship, then monitor', text: 'Deliver a dashboard or model with tests and hit-rate tracking, not a one-off slide.' },
];
