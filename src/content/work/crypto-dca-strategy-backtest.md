---
title: Is a "smart" investing strategy worth its complexity?
summary: A backtest of six accumulation strategies on real Binance data (2020–2026) for a salary-based investor. The simplest strategy won — and the analysis shows why.
category: finance
kind: Independent
period: 07/2026
role: Analyst — data collection, backtesting, decision framing
metric:
  value: 6 → 1
  label: strategies tested; plain monthly buying beat every "smart" rule
stack: [Python, pandas, Binance API, matplotlib]
order: 6
repoUrl: https://github.com/bonjourney1011/bnb-dca-backtest
cover: /images/work/bnb-dca-backtest/equity-curves.png
---

## The business question

A salaried investor gets paid on the 5th of each month and buys a fixed amount of one crypto asset. **Do timing rules — RSI dips, sentiment indices, grids, take-profit levels — actually beat simple monthly buying once fees are included?** It's a small version of a question every treasury and asset allocator faces: does extra complexity pay for itself?

## What I did

- Pulled 2,375 days of daily OHLCV data from the public Binance API, plus the Crypto Fear & Greed Index.
- Backtested six strategies under the same budget ($500/month, 0.1% fees, 78 months): pure DCA, DCA + RSI, a hybrid allocation, sentiment-weighted DCA, value averaging and grid trading.
- Tested sell rules (take-profit levels, trailing stops, periodic selling) against holding, and checked whether the buy day matters.

## Impact — what the data says

![Equity curves of the six strategies](/images/work/bnb-dca-backtest/equity-curves.png)

- **Pure DCA ended highest (+493%)**. RSI timing came close (+485%) but wasn't worth the complexity; grid trading returned **+2%** — disastrous on a trending asset.
- **Every sell rule underperformed holding**, by 10% to 72%.
- All strategies lived through a **−69% maximum drawdown**: the real risk is behavioural, not tactical.
- Early-month prices averaged 1.3–1.5% below the monthly mean, so the salary-day timing was already fine.

## What I'd do next

Add walk-forward validation and bootstrapped return paths so conclusions don't rest on a single historical sequence — the same discipline I apply in my published forecasting research.

<p class="note">A personal research project. Not investment advice.</p>
