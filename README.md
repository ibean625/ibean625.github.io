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

Email, Xiaohongshu, and WeChat appear alongside the biography links and are configured in `_config.yml`. Email and WeChat open matching popovers with copy actions. The biography is justified, and mobile layouts use one shared content column for the portrait, biography, links, and publications.

Click a publication figure to bring it forward as a frameless image. Its curved motion and perceptual scale ease smoothly into place; closing follows the path back to the thumbnail. Stable scrollbar space prevents the page from shifting at either end. The transition respects image letterboxing, can be interrupted, and restores focus after closing. Available demo videos play silently on mouse hover and stop on exit; touch devices have an explicit play button. The preview dialog supports Escape, backdrop dismissal, native video controls, and focus restoration. Video files load only after interaction, and automatic previews respect reduced-motion and data-saving preferences. Without JavaScript, the links open the original image or video.

The CV link opens a page preview inside the website, with English/Chinese selection and zoom controls. The preview images are rendered from the original PDFs and checked against their source hashes during every build. After changing either PDF, run `npm run cv:previews` (requires Poppler's `pdfinfo` and `pdftoppm`) and commit `assets/cv/previews/` with the updated CV. `PDFINFO` and `PDFTOPPM` can point to specific executable paths.

The envelope beside the biography links unfolds directly into a writing surface with two required fields: contact details and a message. The same form stays inside that envelope; there is no separate paper-to-envelope swap. Opening uses one continuous timeline: the icon approaches as a closed landscape envelope, then its folds and writing surface unfold together with a gentle deceleration. Submitting folds and flies the envelope immediately, while the network request proceeds independently. A pending panel shows the current state and allows the visitor to stop waiting. Only a positive provider response shows the delivery receipt and clears the draft. A few translucent heart bubbles drift quietly above the thank-you card after confirmed delivery. They leave the text unobstructed, do not dim the backdrop, and stop on close, resize, tab hiding or reduced-motion preference. Animation watchdogs, interruption handling and reduced-motion support keep paused mobile timelines from blocking network state.

Delivery uses [FormSubmit](https://formsubmit.co/documentation) and the verified public `message_form_id` in `_config.yml`. The fetch and response body have a hard deadline of 10 seconds for text or 25 seconds for attachments, including a resume check after Safari/tab suspension. An unconfirmed or timed-out request preserves the text and files and explicitly says that the letter may already have been sent; there are no automatic retries. The fallback opens an email draft prefilled with the contact details and message. Attachments must be added again in the email app. Optional files are limited to 10 MB total. File delivery uses the regular multipart endpoint and validates its redirect to `/letter-receipt/`; the AJAX endpoint handles text only because it drops files. For a file submission without a sender email, the receiving address is routing metadata with an explanatory note; only real sender addresses become Reply-To. The form also has a honeypot and blocks duplicate in-flight submissions. No mail credentials are stored in the site. Messages are private and not published as comments. FormSubmit retains submissions for 30 days; changing recipients requires activation and delivery verification. Without JavaScript, the invitation opens direct email.

Input fields use self-hosted Caveat and LXGW WenKai TC handwriting fonts under SIL OFL 1.1 (`public/fonts/letter/`). Chinese font CSS loads on intent and its Unicode subsets load only for displayed glyphs. Letter, contact, image, video and CV backdrops share a restrained 3px blur.

`prepare-assets.mjs` generates optimized WebP images and copies an explicit list of public PDFs and videos to `public/assets/` before development or a build. Generated copies are ignored by Git. Edit the originals in `assets/`, and keep the allowlist current when adding a new local paper or video. CV source files, application documents, and other private working files are not included in the website.

The original Jekyll layouts, styles, and `index.md` are retained for reference; they are not part of the Astro build.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys `dist/` when changes reach `main`. In the repository's **Settings → Pages**, select **GitHub Actions** as the source before the first Astro deployment. Existing `/assets/` PDF and video URLs are retained.

## Design attribution

The warm paper palette and editorial typography are adapted from **Scholar Pages**, copyright © 2025 Jiaxin Peng, used under the MIT license. The original license is preserved in `licenses/Scholarly-MIT.txt`. The previous Minimal Light theme's license remains in `LICENSE`.
