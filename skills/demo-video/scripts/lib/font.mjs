// タイトル画面に使う日本語フォントのファイルを返す
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

export function findFont() {
  const candidates = [
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
  ];
  for (const f of candidates) if (existsSync(f)) return f;
  try {
    const f = execFileSync("fc-match", ["-f", "%{file}", ":lang=ja:weight=bold"], { encoding: "utf8" }).trim();
    if (f && existsSync(f)) return f;
  } catch {}
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const f = findFont();
  if (!f) process.exit(1);
  console.log(f);
}
