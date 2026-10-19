import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ibean625.github.io',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [sitemap({
    filter: page => !page.includes('/letter-receipt/'),
    i18n: {
      defaultLocale: 'en',
      locales: { en: 'en', zh: 'zh-CN' },
    },
  })],
});
