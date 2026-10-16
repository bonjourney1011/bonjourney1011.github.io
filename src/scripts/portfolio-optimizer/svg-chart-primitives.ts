// Minimal SVG charting helpers (no chart library: keeps the site dependency-free and CSP-friendly).
import type { PortfolioId } from './portfolio-analysis-pipeline';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Colour follows the portfolio, never its rank (validated categorical palette; VN-Index stays neutral ink).
export const PORTFOLIO_COLORS: Record<PortfolioId, string> = {
  complete: '#2a78d6',
  tangency: '#eb6834',
  capped: '#1baf7a',
  mvp: '#6250d6',
  equal: '#eda100',
  index: '#464b53',
};

export const SHORT_LABELS: Record<PortfolioId, string> = {
  complete: 'CAL mix',
  tangency: 'Tangency',
  capped: 'Max SR (cap)',
  mvp: 'MVP',
  equal: '1/N',
  index: 'VN-Index',
};

export const percent = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

export function svgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  text?: string,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

export interface ChartFrame {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type Scale = (value: number) => number;

/** Frame sized to the canvas's real pixel width, so text stays 11px on phones instead of being scaled down. */
export function responsiveFrame(canvas: HTMLElement, aspect: number, minHeight: number): ChartFrame {
  const width = Math.max(320, Math.round(canvas.clientWidth || 760));
  return { width, height: Math.max(minHeight, Math.round(width * aspect)), top: 36, right: 24, bottom: 44, left: 52 };
}

/** Fewer ticks on narrow charts. */
export const tickCount = (frame: ChartFrame) => Math.max(3, Math.min(6, Math.round(frame.width / 130)));

export function linearScale([d0, d1]: [number, number], [r0, r1]: [number, number]): Scale {
  const span = d1 - d0 || 1;
  return (value) => r0 + ((value - d0) / span) * (r1 - r0);
}

/** "Nice" round tick values covering [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  const raw = (max - min || 1) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) ticks.push(Number(v.toFixed(12)));
  return ticks;
}

/** Clears the container and adds a responsive SVG with an accessible name. */
export function createChartSvg(container: HTMLElement, frame: ChartFrame, label: string): SVGSVGElement {
  const svg = svgElement('svg', {
    viewBox: `0 0 ${frame.width} ${frame.height}`,
    role: 'img',
    'aria-label': label,
    class: 'chart-svg',
  });
  container.replaceChildren(svg);
  return svg;
}

/** Recessive grid, tick labels and axis titles. */
export function drawAxes(
  svg: SVGSVGElement,
  frame: ChartFrame,
  axes: {
    x: Scale;
    y: Scale;
    xTicks: number[];
    yTicks: number[];
    formatX: (v: number) => string;
    formatY: (v: number) => string;
    xTitle: string;
    yTitle: string;
  },
): void {
  const g = svgElement('g', { class: 'axes' });
  const bottom = frame.height - frame.bottom;
  for (const t of axes.yTicks) {
    const y = axes.y(t);
    g.append(svgElement('line', { x1: frame.left, x2: frame.width - frame.right, y1: y, y2: y, class: 'grid' }));
    g.append(svgElement('text', { x: frame.left - 8, y: y + 4, 'text-anchor': 'end', class: 'tick' }, axes.formatY(t)));
  }
  for (const t of axes.xTicks) {
    const x = axes.x(t);
    g.append(svgElement('line', { x1: x, x2: x, y1: bottom, y2: bottom + 5, class: 'tick-mark' }));
    g.append(svgElement('text', { x, y: bottom + 20, 'text-anchor': 'middle', class: 'tick' }, axes.formatX(t)));
  }
  g.append(svgElement('line', { x1: frame.left, x2: frame.width - frame.right, y1: bottom, y2: bottom, class: 'baseline' }));
  g.append(
    svgElement('text', { x: frame.width - frame.right, y: frame.height - 6, 'text-anchor': 'end', class: 'axis-title' }, axes.xTitle),
  );
  g.append(svgElement('text', { x: frame.left, y: frame.top - 12, class: 'axis-title' }, axes.yTitle));
  svg.append(g);
}

/** Shows `lines` in an HTML tooltip near the pointer, inside `host` (which must be position: relative). */
export function showTooltip(tooltip: HTMLElement, host: HTMLElement, event: PointerEvent, lines: string[]): void {
  tooltip.replaceChildren(
    ...lines.map((line, i) => {
      const row = document.createElement('div');
      if (i === 0) row.className = 'tooltip-title';
      row.textContent = line;
      return row;
    }),
  );
  tooltip.hidden = false;
  const box = host.getBoundingClientRect();
  const x = event.clientX - box.left;
  const flip = x > box.width * 0.6;
  tooltip.style.left = `${flip ? x - tooltip.offsetWidth - 14 : x + 14}px`;
  tooltip.style.top = `${Math.max(0, event.clientY - box.top - tooltip.offsetHeight / 2)}px`;
}

export function hideTooltip(tooltip: HTMLElement): void {
  tooltip.hidden = true;
}
