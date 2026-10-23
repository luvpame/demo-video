// タイトル画面に使う日本語フォントのファイルを返す
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

// Windows の区切りの \ は drawtext の fontfile で崩れるので / にする
const winFonts = (process.env.WINDIR ?? "C:/Windows").replaceAll("\\", "/") + "/Fonts";

export function findFont() {
  const candidates = [
    "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    `${winFonts}/YuGothB.ttc`,
    `${winFonts}/meiryob.ttc`,
  ];
  for (const f of candidates) if (existsSync(f)) return f;
  try {
    const f = execFileSync("fc-match", ["-f", "%{file}", ":lang=ja:weight=bold"], { encoding: "utf8" }).trim();
    if (f && existsSync(f)) return f;
  } catch {}
  return null;
}
