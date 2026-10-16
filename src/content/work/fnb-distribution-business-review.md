---
title: Sales, margin and stock risk in one model for an F&B distributor
summary: A three-page Power BI report for a beverage distributor across Vietnam's three regions — from two messy monthly exports to answers on growth, margin leakage, restocking and overdue cash.
category: ecommerce
kind: Independent
period: 06/2026
role: Analyst — Power Query cleaning, data model, DAX, report
metric:
  value: $1.27M
  label: overdue revenue surfaced, with payment terms proposed per risk tier
stack: [Power BI, Power Query, DAX, Star schema]
order: 4.5
repoUrl: https://github.com/bonjourney1011/power-bi-fnb-distribution-analysis
dashboard: fnb-distribution-sales-supply-chain
cover: /dashboard-files/fnb-distribution-sales-supply-chain/page-1.jpg
---

## The business question

A beverage distributor selling across the North, Central and South regions wanted **one report that sales, finance and supply chain could all trust**. The raw material was a product master and two monthly transaction exports that didn't share a schema.

## What I did

- **Made two exports into one fact table.** The months used different column names, date formats and discount formats (`"15%"` as text vs `0.15`). I standardised them in Power Query and appended ~1,350 orders.
- **Cleaned what would have distorted the numbers.** Fixed product IDs, mapped 12 region spellings to 3 regions, treated negative quantities as returns and removed 7 duplicate orders. 17 orders pointing to unknown products were kept for audit but excluded from revenue and cost.
- **Modelled for three audiences.** A star schema with targets at Category × Month grain, applied through `TREATAS` rather than a misleading physical relationship.

## Impact — what the data says

- **Revenue +11.2% month on month**, driven by Spirits (+13.1%), a channel shift (On-Premise +38%, Wholesale −25.5%) and February promotions.
- **Margin leakage:** two high-revenue SKUs sell below list price at 35–39% margin, against 51–59% for the four most profitable products.
- **Stock risk:** 8 active SKUs are below reorder point with less cover than their lead time — including the #1 profit product, at 44 units with a 60-day lead time.
- **Cash risk:** 20.6% of orders ($1.27M) are overdue. I proposed tiered payment terms: prepayment above a 25% overdue rate, shorter terms between 20% and 25%.

## What I'd do next

Target achievement came out at about 1,500% overall (Spirits 2,378%, Wine 1,972%) — a sign that the targets are recorded on a different scale from revenue, not that the teams beat plan fifteenfold. I flagged it rather than reporting it as performance. The next step is to confirm the target unit with operations and rebase the achievement measures.
