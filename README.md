# Chenxi Han · Academic website

Bilingual academic homepage for Chenxi Han (韩晨曦), a Ph.D. student at Tsinghua University and co-founder of ZERITH. Built with Astro, with an editorial design adapted from [Scholar Pages](https://github.com/jxpeng98/astro-theme-scholars).

## Local development

Requires Node.js 22.12 or newer.

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:4100. The existing `scripts/preview` command also starts the Astro preview. In a restricted environment, prefix the command with `ASTRO_TELEMETRY_DISABLED=1`.

```bash
npm run verify
npm run preview
```

`verify` checks Astro/TypeScript, builds both languages, and validates local links, public assets, and publication status. Production output is written to `dist/`.

## Content

| Content | Source |
| --- | --- |
| English and Chinese copy, research summaries, education, experience, honors | `src/data/site.ts` |
| Publication titles, authors, venues, paper and project links | `_data/publications.yml` |
| Email, social profiles, English and Chinese CV paths | `_config.yml` |
| Page sections | `src/components/HomePage.astro` |
| Navigation, language preference, theme switch, metadata | `src/layouts/Layout.astro` |
| Colors, typography, and responsive layouts | `src/styles/scholarly.css` |
| English CV source and PDF | `assets/cv/chenxi_han_cv.tex` and `assets/cv/chenxi_han_cv.pdf` |
| Chinese CV source and PDF | `assets/cv/zh/chenxi_han_cv_zh.docx` and `assets/cv/zh/chenxi_han_cv_zh.pdf` |

The English homepage is `/`; the Chinese homepage is `/zh/`. Language links preserve the current section and save the preference locally. Theme selection also persists, with the system preference used initially. Both pages remain readable and navigable without JavaScript.

Email, Xiaohongshu, and WeChat appear alongside the biography links and are configured in `_config.yml`. WeChat opens a compact popover with the phone number and a copy action. The biography is justified, and mobile layouts use one shared content column for the portrait, biography, links, and publications.

Click a publication figure to enlarge it. Available demo videos play silently on mouse hover and stop on exit; touch devices have an explicit play button. The preview dialog supports Escape, backdrop dismissal, native video controls, and focus restoration. Video files load only after interaction, and automatic previews respect reduced-motion and data-saving preferences. Without JavaScript, the links open the original image or video.

The CV link opens a page preview inside the website, with English/Chinese selection and zoom controls. The preview images are rendered from the original PDFs and checked against their source hashes during every build. After changing either PDF, run `npm run cv:previews` (requires Poppler's `pdfinfo` and `pdftoppm`) and commit `assets/cv/previews/` with the updated CV. `PDFINFO` and `PDFTOPPM` can point to specific executable paths.

`prepare-assets.mjs` generates optimized WebP images and copies an explicit list of public PDFs and videos to `public/assets/` before development or a build. Generated copies are ignored by Git. Edit the originals in `assets/`, and keep the allowlist current when adding a new local paper or video. CV source files, application documents, and other private working files are not included in the website.

The original Jekyll layouts, styles, and `index.md` are retained for reference; they are not part of the Astro build.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys `dist/` when changes reach `main`. In the repository's **Settings → Pages**, select **GitHub Actions** as the source before the first Astro deployment. Existing `/assets/` PDF and video URLs are retained.

## Design attribution

The warm paper palette and editorial typography are adapted from **Scholar Pages**, copyright © 2025 Jiaxin Peng, used under the MIT license. The original license is preserved in `licenses/Scholarly-MIT.txt`. The previous Minimal Light theme's license remains in `LICENSE`.
