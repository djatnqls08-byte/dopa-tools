// 영화 감상 페어 (10/23) — 클로드 디자인 「도파 영화 감상 페어 16x9」(movie.dc.html)를 돌린다 · 실행 방식은 override/neo/neo.js 와 같다
//  · 시안은 t(0~1)로 4초 타임라인(자막 타이핑 · 별점 톡톡 · QR 스캔 · 버튼 물결)을 그린다
//  · 글은 movie.dc.html 의 {{ }} 칸, 사진은 <image-slot> 6자리(메인 스틸·포스터·A·B 프로필·명장면 2)
//  · 저장: PNG(1600×900) · GIF(800×450 · 24장) · MP4(960×540 · 4초)
(() => {
  const W = 1600, H = 900, LOOP = 4000, LS = "dopa_movie_v1", T_STILL = 0.85;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // 기본 예시는 이름 없이 A / B (10/23 자기야) · 글 속 {A} {B} 는 이름으로 바뀐다
  const P0 = {
    nameA: "A", nameB: "B", ratingA: 4, ratingB: 5, subStyle: "자막",
    subA: "{A}: 우산, 같이 쓸래?", subB: "{B}: …어깨 다 젖잖아요.",
    title: "흐르는 밤", tag: "DOPA PAIR ORIGINAL", year: "2026", runtime: "1시간 52분", genre: "로맨스 · 드라마",
    synopsis: "비 오는 밤, 막차를 놓친 두 사람. 같은 우산 아래에서 두 시간짜리 거짓말이 시작된다.",
    date: "10.27 (토)", time: "23:40 – 01:32", hall: "7관 · 리클라이너", seat: "G16, G17", bookNo: "1027-0427", snack: "팝콘 L 1 · 콜라 2",
    badgeA: "다시 볼래요", badgeB: "최고예요",
    reviewA: "정류장 장면이 좀 길었어. 근데 버스가 그냥 지나갈 때 숨을 참게 되더라. 옆에서 조는 줄 알았던 사람이 그 장면에서만 눈을 뜨고 있었고.",
    reviewB: "중간은 기억 안 나요. 마지막에 우산 건네는 장면은 봤어요. 코 훌쩍인 것도요. 그게 더 재밌어서 별 하나 더.",
    scene1: "01:12:40 정류장", scene2: "01:48:02 우산", scene1Prog: 64, scene2Prog: 96, credit: "작가 이름",
  };
  const SLOT = { "mv4-hero": "hero", "mv4-ticket-poster": "poster", "mv4-nav-a": "avatarA", "mv4-avatar-a": "avatarA", "mv4-nav-b": "avatarB", "mv4-avatar-b": "avatarB", "mv4-scene-1": "scene1", "mv4-scene-2": "scene2" };
  const SLOT_NAME = { hero: "메인 스틸 (가로로 크게)", poster: "티켓 포스터", avatarA: "A 프로필", avatarB: "B 프로필", scene1: "명장면 1", scene2: "명장면 2" };
  let S = { p: Object.assign({}, P0), photos: {}, pos: {}, motion: true };
  try { const v = JSON.parse(localStorage.getItem(LS) || "null"); if (v) S = { p: Object.assign({}, P0, v.p), photos: v.photos || {}, pos: v.pos || {}, motion: v.motion !== false }; } catch (e) {}
  const gifs = {}, nat = {};   // 움짤 프레임 · 사진 원래 크기
  let saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { try { localStorage.setItem(LS, JSON.stringify(Object.assign({}, S, { photos: {} }))); } catch (e2) {} } }, 300); }

  // ── 시안 실행기 (diary/app.js 와 같은 규칙) ──
  const get = (scope, path) => { const p = String(path).trim(); if (p === "true") return true; if (p === "false") return false; return p.split(".").reduce((o, k) => (o == null ? undefined : o[k]), scope); };
  const interp = (str, scope) => String(str).replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, e) => { const v = get(scope, e); return v == null ? "" : String(v); });
  const SVG_NS = "http://www.w3.org/2000/svg";
  function build(node, scope, inSvg, out) {
    if (node.nodeType === 3) { out.push(document.createTextNode(interp(node.nodeValue, scope))); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (tag === "helmet" || tag === "script") return;
    if (tag === "sc-for") { const list = get(scope, node.getAttribute("list").replace(/[{}\s]/g, "")) || []; const as = node.getAttribute("as"); list.forEach((item, i) => { const sc = Object.assign(Object.create(scope), { [as]: item, $index: i }); node.childNodes.forEach((c) => build(c, sc, inSvg, out)); }); return; }
    if (tag === "sc-if") { if (get(scope, node.getAttribute("value").replace(/[{}\s]/g, ""))) node.childNodes.forEach((c) => build(c, scope, inSvg, out)); return; }
    if (tag === "image-slot") { out.push(slotEl(node.getAttribute("id"), node.getAttribute("placeholder") || "")); return; }
    const svg = inSvg || tag === "svg";
    const el = svg ? document.createElementNS(SVG_NS, node.tagName) : document.createElement(tag);
    for (const a of node.attributes) { if (a.name.startsWith("hint-") || a.name.startsWith("data-om-")) continue; if (a.name === "ref") { el.setAttribute("data-root", "1"); continue; } el.setAttribute(a.name, interp(a.value, scope)); }
    const kids = []; node.childNodes.forEach((c) => build(c, scope, svg && tag !== "foreignobject", kids)); kids.forEach((k) => el.appendChild(k)); out.push(el);
  }
  // 사진 칸: 넣은 사진(움짤이면 지금 장면)을 꽉 채우고, 비었으면 아이콘과 안내 글
  let curT = 0;
  function slotEl(id, ph) {
    const k = SLOT[id] || id, src = frameOf(k, curT), d = document.createElement("div");
    d.dataset.img = k; d.setAttribute("style", "position:absolute;inset:0;");
    if (src) { const [sz, pos] = photoCss(k); d.style.backgroundImage = `url("${src}")`; d.style.backgroundSize = sz; d.style.backgroundPosition = pos; d.style.backgroundRepeat = "no-repeat"; }
    else if (ph.trim()) d.innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#6B6E73;font-size:13px;text-align:center;padding:${k === "hero" ? "0 300px 260px 760px" : "8px"};line-height:1.4"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/></svg>${ph.replace(/[<>&]/g, "")}</div>`;
    return d;
  }
  // 더한 움직임 (10/23 자기야 "모션 더 예쁘게"): 영사기 빛 깜빡임 · 떠오르는 먼지 · 티켓 둥실 · 제목 반짝 · 초록 점 · 말하는 사람 카드 빛
  const rnd = (i) => { const v = Math.sin(i * 91.17 + 3.3) * 43758.5453; return v - Math.floor(v); };
  function motion(t) {
    const ph = t * Math.PI * 2, sec = t * LOOP / 1000, half = sec < LOOP / 2000;
    const dust = Array.from({ length: 22 }, (_, i) => { const sp = 0.6 + rnd(i + 5) * 0.8, y = ((rnd(i + 9) * 660 - t * 660 * sp) % 660 + 660) % 660; return { x: `${(rnd(i) * 1580).toFixed(0)}px`, y: `${y.toFixed(0)}px`, s: `${(2 + rnd(i + 3) * 3).toFixed(1)}px`, o: (0.12 + 0.35 * rnd(i + 7) * (0.6 + 0.4 * Math.sin(ph * 2 + i))).toFixed(2) }; });
    const lv = (t * 2) % 1;
    return {
      beamX: `${(38 + 8 * Math.sin(ph)).toFixed(1)}%`, beamOp: (0.13 + 0.05 * Math.sin(ph * 5) + 0.03 * Math.sin(ph * 11)).toFixed(3), dust,
      floatY: `${(Math.sin(ph) * 6).toFixed(1)}px`, floatR: `${(Math.sin(ph + 0.6) * 0.5).toFixed(2)}deg`,
      shine: `${(130 - ((t * 1.6) % 1) * 160).toFixed(1)}%`,
      liveRing: `${(lv * 8).toFixed(1)}px`, liveOp: (0.55 * (1 - lv)).toFixed(2),
      cardA: half ? "rgba(240,24,94,.55)" : "#2A2C2F", glowA: half ? "rgba(240,24,94,.18)" : "transparent",
      cardB: half ? "#2A2C2F" : "rgba(185,139,255,.6)", glowB: half ? "transparent" : "rgba(185,139,255,.2)",
    };
  }
  let X = null, inst = null;
  async function load() {
    const doc = new DOMParser().parseFromString(await (await fetch("/movie/movie.dc.html")).text(), "text/html");
    X = doc.querySelector("x-dc"); const code = doc.querySelector("script[data-dc-script]").textContent;
    class DCLogic { constructor(props) { this.props = props; } setState(fn) { this.state = Object.assign({}, this.state, typeof fn === "function" ? fn(this.state) : fn); } }
    const React = { createRef: () => ({ current: null }) };
    const Comp = new Function("DCLogic", "React", code + "\nreturn Component;")(DCLogic, React);
    inst = new Comp({});
  }
  // 사진 위치·크기: 칸을 꽉 채운(cover) 크기에 확대 배율을 곱한다
  const BOX = { hero: [1600, 660], poster: [340, 170], avatarA: [64, 64], avatarB: [64, 64], scene1: [158, 92], scene2: [158, 92] };
  function photoCss(k) {
    const p = S.pos[k] || { x: 50, y: 50, z: 1 }, n = nat[k];
    if (!n) return ["cover", `${p.x}% ${p.y}%`];
    const [bw, bh] = BOX[k], c = Math.max(bw / n[0], bh / n[1]) * p.z;
    return [`${Math.round(n[0] * c)}px ${Math.round(n[1] * c)}px`, `${p.x}% ${p.y}%`];
  }
  function frameOf(k, t) { const fr = gifs[k]; return fr && fr.length ? fr[Math.floor(t * fr.length * 2) % fr.length] : S.photos[k] || ""; }
  function render(t) {
    if (!inst) return;
    const nm = (v) => (typeof v === "string" ? v.replace(/\{A\}/g, S.p.nameA || "A").replace(/\{B\}/g, S.p.nameB || "B") : v);   // 글 속 {A} {B} 는 이름으로
    const pp = {}; Object.entries(S.p).forEach(([k, v]) => (pp[k] = /^sub[AB]$|^review[AB]$|^synopsis$/.test(k) ? nm(v) : v));
    curT = S.motion ? t : T_STILL;
    inst.props = Object.assign({}, pp, { t: curT });
    const vals = inst.renderVals();
    Object.assign(vals, pp, { scene1Prog: (Number(S.p.scene1Prog) || 0) + "%", scene2Prog: (Number(S.p.scene2Prog) || 0) + "%" });   // 시안이 안 쓰는 글 칸도 그대로 넘긴다
    Object.assign(vals, motion(curT));
    const out = []; X.childNodes.forEach((c) => build(c, vals, false, out));
    const fresh = document.createElement("div"); fresh.id = "canvas"; out.forEach((n) => fresh.appendChild(n));
    morphdom($("#canvas"), fresh);
  }
  let paused = false, last = 0;
  function loop(now) { if (!paused && now - last > 33) { last = now; render((now % LOOP) / LOOP); } requestAnimationFrame(loop); }
  function fit() { const box = $("#stageBox"); const s = box.clientWidth / W; $("#stage").style.transform = `scale(${s})`; box.style.height = H * s + "px"; S._s = s; }

  // ── 편집 패널 ──
  function bind() {
    $$("[data-p]").forEach((inp) => {
      const k = inp.dataset.p, v = S.p[k];
      if (inp.type === "checkbox") inp.checked = !!v; else inp.value = v == null ? "" : v;
      inp.addEventListener(inp.type === "checkbox" || inp.tagName === "SELECT" ? "change" : "input", () => { S.p[k] = inp.type === "checkbox" ? inp.checked : inp.type === "number" || inp.type === "range" ? Number(inp.value) : inp.type === "color" ? inp.value.toUpperCase() : inp.value; save(); if (paused) render(T_STILL); });
    });
    const mo = $("#mvMotion"); mo.checked = S.motion; mo.addEventListener("change", () => { S.motion = mo.checked; save(); });
  }
  function photoRows() {
    $("#phRows").innerHTML = Object.entries(SLOT_NAME).map(([k, l]) => `<div class="sh-sec"><div class="sh-h"><b>${l}</b><span class="sh-status">${S.photos[k] ? (gifs[k] ? "움짤" : "사진") : "비어 있음"}</span></div>
      <label class="sh-upload"><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>사진·움짤 넣기<input type="file" accept="image/*" data-up="${k}" hidden></label>
      <div class="sh-sub"><span>움짤이 멈춰 보이면</span><label>파일에서 고르기<input type="file" accept="*/*" data-up="${k}" hidden></label></div>
      <div class="sh-row"><span class="sh-lab">크기</span><input type="range" min="1" max="3" step="0.01" value="${(S.pos[k] || {}).z || 1}" data-zoom="${k}"></div>
      ${S.photos[k] ? `<button class="sh-btn sm" data-del="${k}">사진 빼기</button>` : ""}</div>`).join("");
    $$("[data-up]").forEach((inp) => inp.addEventListener("change", async () => { const f = inp.files && inp.files[0]; inp.value = ""; if (f) await loadPhoto(inp.dataset.up, f); }));
    $$("[data-zoom]").forEach((r) => r.addEventListener("input", () => { const k = r.dataset.zoom; S.pos[k] = Object.assign({ x: 50, y: 50, z: 1 }, S.pos[k], { z: Number(r.value) }); save(); }));
    $$("[data-del]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.del; delete S.photos[k]; delete gifs[k]; delete S.pos[k]; delete nat[k]; photoRows(); save(); }));
  }
  const natOf = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok([im.naturalWidth, im.naturalHeight]); im.onerror = () => ok(null); im.src = src; });
  async function loadPhoto(k, file) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer()); delete gifs[k];
      const GR = window.GifReader || (window.omggif && window.omggif.GifReader);
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && GR) {
        const R = new GR(bytes), n = R.numFrames();
        if (n > 1) {
          const w = R.width, h = R.height, sc = Math.min(1, 700 / Math.max(w, h)), step = Math.max(1, Math.ceil(n / 40));
          const full = document.createElement("canvas"); full.width = w; full.height = h; const fx = full.getContext("2d"); const px = new Uint8ClampedArray(w * h * 4);
          const c = document.createElement("canvas"); c.width = Math.round(w * sc); c.height = Math.round(h * sc); const cx = c.getContext("2d"); const out = [];
          for (let i = 0; i < n; i++) { R.decodeAndBlitFrameRGBA(i, px); if (i % step) continue; fx.putImageData(new ImageData(new Uint8ClampedArray(px), w, h), 0, 0); cx.clearRect(0, 0, c.width, c.height); cx.drawImage(full, 0, 0, c.width, c.height); out.push(c.toDataURL("image/jpeg", 0.85)); }
          gifs[k] = out; S.photos[k] = out[0];
        }
      }
      if (!gifs[k]) S.photos[k] = await new Promise((ok, no) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { const s = Math.min(1, 1400 / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL("image/jpeg", 0.88)); }; im.onerror = () => { URL.revokeObjectURL(u); no(); }; im.src = u; });
      nat[k] = await natOf(S.photos[k]); S.pos[k] = { x: 50, y: 50, z: 1 }; photoRows(); save();
    } catch (e) { console.error(e); window.SH && SH.toast("이 파일은 열 수 없어요"); }
  }
  // 사진 끌기: 사진 칸(배경 그림이 있는 칸) 안을 끌면 위치가 바뀐다
  function setupDrag() {
    let d = null;
    $("#stage").addEventListener("pointerdown", (e) => {
      // 사진 위에 얇은 장식 층이 덮여 있어서, 눌린 자리 아래 겹친 요소 중 사진 칸을 찾는다
      const el = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x.dataset && x.dataset.img && x.closest("#canvas")); if (!el) return;
      const k = el.dataset.img; if (!S.photos[k]) return; const p = Object.assign({ x: 50, y: 50, z: 1 }, S.pos[k]); d = { k, p, sx: e.clientX, sy: e.clientY, x: p.x, y: p.y }; $("#stage").setPointerCapture(e.pointerId); e.preventDefault();
    });
    $("#stage").addEventListener("pointermove", (e) => { if (!d) return; const s = S._s || 1; const [bw, bh] = BOX[d.k]; d.p.x = Math.max(0, Math.min(100, d.x - (e.clientX - d.sx) / s / bw * 100)); d.p.y = Math.max(0, Math.min(100, d.y - (e.clientY - d.sy) / s / bh * 100)); S.pos[d.k] = d.p; if (paused) render(T_STILL); });
    $("#stage").addEventListener("pointerup", () => { if (d) { d = null; save(); } });
  }

  // ── 저장 ──
  const FAMS = ["Noto+Sans+KR:wght@400;500;600;700;800;900"];
  let fontCache = { key: "", css: "" }, gm = "";
  const toData = async (u) => { const b = await (await fetch(u)).blob(); return await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); }); };
  async function fontCSS() {
    const all = Object.values(S.p).filter((v) => typeof v === "string").join("") + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789[]_/:.·⇄%-→←!?\"'#";
    const chars = [...new Set(all.replace(/\s/g, ""))].join("");
    if (!gm) { try { gm = `@font-face{font-family:'GmarketSans';font-weight:700;src:url(${await toData("/fonts/GmarketSansBold.woff")}) format('woff')}\n`; } catch (e) {} }
    if (fontCache.key === chars) return fontCache.css;
    let out = gm;
    for (const fam of FAMS) { try { let css = await (await fetch(`https://fonts.googleapis.com/css2?family=${fam}&text=${encodeURIComponent(chars)}&display=swap`)).text(); for (const u of [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1])) css = css.replace(u, await toData(u)); out += css + "\n"; } catch (e) {} }
    fontCache = { key: chars, css: out }; return out;
  }
  const root = () => $("#canvas [data-root]");
  const status = (m) => { $("#dlStatus").textContent = m || ""; };
  function download(url, name) { const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  let busy = false;
  async function job(fn) { if (busy) return; busy = true; paused = true; $$("#shDl .sh-choice").forEach((b) => (b.disabled = true)); try { await document.fonts.ready; await fn(); } catch (e) { console.error(e); status("만들기에 실패했어요. 잠시 뒤 다시 눌러 주세요"); } paused = false; busy = false; $$("#shDl .sh-choice").forEach((b) => (b.disabled = false)); }
  const shot = async (t, w, h) => { render(t); await new Promise((r) => requestAnimationFrame(r)); return htmlToImage.toCanvas(root(), { width: W, height: H, canvasWidth: w, canvasHeight: h, pixelRatio: 1, cacheBust: false, fontEmbedCSS: await fontCSS() }); };
  const exportPng = () => job(async () => { status("PNG 만드는 중…"); render(T_STILL); await new Promise((r) => requestAnimationFrame(r)); download(await htmlToImage.toPng(root(), { width: W, height: H, pixelRatio: 1, cacheBust: false, fontEmbedCSS: await fontCSS() }), "dopa_movie.png"); status("PNG를 저장했어요"); window.va("event", { name: "png", data: { tool: "movie" } }); });
  const exportGif = () => job(async () => {
    const { GIFEncoder, quantize, applyPalette } = await import("https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js");
    const N = S.motion ? 24 : 1, gw = 800, gh = 450, gif = GIFEncoder();
    for (let f = 0; f < N; f++) { status(`GIF 만드는 중… ${f + 1}/${N}`); const cv = await shot(S.motion ? f / N : T_STILL, gw, gh); const data = cv.getContext("2d").getImageData(0, 0, gw, gh).data; const pal = quantize(data, 256); gif.writeFrame(applyPalette(data, pal), gw, gh, { palette: pal, delay: LOOP / 24 }); }
    gif.finish(); download(URL.createObjectURL(new Blob([gif.bytes()], { type: "image/gif" })), "dopa_movie.gif"); status("GIF를 저장했어요"); window.va("event", { name: "gif", data: { tool: "movie" } });
  });
  const exportMp4 = () => job(async () => {
    const HQ = /[?&]hq=1/.test(location.search), FPS = HQ ? 30 : 20, N = FPS * LOOP / 1000, vw = HQ ? 1600 : 1280, vh = HQ ? 900 : 720, frames = [];   // 10/23 자기야 "화질 후짐" → 720p·초당 20장 (?hq=1 이면 1600×900·30장)
    for (let f = 0; f < N; f++) { status(`영상 장면 만드는 중… ${f + 1}/${N}`); frames.push(await shot(S.motion ? f / N : T_STILL, vw, vh)); }
    const rec = document.createElement("canvas"); rec.width = vw; rec.height = vh; const rx = rec.getContext("2d"); rx.drawImage(frames[0], 0, 0);
    const stream = rec.captureStream(30); const mime = ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1.4d0028", "video/mp4;codecs=avc1.42E01F", "video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"].find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || "video/webm"; /* X는 VP9 MP4를 거부 → H.264(avc1) 먼저 */
    const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: HQ ? 16e6 : 10e6 }); const chunks = []; mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise((ok) => (mr.onstop = ok)); mr.start(); status("영상으로 묶는 중… 5초");
    for (let f = 0; f < N; f++) { rx.drawImage(frames[f], 0, 0); await new Promise((r) => setTimeout(r, 1000 / FPS)); }
    mr.stop(); await done; const blob = new Blob(chunks, { type: mr.mimeType || mime });
    download(URL.createObjectURL(blob), `dopa_movie.${/mp4/.test(blob.type) ? "mp4" : "webm"}`); status(/mp4/.test(blob.type) ? "MP4를 저장했어요" : "영상을 저장했어요 (이 브라우저는 WEBM으로 저장돼요)"); window.va("event", { name: "mp4", data: { tool: "movie" } });
  });

  // ── 시작 ──
  (async () => {
    await load(); bind(); photoRows();
    for (const k of Object.keys(SLOT_NAME)) if (S.photos[k]) nat[k] = await natOf(S.photos[k]);
    $("#mvPng").addEventListener("click", exportPng); $("#mvGif").addEventListener("click", exportGif); $("#mvMp4").addEventListener("click", exportMp4);
    $("#btnResetPositions").addEventListener("click", () => { S.pos = {}; photoRows(); save(); });
    $("#mvResetAll").addEventListener("click", () => { try { localStorage.removeItem(LS); } catch (e) {} location.reload(); });
    setupDrag(); fit(); addEventListener("resize", fit); new ResizeObserver(fit).observe($("#stageBox"));
    requestAnimationFrame(loop);
  })();
})();
