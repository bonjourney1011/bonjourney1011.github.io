// Out-of-sample growth of 1 VND for each portfolio vs VN-Index, with a crosshair tooltip.
import type { AnalysisResult, RankedPortfolio } from './portfolio-analysis-pipeline';
import {
  PORTFOLIO_COLORS,
  SHORT_LABELS,
  createChartSvg,
  drawAxes,
  hideTooltip,
  linearScale,
  niceTicks,
  responsiveFrame,
  showTooltip,
  svgElement,
  tickCount,
} from './svg-chart-primitives';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatDate = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

export function renderWealthChart(
  host: HTMLElement,
  canvas: HTMLElement,
  legend: HTMLElement,
  tooltip: HTMLElement,
  backtest: NonNullable<AnalysisResult['backtest']>,
  portfolios: RankedPortfolio[],
): void {
  const FRAME = responsiveFrame(canvas, 0.45, 280);
  const { dates, wealth } = backtest;
  const series = portfolios.map((p) => ({ portfolio: p, values: wealth[p.id] }));
  const all = series.flatMap((s) => s.values);
  const pad = (Math.max(...all) - Math.min(...all)) * 0.06 || 0.05;
  const [yMin, yMax] = [Math.min(1, ...all) - pad, Math.max(1, ...all) + pad];
  const last = dates.length - 1;

  const x = linearScale([0, last], [FRAME.left, FRAME.width - FRAME.right]);
  const y = linearScale([yMin, yMax], [FRAME.height - FRAME.bottom, FRAME.top]);
  const svg = createChartSvg(canvas, FRAME, 'Growth of 1 VND invested in each portfolio over the test window');
  const xTicks = niceTicks(0, last, tickCount(FRAME) - 1).filter((t) => Number.isInteger(t) && t <= last);
  drawAxes(svg, FRAME, {
    x,
    y,
    xTicks,
    yTicks: niceTicks(yMin, yMax, tickCount(FRAME) - 1),
    formatX: (t) => formatDate(dates[t]).slice(-8),
    formatY: (v) => v.toFixed(2),
    xTitle: 'Test window (held without rebalancing)',
    yTitle: 'Value of 1 VND invested',
  });
  svg.append(svgElement('line', { x1: x(0), x2: x(last), y1: y(1), y2: y(1), class: 'par-line' }));

  // Benchmark first (underneath), headline portfolio last (on top).
  for (const { portfolio, values } of [...series].reverse()) {
    const d = values.map((v, t) => `${t ? 'L' : 'M'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join('');
    svg.append(
      svgElement('path', {
        d,
        class: portfolio.id === 'index' ? 'wealth-line benchmark' : 'wealth-line',
        stroke: PORTFOLIO_COLORS[portfolio.id],
      }),
    );
  }

  legend.replaceChildren(
    ...series.map(({ portfolio }) => {
      const item = document.createElement('span');
      item.className = portfolio.id === 'index' ? 'legend-item benchmark' : 'legend-item';
      const swatch = document.createElement('i');
      swatch.style.background = PORTFOLIO_COLORS[portfolio.id];
      item.append(swatch, SHORT_LABELS[portfolio.id]);
      return item;
    }),
  );

  // Crosshair: snap to the nearest trading day and list every series' value.
  const crosshair = svgElement('line', { y1: FRAME.top, y2: FRAME.height - FRAME.bottom, class: 'crosshair', visibility: 'hidden' });
  const overlay = svgElement('rect', {
    x: FRAME.left,
    y: FRAME.top,
    width: FRAME.width - FRAME.left - FRAME.right,
    height: FRAME.height - FRAME.top - FRAME.bottom,
    class: 'hit',
  });
  svg.append(crosshair, overlay);
  overlay.addEventListener('pointermove', (event) => {
    const box = svg.getBoundingClientRect();
    const svgX = ((event.clientX - box.left) / box.width) * FRAME.width;
    const t = Math.max(0, Math.min(last, Math.round(((svgX - FRAME.left) / (FRAME.width - FRAME.left - FRAME.right)) * last)));
    crosshair.setAttribute('x1', String(x(t)));
    crosshair.setAttribute('x2', String(x(t)));
    crosshair.setAttribute('visibility', 'visible');
    const rows = [...series]
      .sort((a, b) => b.values[t] - a.values[t])
      .map(({ portfolio, values }) => `${SHORT_LABELS[portfolio.id]}  ${values[t].toFixed(3)}`);
    showTooltip(tooltip, host, event, [formatDate(dates[t]), ...rows]);
  });
  overlay.addEventListener('pointerleave', () => {
    crosshair.setAttribute('visibility', 'hidden');
    hideTooltip(tooltip);
  });
}
