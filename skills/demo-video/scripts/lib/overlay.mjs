// 画面に字幕とマウスの位置を描く。ページの CSP で innerHTML が効かないことがあるので DOM で組み立てる
export function installOverlay() {
  const install = () => {
    if (document.getElementById("__demo_cap")) return;
    const style = document.createElement("style");
    style.textContent = `
      #__demo_cap{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);width:min(1120px,calc(100% - 60px));
        background:rgba(14,30,36,.88);color:#fff;font:600 22px/1.5 "Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic UI","Meiryo","Noto Sans JP",sans-serif;
        padding:12px 22px 14px;border-radius:10px;z-index:2147483647;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.25);pointer-events:none;letter-spacing:.02em}
      #__demo_cap[hidden]{display:none}
      #__demo_cap.top{top:70px;bottom:auto}
      #__demo_cap .chap{display:inline-block;font-size:13px;font-weight:700;border-radius:4px;padding:2px 8px;margin-bottom:6px;letter-spacing:.04em}
      #__demo_cap .sub{display:block;font-size:16px;font-weight:400;opacity:.9;margin-top:2px}
      #__demo_cur{position:fixed;width:22px;height:22px;border-radius:50%;background:rgba(242,176,40,.55);border:2px solid #E89A00;
        z-index:2147483646;pointer-events:none;transform:translate(-50%,-50%);left:-100px;top:-100px;transition:width .12s,height .12s}
      #__demo_cur.down{width:14px;height:14px;background:rgba(232,154,0,.9)}`;
    document.documentElement.appendChild(style);
    for (const id of ["__demo_cap", "__demo_cur"]) {
      const el = document.createElement("div");
      el.id = id;
      document.documentElement.appendChild(el);
    }
    const cur = document.getElementById("__demo_cur");
    addEventListener("mousemove", (e) => { cur.style.left = `${e.clientX}px`; cur.style.top = `${e.clientY}px`; }, true);
    addEventListener("mousedown", () => cur.classList.add("down"), true);
    addEventListener("mouseup", () => cur.classList.remove("down"), true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", install);
  else install();
}

export function renderCaption({ cap, sub, chap, top, theme }) {
  const c = document.getElementById("__demo_cap");
  if (!c) return;
  c.replaceChildren();
  c.hidden = !cap && !sub;
  c.classList.toggle("top", !!top);
  if (chap) {
    const t = document.createElement("span");
    t.className = "chap";
    t.textContent = chap;
    t.style.background = theme.bg;
    t.style.color = theme.fg;
    c.append(t, document.createElement("br"));
  }
  if (cap) c.append(document.createTextNode(cap));
  if (sub) {
    const s = document.createElement("span");
    s.className = "sub";
    s.textContent = sub;
    c.append(s);
  }
}
