#!/bin/zsh
set -e

function finish_publish() {
  publish_exit_status=$?
  if [[ -t 0 ]]; then
    read -k 1 "?按任意键关闭..." || true
    echo
  fi
  exit "$publish_exit_status"
}
trap finish_publish EXIT

cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1 && [[ -s "$HOME/.nvm/nvm.sh" ]]; then
  source "$HOME/.nvm/nvm.sh"
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "找不到 npm。请先安装 Node.js（包含 npm），或配置好 NVM 后重试。"
  exit 1
fi

echo "提交并推送网站更新：$PWD"
npm run deploy
