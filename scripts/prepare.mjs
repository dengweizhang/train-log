import { copyFile, mkdir, rm } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
const assets = ['index.html', 'styles.css', 'workouts.js', 'app.js'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const asset of assets) {
  await copyFile(new URL(`../${asset}`, import.meta.url), new URL(asset, output));
}
console.log(`已准备 ${assets.length} 个静态文件到 dist/。`);
