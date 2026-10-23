// setup.sh で入れた Playwright を読み込み、ログイン状態を残すプロファイルで Chrome を開く
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

export const HOME = process.env.DEMO_VIDEO_HOME ?? join(homedir(), ".cache", "demo-video");
export const VIEWPORT = { width: 1280, height: 800 };

export function loadPlaywright() {
  const require = createRequire(join(HOME, "node_modules", "_"));
  try {
    return require("playwright");
  } catch {
    throw new Error(`Playwright がありません。先に setup.sh を流してください（${HOME}）`);
  }
}

export function profileDir(name) {
  const dir = join(HOME, "profiles", name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

// headless の Chrome は window-size と screen を合わせないと、録画の下が灰色で切れる
export async function openContext({ profile, headless = true, videoDir = null, viewport = VIEWPORT }) {
  const { chromium } = loadPlaywright();
  return chromium.launchPersistentContext(profileDir(profile), {
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
}
