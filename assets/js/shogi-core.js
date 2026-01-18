(() => {
  // Worker（※パスは依頼がない限り変更しない）
  const WORKER_WS = "wss://samurairoad-ws.korokorokororintyo.workers.dev";

  // DOM
  const boardEl  = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const nameEl   = document.getElementById("name");
  const btnConnect = document.getElementById("btnConnect");
  const btnCopyUrl = document.getElementById("btnCopyUrl");
  const btnReset = document.getElementById("btnReset");
  const btnFull = document.getElementById("btnFull");

  // ---- UI Modal (replace browser alert/confirm to avoid site/title display) ----
  const uiModal = document.getElementById("uiModal");
  const uiModalMsg = document.getElementById("uiModalMsg");
  const uiModalOk = document.getElementById("uiModalOk");
  const uiModalCancel = document.getElementById("uiModalCancel");

  function uiAlert(message){
    return new Promise((resolve)=>{
      if (!uiModal) { window.alert(message); resolve(); return; }
      uiModalMsg.textContent = message;
      uiModalCancel.style.display = "none";
      uiModalOk.textContent = "OK";
      uiModal.style.display = "block";
      const done = ()=>{ uiModal.style.display="none"; cleanup(); resolve(); };
      const onOk = ()=>done();
      const onBg = (e)=>{ if(e.target===uiModal) done(); };
      function cleanup(){
        uiModalOk.removeEventListener("click", onOk);
        uiModal.removeEventListener("click", onBg);
      }
      uiModalOk.addEventListener("click", onOk);
      uiModal.addEventListener("click", onBg);
    });
  }

  function uiConfirm(message, okText="OK", cancelText="キャンセル"){
    return new Promise((resolve)=>{
      if (!uiModal) { resolve(window.confirm(message)); return; }
      uiModalMsg.textContent = message;
      uiModalCancel.style.display = "inline-flex";
      uiModalOk.textContent = okText;
      uiModalCancel.textContent = cancelText;
      uiModal.style.display = "block";
      const done = (v)=>{ uiModal.style.display="none"; cleanup(); resolve(v); };
      const onOk = ()=>done(true);
      const onCancel = ()=>done(false);
      const onBg = (e)=>{ if(e.target===uiModal) done(false); };
      function cleanup(){
        uiModalOk.removeEventListener("click", onOk);
        uiModalCancel.removeEventListener("click", onCancel);
        uiModal.removeEventListener("click", onBg);
      }
      uiModalOk.addEventListener("click", onOk);
      uiModalCancel.addEventListener("click", onCancel);
      uiModal.addEventListener("click", onBg);
    });
  }

  // expose modal helpers globally (used by later scripts)
  window.uiAlert = uiAlert;
  window.uiConfirm = uiConfirm;

  const btnChatToggle = document.getElementById("btnChatToggle");
  const chatLog = document.getElementById("chatLog");
  const chatInput = document.getElementById("chatInput");
  const btnSend = document.getElementById("btnSend");
  const btnSound = document.getElementById("btnSound");
  const turnText = document.getElementById("turnText");
  const handS = document.getElementById("handS");
  const handG = document.getElementById("handG");
  const handHintS = document.getElementById("handHintS");
  const handHintG = document.getElementById("handHintG");

  // KIFU control buttons
  const btnKifuDelete  = document.getElementById("btnKifuDelete");

  // Client ID cache (for role assignment)
  let clientId = null;
  try{
    clientId = localStorage.getItem("shogi_client_id");
    if (!clientId){
      clientId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ("cid_" + Math.random().toString(16).slice(2) + Date.now());
      localStorage.setItem("shogi_client_id", clientId);
    }
  }catch{
    clientId = "cid_" + Math.random().toString(16).slice(2) + Date.now();
  }

  // Name cache
  try{
    const cached = localStorage.getItem("shogi_name");
    if (cached && !nameEl.value) nameEl.value = cached;
  }catch{}


  // 駒表記（大文字=先手 / 小文字=後手 / "+X"=成り）
  const PIECE = {
    L:"香",N:"桂",S:"銀",G:"金",K:"玉",R:"飛",B:"角",P:"歩",
    l:"香",n:"桂",s:"銀",g:"金",k:"王",r:"飛",b:"角",p:"歩",
    "+P":"と","+p":"と",
    "+L":"成香","+l":"成香",
    "+N":"成桂","+n":"成桂",
    "+S":"成銀","+s":"成銀",
    "+B":"馬","+b":"馬",
    "+R":"龍","+r":"龍"
  };

  const HAND_ORDER = ["R","B","G","S","N","L","P"];
  const HAND_LABEL = { R:"飛",B:"角",G:"金",S:"銀",N:"桂",L:"香",P:"歩" };

  function basePiece(p){ return (typeof p === "string" && p.startsWith("+")) ? p.slice(1) : p; }
  function isPromoted(p){ return (typeof p === "string" && p.startsWith("+")); }
  function isSente(p){ const b = basePiece(p); return b && b === b.toUpperCase(); }
  function isGote(p){ const b = basePiece(p); return b && b === b.toLowerCase(); }
  function toSide(piece){ return isSente(piece) ? "S" : "G"; }

  function normalizeHands(g){
    if (!g.hands) g.hands = { S: {}, G: {} };
    if (!g.hands.S) g.hands.S = {};
    if (!g.hands.G) g.hands.G = {};
    return g;
  }

  function normalizeRoles(g){
    if (!g.roles) g.roles = { S: null, G: null };
    if (!("S" in g.roles)) g.roles.S = null;
    if (!("G" in g.roles)) g.roles.G = null;
    return g;
  }

  function initialGame(){
    return normalizeHands({
      turn:"S",
      board:[
        ["l","n","s","g","k","g","s","n","l"],
        [null,"r",null,null,null,null,null,"b",null],
        ["p","p","p","p","p","p","p","p","p"],
        [null,null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null,null],
        [null,null,null,null,null,null,null,null,null],
        ["P","P","P","P","P","P","P","P","P"],
        [null,"B",null,null,null,null,null,"R",null],
        ["L","N","S","G","K","G","S","N","L"],
      ],
      hands: { S: {}, G: {} },
      roles: { S: null, G: null }
    });
  }

  let ws = null;
  let gotState = false;
  let game = ensureGameId(ensureKifu(normalizeRoles(initialGame())));
  // expose for other script blocks (module scope isolation)
  window.__KIWAMI_GAME = game;
  let selected = null;         // {r,c}
  let selectedDrop = null;     // {side,type}
  let lastMove = null;         // {from:{r,c}, to:{r,c}}
  let moverSide = null;         // 手を指した側（多重宣言防止）
  // ---- 棋譜（JSON） ----
  function ensureKifu(g){
    if (!g.kifu) g.kifu = { version: 1, initial: "standard", moves: [], cursor: 0 };
    if (!Array.isArray(g.kifu.moves)) g.kifu.moves = [];
    if (typeof g.kifu.cursor !== "number") g.kifu.cursor = g.kifu.moves.length;
    return g;
  }

  // ---- 棋譜 自動取得（ローカル保存） ----
  let kifuAutoEnabled = false;
  let suppressAutoLoadOnce = false; // reset等でローカル自動読込を一度だけ抑止
  let didAutoLoadKifu = false; // 接続時の自動読込は一度だけ

    // ---- 対局ID（試合ごとに棋譜を分けて保存） ----
  function ensureGameId(g){
    if (!g.gameId){
      g.gameId = `g_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      g.startedAt = new Date().toISOString();
      g.finishedAt = null;
      g.result = null;
    }
    return g;
  }

  function kifuIndexKey(){
    return `kiwami_kifu_index_v1:${currentRoom()}`;
  }

  function upsertGameIndex(meta){
    try{
      const key = kifuIndexKey();
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      const i = arr.findIndex(x => x.gameId === meta.gameId);
      if (i >= 0) arr[i] = { ...arr[i], ...meta };
      else arr.unshift(meta);
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 50))); // 50試合まで
    }catch{}
  }

  function finalizeCurrentGame(reason){
    try{
      ensureKifu(game);
      ensureGameId(game);
      // 0手の対局は保存しない（誤リセット等のノイズ防止）
      if (!game.kifu.moves || game.kifu.moves.length === 0) return;

      if (!game.finishedAt) game.finishedAt = new Date().toISOString();
      if (!game.result) game.result = reason || "finished";

      // 確実に保存
      saveKifuToLocal();

      upsertGameIndex({
        gameId: game.gameId,
        room: currentRoom(),
        gameId: game.gameId || null,
        startedAt: game.startedAt || null,
        finishedAt: game.finishedAt || null,
        result: game.result || null,
        startedAt: game.startedAt || null,
        finishedAt: game.finishedAt,
        result: game.result,
        moves: game.kifu.moves.length,
        savedAt: new Date().toISOString()
      });
    }catch{}
  }

  function startNewGame(){
    // 現在の対局を確定（リセット前）
    finalizeCurrentGame("reset");
    game = ensureKifu(normalizeRoles(initialGame()));
    game = ensureGameId(game);
    window.__KIWAMI_GAME = game;
    saveKifuToLocal(); // 初期状態も保存しておく（復元用）
  }

  function kifuStorageKey(){
    ensureGameId(game);
    return `kiwami_kifu_v1:${currentRoom()}:${game.gameId}`;
  }

  function saveKifuToLocal(){
    try{
      ensureKifu(game);
      const payload = {
        format: "KiwamiShogiKifu",
        version: 1,
        room: currentRoom(),
        savedAt: new Date().toISOString(),
        initial: "standard",
        moves: game.kifu.moves || []
      };
      localStorage.setItem(kifuStorageKey(), JSON.stringify(payload));
    }catch{}
  }

  function loadKifuFromLocal(){
    try{
      const raw = localStorage.getItem(kifuStorageKey());
      if (!raw){
        // 旧形式（部屋単位）からの互換読込
        const legacyKey = `kiwami_kifu_v1:${currentRoom()}`;
        const legacy = localStorage.getItem(legacyKey);
        if (!legacy) return { ok:false, msg:"保存済み棋譜がありません" };
        // 旧データを現在の対局IDへ取り込み
        const legacyObj = JSON.parse(legacy);
        ensureGameId(game);
        const migrated = {
          moves: legacyObj.moves || [],
          cursor: (legacyObj.moves || []).length
        };
        ensureKifu(game);
        game.kifu.moves = migrated.moves;
        game.kifu.cursor = migrated.cursor;
        rebuildToCursor(game.kifu.cursor);
        // 新キーで保存（以後は試合単位）
        saveKifuToLocal();
        return { ok:true, msg:`旧形式棋譜を移行読込（手数 ${migrated.moves.length}）` };
      }
      const obj = JSON.parse(raw);
      if (!obj || !Array.isArray(obj.moves)) return { ok:false, msg:"保存棋譜が壊れています（movesがありません）" };
      ensureKifu(game);
      game.kifu.moves = obj.moves;
      game.kifu.cursor = obj.moves.length;
      rebuildToCursor(game.kifu.cursor);
      return { ok:true, msg:`ローカル棋譜を読込（手数 ${obj.moves.length}）` };
    }catch{
      return { ok:false, msg:"保存棋譜の読み込みに失敗しました" };
    }
  }

  function deleteKifuLocal(){
    try{ localStorage.removeItem(kifuStorageKey()); }catch{}
  }

  function basePieceForHand(p){
    if (!p) return null;
    const up = p.toUpperCase();
    const map = { "+P":"P", "+L":"L", "+N":"N", "+S":"S", "+B":"B", "+R":"R" };
    if (map[up]) return (p === up) ? map[up] : map[up].toLowerCase();
    return p;
  }

  function applyKifuRecord(g, rec){
    normalizeHands(g);
    normalizeRoles(g);

    if (rec.type === "move"){
      // remove from
      g.board[rec.from.r][rec.from.c] = null;

      // capture -> hand
      if (rec.capture){
        const bp = basePieceForHand(rec.capture);
        const key = bp.toUpperCase();
        g.hands[rec.side][key] = (g.hands[rec.side][key] || 0) + 1;
      }

      // place pieceAfter
      g.board[rec.to.r][rec.to.c] = rec.pieceAfter;

      g.turn = (rec.side === "S") ? "G" : "S";
      return;
    }

    if (rec.type === "drop"){
      const key = rec.piece.toUpperCase();
      const cur = (g.hands[rec.side][key] || 0);
      if (cur > 0){
        if (cur === 1) delete g.hands[rec.side][key];
        else g.hands[rec.side][key] = cur - 1;
      }
      const p = (rec.side === "S") ? key : key.toLowerCase();
      g.board[rec.to.r][rec.to.c] = p;
      g.turn = (rec.side === "S") ? "G" : "S";
      return;
    }
  }

  function rebuildToCursor(cursor){
    ensureKifu(game);
    const moves = game.kifu.moves || [];
    const c = Math.max(0, Math.min(cursor, moves.length));

    const rebuilt = normalizeRoles(normalizeHands(initialGame()));
    rebuilt.roles = game.roles ? JSON.parse(JSON.stringify(game.roles)) : {S:null,G:null};
    rebuilt.hands = { S:{}, G:{} };
    rebuilt.turn = "S";
    ensureKifu(rebuilt);
    rebuilt.kifu.moves = JSON.parse(JSON.stringify(moves));
    rebuilt.kifu.cursor = c;

    for (let i=0; i<c; i++){
      applyKifuRecord(rebuilt, moves[i]);
    }

    game.board = rebuilt.board;
    game.turn  = rebuilt.turn;
    game.hands = rebuilt.hands;
    game.roles = rebuilt.roles;
    game.kifu  = rebuilt.kifu;

    
    // set lastMove for review highlight
    lastMove = null;
    if (c > 0){
      const rec = moves[c-1];
      if (rec){
        if (rec.type === "move") lastMove = { from: rec.from, to: rec.to };
        else if (rec.type === "drop") lastMove = { from: {r:-1,c:-1}, to: rec.to };
      }
    }
selected = null;
    selectedDrop = null;
    draw();
    updateKifuUI();
  }

  function recordMove(side, from, to, pieceAfter, capture){
    ensureKifu(game);
    if (game.kifu.cursor !== game.kifu.moves.length){
      game.kifu.moves = game.kifu.moves.slice(0, game.kifu.cursor);
    }
    game.kifu.moves.push({
      type:"move",
      side,
      from:{r:from.r, c:from.c},
      to:{r:to.r, c:to.c},
      pieceAfter,
      capture: capture || null
    });
    game.kifu.cursor = game.kifu.moves.length;
    updateKifuUI();
    if (kifuAutoEnabled) saveKifuToLocal();
  }

  function recordDrop(side, pieceKey, to){
    ensureKifu(game);
    if (game.kifu.cursor !== game.kifu.moves.length){
      game.kifu.moves = game.kifu.moves.slice(0, game.kifu.cursor);
    }
    game.kifu.moves.push({
      type:"drop",
      side,
      piece: pieceKey.toUpperCase(),
      to:{r:to.r, c:to.c}
    });
    game.kifu.cursor = game.kifu.moves.length;
    updateKifuUI();
    if (kifuAutoEnabled) saveKifuToLocal();
  }

  function exportKifuJSON(){
    ensureKifu(game);
    return JSON.stringify({
      format: "KiwamiShogiKifu",
      version: 1,
      room: currentRoom(),
      createdAt: new Date().toISOString(),
      initial: "standard",
      moves: game.kifu.moves || []
    }, null, 2);
  }

  function importKifuJSON(text){
    // tolerate pasted logs / timestamps / BOM etc.
    let t = (text || "").trim();

    // Strip UTF-8 BOM if present
    if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1).trim();

    // If user pasted with prefix (e.g., "2026/01/17 16:57 ...{json}")
    const firstObj = t.search(/[\{\[]/);
    if (firstObj > 0) t = t.slice(firstObj).trim();

    let obj = null;
    try{
      obj = JSON.parse(t);
    }catch(e){
      const msg = (e && e.message) ? e.message : "parse error";
      return { ok:false, msg:`JSONとして解析できません（${msg}）` };
    }

    // Accept formats:
    // 1) {moves:[...]}
    // 2) {kifu:{moves:[...]}}
    // 3) [...]  (array of records)
    let moves = null;
    if (Array.isArray(obj)) moves = obj;
    else if (obj && Array.isArray(obj.moves)) moves = obj.moves;
    else if (obj && obj.kifu && Array.isArray(obj.kifu.moves)) moves = obj.kifu.moves;

    if (!moves) return { ok:false, msg:"moves配列が見つかりません" };

    ensureKifu(game);
    game.kifu.moves = moves;
    game.kifu.cursor = moves.length;
    rebuildToCursor(game.kifu.cursor);
    return { ok:true, msg:`インポートOK（手数 ${moves.length}）` };
  }


  let myName = "guest";
  let mySide = null; // "S" or "G" is learned from your first move/drop


  function setStatus(t){ statusEl.textContent = t; }

  function updateKifuUI(){
    ensureKifu(game);
    const total = game.kifu.moves.length;
    const cur = game.kifu.cursor;
    if (kifuStep) kifuStep.textContent = `手数 ${cur} / ${total}`;
    if (btnKifuPrev) btnKifuPrev.disabled = (cur <= 0);
    if (btnKifuNext) btnKifuNext.disabled = (cur >= total);
  }

  function setTurnUI(){
    const base = (game.turn === "S") ? "先手" : "後手";
    const you = (mySide && game.turn === mySide) ? "（あなた）" : "";
    const t = base + you;
    turnText.textContent = `手番: ${t}`;
    handHintS.textContent = (game.turn === "S") ? "（手番なら選択できます）" : "";
    handHintG.textContent = (game.turn === "G") ? "（手番なら選択できます）" : "";
    const badge = document.getElementById("turnBadge");
    if (badge){
      badge.classList.remove("turnMine","turnOther");
      if (mySide){
        badge.classList.add((game.turn === mySide) ? "turnMine" : "turnOther");
      }
    }
  }

  function sideLabel(side){ return side === "S" ? "先手" : "後手"; }

  function isKingPiece(p){
    const b = basePiece(p);
    return b === "K" || b === "k";
  }

  function showWinPopup(winnerSide){
    // 王が取られた後は「勝ち」だけ表示（ブラウザalertは使わない）
    uiAlert(`${sideLabel(winnerSide)}の勝ち`);
  }

  // ---- 音（WebAudio） ----
  function buzz(ms=10){
    if(!vibrationEnabled) return;
    try{ if (navigator.vibrate) navigator.vibrate(ms); }catch{}
  }
  audioEnabled = (typeof audioEnabled === "boolean") ? audioEnabled : true;
  vibrationEnabled = (typeof vibrationEnabled === "boolean") ? vibrationEnabled : true;
  let audioCtx = null;
  function ensureAudioUnlocked(){
    if (!audioEnabled) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(()=>{});
  }

  window.ensureAudioUnlocked = ensureAudioUnlocked;

  // ---- Audio unlock on first user gesture (mobile autoplay restriction) ----
  (function(){
    const once = () => { try{ ensureAudioUnlocked(); }catch{}; window.removeEventListener("pointerdown", once, true); window.removeEventListener("touchstart", once, true); };
    window.addEventListener("pointerdown", once, true);
    window.addEventListener("touchstart", once, true);
  })();
  function beep(freq=440, dur=0.06, type="sine", gain=0.06){
    if (!audioEnabled) return;
    ensureAudioUnlocked();
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t0); o.stop(t0+dur+0.02);
  }
  const sfx = {
    move(side){ 
      // 先手/後手で音程を変える
      const f = (side === "G") ? 460 : 520;
      beep(f, 0.05, "square", 0.05); 
      buzz(8);
    },
    capture(side){ 
      const f1 = (side === "G") ? 210 : 220;
      const f2 = (side === "G") ? 170 : 180;
      beep(f1, 0.07, "triangle", 0.06); 
      beep(f2, 0.05, "triangle", 0.05); 
      buzz(15);
    },
    promote(side){ 
      const f1 = (side === "G") ? 700 : 740;
      const f2 = (side === "G") ? 930 : 980;
      beep(f1, 0.05, "sine", 0.05); 
      beep(f2, 0.06, "sine", 0.05); 
      buzz(10);
    },
    drop(side){ 
      const f = (side === "G") ? 390 : 430;
      beep(f, 0.06, "square", 0.05); 
      buzz(10);
    },
    chat(){ 
      beep(660, 0.04, "sine", 0.04); 
      buzz(6);
    }
  };

  btnSound.addEventListener("click", () => {
    audioEnabled = !audioEnabled;
    btnSound.textContent = audioEnabled ? "🔊 音: ON" : "🔇 音: OFF";
    if (audioEnabled) ensureAudioUnlocked();
  });

  function appendChat(user, text){
    const div = document.createElement("div");
    div.className = "msg";
    div.innerHTML = `<b>${esc(user)}</b> <span class="small" style="opacity:.7;margin-left:.35rem">${formatChatTime()}</span><div style="margin-top:2px">${esc(text)}</div>`;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  function appendSystem(text){
    const div = document.createElement("div");
    div.className = "msg";
    div.innerHTML = `<span class="small" style="opacity:.7;margin-right:.35rem">${formatChatTime()}</span><span class="small">${esc(text)}</span>`;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  function fmtDT(d=new Date()){
    // yyyy/mm/dd hh:mm
    const pad = (n)=>String(n).padStart(2,"0");
    return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function esc(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#39;");
  }
const escapeHtml = esc;
  window.escapeHtml = esc;
  window.fmtDT = fmtDT;


  function drawHands(){
    const s = game.hands.S || {};
    const g = game.hands.G || {};
    handS.innerHTML = "";
    handG.innerHTML = "";

    const render = (side, el) => {
      const h = side === "S" ? s : g;
      let any = false;

      for (const t of HAND_ORDER){
        const n = Number(h[t] || 0);
        if (n <= 0) continue;
        any = true;

        const chip = document.createElement("button");
        chip.className = "chip";
        chip.type = "button";
        chip.innerHTML = `<span>${HAND_LABEL[t]}</span><span class="cnt">×${n}</span>`;

        const isMyTurn = (game.turn === side);
        if (!isMyTurn){
          chip.classList.add("disabled");
          chip.disabled = true;
        } else {
          chip.addEventListener("click", () => {
            ensureAudioUnlocked();
            selected = null;
            if (selectedDrop && selectedDrop.side === side && selectedDrop.type === t) selectedDrop = null;
            else selectedDrop = { side, type: t };
            draw();
          });
        }

        if (selectedDrop && selectedDrop.side === side && selectedDrop.type === t) chip.classList.add("sel");
        el.appendChild(chip);
      }

      if (!any){
        const span = document.createElement("span");
        span.className = "small";
        span.textContent = "（なし）";
        el.appendChild(span);
      }
    };

const topSide = (mySide === "G") ? "S" : "G";      // 上に出す側＝相手
const botSide = (mySide === "G") ? "G" : "S";      // 下に出す側＝自分

render(botSide, handS);  // handS は「下の枠」に表示する箱として使う
render(topSide, handG);  // handG は「上の枠」に表示する箱として使う
  }

  function draw(){
    normalizeHands(game);
    normalizeRoles(game);
    setTurnUI();
    drawHands();

    boardEl.innerHTML = "";
    for (let vr=0; vr<9; vr++){
      for (let vc=0; vc<9; vc++){
        const povFlip = (mySide === "G");
        const r = povFlip ? (8 - vr) : vr;
        const c = povFlip ? (8 - vc) : vc;
        const p = game.board[r][c];
        const d = document.createElement("div");
        d.className =
          "cell" +
          (p && ((mySide === "G") ? isSente(p) : isGote(p)) ? " rev" : "") +
          (selected && selected.r===r && selected.c===c ? " sel" : "") +
          (lastMove && lastMove.from && lastMove.from.r===r && lastMove.from.c===c ? " lastFrom" : "") +
          (lastMove && lastMove.to   && lastMove.to.r===r   && lastMove.to.c===c   ? " lastTo"   : "")
          ;

        d.dataset.r = r;
        d.dataset.c = c;

        const pieceSpan = document.createElement("span");
        pieceSpan.className = "piece" + (p && isPromoted(p) ? " promoted" : "");
        pieceSpan.textContent = p ? (PIECE[p] || PIECE[basePiece(p)] || "") : "";
        d.appendChild(pieceSpan);

        const coord = document.createElement("span");
        coord.className = "coord";
        coord.textContent = `${9 - c}${r + 1}`;
        d.appendChild(coord);

        boardEl.appendChild(d);
      }
    }
  }

  // ---- 成り ----
  function inPromoZone(turn, r){
    if (turn === "S") return r <= 2;
    return r >= 6;
  }
  function canPromote(pieceBase){
    return !["K","G","k","g"].includes(pieceBase);
  }

  async function decidePromotionAsync(turn, piece, fromR, toR){
    if (!piece) return false;
    const base = basePiece(piece);
    if (!canPromote(base)) return false;
    if (!isPromotableMove(turn, piece, fromR, toR)) return false;
    if (isForcedPromotion(turn, piece, toR)) return true;
    // use in-page modal (no browser confirm)
    return await uiConfirm("成りますか？", "成る", "成らない");
  }

  function isPromotableMove(turn, piece, fromR, toR){
    if (!piece) return false;
    if (isPromoted(piece)) return false;
    const b = basePiece(piece);
    if (!canPromote(b)) return false;
    return inPromoZone(turn, fromR) || inPromoZone(turn, toR);
  }
  function isForcedPromotion(turn, piece, toR){
    const b = basePiece(piece).toUpperCase();
    if (b === "P" || b === "L"){
      return (turn === "S") ? (toR === 0) : (toR === 8);
    }
    if (b === "N"){
      return (turn === "S") ? (toR <= 1) : (toR >= 7);
    }
    return false;
  }
  function decidePromotion(turn, piece, fromR, toR){
    if (!isPromotableMove(turn, piece, fromR, toR)) return false;
    if (isForcedPromotion(turn, piece, toR)) return true;
    return window.confirm("成りますか？");
  }
  function applyPromotion(piece){
    if (!piece || isPromoted(piece)) return piece;
    return "+" + piece;
  }

  // ---- 持ち駒 ----
  function addToHand(side, capturedPiece){
    const b = basePiece(capturedPiece);
    const t = b.toUpperCase();
    game.hands[side][t] = Number(game.hands[side][t] || 0) + 1;
  }

  function canDropHere(side, type, r, c){
    if (game.board[r][c] != null) return false;

    // 行き所のない駒（最低限）
    if (type === "P" || type === "L"){
      if (side === "S" && r === 0) return false;
      if (side === "G" && r === 8) return false;
    }
    if (type === "N"){
      if (side === "S" && r <= 1) return false;
      if (side === "G" && r >= 7) return false;
    }

    // 二歩（最低限）
    if (type === "P"){
      for (let rr=0; rr<9; rr++){
        const p = game.board[rr][c];
        if (!p) continue;
        if (side === "S" && p === "P") return false;
        if (side === "G" && p === "p") return false;
      }
    }
    return true;
  }

  function dropPiece(side, type, r, c){
    if (!canDropHere(side, type, r, c)){
      appendSystem("その場所には打てません（空き/二歩/行き所なし）");
      return false;
    }
    const h = game.hands[side];
    if (Number(h[type] || 0) <= 0) return false;

    const piece = (side === "S") ? type : type.toLowerCase();
    game.board[r][c] = piece;
    h[type] = Number(h[type]) - 1;
    if (h[type] <= 0) delete h[type];
    return true;
  }

  
  function roleLabel(){ return mySide ? (mySide === "S" ? "（先手）" : "（後手）") : "（観戦）"; }

  function updateMySideFromRoles(){
    normalizeRoles(game);
    const rs = game.roles.S;
    const rg = game.roles.G;
    if (rs && rs.id === clientId) mySide = "S";
    else if (rg && rg.id === clientId) mySide = "G";
    else mySide = null;
  }

  async function claimRoleIfNeeded(){
    normalizeRoles(game);
    updateMySideFromRoles();

    // If already assigned, nothing to do
    if (mySide) { appendSystem(`あなたは${mySide==="S"?"先手":"後手"}です`); return; }

    const sTaken = !!game.roles.S;
    const gTaken = !!game.roles.G;

    // Both taken -> spectator
    if (sTaken && gTaken){
      appendSystem("この部屋は対局者が揃っています（観戦モード）");
      return;
    }

    // First entrant (none taken): choose
    if (!sTaken && !gTaken){
      const ok = await uiConfirm("先手で入りますか？", "先手", "後手");
      const side = ok ? "S" : "G";
      game.roles[side] = { id: clientId, name: myName };
      updateMySideFromRoles();
      appendSystem(`役割を確定：${side==="S"?"先手":"後手"}`);
      sendState();
      draw();
      return;
    }

    // One remaining: auto assign
    const side = sTaken ? "G" : "S";
    game.roles[side] = { id: clientId, name: myName };
    updateMySideFromRoles();
    appendSystem(`役割を確定：${side==="S"?"先手":"後手"}`);
    sendState();
    draw();
  }


  // ---- WS ----
  function currentRoom(){
    return (location.hash.match(/room=([a-zA-Z0-9_-]+)/)?.[1]) || "lobby";
  }

  function connect(){
    ensureAudioUnlocked();
    const room = currentRoom();
    myName = (nameEl.value || "guest").trim().slice(0, 24) || "guest";
    try{ localStorage.setItem("shogi_name", myName); }catch{}


    if (ws) { try{ ws.close(); }catch{} ws=null; }
    ws = new WebSocket(`${WORKER_WS}/?room=${encodeURIComponent(room)}`);
    gotState = false;

    ws.onopen = () => {
      setStatus(`接続中… room=${room}`);
      appendSystem(`接続しました（room=${room}）`);
      ws.send(JSON.stringify({ type:"join", user:myName, room, payload:"" }));
      // State restore is expected from server (途中参加で復元).
      // If not received shortly, publish our initial state (first entrant).
      setTimeout(() => {
        if (!gotState){
          sendState();
        }
      }, 250);

    };

    ws.onclose = () => { setStatus("切断されました"); appendSystem("切断されました"); };
    ws.onerror = () => { setStatus("接続エラー（URL/Worker状態を確認）"); appendSystem("接続エラー"); };

    ws.onmessage = (ev) => {
      let m; try{ m = JSON.parse(ev.data); }catch{ return; }

      if (m.type === "state" && m.payload && m.payload.board){
        gotState = true;

        // ★重要：サーバのstateは盤面同期用（棋譜はクライアント管理）
        // 自分の送信したstateも戻ってくるため、そのたびに game を作り直すと棋譜が消える。
        // → 受信前の棋譜を退避し、受信後に復元する（payloadに棋譜が無い前提）
        const prevKifu = (window.__KIWAMI_GAME && window.__KIWAMI_GAME.kifu)
          ? JSON.parse(JSON.stringify(window.__KIWAMI_GAME.kifu))
          : null;
        const prevGameId = (window.__KIWAMI_GAME && window.__KIWAMI_GAME.gameId) ? window.__KIWAMI_GAME.gameId : null;
        const prevStartedAt = (window.__KIWAMI_GAME && window.__KIWAMI_GAME.startedAt) ? window.__KIWAMI_GAME.startedAt : null;
        const prevFinishedAt = (window.__KIWAMI_GAME && window.__KIWAMI_GAME.finishedAt) ? window.__KIWAMI_GAME.finishedAt : null;
        const prevResult = (window.__KIWAMI_GAME && window.__KIWAMI_GAME.result) ? window.__KIWAMI_GAME.result : null;

        game = ensureKifu(normalizeRoles(normalizeHands(m.payload)));

        // 対局IDもクライアント側で保持（受信stateに無い場合がある）
        if (prevGameId && !game.gameId) game.gameId = prevGameId;
        if (prevStartedAt && !game.startedAt) game.startedAt = prevStartedAt;
        if (prevFinishedAt && !game.finishedAt) game.finishedAt = prevFinishedAt;
        if (prevResult && !game.result) game.result = prevResult;

        // 受信stateに棋譜が無い/空なら、退避した棋譜を復元
        try{
          if (prevKifu && (!game.kifu || !Array.isArray(game.kifu.moves) || game.kifu.moves.length === 0)){
            game.kifu = prevKifu;
          }
        }catch{}

        window.__KIWAMI_GAME = game;
        // ローカル棋譜があり、サーバ側が空なら自動読込（MVP）
        try{
          if (didAutoLoadKifu){
            // already attempted once
          } else if (suppressAutoLoadOnce){
            suppressAutoLoadOnce = false;
            didAutoLoadKifu = true;
          } else {
            ensureKifu(game);
            if ((game.kifu.moves||[]).length === 0){
              const r = loadKifuFromLocal();
              if (r.ok) appendSystem(r.msg);
            }
            didAutoLoadKifu = true;
          }
        }catch{} 
        updateMySideFromRoles();
        selected = null;
        selectedDrop = null;
        updateKifuUI();
        draw();
        // Role is decided on first join (choose/auto) and persisted in state
        claimRoleIfNeeded();
        return;
      }

      if ((m.type === "chat" || m.type === "msg") && (m.payload || m.text)){
        const text = (typeof m.payload === "string") ? m.payload : (m.text ?? "");
        const user = m.user || "anon";
        appendChat(user, text);
        sfx.chat();
        return;
      }
      if (m.type === "join"){ appendSystem(`${m.user || "anon"} が入室`); return; }
      if (m.type === "system"){ appendSystem(String(m.payload ?? "")); return; }
    };
  }

  function sendChat(){
    ensureAudioUnlocked();
    if (!ws || ws.readyState !== 1) return;
    const text = (chatInput.value || "").trim();
    if (!text) return;
    const room = currentRoom();
    ws.send(JSON.stringify({ type:"msg", user:myName, room, payload:text }));
    chatInput.value = "";
    sfx.chat();
  }

  function sendState(){
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify({ type:"state", room: currentRoom(), payload: game }));
  }

  boardEl.addEventListener("click", async (e) => {
    ensureAudioUnlocked();
    const cell = e.target.closest(".cell");
    if (!cell) return;
    if (!ws || ws.readyState !== 1) return;

    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);

    // 打ち優先
    if (selectedDrop){
      const side = selectedDrop.side;
      const type = selectedDrop.type;

      if (game.turn !== side){ appendSystem("手番ではありません"); return; }

      if (!dropPiece(side, type, r, c)) return;

      // 棋譜に記録（自動取得ONならローカル保存も走る）
      recordDrop(side, type, { r, c });

      lastMove = { from: { r: -1, c: -1 }, to: { r, c } };
      selectedDrop = null;
      selected = null;
      moverSide = game.turn;
      game.turn = (game.turn === "S") ? "G" : "S";
      draw();
      sendState();
      sfx.drop(moverSide);
      return;
    }

    // 通常の選択/移動
    if (!selected){
      const p = game.board[r][c];
      if (!p) return;

      const isS = (game.turn === "S");
      if (isS && !isSente(p)) return;
      if (!isS && !isGote(p)) return;

      selected = {r,c};
      draw();
      return;
    }

    const from = selected;
    let piece = game.board[from.r][from.c];
    if (!piece){ selected=null; draw(); return; }
    const dest = game.board[r][c];
    if (dest && toSide(dest) === game.turn){ selected=null; draw(); return; }

    // 先に成り判定（盤面を動かす前に確認する：駒が消えないように）
    const promote = await decidePromotionAsync(game.turn, piece, from.r, r);
    if (promote) piece = applyPromotion(piece);

    let didCapture = false;
    if (dest){
      didCapture = true;
      if (isKingPiece(dest)){
        // Capture king -> game over (show only)
        showWinPopup(game.turn);
        // 対局終了として棋譜を確定保存
        finalizeCurrentGame("win");
        // Do not add king to hand
      } else {
        addToHand(game.turn, dest);
      }
    }

    game.board[from.r][from.c] = null;
    game.board[r][c] = piece;
// 棋譜に記録（自動取得ONならローカル保存も走る）
    const captureForKifu = (dest && !isKingPiece(dest)) ? dest : null;
    recordMove(game.turn, from, { r, c }, piece, captureForKifu);

    lastMove = { from: { r: from.r, c: from.c }, to: { r, c } };
    selected = null;
    moverSide = game.turn;
    game.turn = (game.turn === "S") ? "G" : "S";
    draw();
    sendState();

    if (didCapture) sfx.capture(moverSide); else sfx.move(moverSide);
    if (promote) sfx.promote(moverSide);
  });

  // UI
  btnConnect.addEventListener("click", connect);
  btnCopyUrl.addEventListener("click", async () => {
    const room = currentRoom();
    const url = `${location.origin}${location.pathname}#room=${room}`;
    try{ await navigator.clipboard.writeText(url); appendSystem("部屋をコピーしました"); }
    catch{ appendSystem("コピーに失敗（ブラウザ権限）"); }
  });
  btnFull.addEventListener("click", async () => {
    try{
      ensureAudioUnlocked();
      const el = document.documentElement;
      if (!document.fullscreenElement){
        if (el.requestFullscreen) await el.requestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
      }
    }catch{}
  });

  btnChatToggle.addEventListener("click", () => {
    document.body.classList.toggle("chatOpen");
  });

  btnKifuDelete.addEventListener("click", async () => {
    if (!(await uiConfirm("ローカルの棋譜ファイルを削除しますか？", "削除", "やめる"))) return;
    deleteKifuLocal();
    ensureKifu(game);
    game.kifu.moves = [];
    game.kifu.cursor = 0;
    rebuildToCursor(0);
    if (ws && ws.readyState === 1){
      ws.send(JSON.stringify({ type:"state", room: currentRoom(), payload: game }));
    }
    appendSystem("棋譜ファイルを削除しました");
  });

  btnKifuImport.addEventListener("click", () => {
    const res = importKifuJSON(kifuText.value || "");
    appendSystem(res.msg);
    if (res.ok){
      // インポートした棋譜はローカルにも保存（以後のレビューに利用）
      saveKifuToLocal();
    }
    if (ws && ws.readyState === 1){
      ws.send(JSON.stringify({ type:"state", room: currentRoom(), payload: game }));
    }
  });
  btnKifuPrev.addEventListener("click", () => {
    ensureKifu(game);
    rebuildToCursor(game.kifu.cursor - 1);
  });
  btnKifuNext.addEventListener("click", () => {
    ensureKifu(game);
    rebuildToCursor(game.kifu.cursor + 1);
  });

btnReset.addEventListener("click", () => {
  ensureAudioUnlocked();
  // --- reset UI state ---
  lastMove = null;        // ★ 強調表示を消す
  selected = null;        // ★ 選択中の駒を解除
  selectedDrop = null;    // ★ 持ち駒選択を解除

  suppressAutoLoadOnce = true;
  didAutoLoadKifu = true;

  startNewGame();
  draw();
  sendState();
});


  btnSend.addEventListener("click", sendChat);
  chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });

  draw();
})();

  // ---- Mobile Menu (Settings / Kifu) ----
  const mobileDrawer = document.getElementById("mobileDrawer");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const tabSettings = document.getElementById("tabSettings");
  const tabKifu = document.getElementById("tabKifu");
  const btnDrawerClose = document.getElementById("btnDrawerClose");
  const drawerSettings = document.getElementById("drawerSettings");
  const drawerKifu = document.getElementById("drawerKifu");
  const drawerKifuHost = document.getElementById("drawerKifuHost");
  const kifuDock = document.getElementById("kifuDock");
  const kifuPanel = document.getElementById("kifuPanel");

  function drawerOpen(section){
    mobileDrawer.style.display = "block";
    mobileDrawer.setAttribute("aria-hidden","false");
    drawerSwitch(section);
  }
  function drawerClose(){
    mobileDrawer.style.display = "none";
    mobileDrawer.setAttribute("aria-hidden","true");
  }
  function drawerSwitch(section){
    drawerSettings.classList.toggle("active", section==="settings");
    drawerKifu.classList.toggle("active", section==="kifu");

    const isMobile = window.matchMedia("(max-width: 1100px)").matches ||
                     window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (isMobile){
      if (kifuPanel && drawerKifuHost && kifuPanel.parentElement !== drawerKifuHost){
        drawerKifuHost.appendChild(kifuPanel);
      }
    } else {
      if (kifuPanel && kifuDock){
        // restore right after placeholder (desktop layout)
        kifuDock.insertAdjacentElement("afterend", kifuPanel);
      }
      drawerClose();
    }
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", ()=>drawerOpen("settings"));
  if (btnDrawerClose) btnDrawerClose.addEventListener("click", drawerClose);
  if (mobileDrawer) mobileDrawer.addEventListener("click", (e)=>{ if(e.target===mobileDrawer) drawerClose(); });
  if (tabSettings) tabSettings.addEventListener("click", ()=>drawerSwitch("settings"));
  if (tabKifu) tabKifu.addEventListener("click", ()=>drawerSwitch("kifu"));
  window.addEventListener("resize", ()=>drawerSwitch(drawerSettings.classList.contains("active")?"settings":"kifu"));

  // ---- Settings (sound/vibration) ----
  const LS_SETTINGS_KEY = "kiwami_settings_v1";
  function loadSettings(){
    try{ return JSON.parse(localStorage.getItem(LS_SETTINGS_KEY) || "{}"); }catch{ return {}; }
  }
  function saveSettings(){
    try{ localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify({audioEnabled, vibrationEnabled})); }catch{}
  }

  const chkAudio = document.getElementById("chkAudio");
  const chkVibe  = document.getElementById("chkVibe");
  const s0 = loadSettings();
  if (typeof s0.audioEnabled === "boolean") audioEnabled = s0.audioEnabled;
  if (typeof s0.vibrationEnabled === "boolean") vibrationEnabled = s0.vibrationEnabled;
  if (chkAudio) chkAudio.checked = !!audioEnabled;
  if (chkVibe)  chkVibe.checked  = !!vibrationEnabled;

  if (chkAudio) chkAudio.addEventListener("change", ()=>{
    audioEnabled = chkAudio.checked;
    if (audioEnabled) ensureAudioUnlocked();
    saveSettings();
  });
  if (chkVibe) chkVibe.addEventListener("change", ()=>{
    vibrationEnabled = chkVibe.checked;
    saveSettings();
  });


