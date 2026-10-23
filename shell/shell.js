// 도파 도구함 공통 편집 화면 (10/23) — 도구 페이지가 <body class="sh" data-tool="board"> 로 쓰면
//  왼쪽 도구 목록 · 나이트/라이트 · 편집 탭 · 팝업(다운로드·처음으로) · 알림을 채워 준다.
//  각 도구의 그림 그리기·움짤 만들기 코드는 그대로 두고, 그 코드가 찾는 id 만 맞춰 둔다.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const IMG = "https://qytikqvngyvrszjygbbn.supabase.co/storage/v1/object/public/studio-images/";
  const TOOLS = [
    { k: "diary", t: "비밀 다이어리", img: IMG + "link/1792141936943-wtl5ut.gif" },
    { k: "viewfinder", t: "디카 뷰파인더", img: IMG + "prompt/1791382649485-bo0pa0.gif" },
    { k: "override", t: "시스템 오버라이드", img: "/override/thumb.jpg" },
    { k: "board", t: "수사 보드", img: "/board/thumb.jpg" },
    { k: "movie", t: "영화 감상", img: "/movie/thumb.jpg" },
  ];
  const me = document.body.dataset.tool;
  const LS_MODE = "dopa_tools_mode";

  // 왼쪽 목록
  const list = $("#shList");
  if (list) list.innerHTML = TOOLS.map((x) => `<a class="sh-tool${x.k === me ? " on" : ""}" href="/${x.k}/"><img src="${x.img}" alt="" loading="lazy"><span>${x.t}</span></a>`).join("");

  // 나이트 / 라이트
  function setMode(m) {
    document.documentElement.dataset.mode = m;
    const lab = $("#shModeLab"); if (lab) lab.textContent = m === "night" ? "라이트" : "나이트";
    const meta = $('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", m === "night" ? "#121314" : "#F7F7F8");
    try { localStorage.setItem(LS_MODE, m); } catch (e) {}
  }
  let mode = "night"; try { mode = localStorage.getItem(LS_MODE) || "night"; } catch (e) {}
  setMode(mode);

  // 편집 탭
  const tabs = $$(".sh-tabs [data-tab]");
  function showTab(k) {
    tabs.forEach((b) => b.classList.toggle("on", b.dataset.tab === k));
    $$(".sh-pane").forEach((p) => (p.hidden = p.dataset.pane !== k));
  }
  tabs.forEach((b) => b.addEventListener("click", () => { showTab(b.dataset.tab); if (matchMedia("(max-width: 760px)").matches) $(".sh-tabs").scrollIntoView({ block: "start", behavior: "smooth" }); }));
  if (tabs[0]) showTab(tabs[0].dataset.tab);

  // 팝업
  function open(id) { $$(".sh-pop").forEach((p) => (p.hidden = p.id !== id)); }
  function close() { $$(".sh-pop").forEach((p) => (p.hidden = true)); }
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => open(b.dataset.open)));
  $$(".sh-pop").forEach((p) => p.addEventListener("click", (e) => { if (e.target === p || e.target.closest(".sh-x,[data-close]")) close(); }));
  addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

  // 알림
  let tt = 0;
  function toast(m) { let t = $(".sh-toast"); if (!t) { t = document.createElement("div"); t.className = "sh-toast"; document.body.appendChild(t); } t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 2400); }

  // 버튼 줄
  const rail = $(".sh-rail");
  if (rail) rail.addEventListener("click", (e) => { const b = e.target.closest("[data-act]"); if (b && b.dataset.act === "mode") setMode(document.documentElement.dataset.mode === "night" ? "light" : "night"); });

  // 편집 패널 접기 (PC) — 오른쪽 '편집' 버튼과 패널 위 접기 버튼
  const app = $(".sh-app"), LS_PANEL = "dopa_tools_panel";
  function setPanel(on) { if (!app) return; app.classList.toggle("panel-off", !on); const b = $('[data-act="panel"]'); if (b) b.classList.toggle("on", on); try { localStorage.setItem(LS_PANEL, on ? "1" : "0"); } catch (e) {} dispatchEvent(new Event("resize")); }
  let panelOn = true; try { panelOn = localStorage.getItem(LS_PANEL) !== "0"; } catch (e) {}
  const panel = $(".sh-panel");
  if (panel) { const f = document.createElement("button"); f.className = "sh-fold"; f.title = "편집 창 닫기"; f.setAttribute("aria-label", "편집 창 닫기"); f.innerHTML = '<svg class="i" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>'; f.onclick = () => setPanel(false); panel.appendChild(f); }
  if (rail) rail.addEventListener("click", (e) => { const b = e.target.closest('[data-act="panel"]'); if (b) setPanel(app.classList.contains("panel-off")); });
  setPanel(panelOn);

  // 처음으로: 위치만 / 전부
  const rsPos = $("#shResetPos"), rsAll = $("#shResetAll");
  if (rsPos) rsPos.addEventListener("click", () => { const b = document.getElementById("btnResetPositions"); if (b) b.click(); close(); toast("위치를 처음대로 되돌렸어요"); });
  if (rsAll) rsAll.addEventListener("click", () => { const y = document.getElementById("resetYes"); if (y) { y.click(); close(); toast("처음 상태로 되돌렸어요"); } else location.reload(); });   // 다이어리는 기기에 저장돼 있어서 새로고침으로는 안 지워진다

  // PNG 한 장 (캔버스 도구) — 지금 보이는 그대로
  const png = $("#shPng");
  if (png) png.addEventListener("click", () => {
    const cv = document.getElementById("previewCanvas"); if (!cv) return;
    const url = cv.toDataURL("image/png");
    const wrap = document.getElementById("previewMediaWrapper"), dl = document.getElementById("btnDownload"), res = document.getElementById("resultArea");
    if (wrap) wrap.innerHTML = `<img src="${url}" alt="">`;
    if (dl) { dl.href = url; dl.download = `dopa_${me}.png`; }
    if (res) res.classList.remove("hidden");
  });

  // 폰: 위 미리보기가 붙어 있는 높이만큼 탭을 아래에 붙인다
  const center = $(".sh-center");
  function stickyH() { if (center) document.documentElement.style.setProperty("--sticky-h", center.getBoundingClientRect().height + "px"); }
  addEventListener("resize", stickyH); if (window.ResizeObserver && center) new ResizeObserver(stickyH).observe(center); stickyH();

  // 크게 보기: 화면 가득 (닫기 = × · 바깥 누르기 · Esc)
  const cvs = $(".sh-canvas");
  function zoom(on) {
    document.body.classList.toggle("sh-zoomed", on);
    let bg = $(".sh-zoombg"), x = $(".sh-zoomx");
    if (on && !bg) { bg = document.createElement("div"); bg.className = "sh-zoombg"; bg.onclick = () => zoom(false); document.body.appendChild(bg); x = document.createElement("button"); x.className = "sh-zoomx"; x.setAttribute("aria-label", "크게 보기 닫기"); x.textContent = "×"; x.onclick = () => zoom(false); document.body.appendChild(x); }
    if (bg) bg.hidden = !on; if (x) x.hidden = !on;
    dispatchEvent(new Event("resize"));
  }
  if (cvs) {
    let zb = $("#shZoom");
    if (!zb) { zb = document.createElement("button"); zb.id = "shZoom"; zb.type = "button"; zb.className = "sh-btn sm sh-zoombtn"; zb.innerHTML = '<svg class="i" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>크게 보기'; cvs.after(zb); }
    zb.addEventListener("click", () => zoom(true));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && document.body.classList.contains("sh-zoomed")) zoom(false); });
  }

  // 색판: 브라우저 기본 색판(RGB만 보임) 대신 우리 색판 — 색 면 · 색상 막대 · 색 코드 칸 (10/23 자기야 "색판에 코드 입력")
  const h2r = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const r2h = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
  const hsv2rgb = (h, s, v) => { const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return [f(5) * 255, f(3) * 255, f(1) * 255]; };
  const rgb2hsv = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, mx ? d / mx : 0, mx]; };
  const hexOk = (v) => /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.test(v.trim());
  const norm = (v) => { let h = v.trim().replace(/^#/, ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); return "#" + h.toUpperCase(); };
  let pk = null;
  function picker() {
    if (pk) return pk;
    const el = document.createElement("div"); el.className = "sh-cpk"; el.hidden = true;
    el.innerHTML = `<div class="sh-cpk-sv"><div class="sh-cpk-dot"></div></div><input type="range" class="sh-cpk-hue" min="0" max="360" step="1" aria-label="색상">
      <div class="sh-cpk-row"><span class="sh-cpk-sw"></span><label class="sh-cpk-code">색 코드<input type="text" maxlength="7" spellcheck="false"></label><button type="button" class="sh-btn sm main sh-cpk-ok">확인</button></div>`;
    document.body.appendChild(el);
    const sv = el.querySelector(".sh-cpk-sv"), dot = el.querySelector(".sh-cpk-dot"), hue = el.querySelector(".sh-cpk-hue"), code = el.querySelector("input[type=text]"), sw = el.querySelector(".sh-cpk-sw");
    pk = { el, target: null, h: 0, s: 1, v: 1 };
    const paint = (fromCode) => {
      const hex = r2h(...hsv2rgb(pk.h, pk.s, pk.v));
      sv.style.background = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${pk.h},100%,50%))`;
      dot.style.left = pk.s * 100 + "%"; dot.style.top = (1 - pk.v) * 100 + "%"; hue.value = pk.h; sw.style.background = hex;
      if (!fromCode) code.value = hex; code.classList.remove("bad");
      if (pk.target && pk.target.value.toUpperCase() !== hex) { pk.target.value = hex; pk.target.dispatchEvent(new Event("input", { bubbles: true })); pk.target.dispatchEvent(new Event("change", { bubbles: true })); }
    };
    pk.load = (hex) => { [pk.h, pk.s, pk.v] = rgb2hsv(...h2r(norm(hex))); paint(); };
    const svAt = (e) => { const r = sv.getBoundingClientRect(); pk.s = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); pk.v = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); paint(); };
    sv.addEventListener("pointerdown", (e) => { sv.setPointerCapture(e.pointerId); svAt(e); sv.onpointermove = svAt; });
    sv.addEventListener("pointerup", () => (sv.onpointermove = null));
    hue.addEventListener("input", () => { pk.h = Number(hue.value); paint(); });
    code.addEventListener("input", () => { if (hexOk(code.value)) { [pk.h, pk.s, pk.v] = rgb2hsv(...h2r(norm(code.value))); paint(true); } else code.classList.add("bad"); });
    code.addEventListener("keydown", (e) => { if (e.key === "Enter") hidePk(); });
    el.querySelector(".sh-cpk-ok").onclick = hidePk;
    document.addEventListener("pointerdown", (e) => { const row = pk.target && (pk.target.closest(".sh-color") || pk.target); if (!el.hidden && !el.contains(e.target) && !(row && row.contains(e.target))) hidePk(); }, true);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !el.hidden) hidePk(); });
    return pk;
  }
  function hidePk() { if (pk) { pk.el.hidden = true; pk.target = null; } }
  function showPk(cp) {
    const p = picker(), row = cp.closest(".sh-color") || cp;
    if (!p.el.hidden && p.target === cp) { hidePk(); return; }   // 같은 줄을 다시 누르면 접는다
    row.after(p.el);   // '직접 고르기' 줄 바로 밑에 펼친다 (10/23 자기야)
    p.target = null; p.load(cp.value || "#F0185E"); p.target = cp; p.el.hidden = false;
    p.el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  document.addEventListener("click", (e) => { const cp = e.target.closest && e.target.closest('input[type="color"]'); if (!cp) return; e.preventDefault(); showPk(cp); }, true);

  // 예시 그림: 시트 '링크' 탭의 이 도구 줄에 적은 예시1~예시4 그림을, 비어 있는 사진 칸에 넣어 둔다 (10/23 자기야 "시트에서 그림 바꾸면 바뀌게")
  //  · 도구 페이지가 <body data-ex="칸1 선택자|칸2 선택자|…"> 로 어느 칸에 넣을지 알려 준다 (예시1 → 첫 칸 …)
  //  · 이미 사진이 든 칸(빼기·지우기 버튼이 있는 칸)은 건드리지 않는다
  const EX_SHEET = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT2Z9gpMAq_a1qUmAIbO3q6S73u0qVN7TrzkL3iYRFWa0vtWp12Y26oA93paHdzrKs2UqzSorVLhon0/pub?output=csv&gid=427440773";
  const EX_MOVED = { "dopa-pairframe.vercel.app": "/diary/", "dopa-gif.vercel.app": "/viewfinder/", "dopa-override.vercel.app": "/override/", "dopa-board.vercel.app": "/board/" };
  const exSel = (document.body.dataset.ex || "").split("|").map((x) => x.trim());
  function csvRows(text) { const rows = []; let row = [], cell = "", q = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; } else if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += c; } if (cell || row.length) { row.push(cell); rows.push(row); } return rows; }
  const waitFor = async (sel, ms = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const el = document.querySelector(sel); if (el) return el; await new Promise((r) => setTimeout(r, 150)); } return null; };
  const filled = (inp) => { const box = inp.closest(".sh-sec, label.photo"); return !!(box && [...box.querySelectorAll("button")].some((b) => /빼기|지우기/.test(b.textContent))); };
  async function examples() {
    if (!exSel.some(Boolean)) return;
    try {
      const [head, ...rows] = csvRows(await (await fetch(EX_SHEET)).text());
      const col = (k) => head.findIndex((h) => h.trim() === k), li = col("링크");
      const row = rows.find((r) => { try { const u = new URL((r[li] || "").trim(), location.href); const path = EX_MOVED[u.host] || (u.host === location.host ? u.pathname : ""); return path && location.pathname.startsWith(path); } catch (e) { return false; } });
      if (!row) return;
      for (let i = 0; i < exSel.length; i++) {
        const url = (row[col("예시" + (i + 1))] || "").trim(); if (!url || !exSel[i] || !/^https:\/\//.test(url)) continue;
        const inp = await waitFor(exSel[i]); if (!inp || filled(inp)) continue;
        const blob = await (await fetch(url)).blob(); const dt = new DataTransfer();
        dt.items.add(new File([blob], "example." + ((blob.type.split("/")[1] || "png").replace("jpeg", "jpg")), { type: blob.type || "image/png" }));
        inp.files = dt.files; inp.dispatchEvent(new Event("change", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch (e) { console.warn("예시 그림을 못 불러왔어요", e); }
  }
  examples();

  // 숫자 세기 (10/23 자기야 "다 트래킹 돼?") — 00호 생존 웹과 같은 survival_events 표에 넣기만 한다 (이름·사진·IP 없음)
  //  · ep = 도구 이름 · ev: view(열기) / save(내려받기, scene = png·gif·mp4) / tumblbug(알림 버튼)
  //  · src = 들어온 곳 (?from=x 또는 t.co → x) · 한 번 정해지면 이 탭에서 계속 쓴다
  const T_SB = "https://qytikqvngyvrszjygbbn.supabase.co", T_PK = "sb_publishable_h-nZS3_gVKpcLxgowjGK_Q_mr4bFXAp";
  const tsrc = (() => { try { const q = new URLSearchParams(location.search).get("from"); const r = document.referrer ? new URL(document.referrer).host : ""; const v = q || (/t\.co$|x\.com$|twitter\.com$/.test(r) ? "x" : /threads/.test(r) ? "threads" : r && r !== location.host ? r : ""); if (v) sessionStorage.setItem("dopa_tools_src", v.slice(0, 40)); return sessionStorage.getItem("dopa_tools_src") || "direct"; } catch (e) { return "direct"; } })();
  const tsid = (() => { try { let v = sessionStorage.getItem("dopa_tools_sid"); if (!v) { v = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("dopa_tools_sid", v); } return v; } catch (e) { return ""; } })();
  function track(ev, extra) { if (/localhost|127\.0\.0\.1/.test(location.host)) return; try { fetch(`${T_SB}/rest/v1/survival_events`, { method: "POST", keepalive: true, headers: { apikey: T_PK, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(Object.assign({ ev, ep: (me || "tools").slice(0, 10), sid: tsid, src: tsrc }, extra || {})) }).catch(() => {}); } catch (e) {} }
  track("view");
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a"); if (!a) return;
    if (a.hasAttribute("download") && a.getAttribute("href")) { const ext = ((a.getAttribute("download") || "").split(".").pop() || "").toLowerCase(); track("save", { scene: /^(png|gif|mp4|webm)$/.test(ext) ? ext : "file" }); }
    else if (/tumblbug\.com|tum\.bg/.test(a.href)) track("tumblbug");
  }, true);

  window.SH = { toast, open, close, setMode, zoom };
})();
