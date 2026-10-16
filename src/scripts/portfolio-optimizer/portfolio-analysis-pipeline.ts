// End-to-end analysis: aligned prices → estimation (train) window statistics → optimised portfolios,
// ranked so the best Sharpe ratio that respects the volatility cap comes first → out-of-sample backtest.
import {
  TRADING_DAYS,
  type Matrix,
  correlationMatrix,
  covarianceMatrix,
  mean,
  regressOnMarket,
  sampleCovariance,
  scaleMatrix,
} from './matrix-and-statistics-helpers';
import {
  type CapStatus,
  type MarketInputs,
  type PortfolioStats,
  efficientFrontier,
  equalWeightPortfolio,
  maxSharpeWithVolatilityCap,
  minimumVariancePortfolio,
  randomPortfolioCloud,
  riskFreeMix,
  tangencyPortfolio,
} from './mean-variance-portfolio-optimizers';
import { type AlignedPrices, simpleReturns } from './return-series-alignment';
import { type PerformanceSummary, buyAndHoldWealth, summarizeWealth } from './out-of-sample-backtest-metrics';

export type PortfolioId = 'complete' | 'capped' | 'tangency' | 'mvp' | 'equal' | 'index';

export interface RankedPortfolio extends PortfolioStats {
  id: PortfolioId;
  label: string;
  meetsCap: boolean;
  outOfSample?: PerformanceSummary;
}

export interface AssetSummary {
  symbol: string;
  expectedReturn: number;
  volatility: number;
  sharpe: number;
  beta: number;
  alpha: number; // annualised (daily intercept × 252)
  rSquared: number;
}

export interface AnalysisResult {
  stockSymbols: string[];
  trainDates: [string, string];
  trainObservations: number;
  assets: AssetSummary[];
  correlation: Matrix;
  frontier: PortfolioStats[];
  cloud: { volatility: number; expectedReturn: number }[];
  capStatus: CapStatus;
  minimumVariance: PortfolioStats;
  tangency: PortfolioStats | null;
  riskyOnly: RankedPortfolio[];
  withRiskFree: RankedPortfolio[];
  backtest: { dates: string[]; wealth: Record<PortfolioId, number[]> } | null;
}

export interface AnalysisParams {
  rf: number; // annual
  cap: number; // annual σ ceiling
  splitDate: string | null; // first day of the test window; null = estimate on the whole range
}

