// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Deploy target: GitHub Pages user site (https://bonjourney1011.github.io).
// If you move to a custom domain, change `site`. If you deploy to a project
// page (https://<user>.github.io/<repo>/), also set `base: '/<repo>'`.
export default defineConfig({
  site: 'https://bonjourney1011.github.io',
  integrations: [sitemap()],
  trailingSlash: 'ignore',
});
