// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://m0vehyeon.github.io',
  // user site (username.github.io) 이므로 base 는 설정하지 않는다.
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
