import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { POWERBI_EMBED_PREFIX } from './config/site-profile';

// Files starting with "_" (e.g. _template.md) are ignored.
const ignoreUnderscore = '**/[^_]*.md';

export const workCategories = ['ecommerce', 'finance', 'engineering', 'research'] as const;

const work = defineCollection({
  loader: glob({ pattern: ignoreUnderscore, base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(workCategories),
    kind: z.enum(['Professional', 'Independent', 'Research']),
    period: z.string(),
    role: z.string(),
    metric: z.object({ value: z.string(), label: z.string() }),
    stack: z.array(z.string()),
    order: z.number(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    confidential: z.boolean().default(false),
    repoUrl: z.url().optional(),
    dashboard: z.string().optional(), // slug of a dashboards entry
    cover: z.string().optional(), // path under /public
  }),
});

const dashboards = defineCollection({
  loader: glob({ pattern: ignoreUnderscore, base: './src/content/dashboards' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    domain: z.string(),
    order: z.number(),
    draft: z.boolean().default(false),
    // Power BI "Publish to web" link. Leave empty until the report is published.
    embedUrl: z
      .string()
      .refine((url) => url === '' || url.startsWith(POWERBI_EMBED_PREFIX), {
        message: `embedUrl must start with ${POWERBI_EMBED_PREFIX}`,
      })
      .default(''),
    pages: z.number().default(1),
    tools: z.array(z.string()),
    // PDF export under /public, e.g. /dashboard-files/<slug>/report.pdf. Shown as swipeable pages
    // until embedUrl is set. Render its page images with scripts/render-dashboard-pdf-pages.py.
    pdf: z
      .string()
      .regex(/^\/dashboard-files\/[a-z0-9-]+\/[a-z0-9-]+\.pdf$/, 'pdf must look like /dashboard-files/<slug>/<name>.pdf')
      .optional(),
    work: z.string().optional(), // slug of the related case study
    repoUrl: z.url().optional(),
    updated: z.coerce.date(),
  }),
});

// Products and ventures built on my own time ("My Own" tab).
const ownProjects = defineCollection({
  loader: glob({ pattern: ignoreUnderscore, base: './src/content/my-own' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    status: z.enum(['Live', 'Building', 'Paused']),
    role: z.string(),
    started: z.string(),
    url: z.union([z.url(), z.literal('')]).default(''), // live site; empty until launch
    repoUrl: z.url().optional(), // only for public repos
    stack: z.array(z.string()),
    order: z.number(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { work, dashboards, ownProjects };
