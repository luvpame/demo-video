#!/usr/bin/env bash
# 録画に要る道具をそろえる。何度流してもよい。
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
home="${DEMO_VIDEO_HOME:-$HOME/.cache/demo-video}"
mkdir -p "$home"
cp "$here/package.json" "$home/package.json"
if [ ! -d "$home/node_modules/playwright" ] || ! cmp -s "$here/package.json" "$home/.installed.json"; then
  (cd "$home" && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --no-audit --no-fund --silent)
  cp "$here/package.json" "$home/.installed.json"
fi
echo "playwright: $(node -e "console.log(require('$home/node_modules/playwright/package.json').version)")"

ok=1
if ! command -v ffmpeg >/dev/null; then
  echo "ffmpeg: 見つかりません（brew install ffmpeg などで入れてください）"; ok=0
else
  filters="$(ffmpeg -hide_banner -filters 2>/dev/null)"; encoders="$(ffmpeg -hide_banner -encoders 2>/dev/null)"
  grep -q ' drawtext ' <<<"$filters" || { echo "ffmpeg: drawtext がありません（freetype 付きの ffmpeg が要ります）"; ok=0; }
  grep -q libx264 <<<"$encoders" || { echo "ffmpeg: libx264 がありません"; ok=0; }
  [ "$ok" = 1 ] && echo "ffmpeg: ok"
fi
if [ -d "/Applications/Google Chrome.app" ] || command -v google-chrome >/dev/null || command -v google-chrome-stable >/dev/null; then
  echo "chrome: ok"
else
  echo "chrome: Google Chrome が見つかりません"; ok=0
fi
font="$(node "$here/lib/font.mjs")" && echo "font: $font" || { echo "font: 日本語フォントが見つかりません"; ok=0; }
[ "$ok" = 1 ] && echo "準備できました（${home}）" || exit 1
