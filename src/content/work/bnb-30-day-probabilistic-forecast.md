---
title: Can a foundation model forecast a crypto price better than "no change"?
summary: A live 30-day BNB forecast that publishes ranges instead of a single price, and scores TabPFN, Chronos-2, ARIMA and a Delta-Random Forest against a random walk on 302 walk-forward dates. None of them beat it, and the site says so.
category: finance
kind: Independent
period: 11/2026
role: Analyst and builder — forecasting design, walk-forward backtest, data pipeline, web
metric:
  value: 0 of 7
  label: models beat a random walk; the well-calibrated range is the usable output
stack: [Python, TabPFN, Chronos-2, statsmodels, scikit-learn, GitHub Actions, Chart.js]
order: 6.5
repoUrl: https://github.com/bonjourney1011/bnb-forecast
cover: /images/work/bnb-forecast/forecast-fan.png
---

## The business question

Tabular foundation models such as TabPFN now beat tuned gradient-boosted trees on many benchmarks, without any training. **Does that carry over to a price series an investor actually cares about, or is "the price stays where it is" still the forecast to beat?** And if no model wins, what is still useful for a decision?

## What I did

- Built a daily pipeline on 3,300 days of BNB, BTC and ETH closes from public market data, with a fallback source and a hard stop on missing days.
- Forecast the **distribution** of the 1 to 30-day return (seven quantiles), never the price level, because a table model cannot extrapolate to values outside what it has seen.
- Compared seven challengers against a random walk: TabPFN in three designs, Chronos-2, ARIMA(0,1,1), a Delta-Random Forest and a random walk with drift. The ARIMA and Delta-RF specifications come from my published walk-forward study of robusta futures.
- Ran a **rolling-origin backtest on 302 weekly dates (2021–2026)**. Each model sees only earlier data, and context rows whose outcome was not yet known are purged. Tests prove that changing future prices cannot change a past feature.
- Scored with pinball loss, range coverage, direction on non-overlapping windows, and a Diebold–Mariano test with Holm adjustment.
- Shipped a [live site](https://bonjourney1011.github.io/bnb-forecast/) that refreshes every day and keeps an append-only log, so each forecast is graded against the real price once 30 days pass.

## Impact — what the data says

![Skill of each model versus a random walk](/images/work/bnb-forecast/skill-vs-random-walk.png)

- **No model beat the random walk.** ARIMA, Delta-Random Forest and Chronos-2 sit within 3% of it and are statistically indistinguishable, the same pattern as in the robusta study.
- **My first TabPFN design was overconfident**: its 80% range held the real outcome only 58% of the time. Daily rows with overlapping 30-day targets are near-duplicates, and the model read them as independent evidence. Removing the overlap closed a third of the gap; it still lost at every horizon.
- **Calendar features added nothing.** Weekday, day-of-month and month left skill unchanged (−7.8% against −8.0%).
- **What survives is the range.** The baseline and Chronos-2 ranges cover 79–82% against a nominal 80%, so they can size a position or set a buying zone. Direction accuracy ran from 48% to 61% on 61 windows, all inside each other's confidence intervals.
- A fixed trading rule matched buy-and-hold at best and lagged it otherwise.

## What I'd do next

Let the live log run for six months: it is the only evidence that hindsight cannot flatter. Then test whether the models earn their keep on what is more predictable than direction, namely volatility and the width of the range.

<p class="note">A personal research project. Not investment advice.</p>
