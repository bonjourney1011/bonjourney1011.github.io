// Risk–return plane: random-portfolio cloud, efficient frontier, CAL, σ cap, stocks and optimised portfolios.
import type { AnalysisResult, RankedPortfolio } from './portfolio-analysis-pipeline';
import {
  PORTFOLIO_COLORS,
  SHORT_LABELS,
  createChartSvg,
  drawAxes,
  hideTooltip,
  linearScale,
  niceTicks,
  percent,
  responsiveFrame,
  showTooltip,
  svgElement,
  tickCount,
} from './svg-chart-primitives';

interface ChartOptions {
  portfolios: RankedPortfolio[];
  showCal: boolean;
  rf: number;
  cap: number;
}

export function renderRiskReturnChart(
  host: HTMLElement,
  canvas: HTMLElement,
  tooltip: HTMLElement,
  result: AnalysisResult,
  { portfolios, showCal, rf, cap }: ChartOptions,
): void {
  const FRAME = responsiveFrame(canvas, 0.6, 340);
  const points = [...result.cloud, ...result.frontier, ...result.assets, ...portfolios];
  const xMax = Math.max(cap, ...points.map((p) => p.volatility)) * 1.08;
  const yValues = [rf, 0, ...points.map((p) => p.expectedReturn)];
  const yPad = (Math.max(...yValues) - Math.min(...yValues)) * 0.08;
  const [yMin, yMax] = [Math.min(...yValues) - yPad, Math.max(...yValues) + yPad];

  const x = linearScale([0, xMax], [FRAME.left, FRAME.width - FRAME.right]);
  const y = linearScale([yMin, yMax], [FRAME.height - FRAME.bottom, FRAME.top]);
  const svg = createChartSvg(canvas, FRAME, 'Expected return against risk for the optimised portfolios and each stock');
  drawAxes(svg, FRAME, {
    x,
    y,
    xTicks: niceTicks(0, xMax, tickCount(FRAME)),
    yTicks: niceTicks(yMin, yMax, tickCount(FRAME)),
    formatX: (v) => percent(v, 0),
    formatY: (v) => percent(v, 0),
    xTitle: 'Risk — annual volatility σ',
    yTitle: 'Expected annual return',
  });

  const cloud = svgElement('g', { class: 'cloud' });
  for (const p of result.cloud) cloud.append(svgElement('circle', { cx: x(p.volatility), cy: y(p.expectedReturn), r: 1.6 }));
  svg.append(cloud);

  // σ cap: everything right of this line breaks the risk limit.
  svg.append(svgElement('line', { x1: x(cap), x2: x(cap), y1: FRAME.top, y2: FRAME.height - FRAME.bottom, class: 'cap-line' }));
  svg.append(svgElement('text', { x: x(cap) + 6, y: FRAME.top + 12, class: 'annotation' }, `σ cap ${percent(cap, 0)}`));

  const frontierPath = result.frontier.map((p, i) => `${i ? 'L' : 'M'}${x(p.volatility)},${y(p.expectedReturn)}`).join('');
  svg.append(svgElement('path', { d: frontierPath, class: 'frontier' }));

  if (showCal && result.tangency) {
    // CAL: E = Rf + Sharpe_T × σ, drawn from the risk-free point across the plot.
    const slope = result.tangency.sharpe;
    const xEnd = Math.min(xMax, slope > 0 ? (yMax - rf) / slope : xMax);
    svg.append(svgElement('line', { x1: x(0), y1: y(rf), x2: x(xEnd), y2: y(rf + slope * xEnd), class: 'cal-line' }));
    svg.append(svgElement('circle', { cx: x(0), cy: y(rf), r: 4, class: 'rf-point' }));
    svg.append(svgElement('text', { x: x(0) + 8, y: y(rf) + 16, class: 'annotation' }, `Rf ${percent(rf)}`));
  }

  const hover = (target: SVGElement, lines: string[]) => {
    target.addEventListener('pointerenter', (e) => showTooltip(tooltip, host, e, lines));
    target.addEventListener('pointermove', (e) => showTooltip(tooltip, host, e, lines));
    target.addEventListener('pointerleave', () => hideTooltip(tooltip));
  };
  const statLines = (p: { expectedReturn: number; volatility: number; sharpe: number }) => [
    `E(R) ${percent(p.expectedReturn)} · σ ${percent(p.volatility)}`,
    `Sharpe ${p.sharpe.toFixed(2)}`,
  ];

  const markers = [...result.assets, ...portfolios].map((p) => ({ x: x(p.volatility), y: y(p.expectedReturn) }));
  const placeAssetLabel = labelPlacer(markers);
  for (const asset of result.assets) {
    const g = svgElement('g', { class: 'asset' });
    const [cx, cy] = [x(asset.volatility), y(asset.expectedReturn)];
    g.append(svgElement('circle', { cx, cy, r: 4 }));
    const spot = placeAssetLabel(cx, cy, asset.symbol);
    g.append(svgElement('text', { x: spot.x, y: spot.y, 'text-anchor': spot.anchor }, asset.symbol));
    g.append(svgElement('circle', { cx, cy, r: 12, class: 'hit' }));
    hover(g, [asset.symbol, ...statLines(asset), `β ${asset.beta.toFixed(2)}`]);
    svg.append(g);
  }

  // Draw the headline portfolio last so it sits on top.
  for (const p of [...portfolios].reverse()) {
    const g = svgElement('g', { class: 'portfolio' });
    const [cx, cy] = [x(p.volatility), y(p.expectedReturn)];
    g.append(svgElement('circle', { cx, cy, r: 6.5, fill: PORTFOLIO_COLORS[p.id], class: 'marker' }));
    g.append(svgElement('text', { x: cx - 9, y: cy - 9, 'text-anchor': 'end', class: 'marker-label' }, SHORT_LABELS[p.id]));
    g.append(svgElement('circle', { cx, cy, r: 14, class: 'hit' }));
    hover(g, [p.label, ...statLines(p), ...(p.riskFreeWeight > 0 ? [`Risk-free ${percent(p.riskFreeWeight)}`] : [])]);
    svg.append(g);
  }
}

type Anchor = 'start' | 'middle' | 'end';
interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Greedy label placement: tries right, left, above and below each point and keeps the first spot whose
 * text box clears every earlier label and every point marker (falls back to the right).
 */
function labelPlacer(markers: { x: number; y: number }[]) {
  const placed: Box[] = [];
  const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  return (cx: number, cy: number, text: string): { x: number; y: number; anchor: Anchor } => {
    const width = text.length * 7 + 2;
    const candidates: { x: number; y: number; anchor: Anchor }[] = [
      { x: cx + 7, y: cy + 4, anchor: 'start' },
      { x: cx - 7, y: cy + 4, anchor: 'end' },
      { x: cx, y: cy - 8, anchor: 'middle' },
      { x: cx, y: cy + 16, anchor: 'middle' },
    ];
    const boxOf = ({ x, y, anchor }: (typeof candidates)[number]): Box => {
      const left = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
      return { left, right: left + width, top: y - 10, bottom: y + 2 };
    };
    const free = (box: Box) =>
      !placed.some((p) => overlaps(p, box)) &&
      !markers.some((m) => (m.x !== cx || m.y !== cy) && overlaps(box, { left: m.x - 5, right: m.x + 5, top: m.y - 5, bottom: m.y + 5 }));
    const spot = candidates.find((c) => free(boxOf(c))) ?? candidates[0];
    placed.push(boxOf(spot));
    return spot;
  };
}
