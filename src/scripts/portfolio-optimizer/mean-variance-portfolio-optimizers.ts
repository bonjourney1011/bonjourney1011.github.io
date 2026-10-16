// Markowitz long-only optimizers for N assets (annualised μ, Σ and Rf).
// Generalises the course's 2- and 3-stock Excel Solver models: MVP, efficient frontier, max Sharpe,
// max Sharpe under a volatility cap, and the CAL mix of the tangency portfolio with the risk-free asset.
import { type Matrix, type Vector, dot, quadraticForm } from './matrix-and-statistics-helpers';
import { solveNonNegativeQuadraticProgram } from './active-set-quadratic-program-solver';

export interface MarketInputs {
  mu: Vector; // expected annual returns
  cov: Matrix; // annual covariance matrix
  rf: number; // annual risk-free rate
}

export interface PortfolioStats {
  weights: Vector; // risky weights; they sum to 1 − riskFreeWeight
  riskFreeWeight: number;
  expectedReturn: number;
  volatility: number;
  sharpe: number;
}

export type CapStatus = 'within-cap' | 'capped' | 'infeasible' | 'all-below-risk-free';

export function evaluatePortfolio(weights: Vector, { mu, cov, rf }: MarketInputs): PortfolioStats {
  const expectedReturn = dot(weights, mu);
  const volatility = Math.sqrt(Math.max(0, quadraticForm(weights, cov)));
  return { weights, riskFreeWeight: 0, expectedReturn, volatility, sharpe: (expectedReturn - rf) / volatility };
}

const unitVector = (n: number, k: number): Vector => Array.from({ length: n }, (_, i) => (i === k ? 1 : 0));
const argMax = (v: Vector): number => v.reduce((best, x, i) => (x > v[best] ? i : best), 0);

/** Minimum-variance portfolio: min wᵀΣw, Σw = 1, w ≥ 0. */
export function minimumVariancePortfolio(inputs: MarketInputs): PortfolioStats {
  const n = inputs.mu.length;
  const weights = solveNonNegativeQuadraticProgram(
    { q: inputs.cov, aEq: [new Array<number>(n).fill(1)], bEq: [1] },
    new Array<number>(n).fill(1 / n),
  );
  return evaluatePortfolio(weights, inputs);
}

/** Lowest-risk portfolio earning `target` (the "Solver min σ² at each target E(Rp)" step of the course). */
export function frontierPortfolio(target: number, inputs: MarketInputs, mvp: PortfolioStats): PortfolioStats {
  const n = inputs.mu.length;
  const top = argMax(inputs.mu);
  const span = inputs.mu[top] - mvp.expectedReturn;
  if (target >= inputs.mu[top]) return evaluatePortfolio(unitVector(n, top), inputs);
  if (span <= 1e-12 || target <= mvp.expectedReturn) return mvp;
  // Feasible start: blend of the MVP and the highest-return asset that hits the target exactly.
  const t = (target - mvp.expectedReturn) / span;
  const start = mvp.weights.map((w, i) => (1 - t) * w + (i === top ? t : 0));
  const weights = solveNonNegativeQuadraticProgram(
    { q: inputs.cov, aEq: [new Array<number>(n).fill(1), inputs.mu], bEq: [1, target] },
    start,
  );
  return evaluatePortfolio(weights, inputs);
}

/** Efficient (upper) branch of the long-only frontier, from the MVP to the highest-return asset. */
export function efficientFrontier(inputs: MarketInputs, mvp: PortfolioStats, points = 40): PortfolioStats[] {
  const top = Math.max(...inputs.mu);
  if (top - mvp.expectedReturn <= 1e-12) return [mvp];
  return Array.from({ length: points }, (_, i) =>
    frontierPortfolio(mvp.expectedReturn + ((top - mvp.expectedReturn) * i) / (points - 1), inputs, mvp),
  );
}

/**
 * Long-only max-Sharpe (tangency) portfolio as one convex QP:
 * min yᵀΣy s.t. (μ − Rf)ᵀy = 1, y ≥ 0, then w = y / Σy. Null when no asset beats Rf.
 */
