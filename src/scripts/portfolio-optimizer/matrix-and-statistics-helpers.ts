// Small linear-algebra and statistics helpers for the portfolio optimizer.
// Conventions follow the FTU course spreadsheets: simple returns, sample (n − 1) moments, 252 trading days.

export type Vector = number[];
export type Matrix = number[][];

export const TRADING_DAYS = 252;

export function mean(values: Vector): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Sample covariance (Excel COVARIANCE.S). */
export function sampleCovariance(x: Vector, y: Vector): number {
  const mx = mean(x);
  const my = mean(y);
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += (x[i] - mx) * (y[i] - my);
  return sum / (x.length - 1);
}

/** Sample covariance matrix of several return series (one series per asset). */
export function covarianceMatrix(series: Vector[]): Matrix {
  const n = series.length;
  const cov: Matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) cov[i][j] = cov[j][i] = sampleCovariance(series[i], series[j]);
  }
  return cov;
}

export function correlationMatrix(cov: Matrix): Matrix {
  return cov.map((row, i) => row.map((v, j) => v / Math.sqrt(cov[i][i] * cov[j][j])));
}

export function scaleMatrix(m: Matrix, factor: number): Matrix {
  return m.map((row) => row.map((v) => v * factor));
}

export function dot(a: Vector, b: Vector): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export function matVec(m: Matrix, v: Vector): Vector {
  return m.map((row) => dot(row, v));
}

/** wᵀ M w — portfolio variance when M is the covariance matrix. */
export function quadraticForm(w: Vector, m: Matrix): number {
  return dot(w, matVec(m, w));
}

/** OLS of y on x (market model R = α + β·Rm), same as Excel INTERCEPT / SLOPE / RSQ. */
export function regressOnMarket(y: Vector, x: Vector): { alpha: number; beta: number; rSquared: number } {
  const covXY = sampleCovariance(x, y);
  const varX = sampleCovariance(x, x);
  const varY = sampleCovariance(y, y);
  const beta = covXY / varX;
  return { alpha: mean(y) - beta * mean(x), beta, rSquared: (covXY * covXY) / (varX * varY) };
}

/** Solves A x = b by Gaussian elimination with partial pivoting. Returns null if A is singular. */
export function solveLinearSystem(a: Matrix, b: Vector): Vector | null {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);
  const scale = Math.max(1e-300, ...a.flat().map(Math.abs));
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    if (Math.abs(m[pivot][col]) < 1e-13 * scale) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = col + 1; r < n; r++) {
      const f = m[r][col] / m[col][col];
      if (f !== 0) for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = m[r][n];
    for (let c = r + 1; c < n; c++) sum -= m[r][c] * x[c];
    x[r] = sum / m[r][r];
  }
  return x;
}
