<h1 align="center">demo-video</h1>

<p align="center">
  <em>「〇〇のデモ動画を作って」と頼むと、Claude が Web アプリを操作して字幕付きの mp4 を作ります。</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-plugin-D97757?style=flat-square&logo=claude&logoColor=white" alt="Claude Code plugin">
  <img src="https://img.shields.io/badge/Playwright-Chrome-2EAD33?style=flat-square&logo=playwright&logoColor=white" alt="Playwright">
  <img src="https://img.shields.io/badge/ffmpeg-drawtext-007808?style=flat-square&logo=ffmpeg&logoColor=white" alt="ffmpeg">
  <img src="https://img.shields.io/github/license/luvpame/demo-video?style=flat-square" alt="MIT license">
</p>

## Features

- 見せている物とその理由の2段の字幕、章の名前、マウスの位置を焼き込んで録画します。
- セクションごとの mp4 に短いタイトル画面を付け、全部をつないだ `all.mp4` も作ります。
- 録画の前にシナリオを見せて確かめ、データを変える操作の手前までリハーサルします。
- Google・SSO・多要素認証のログインは、開いた Chrome で一度だけ手で行い、その状態を撮り直しでも使います。
- 字幕が画面とずれていないか、要素を隠していないかを静止画の一覧で確かめ、合わないセクションだけ撮り直します。

## Installation

```
/plugin marketplace add luvpame/demo-video
/plugin install demo-video@demo-video
```

「〇〇のデモ動画を作って」と頼むか、`/demo-video` で呼び出します。

## How it works

| | Claude | あなた |
|---|---|---|
| 1 | 道具をそろえ、URL に届くか確かめる | 足りない道具を入れる |
| 2 | ログインのしかたを選ぶ | 必要なら手でログインする |
| 3 | 画面を下見してシナリオと字幕を書く | |
| 4 | セクション・字幕・データを変える操作を見せる | **OK を出す** |
| 5 | リハーサルして録画する | |
| 6 | 静止画の一覧を見て撮り直す | |

OK を出すまで、リハーサルも録画も流しません。

## Output

```
~/Movies/claude-demos/<名前>-<YYYYMMDD>/
├── scenario.mjs        撮り直しに使うシナリオ
├── 01_<タイトル>.mp4   セクションごとの動画
├── all.mp4             全セクションをつないだ動画
├── check/01.png        確認用の静止画の一覧
└── report.json         長さと、録画で変えたデータの一覧
```

## Requirements

- Node.js
- Google Chrome
- ffmpeg（`drawtext` と `libx264` が使えるもの）
- 日本語フォント

Playwright は初回に `~/.cache/demo-video/` へ入れ、ログイン状態も同じ場所に残します（`DEMO_VIDEO_HOME` で変えられます）。

## Scenarios

シナリオはセクションごとに操作と字幕を並べた ES モジュールで、手でも直せます。

```js
export default {
  name: "my-demo",
  profile: "my-app",
  sections: [
    {
      title: "1 記事の投稿",
      async run(r) {
        await r.goto("https://example.com/posts/new");
        await r.say("記事を書きます", "下書きは自動で保存されます");
        await r.type(r.page.getByLabel("タイトル"), "はじめての記事");
        await r.mutation("記事を投稿する");
        await r.click(r.page.getByRole("button", { name: "投稿" }));
      },
    },
  ],
};
```

`r.mutation` はデータを変える操作の目印で、リハーサルはここで止まります。操作の一覧は [`reference.md`](skills/demo-video/reference.md) にあります。

## Manual usage

```sh
S=skills/demo-video/scripts
bash $S/setup.sh
node $S/login.mjs --profile my-app --url https://example.com/login
node $S/run.mjs scenario.mjs --mode rehearsal --out ~/Movies/claude-demos/my-demo
node $S/run.mjs scenario.mjs --mode record --out ~/Movies/claude-demos/my-demo   # --only 2 で一部だけ撮り直す
```

## License

MIT
