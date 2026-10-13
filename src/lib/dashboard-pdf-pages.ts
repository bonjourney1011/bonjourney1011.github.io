// Finds the page-N.jpg images rendered next to a dashboard PDF (build time only).
// Generate them with: python scripts/render-dashboard-pdf-pages.py public/<pdf path>
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PAGE_IMAGE = /^page-(\d+)\.jpg$/;

export function getPdfPageImages(pdfPath: string | undefined): string[] {
  if (!pdfPath) return [];
  const publicDir = join(process.cwd(), 'public', dirname(pdfPath));
  if (!existsSync(publicDir)) return [];
  return readdirSync(publicDir)
    .map((file) => ({ file, match: PAGE_IMAGE.exec(file) }))
    .filter((item): item is { file: string; match: RegExpExecArray } => item.match !== null)
    .sort((a, b) => Number(a.match[1]) - Number(b.match[1]))
    .map(({ file }) => `${dirname(pdfPath)}/${file}`.replace(/\\/g, '/'));
}