/** `prices.closes[0]` must be the market index (VN-Index); the rest are the stocks. */
export function analyzePortfolios(prices: AlignedPrices, { rf, cap, splitDate }: AnalysisParams): AnalysisResult {
  const stockSymbols = prices.symbols.slice(1);
  const n = stockSymbols.length;
  const splitAt = splitDate ? prices.dates.findIndex((d) => d >= splitDate) : -1;
  if (splitDate && (splitAt <= 0 || prices.dates.length - splitAt < 20)) {
    throw new Error(
      `The test window needs at least 20 trading days inside the common history (${prices.dates[0]} → ${prices.dates.at(-1)}). Move "Test from".`,
    );
  }
  const trainEnd = splitAt > 0 ? splitAt : prices.dates.length; // exclusive price index

  const returns = prices.closes.map((c) => simpleReturns(c.slice(0, trainEnd)));
  const observations = returns[0].length;
  const minObservations = Math.max(60, 3 * n);
  if (observations < minObservations) {
    throw new Error(
      `The estimation window has ${observations} daily returns; at least ${minObservations} are needed for ${n} stocks. Move the start date earlier or the split date later.`,
    );
  }

  const [indexReturns, ...stockReturns] = returns;
  const flat = stockSymbols.filter((_, i) => sampleCovariance(stockReturns[i], stockReturns[i]) < 1e-12);
  if (flat.length) throw new Error(`No price movement in the estimation window for ${flat.join(', ')}. Remove it and try again.`);
  const inputs: MarketInputs = {
    mu: stockReturns.map((r) => mean(r) * TRADING_DAYS),
    cov: scaleMatrix(covarianceMatrix(stockReturns), TRADING_DAYS),
    rf,
  };
  const assets = stockSymbols.map((symbol, i) => {
    const volatility = Math.sqrt(inputs.cov[i][i]);
    const { alpha, beta, rSquared } = regressOnMarket(stockReturns[i], indexReturns);
    const expectedReturn = inputs.mu[i];
    return { symbol, expectedReturn, volatility, sharpe: (expectedReturn - rf) / volatility, beta, alpha: alpha * TRADING_DAYS, rSquared };
  });

  const mvp = minimumVariancePortfolio(inputs);
  const tangency = tangencyPortfolio(inputs);
  const capped = maxSharpeWithVolatilityCap(inputs, cap, mvp, tangency);
  const indexReturn = mean(indexReturns) * TRADING_DAYS;
  const indexVolatility = Math.sqrt(sampleCovariance(indexReturns, indexReturns) * TRADING_DAYS);
  const index: PortfolioStats = {
    weights: new Array<number>(n).fill(0),
    riskFreeWeight: 0,
    expectedReturn: indexReturn,
    volatility: indexVolatility,
    sharpe: (indexReturn - rf) / indexVolatility,
  };

  const capLabel = `${Math.round(cap * 1000) / 10}%`;
  const tag = (id: PortfolioId, label: string, stats: PortfolioStats): RankedPortfolio => ({
    ...stats,
    id,
    label,
    meetsCap: stats.volatility <= cap * (1 + 1e-6),
  });
  const shared: RankedPortfolio[] = [
    ...(capped.portfolio ? [tag('capped', `Max Sharpe, stocks only, σ ≤ ${capLabel}`, capped.portfolio)] : []),
    ...(tangency && capped.status !== 'within-cap' ? [tag('tangency', 'Max Sharpe, no risk cap', tangency)] : []),
    tag('mvp', 'Minimum variance', mvp),
    tag('equal', 'Equal weight 1/N', equalWeightPortfolio(inputs)),
    tag('index', 'VN-Index (benchmark)', index),
  ];
  const mix = riskFreeMix(tangency, rf, cap, n);
  const mixLabel = tangency ? `Tangency + risk-free, σ ≤ ${capLabel}` : 'Risk-free only (no stock beats Rf)';
  const withMix = mix.riskFreeWeight > 1e-9 ? [tag('complete', mixLabel, mix)] : [];

  const result: AnalysisResult = {
    stockSymbols,
    trainDates: [prices.dates[0], prices.dates[trainEnd - 1]],
    trainObservations: observations,
    assets,
    correlation: correlationMatrix(inputs.cov),
    frontier: efficientFrontier(inputs, mvp, 40),
    cloud: randomPortfolioCloud(inputs, 1500),
    capStatus: capped.status,
    minimumVariance: mvp,
    tangency,
    riskyOnly: rankByCapThenSharpe(shared),
    withRiskFree: rankByCapThenSharpe([...withMix, ...shared]),
    backtest: null,
  };
  if (trainEnd < prices.dates.length) result.backtest = runBacktest(prices, trainEnd, [...withMix, ...shared], rf);
  return result;
}

/** Portfolios that respect the cap come first (best Sharpe on top), then the rest; the benchmark is always last. */
function rankByCapThenSharpe(list: RankedPortfolio[]): RankedPortfolio[] {
  const isIndex = (p: RankedPortfolio) => Number(p.id === 'index');
  return [...list].sort(
    (a, b) => isIndex(a) - isIndex(b) || Number(b.meetsCap) - Number(a.meetsCap) || b.sharpe - a.sharpe,
  );
}

/** Hold the train-window weights from the last train close to the end of the range. */
function runBacktest(prices: AlignedPrices, trainEnd: number, portfolios: RankedPortfolio[], rf: number) {
  const window = prices.closes.map((c) => c.slice(trainEnd - 1));
  const [indexCloses, ...stockCloses] = window;
  const wealth = {} as Record<PortfolioId, number[]>;
  for (const p of portfolios) {
    wealth[p.id] =
      p.id === 'index'
        ? indexCloses.map((v) => v / indexCloses[0])
        : buyAndHoldWealth(stockCloses, p.weights, p.riskFreeWeight, rf);
    p.outOfSample = summarizeWealth(wealth[p.id], rf);
  }
  return { dates: prices.dates.slice(trainEnd - 1), wealth };
}
