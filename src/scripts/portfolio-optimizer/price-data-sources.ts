// Daily close prices for Vietnamese stocks and indices, fetched live from the browser.
// Primary: VNDirect chart API (split/bonus-share adjusted; stocks from 2013, VN-Index from 08/2017).
// Fallback: KB Securities (same adjusted closes, prices in VND).
// Both answer with Access-Control-Allow-Origin: *, so no proxy is needed. Responses are cached for
// 12 hours (or until that day's close) in localStorage; a bundled snapshot is the last resort when both APIs are unreachable.
import { withBase } from '../../lib/url-helpers';
import type { PriceSeries } from './return-series-alignment';

export type PriceSource = 'VNDirect' | 'KBS' | 'Snapshot';
export interface SourcedSeries extends PriceSeries {
  source: PriceSource;
}

const INDEX_SYMBOLS = new Set(['VNINDEX', 'VN30', 'HNX', 'HNX30', 'UPCOM']);
const CACHE_PREFIX = 'portfolio-optimizer:v1:';
const CACHE_TTL_MS = 12 * 3600 * 1000;
const TIMEOUT_MS = 15000;
const DAY_MS = 86400 * 1000;

async function getJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text(); // VNDirect labels its JSON as text/plain
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
}

async function fromVndirect(symbol: string, from: string, to: string): Promise<PriceSeries> {
  const start = Date.parse(`${from}T00:00:00Z`) / 1000;
  const end = (Date.parse(`${to}T00:00:00Z`) + DAY_MS) / 1000;
  const url = `https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=${encodeURIComponent(symbol)}&from=${start}&to=${end}`;
  const data = (await getJson(url)) as { s?: string; t?: number[]; c?: number[] } | null;
  if (!data || data.s !== 'ok' || !data.t?.length || !data.c) throw new Error('no data');
  return { symbol, dates: data.t.map((sec) => new Date(sec * 1000).toISOString().slice(0, 10)), closes: data.c };
}

async function fromKbs(symbol: string, from: string, to: string): Promise<PriceSeries> {
  const ddmmyyyy = (iso: string) => iso.split('-').reverse().join('-');
  const kind = INDEX_SYMBOLS.has(symbol) ? 'index' : 'stocks';
  const url = `https://kbbuddywts.kbsec.com.vn/iis-server/investment/${kind}/${encodeURIComponent(symbol)}/data_day?sdate=${ddmmyyyy(from)}&edate=${ddmmyyyy(to)}`;
  const data = (await getJson(url)) as { data_day?: { t: string; c: number }[] } | null;
  const rows = data?.data_day ?? [];
  if (!rows.length) throw new Error('no data');
  return { symbol, dates: rows.map((r) => r.t.slice(0, 10)), closes: rows.map((r) => r.c) };
}

/** Sorts oldest-first, drops duplicates, bad prices, dates outside the range and today's unfinished session. */
function cleanSeries(series: PriceSeries, from: string, to: string): PriceSeries {
  const vietnamNow = new Date(Date.now() + 7 * 3600 * 1000);
  const today = vietnamNow.toISOString().slice(0, 10);
  const marketClosed = vietnamNow.getUTCHours() >= 15;
  const byDate = new Map<string, number>();
  series.dates.forEach((d, i) => {
    const close = series.closes[i];
    if (d >= from && d <= to && Number.isFinite(close) && close > 0 && (d < today || marketClosed)) byDate.set(d, close);
  });
  const dates = [...byDate.keys()].sort();
  return { symbol: series.symbol, dates, closes: dates.map((d) => byDate.get(d) as number) };
}

/** Fresh = younger than the TTL and not saved before today's 15:00 close (08:00 UTC) if the market has closed since. */
function isFresh(savedAt: number): boolean {
  const now = Date.now();
  const todayClose = Date.parse(`${new Date(now + 7 * 3600 * 1000).toISOString().slice(0, 10)}T08:00:00Z`);
  return now - savedAt < CACHE_TTL_MS && !(savedAt < todayClose && now >= todayClose);
}

/** Drops expired entries so old date ranges don't pile up in the shared github.io storage quota. */
function pruneCache(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(CACHE_PREFIX)) continue;
      const savedAt = (JSON.parse(localStorage.getItem(key) ?? '{}') as { savedAt?: number }).savedAt ?? 0;
      if (!isFresh(savedAt)) localStorage.removeItem(key);
    }
  } catch {
    // Storage blocked: nothing to prune.
  }
}

function readCache(key: string): SourcedSeries | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { savedAt, series } = JSON.parse(raw) as { savedAt: number; series: SourcedSeries };
    return isFresh(savedAt) ? series : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, series: SourcedSeries): void {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), series }));
  } catch {
    // Storage full or blocked (private mode): caching is only a convenience.
  }
}

const LOADERS = [
  ['VNDirect', fromVndirect],
  ['KBS', fromKbs],
] as const;

/**
 * `unreachable` is shared across one batch: a source that times out or errors is skipped for the remaining
 * symbols, so a hanging API costs one timeout instead of one per symbol.
 */
export async function fetchDailyCloses(
  symbol: string,
  from: string,
  to: string,
  unreachable = new Set<PriceSource>(),
): Promise<SourcedSeries> {
  const key = `${CACHE_PREFIX}${symbol}:${from}:${to}`;
  const cached = readCache(key);
  if (cached) return cached;

  let series: SourcedSeries | null = null;
  let anyAnswered = false; // a source replied but had nothing for this symbol/range
  for (const [source, load] of LOADERS) {
    if (unreachable.has(source)) continue;
    try {
      const cleaned = cleanSeries(await load(symbol, from, to), from, to);
      anyAnswered = true;
      if (cleaned.dates.length) {
        series = { ...cleaned, source };
        break;
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'no data') anyAnswered = true;
      else unreachable.add(source);
    }
  }
  if (!series) {
    throw new Error(
      anyAnswered
        ? `No price data for ${symbol} in this date range. Check the ticker.`
        : 'Could not reach the price APIs (VNDirect, KBS). Check your connection and try again.',
    );
  }
  writeCache(key, series);
  return series;
}

/** Loads symbols one at a time (gentle on the free APIs) and reports progress. */
export async function fetchManyDailyCloses(
  symbols: string[],
  from: string,
  to: string,
  onProgress: (done: number, total: number) => void,
): Promise<SourcedSeries[]> {
  pruneCache();
  const unreachable = new Set<PriceSource>();
  const result: SourcedSeries[] = [];
  for (const symbol of symbols) {
    result.push(await fetchDailyCloses(symbol, from, to, unreachable));
    onProgress(result.length, symbols.length);
  }
  return result;
}

/** Bundled snapshot (scripts/fetch-portfolio-optimizer-demo-prices.mjs). Null unless it covers every symbol. */
export async function loadSnapshotCloses(symbols: string[], from: string, to: string): Promise<SourcedSeries[] | null> {
  try {
    const response = await fetch(withBase('/data/portfolio-optimizer/demo-prices.json'));
    if (!response.ok) return null;
    const snapshot = (await response.json()) as { series: PriceSeries[] };
    const found = symbols.map((s) => snapshot.series.find((x) => x.symbol === s));
    if (found.some((s) => !s)) return null;
    return found.map((s) => ({ ...cleanSeries(s as PriceSeries, from, to), source: 'Snapshot' as const }));
  } catch {
    return null;
  }
}
