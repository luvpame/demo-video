#!/usr/bin/env bash
# 録画に要る道具をそろえる（Windows は setup.ps1）。何度流してもよい。
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
home="${DEMO_VIDEO_HOME:-$HOME/.cache/demo-video}"
mkdir -p "$home"

# Node.js が無いか古ければ、公式の配布版を $home/node に入れる。管理者の権限は要らない
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  if [ ! -x "$home/node/bin/node" ]; then
    os="$(uname -s | tr '[:upper:]' '[:lower:]')"
    case "$(uname -m)" in arm64 | aarch64) arch=arm64 ;; x86_64) arch=x64 ;; *) arch="$(uname -m)" ;; esac
    base=https://nodejs.org/dist/latest-v24.x
    line="$(curl -fsSL "$base/SHASUMS256.txt" | grep -- "-$os-$arch.tar.gz$")" || { echo "node: この PC（$os-$arch）向けの Node.js が見つかりません"; exit 1; }
    file="${line##* }"
    echo "node: Node.js を入れます（$file）"
    curl -fsSL -o "$home/$file" "$base/$file"
    (cd "$home" && echo "$line" | shasum -a 256 -c - >/dev/null) || { echo "node: ダウンロードが壊れています。もう一度流してください"; rm -f "$home/$file"; exit 1; }
    rm -rf "$home/node" && mkdir "$home/node"
    tar -xzf "$home/$file" -C "$home/node" --strip-components 1
    rm "$home/$file"
  fi
  export PATH="$home/node/bin:$PATH"
fi

cp "$here/package.json" "$home/package.json"
if [ ! -d "$home/node_modules/playwright" ] || ! cmp -s "$here/package.json" "$home/.installed.json"; then
  (cd "$home" && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --no-audit --no-fund --silent)
  cp "$here/package.json" "$home/.installed.json"
fi
exec node "$here/check.mjs"
