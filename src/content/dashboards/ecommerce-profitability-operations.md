---
title: E-commerce Profitability & Operations
summary: Executive overview, profit deep dive, SLA hotspots and data-quality reconciliation for a three-marketplace seller.
domain: E-commerce · Finance
order: 1
# Paste your Power BI "Publish to web" link here, e.g. https://app.powerbi.com/view?r=eyJrIjoi...
embedUrl: ''
pages: 4
tools: [Power BI, DAX, Power Query, SQL, DuckDB]
work: ecommerce-profit-drop-root-cause
repoUrl: https://github.com/bonjourney1011/ecommerce-profitability-operations-dashboard
updated: 2026-09-03
pdf: /dashboard-files/ecommerce-profitability-operations/ecommerce-profitability-operations-dashboard.pdf
---

## How to read it

1. **Start at the warning banner.** August is a partial month, so every comparison defaults to the same period last month (SPLM).
2. **Read the bridge left to right.** It splits the profit change into order volume, average order value and margin rate.
3. **Use Operations & SLA to prioritise.** Hotspots are ranked by profit at risk, not by late-order count.
4. **Check page 4 before quoting any number.** It shows exactly where the pre-built aggregate table disagrees with the transactional source.
