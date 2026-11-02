import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'training-log-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'scripts'));
  await copyFile(new URL('./prepare.mjs', import.meta.url), join(root, 'scripts/prepare.mjs'));
  const scripts = ['workouts.js', 'workouts-2026-10-22.js', 'workouts-2026-11-01.js', 'app.js'];
  await writeFile(join(root, 'index.html'), scripts.map(src => `<script src="${src}"></script>`).join('\n'));
  await writeFile(join(root, 'styles.css'), 'body { margin: 0; }');
  await writeFile(join(root, scripts[0]), 'window.WORKOUTS = [{date:"2026-10-21",items:[]}];');
  await writeFile(join(root, scripts[1]), 'window.WORKOUTS.push({date:"2026-10-22",items:[]});');
  await writeFile(join(root, scripts[2]), 'window.WORKOUTS.push({date:"2026-11-01",items:[["爬坡","—","60 min"]]});');
  await writeFile(join(root, scripts[3]), 'window.latestDate = window.WORKOUTS.at(-1).date;');
  return { root, scripts, build: () => spawnSync(process.execPath, ['scripts/prepare.mjs'], { cwd: root, encoding: 'utf8' }) };
}

test('build includes daily scripts and loads their records before the app', async t => {
  const { root, scripts, build } = await fixture(t);
  await mkdir(join(root, 'dist'));
  await writeFile(join(root, 'dist/stale.js'), 'old');
  const result = build();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual((await readdir(join(root, 'dist'))).sort(), ['index.html', 'styles.css', ...scripts].sort());
  const context = { window: {} };
  for (const script of scripts) {
    const content = await readFile(join(root, 'dist', script), 'utf8');
    assert.equal(content, await readFile(join(root, script), 'utf8'));
    runInNewContext(content, context);
  }
  assert.equal(context.window.WORKOUTS.length, 3);
  assert.equal(context.window.latestDate, '2026-11-01');
  assert.equal(context.window.WORKOUTS.at(-1).items[0][2], '60 min');
});

test('a missing daily script fails the build before replacing dist', async t => {
  const { root, build } = await fixture(t);
  await rm(join(root, 'workouts-2026-11-01.js'));
  await mkdir(join(root, 'dist'));
  await writeFile(join(root, 'dist/previous.txt'), 'previous successful build');
  const result = build();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /页面引用的静态文件不存在：workouts-2026-11-01\.js/);
  assert.equal(await readFile(join(root, 'dist/previous.txt'), 'utf8'), 'previous successful build');
});
