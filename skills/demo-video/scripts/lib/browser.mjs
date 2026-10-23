// setup で入れた Playwright を読み込み、ログイン状態を残すプロファイルで Chrome を開く
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";

export const HOME = process.env.DEMO_VIDEO_HOME ?? join(homedir(), ".cache", "demo-video");
export const VIEWPORT = { width: 1280, height: 800 };

export function loadRuntime(name) {
  const require = createRequire(join(HOME, "node_modules", "_"));
  try {
    return require(name);
  } catch {
    throw new Error(`${name} がありません。先に setup.sh（Windows は setup.ps1）を流してください（${HOME}）`);
  }
}

export function profileDir(name) {
  const dir = join(HOME, "profiles", name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

// headless の Chrome は window-size と screen を合わせないと、録画の下が灰色で切れる
// Chrome は窓を閉じるとセッション Cookie を捨てる。ログインをセクションや撮り直しをまたいで残すため、書き出して次に開くときに戻す
const cookieFile = (profile) => join(profileDir(profile), "session-cookies.json");
export async function saveSessionCookies(context, profile) {
  const cookies = (await context.cookies()).filter((c) => c.expires === -1);
  writeFileSync(cookieFile(profile), JSON.stringify(cookies));
}

export async function openContext({ profile, headless = true, videoDir = null, viewport = VIEWPORT }) {
  const { chromium } = loadRuntime("playwright");
  const context = await chromium.launchPersistentContext(profileDir(profile), {
    channel: "chrome",
    headless,
    viewport: headless ? viewport : null,
    screen: viewport,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      "--disable-blink-features=AutomationControlled",
      `--window-size=${viewport.width},${headless ? viewport.height : viewport.height + 100}`,
    ],
    ...(videoDir ? { recordVideo: { dir: videoDir, size: viewport } } : {}),
  });
  if (existsSync(cookieFile(profile))) await context.addCookies(JSON.parse(readFileSync(cookieFile(profile), "utf8")));
  const close = context.close.bind(context);
  context.close = async (options) => {
    await saveSessionCookies(context, profile).catch(() => {});
    return close(options);
  };
  return context;
}
