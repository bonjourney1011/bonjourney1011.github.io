---
title: Which products should a livestreamer sell tonight?
summary: An end-to-end recommendation product for a KOL livestream network — from marketplace API to warehouse, dbt, machine learning and daily baskets. It helped the company win a new client.
category: ecommerce
kind: Professional
period: 07/2026 — Present
role: Lead analyst, end to end (data model → ML → delivery)
metric:
  value: 25.8%
  label: of session GMV came from the 192-product basket
stack: [ClickHouse, dbt, Python, Gradient Boosting, Power BI, Metabase]
order: 1
featured: true
confidential: true
---

## The business question

A network of livestream sellers (KOLs) picked products largely by instinct. The client wanted to know: **out of tens of thousands of eligible affiliate products, which few hundred should each host put in tonight's basket to maximise GMV?** Getting it wrong costs airtime — the scarcest resource in livestream commerce.

## What I did

- **Built the data foundation.** Ingested the marketplace affiliate API into a ClickHouse schema of 15 tables, covering ~29K affiliate products across 11 KOL accounts.
- **Made the numbers trustworthy before modelling.** Designed a 19-model dbt project with explicit grain, 24h/48h freshness SLAs and reconciliation tests. These tests explained a **3.7× GMV gap** between two data sources that would otherwise have poisoned every downstream metric.
- **Engineered market signals.** Joined 341K KOL session rows with market-wide SKU data (107M+ products processed) into 50+ features — price position, category momentum, shop quality, past session performance.
- **Modelled "winners".** A Gradient Boosting classifier lifted recall of winning products **5×** over the baseline (AUC 0.71) — modest discrimination, but enough to re-rank a long tail into a short list.
- **Shipped it as an operating routine, not a notebook.** An automated whitelist optimizer now produces 400–600-item daily baskets for 24 KOL accounts, with hit-rate tracking in Metabase and Power BI.

## Impact

- The recommended **192-product basket drove 25.8% of session GMV** — **8.6× more GMV per product** than products the hosts picked themselves.
- The product became part of the pitch that **won the company a new client**.

## What I'd do next

The 8.6× figure compares recommended vs. self-picked products, which is not a clean causal estimate — hosts may promote recommended items differently. With my econometrics background, the next step I'd push for is a **randomised or staggered holdout** (some sessions without recommendations) to measure true incremental GMV, then feed that lift back into the optimiser's objective.

<p class="note">Client and partner names are withheld. All figures are from my published CV.</p>
