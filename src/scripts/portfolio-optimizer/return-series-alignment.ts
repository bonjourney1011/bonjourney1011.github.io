// Turns per-symbol price histories into one date-aligned price table and simple returns.

export interface PriceSeries {
  symbol: string;
  dates: string[]; // YYYY-MM-DD
  closes: number[];
}

export interface AlignedPrices {
  symbols: string[];
  dates: string[]; // ascending (oldest first), trading days common to every symbol
  closes: number[][]; // closes[asset][day]
}

/** Inner join on dates: keeps only sessions where every symbol traded (suspensions and new listings drop out). */
export function alignOnCommonDates(series: PriceSeries[]): AlignedPrices {
  const lookups = series.map((s) => new Map(s.dates.map((d, i) => [d, s.closes[i]])));
  const dates = [...lookups[0].keys()]
    .filter((d) => lookups.every((m) => Number.isFinite(m.get(d)) && (m.get(d) as number) > 0))
    .sort();
  return {
    symbols: series.map((s) => s.symbol),
    dates,
    closes: lookups.map((m) => dates.map((d) => m.get(d) as number)),
  };
}

/** R_t = P_t / P_{t−1} − 1 (one fewer value than prices). */
export function simpleReturns(closes: number[]): number[] {
  return closes.slice(1).map((p, i) => p / closes[i] - 1);
}
