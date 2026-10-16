// Buy-and-hold wealth paths and realised performance over the out-of-sample (test) window.
import { TRADING_DAYS, mean, sampleCovariance } from './matrix-and-statistics-helpers';
import { simpleReturns } from './return-series-alignment';

export interface PerformanceSummary {
  annualReturn: number; // mean daily return × 252 (course convention)
  volatility: number; // daily σ × √252
  sharpe: number;
  maxDrawdown: number; // largest peak-to-trough fall, as a positive fraction
  totalReturn: number;
}

/**
 * Growth of 1 VND invested at closes[·][0] and held without rebalancing.
 * The risk-free share accrues Rf / 252 per trading day.
 */
export function buyAndHoldWealth(closes: number[][], weights: number[], riskFreeWeight: number, rf: number): number[] {
  return closes[0].map((_, t) => {
    const risky = weights.reduce((sum, w, i) => sum + (w ? (w * closes[i][t]) / closes[i][0] : 0), 0);
    return risky + riskFreeWeight * (1 + rf / TRADING_DAYS) ** t;
  });
}

export function summarizeWealth(wealth: number[], rf: number): PerformanceSummary {
  const returns = simpleReturns(wealth);
  const annualReturn = mean(returns) * TRADING_DAYS;
  const volatility = Math.sqrt(Math.max(0, sampleCovariance(returns, returns)) * TRADING_DAYS);
  let peak = wealth[0];
  let maxDrawdown = 0;
  for (const value of wealth) {
    peak = Math.max(peak, value);
    maxDrawdown = Math.max(maxDrawdown, 1 - value / peak);
  }
  return {
    annualReturn,
    volatility,
    sharpe: volatility > 1e-12 ? (annualReturn - rf) / volatility : 0,
    maxDrawdown,
    totalReturn: wealth[wealth.length - 1] / wealth[0] - 1,
  };
}
