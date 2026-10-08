# Codex task

Build and maintain this repository as Davin's independent training log website.

Requirements:
- Keep the site independent from `dwstyle.cc`; `dwstyle.cc` should only link to this site later.
- Preserve the minimalist visual system already implemented.
- Keep the site static-first and easy to deploy on Cloudflare Pages / GitHub Pages.
- Publish `main` through the GitHub repository `dengweizhang/train-log` and Cloudflare Pages native Git integration (`train-log`). Do not upload the production site from this computer with Wrangler.
- The canonical URL is `https://train-log-90b.pages.dev/`; the previous `train-log-site.pages.dev` address is a redirect for existing links.
- Treat `workouts.js` as the canonical workout data source.
- Preserve every historical workout exactly; do not normalize away details such as varying set reps or assisted-pull-up assistance.
- Assisted pull-up progress is inverse: lower assistance means stronger performance.
- Use a compact monthly calendar with selectable dates and complete workout details; keep it mobile friendly.
- Progress views should be derived from data, not hard-coded.
- Future daily workout updates should require editing only the workout data source unless a feature change is requested.
- Avoid accounts, comments, social features, and unnecessary backend complexity.

Current dataset: 38 training dates from 2026-07-28 through 2026-10-07.
