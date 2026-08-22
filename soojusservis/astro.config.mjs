import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://soojusservis.ee',
  integrations: [sitemap()],
  output: 'static',
});
