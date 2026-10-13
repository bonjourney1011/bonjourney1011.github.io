---
title: Owning the most complex category for six global beauty brands
summary: Monthly market-intelligence reporting on 600K–740K SKU rows, a revenue-restatement method that stopped double counting, and ML + LLM product tagging at 92.3% accuracy.
category: ecommerce
kind: Professional
period: 2025 — Present
role: Key handler, Beauty Care category
metric:
  value: '6'
  label: multinational brands served with monthly category reports
stack: [Power BI, SQL, Python, LLM APIs, scikit-learn]
order: 2
featured: true
confidential: true
---

## The business question

Beauty Care is the most complex category on a marketplace intelligence platform — and roughly **half of the company's research revenue**. Brand managers at multinational companies use these reports to set share targets and budgets, so two questions matter every month: **"Is this number the real market?"** and **"Can I trust it at SKU level?"**

## What I did

- **Ran the category end to end** as the DA team's key handler, single-handedly serving 6 multinational brands with monthly Power BI dashboards built on **600K–740K SKU rows**.
- **Fixed a long-standing double-counting problem.** Revenue from combo listings was being double counted, distorting product- and brand-level numbers. I designed a combo revenue-restatement algorithm that removes the double counting while **preserving market totals**, so reports reflect the true market. I later presented it in 3 internal seminars.
- **Automated product tagging.** Combined classical ML with LLMs to classify products by attribute, reaching **92.3% accuracy on 852K rows** (vs. an 88.4% baseline), and tagged 29.9K SKUs by prompting a multimodal LLM with both product text and images.

## Impact

- A long-standing client request was finally solved: reports now reflect the real market instead of an inflated one.
- Product tagging became a repeatable pipeline with a measured accuracy, so month-on-month comparisons rest on consistent attributes.

## What I'd do next

Productise the restatement logic as a tested dbt model with a reconciliation check ("restated total = original total") so it runs for every category, not only the one I own.

<p class="note">Brand names are withheld. All figures are from my published CV.</p>
