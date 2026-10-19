import { readFile, access, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../dist/', import.meta.url);
for (const [path, lang, text] of [['index.html', 'en', 'manipulation models'], ['zh/index.html', 'zh-CN', '操作模型']]) {
  const html = await readFile(new URL(path, root), 'utf8');
  assert.ok(html.includes(`lang="${lang}"`), `${path}: correct language`);
  assert.ok(html.includes(text), `${path}: translated content`);
  assert.ok(html.includes('arXiv'), `${path}: correct PRIOR status`);
  assert.ok(!html.includes('Mira Latticewell') && !html.includes('Fictional'), `${path}: no template sample content`);
  assert.ok(!html.includes('under review'), `${path}: no outdated submission status`);
  assert.ok(!html.includes('id="research"') && !html.includes('project-grid'), `${path}: no duplicate research section`);
  assert.ok(!html.includes('id="contact"') && !html.includes('class="honors"') && !html.includes('service-note'), `${path}: no contact, honors, or service section`);
  assert.ok(!html.includes('id="experience"') && !html.includes('#experience'), `${path}: no removed experience section or navigation`);
  for (const id of ['about', 'publications']) {
    assert.ok(html.includes(`id="${id}"`), `${path}: section ${id}`);
  }
  const papers = [...html.matchAll(/<li class="publication"[\s\S]*?<\/li>/g)];
  assert.ok(papers.length > 0, `${path}: publication list is present`);
  for (const [paper] of papers) {
    assert.equal((paper.match(/<img\b/g) ?? []).length, 1, `${path}: each publication has one figure`);
  }
  assert.ok(html.includes('id="media-dialog"'), `${path}: accessible media preview is present`);
  assert.ok(html.includes('id="cv-dialog"') && html.includes('data-open-cv'), `${path}: CV opens in an in-page viewer`);
  assert.ok(!/class="[^"]*menu-toggle/.test(html), `${path}: no hamburger menu`);
  for (const [video] of html.matchAll(/<video\b[^>]*>/g)) {
    assert.ok(!/\ssrc=/.test(video) && video.includes('preload="none"'), `${path}: videos load only after interaction`);
  }
  const urls = [...html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)].map(match => decodeURI(match[1]));
  for (const url of new Set(urls)) {
    const relative = url.replace(/^\//, '');
    await access(new URL(relative.endsWith('/') ? `${relative}index.html` : relative, root));
  }
}
async function checkPublicFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await checkPublicFiles(path);
    else assert.ok(!/\.(tex|docx|cls|py)$/i.test(entry.name), `Non-public source must not be published: ${path}`);
  }
}
await checkPublicFiles(fileURLToPath(root));
console.log('PASS: bilingual routes, section links, local assets, PRIOR status, and public-file boundaries.');
