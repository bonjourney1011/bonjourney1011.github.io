// Reads and validates the optimizer form; sets sensible default dates.

export interface OptimizerRequest {
  tickers: string[];
  rf: number; // annual, as a fraction
  cap: number; // annual σ ceiling, as a fraction
  start: string; // YYYY-MM-DD
  split: string | null; // first day of the test window
  end: string;
}

const MAX_TICKERS = 20;
const TICKER_PATTERN = /^[A-Z0-9]{3,10}$/;
const INDEX_CODES = new Set(['VNINDEX', 'VN30', 'HNX', 'HNX30', 'UPCOM']);
const DAY_MS = 86400 * 1000;
const FIRST_INDEX_DATE = '2017-08-24'; // earliest VN-Index session in the VNDirect API

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Today's date in Vietnam (UTC+7). */
export const vietnamToday = () => isoDate(Date.now() + 7 * 3600 * 1000);

/** End = today, start = 3 years earlier, split = 75% of the way (estimate on 3 parts, test on 1). */
export function setDefaultDates(form: HTMLFormElement): void {
  const end = vietnamToday();
  const endMs = Date.parse(end);
  const startMs = endMs - 3 * 365 * DAY_MS;
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
  field('end').value = end;
  field('end').max = end;
  field('start').value = isoDate(startMs);
  field('split').value = isoDate(startMs + 0.75 * (endMs - startMs));
}

export function readRequest(form: HTMLFormElement): OptimizerRequest {
  const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value.trim();

  const tickers = [
    ...new Set(
      value('tickers')
        .toUpperCase()
        .split(/[\s,;]+/)
        .filter(Boolean),
    ),
  ];
  const invalid = tickers.filter((t) => !TICKER_PATTERN.test(t) || INDEX_CODES.has(t));
  if (invalid.length) throw new Error(`Not a stock ticker: ${invalid.join(', ')}. VN-Index is added automatically as the benchmark.`);
  if (tickers.length < 2) throw new Error('Enter at least two tickers.');
  if (tickers.length > MAX_TICKERS) throw new Error(`Use at most ${MAX_TICKERS} tickers.`);

  // A number input returns '' for unparseable text (e.g. "4,4"), and Number('') would silently be 0.
  if (value('rf') === '' || value('cap') === '') throw new Error('Enter the risk-free rate and volatility cap as numbers, e.g. 4.4.');
  const rf = Number(value('rf')) / 100;
  const cap = Number(value('cap')) / 100;
  if (!Number.isFinite(rf) || rf < 0 || rf > 0.3) throw new Error('Risk-free rate must be between 0% and 30%.');
  if (!Number.isFinite(cap) || cap <= 0 || cap > 2) throw new Error('Volatility cap must be between 0% and 200%.');

  const start = value('start');
  const end = value('end');
  const split = value('split') || null;
  if (!start || !end || start >= end) throw new Error('The start date must be before the end date.');
  if (start < FIRST_INDEX_DATE) throw new Error(`VN-Index history starts on ${FIRST_INDEX_DATE}; choose a later start date.`);
  if (split && (split <= start || split >= end)) throw new Error('The test start must fall between the start and end dates.');

  return { tickers, rf, cap, start, split, end };
}
