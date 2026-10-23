// シナリオの例。セクションごとに run を書き、字幕は r.say、データを変える操作の直前に r.mutation を置く
export default {
  name: "example",
  profile: "example",
  sections: [
    {
      title: "1 トップページ",
      async run(r) {
        await r.goto("https://example.com/");
        await r.say("Example Domain のトップページです", "字幕は画面の下に出ます", { ms: 3000 });
        await r.point(r.page.getByRole("paragraph").first());
        await r.say("最初の段落を指しています", "", { ms: 2000 });
      },
    },
    {
      title: "2 リンク先",
      async run(r) {
        await r.goto("https://example.com/");
        const link = r.page.getByRole("link").first();
        await r.say("リンクを押します", "", { ms: 1500 });
        await r.mutation("リンク先へ移動する（例: ここでデータを変える操作があるとき）");
        await r.click(link);
        await r.settle();
        await r.say("リンク先に移りました", "上に出した字幕の例です", { ms: 3000, top: true });
      },
    },
  ],
};
