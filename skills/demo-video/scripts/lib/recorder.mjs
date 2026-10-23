// シナリオから使う操作。字幕・マウスの移動・スクロールを、見る人に分かる速さで行う
import { installOverlay, renderCaption } from "./overlay.mjs";

export class StopRehearsal extends Error {
  constructor(what) { super(`リハーサルはここで止めます: ${what}`); this.what = what; }
}

export async function createRecorder({ context, mode, chapter, report, theme }) {
  await context.addInitScript(installOverlay);
  const page = context.pages()[0] ?? (await context.newPage());
  const state = { cap: "", sub: "", chap: chapter, top: false, theme };
  const apply = () => page.evaluate(renderCaption, state).catch(() => {});
  page.on("domcontentloaded", () => setTimeout(apply, 50));

  const settle = () => page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  const visibleBox = async (locator) => {
    await locator.waitFor({ state: "visible", timeout: 30000 });
    const { top, bottom } = await locator.evaluate((el) => el.getBoundingClientRect());
    const limit = (await page.evaluate(() => innerHeight)) - 200;
    if (top < 130 || bottom > limit) {
      await locator.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
      await page.waitForTimeout(800);
    }
    return locator.boundingBox();
  };

  const r = {
    page, context, mode,
    wait: (ms) => page.waitForTimeout(ms),
    // 字幕を出して ms だけ見せる。top: true で画面の上に出す（下の要素を隠すとき）
    async say(cap, sub = "", { ms = 2800, top = false } = {}) {
      Object.assign(state, { cap, sub, top });
      await apply();
      if (mode === "record") await page.waitForTimeout(ms);
    },
    async clear() { Object.assign(state, { cap: "", sub: "" }); await apply(); },
    // 画面を移るときは前の字幕を消す。続けて見せたいときは keepCaption: true
    async goto(url, { keepCaption = false } = {}) {
      if (!keepCaption) await r.clear();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await settle();
      await apply();
    },
    settle,
    // ページ全体でなく中の枠がスクロールする画面でも効くよう scrollIntoView を使う
    async scrollTo(locator, { block = "center" } = {}) {
      await locator.evaluate((el, b) => el.scrollIntoView({ behavior: "smooth", block: b }), block);
      await page.waitForTimeout(1000);
    },
    async scrollBy(dy, ms = 900) {
      await page.evaluate((d) => scrollBy({ top: d, behavior: "smooth" }), dy);
      await page.waitForTimeout(ms);
    },
    async point(locator) {
      const b = await visibleBox(locator);
      if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 });
      await page.waitForTimeout(250);
    },
    async click(locator) { await r.point(locator); await locator.click(); await page.waitForTimeout(400); },
    async check(locator) { await r.point(locator); await locator.check(); await page.waitForTimeout(250); },
    async fill(locator, text) { await r.point(locator); await locator.fill(text); },
    async type(locator, text, delay = 45) { await r.click(locator); await locator.pressSequentially(text, { delay }); },
    // データを変える操作の直前に呼ぶ。リハーサルはここで止まり、録画では報告に載る
    async mutation(what) {
      if (mode === "rehearsal") throw new StopRehearsal(what);
      report.mutations.push({ chapter, what, at: new Date().toISOString(), url: page.url() });
    },
    log: (...a) => console.log(`[${chapter}]`, ...a),
  };
  return r;
}
