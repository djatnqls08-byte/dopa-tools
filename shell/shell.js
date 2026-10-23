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

  window.SH = { toast, open, close, setMode };
})();
