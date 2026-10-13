---
# HOW TO ADD A NEW DASHBOARD
# 1. Copy this file to a new name without the leading "_" (e.g. fnb-distribution-sales.md).
#    The file name becomes the URL: /dashboards/fnb-distribution-sales
# 2. PDF preview (until the interactive link is ready):
#    Power BI Desktop → File → Export → Export to PDF. Save it as
#    public/dashboard-files/<name>/<name>.pdf, set `pdf:` below, then run
#    python scripts/render-dashboard-pdf-pages.py public/dashboard-files/<name>/<name>.pdf
# 3. Interactive version: Power BI Service → File → Embed report → Publish to web (public) →
#    copy the LINK (not the iframe HTML) into embedUrl. It must start with
#    https://app.powerbi.com/view?r=   Publish to web is PUBLIC: no client/employer/personal data.
#    When embedUrl is set the live report replaces the PDF viewer; the PDF stays as a download.
# 4. Run `npm run build` — the build fails if embedUrl or pdf has the wrong format.
title: Dashboard title
summary: One sentence on the business question this dashboard answers.
domain: E-commerce · Finance
order: 10
embedUrl: ''
pages: 3
tools: [Power BI, DAX]
# work: slug-of-related-case-study
# repoUrl: https://github.com/bonjourney1011/repo-name
updated: 2026-10-13
# pdf: /dashboard-files/<name>/<name>.pdf
draft: true
---

## How to read it

1. First page — what to look at first.
2. Second page — the deep dive.
