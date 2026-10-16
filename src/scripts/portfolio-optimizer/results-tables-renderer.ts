// Headline portfolio card and the result tables (portfolios, weights, per-stock statistics, correlations).
import type { AnalysisResult, RankedPortfolio } from './portfolio-analysis-pipeline';
import { PORTFOLIO_COLORS, percent } from './svg-chart-primitives';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function tableRow(cells: (string | HTMLElement)[], header = false, className = ''): HTMLTableRowElement {
  const row = el('tr', '', className);
  cells.forEach((c, i) => {
    const cell = el(header || i === 0 ? 'th' : 'td');
    if (!header && i === 0) cell.scope = 'row';
    if (header) cell.scope = 'col';
    cell.append(c);
    row.append(cell);
  });
  return row;
}

function fillTable(table: HTMLTableElement, head: string[], rows: HTMLTableRowElement[]): void {
  const thead = el('thead');
  thead.append(tableRow(head, true));
  const tbody = el('tbody');
  tbody.append(...rows);
  table.replaceChildren(thead, tbody);
}

/** The #1 portfolio: best Sharpe that respects the cap, with its weights as bars. */
export function renderHeadline(container: HTMLElement, best: RankedPortfolio, symbols: string[], cap: number): void {
  const badge = best.meetsCap
    ? `Best Sharpe ratio with σ ≤ ${percent(cap, 0)}`
    : `Nothing meets σ ≤ ${percent(cap, 0)}: best Sharpe shown`;
  const stats = el('dl', '', 'headline-stats');
  const stat = (label: string, value: string) => {
    const wrap = el('div');
    wrap.append(el('dt', label, 'eyebrow'), el('dd', value, 'mono'));
    stats.append(wrap);
  };
  stat('Expected return', percent(best.expectedReturn));
  stat('Volatility σ', percent(best.volatility));
  stat('Sharpe ratio', best.sharpe.toFixed(2));
  if (best.outOfSample) stat('Test-window return', percent(best.outOfSample.totalReturn));

  const bars = el('ul', '', 'weight-bars');
  const holdings = symbols
    .map((symbol, i) => ({ name: symbol, weight: best.weights[i] }))
    .concat(best.riskFreeWeight > 0 ? [{ name: 'Risk-free', weight: best.riskFreeWeight }] : [])
    .filter((h) => h.weight >= 0.005)
    .sort((a, b) => b.weight - a.weight);
  for (const h of holdings) {
    const item = el('li');
    const bar = el('span', '', 'bar');
    bar.style.width = `${(h.weight * 100).toFixed(1)}%`;
    bar.style.background = h.name === 'Risk-free' ? 'var(--rule)' : PORTFOLIO_COLORS[best.id];
    const track = el('span', '', 'track');
    track.append(bar);
    item.append(el('span', h.name, 'name mono'), track, el('span', percent(h.weight), 'value mono'));
    bars.append(item);
  }
  container.replaceChildren(
    el('p', badge, best.meetsCap ? 'badge ok' : 'badge warn'),
    el('h3', best.label),
    stats,
    bars,
  );
}

export function renderPortfolioTable(table: HTMLTableElement, list: RankedPortfolio[], cap: number): void {
  const backtested = list.some((p) => p.outOfSample);
  const head = ['Portfolio', 'E(R)', 'σ', 'Sharpe', `σ ≤ ${percent(cap, 0)}`];
  if (backtested) head.push('Test return (ann.)', 'Test σ', 'Test Sharpe', 'Max drawdown');
  const rows = list.map((p, rank) => {
    const name = el('span');
    const swatch = el('i', '', 'swatch');
    swatch.style.background = PORTFOLIO_COLORS[p.id];
    name.append(swatch, `${p.id === 'index' ? '' : `${rank + 1}. `}${p.label}`);
    const cells: (string | HTMLElement)[] = [
      name,
      percent(p.expectedReturn),
      percent(p.volatility),
      p.sharpe.toFixed(2),
      p.meetsCap ? 'Yes' : 'No',
    ];
    if (backtested && p.outOfSample) {
      const o = p.outOfSample;
      cells.push(percent(o.annualReturn), percent(o.volatility), o.sharpe.toFixed(2), `−${percent(o.maxDrawdown)}`);
    }
    return tableRow(cells, false, rank === 0 ? 'top' : '');
  });
  fillTable(table, head, rows);
}

export function renderWeightsTable(table: HTMLTableElement, list: RankedPortfolio[], symbols: string[]): void {
  const portfolios = list.filter((p) => p.id !== 'index');
  const format = (w: number) => (w < 0.0005 ? '·' : percent(w));
  const rows = symbols.map((symbol, i) => tableRow([symbol, ...portfolios.map((p) => format(p.weights[i]))]));
  if (portfolios.some((p) => p.riskFreeWeight > 0)) {
    rows.push(tableRow(['Risk-free', ...portfolios.map((p) => format(p.riskFreeWeight))]));
  }
  fillTable(table, ['Weight', ...portfolios.map((p) => p.label)], rows);
}

export function renderAssetTable(table: HTMLTableElement, result: AnalysisResult): void {
  const rows = result.assets.map((a) =>
    tableRow([
      a.symbol,
      percent(a.expectedReturn),
      percent(a.volatility),
      a.sharpe.toFixed(2),
      a.beta.toFixed(2),
      percent(a.alpha),
      a.rSquared.toFixed(2),
    ]),
  );
  fillTable(table, ['Stock', 'E(R)', 'σ', 'Sharpe', 'β vs VN-Index', 'α (ann.)', 'R²'], rows);
}

/** Correlation heatmap as a table: green for positive, red for negative, neutral paper at zero. */
export function renderCorrelationTable(table: HTMLTableElement, result: AnalysisResult): void {
  const rows = result.stockSymbols.map((symbol, i) => {
    const row = tableRow([symbol, ...result.correlation[i].map((c) => c.toFixed(2))]);
    result.correlation[i].forEach((c, j) => {
      const cell = row.cells[j + 1];
      const tint = c >= 0 ? '11, 110, 79' : '180, 68, 42';
      cell.style.background = i === j ? 'var(--rule)' : `rgba(${tint}, ${(Math.abs(c) * 0.55).toFixed(2)})`;
      if (Math.abs(c) > 0.6 && i !== j) cell.style.color = '#fff';
    });
    return row;
  });
  fillTable(table, ['ρ', ...result.stockSymbols], rows);
}
