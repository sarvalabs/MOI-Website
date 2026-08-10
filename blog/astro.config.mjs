import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Served as its own host, blog.moi.technology, by Nginx on the VM — the same
// split Logos uses (logos.co for the site, blog.logos.co for articles). The
// blog owns this domain root, so there is no base path.
export default defineConfig({
  site: 'https://blog.moi.technology',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
});
