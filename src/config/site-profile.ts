// Single source of truth for identity, links and homepage numbers.
// Edit this file to change what the sidebar, header, footer and SEO tags show.

export const profile = {
  brand: 'Mo Thuần',
  fullName: 'Van Thi Thuan',
  role: 'Data Analyst',
  focus: 'Economics × Finance × E-commerce',
  location: 'Hanoi, Vietnam',
  avatar: '/images/avatar.jpg', // square photo; set '' to show initials instead
  initials: 'MT',
  shortBio:
    'I help e-commerce and finance teams find out what really moved their numbers — and what to do about it.',
  availability: 'Passionate about data in commerce, fintech & banking',
  email: 'chucnguyen1779@gmail.com',
  // Put a public CV (without your phone number) at public/cv.pdf and set '/cv.pdf'.
  cvUrl: '',
  seoTitle: 'Mo Thuần · Data Analyst — Economics, Finance & E-commerce',
  seoDescription:
    'Portfolio of Mo Thuần (Van Thi Thuan), a data analyst with an economics and finance background solving real e-commerce business problems with SQL, dbt, Power BI and machine learning.',
};

export const socialLinks = [
  { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/in/thunbonmo' },
  { label: 'GitHub', icon: 'github', href: 'https://github.com/bonjourney1011' },
  { label: 'Email', icon: 'email', href: `mailto:${profile.email}` },
] as const;

export const navLinks = [
  { label: 'Work', href: '/work' },
  { label: 'Dashboards', href: '/dashboards' },
  { label: 'My Own', href: '/my-own' },
  { label: 'About', href: '/about' },
];

// Homepage "impact ledger". Every number here must be traceable to the CV or a repo.
export const impactLedger = [
  {
    value: '25.8%',
    label: 'of livestream GMV driven by a 192-product basket I recommended',
    note: '8.6× GMV per product vs. self-picks',
  },
  {
    value: '−53% → −8.8%',
    label: 'a false "profit collapse" reframed with like-for-like analysis',
    note: 'plus a +70.3M overstatement caught',
  },
  {
    value: '107M+',
    label: 'marketplace SKUs processed to build model features',
    note: 'ClickHouse · dbt · Python',
  },
  {
    value: 'Q1',
    label: 'Scopus journal co-author on commodity futures forecasting',
    note: 'Accepted 09/2026',
  },
];

// Hosts allowed inside <iframe>. Mirrors the CSP `frame-src` in base-layout.astro.
export const POWERBI_EMBED_PREFIX = 'https://app.powerbi.com/view?r=';
