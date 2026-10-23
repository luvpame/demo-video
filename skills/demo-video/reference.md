# シナリオの書き方

## 形

```js
export default {
  name: "sr-demo",          // 動画の名前（出力先の名前にも使う）
  profile: "my-app",        // login.mjs で使ったプロファイル名
  viewport: { width: 1280, height: 800 }, // 省略可
  sections: [
    { title: "1 記事の投稿", async run(r) { /* 操作 */ } },
  ],
};
```

- `title` はセクションの頭のタイトル画面（1.5 秒）と、字幕の章の名前に使う。
- セクションごとに新しい窓で録画する。前のセクションの画面を引き継がないので、各セクションは `r.goto` から始める。
- ファイル名は `sections` の順の番号（`01`, `02`, …）になる。`--only 2,3` で一部だけ流せる。

## `r` の操作

| 操作 | すること |
|---|---|
| `r.goto(url, { keepCaption })` | 字幕を消して移る。前の字幕を残すときは `keepCaption: true` |
| `r.say(cap, sub, { ms, top })` | 字幕を出し、録画では `ms`（既定 2800）だけ待つ。`top: true` で画面の上に出す |
| `r.clear()` | 字幕を消す |
| `r.click(loc)` / `r.check(loc)` | 要素を画面の中ほどに入れ、マウスを動かしてから押す |
| `r.type(loc, text, delay)` | 押してから1文字ずつ打つ（見せたい入力） |
| `r.fill(loc, text)` | 一度に入れる（長い文） |
| `r.point(loc)` | マウスを要素に動かすだけ |
| `r.scrollTo(loc, { block })` | 要素までなめらかにスクロールする |
| `r.scrollBy(dy, ms)` | ページ全体を `dy` だけスクロールする |
| `r.settle()` | 通信が落ち着くまで待つ |
| `r.mutation(what)` | データを変える操作の直前に置く。リハーサルはここで止まり、録画では `report.json` に載る |
| `r.page` / `r.context` | Playwright の Page と BrowserContext。API で ID を探すときは `r.page.request.get(...)` |

## 書くときの注意

- **字幕の切り替え**: `say` は次の `say` まで出続ける。画面が移る操作の前に、次の場面を言う字幕（「確認画面に進みます」）を出すと、字幕と画面がずれない。
- **中の枠がスクロールする画面**（管理画面など）では、`r.scrollBy` は効かない。`r.scrollTo` を使う。
- **前の画面の DOM が隠れて残るアプリ**では、同じロケータが2つ当たる。`.filter({ visible: true })` で絞る。
- **選択肢が部分一致で重なる**（「審査中」と「再審査中」など）ときは `exact: true` を付ける。
- **一覧の初期の絞り込み**で、操作した後のデータが一覧から消えることがある。撮り直しのたびに、使うデータが残っているか確かめる。
- **パスワード**は `process.env` から読み、字幕や `r.log` に出さない。
