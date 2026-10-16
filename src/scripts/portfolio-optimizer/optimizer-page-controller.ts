// Wires the optimizer form to live prices, the analysis pipeline, charts and tables.
import { type OptimizerRequest, readRequest, setDefaultDates } from './optimizer-form-inputs';
import { type SourcedSeries, fetchManyDailyCloses, loadSnapshotCloses } from './price-data-sources';
import { alignOnCommonDates } from './return-series-alignment';
import { type AnalysisResult, analyzePortfolios } from './portfolio-analysis-pipeline';
import { renderRiskReturnChart } from './risk-return-frontier-chart';
import { renderWealthChart } from './backtest-wealth-chart';
import {
  renderAssetTable,
  renderCorrelationTable,
  renderHeadline,
  renderPortfolioTable,
  renderWeightsTable,
} from './results-tables-renderer';
import { percent } from './svg-chart-primitives';

interface Run {
  request: OptimizerRequest;
  result: AnalysisResult;
  series: SourcedSeries[];
  commonDays: number;
}

const root = document.querySelector<HTMLElement>('[data-portfolio-optimizer]');
if (root && !root.dataset.ready) {
  root.dataset.ready = 'true';
  init(root);
}

function init(root: HTMLElement): void {
  const $ = <T extends Element = HTMLElement>(selector: string) => root.querySelector(selector) as T;
  const form = $<HTMLFormElement>('form');
  const submit = $<HTMLButtonElement>('button[type="submit"]');
  const status = $('[data-status]');
  const results = $('[data-results]');
  let last: Run | null = null;
  let renderedWidth = 0; // charts are drawn at the real pixel width

  const setStatus = (text: string, isError = false) => {
    status.textContent = text;
    status.classList.toggle('error', isError);
  };

  async function run(): Promise<void> {
    submit.disabled = true;
    try {
      const request = readRequest(form);
      const symbols = ['VNINDEX', ...request.tickers];
      setStatus('Loading prices…');
      let series: SourcedSeries[];
      try {
        series = await fetchManyDailyCloses(symbols, request.start, request.end, (done, total) =>
          setStatus(`Loading prices ${done}/${total}…`),
        );
      } catch (error) {
        const snapshot = await loadSnapshotCloses(symbols, request.start, request.end);
        if (!snapshot) throw error;
        series = snapshot;
      }
      setStatus('Optimising…');
      const aligned = alignOnCommonDates(series);
      const result = analyzePortfolios(aligned, { rf: request.rf, cap: request.cap, splitDate: request.split });
      last = { request, result, series, commonDays: aligned.dates.length };
      render(last);
      setStatus('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Something went wrong. Please try again.', true);
    } finally {
      submit.disabled = false;
    }
  }

  function render(state: Run): void {
    const { request, result } = state;
    const withRiskFree = (form.elements.namedItem('mode') as RadioNodeList).value === 'with-risk-free';
    const list = withRiskFree ? result.withRiskFree : result.riskyOnly;
    results.hidden = false;
    renderedWidth = root.clientWidth;

    renderHeadline($('[data-headline]'), list[0], result.stockSymbols, request.cap);
    renderNotes($('[data-notes]'), state, withRiskFree);
    renderRiskReturnChart($('[data-risk-chart]'), $('[data-risk-chart] [data-canvas]'), $('[data-risk-chart] [data-tooltip]'), result, {
      portfolios: list,
      showCal: withRiskFree,
      rf: request.rf,
      cap: request.cap,
    });
    renderPortfolioTable($<HTMLTableElement>('[data-table="portfolios"]'), list, request.cap);
    renderWeightsTable($<HTMLTableElement>('[data-table="weights"]'), list, result.stockSymbols);
    renderAssetTable($<HTMLTableElement>('[data-table="assets"]'), result);
    renderCorrelationTable($<HTMLTableElement>('[data-table="correlation"]'), result);

    const backtestSection = $('[data-backtest]');
    backtestSection.hidden = !result.backtest;
    if (result.backtest) {
      renderWealthChart(
        $('[data-wealth-chart]'),
        $('[data-wealth-chart] [data-canvas]'),
        $('[data-wealth-legend]'),
        $('[data-wealth-chart] [data-tooltip]'),
        result.backtest,
        list,
      );
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void run();
  });
  form.querySelectorAll('input[name="mode"]').forEach((radio) =>
    radio.addEventListener('change', () => {
      if (last) render(last);
    }),
  );
  // Redraw when the width changes (rotation, window resize).
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (last && root.clientWidth !== renderedWidth) {
        render(last);
      }
    }, 150);
  });
  setDefaultDates(form);
  void run();
}

/** Data provenance, estimation/test windows and the cap warnings that apply to the current mode. */
function renderNotes(container: HTMLElement, { request, result, series, commonDays }: Run, withRiskFree: boolean): void {
  const sources = [...new Set(series.map((s) => s.source))].join(' + ');
  // Listed (or with data) more than two weeks after the requested start: it shortens the common window.
  const cutoff = new Date(Date.parse(request.start) + 14 * 86400 * 1000).toISOString().slice(0, 10);
  const late = series.filter((s) => s.dates[0] > cutoff);
  const lines = [
    `Prices: ${sources}${sources === 'Snapshot' ? ' (live APIs unreachable, using the bundled snapshot)' : ' (live)'} · ${commonDays} trading days common to all symbols.`,
    `Estimation window: ${result.trainDates[0]} → ${result.trainDates[1]} (${result.trainObservations} daily returns)` +
      (result.backtest ? ` · test window: ${result.backtest.dates[1]} → ${result.backtest.dates.at(-1)}.` : '.'),
  ];
  if (late.length) lines.push(`Shorter history: ${late.map((s) => `${s.symbol} from ${s.dates[0]}`).join(', ')}.`);

  const capText = percent(request.cap, 0);
  if (result.capStatus === 'all-below-risk-free') {
    lines.push(`No stock beat the ${percent(request.rf)} risk-free rate in the estimation window, so every Sharpe ratio is negative.`);
  } else if (!withRiskFree && result.capStatus === 'infeasible') {
    lines.push(
      `No stocks-only mix gets σ down to ${capText}: even the minimum-variance portfolio has σ = ${percent(result.minimumVariance.volatility)}. Turn on the risk-free asset to meet the cap.`,
    );
  } else if (withRiskFree && result.tangency && result.tangency.volatility > request.cap) {
    const y = request.cap / result.tangency.volatility;
    lines.push(
      `Tobin separation: keep the tangency mix of stocks, put ${percent(y)} of the money in it and ${percent(1 - y)} in the risk-free asset. σ falls to ${capText} and the Sharpe ratio stays ${result.tangency.sharpe.toFixed(2)}.`,
    );
  }
  container.replaceChildren(
    ...lines.map((line) => {
      const p = document.createElement('p');
      p.textContent = line;
      return p;
    }),
  );
}
