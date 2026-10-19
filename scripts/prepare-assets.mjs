import { mkdir, copyFile, chmod, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const cvPreviews = JSON.parse(await readFile(new URL('assets/cv/previews/manifest.json', root), 'utf8'));
for (const preview of Object.values(cvPreviews)) {
  const pdf = await readFile(new URL(`assets/${preview.pdf}`, root));
  if (createHash('sha256').update(pdf).digest('hex') !== preview.sha256) {
    throw new Error(`CV preview is out of date: ${preview.pdf}. Run npm run cv:previews after editing a CV.`);
  }
}
const images = ['avatar', 'PRIOR', 'PMG', 'SERL_v2', 'SEWB', 'hair transplantation'];
await mkdir(new URL('public/assets/img/', root), { recursive: true });
for (const name of images) {
  await sharp(fileURLToPath(new URL(`assets/img/${name}.png`, root)))
    .rotate()
    .resize({ width: name === 'avatar' ? 480 : 1200, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(fileURLToPath(new URL(`public/assets/img/${name}.webp`, root)));
}

// Only publish the files linked by the website. CV sources and application
// documents in this repository are deliberately excluded from the public build.
const files = [
  'cv/chenxi_han_cv.pdf',
  'cv/zh/chenxi_han_cv_zh.pdf',
  'cv/previews/en.webp',
  'cv/previews/zh.webp',
  'img/favicon.png',
  'img/favicon-dark.png',
  'files/PMG.pdf',
  'files/PMG.mp4',
  'files/SERL_v2.pdf',
  'files/SERL.mp4',
  'files/SEWB.pdf',
  'files/hair transplantation.pdf',
  'files/hair transplantation.mp4',
];
for (const file of files) {
  const destination = new URL(`public/assets/${file}`, root);
  await mkdir(dirname(fileURLToPath(destination)), { recursive: true });
  await chmod(destination, 0o644).catch(error => { if (error.code !== 'ENOENT') throw error; });
  await copyFile(new URL(`assets/${file}`, root), destination);
  await chmod(destination, 0o644);
}
console.log(`Prepared ${images.length} optimized images and ${files.length} public assets.`);
