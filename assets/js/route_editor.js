(() => {
  "use strict";

  // Route Editor (plugin module)
  // - Build an accurate LineString by tracing on the map
  // - Export to GeoJSON (FeatureCollection)
  const state = {
    enabled: false,
    drawing: false,
    finished: false,
    snap: false,
    showRef: true,
    allowPanZoom: false, // (future)
    points: [],
    line: null,
    refLine: null,
    refLatLngs: [],
    refLenM: 0,
    hudEl: null,
    crossEl: null
  };

  function toast(msg) {
    try { if (typeof window.showToast === "function") window.showToast(msg); else console.log("[RouteEditor]", msg); }
    catch { console.log("[RouteEditor]", msg); }
  }

  function requireWorldMap() {
    if (!window.SRWorldMap || !window.SRWorldMap.getMap) {
      toast("WorldMap APIが見つかりません");
      return null;
    }
    return window.SRWorldMap;
  }

  // ---- geometry utils (meters) ----
  function rad(d) { return (d * Math.PI) / 180; }

  function approxMeters(a, b) {
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

  function closestPointOnSegment(p, a, b) {
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

    // back to lat/lng (approx)
    const lng = (cx / (6371008.8 * Math.cos(lat0))) * (180 / Math.PI);
    const lat = (cy / 6371008.8) * (180 / Math.PI);
    const dist = Math.hypot(px - cx, py - cy);
    return { lat, lng, dist };
  }

  function snapToPolyline(p, line) {
    if (!line || line.length < 2) return { ...p, dist: Infinity };
    let best = { lat: p.lat, lng: p.lng, dist: Infinity };
    for (let i = 1; i < line.length; i++) {
      const c = closestPointOnSegment(p, line[i - 1], line[i]);
      if (c.dist < best.dist) best = c;
    }
    return best;
  }

  // ---- reference extraction (use current route layer) ----
  function extractLineLatLngs(routeGeoJSON) {
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

    if (routeGeoJSON.type === "FeatureCollection") routeGeoJSON.features.forEach((f) => walkGeom(f.geometry));
    else if (routeGeoJSON.type === "Feature") walkGeom(routeGeoJSON.geometry);
    else walkGeom(routeGeoJSON);

    let best = null, bestLen = -1;
    for (const l of lines) {
      const len = polylineLengthM(l);
      if (len > bestLen) { bestLen = len; best = l; }
    }
    return best || [];
  }

  function ensureReference() {
    const wm = requireWorldMap();
    if (!wm) return false;

    const route = wm.getActiveRouteGeoJSON();
    if (!route) {
      // reference is optional; editor can still work without it
      state.refLatLngs = [];
      if (state.refLine) state.refLine.remove();
      state.refLine = null;
      document.getElementById("reRefName").textContent = "--";
      return true;
    }

    state.refLatLngs = extractLineLatLngs(route);
    state.refLenM = polylineLengthM(state.refLatLngs);

    const map = wm.getMap();
    if (state.refLine) state.refLine.remove();
    state.refLine = L.polyline(state.refLatLngs.map(p => [p.lat, p.lng]), { color: "#cc0000", weight: 5, opacity: 0.75 });

    const refName = document.getElementById("lblCurrentRoute")?.textContent || "--";
    document.getElementById("reRefName").textContent = refName;

    if (document.getElementById("chkRERef")?.checked) state.refLine.addTo(map);
    return true;
  }

  // ---- map interaction control ----
  function lockMapInteractions(lock) {
    const wm = requireWorldMap();
    if (!wm) return;
    const map = wm.getMap();
    if (!map) return;

    const shouldLock = lock; // no pan/zoom while drawing (safety)

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

  function ensureLayers() {
    const wm = requireWorldMap();
    if (!wm) return;
    const map = wm.getMap();
    if (!state.line) {
      state.line = L.polyline([], { color: "#0066cc", weight: 5, opacity: 0.95 }).addTo(map);
    }
  }

  function setStatus(text) {
    const el = document.getElementById("reStatus");
    if (el) el.textContent = text;
  }

  function updatePreview() {
    const len = polylineLengthM(state.points);
    const count = state.points.length;
    const snap = document.getElementById("chkRESnap")?.checked ? "ON" : "OFF";
    const ref = document.getElementById("chkRERef")?.checked ? "ON" : "OFF";
    const breakdown =
`Points: ${count}
Length: ${(len/1000).toFixed(2)} km
Snap: ${snap}
Ref: ${ref}`;

    document.getElementById("reResult").style.display = "block";
    document.getElementById("reBreakdown").textContent = breakdown;
  }

  function reset() {
    ensureLayers();
    state.points = [];
    state.finished = false;
    state.drawing = false;
    state.line.setLatLngs([]);
    setStatus("Ready");
    updatePreview();
  }

  function undo() {
    if (state.points.length === 0) return;
    state.points.pop();
    state.line.setLatLngs(state.points.map(p => [p.lat, p.lng]));
    updatePreview();
  }

  function finish() {
    if (state.points.length < 2) { toast("点が少なすぎます"); return; }
    state.finished = true;
    state.drawing = false;
    lockMapInteractions(false);
    setStatus("Finished");
    updatePreview();
    toast("Finish：確定しました（Exportで書き出せます）");
  }

  function exportGeoJSON() {
    if (state.points.length < 2) { toast("点が少なすぎます"); return; }

    const name = (document.getElementById("inpREName")?.value || "").trim() || "Route";
    const note = (document.getElementById("inpRENote")?.value || "").trim() || "";
    const coords = state.points.map(p => [p.lng, p.lat]);

    const fc = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name,
            note,
            createdAt: new Date().toISOString(),
            source: "SamuraiRoad RouteEditor"
          },
          geometry: { type: "LineString", coordinates: coords }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = name.replace(/[^\w\-ぁ-んァ-ン一-龥]+/g, "_");
    a.href = url;
    a.download = `${safe || "route"}.geojson`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast("GeoJSONを書き出しました");
  }

  // ---- drawing via Pointer Events on map container ----
  function bindPointer() {
    const wm = requireWorldMap();
    const map = wm?.getMap?.();
    if (!map || !map.getContainer) return;

    const el = map.getContainer();
    let isDown = false;

    const addPoint = (ev) => {
      const ll = map.mouseEventToLatLng(ev);
      let p = { lat: ll.lat, lng: ll.lng };

      const doSnap = !!document.getElementById("chkRESnap")?.checked;
      if (doSnap && state.refLatLngs.length >= 2) {
        const s = snapToPolyline(p, state.refLatLngs);
        // snap only when within 20m
        if (s.dist <= 20) p = { lat: s.lat, lng: s.lng };
      }

      const last = state.points[state.points.length - 1];
      if (last && approxMeters(last, p) < 3) return; // 3m threshold
      state.points.push(p);
      state.line.setLatLngs(state.points.map(x => [x.lat, x.lng]));
    };

    el.addEventListener("pointerdown", (ev) => {
      if (!state.enabled || !state.drawing || state.finished) return;
      if (ev.isPrimary === false) return;

      isDown = true;
      try { el.setPointerCapture(ev.pointerId); } catch {}
      addPoint(ev);
      updatePreview();
    }, { passive: false });

    el.addEventListener("pointermove", (ev) => {
      if (!state.enabled || !state.drawing || state.finished) return;
      if (!isDown) return;
      addPoint(ev);
    }, { passive: false });

    const end = (ev) => {
      if (!isDown) return;
      isDown = false;
      try { el.releasePointerCapture(ev.pointerId); } catch {}
      updatePreview();
      setStatus("Draw paused（Finish/Export可）");
    };

    el.addEventListener("pointerup", end, { passive: true });
    el.addEventListener("pointercancel", end, { passive: true });
    el.addEventListener("pointerleave", (ev) => { if (isDown) end(ev); }, { passive: true });
  }

  function start() {
    state.enabled = true;
    state.drawing = true;
    state.finished = false;

    ensureReference();
    ensureLayers();

    lockMapInteractions(true);
    setStatus("Drawing...");
    toast("描画開始：地図上を押しながらなぞってください");
  }

  function stop() {
    state.drawing = false;
    state.enabled = false;
    lockMapInteractions(false);
  }

  function refreshUI() {
    ensureReference();
    ensureLayers();

    // fill initial values
    document.getElementById("reStatus").textContent = "Ready";
    if (document.getElementById("reRefName")?.textContent.trim() === "") {
      document.getElementById("reRefName").textContent = "--";
    }
    updatePreview();
  }

  function bindUI() {
    const startBtn = document.getElementById("btnREStart");
    const undoBtn  = document.getElementById("btnREUndo");
    const resetBtn = document.getElementById("btnREReset");
    const finishBtn= document.getElementById("btnREFinish");
    const exportBtn= document.getElementById("btnREExport");
    const chkRef   = document.getElementById("chkRERef");

    if (startBtn) startBtn.onclick = () => start();
    if (undoBtn)  undoBtn.onclick  = () => undo();
    if (resetBtn) resetBtn.onclick = () => reset();
    if (finishBtn)finishBtn.onclick= () => finish();
    if (exportBtn)exportBtn.onclick= () => exportGeoJSON();

    if (chkRef) chkRef.onchange = () => {
      const wm = requireWorldMap();
      const map = wm?.getMap?.();
      if (!map || !state.refLine) return;
      if (chkRef.checked) state.refLine.addTo(map);
      else state.refLine.remove();
      updatePreview();
    };

    const chkSnap = document.getElementById("chkRESnap");
    if (chkSnap) chkSnap.onchange = () => updatePreview();

    reset(); // init
    bindPointer();
  }

  window.RouteEditor = { refreshUI, start, stop };

  window.addEventListener("DOMContentLoaded", () => {
    bindUI();
  });

})();
