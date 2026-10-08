import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));
const allowedPaths = [
  '.gitignore',
  '.nvmrc',
  'CODEX_PROMPT.md',
  'README.md',
  'app.js',
  'index.html',
  'styles.css',
  'workouts.js',
  'package.json',
  'package-lock.json',
  'scripts',
  'publish.command',
];
const expectedRemotes = new Set([
  'https://github.com/dengweizhang/train-log.git',
  'git@github.com:dengweizhang/train-log.git',
]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function gitResult(args) {
  const result = spawnSync('git', args, {
    cwd: projectDirectory,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  if (result.error) {
    fail('无法运行 Git，请先安装 Git 并确认它在 PATH 中。');
  }
  return result;
}

function gitValue(args, errorMessage) {
  const result = gitResult(args);
  if (result.status !== 0) fail(errorMessage);
  return result.stdout.trim();
}

function normalizedRemote(remote) {
  const trimmed = remote.replace(/\/$/, '');
  return trimmed.endsWith('.git') ? trimmed : `${trimmed}.git`;
}

function isAllowedPath(path) {
  return allowedPaths.includes(path) || path.startsWith('scripts/');
}

function checkStagedPaths() {
  const result = gitResult(['diff', '--cached', '--name-only', '--no-renames', '-z']);
  if (result.status !== 0) fail('无法检查 Git 暂存区，尚未提交或推送。');
  const stagedPaths = result.stdout.split('\0').filter(Boolean);
  if (stagedPaths.some((path) => !isAllowedPath(path))) {
    fail('Git 暂存区包含网站发布范围之外的文件，请先取消这些文件的暂存后重试。');
  }
}

function run(command, args, errorMessage) {
  const result = spawnSync(command, args, {
    cwd: projectDirectory,
    stdio: 'inherit',
  });
  if (result.error || result.status !== 0) fail(errorMessage);
}

const repositoryRoot = gitValue(
  ['rev-parse', '--show-toplevel'],
  '这里还不是 Git 仓库，请先将项目关联到 GitHub 仓库。',
);
if (realpathSync(repositoryRoot) !== realpathSync(projectDirectory)) {
  fail('当前项目不是 Git 仓库的根目录，请先为本项目配置独立仓库。');
}

const branch = gitValue(['branch', '--show-current'], '无法确认当前 Git 分支。');
if (branch !== 'main') fail('请切换到 main 分支后再发布。');

for (const args of [
  ['remote', 'get-url', '--all', 'origin'],
  ['remote', 'get-url', '--push', '--all', 'origin'],
]) {
  const remotes = gitValue(args, '请先配置指向 dengweizhang/train-log 的 origin。').split('\n');
  if (remotes.some((remote) => !expectedRemotes.has(normalizedRemote(remote)))) {
    fail('origin 必须指向 GitHub 的 dengweizhang/train-log 仓库，请检查远程配置。');
  }
}

checkStagedPaths();
run(process.execPath, ['scripts/prepare.mjs'], '构建失败，尚未提交或推送。');

// Omit paths that have never existed, while retaining tracked deletions.
const pathsToStage = allowedPaths.filter((path) =>
  existsSync(new URL(`../${path}`, import.meta.url)) ||
  gitResult(['ls-files', '--error-unmatch', '--', path]).status === 0,
);
if (pathsToStage.length > 0) {
  run('git', ['add', '-A', '--', ...pathsToStage], '无法暂存网站文件，尚未提交或推送。');
}
checkStagedPaths();

const stagedDiff = gitResult(['diff', '--cached', '--quiet', '--exit-code']);
if (stagedDiff.status === 1) {
  const now = new Date();
  const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, '0'))
    .join('-');
  run('git', ['commit', '-m', `Update training log ${date}`], 'Git 提交失败，请修复提示的问题后重试。');
} else if (stagedDiff.status !== 0) {
  fail('无法检查待提交内容，尚未推送。');
}

// Always push, including existing local commits and the first push to an empty repo.
run('git', ['push', '-u', 'origin', 'main'], '推送失败，本地提交已保留。请解决 GitHub 登录或远程分支问题后重试。');
console.log('已推送到 GitHub，Cloudflare 将在构建通过后自动更新网站。');
