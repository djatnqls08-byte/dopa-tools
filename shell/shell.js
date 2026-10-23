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
    { k: "override", t: "시스템 오버라이드", img: IMG + "prompt/1791391557710-6tdo3z.gif" },
    { k: "board", t: "수사 보드", img: IMG + "link/1791420748115-tnu2g1.gif" },
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
    document.addEventListener("pointerdown", (e) => { if (!el.hidden && !el.contains(e.target) && e.target !== pk.target) hidePk(); }, true);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !el.hidden) hidePk(); });
    return pk;
  }
  function hidePk() { if (pk) { pk.el.hidden = true; pk.target = null; } }
  function showPk(cp) {
    const p = picker(); p.target = null; p.load(cp.value || "#F0185E"); p.target = cp; p.el.hidden = false;
    const r = cp.getBoundingClientRect(), w = p.el.offsetWidth, h = p.el.offsetHeight;
    if (innerWidth <= 760) { p.el.classList.add("sheet"); p.el.style.left = ""; p.el.style.top = ""; }
    else { p.el.classList.remove("sheet"); p.el.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left - w + r.width)) + "px"; p.el.style.top = (r.bottom + 8 + h > innerHeight ? Math.max(8, r.top - h - 8) : r.bottom + 8) + "px"; }
    setTimeout(() => { const c = p.el.querySelector("input[type=text]"); if (innerWidth > 760) c.select(); }, 30);
  }
  document.addEventListener("click", (e) => { const cp = e.target.closest && e.target.closest('input[type="color"]'); if (!cp) return; e.preventDefault(); showPk(cp); }, true);

  window.SH = { toast, open, close, setMode, zoom };
})();