// --- AI Review Logic ---
const btnAiReview = document.getElementById("btnAiReview");
// ★★TODO ※任意コメント: aiResultModal は現状未使用（安全のためクリック時に毎回 getElementById し直している）

const aiResultModal = document.getElementById("aiResultModal");
const aiResultBody = document.getElementById("aiResultBody");
const esc = window.escapeHtml || function(s){
  const map = { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" };
  return String(s).replace(/[&<>"']/g, (c)=>map[c]||c);
};


// Close AI modal when clicking backdrop
(function(){
  const m = document.getElementById("aiResultModal");
  if (m){
    m.addEventListener("click", (e)=>{ if(e.target===m) m.style.display="none"; });
  }
})();

// Close AI modal when clicking close button
(function(){
  const btn = document.getElementById("btnAiResultClose");
  const m = document.getElementById("aiResultModal");
  if (btn && m){
    btn.addEventListener("click", ()=>{ m.style.display = "none"; });
  }
})();

if (btnAiReview) {
  btnAiReview.addEventListener("click", async () => {
    // 棋譜が空なら止める
    const g = window.__KIWAMI_GAME;

    // モーダル要素はDOM構築後に存在する前提だが、環境によって null になることがあるため毎回取得
    const modal = document.getElementById("aiResultModal");
    const body = document.getElementById("aiResultBody");
    if (!modal || !body) {
      // モーダルが無い場合は最低限の通知で継続
      if (window.uiAlert) await window.uiAlert("AI結果表示エリアが見つかりません（aiResultModal/aiResultBody）");
      else alert("AI結果表示エリアが見つかりません（aiResultModal/aiResultBody）");
      return;
    }
    if (!g || !g.kifu || !Array.isArray(g.kifu.moves) || g.kifu.moves.length === 0) {
      if (window.uiAlert) await window.uiAlert("棋譜がありません。少し指してから実行してください。");
      else alert("棋譜がありません。少し指してから実行してください。");
      return;
    }

    // UI表示
    modal.style.display = "block";
    body.innerHTML = `<div class="ai-loading">🤖 AIが思考中...<br><span class="small">※30秒ほどかかる場合があります</span></div>`;

    try {
      // 1. 棋譜データの整形（AIが読みやすいように軽量化）
      const kifuExport = {
        moves: g.kifu.moves.map(m => {
          if (m.type === "move") return { s:m.side, f:m.from, t:m.to, p:m.pieceAfter };
          if (m.type === "drop") return { s:m.side, d:m.piece, t:m.to };
          return m;
        })
      };

      // 2. AI呼び出し（既存の関数を利用）
      const result = await reviewWithAI(kifuExport);
// TODOデバック
console.log("[AI] result typeof=", typeof result, "value=", result);
console.log("[AI] typeof=", typeof result);
console.log("[AI] length=", (result || "").length);
console.log("[AI] tail=", (result || "").slice(-200));
      // 3. 結果のレンダリング
      renderAiResult(result);

    } catch (e) {
      console.error(e);
      body.innerHTML = `<div style="color:#ff8888">エラーが発生しました。<br>${e.message}</div>`;
    }
  });
}

// AI結果をHTMLに変換して表示
function renderAiResult(resultText) {
  const body = document.getElementById("aiResultBody") || aiResultBody;
  if (!body) return;

  const text = String(resultText || "").trim();
  body.innerHTML = `
    <div class="ai-section">
      <h2>🤖 AI検討結果</h2>
      <pre class="ai-pre">${esc(text || "（結果が空です）")}</pre>
    </div>
  `;
}

function parseAiSections(text) {
  // 見出し候補（多少ブレても拾う）
  const keys = [
    { key: "summary",  labels: ["■ 総評"] },
    { key: "good",     labels: ["■ 良い手", "■ 良い手（最大3つ）"] },
    { key: "bad",      labels: ["■ 疑問手・改善点", "■ 疑問手", "■ 改善点"] },
    { key: "endgame",  labels: ["■ 終盤のポイント", "■ 終盤"] },
  ];

  // まず行単位にして、見出し行でスプリット
  const lines = String(text || "").split(/\r?\n/);

  let cur = null;
  const buf = { summary: [], good: [], bad: [], endgame: [] };

  for (const line of lines) {
    const trimmed = line.trim();

    // 見出し判定
    const hit = keys.find(k => k.labels.some(l => trimmed.startsWith(l)));
    if (hit) {
      cur = hit.key;
      continue;
    }

    if (cur && trimmed.length) buf[cur].push(line);
  }

  const join = (arr) => arr.join("\n").trim();

  return {
    summary: join(buf.summary),
    good: join(buf.good),
    bad: join(buf.bad),
    endgame: join(buf.endgame),
  };
}


async function callHermes(prompt, model="hermes-2-pro-mistral-7b") {
  return  await callAI(prompt, model);
}
async function callGemini(prompt, model="gemini-2.5-flash") {
  return  await callAI(prompt, model);
}
async function callAI(prompt, model) {
  const base = (window.AI_HTTP || location.origin).replace(/\/$/, "");
  const endpoint = `${base}/ai/cf`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // ★ worker側でmodel使わない.セキュリティ面考慮
    body: JSON.stringify({ prompt }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`[AI] HTTP ${res.status}: ${raw || "(empty body)"}`);
  }
  if (!raw || !raw.trim()) {
    throw new Error(`[AI] Empty response body (HTTP ${res.status})`);
  }
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`[AI] Invalid JSON response: ${raw.slice(0, 400)}`);
  }
  if (!json.ok) {
    throw new Error(json?.error ? `[AI] ${json.error}` : `[AI] Unknown error: ${raw.slice(0,400)}`);
  }
  // ok:true の text が空のときも検知
  if (!json.text || !String(json.text).trim()) {
    throw new Error(`[AI] Empty 'text' in JSON response: ${raw.slice(0,400)}`);
  }

  return json.text;
}


