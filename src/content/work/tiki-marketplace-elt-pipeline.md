---
title: A self-refreshing marketplace warehouse with dbt and Airflow
summary: Incremental crawling of a Vietnamese marketplace's public catalogue into PostgreSQL, modelled through dbt staging → intermediate → marts, orchestrated every 6 hours and served to Power BI.
category: engineering
kind: Independent
period: '2026'
role: Analytics engineer — pipeline, models, tests
metric:
  value: 6-hourly
  label: incremental refresh, tested end to end
stack: [Python, PostgreSQL, dbt, Airflow, Docker, Power BI]
order: 5
---

## The business question

Market-intelligence work lives or dies on fresh, trustworthy product data. I wanted to show the analytics-engineering side of my work: **how do you keep a catalogue of marketplace prices and sales current without re-crawling everything, and prove the numbers are right?**

## What I did

- **Incremental by design.** Category listing pages are cheap and re-crawled every run; a change-detection step decides per product whether the expensive detail page is worth fetching — only for new products, changed price/stock/sales, or records older than a staleness threshold.
- **Layered dbt project.** Raw → staging → intermediate → marts on real PostgreSQL, including cross-crawl price history with window functions and a dbt snapshot.
- **Tests as a contract.** `not_null` and `unique` on every key, plus singular tests for positive prices, duplicate product keys and category-count reconciliation; source freshness checks on the raw layer.
- **Orchestrated with Airflow** (Docker, LocalExecutor), scheduled every 6 hours, feeding BI-ready marts.

## Responsible crawling

Single-threaded, rate-limited requests to a public JSON API, `robots.txt` respected, no personal data collected and no redistribution of scraped data. Built for learning and portfolio use only.

## What I'd do next

Move storage to a cloud warehouse and add data-observability alerts (row-count and freshness anomalies) so the pipeline reports its own health instead of waiting for someone to notice a broken chart.
