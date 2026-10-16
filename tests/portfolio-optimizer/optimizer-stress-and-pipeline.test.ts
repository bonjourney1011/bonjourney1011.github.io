// Property checks on a synthetic 10-stock universe, plus the full pipeline on real (public) prices.
import { describe, expect, it } from 'vitest';
import snapshot from '../../public/data/portfolio-optimizer/demo-prices.json';
import { TRADING_DAYS, covarianceMatrix, mean, scaleMatrix } from '../../src/scripts/portfolio-optimizer/matrix-and-statistics-helpers';
import {
  type MarketInputs,
  efficientFrontier,
  maxSharpeWithVolatilityCap,
  minimumVariancePortfolio,
  randomPortfolioCloud,
  tangencyPortfolio,
} from '../../src/scripts/portfolio-optimizer/mean-variance-portfolio-optimizers';
import { analyzePortfolios } from '../../src/scripts/portfolio-optimizer/portfolio-analysis-pipeline';
import { alignOnCommonDates } from '../../src/scripts/portfolio-optimizer/return-series-alignment';

// Deterministic PRNG (mulberry32) so the test is reproducible.
function prng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function syntheticInputs(n: number, days: number, rf: number): MarketInputs {
  const rand = prng(42);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
  const market = Array.from({ length: days }, () => 0.012 * gauss());
  const returns = Array.from({ length: n }, (_, i) => {
    const beta = 0.5 + i * 0.12;
    const drift = (i % 4) * 0.0006 - 0.0002;
    return market.map((m) => drift + beta * m + 0.015 * gauss());
  });
  return {
    mu: returns.map((r) => mean(r) * TRADING_DAYS),
    cov: scaleMatrix(covarianceMatrix(returns), TRADING_DAYS),
    rf,
  };
}

describe('synthetic 10-stock universe', () => {
  const inputs = syntheticInputs(10, 500, 0.04);
  const cloud = randomPortfolioCloud(inputs, 20000, prng(7));
  const mvp = minimumVariancePortfolio(inputs);
  const tangency = tangencyPortfolio(inputs)!;

  it('weights are long-only and fully invested', () => {
    for (const p of [mvp, tangency]) {
      expect(Math.min(...p.weights)).toBeGreaterThanOrEqual(0);
      expect(p.weights.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 9);
    }
  });

  it('no random portfolio beats the MVP on risk or the tangency on Sharpe', () => {
    expect(Math.min(...cloud.map((p) => p.volatility))).toBeGreaterThanOrEqual(mvp.volatility - 1e-12);
    const bestRandomSharpe = Math.max(...cloud.map((p) => (p.expectedReturn - inputs.rf) / p.volatility));
    expect(bestRandomSharpe).toBeLessThanOrEqual(tangency.sharpe + 1e-12);
  });

  it('frontier risk rises with return and the cap binds exactly', () => {
    const frontier = efficientFrontier(inputs, mvp, 30);
    frontier.slice(1).forEach((p, i) => expect(p.volatility).toBeGreaterThanOrEqual(frontier[i].volatility - 1e-12));
    const cap = (mvp.volatility + tangency.volatility) / 2;
    const capped = maxSharpeWithVolatilityCap(inputs, cap);
    expect(capped.status).toBe('capped');
    expect(capped.portfolio!.volatility).toBeCloseTo(cap, 6);
  });
});

describe('pipeline on public VNDirect prices (BSR, HDB, VIC; 10/2025 – 10/2026) with a train/test split', () => {
  const inRange = (d: string) => d >= '2025-10-14' && d <= '2026-10-13';
  const prices = alignOnCommonDates(
    ['VNINDEX', 'BSR', 'HDB', 'VIC'].map((symbol) => {
      const s = snapshot.series.find((x) => x.symbol === symbol)!;
      return { symbol, dates: s.dates.filter(inRange), closes: s.closes.filter((_, i) => inRange(s.dates[i])) };
    }),
  );
  const result = analyzePortfolios(prices, { rf: 0.044, cap: 0.15, splitDate: '2026-07-01' });

  it('stock-only cap of 15% is infeasible for three volatile stocks', () => {
    expect(result.capStatus).toBe('infeasible');
    expect(result.riskyOnly.some((p) => p.id === 'capped')).toBe(false);
  });

  it('with the risk-free asset, the first portfolio is the CAL mix at σ = 15%', () => {
    const first = result.withRiskFree[0];
    expect(first.id).toBe('complete');
    expect(first.volatility).toBeCloseTo(0.15, 9);
    expect(first.sharpe).toBeCloseTo(result.tangency!.sharpe, 12);
    expect(first.riskFreeWeight + first.weights.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 12);
  });

  it('backtest starts at 1 on the last train day and covers every portfolio', () => {
    const backtest = result.backtest!;
    expect(backtest.dates[0]).toBe(result.trainDates[1]);
    for (const p of result.withRiskFree) {
      expect(backtest.wealth[p.id][0]).toBeCloseTo(1, 12);
      expect(p.outOfSample).toBeDefined();
    }
  });

  it('rejects a test window that is too short or outside the data', () => {
    expect(() => analyzePortfolios(prices, { rf: 0.04, cap: 0.15, splitDate: '2026-10-01' })).toThrow(/at least 20 trading days/);
    expect(() => analyzePortfolios(prices, { rf: 0.04, cap: 0.15, splitDate: '2020-01-01' })).toThrow(/at least 20 trading days/);
  });

  it('rejects an estimation window that is too short', () => {
    expect(() => analyzePortfolios(prices, { rf: 0.04, cap: 0.15, splitDate: '2025-11-01' })).toThrow(/at least 60/);
  });
});
