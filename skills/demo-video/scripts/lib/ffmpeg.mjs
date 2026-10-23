// 録画の webm を mp4 にし、タイトル画面を付け、つなぎ、確認用の静止画の一覧を作る
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadRuntime } from "./browser.mjs";
import { findFont } from "./font.mjs";

// ffmpeg-static が OS ごとに drawtext と libx264 の入った ffmpeg を落としてくる
export const ffmpegPath = () => loadRuntime("ffmpeg-static");
const ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p", "-r", "30", "-an"];
const run = (args) => execFileSync(ffmpegPath(), ["-v", "error", "-y", ...args], { stdio: ["ignore", "ignore", "inherit"] });
const esc = (s) => s.replaceAll("\\", "\\\\").replaceAll("'", "\u2019").replaceAll(":", "\\:").replaceAll("%", "\\%");
const hex = (color) => `0x${color.slice(1)}`;

// ffmpeg-static には ffprobe が無いので、ffmpeg -i が出す Duration の行から読む
export function duration(file) {
  const { stderr } = spawnSync(ffmpegPath(), ["-hide_banner", "-i", file], { encoding: "utf8" });
  const m = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!m) throw new Error(`長さを読めません: ${file}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export function titleCard(text, out, { theme, seconds = 1.5, width = 1280, height = 800 }) {
  const font = findFont();
  if (!font) throw new Error("日本語フォントが見つかりません");
  run(["-f", "lavfi", "-i", `color=c=${hex(theme.bg)}:s=${width}x${height}:d=${seconds}`,
    "-vf", `drawtext=fontfile='${esc(font)}':text='${esc(text)}':fontcolor=${hex(theme.fg)}:fontsize=50:x=(w-text_w)/2:y=(h-text_h)/2`,
    ...ENC, out]);
}

export function toMp4(input, out) { run(["-i", input, ...ENC, out]); }

export function concat(files, out) {
  const dir = mkdtempSync(join(tmpdir(), "demo-video-"));
  const list = join(dir, "list.txt");
  const path = (f) => (process.platform === "win32" ? f.replaceAll("\\", "/") : f);
  writeFileSync(list, files.map((f) => `file '${path(f).replaceAll("'", "'\\''")}'`).join("\n"));
  try { run(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", out]); } finally { rmSync(dir, { recursive: true, force: true }); }
}

// 等間隔に12枚抜き、3列×4行の1枚にする
export function contactSheet(input, out) {
  const d = duration(input);
  const fps = 12 / Math.max(d, 1);
  run(["-i", input, "-vf", `fps=${fps},scale=480:-1,tile=3x4:padding=6:color=white`, "-frames:v", "1", out]);
}
