(() => {
  'use strict';

  // =========================================================
  // Route Editor (plugin) - IIFE, exposes window.RouteEditor
  // Spec focus: robustness, Pointer Events, no worldmap.js surgery
  // =========================================================

  const HISTORY_MAX = 50;
  const SNAP_METERS_DEFAULT = 20; // within 20m, snap to reference route

  const log = (...a) => console.log('[RouteEditor]', ...a);

  const toast = (msg) => {
    if (typeof window.showToast === 'function') return window.showToast(msg);
    log(msg);
  };

  const safeT = (k, fallback) => {
    try {
      if (window.SRWorldMap && typeof window.SRWorldMap.t === 'function') return window.SRWorldMap.t(k);
    } catch (_) {}
    return fallback ?? k;
  };

  const getMap = () => {
    if (!window.SRWorldMap || typeof window.SRWorldMap.getMap !== 'function') return null;
    return window.SRWorldMap.getMap();
  };

  // ---------- DOM helpers ----------
  const $ = (id) => document.getElementById(id);

  const ui = {
    btnStart: () => $('btnREStart'),
    btnUndo: () => $('btnREUndo'),
    btnReset: () => $('btnREReset'),
    btnFinish: () => $('btnREFinish'),
    btnExport: () => $('btnREExport'),
    chkRef: () => $('chkRERef'),
    chkSnap: () => $('chkRESnap'),
    chkEdit: () => $('chkREEdit'),
    rngTol: () => $('rngRESimplify'),
    lblTol: () => $('lblRETol'),
    inpName: () => $('inpREName'),
    inpNote: () => $('inpRENote'),
    reResult: () => $('reResult'),
    reBreakdown: () => $('reBreakdown'),
  };

  // ---------- State ----------
  const state = {
    map: null,
    container: null,
    drawingArmed: false, // Start pressed
    isPointerDrawing: false, // pointerdown active
    pointerId: null,
    points: /** @type {L.LatLng[]} */ ([]),
    history: /** @type {L.LatLng[][]} */ ([]),

    line: null, // blue
    refLine: null, // red (leaflet polyline)
    refLatLngs: /** @type {L.LatLng[]} */ ([]),

    vertexMarkers: /** @type {L.Marker[]} */ ([]),

    prevMapInteract: null,
  };

  // ---------- Utilities ----------
  function pushHistory(snapshot) {
    const snap = (snapshot ?? state.points).map(p => L.latLng(p.lat, p.lng));
    state.history.push(snap);
    if (state.history.length > HISTORY_MAX) state.history.shift();
  }

  function setPoints(pts) {
    state.points = pts.map(p => L.latLng(p.lat, p.lng));
    redrawLine();
    refreshVertexMarkers();
    updatePreview();
  }

  function redrawLine() {
    if (!state.map) return;
    if (!state.line) {
      state.line = L.polyline([], { color: '#1e88e5', weight: 5, opacity: 0.95 });
      state.line.addTo(state.map);
    }
    state.line.setLatLngs(state.points);
  }

  function updatePreview() {
    const el = ui.reResult();
    const bd = ui.reBreakdown();
    if (!el || !bd) return;

    if (state.points.length < 2) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    bd.textContent = `points: ${state.points.length}`;
  }

  function getActiveRouteLatLngsFromGeoJSON(geo) {
    try {
      if (!geo) return [];
      // Expect FeatureCollection with LineString somewhere
      const features = geo.type === 'FeatureCollection' ? geo.features : [geo];
      for (const f of features) {
        if (!f || !f.geometry) continue;
        if (f.geometry.type === 'LineString') {
          return f.geometry.coordinates.map(c => L.latLng(c[1], c[0]));
        }
        if (f.geometry.type === 'MultiLineString') {
          // take longest line (most points)
          const lines = f.geometry.coordinates;
          let best = lines[0] || [];
          for (const ln of lines) if ((ln?.length || 0) > (best?.length || 0)) best = ln;
          return best.map(c => L.latLng(c[1], c[0]));
        }
      }
    } catch (e) {
      console.warn('[RouteEditor] failed to parse ref geojson', e);
    }
    return [];
  }

  function refreshReferenceRoute() {
    if (!state.map) return;
    const want = !!ui.chkRef()?.checked;

    let refGeo = null;
    try {
      refGeo = window.SRWorldMap?.getActiveRouteGeoJSON?.() ?? null;
    } catch (_) {}

    state.refLatLngs = getActiveRouteLatLngsFromGeoJSON(refGeo);

    if (!want || state.refLatLngs.length < 2) {
      if (state.refLine) {
        state.refLine.remove();
        state.refLine = null;
      }
      return;
    }

    if (!state.refLine) {
      state.refLine = L.polyline([], { color: '#e53935', weight: 4, opacity: 0.85 });
      state.refLine.addTo(state.map);
    }
    state.refLine.setLatLngs(state.refLatLngs);
  }

  function snapIfNeeded(latlng) {
    const snapOn = !!ui.chkSnap()?.checked;
    if (!snapOn) return latlng;
    if (!state.refLatLngs || state.refLatLngs.length < 2) return latlng;

    const snapped = closestPointOnPolyline(latlng, state.refLatLngs);
    if (!snapped) return latlng;

    const d = state.map.distance(latlng, snapped);
    if (d <= SNAP_METERS_DEFAULT) return snapped;
    return latlng;
  }

  // Compute closest point on polyline (latlng) by scanning segments and projecting in a local meter plane.
  function closestPointOnPolyline(p, latlngs) {
    if (!state.map) return null;
    let best = null;
    let bestD = Infinity;

    // local meter projection around point p
    const lat0 = p.lat * Math.PI / 180;
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(lat0);

    const px = p.lng * mPerDegLng;
    const py = p.lat * mPerDegLat;

    for (let i = 0; i < latlngs.length - 1; i++) {
      const a = latlngs[i], b = latlngs[i + 1];
      const ax = a.lng * mPerDegLng, ay = a.lat * mPerDegLat;
      const bx = b.lng * mPerDegLng, by = b.lat * mPerDegLat;

      const vx = bx - ax, vy = by - ay;
      const wx = px - ax, wy = py - ay;

      const vv = vx * vx + vy * vy;
      if (vv === 0) continue;

      let t = (wx * vx + wy * vy) / vv;
      t = Math.max(0, Math.min(1, t));
      const cx = ax + t * vx, cy = ay + t * vy;

      const dx = px - cx, dy = py - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD) {
        bestD = d2;
        best = L.latLng(cy / mPerDegLat, cx / mPerDegLng);
      }
    }
    return best;
  }

  // Douglas-Peucker simplify in meters (local plane)
  function simplifyLatLngs(latlngs, toleranceMeters) {
    if (!latlngs || latlngs.length <= 2) return latlngs;

    // project to local meters around first point for stability
    const lat0 = latlngs[0].lat * Math.PI / 180;
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(lat0);

    const pts = latlngs.map(ll => ({ x: ll.lng * mPerDegLng, y: ll.lat * mPerDegLat, ll }));

    const keep = new Array(pts.length).fill(false);
    keep[0] = keep[pts.length - 1] = true;

    function distPointToSeg(p, a, b) {
      const vx = b.x - a.x, vy = b.y - a.y;
      const wx = p.x - a.x, wy = p.y - a.y;
      const vv = vx * vx + vy * vy;
      if (vv === 0) return Math.hypot(p.x - a.x, p.y - a.y);
      let t = (wx * vx + wy * vy) / vv;
      t = Math.max(0, Math.min(1, t));
      const cx = a.x + t * vx, cy = a.y + t * vy;
      return Math.hypot(p.x - cx, p.y - cy);
    }

    function dp(i0, i1) {
      let maxD = -1;
      let idx = -1;
      const a = pts[i0], b = pts[i1];
      for (let i = i0 + 1; i < i1; i++) {
        const d = distPointToSeg(pts[i], a, b);
        if (d > maxD) { maxD = d; idx = i; }
      }
      if (maxD > toleranceMeters && idx !== -1) {
        keep[idx] = true;
        dp(i0, idx);
        dp(idx, i1);
      }
    }

    dp(0, pts.length - 1);

    return pts.filter((_, i) => keep[i]).map(p => p.ll);
  }

  // ---------- Vertex editing ----------
  function clearVertexMarkers() {
    for (const m of state.vertexMarkers) m.remove();
    state.vertexMarkers = [];
  }

  function refreshVertexMarkers() {
    const on = !!ui.chkEdit()?.checked;
    if (!state.map) return;

    clearVertexMarkers();
    if (!on) return;
    if (state.points.length < 2) return;

    for (let i = 0; i < state.points.length; i++) {
      const ll = state.points[i];
      const isStart = (i === 0);
      const isEnd = (i === state.points.length - 1);

      const marker = L.circleMarker(ll, {
        radius: 7,
        color: isStart ? '#2e7d32' : isEnd ? '#c62828' : '#1565c0',
        weight: 3,
        fillColor: '#fff',
        fillOpacity: 0.9
      });

      // CircleMarker isn't draggable by default; use a Marker with DivIcon for drag robustness
      const div = L.divIcon({
        className: 'sr-re-vertex ' + (isStart ? 'sr-re-start' : isEnd ? 'sr-re-end' : 'sr-re-mid'),
        iconSize: [14, 14]
      });
      const dragMarker = L.marker(ll, { icon: div, draggable: true, zIndexOffset: 1000 });

      dragMarker.on('dragstart', () => pushHistory());
      dragMarker.on('drag', (e) => {
        const nll = e.target.getLatLng();
        state.points[i] = nll;
        redrawLine();
      });
      dragMarker.on('dragend', () => {
        redrawLine();
        updatePreview();
        refreshVertexMarkers(); // re-render (keeps start/end coloring consistent)
      });

      dragMarker.addTo(state.map);
      state.vertexMarkers.push(dragMarker);
    }
  }

  // ---------- Map interaction lock ----------
  function disableMapInteractions() {
    if (!state.map) return;
    state.prevMapInteract = {
      dragging: state.map.dragging.enabled(),
      touchZoom: state.map.touchZoom.enabled(),
      doubleClickZoom: state.map.doubleClickZoom.enabled(),
      scrollWheelZoom: state.map.scrollWheelZoom.enabled(),
      boxZoom: state.map.boxZoom.enabled(),
      keyboard: state.map.keyboard.enabled(),
      tap: state.map.tap ? state.map.tap.enabled() : null,
    };
    state.map.dragging.disable();
    state.map.touchZoom.disable();
    state.map.doubleClickZoom.disable();
    state.map.scrollWheelZoom.disable();
    state.map.boxZoom.disable();
    state.map.keyboard.disable();
    if (state.map.tap) state.map.tap.disable();
  }

  function restoreMapInteractions() {
    if (!state.map || !state.prevMapInteract) return;
    const p = state.prevMapInteract;
    if (p.dragging) state.map.dragging.enable(); else state.map.dragging.disable();
    if (p.touchZoom) state.map.touchZoom.enable(); else state.map.touchZoom.disable();
    if (p.doubleClickZoom) state.map.doubleClickZoom.enable(); else state.map.doubleClickZoom.disable();
    if (p.scrollWheelZoom) state.map.scrollWheelZoom.enable(); else state.map.scrollWheelZoom.disable();
    if (p.boxZoom) state.map.boxZoom.enable(); else state.map.boxZoom.disable();
    if (p.keyboard) state.map.keyboard.enable(); else state.map.keyboard.disable();
    if (state.map.tap) {
      if (p.tap) state.map.tap.enable(); else state.map.tap.disable();
    }
    state.prevMapInteract = null;
  }

  // ---------- Pointer drawing ----------
  function addPoint(latlng) {
    const ll = snapIfNeeded(latlng);
    const last = state.points[state.points.length - 1];
    if (last) {
      const d = state.map.distance(last, ll);
      if (d < 2) return; // 2m threshold to avoid over-sampling
    }
    state.points.push(ll);
    redrawLine();
  }

  function onPointerDown(e) {
    if (!state.drawingArmed) return;
    if (!state.container) return;

    state.isPointerDrawing = true;
    state.pointerId = e.pointerId;
    try { state.container.setPointerCapture(state.pointerId); } catch (_) {}

    disableMapInteractions();

    const latlng = state.map.mouseEventToLatLng(e);
    if (state.points.length === 0) pushHistory([]); // initial history base
    addPoint(latlng);

    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!state.isPointerDrawing) return;
    if (state.pointerId !== null && e.pointerId !== state.pointerId) return;
    const latlng = state.map.mouseEventToLatLng(e);
    addPoint(latlng);
    e.preventDefault();
  }

  function endPointerDraw(e) {
    if (!state.isPointerDrawing) return;
    if (state.pointerId !== null && e.pointerId !== state.pointerId) return;

    state.isPointerDrawing = false;
    try { state.container.releasePointerCapture(state.pointerId); } catch (_) {}
    state.pointerId = null;

    restoreMapInteractions();
    updatePreview();
    e.preventDefault();
  }

  function bindPointerEvents() {
    if (!state.container) return;
    // Avoid double binding
    if (state.container.__srRouteEditorBound) return;
    state.container.__srRouteEditorBound = true;

    state.container.addEventListener('pointerdown', onPointerDown, { passive: false });
    state.container.addEventListener('pointermove', onPointerMove, { passive: false });
    state.container.addEventListener('pointerup', endPointerDraw, { passive: false });
    state.container.addEventListener('pointercancel', endPointerDraw, { passive: false });
  }

  // ---------- Actions ----------
  function start() {
    state.drawingArmed = true;
    toast(safeT('re_msg_draw', '描画モード：地図を押しながらなぞってください'));
  }

  function stop() {
    state.drawingArmed = false;
    state.isPointerDrawing = false;
    state.pointerId = null;
    restoreMapInteractions();
    clearVertexMarkers();
  }

  function reset() {
    pushHistory();
    setPoints([]);
  }

  function finish() {
    state.drawingArmed = false;
    state.isPointerDrawing = false;
    state.pointerId = null;
    restoreMapInteractions();
    updatePreview();
    toast(safeT('re_msg_finish', '確定しました'));
  }

  function undo() {
    if (state.history.length > 0) {
      const prev = state.history.pop();
      setPoints(prev);
      return;
    }
    if (state.points.length > 0) {
      state.points.pop();
      redrawLine();
      refreshVertexMarkers();
      updatePreview();
    }
  }

  function applySimplify() {
    const tol = Number(ui.rngTol()?.value ?? 15);
    if (state.points.length < 3) return;
    pushHistory();
    const simplified = simplifyLatLngs(state.points, tol);
    setPoints(simplified);
    toast(safeT('re_msg_simplified', '簡略化しました'));
  }

  function exportGeoJSON() {
    if (state.points.length < 2) {
      toast(safeT('re_msg_need2', '点が足りません（2点以上）'));
      return;
    }

    const name = ui.inpName()?.value?.trim() || 'Route';
    const note = ui.inpNote()?.value?.trim() || '';

    const feature = {
      type: 'Feature',
      properties: {
        name,
        note,
        createdAt: new Date().toISOString(),
        source: 'SamuraiRoad RouteEditor'
      },
      geometry: {
        type: 'LineString',
        coordinates: state.points.map(ll => [ll.lng, ll.lat])
      }
    };

    const fc = { type: 'FeatureCollection', features: [feature] };
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^\w\-]+/g, '_') || 'route'}.geojson`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(safeT('re_msg_export', 'GeoJSONをダウンロードしました'));
  }

  function wireUI() {
    ui.btnStart()?.addEventListener('click', start);
    ui.btnUndo()?.addEventListener('click', undo);
    ui.btnReset()?.addEventListener('click', reset);
    ui.btnFinish()?.addEventListener('click', finish);
    ui.btnExport()?.addEventListener('click', exportGeoJSON);

    ui.chkRef()?.addEventListener('change', () => refreshReferenceRoute());
    ui.chkSnap()?.addEventListener('change', () => {}); // no-op; checked in snapIfNeeded
    ui.chkEdit()?.addEventListener('change', () => refreshVertexMarkers());

    ui.rngTol()?.addEventListener('input', () => {
      const v = Number(ui.rngTol()?.value ?? 15);
      if (ui.lblTol()) ui.lblTol().textContent = `${v}m`;
    });
    $('btnRESimplify')?.addEventListener('click', applySimplify);
  }

  function refreshUI() {
    state.map = getMap();
    if (!state.map) {
      toast('SRWorldMap.getMap() not found');
      return;
    }
    state.container = state.map.getContainer();
    bindPointerEvents();
    refreshReferenceRoute();
    redrawLine();
    updatePreview();
    refreshVertexMarkers();

    // update tolerance label
    const v = Number(ui.rngTol()?.value ?? 15);
    if (ui.lblTol()) ui.lblTol().textContent = `${v}m`;
  }

  // ---------- init ----------
  function initOnce() {
    // Wait for map readiness (worldmap.js is defer; but plugins may load after)
    const timer = setInterval(() => {
      const map = getMap();
      if (!map) return;
      clearInterval(timer);
      state.map = map;
      state.container = map.getContainer();
      bindPointerEvents();
      wireUI();
      refreshUI();
      log('initialized');
    }, 200);
    setTimeout(() => clearInterval(timer), 8000);
  }

  window.RouteEditor = {
    refreshUI,
    start,
    stop,
  };

  initOnce();
})();