// Prefix internal paths with Astro's `base` so the site also works on a GitHub project page.
export function withBase(path: string): string {
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function isExternal(href: string): boolean {
  return /^https?:/.test(href);
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}
