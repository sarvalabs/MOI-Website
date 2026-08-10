import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Served under moi.technology/blog by Nginx on the VM — no Vercel anywhere.
export default defineConfig({
  site: 'https://moi.technology',
  base: '/blog',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
});
