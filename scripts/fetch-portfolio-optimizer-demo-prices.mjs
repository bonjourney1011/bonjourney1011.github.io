// Refreshes the offline snapshot used by the portfolio optimizer when the live price APIs are unreachable.
// Usage: node scripts/fetch-portfolio-optimizer-demo-prices.mjs
// Source: VNDirect chart API (public, split-adjusted daily closes). Output: public/data/portfolio-optimizer/demo-prices.json
import { mkdir, writeFile } from 'node:fs/promises';

const SYMBOLS = ['VNINDEX', 'FPT', 'VCB', 'HPG', 'MWG', 'GAS', 'VNM', 'REE', 'BSR', 'HDB', 'VIC'];
const FROM = '2020-01-01';
const OUT_DIR = new URL('../public/data/portfolio-optimizer/', import.meta.url);

const from = Date.parse(`${FROM}T00:00:00Z`) / 1000;
const to = Math.floor(Date.now() / 1000);
const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const series = [];

for (const symbol of SYMBOLS) {
  const url = `https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=${symbol}&from=${from}&to=${to}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${symbol}: HTTP ${response.status}`);
  const data = JSON.parse(await response.text());
  if (data.s !== 'ok' || !data.t?.length) throw new Error(`${symbol}: no data`);
  // Keep finished sessions only: drop today's bar (Vietnam time), which may still be trading.
  const dates = data.t.map((sec) => new Date(sec * 1000).toISOString().slice(0, 10));
  const keep = dates.map((d) => d < today);
  series.push({ symbol, dates: dates.filter((_, i) => keep[i]), closes: data.c.filter((_, i) => keep[i]) });
  console.log(`${symbol}: ${keep.filter(Boolean).length} sessions`);
  await new Promise((resolve) => setTimeout(resolve, 300));
}

await mkdir(OUT_DIR, { recursive: true });
const generatedAt = today;
await writeFile(new URL('demo-prices.json', OUT_DIR), JSON.stringify({ generatedAt, source: 'VNDirect', series }));
console.log(`Saved ${series.length} series (${generatedAt}).`);