export function tangencyPortfolio(inputs: MarketInputs): PortfolioStats | null {
  const excess = inputs.mu.map((m) => m - inputs.rf);
  const best = argMax(excess);
  if (excess[best] <= 0) return null;
  const y = solveNonNegativeQuadraticProgram(
    { q: inputs.cov, aEq: [excess], bEq: [1] },
    unitVector(excess.length, best).map((v) => v / excess[best]),
  );
  const total = y.reduce((sum, v) => sum + v, 0);
  return evaluatePortfolio(
    y.map((v) => (v / total < 1e-10 ? 0 : v / total)),
    inputs,
  );
}

/**
 * Max-Sharpe stock-only portfolio with σp ≤ cap. Sharpe is quasi-concave along the efficient frontier,
 * so if the tangency portfolio is too risky the optimum sits exactly where the frontier crosses σ = cap.
 */
export function maxSharpeWithVolatilityCap(
  inputs: MarketInputs,
  cap: number,
  mvp = minimumVariancePortfolio(inputs),
  tangency = tangencyPortfolio(inputs),
): { portfolio: PortfolioStats | null; status: CapStatus } {
  if (mvp.volatility > cap * (1 + 1e-9)) return { portfolio: null, status: 'infeasible' };

  if (tangency) {
    if (tangency.volatility <= cap) return { portfolio: tangency, status: 'within-cap' };
    let lo = mvp.expectedReturn;
    let hi = tangency.expectedReturn;
    let best = mvp;
    for (let i = 0; i < 60; i++) {
      const candidate = frontierPortfolio((lo + hi) / 2, inputs, mvp);
      if (candidate.volatility <= cap) {
        best = candidate;
        lo = (lo + hi) / 2;
      } else hi = (lo + hi) / 2;
    }
    return { portfolio: best, status: 'capped' };
  }

  // Every asset earns less than Rf: Sharpe is negative everywhere, so scan the frontier inside the cap.
  const candidates = efficientFrontier(inputs, mvp, 101).filter((p) => p.volatility <= cap);
  const portfolio = candidates.reduce((best, p) => (p.sharpe > best.sharpe ? p : best), mvp);
  return { portfolio, status: 'all-below-risk-free' };
}

/**
 * Complete portfolio on the CAL (Tobin separation): keep the tangency mix, scale the risky share down to
 * y = min(1, cap / σT) and hold 1 − y in the risk-free asset. No borrowing. Sharpe stays at the tangency's.
 */
export function riskFreeMix(tangency: PortfolioStats | null, rf: number, cap: number, n: number): PortfolioStats {
  if (!tangency) {
    return { weights: new Array<number>(n).fill(0), riskFreeWeight: 1, expectedReturn: rf, volatility: 0, sharpe: 0 };
  }
  const y = Math.min(1, cap / tangency.volatility);
  return {
    weights: tangency.weights.map((w) => w * y),
    riskFreeWeight: 1 - y,
    expectedReturn: rf + y * (tangency.expectedReturn - rf),
    volatility: y * tangency.volatility,
    sharpe: tangency.sharpe,
  };
}

export function equalWeightPortfolio(inputs: MarketInputs): PortfolioStats {
  const n = inputs.mu.length;
  return evaluatePortfolio(new Array<number>(n).fill(1 / n), inputs);
}

/** Random long-only portfolios for the background cloud: zᵢ = −ln(1 − U), wᵢ = zᵢ / Σz (course method). */
export function randomPortfolioCloud(
  inputs: MarketInputs,
  count: number,
  random: () => number = Math.random,
): { volatility: number; expectedReturn: number }[] {
  const n = inputs.mu.length;
  return Array.from({ length: count }, () => {
    const z = Array.from({ length: n }, () => -Math.log(1 - random()));
    const total = z.reduce((sum, v) => sum + v, 0);
    const { volatility, expectedReturn } = evaluatePortfolio(
      z.map((v) => v / total),
      inputs,
    );
    return { volatility, expectedReturn };
  });
}
