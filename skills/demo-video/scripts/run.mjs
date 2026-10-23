// シナリオをリハーサル、または録画する
// 使い方: node run.mjs <scenario.mjs> --mode rehearsal|record --out <出力先> [--only 1,3]
import { parseArgs } from "node:util";
import { mkdirSync, readdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { openContext } from "./lib/browser.mjs";
import { createRecorder, StopRehearsal } from "./lib/recorder.mjs";
import { titleCard, toMp4, concat, contactSheet, duration } from "./lib/ffmpeg.mjs";

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  mode: { type: "string", default: "rehearsal" }, out: { type: "string" }, only: { type: "string" },
} });
const [scenarioPath] = positionals;
if (!scenarioPath || !values.out || !["rehearsal", "record"].includes(values.mode)) {
  console.error("使い方: node run.mjs <scenario.mjs> --mode rehearsal|record --out <出力先> [--only 1,3]");
  process.exit(2);
}
const scenario = (await import(pathToFileURL(resolve(scenarioPath)).href)).default;
const out = resolve(values.out);
const only = values.only?.split(",").map((s) => s.trim());
const sections = scenario.sections
  .map((s, i) => ({ ...s, no: String(i + 1).padStart(2, "0") }))
  .filter((s) => !only || only.includes(String(Number(s.no))) || only.includes(s.no));
mkdirSync(out, { recursive: true });

const reportPath = join(out, "report.json");
const report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, "utf8")) : { mutations: [], sections: {} };
const results = [];

for (const section of sections) {
  const chapter = section.title;
  const videoDir = values.mode === "record" ? join(out, "raw", section.no) : null;
  const context = await openContext({ profile: scenario.profile, videoDir, viewport: scenario.viewport });
  const r = await createRecorder({ context, mode: values.mode, chapter, report });
  let status = "ok";
  let detail = "";
  try {
    await section.run(r);
    await r.clear();
    if (values.mode === "record") await r.wait(600);
  } catch (e) {
    if (e instanceof StopRehearsal) { status = "stopped"; detail = e.what; }
    else { status = "error"; detail = `${e.message.split("\n")[0]}（${r.page.url()}）`; }
    const shotDir = join(out, values.mode);
    mkdirSync(shotDir, { recursive: true });
    await r.page.screenshot({ path: join(shotDir, `${section.no}-${status}.png`) }).catch(() => {});
  }
  if (values.mode === "rehearsal" && status === "ok") {
    mkdirSync(join(out, "rehearsal"), { recursive: true });
    await r.page.screenshot({ path: join(out, "rehearsal", `${section.no}-end.png`) }).catch(() => {});
  }
  const video = r.page.video();
  await context.close();
  results.push({ no: section.no, title: section.title, status, detail, raw: video ? await video.path() : null });
  console.log(`${section.no} ${section.title}: ${status}${detail ? ` - ${detail}` : ""}`);
}

if (values.mode === "record") {
  mkdirSync(join(out, "check"), { recursive: true });
  mkdirSync(join(out, ".parts"), { recursive: true });
  for (const res of results.filter((x) => x.raw)) {
    const card = join(out, ".parts", `${res.no}-card.mp4`);
    const body = join(out, ".parts", `${res.no}-body.mp4`);
    titleCard(res.title, card);
    toMp4(res.raw, body);
    res.file = join(out, `${res.no}_${res.title.replace(/[\\/:*?"<>|]/g, "_")}.mp4`);
    concat([card, body], res.file);
    contactSheet(body, join(out, "check", `${res.no}.png`));
    report.sections[res.no] = { title: res.title, file: res.file, seconds: Math.round(duration(res.file)), status: res.status, detail: res.detail };
  }
  const all = Object.keys(report.sections).sort().map((no) => report.sections[no].file).filter(existsSync);
  if (all.length) concat(all, join(out, "all.mp4"));
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`出力: ${out}`);
  for (const f of readdirSync(out).filter((f) => f.endsWith(".mp4"))) console.log(`  ${f}`);
  console.log(`確認用の静止画: ${join(out, "check")}`);
  console.log(`データを変えた操作: ${report.mutations.length} 件（${reportPath}）`);
}
if (results.some((x) => x.status === "error")) process.exit(1);
