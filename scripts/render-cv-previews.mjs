import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const target = new URL('assets/cv/previews/', root);
await mkdir(target, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), 'website-cv-preview-'));
const previews = {};
try {
  for (const [language, pdf] of [['en', 'cv/chenxi_han_cv.pdf'], ['zh', 'cv/zh/chenxi_han_cv_zh.pdf']]) {
    const source = fileURLToPath(new URL(`assets/${pdf}`, root));
    const info = execFileSync(process.env.PDFINFO || 'pdfinfo', [source], { encoding: 'utf8' });
    const pageCount = Number(info.match(/^Pages:\s+(\d+)/m)?.[1]);
    if (pageCount !== 1) throw new Error(`${pdf}: expected the current single-page CV, received ${pageCount} pages`);
    const prefix = join(temporary, language);
    execFileSync(process.env.PDFTOPPM || 'pdftoppm', ['-f', '1', '-singlefile', '-r', '200', '-png', source, prefix]);
    const result = await sharp(`${prefix}.png`).webp({ quality: 95 }).toFile(fileURLToPath(new URL(`${language}.webp`, target)));
    previews[language] = {
      pdf,
      image: `cv/previews/${language}.webp`,
      sha256: createHash('sha256').update(await readFile(source)).digest('hex'),
      width: result.width,
      height: result.height,
    };
  }
  await writeFile(new URL('manifest.json', target), JSON.stringify(previews, null, 2) + '\n');
  console.log('Rendered current English and Chinese CV previews.');
} finally {
  await rm(temporary, { recursive: true, force: true });
}
