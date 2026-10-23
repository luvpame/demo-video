# demo-video

Web アプリを Playwright で実際に操作し、字幕を焼き込んだデモ動画をセクションごとに作る Claude Code プラグインです。

- 字幕（見せている物と、その理由の2段）・章の名前・マウスの位置を画面に描いて録画します。
- セクションごとに mp4 を作り、頭に短いタイトル画面を付け、1本につないだ版も作ります。
- 録画の前にシナリオを見せて確かめ、データを変える操作の手前までリハーサルしてから録画します。
- Google などの自動化できないログインは、開いた Chrome で一度だけ手でログインし、その状態を残します。

## 入れ方

```
/plugin marketplace add luvpame/demo-video
/plugin install demo-video@demo-video
```

「〇〇のデモ動画を作って」と頼むか、`/demo-video` で呼び出します。

## 要るもの

- Node.js
- Google Chrome（Playwright のブラウザは別に入れません）
- ffmpeg（`drawtext` と `libx264` が使えるもの。`brew install ffmpeg` など）
- 日本語フォント（macOS はヒラギノ、Linux は `fc-match` で探します）

Playwright は初回に `~/.cache/demo-video/` へ入れます（`DEMO_VIDEO_HOME` で変えられます）。ログイン状態も同じ場所の `profiles/` に残ります。

## 手動で使う

```sh
S=skills/demo-video/scripts
bash $S/setup.sh
node $S/login.mjs --profile my-app --url https://example.com/login
node $S/run.mjs scenario.mjs --mode rehearsal --out ~/Movies/claude-demos/my-demo
node $S/run.mjs scenario.mjs --mode record --out ~/Movies/claude-demos/my-demo
```

シナリオの書き方は [`skills/demo-video/reference.md`](skills/demo-video/reference.md) にあります。

## License

MIT
