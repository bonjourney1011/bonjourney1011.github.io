---
title: Did gross profit really fall 53%? A root-cause analysis
summary: A multi-channel e-commerce business reported a 53% profit collapse. Like-for-like analysis showed −8.8%, a profit bridge located the cause, and an audit caught a +70.3M overstatement.
category: ecommerce
kind: Independent
period: 08/2026
role: Analyst — SQL RCA, data model, dashboard, governance
metric:
  value: −53% → −8.8%
  label: headline drop vs. like-for-like reality
stack: [Power BI, DAX, SQL, Python, DuckDB]
order: 3
featured: true
repoUrl: https://github.com/bonjourney1011/ecommerce-profitability-operations-dashboard
dashboard: ecommerce-profitability-operations
cover: /dashboard-files/ecommerce-profitability-operations/page-1.jpg
---

## The business question

Leadership saw August gross profit down **53%** against July across Shopee, TikTok Shop and Lazada. Before anyone cut budgets, the question was: **is this a real collapse, and if so, what is driving it?**

## What I did

- **Checked the comparison before the business.** August data only ran to 15/08, while July had 31 days. Comparing against the *same period last month* (SPLM) shows a decline of **−8.80%**, not −53%.
- **Built a profit bridge** to decompose the real change into volume, average order value and margin rate.
- **Modelled the data as a star schema** (orders fact; store, product, customer and date dimensions) with DAX measures that only recognise `COMPLETED` orders unless an audit says otherwise.
- **Audited the pre-built aggregate table** against the transactional source of truth, and logged every issue in a data-quality register with quarantine rules.
- **Refused to compute what the data can't support.** Campaign data had no join key to orders, so ROAS and CAC were explicitly marked as not measurable rather than estimated.

## Impact

| Finding | Number |
|---|---:|
| Headline decline (partial month vs. full month) | −53.00% |
| Like-for-like decline (SPLM) | **−8.80%** |
| Share of decline from order volume / AOV / margin | 51.1% / 43.6% / 5.3% |
| Profit margin (stable) | ~41% |
| Aggregate-table overstatement (non-completed orders) | **+70.3M** |

The decline is mostly **demand-driven**, not a margin collapse — which points to traffic and conversion levers rather than price cuts or supplier renegotiation.

## What I'd do next

Add a partial-period warning as a standard measure on every executive page, and propose a `campaign_id` on orders so marketing effectiveness becomes measurable next quarter.
