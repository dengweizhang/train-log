import { access, copyFile, mkdir, readFile, rm } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)]
  .map(match => match[1]);
const assets = [...new Set(['index.html', 'styles.css', ...scripts])];

// Package every script the page loads, including separate daily workout logs.
// Validate before replacing dist so a missing file cannot deploy silently.
for (const asset of assets) {
  if (!/^[\w.-]+\.(?:html|css|js)$/.test(asset)) {
    throw new Error(`不支持的静态文件路径：${asset}`);
  }
  try {
    await access(new URL(`../${asset}`, import.meta.url));
  } catch {
    throw new Error(`页面引用的静态文件不存在：${asset}`);
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const asset of assets) {
  await copyFile(new URL(`../${asset}`, import.meta.url), new URL(asset, output));
}
console.log(`已准备 ${assets.length} 个静态文件到 dist/。`);
