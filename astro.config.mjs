// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL / BASE_PATH задаются в CI: для GitHub Pages — https://intekko.github.io и '/',
// для боевого хостинга hoster.kz — https://intekko.kz и '/'.
export default defineConfig({
  site: process.env.SITE_URL || 'https://intekko.github.io',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [sitemap({ filter: (p) => !p.includes('/thanks/') })],
});
