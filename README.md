# Training Log

Davin 的独立训练日志静态站点。

## 本地预览

直接打开 `index.html`，或在目录中运行：

```bash
python3 -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 部署

这是纯静态站点，由 Cloudflare Pages 原生 Git 集成自动构建和部署。

- GitHub 仓库：https://github.com/dengweizhang/train-log
- Cloudflare Pages 项目：`train-log`
- 正式地址：https://train-log.pages.dev/
- 兼容旧入口：https://train-log-site.pages.dev/（跳转到正式地址）
- Production branch：`main`
- Build command：`npm run build`
- Build output directory：`dist`
- Node.js：22，配置见 `.nvmrc`。
- `npm run build` 只把 `index.html`、`styles.css`、`workouts.js`、`app.js` 复制到 `dist/`，不转换内容。

首次在其他电脑使用（Node.js 22 或更高版本）：

```bash
git clone https://github.com/dengweizhang/train-log.git
cd train-log
npm ci
```

日常更新后，双击 `publish.command`，或运行：

```bash
npm run deploy
```

发布脚本会检查构建，提交已保存的项目文件，然后推送 GitHub 的 `main` 分支。Cloudflare 会从仓库读取这个提交并自动构建，构建通过后才更新正式网站。

可以直接在 GitHub 中编辑 `workouts.js` 并提交到 `main`，同样会自动更新。发布过程无需本机登录 Cloudflare，也不再运行 Wrangler 上传。

查看构建与部署结果：在 Cloudflare 控制台打开 Workers & Pages → `train-log` → Deployments，核对提交号与 GitHub 对应。未推送的本机改动不会出现在网站中。

旧 `train-log-site` Direct Upload 项目仅保留重定向，以兼容已有链接；站点内容由新的 Git 集成项目负责发布。[Cloudflare Git 集成说明](https://developers.cloudflare.com/pages/configuration/git-integration/)

## 更新训练记录

在 `workouts.js` 顶层数组中追加：

```js
{date:'2026-10-08',items:[
  ['辅助引体','35 kg辅助','8 + 8 + 8次'],
  ['爬坡','—','30 min']
]}
```

页面会自动更新月历、统计数据和 Progress。

月历默认打开最近一次训练所在月份；可用左右箭头、月份选择器查看其他月份，点击日期查看当天完整训练记录。桌面端并排显示月历和详情，手机端上下排列。没有记录的日期显示「暂无训练记录」。

有氧统计累计动作名称含「骑行」「公路车」「爬坡」的已记录时长；新增其他有氧类型时需同步 `app.js` 的筛选规则。
