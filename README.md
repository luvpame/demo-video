<h1 align="center">demo-video</h1>

<p align="center">
  <em>「〇〇のデモ動画を作って」と頼むと、Claude が Web アプリを操作して字幕付きの mp4 を撮ってきます。</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-plugin-D97757?style=flat-square&logo=claude&logoColor=white" alt="Claude Code plugin">
  <img src="https://img.shields.io/badge/Playwright-Chrome-2EAD33?style=flat-square&logo=playwright&logoColor=white" alt="Playwright">
  <img src="https://img.shields.io/badge/ffmpeg-drawtext-007808?style=flat-square&logo=ffmpeg&logoColor=white" alt="ffmpeg">
  <img src="https://img.shields.io/github/license/luvpame/demo-video?style=flat-square" alt="MIT license">
</p>

---

画面録画を撮り、字幕を足し、撮り直す。デモ動画づくりのこの手間を Claude Code に任せるためのプラグインです。Claude が画面を下見してシナリオを書き、確認をとってから Playwright で操作して録画し、ffmpeg で字幕を焼き込みます。

## できること

- **2段の字幕**。見せている物（上段）と、その理由（下段）を画面に焼き込みます。章の名前とマウスの位置も描きます。
- **セクションごとの mp4**。セクションごとに頭へ短いタイトル画面を付け、全部をつないだ `all.mp4` も作ります。
- **データを壊さないリハーサル**。録画の前にシナリオを見せて確かめ、投稿や保存などデータを変える操作の手前まで通しで動かします。
- **手でしかできないログインにも対応**。Google・SSO・多要素認証は開いた Chrome で一度だけ手でログインし、その状態を撮り直しでも使います。
- **撮った後の確認**。各セクションから静止画を等間隔に抜いた一覧を作り、字幕が要素を隠していないか、画面とずれていないかを Claude が見て撮り直します。

## 入れ方

```
/plugin marketplace add luvpame/demo-video
/plugin install demo-video@demo-video
```

「〇〇のデモ動画を作って」と頼むか、`/demo-video` で呼び出します。

## 流れ

| | Claude がすること | あなたがすること |
|---|---|---|
| 1 | 道具をそろえ、録画する URL に届くか確かめる | 足りない道具があれば入れる |
| 2 | ログインのしかたを選ぶ | 必要なら Chrome で手でログインする |
| 3 | 画面を下見して、ボタンや入力欄を調べる | |
| 4 | シナリオと字幕を書く | |
| 5 | セクション・字幕・データを変える操作の一覧を見せる | **読んで OK を出す** |
| 6 | データを変える手前までリハーサルする | |
| 7 | 録画する | |
| 8 | 静止画の一覧を見て、ずれたセクションだけ撮り直す | |

OK を出すまで、Claude はリハーサルも録画も流しません。撮り直しでデータを変える操作がもう一度走るときも、先に確かめます。

## できあがるもの

```
~/Movies/claude-demos/<名前>-<YYYYMMDD>/
├── scenario.mjs        撮り直しに使うシナリオ
├── 01_<タイトル>.mp4   セクションごとの動画
├── 02_<タイトル>.mp4
├── all.mp4             全セクションをつないだ動画
├── check/01.png        確認用の静止画の一覧（12 枚）
└── report.json         長さと、録画で変えたデータの一覧
```

録画で変えたデータは `report.json` に残すだけで、消しはしません。

## 要るもの

- Node.js
- Google Chrome（Playwright のブラウザは別に入れません）
- ffmpeg（`drawtext` と `libx264` が使えるもの。`brew install ffmpeg` など）
- 日本語フォント（macOS はヒラギノ、Linux は `fc-match` で探します）

Playwright は初回に `~/.cache/demo-video/` へ入れます（`DEMO_VIDEO_HOME` で変えられます）。ログイン状態も同じ場所の `profiles/` に残ります。

## シナリオ

Claude が書くシナリオは、セクションごとに操作と字幕を並べた ES モジュールです。手で直すこともできます。

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

`r.mutation` はデータを変える操作の目印です。リハーサルはここで止まり、録画では `report.json` に載ります。使える操作の一覧は [`reference.md`](skills/demo-video/reference.md)、動く例は [`example-scenario.mjs`](skills/demo-video/example-scenario.mjs) にあります。

## 手で動かす

Claude を通さずにスクリプトを直接流すこともできます。

```sh
S=skills/demo-video/scripts
bash $S/setup.sh                                                       # 道具をそろえる
node $S/login.mjs --profile my-app --url https://example.com/login     # 手でログインする
node $S/probe.mjs --profile my-app https://example.com/                # 画面の作りを見る
node $S/run.mjs scenario.mjs --mode rehearsal --out ~/Movies/claude-demos/my-demo
node $S/run.mjs scenario.mjs --mode record --out ~/Movies/claude-demos/my-demo
node $S/run.mjs scenario.mjs --mode record --out ~/Movies/claude-demos/my-demo --only 2   # 2 だけ撮り直す
```

## License

MIT
