// 画面の作り（アクセシビリティツリー）を出す。シナリオのロケータを決めるために使う
// 使い方: node probe.mjs --profile <名前> <URL> [<URL> ...] [--chars 6000]
import { parseArgs } from "node:util";
import { openContext } from "./lib/browser.mjs";

const { values, positionals } = parseArgs({ allowPositionals: true, options: { profile: { type: "string", default: "default" }, chars: { type: "string", default: "6000" }, screenshot: { type: "string" } } });
const context = await openContext({ profile: values.profile });
const page = context.pages()[0] ?? (await context.newPage());
for (const [i, url] of positionals.entries()) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }).catch((e) => console.log(`goto: ${e.message.split("\n")[0]}`));
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  console.log(`==== ${page.url()}`);
  console.log((await page.locator("body").ariaSnapshot()).slice(0, Number(values.chars)));
  if (values.screenshot) await page.screenshot({ path: `${values.screenshot}-${i}.png`, fullPage: true });
}
await context.close();
