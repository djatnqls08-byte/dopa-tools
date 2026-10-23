// 수사 보드 · 사건 파일 모드 (10/23) — 클로드 디자인 시안 「도파 수사 보드」를 글·사진을 바꿀 수 있게 옮기고 움직임을 붙였다
//  · 그림(#stage 1600×1000)은 글·사진이 바뀔 때만 다시 만들고, 움직임(5초 반복)은 build() 가 남긴 손잡이만 매 프레임 바꾼다
//  · 움직임: 조서 한 줄씩 타이핑 · REC 깜빡 · 손글씨 동그라미·메모 써지기 · CLASSIFIED 도장 쾅 · 폴리스 라인 흐름 · 붉은 실 빛 · 넣은 GIF 사진 재생
//  · 저장: PNG(1600×1000) · GIF(800×500 · 25장) · MP4(960×600 · 5초)
(() => {
  const W = 1600, H = 1000, LOOP = 5000;
  const LS = "dopa_casefile_v1";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // 예시: 도파 튜토리얼 · 서태영 × 도가연 (시트 '도파미너' 설정에서)
  const DEF = {
    no: "1027-B", date: "2026.10.27 02:14", status: "STATUS OPEN",
    title: "樂園 사건", sub: "해결사와 팀장, 서로를 의심하는 밤",
    a: { name: "서태영", code: "SUSPECT 01 · 1027-A", profile: "32세 · 비공식 해결사", alibi: "“그 시간엔 낮잠 자고 있었는데.”", threat: 30 },
    b: { name: "도가연", code: "SUSPECT 02 · 1027-B", profile: "30세 · 전략기획팀장", alibi: "“야근 중이었어요. 혼자.”", threat: 90 },
    ev1: "그날 밤, 사무소", ev2: "지워진 사내 메신저",
    tr: [
      { time: "02:14", who: "a", text: "선입금은 들어왔고. 이제 말해 봐." },
      { time: "02:14", who: "b", text: "사적인 이야기는 퇴근하고 해요." },
      { time: "02:15", who: "a", text: "지금 퇴근 시간인데." },
      { time: "02:15", who: "b", text: "기억 안 나요." },
      { time: "02:16", who: "-", text: "(침묵 4초)" },
    ],
    markLine: 3, note: "← 거짓말. 다 봤으면서",
    stamp: "CLASSIFIED", stampSub: "극비 · 외부 유출 금지",
    cards: [
      { title: "반쯤 남은 믹스커피", desc: "새벽마다 책상 위에. 누가 두는지 모름" },
      { title: "우디향 룸스프레이", desc: "사무소에서 같은 향이 났다" },
      { title: "지워진 메시지 1건", desc: "“오늘은 오지 마요”" },
      { title: "같은 우산", desc: "비 오던 날, 한 사람만 젖었다" },
    ],
    verdict: "서로에게 유죄", verdictSub: "증거 불충분으로 판정 보류 중",
    credit: "작가 이름", tape: "DOPA LINE ✕ DO NOT CROSS ✕",
    color: "#F0185E", showTape: true, showStamp: true, motion: true,
    photos: {}, pos: {}, off: {},
  };
  const SLOTS = { s1: "A (왼쪽 폴라로이드)", s2: "B (오른쪽 폴라로이드)", e1: "증거 사진 1", e2: "증거 사진 2" };
  let S = JSON.parse(JSON.stringify(DEF));
  try { const v = JSON.parse(localStorage.getItem(LS) || "null"); if (v) S = Object.assign(JSON.parse(JSON.stringify(DEF)), v, { a: Object.assign({}, DEF.a, v.a), b: Object.assign({}, DEF.b, v.b) }); } catch (e) {}
  const gifs = {};   // 슬롯별 움짤 프레임 (dataURL 배열 · 저장 안 함)
  let saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { const p = Object.assign({}, S, { photos: {} }); try { localStorage.setItem(LS, JSON.stringify(p)); } catch (e2) {} } }, 300); }

  // ── 그림 만들기 ──
  const PINS = { L: [280, 198], R: [1320, 198], P1: [665, 202], P2: [933, 214], T: [800, 496], E1: [185, 856], E2: [455, 856], E3: [725, 856], E4: [995, 856] };
  const EDGES = [["L", "P1"], ["P1", "P2"], ["P2", "R"], ["L", "T"], ["R", "T"], ["T", "E3"], ["E2", "E3"], ["E3", "E4"]];
  const threadD = ([a, b]) => { const [x1, y1] = PINS[a], [x2, y2] = PINS[b]; const sag = Math.hypot(x2 - x1, y2 - y1) * 0.08; return `M${x1 + 8},${y1 + 8} Q${(x1 + x2) / 2 + 8},${(y1 + y2) / 2 + 8 + sag} ${x2 + 8},${y2 + 8}`; };
  const MONO = "'IBM Plex Mono',monospace", HAND = "'GriunGowoon','Nanum Pen Script',cursive", GM = "'GmarketSans','Noto Sans KR',sans-serif";
  const meter = (n, col) => Array.from({ length: 10 }, (_, i) => `<div style="width:22px;height:8px;background:${i < n ? col : "#D6D3CC"}"></div>`).join("");
  const who = (w) => (w === "a" ? S.a.name : w === "b" ? S.b.name : "—");
  const whoCol = (w) => (w === "a" ? "#121314" : w === "b" ? "#2647C7" : "#8A8D92");

  function photo(slot, ph) {
    const src = S.photos[slot], p = S.pos[slot] || { x: 50, y: 50, z: 1 };
    return `<div class="cf-ph" data-ph="${slot}" style="position:absolute;inset:0;overflow:hidden">${src ? `<img alt="" src="${src}" style="width:100%;height:100%;object-fit:cover;object-position:${p.x}% ${p.y}%;transform:scale(${p.z});transform-origin:${p.x}% ${p.y}%;display:block;pointer-events:none">` : `<div class="cf-empty" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:rgba(255,255,255,.4);font-size:15px"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/></svg>${esc(ph)}</div>`}</div>`;
  }
  function polaroid(side) {
    const P = side === "a" ? S.a : S.b, L = side === "a";
    const pct = Math.max(0, Math.min(100, Number(P.threat) || 0));
    return `<div style="position:absolute;left:${L ? 60 : 1100}px;top:200px;width:440px;transform:rotate(${L ? -1.2 : 1.4}deg);background:#F1EEE8;color:#121314;padding:14px;box-sizing:border-box;box-shadow:0 24px 50px rgba(0,0,0,.55);z-index:2">
      <div style="position:relative;height:440px;background-color:#1E1F22;background-image:repeating-linear-gradient(180deg,rgba(255,255,255,.1) 0 1px,transparent 1px 22px)">
        ${photo(L ? "s1" : "s2", L ? "인물 1 전신 / 상반신" : "인물 2 전신 / 상반신")}
        <div style="position:absolute;${L ? "left" : "right"}:8px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:space-around;font-family:${MONO};font-size:10px;line-height:1;color:rgba(255,255,255,.45);pointer-events:none"><span>190</span><span>180</span><span>170</span><span>160</span><span>150</span></div>
        <div style="position:absolute;left:50%;bottom:18px;transform:translateX(-50%);background:#121314;border:1px solid #3A3D41;padding:10px 18px 9px;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;color:#F2F2F0;max-width:380px">
          <span style="font-family:${MONO};font-size:10px;line-height:1;letter-spacing:.2em;color:#9A9DA2;white-space:nowrap">${esc(P.code)}</span>
          <span class="cf-fit" style="font-family:${GM};font-weight:700;font-size:22px;line-height:1.1;letter-spacing:.02em;white-space:nowrap;max-width:340px;overflow:hidden">${esc(P.name)}</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:64px 1fr;row-gap:8px;column-gap:12px;padding:16px 4px 4px;font-size:13px;line-height:1.4">
        <span style="font-family:${MONO};font-size:10px;letter-spacing:.12em;color:#5F6368;padding-top:2px">PROFILE</span><span class="cf-fit" style="white-space:nowrap;overflow:hidden">${esc(P.profile)}</span>
        <span style="font-family:${MONO};font-size:10px;letter-spacing:.12em;color:#5F6368;padding-top:2px">ALIBI</span><span class="cf-fit" style="white-space:nowrap;overflow:hidden">${esc(P.alibi)}</span>
        <span style="font-family:${MONO};font-size:10px;letter-spacing:.12em;color:#5F6368;padding-top:4px">THREAT</span>
        <div style="display:flex;align-items:center;gap:3px">${meter(Math.round(pct / 10), S.color)}<span style="font-family:${MONO};font-size:11px;font-weight:700;margin-left:8px">${pct}%</span></div>
      </div>
    </div>`;
  }
  function evPhoto(n) {
    const L = n === 1;
    return `<div style="position:absolute;left:${L ? 560 : 828}px;top:${L ? 200 : 214}px;width:210px;transform:rotate(${L ? -6 : 5}deg);background:#F1EEE8;padding:10px 10px 0;box-sizing:border-box;box-shadow:0 16px 30px rgba(0,0,0,.5);z-index:2">
      <div style="position:relative;height:180px;background:#1E1F22">${photo(L ? "e1" : "e2", L ? "증거 사진 1" : "증거 사진 2")}</div>
      <div class="cf-fit" style="font-family:${HAND};font-size:22px;line-height:1;color:#121314;text-align:center;padding:12px 0 14px;white-space:nowrap;overflow:hidden">${esc(L ? S.ev1 : S.ev2)}</div>
    </div>`;
  }
  const flag = (x, y, n) => `<div style="position:absolute;left:${x}px;top:${y}px;z-index:3"><div style="width:34px;height:30px;background:#D9FF3F;clip-path:polygon(18% 0,82% 0,100% 100%,0 100%);display:flex;align-items:center;justify-content:center;font-family:${MONO};font-weight:700;font-size:15px;color:#121314;padding-top:2px;box-sizing:border-box">${n}</div></div>`;

  function build() {
    const c = S.color, ml = Number(S.markLine) < 0 ? -1 : Math.max(0, Math.min(S.tr.length - 1, Number(S.markLine)));
    const rows = S.tr.map((ln, i) => `<div style="display:grid;grid-template-columns:50px 62px 1fr;height:34px;align-items:center;font-size:13.5px;line-height:1.2">
        <span style="font-family:${MONO};font-size:10px;color:#8A8D92">${esc(ln.time)}</span><span style="font-weight:700;color:${whoCol(ln.who)};white-space:nowrap;overflow:hidden">${esc(who(ln.who))}</span>
        <span style="color:${ln.who === "-" ? "#8A8D92" : "#121314"};white-space:nowrap;overflow:hidden;position:relative"><span class="cf-type" data-i="${i}" data-full="${esc(ln.text)}">${esc(ln.text)}</span></span></div>`).join("");
    const html = `<div class="cf-root" style="position:relative;width:${W}px;height:${H}px;overflow:hidden;color:#F2F2F0;font-family:'Noto Sans KR',sans-serif;background-color:#141517;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:40px 40px">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 40%,rgba(0,0,0,.55) 100%);pointer-events:none"></div>
      <svg width="${W}" height="${H}" style="position:absolute;inset:0;pointer-events:none;z-index:1">
        ${EDGES.map((e) => `<path d="${threadD(e)}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`).join("")}
        ${EDGES.map((e) => `<path class="cf-glow" pathLength="1000" d="${threadD(e)}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3" stroke-linecap="round" stroke-dasharray="70 930" stroke-dashoffset="0" style="filter:drop-shadow(0 0 4px ${c})"/>`).join("")}
      </svg>
      <div style="position:absolute;left:60px;top:52px;display:flex;flex-direction:column;gap:8px;font-family:${MONO};font-size:11px;line-height:1;letter-spacing:.16em;color:#9A9DA2;z-index:2">
        <span style="color:#F2F2F0;font-weight:700">CASE FILE · No. ${esc(S.no)}</span><span>DOPA ARCHIVE · ${esc(S.date)}</span>
        <span style="display:flex;align-items:center;gap:6px"><span class="cf-dot" style="width:7px;height:7px;border-radius:50%;background:${c};box-shadow:0 0 8px ${c}"></span>${esc(S.status)}</span>
      </div>
      <div style="position:absolute;left:0;right:0;top:40px;display:flex;flex-direction:column;align-items:center;gap:12px;z-index:2;pointer-events:none">
        <div class="cf-fit" style="font-family:'Noto Serif KR',serif;font-weight:900;font-size:66px;line-height:1.05;letter-spacing:.06em;text-shadow:3px 3px 0 rgba(139,0,255,.55);white-space:nowrap;max-width:620px;overflow:hidden">${esc(S.title)}</div>
        <div style="font-size:14px;line-height:1.4;color:#9A9DA2;white-space:nowrap">${esc(S.sub)}</div>
      </div>
      ${polaroid("a")}${polaroid("b")}${evPhoto(1)}${evPhoto(2)}${flag(538, 398, 1)}${flag(1028, 410, 2)}
      <div style="position:absolute;left:556px;top:500px;width:488px;transform:rotate(.8deg);background:#F1EEE8;color:#121314;box-shadow:0 24px 50px rgba(0,0,0,.55);z-index:2">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 22px 14px;border-bottom:1.5px solid #121314;font-family:${MONO};font-size:11px;line-height:1;font-weight:700;letter-spacing:.14em">
          <span>관계 조서 — AUDIO TRANSCRIPT</span><span style="color:${c}"><span class="cf-rec">●</span> REC ${esc(S.tr[0] ? S.tr[0].time : "")}</span>
        </div>
        <div style="position:relative;display:flex;flex-direction:column;padding:6px 22px 16px;background-image:repeating-linear-gradient(180deg,transparent 0 33px,#DEDBD3 33px 34px);background-position:0 6px">
          ${rows}
          ${ml >= 0 ? `<div class="cf-mark" style="position:absolute;left:0;top:0;width:60px;height:34px;border:2px solid ${c};border-radius:50%;pointer-events:none"></div>
          <div class="cf-note cf-drag" data-drag="note" style="position:absolute;left:0;top:0;font-family:${HAND};font-size:26px;line-height:1;color:${c};white-space:nowrap;cursor:move">${esc(S.note)}</div>` : ""}
        </div>
      </div>
      ${S.showStamp ? `<div class="cf-stamp cf-drag" data-drag="stamp" style="position:absolute;left:820px;top:700px;z-index:4;cursor:move;color:${c};-webkit-mask-image:url(${inkMask()});mask-image:url(${inkMask()});-webkit-mask-size:220px 220px;mask-size:220px 220px">
        <div style="border:4px solid currentColor;border-radius:10px;padding:4px">
          <div style="border:1.5px solid currentColor;border-radius:6px;padding:8px 18px 9px;display:flex;flex-direction:column;align-items:center;gap:5px">
            <span style="font-family:${MONO};font-weight:700;font-size:10px;letter-spacing:.32em;line-height:1;white-space:nowrap">★ DOPA ARCHIVE ★</span>
            <span class="cf-fit" data-fs="34" style="font-family:${MONO};font-weight:700;font-size:34px;line-height:1;letter-spacing:.16em;white-space:nowrap;max-width:300px;overflow:hidden;padding-left:.16em">${esc(S.stamp)}</span>
            <span style="width:100%;height:0;border-top:1.5px solid currentColor"></span>
            <span style="display:flex;gap:14px;align-items:center;font-size:12px;font-weight:800;letter-spacing:.06em;line-height:1;white-space:nowrap">${esc(S.stampSub)}<span style="font-family:${MONO};font-weight:600;font-size:10px;letter-spacing:.14em">No. ${esc(S.no)}</span></span>
          </div>
        </div></div>` : ""}
      ${S.cards.map((ev, i) => `<div style="position:absolute;left:${60 + i * 270}px;top:862px;width:250px;transform:rotate(${["-2", "1.5", "-1", "2"][i]}deg);background:#F1EEE8;color:#121314;padding:14px 16px 14px 18px;box-sizing:border-box;box-shadow:0 14px 26px rgba(0,0,0,.5);display:grid;grid-template-columns:38px 1fr;gap:12px;align-items:start;z-index:2">
        <div style="height:38px;background:#121314;color:#D9FF3F;display:flex;align-items:center;justify-content:center;font-family:${MONO};font-weight:700;font-size:14px">0${i + 1}</div>
        <div style="display:flex;flex-direction:column;gap:5px;min-width:0"><span class="cf-fit" style="font-size:14px;line-height:1.25;font-weight:700;white-space:nowrap;overflow:hidden">${esc(ev.title)}</span><span style="font-size:12px;line-height:1.4;color:#5F6368;max-height:34px;overflow:hidden">${esc(ev.desc)}</span></div></div>`).join("")}
      <div style="position:absolute;left:1186px;top:852px;width:354px;transform:rotate(-1.5deg);border:1.5px solid ${c};background:#1B1C1E;padding:18px 22px 20px;box-sizing:border-box;display:flex;flex-direction:column;gap:0;z-index:2;box-shadow:0 14px 26px rgba(0,0,0,.5)">
        <div style="display:flex;justify-content:space-between;font-family:${MONO};font-size:10px;line-height:1;letter-spacing:.18em;color:#9A9DA2"><span>FINAL VERDICT</span><span>최종 판정</span></div>
        <div class="cf-fit" style="margin-top:14px;padding:2px 4px 4px 0;font-family:${GM};font-weight:700;font-size:30px;line-height:1.15;letter-spacing:-.02em;color:${c};text-shadow:2px 2px 0 rgba(139,0,255,.5);white-space:nowrap;overflow:hidden">${esc(S.verdict)}</div>
        <div style="margin-top:8px;font-size:12.5px;line-height:1.4;color:#9A9DA2;white-space:nowrap;overflow:hidden">${esc(S.verdictSub)}</div>
      </div>
      ${Object.values(PINS).map(([x, y]) => `<div style="position:absolute;left:${x}px;top:${y}px;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#FF6A98 0 20%,${c} 45%,#B0003E 100%);box-shadow:1.5px 1.5px 0 #8B00FF,0 4px 8px rgba(0,0,0,.6);z-index:5"></div>`).join("")}
      ${S.showTape ? `<div style="position:absolute;left:1260px;top:96px;width:520px;height:38px;transform:rotate(32deg);background:#D9FF3F;overflow:hidden;z-index:6;box-shadow:0 8px 20px rgba(0,0,0,.45);pointer-events:none">
        <div class="cf-tape" style="position:absolute;left:0;top:0;height:38px;display:flex;align-items:center;white-space:nowrap;font-family:${MONO};font-weight:700;font-size:14px;letter-spacing:.22em;color:#121314">${Array.from({ length: 6 }, () => `<span class="cf-tu" style="padding-left:26px">${esc(S.tape)}</span>`).join("")}</div></div>` : ""}
      <div style="position:absolute;left:0;right:0;bottom:14px;text-align:center;font-family:${MONO};font-size:10px;line-height:1;letter-spacing:.18em;color:#5F6368;z-index:2">DESIGN DOPA ARCHIVE · ILLUST ${esc(S.credit)} · DOPA TOOLS</div>
    </div>`;
    $("#stage").innerHTML = html;
    fitAll(); placeMark(); tapeW = 0; anim(lastT);
  }
  // 동그라미는 고른 줄의 대사 글자 폭에 맞추고, 메모는 그 오른쪽(자리가 모자라면 아래)에 둔다 · 끌어서 옮긴 만큼(S.off) 더한다
  function placeMark() {
    const mk = $("#stage .cf-mark"), nt = $("#stage .cf-note"); if (!mk) return;
    const ml = Number(S.markLine), sp = $(`#stage .cf-type[data-i="${ml}"]`); if (!sp) return;
    const box = mk.parentNode, row = sp.parentNode.parentNode;
    const x = sp.parentNode.offsetLeft, y = row.offsetTop, w = Math.max(40, sp.offsetWidth);
    mk.style.left = x - 12 + "px"; mk.style.top = y - 1 + "px"; mk.style.width = w + 24 + "px"; mk.style.transform = "rotate(-3deg)";
    if (nt) {
      const o = (S.off && S.off.note) || { x: 0, y: 0 }, room = box.clientWidth - (x + w + 22);
      const nx = room >= nt.offsetWidth ? x + w + 22 : Math.max(0, box.clientWidth - nt.offsetWidth - 8), ny = room >= nt.offsetWidth ? y - 2 : y + 30;
      nt.dataset.bx = nx; nt.dataset.by = ny; nt.style.left = nx + o.x + "px"; nt.style.top = ny + o.y + "px"; nt.style.transform = "rotate(-6deg)";
    }
  }
  // 도장 먹 자국: 작은 점·긁힘이 비어 보이게 하는 마스크 (한 번만 만든다)
  let inkURL = "";
  function inkMask() {
    if (inkURL) return inkURL;
    const n = 220, c = document.createElement("canvas"); c.width = c.height = n; const x = c.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0, 0, n, n); let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    x.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 900; i++) { x.globalAlpha = 0.25 + rnd() * 0.6; x.beginPath(); x.arc(rnd() * n, rnd() * n, rnd() * 1.6 + 0.3, 0, 7); x.fill(); }
    for (let i = 0; i < 14; i++) { x.globalAlpha = 0.35 + rnd() * 0.4; x.lineWidth = rnd() * 2 + 0.5; x.beginPath(); const sx = rnd() * n, sy = rnd() * n; x.moveTo(sx, sy); x.lineTo(sx + rnd() * 40 - 20, sy + rnd() * 6 - 3); x.stroke(); }
    inkURL = c.toDataURL("image/png"); return inkURL;
  }
  // 칸보다 긴 글은 글자를 줄인다 (원래 크기의 55%까지)
  function fitAll() {
    $$("#stage .cf-fit").forEach((el) => { if (!el.dataset.fs) el.dataset.fs = parseFloat(el.style.fontSize) || parseFloat(getComputedStyle(el).fontSize); const base = +el.dataset.fs; let f = base; el.style.fontSize = base + "px"; const one = getComputedStyle(el).whiteSpace === "nowrap";   // 한 줄 글은 폭만 본다 (큰 제목은 글자 높이가 줄 높이를 살짝 넘는다)
    while ((el.scrollWidth > el.clientWidth + 1 || (!one && el.scrollHeight > el.clientHeight + 1)) && f > base * 0.55) { f -= 1; el.style.fontSize = f + "px"; } });
  }

  // ── 움직임 (t: 0~1 · 5초 한 바퀴) ──
  let lastT = 0.999, tapeW = 0;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  function anim(t) {
    lastT = t; const on = S.motion;
    const T = on ? t : 0.999;
    const rec = $("#stage .cf-rec"); if (rec) rec.style.opacity = !on || Math.floor(t * 10 + 0.5) % 2 === 0 ? "1" : "0.15";
    $$("#stage .cf-type").forEach((el) => { const i = +el.dataset.i, full = el.dataset.full, st = 0.04 + i * 0.11, k = clamp((T - st) / 0.09); const n = Math.round(full.length * k); el.textContent = full.slice(0, n); el.parentNode.style.visibility = k > 0 ? "visible" : "hidden"; });
    const mk = $("#stage .cf-mark"), nt = $("#stage .cf-note"), km = clamp((T - 0.62) / 0.08), kn = clamp((T - 0.68) / 0.12);
    if (mk) mk.style.clipPath = `inset(0 ${100 - km * 100}% 0 0)`;
    if (nt) nt.style.clipPath = `inset(-10px ${100 - kn * 100}% -10px 0)`;
    const sp = $("#stage .cf-stamp");
    if (sp) { const ks = clamp((T - 0.8) / 0.06); sp.style.opacity = String(0.9 * Math.min(1, ks * 1.5)); const o = (S.off && S.off.stamp) || { x: 0, y: 0 }; sp.style.transform = `translate(${o.x}px, ${o.y}px) rotate(-9deg) scale(${1 + (1 - ks) * 1.2})`; }
    const tp = $("#stage .cf-tape"); if (tp) { if (!tapeW) { const u = tp.querySelector(".cf-tu"); tapeW = u ? u.offsetWidth : 0; } tp.style.transform = `translateX(${-(on ? t : 0) * tapeW}px)`; }
    $$("#stage .cf-glow").forEach((p, i) => { p.style.display = on ? "" : "none"; p.setAttribute("stroke-dashoffset", String(-((t + i * 0.13) % 1) * 1000)); });
    Object.entries(gifs).forEach(([slot, fr]) => { const im = $(`#stage [data-ph="${slot}"] img`); if (im && fr.length) { const f = fr[Math.floor((on ? t : 0) * fr.length * 2) % fr.length]; if (im.getAttribute("src") !== f) im.setAttribute("src", f); } });
  }
  let raf = 0, paused = false;
  function loop(now) { if (!paused) anim((now % LOOP) / LOOP); raf = requestAnimationFrame(loop); }

  // ── 화면 맞춤 ──
  function fit() { const box = $("#stageBox"); const s = box.clientWidth / W; $("#stage").style.transform = `scale(${s})`; box.style.height = H * s + "px"; S._scale = s; }

  // ── 편집 패널 ──
  function bindText() {
    $$("[data-k]").forEach((inp) => {
      const path = inp.dataset.k.split("."); const get = () => path.reduce((o, k) => (o == null ? undefined : o[k]), S);
      const v = get(); if (inp.type === "checkbox") inp.checked = !!v; else inp.value = v == null ? "" : v;
      inp.addEventListener(inp.type === "checkbox" || inp.tagName === "SELECT" ? "change" : "input", () => {
        let o = S; for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
        o[path[path.length - 1]] = inp.type === "checkbox" ? inp.checked : inp.type === "number" || inp.dataset.num ? Number(inp.value) : inp.value;
        if (inp.dataset.k === "markLine" || inp.dataset.k.startsWith("tr.")) markOpts();
        build(); save();
      });
    });
  }
  function markOpts() { const sel = $("#markLine"); if (!sel) return; const cur = String(S.markLine); sel.innerHTML = `<option value="-1">동그라미 없음</option>` + S.tr.map((ln, i) => `<option value="${i}">${i + 1}번째 줄 · ${esc((ln.text || "").slice(0, 12))}</option>`).join(""); sel.value = cur; }
  function trRows() {
    $("#trRows").innerHTML = S.tr.map((ln, i) => `<div class="cf-tr"><select data-k="tr.${i}.who" class="sh-field"><option value="a">A</option><option value="b">B</option><option value="-">없음</option></select><input data-k="tr.${i}.time" class="sh-field" maxlength="5" placeholder="02:14"><input data-k="tr.${i}.text" class="sh-field" maxlength="26" placeholder="대사"></div>`).join("");
  }
  function cardRows() {
    $("#cardRows").innerHTML = S.cards.map((c, i) => `<div class="sh-col"><span class="sh-lab">증거 0${i + 1}</span><input data-k="cards.${i}.title" class="sh-field" maxlength="16" placeholder="제목"><input data-k="cards.${i}.desc" class="sh-field" maxlength="30" placeholder="한 줄 설명"></div>`).join("");
  }
  function photoRows() {
    $("#phRows").innerHTML = Object.entries(SLOTS).map(([k, l]) => `<div class="sh-sec"><div class="sh-h"><b>${l}</b><span class="sh-status" data-st="${k}">${S.photos[k] ? (gifs[k] ? "움짤" : "사진") : "비어 있음"}</span></div>
      <label class="sh-upload"><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>사진·움짤 넣기<input type="file" accept="image/*" data-up="${k}" hidden></label>
      <div class="sh-sub"><span>움짤이 멈춰 보이면</span><label>파일에서 고르기<input type="file" accept="*/*" data-up="${k}" hidden></label></div>
      <div class="sh-row"><span class="sh-lab">크기</span><input type="range" min="1" max="3" step="0.01" value="${(S.pos[k] || {}).z || 1}" data-zoom="${k}"></div>
      ${S.photos[k] ? `<button class="sh-btn sm" data-del="${k}">사진 빼기</button>` : ""}</div>`).join("");
    $$("[data-up]").forEach((inp) => inp.addEventListener("change", async () => { const f = inp.files && inp.files[0]; inp.value = ""; if (f) await loadPhoto(inp.dataset.up, f); }));
    $$("[data-zoom]").forEach((r) => r.addEventListener("input", () => { const k = r.dataset.zoom; S.pos[k] = Object.assign({ x: 50, y: 50, z: 1 }, S.pos[k], { z: Number(r.value) }); build(); save(); }));
    $$("[data-del]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.del; delete S.photos[k]; delete gifs[k]; delete S.pos[k]; build(); photoRows(); save(); }));
  }
  // 사진: 1400px 로 줄여 넣는다 · 움직이는 GIF 는 프레임을 풀어 둔다(최대 40장)
  async function loadPhoto(slot, file) {
    const stEl = $(`[data-st="${slot}"]`); if (stEl) stEl.textContent = "읽는 중…";
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      delete gifs[slot];
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && (window.GifReader || (window.omggif && window.omggif.GifReader))) {
        const R = new (window.GifReader || window.omggif.GifReader)(bytes); const n = R.numFrames();
        if (n > 1) {
          const w = R.width, h = R.height, sc = Math.min(1, 700 / Math.max(w, h)), step = Math.max(1, Math.ceil(n / 40));
          const full = document.createElement("canvas"); full.width = w; full.height = h; const fx = full.getContext("2d"); const px = new Uint8ClampedArray(w * h * 4); const out = [];
          const c = document.createElement("canvas"); c.width = Math.round(w * sc); c.height = Math.round(h * sc); const cx = c.getContext("2d");
          for (let i = 0; i < n; i++) { R.decodeAndBlitFrameRGBA(i, px); if (i % step) continue; const id = new ImageData(new Uint8ClampedArray(px), w, h); fx.putImageData(id, 0, 0); cx.clearRect(0, 0, c.width, c.height); cx.drawImage(full, 0, 0, c.width, c.height); out.push(c.toDataURL("image/jpeg", 0.85)); }
          gifs[slot] = out; S.photos[slot] = out[0];
        }
      }
      if (!gifs[slot]) S.photos[slot] = await shrink(file, 1400);
      S.pos[slot] = { x: 50, y: 50, z: 1 };
      build(); photoRows(); save();
    } catch (e) { if (stEl) stEl.textContent = "열 수 없는 파일"; console.error(e); }
  }
  function shrink(file, max) {
    return new Promise((ok, no) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL("image/jpeg", 0.88)); }; im.onerror = () => { URL.revokeObjectURL(u); no(); }; im.src = u; });
  }
  // 사진 안을 끌면 위치 조절
  function setupDrag() {
    let d = null;
    let m = null;   // 도장·손글씨 메모 끌어 옮기기
    $("#stage").addEventListener("pointerdown", (e) => { const g = e.target.closest("[data-drag]"); if (!g) return; const k = g.dataset.drag; S.off = S.off || {}; const o = Object.assign({ x: 0, y: 0 }, S.off[k]); m = { k, g, o, sx: e.clientX, sy: e.clientY, x: o.x, y: o.y }; g.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); }, true);
    $("#stage").addEventListener("pointermove", (e) => { if (!m) return; const s = S._scale || 1; m.o.x = m.x + (e.clientX - m.sx) / s; m.o.y = m.y + (e.clientY - m.sy) / s; S.off[m.k] = m.o; if (m.k === "note") { m.g.style.left = (+m.g.dataset.bx + m.o.x) + "px"; m.g.style.top = (+m.g.dataset.by + m.o.y) + "px"; } else anim(lastT); });
    $("#stage").addEventListener("pointerup", () => { if (m) { m = null; save(); } });
    $("#stage").addEventListener("pointerdown", (e) => { const ph = e.target.closest("[data-ph]"); if (!ph || !S.photos[ph.dataset.ph]) return; const k = ph.dataset.ph; const p = Object.assign({ x: 50, y: 50, z: 1 }, S.pos[k]); d = { k, p, sx: e.clientX, sy: e.clientY, x: p.x, y: p.y, r: ph.getBoundingClientRect() }; ph.setPointerCapture(e.pointerId); e.preventDefault(); });
    $("#stage").addEventListener("pointermove", (e) => { if (!d) return; d.p.x = Math.max(0, Math.min(100, d.x - (e.clientX - d.sx) / d.r.width * 100 / d.p.z * 1.4)); d.p.y = Math.max(0, Math.min(100, d.y - (e.clientY - d.sy) / d.r.height * 100 / d.p.z * 1.4)); S.pos[d.k] = d.p; const im = $(`#stage [data-ph="${d.k}"] img`); if (im) { im.style.objectPosition = `${d.p.x}% ${d.p.y}%`; im.style.transformOrigin = `${d.p.x}% ${d.p.y}%`; } });
    $("#stage").addEventListener("pointerup", () => { if (d) { d = null; save(); } });
  }

  // ── 저장 ──
  const FAMS = ["Noto+Sans+KR:wght@400;500;700", "Noto+Serif+KR:wght@900", "IBM+Plex+Mono:wght@400;600;700"];
  let fontCache = { key: "", css: "" }, localFonts = "";
  const toData = async (u) => { const b = await (await fetch(u)).blob(); return await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); }); };
  async function fontCSS() {
    const chars = [...new Set(($("#stage").textContent + "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—–“”%:.✕←●").replace(/\s/g, ""))].join("");
    if (!localFonts) { try { localFonts = `@font-face{font-family:'GmarketSans';font-weight:700;src:url(${await toData("/fonts/GmarketSansBold.woff")}) format('woff')}\n@font-face{font-family:'GriunGowoon';src:url(${await toData("/fonts/GriunGowoon.woff2")}) format('woff2')}\n`; } catch (e) {} }
    if (fontCache.key === chars) return fontCache.css;
    let out = localFonts;
    for (const fam of FAMS) { try { let css = await (await fetch(`https://fonts.googleapis.com/css2?family=${fam}&text=${encodeURIComponent(chars)}&display=swap`)).text(); for (const u of [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1])) css = css.replace(u, await toData(u)); out += css + "\n"; } catch (e) {} }
    fontCache = { key: chars, css: out }; return out;
  }
  const root = () => $("#stage .cf-root");
  const opts = async (extra) => Object.assign({ width: W, height: H, pixelRatio: 1, cacheBust: false, fontEmbedCSS: await fontCSS() }, extra || {});
  const status = (m) => { const s = $("#dlStatus"); if (s) s.textContent = m || ""; };
  function download(url, name) { const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  let busy = false;
  async function withPause(fn) { if (busy) return; busy = true; paused = true; $$(".sh-choice").forEach((b) => (b.disabled = true)); try { await document.fonts.ready; await fn(); } catch (e) { console.error(e); status("만들기에 실패했어요. 잠시 뒤 다시 눌러 주세요"); } paused = false; busy = false; $$(".sh-choice").forEach((b) => (b.disabled = false)); }
  const exportPng = () => withPause(async () => { status("PNG 만드는 중…"); anim(0.999); download(await htmlToImage.toPng(root(), await opts()), "dopa_case_file.png"); status("PNG를 저장했어요"); window.va("event", { name: "png", data: { tool: "board-file" } }); });
  const exportGif = () => withPause(async () => {
    const { GIFEncoder, quantize, applyPalette } = await import("https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js");
    const N = 25, gw = 800, gh = 500, gif = GIFEncoder(), o = await opts({ canvasWidth: gw, canvasHeight: gh });
    for (let f = 0; f < N; f++) {
      status(`GIF 만드는 중… ${f + 1}/${N}`); anim(S.motion ? f / N : 0.999);
      const cv = await htmlToImage.toCanvas(root(), o); const data = cv.getContext("2d").getImageData(0, 0, gw, gh).data;
      const pal = quantize(data, 256); gif.writeFrame(applyPalette(data, pal), gw, gh, { palette: pal, delay: LOOP / N });
    }
    gif.finish(); download(URL.createObjectURL(new Blob([gif.bytes()], { type: "image/gif" })), "dopa_case_file.gif"); status("GIF를 저장했어요"); window.va("event", { name: "gif", data: { tool: "board-file" } });
  });
  const exportMp4 = () => withPause(async () => {
    const FPS = 8, N = FPS * LOOP / 1000, vw = 960, vh = 600, frames = [], o = await opts({ canvasWidth: vw, canvasHeight: vh });
    for (let f = 0; f < N; f++) { status(`영상 장면 만드는 중… ${f + 1}/${N}`); anim(S.motion ? f / N : 0.999); frames.push(await htmlToImage.toCanvas(root(), o)); }
    const rec = document.createElement("canvas"); rec.width = vw; rec.height = vh; const rx = rec.getContext("2d"); rx.drawImage(frames[0], 0, 0);
    const stream = rec.captureStream(30); let mime = "video/mp4"; if (!window.MediaRecorder || !MediaRecorder.isTypeSupported(mime)) mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6e6 }); const chunks = []; mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise((ok) => (mr.onstop = ok)); mr.start(); status("영상으로 묶는 중… 5초");
    for (let f = 0; f < N; f++) { rx.drawImage(frames[f], 0, 0); await new Promise((r) => setTimeout(r, 1000 / FPS)); }
    mr.stop(); await done; const blob = new Blob(chunks, { type: mr.mimeType || mime });
    download(URL.createObjectURL(blob), `dopa_case_file.${/mp4/.test(blob.type) ? "mp4" : "webm"}`); status(/mp4/.test(blob.type) ? "MP4를 저장했어요" : "영상을 저장했어요 (이 브라우저는 WEBM으로 저장돼요)"); window.va("event", { name: "mp4", data: { tool: "board-file" } });
  });

  // ── 시작 ──
  function init() {
    trRows(); cardRows(); photoRows(); bindText(); markOpts();
    $$("[data-col]").forEach((b) => b.addEventListener("click", () => { S.color = b.dataset.col; $("#colorPick").value = S.color; build(); save(); }));
    $("#colorPick").value = S.color; $("#colorPick").addEventListener("input", (e) => { S.color = e.target.value; build(); save(); });
    $("#cfPng").addEventListener("click", exportPng); $("#cfGif").addEventListener("click", exportGif); $("#cfMp4").addEventListener("click", exportMp4);
    $("#btnResetPositions").addEventListener("click", () => { S.pos = {}; S.off = {}; build(); photoRows(); save(); });
    $("#cfResetAll").addEventListener("click", () => { try { localStorage.removeItem(LS); } catch (e) {} location.reload(); });
    setupDrag(); build(); fit(); addEventListener("resize", fit); new ResizeObserver(fit).observe($("#stageBox"));
    document.fonts.ready.then(() => { fitAll(); placeMark(); tapeW = 0; });
    raf = requestAnimationFrame(loop);
  }
  init();
})();
