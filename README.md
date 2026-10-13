# Mo Thuan — Data Analyst Portfolio

Static portfolio site built with [Astro](https://astro.build). Case studies and dashboards are plain
Markdown files; the build validates every Power BI embed link.

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # type-check + build to dist/
npm run preview    # serve dist/
```

## Where things live

| What | File |
|---|---|
| Name, bio, links, email, homepage numbers | `src/config/site-profile.ts` |
| Experience, education, awards, skills, "How I work" | `src/config/career-and-recognition.ts` |
| Case studies (one `.md` per project) | `src/content/work/` |
| Dashboards (one `.md` per report) | `src/content/dashboards/` |
| Images | `public/images/...` |
| Colours & fonts | `src/styles/global-tokens-and-base.css` |

## Dashboards: PDF now, interactive Power BI later

Each dashboard page shows, in priority order: the live Power BI report (`embedUrl`) →
a swipeable PDF viewer (`pdf`) → a "coming soon" note. New dashboard: copy `_template.md`.

**PDF preview**
1. Power BI Desktop → File → Export → Export to PDF.
2. Save as `public/dashboard-files/<slug>/<slug>.pdf` and set `pdf:` in the dashboard file.
3. `python scripts/render-dashboard-pdf-pages.py public/dashboard-files/<slug>/<slug>.pdf`
   (needs `pip install pymupdf`) — creates the page images the viewer swipes through.

**Interactive version**
1. Power BI Service → open the report → **File → Embed report → Publish to web (public)**.
   Copy the **link** (starts with `https://app.powerbi.com/view?r=`), not the iframe HTML.
2. Paste it into `embedUrl:` — the live report replaces the PDF viewer; the PDF stays downloadable.
3. `npm run build`. The build fails if the link is not a Power BI public link.

> Publish to web makes the report public to anyone with the link. Only use sample or public data —
> never client, employer or personal data.

## Add a case study

Copy any file in `src/content/work/`, change the front matter, and keep the body shape:
**The business question → What I did → Impact → What I'd do next.**
`featured: true` puts it on the homepage. `draft: true` hides it.

## Deploy (GitHub Pages)

1. Create a repo named `bonjourney1011.github.io` and push this folder to `main`.
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. The workflow in `.github/workflows/deploy-to-github-pages.yml` builds and deploys on every push.

Custom domain later: change `site` in `astro.config.mjs` and add the domain in Pages settings.
