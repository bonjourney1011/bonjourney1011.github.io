---
title: Where is growth coming from in a $55.8M retail business?
summary: A four-page Power BI growth story for a global electronics retailer — 8 countries, 67 stores and an online channel — answering where to invest next.
category: ecommerce
kind: Independent
period: 06/2026
role: Analyst — data model, DAX, dashboard narrative
metric:
  value: $55.76M
  label: revenue analysed across 8 countries + online, 2016–2021
stack: [Power BI, DAX, SQL Server, Field Parameters]
order: 4
repoUrl: https://github.com/bonjourney1011/powerbi-retails-dashboard
dashboard: global-electronics-retail
---

## The business question

A retailer selling electronics through 67 physical stores in 8 countries plus an online channel asked one strategic question: **"Where is growth coming from, and where should we invest next?"**

## What I did

- Modelled 62,884 transactions as a star schema (sales fact; products, customers, stores and date dimensions).
- Wrote 28 DAX measures in a dedicated measures table — revenue and cost computed with `SUMX` at query time, no stored columns.
- Used **field parameters** so one click switches every visual between channel, category, brand, country and continent.
- Organised the report as four business questions: overall growth, channel & seasonality, category & product, customer & geography.

## Impact — what the data says

- Revenue grew **2.6×** from 2016 to 2019, then fell **49.1%** in 2020. Gross margin held at **~58%** throughout, so 2020 was an external demand shock, not a structural pricing problem.
- Two brands earn similar revenue with opposite strategies: one premium (~$2.1K average order) and one volume-led (~$0.9K), which calls for different marketing plays.
- Overall: **$55.76M revenue, 58.58% gross margin, 26,326 orders**, $2.12K average order value.

## What I'd do next

Add cohort retention by acquisition channel. Revenue mix alone can't say whether online customers are more valuable over time — and that is the real investment question.
