(() => {
  "use strict";

  // -----------------------------
  // Trace Game (plugin module)
  // -----------------------------
  const STORE_PREFIX = "sr_trace_best_";

  const state = {
    enabled: false,
    drawing: false,
    hint: true,
    allowPanZoom: false,
    playerLatLngs: [],
    playerLine: null,
    refLine: null,
    refLatLngs: [],
    refLenM: 0,
    hudEl: null,
    crossEl: null,
    startAt: 0
  };

  function toast(msg) {
    try {
      if (typeof window.showToast === "function") window.showToast(msg);
      else console.log("[TraceGame]", msg);
    } catch {
      console.log("[TraceGame]", msg);
    }
  }

  function requireWorldMap() {
    if (!window.SRWorldMap || !window.SRWorldMap.getMap) {
      toast("WorldMap APIが見つかりません");
      return null;
    }
    return window.SRWorldMap;
  }

  function ensureHud() {
    const wm = requireWorldMap();
    if (!wm) return;

    const map = wm.getMap();
    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    if (!state.hudEl) {
      const hud = document.createElement("div");
      hud.className = "trace-hud";
      hud.id = "traceHud";
      hud.innerHTML = `<div><b>Trace</b> <span class="muted" id="traceHudMode">--</span></div>
        <div class="muted" id="traceHudSub">--</div>`;
      mapEl.parentElement.appendChild(hud);
      state.hudEl = hud;
    }
    if (!state.crossEl) {
      const cross = document.createElement("div");
      cross.className = "trace-crosshair";
      cross.id = "traceCrosshair";
      mapEl.parentElement.appendChild(cross);
      state.crossEl = cross;
    }
  }

  // ---- geometry utils (meters) ----
  function rad(d) { return (d * Math.PI) / 180; }

  function approxMeters(a, b) {
    // a,b: {lat,lng}
    // equirectangular approximation (fast, good enough for scoring)
    const lat = rad((a.lat + b.lat) / 2);
    const dx = rad(b.lng - a.lng) * 6371008.8 * Math.cos(lat);
    const dy = rad(b.lat - a.lat) * 6371008.8;
    return Math.hypot(dx, dy);
  }

  function polylineLengthM(latlngs) {
    let s = 0;
    for (let i = 1; i < latlngs.length; i++) s += approxMeters(latlngs[i - 1], latlngs[i]);
    return s;
  }

  function closestDistPointToSegmentM(p, a, b) {
    // project in local meters
    const lat0 = rad((a.lat + b.lat + p.lat) / 3);
    const mx = (lng) => rad(lng) * 6371008.8 * Math.cos(lat0);
    const my = (lat) => rad(lat) * 6371008.8;

    const px = mx(p.lng), py = my(p.lat);
    const ax = mx(a.lng), ay = my(a.lat);
    const bx = mx(b.lng), by = my(b.lat);

    const abx = bx - ax, aby = by - ay;
    const apx = px - ax, apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    const t = ab2 === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const cx = ax + abx * t, cy = ay + aby * t;
    return Math.hypot(px - cx, py - cy);
  }

  function minDistPointToPolylineM(p, line) {
    if (line.length < 2) return Infinity;
    let best = Infinity;
    for (let i = 1; i < line.length; i++) {
      const d = closestDistPointToSegmentM(p, line[i - 1], line[i]);
      if (d < best) best = d;
    }
    return best;
  }

  function sampleLineByStepM(latlngs, stepM) {
    if (latlngs.length < 2) return [];
    const out = [latlngs[0]];
    let carry = 0;
    for (let i = 1; i < latlngs.length; i++) {
      let a = latlngs[i - 1];
      let b = latlngs[i];
      let seg = approxMeters(a, b);
      if (seg <= 0) continue;

      let distFromA = stepM - carry;
      while (distFromA < seg) {
        const t = distFromA / seg;
        out.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
        distFromA += stepM;
      }
      carry = (carry + seg) % stepM;
      out.push(b);
    }
    // de-dup
    const cleaned = [out[0]];
    for (let i = 1; i < out.length; i++) {
      if (approxMeters(cleaned[cleaned.length - 1], out[i]) > 2) cleaned.push(out[i]); // >2m
    }
    return cleaned;
  }

  // ---- reference route extraction ----
  function extractLineLatLngs(routeGeoJSON) {
    // expects Feature or FeatureCollection from Leaflet layer.toGeoJSON()
    const lines = [];
    const pushCoords = (coords) => {
      const latlngs = coords.map((c) => ({ lng: c[0], lat: c[1] }));
      if (latlngs.length >= 2) lines.push(latlngs);
    };

    const walkGeom = (geom) => {
      if (!geom) return;
      if (geom.type === "LineString") pushCoords(geom.coordinates);
      else if (geom.type === "MultiLineString") geom.coordinates.forEach(pushCoords);
    };

    if (routeGeoJSON.type === "FeatureCollection") {
      routeGeoJSON.features.forEach((f) => walkGeom(f.geometry));
    } else if (routeGeoJSON.type === "Feature") {
      walkGeom(routeGeoJSON.geometry);
    } else {
      walkGeom(routeGeoJSON);
    }

    // choose the longest line as "target"
    let best = null;
    let bestLen = -1;
    for (const l of lines) {
      const len = polylineLengthM(l);
      if (len > bestLen) { bestLen = len; best = l; }
    }
    return best || [];
  }

  function updateUIBasics() {
    const wm = requireWorldMap();
    if (!wm) return;

    const rid = wm.getCurrentRouteId() || "route";
    const best = localStorage.getItem(STORE_PREFIX + rid);
    document.getElementById("traceBestScore").textContent = best ? `${best}` : "--";

    // name comes from top bar if available; fallback
    const name = document.getElementById("lblCurrentRoute")?.textContent || "--";
    document.getElementById("traceTargetName").textContent = name;
  }

  function setHintVisible(visible) {
    const wm = requireWorldMap();
    if (!wm) return;
    const map = wm.getMap();

    // we show/hide our own refLine (not the existing route layer) to avoid touching core
    if (state.refLine) {
      if (visible) state.refLine.addTo(map);
      else state.refLine.remove();
    }
  }

  function ensureReference() {
    const wm = requireWorldMap();
    if (!wm) return false;

    const route = wm.getActiveRouteGeoJSON();
    if (!route) {
      toast("先に「探す」から街道（ルート）を読み込んでください");
      return false;
    }

    state.refLatLngs = extractLineLatLngs(route);
    if (state.refLatLngs.length < 2) {
      toast("お題ルートのラインが見つかりません");
      return false;
    }
    state.refLenM = polylineLengthM(state.refLatLngs);

    const map = wm.getMap();
    if (state.refLine) state.refLine.remove();
    state.refLine = L.polyline(state.refLatLngs.map(p => [p.lat, p.lng]), { color: "#cc0000", weight: 5, opacity: 0.75 });
    if (document.getElementById("chkTraceHint")?.checked) state.refLine.addTo(map);

    // Fit on first load (gentle)
    const b = wm.getActiveRouteBounds?.();
    if (b) map.fitBounds(b, { padding: [50, 50] });

    return true;
  }

  function setHud(mode, sub) {
    ensureHud();
    if (!state.hudEl) return;
    state.hudEl.style.display = state.enabled ? "block" : "none";
    state.crossEl.style.display = (state.enabled && state.drawing && !state.allowPanZoom) ? "block" : "none";
    const modeEl = document.getElementById("traceHudMode");
    const subEl = document.getElementById("traceHudSub");
    if (modeEl) modeEl.textContent = mode || "--";
    if (subEl) subEl.textContent = sub || "--";
  }

  function lockMapInteractions(lock) {
    const wm = requireWorldMap();
    if (!wm) return;
    const map = wm.getMap();
    if (!map) return;

    const allow = state.allowPanZoom;
    const shouldLock = lock && !allow;

    if (shouldLock) {
      map.dragging.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      if (map.touchZoom) map.touchZoom.disable();
      if (map.tap) map.tap.disable();
    } else {
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      if (map.touchZoom) map.touchZoom.enable();
      if (map.tap) map.tap.enable();
    }
  }

  function clearPlayer() {
    const wm = requireWorldMap();
    if (!wm) return;
    const map = wm.getMap();

    state.playerLatLngs = [];
    if (state.playerLine) state.playerLine.remove();
    state.playerLine = L.polyline([], { color: "#0066cc", weight: 5, opacity: 0.9 }).addTo(map);

    document.getElementById("traceResult").style.display = "none";
    document.getElementById("traceScore").textContent = "--";
    document.getElementById("traceBreakdown").textContent = "--";
    setHud("Ready", "指でなぞってください（Start）");
  }

  function start() {
    if (!ensureReference()) return;

    state.enabled = true;
    state.drawing = true;
    state.hint = !!document.getElementById("chkTraceHint")?.checked;
    state.allowPanZoom = !!document.getElementById("chkTracePanZoom")?.checked;

    ensureHud();
    setHintVisible(state.hint);
    lockMapInteractions(true);

    if (!state.playerLine) clearPlayer();
    state.startAt = Date.now();
    setHud("Drawing", "指を押しながら線を引く → 離して止める");
    toast("なぞり開始");
  }

  function stop() {
    state.drawing = false;
    state.enabled = false;
    lockMapInteractions(false);
    setHud("--", "--");
    setHintVisible(!!document.getElementById("chkTraceHint")?.checked);
  }

  function onPointerDown(e) {
    if (!state.enabled || !state.drawing) return;
    if (state.allowPanZoom) return; // allow map interactions; drawing disabled

    const wm = requireWorldMap();
    if (!wm) return;
    const map = wm.getMap();

    const latlng = map.mouseEventToLatLng(e.originalEvent);
    state.playerLatLngs = [ { lat: latlng.lat, lng: latlng.lng } ];
    state.playerLine.setLatLngs([[latlng.lat, latlng.lng]]);
    setHud("Drawing", "線を引いて…");
  }

  function onPointerMove(e) {
    if (!state.enabled || !state.drawing) return;
    if (state.allowPanZoom) return;

    const wm = requireWorldMap();
    if (!wm) return;
    const map = wm.getMap();

    if (!state.playerLatLngs || state.playerLatLngs.length === 0) return;

    const latlng = map.mouseEventToLatLng(e.originalEvent);
    const p = { lat: latlng.lat, lng: latlng.lng };

    // throttle: add point only if moved > 3m
    const last = state.playerLatLngs[state.playerLatLngs.length - 1];
    if (approxMeters(last, p) < 3) return;

    state.playerLatLngs.push(p);
    state.playerLine.setLatLngs(state.playerLatLngs.map(x => [x.lat, x.lng]));

    const len = polylineLengthM(state.playerLatLngs);
    setHud("Drawing", `描画: ${(len/1000).toFixed(2)} km`);
  }

  function onPointerUp() {
    if (!state.enabled || !state.drawing) return;
    if (state.allowPanZoom) return;
    setHud("Paused", "Scoreで採点 / Resetでやり直し");
  }

  function score() {
    if (!ensureReference()) return;

    if (!state.playerLatLngs || state.playerLatLngs.length < 2) {
      toast("線が短すぎます");
      return;
    }

    // sample both lines
    const refSamples = sampleLineByStepM(state.refLatLngs, 30);  // 30m step
    const playerSamples = sampleLineByStepM(state.playerLatLngs, 20); // 20m step

    const THRESH_M = 25; // within 25m considered "covered"
    const dists = refSamples.map(p => minDistPointToPolylineM(p, playerSamples));
    const covered = dists.filter(d => d <= THRESH_M).length / Math.max(1, dists.length);

    // robust avg: median
    const sorted = [...dists].sort((a,b)=>a-b);
    const med = sorted.length ? sorted[Math.floor(sorted.length/2)] : 9999;

    const playerLen = polylineLengthM(state.playerLatLngs);
    const extraRatio = Math.max(0, (playerLen / Math.max(1, state.refLenM)) - 1);

    // score formula
    let score = 100 * covered - 0.6 * med - 25 * extraRatio;
    score = Math.max(0, Math.min(100, score));

    // UI update
    document.getElementById("traceResult").style.display = "block";
    document.getElementById("traceScore").textContent = score.toFixed(1);

    const breakdown =
`Coverage: ${(covered*100).toFixed(1)}% (≤${THRESH_M}m)
Median error: ${med.toFixed(1)} m
Your length: ${(playerLen/1000).toFixed(2)} km / Target: ${(state.refLenM/1000).toFixed(2)} km
Extra-length penalty: ${(extraRatio*100).toFixed(1)}%`;

    document.getElementById("traceBreakdown").textContent = breakdown;

    // store best
    const wm = requireWorldMap();
    const rid = wm?.getCurrentRouteId?.() || "route";
    const key = STORE_PREFIX + rid;
    const prev = parseFloat(localStorage.getItem(key) || "NaN");
    if (!Number.isFinite(prev) || score > prev) {
      localStorage.setItem(key, score.toFixed(1));
      document.getElementById("traceBestScore").textContent = score.toFixed(1);
      toast("自己ベスト更新！");
    } else {
      toast("採点しました");
    }

    setHud("Scored", `Score: ${score.toFixed(1)} / Best: ${localStorage.getItem(key) || "--"}`);
  }

  function bindUI() {
    // buttons
    const s = document.getElementById("btnTraceStart");
    const r = document.getElementById("btnTraceReset");
    const sub = document.getElementById("btnTraceSubmit");
    const hint = document.getElementById("chkTraceHint");
    const pan = document.getElementById("chkTracePanZoom");

    if (s) s.onclick = () => start();
    if (r) r.onclick = () => { if (!ensureReference()) return; state.enabled = true; ensureHud(); lockMapInteractions(true); clearPlayer(); };
    if (sub) sub.onclick = () => score();

    if (hint) hint.onchange = () => setHintVisible(!!hint.checked);
    if (pan) pan.onchange = () => { state.allowPanZoom = !!pan.checked; lockMapInteractions(true); setHud(state.drawing ? "Drawing" : "Ready", state.allowPanZoom ? "地図操作ON（描画OFF）" : "描画ON"); };

    // map pointer hooks (Leaflet)
    const wm = requireWorldMap();
    const map = wm?.getMap?.();
    if (map) {
      map.on("mousedown", onPointerDown);
      map.on("mousemove", onPointerMove);
      map.on("mouseup", onPointerUp);

      map.on("touchstart", onPointerDown);
      map.on("touchmove", onPointerMove);
      map.on("touchend", onPointerUp);
    }
  }

  function refreshUI() {
    updateUIBasics();
    // do not auto-start; just ensure reference when opening modal so hint works
    ensureReference();
    ensureHud();
    clearPlayer();
    state.enabled = false;
    state.drawing = false;
    lockMapInteractions(false);
    setHintVisible(!!document.getElementById("chkTraceHint")?.checked);
  }

  // Public API
  window.TraceGame = {
    refreshUI,
    start,
    stop
  };

  // init after DOM ready
  window.addEventListener("DOMContentLoaded", () => {
    bindUI();
  });

})();
