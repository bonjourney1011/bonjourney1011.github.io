// Primal active-set solver (Nocedal & Wright, Alg. 16.3) for the only QP shape the optimizer needs:
//   minimise ½ wᵀQw   subject to   A w = b,  w ≥ 0   (long-only, no short selling)
// It replaces Excel Solver. Starting from a feasible point, each iteration solves the equality-constrained
// KKT system on the "free" weights, steps until a weight hits zero, and releases a weight held at zero
// when its multiplier says the objective would improve.
import { type Matrix, type Vector, matVec, solveLinearSystem } from './matrix-and-statistics-helpers';

export interface NonNegativeQuadraticProgram {
  q: Matrix; // positive semi-definite, n × n (a covariance matrix)
  aEq: Matrix; // m × n
  bEq: Vector; // m
}

const STEP_TOLERANCE = 1e-11;
const MULTIPLIER_TOLERANCE = 1e-11;

/** `start` must satisfy A·start = b and start ≥ 0. */
export function solveNonNegativeQuadraticProgram(problem: NonNegativeQuadraticProgram, start: Vector): Vector {
  const n = start.length;
  const m = problem.aEq.length;
  // A tiny ridge keeps the KKT system invertible when the covariance matrix is (nearly) singular.
  const trace = problem.q.reduce((sum, row, i) => sum + row[i], 0);
  const ridge = 1e-10 * (trace / n || 1);
  const q = problem.q.map((row, i) => row.map((v, j) => (i === j ? v + ridge : v)));

  const w = start.map((v) => (v < 0 ? 0 : v));
  const atZero = new Set<number>();

  for (let iter = 0; iter < 100 * n + 100; iter++) {
    const free = w.map((_, i) => i).filter((i) => !atZero.has(i));
    const g = matVec(q, w);
    const f = free.length;

    // KKT system:  [Q_FF  A_Fᵀ] [p_F]   [−g_F]
    //              [A_F    0  ] [ ν ] = [  0 ]
    const kkt: Matrix = [];
    const rhs: Vector = [];
    for (const i of free) {
      kkt.push([...free.map((j) => q[i][j]), ...problem.aEq.map((row) => row[i])]);
      rhs.push(-g[i]);
    }
    for (const row of problem.aEq) {
      kkt.push([...free.map((j) => row[j]), ...new Array<number>(m).fill(0)]);
      rhs.push(0);
    }
    const solution = solveLinearSystem(kkt, rhs);
    if (!solution) break; // fully pinned by the constraints: current point is the only feasible one

    const step = solution.slice(0, f);
    const nu = solution.slice(f);
    const stepSize = Math.max(0, ...step.map(Math.abs));

    if (stepSize < STEP_TOLERANCE * (1 + Math.max(...w))) {
      // Stationary on the free set: check the multipliers of the weights held at zero.
      let release = -1;
      let worst = -MULTIPLIER_TOLERANCE;
      for (const i of atZero) {
        const multiplier = g[i] + problem.aEq.reduce((sum, row, k) => sum + row[i] * nu[k], 0);
        if (multiplier < worst) {
          worst = multiplier;
          release = i;
        }
      }
      if (release < 0) return w;
      atZero.delete(release);
      continue;
    }

    // Longest step (≤ 1) that keeps every free weight non-negative.
    let alpha = 1;
    let blocking = -1;
    step.forEach((p, k) => {
      if (p < 0) {
        const ratio = -w[free[k]] / p;
        if (ratio < alpha) {
          alpha = ratio;
          blocking = free[k];
        }
      }
    });
    step.forEach((p, k) => (w[free[k]] += alpha * p));
    if (blocking >= 0) {
      w[blocking] = 0;
      atZero.add(blocking);
    }
  }
  return w;
}
