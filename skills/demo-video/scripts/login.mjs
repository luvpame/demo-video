// 自動化できないログイン（Google など）を手でしてもらい、プロファイルに残す
// 使い方: node login.mjs --profile <名前> --url <ログイン画面> [--url ...]
import { parseArgs } from "node:util";
import { openContext, saveSessionCookies } from "./lib/browser.mjs";

const { values } = parseArgs({ options: { profile: { type: "string" }, url: { type: "string", multiple: true }, minutes: { type: "string", default: "20" } } });
if (!values.profile || !values.url?.length) {
  console.error("使い方: node login.mjs --profile <名前> --url <URL> [--url ...]");
  process.exit(2);
}
const context = await openContext({ profile: values.profile, headless: false });
const first = context.pages()[0] ?? (await context.newPage());
for (const [i, url] of values.url.entries()) {
  const page = i === 0 ? first : await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 }).catch((e) => console.log(`開けません: ${url} ${e.message.split("\n")[0]}`));
}
console.log("ログインが終わったら、窓を閉じてください。");
// 窓を閉じられた後は Cookie を読めないので、開いている間に書き出しておく
const saver = setInterval(() => saveSessionCookies(context, values.profile).catch(() => {}), 2000);
const closed = new Promise((resolve) => context.on("close", resolve));
const timeout = new Promise((resolve) => setTimeout(resolve, Number(values.minutes) * 60000));
await Promise.race([closed, timeout]);
clearInterval(saver);
for (const p of context.pages()) console.log(`最後の画面: ${p.url()}`);
await context.close().catch(() => {});
console.log(`保存しました（プロファイル: ${values.profile}）`);
