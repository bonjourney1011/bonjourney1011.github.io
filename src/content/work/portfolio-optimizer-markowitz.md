---
title: How much would you put in each stock? A live Markowitz optimizer for Vietnam
summary: I turned a two-stock exam model from my Master of Finance into a browser tool. It optimises any basket of Vietnamese stocks on live prices, caps risk at 15%, and then tests the answer on data the model never saw.
category: finance
kind: Independent
period: 10/2026
role: Analyst and developer — method, optimiser, data pipeline, interface
metric:
  value: 1.05 → −0.35
  label: Sharpe ratio of the max-Sharpe portfolio, estimated on Oct 2023 – Jan 2026 vs realised Jan – Oct 2026
stack: [TypeScript, Quadratic programming, VNDirect API, SVG, Vitest]
order: 5.5
tool: portfolio-optimizer
---

## The business question

An investor holds a list of Vietnamese stocks and has two rules: **earn the best return per unit of risk, and never let annual volatility go above 15%**. How much should go into each stock, and should some money sit in government bonds instead?

In the Quantitative Methods for Finance course (FTU, Master of Finance) we answered this in Excel for two and three stocks: formulas for the statistics, and Excel Solver for the weights. That approach does not scale. The closed-form minimum-variance formula only works for two assets, and Solver results are typed-in numbers that don't update when the data changes. This tool generalises the same method to any number of stocks and lets anyone try it.

## What I did

- **Live data.** For each ticker and VN-Index, the browser pulls daily closing prices from the VNDirect chart API, with KB Securities as a fallback. Prices are adjusted for stock splits and bonus shares. Only trading days shared by every stock are kept.
- **Same conventions as the course.**
  - Returns: simple daily returns, R = P<sub>t</sub>/P<sub>t−1</sub> − 1.
  - Annualising: mean × 252, sample covariance (n − 1) × 252.
  - Sharpe ratio: (E(R<sub>p</sub>) − R<sub>f</sub>) / σ<sub>p</sub>.
  - Long only: no short selling, weights add up to 100%.
- **My own solver instead of Excel Solver.** I wrote a small active-set quadratic-programming solver and use it for every optimisation:
  - **Minimum variance:** min wᵀΣw subject to Σw = 1 and w ≥ 0.
  - **Efficient frontier:** the same problem with a fixed target return, at 40 target levels.
  - **Max Sharpe (tangency portfolio):** a single convex problem, min yᵀΣy subject to (μ − R<sub>f</sub>)ᵀy = 1 and y ≥ 0, then w = y / Σy.
- **The 15% risk cap, with stocks only.** Along the efficient frontier the Sharpe ratio rises up to the tangency portfolio and then falls. So if the tangency portfolio is too risky, the best capped portfolio is exactly where the frontier crosses σ = 15%, and the tool finds that point by bisection. If even the least risky mix is above 15%, the tool says so plainly.
- **The 15% risk cap, with a risk-free asset.** This uses Tobin separation: keep the tangency mix unchanged and only scale how much goes into it, y = min(1, 15% / σ<sub>T</sub>), with the rest in government bonds. Risk falls to the cap and the Sharpe ratio is unchanged. This beats any stocks-only portfolio at the same 15% risk.
- **Honest backtest.** Weights are estimated on the first part of the date range and held, without rebalancing, through the rest. The comparison is against VN-Index and an equal-weight 1/N basket.
- **Checked against the course spreadsheets.** Unit tests reproduce the Excel answers from my midterm (BSR, HDB, VIC) to five decimal places, including betas, minimum-variance weights and max-Sharpe weights. They also cover the corner cases that break the textbook formula: a 100%-in-one-stock solution, and every stock returning less than R<sub>f</sub>.

## What the data says (default run, prices to 15 Oct 2026)

The default basket has 8 large caps: FPT, VCB, HPG, MWG, GAS, VNM, REE and BSR. Weights are estimated on Oct 2023 – Jan 2026 and tested on Jan – Oct 2026.

- **The 15% cap is not reachable with stocks alone.** The least risky mix of these 8 stocks still has σ = 17.1%. Individual stocks run at 22–37% volatility. Diversification inside one market only goes so far.
- **Adding a risk-free asset solves it cleanly.** The best portfolio puts 63% in the tangency mix and 37% in bonds. It has σ = 15% and an expected return of 20.2%, at the same 1.05 Sharpe ratio as the tangency portfolio.
- **The in-sample optimum did not survive the test window.**
  - The max-Sharpe portfolio's Sharpe fell from 1.05 to −0.35.
  - VN-Index lost 10.4% and the 1/N basket lost 13.7%.
  - The capped mix with bonds lost only 3.4%. However, its realised σ was 18.3%, above the 15% target, because the risk estimate drifted too.
- **The lesson:** mean-variance weights are only as good as the expected-return estimates, and those are the noisiest input. The risk cap and the bond allocation did more to protect capital than the "optimal" stock mix.

## What I'd do next

- Shrink the covariance matrix (Ledoit–Wolf) and shrink expected returns toward the market (Black–Litterman), to reduce estimation error.
- Use walk-forward rebalancing instead of a single train/test split, and add transaction costs.
- Add constraints that real portfolios use, such as a maximum weight per stock and sector limits.

<p class="note">A personal research project built on public market data. Not investment advice.</p>