function extractJsonObject(s) {
  const str = String(s || "");
  const i = str.indexOf("{");
  const j = str.lastIndexOf("}");
  if (i === -1 || j === -1 || j <= i) {
    throw new Error(`[AI] JSON object not found in response: ${str.slice(0, 400)}`);
  }
  return str.slice(i, j + 1);
}

async function reviewWithAI(kifuJson) {
  const prompt = `
あなたは「将棋（日本将棋）」の検討役です。
対象は将棋のみ。チェスの概念は混ぜないでください。

【禁止事項（必ず守る）】
- チェス用語を一切使わない（例: promotion, knight, bishop, rook, queen, king, check, checkmate, castling）。
- 「プロモーション」「ナイト」などチェス由来の日本語も禁止。
- 駒は将棋の呼称だけを使う（歩/香/桂/銀/金/角/飛/玉、成駒は と/成香/成桂/成銀/馬/龍）。

【表現ルール】
- 「白」「黒」禁止。必ず「先手」「後手」で表現する。
- 手数は「○手目」と書く。可能なら「▲」「△」も併記してよい。
- 盤面評価は数値不要。理由と方針を言語化する。

【出力フォーマット（必ず守る）】
■ 総評（6〜8行）
■ 良い手（3つ）
・○手目（先手/後手）：良かった理由（将棋的理由）
■ 疑問手・改善案（3つ）
・○手目（先手/後手）：何が問題か
　→ 改善案：代わりの指し方（1案）
■ 終盤のポイント（6〜8行）
■ 次に意識すること（3つ、箇条書き）

【重要】
- 全体で800〜1200字程度で書く（短すぎる出力は禁止）。
- 途中で文章を切らず、最後まで出力する。

【棋譜（JSON）】
${JSON.stringify(kifuJson)}
`.trim();

  const text = await callHermes(prompt);
  return String(text || "").trim();
}

// チャットの日付
function formatChatTime(ts){
  const d = new Date(ts || Date.now());
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MM}/${DD} ${hh}:${mm}`; // 年なし
}