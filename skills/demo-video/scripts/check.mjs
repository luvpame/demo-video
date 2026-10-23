// 録画に要る道具がそろっているかを確かめる。setup.sh と setup.ps1 の最後に流れる
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { HOME, loadRuntime } from "./lib/browser.mjs";
import { ffmpegPath } from "./lib/ffmpeg.mjs";
import { findFont } from "./lib/font.mjs";

let ok = true;
const fail = (line) => { console.log(line); ok = false; };

console.log(`node: ${process.execPath}`);
console.log(`playwright: ${loadRuntime("playwright/package.json").version}`);

const ffmpeg = ffmpegPath();
if (!ffmpeg || !existsSync(ffmpeg)) {
  fail(`ffmpeg: ダウンロードできていません（ネットにつながる状態で setup をもう一度流してください）`);
} else {
  const list = (flag) => execFileSync(ffmpeg, ["-hide_banner", flag], { encoding: "utf8" });
  if (!/ drawtext /.test(list("-filters"))) fail("ffmpeg: drawtext がありません");
  else if (!/libx264/.test(list("-encoders"))) fail("ffmpeg: libx264 がありません");
  else console.log("ffmpeg: ok");
}

try {
  const browser = await loadRuntime("playwright").chromium.launch({ channel: "chrome" });
  await browser.close();
  console.log("chrome: ok");
} catch {
  fail("chrome: Google Chrome が見つかりません（https://www.google.com/chrome/ から入れてください）");
}

const font = findFont();
if (font) console.log(`font: ${font}`);
else fail("font: 日本語フォントが見つかりません");

if (!ok) process.exit(1);
console.log(`準備できました（${HOME}）`);
