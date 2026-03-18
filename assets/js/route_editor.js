(() => {
  'use strict';

  // =========================================================
  // Route Editor (plugin) - IIFE, exposes window.RouteEditor
  // Spec focus: robustness, Pointer Events, no worldmap.js surgery
  // =========================================================

  const HISTORY_MAX = 50;
  const SNAP_METERS_DEFAULT = 20; // within 20m, snap to reference route

  const log = (...args) => console.log('[RouteEditor]', ...args);

  const toast = (msg) => {
    if (typeof window.showToast === 'function') {
      return window.showToast(msg);
    }
    log(msg);
  };

  const safeT = (key, fallback) => {
    try {
      if (window.SRWorldMap && typeof window.SRWorldMap.t === 'function') {
        return window.SRWorldMap.t(key);
      }
    } catch (_) {}
    return fallback ?? key;
  };

  const getMap = () => {
    if (!window.SRWorldMap || typeof window.SRWorldMap.getMap !== 'function') {
      return null;
    }
    return window.SRWorldMap.getMap();
  };

  const $ = (id) => document.getElementById(id);

  const ui = {
    btnStart: () => $('btnREStart'),
    btnReset: () => $('btnREReset'),
    btnFinish: () => $('btnREFinish'),
    btnSimplify: () => $('btnRESimplify'),
    btnConfirmBar: () => $('btnREConfirm'),
    btnUndoBar: () => $('btnREUndoBar'),
    btnResetBar: () => $('btnREResetBar'),
    btnCancelBar: () => $('btnRECancel'),
    drawBar: () => $('reDrawBar'),
    chkRef: () => $('chkRERef'),
    chkSnap: () => $('chkRESnap'),
    chkEdit: () => $('chkREEdit'),
    rngTol: () => $('rngRESimplify'),
    lblTol: () => $('lblRETol'),
    inpName: () => $('inpREName'),
    inpNote: () => $('inpRENote'),
    reResult: () => $('reResult'),
    reBreakdown: () => $('reBreakdown'),
    status: () => $('routeEditStatus'),
    drawBarTitle: () => $('reDrawBarTitle'),
    drawBarHint: () => $('reDrawBarHint'),
    chkPanBar: () => $('chkREPanBar'),
    importButton: () => $('btnREImport'),
    importFile: () => $('inpREImportFile'),
    modal: () => $('modalRouteEdit'),
  };

  const state = {
    map: null,
    container: null,
    drawingArmed: false,
    isPointerDrawing: false,
    pointerId: null,
    points: /** @type {L.LatLng[]} */ ([]),
    history: /** @type {L.LatLng[][]} */ ([]),
    line: null,
    refLine: null,
    refLatLngs: /** @type {L.LatLng[]} */ ([]),
    vertexMarkers: /** @type {L.Marker[]} */ ([]),
    prevMapInteract: null,
  };

  function updateDrawBarGuide() {
    const title = ui.drawBarTitle();
    const hint = ui.drawBarHint();
    const pan = isPanWhileDrawingEnabled();

    if (title) {
      title.textContent = pan ? '✋ 地図移動モード' : '✏️ ルート作成中';
    }
    if (hint) {
      hint.textContent = pan
        ? '地図を動かせます。線を引くときはチェックをOFFにしてください。'
        : '地図を押したままなぞって線を引きます。地図を動かしたいときはチェックをONにしてください。';
    }
  }

  function showDrawBar() {
    ui.drawBar()?.style.setProperty('display', 'block');
    updateDrawBarGuide();
  }

  function hideDrawBar() {
    ui.drawBar()?.style.setProperty('display', 'none');
  }

  function openRouteEditModal() {
    const modal = ui.modal();
    if (!modal) return;

    if (typeof window.openModal === 'function') {
      window.openModal('modalRouteEdit');
      return;
    }

    modal.classList.remove('minimized');
    modal.classList.add('open');
  }

  function isPanWhileDrawingEnabled() {
    return !!ui.chkPanBar()?.checked;
  }

  function setPanMode(enabled) {
    const chk = ui.chkPanBar();
    if (chk) {
      chk.checked = !!enabled;
    }

    if (!state.map) return;

    if (enabled) {
      restoreMapInteractions();
    }

    updateDrawBarGuide();
  }

  function updateDrawingStateUI() {
    const statusEl = ui.status();
    if (!statusEl) {
      return;
    }

    statusEl.textContent = state.drawingArmed
      ? safeT('re_status_drawing', '描画中です')
      : safeT('re_status_idle', '描画前です');
  }

  function pushHistory(snapshot) {
    const snap = (snapshot ?? state.points).map((p) => L.latLng(p.lat, p.lng));
    state.history.push(snap);
    if (state.history.length > HISTORY_MAX) {
      state.history.shift();
    }
  }

  function setPoints(points) {
    state.points = points.map((p) => L.latLng(p.lat, p.lng));
    redrawLine();
    refreshVertexMarkers();

  }

  function redrawLine() {
    if (!state.map) {
      return;
    }

    if (!state.line) {
      state.line = L.polyline([], {
        color: '#1e88e5',
        weight: 5,
        opacity: 0.95,
      });
      state.line.addTo(state.map);
    }

    state.line.setLatLngs(state.points);
  }

  function getActiveRouteLatLngsFromGeoJSON(geo) {
    try {
      if (!geo) {
        return [];
      }

      const features = geo.type === 'FeatureCollection' ? geo.features : [geo];
      for (const feature of features) {
        if (!feature || !feature.geometry) {
          continue;
        }

        if (feature.geometry.type === 'LineString') {
          return feature.geometry.coordinates.map((c) => L.latLng(c[1], c[0]));
        }

        if (feature.geometry.type === 'MultiLineString') {
          const lines = feature.geometry.coordinates;
          let best = lines[0] || [];
          for (const line of lines) {
            if ((line?.length || 0) > (best?.length || 0)) {
              best = line;
            }
          }
          return best.map((c) => L.latLng(c[1], c[0]));
        }
      }
    } catch (e) {
      console.warn('[RouteEditor] failed to parse ref geojson', e);
    }

    return [];
  }

  function refreshReferenceRoute() {
    if (!state.map) {
      return;
    }

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
      state.refLine = L.polyline([], {
        color: '#e53935',
        weight: 4,
        opacity: 0.85,
      });
      state.refLine.addTo(state.map);
    }

    state.refLine.setLatLngs(state.refLatLngs);
  }

  function closestPointOnPolyline(point, latlngs) {
    if (!state.map) {
      return null;
    }

    let best = null;
    let bestDistance = Infinity;

    const lat0 = (point.lat * Math.PI) / 180;
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(lat0);

    const px = point.lng * mPerDegLng;
    const py = point.lat * mPerDegLat;

    for (let i = 0; i < latlngs.length - 1; i += 1) {
      const a = latlngs[i];
      const b = latlngs[i + 1];

      const ax = a.lng * mPerDegLng;
      const ay = a.lat * mPerDegLat;
      const bx = b.lng * mPerDegLng;
      const by = b.lat * mPerDegLat;

      const vx = bx - ax;
      const vy = by - ay;
      const wx = px - ax;
      const wy = py - ay;
      const vv = vx * vx + vy * vy;

      if (vv === 0) {
        continue;
      }

      let t = (wx * vx + wy * vy) / vv;
      t = Math.max(0, Math.min(1, t));

      const cx = ax + t * vx;
      const cy = ay + t * vy;
      const dx = px - cx;
      const dy = py - cy;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < bestDistance) {
        bestDistance = distanceSquared;
        best = L.latLng(cy / mPerDegLat, cx / mPerDegLng);
      }
    }

    return best;
  }

  function snapIfNeeded(latlng) {
    const snapOn = !!ui.chkSnap()?.checked;
    if (!snapOn || !state.refLatLngs || state.refLatLngs.length < 2) {
      return latlng;
    }

    const snapped = closestPointOnPolyline(latlng, state.refLatLngs);
    if (!snapped) {
      return latlng;
    }

    const distance = state.map.distance(latlng, snapped);
    return distance <= SNAP_METERS_DEFAULT ? snapped : latlng;
  }

  function simplifyLatLngs(latlngs, toleranceMeters) {
    if (!latlngs || latlngs.length <= 2) {
      return latlngs;
    }

    const lat0 = (latlngs[0].lat * Math.PI) / 180;
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(lat0);

    const projected = latlngs.map((ll) => ({
      x: ll.lng * mPerDegLng,
      y: ll.lat * mPerDegLat,
      ll,
    }));

    const keep = new Array(projected.length).fill(false);
    keep[0] = true;
    keep[projected.length - 1] = true;

    function distPointToSeg(p, a, b) {
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const wx = p.x - a.x;
      const wy = p.y - a.y;
      const vv = vx * vx + vy * vy;

      if (vv === 0) {
        return Math.hypot(p.x - a.x, p.y - a.y);
      }

      let t = (wx * vx + wy * vy) / vv;
      t = Math.max(0, Math.min(1, t));

      const cx = a.x + t * vx;
      const cy = a.y + t * vy;
      return Math.hypot(p.x - cx, p.y - cy);
    }

    function dp(i0, i1) {
      let maxDistance = -1;
      let idx = -1;
      const a = projected[i0];
      const b = projected[i1];

      for (let i = i0 + 1; i < i1; i += 1) {
        const distance = distPointToSeg(projected[i], a, b);
        if (distance > maxDistance) {
          maxDistance = distance;
          idx = i;
        }
      }

      if (maxDistance > toleranceMeters && idx !== -1) {
        keep[idx] = true;
        dp(i0, idx);
        dp(idx, i1);
      }
    }

    dp(0, projected.length - 1);
    return projected.filter((_, i) => keep[i]).map((p) => p.ll);
  }

  function clearVertexMarkers() {
    for (const marker of state.vertexMarkers) {
      marker.remove();
    }
    state.vertexMarkers = [];
  }

  function refreshVertexMarkers() {
    const on = !!ui.chkEdit()?.checked;
    if (!state.map) {
      return;
    }

    clearVertexMarkers();
    if (!on || state.points.length < 2) {
      return;
    }

    for (let i = 0; i < state.points.length; i += 1) {
      const latlng = state.points[i];
      const isStart = i === 0;
      const isEnd = i === state.points.length - 1;

      const div = L.divIcon({
        className: `sr-re-vertex ${isStart ? 'sr-re-start' : isEnd ? 'sr-re-end' : 'sr-re-mid'}`,
        iconSize: [14, 14],
      });

      const dragMarker = L.marker(latlng, {
        icon: div,
        draggable: true,
        zIndexOffset: 1000,
      });

      dragMarker.on('dragstart', () => pushHistory());
      dragMarker.on('drag', (e) => {
        state.points[i] = e.target.getLatLng();
        redrawLine();
      });
      dragMarker.on('dragend', () => {
        redrawLine();
        refreshVertexMarkers();
      });

      dragMarker.addTo(state.map);
      state.vertexMarkers.push(dragMarker);
    }
  }

  function disableMapInteractions() {
    if (!state.map) {
      return;
    }

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
    if (state.map.tap) {
      state.map.tap.disable();
    }
  }

  function restoreMapInteractions() {
    if (!state.map || !state.prevMapInteract) {
      return;
    }

    const prev = state.prevMapInteract;

    if (prev.dragging) state.map.dragging.enable();
    else state.map.dragging.disable();

    if (prev.touchZoom) state.map.touchZoom.enable();
    else state.map.touchZoom.disable();

    if (prev.doubleClickZoom) state.map.doubleClickZoom.enable();
    else state.map.doubleClickZoom.disable();

    if (prev.scrollWheelZoom) state.map.scrollWheelZoom.enable();
    else state.map.scrollWheelZoom.disable();

    if (prev.boxZoom) state.map.boxZoom.enable();
    else state.map.boxZoom.disable();

    if (prev.keyboard) state.map.keyboard.enable();
    else state.map.keyboard.disable();

    if (state.map.tap) {
      if (prev.tap) state.map.tap.enable();
      else state.map.tap.disable();
    }

    state.prevMapInteract = null;
  }

  function addPoint(latlng) {
    const point = snapIfNeeded(latlng);
    const last = state.points[state.points.length - 1];

    if (last) {
      const distance = state.map.distance(last, point);
      if (distance < 2) {
        return;
      }
    }

    pushHistory();
    state.points.push(point);
    redrawLine();
  }

  function onPointerDown(e) {
    if (!state.drawingArmed || !state.container) {
      return;
    }

    if (isPanWhileDrawingEnabled()) {
      restoreMapInteractions();
      return;
    }

    state.isPointerDrawing = true;
    state.pointerId = e.pointerId;

    try {
      state.container.setPointerCapture(state.pointerId);
    } catch (_) {}

    disableMapInteractions();

    const latlng = state.map.mouseEventToLatLng(e);
    if (state.points.length === 0) {
      pushHistory([]);
    }
    addPoint(latlng);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!state.isPointerDrawing) {
      return;
    }
    if (state.pointerId !== null && e.pointerId !== state.pointerId) {
      return;
    }

    addPoint(state.map.mouseEventToLatLng(e));
    e.preventDefault();
  }

  function endPointerDraw(e) {
    if (!state.isPointerDrawing) {
      return;
    }
    if (state.pointerId !== null && e.pointerId !== state.pointerId) {
      return;
    }

    state.isPointerDrawing = false;

    try {
      state.container.releasePointerCapture(state.pointerId);
    } catch (_) {}

    state.pointerId = null;
    restoreMapInteractions();
    e.preventDefault();
  }

  function bindPointerEvents() {
    if (!state.container || state.container.__srRouteEditorBound) {
      return;
    }

    state.container.__srRouteEditorBound = true;
    state.container.addEventListener('pointerdown', onPointerDown, { passive: false });
    state.container.addEventListener('pointermove', onPointerMove, { passive: false });
    state.container.addEventListener('pointerup', endPointerDraw, { passive: false });
    state.container.addEventListener('pointercancel', endPointerDraw, { passive: false });
  }

  function start() {
    state.drawingArmed = true;
    showDrawBar();
    updateDrawingStateUI();
    toast(isPanWhileDrawingEnabled()
      ? '地図移動モードです。チェックをOFFにすると描画できます。'
      : safeT('re_msg_draw', '描画モード：地図を押しながらなぞってください'));
  }

  function stop() {
    state.drawingArmed = false;
    state.isPointerDrawing = false;
    state.pointerId = null;
    restoreMapInteractions();
    clearVertexMarkers();
    hideDrawBar();
    setPanMode(false);
    openRouteEditModal();
    updateDrawingStateUI();
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
    hideDrawBar();
    setPanMode(false);
    openRouteEditModal();
    updateDrawingStateUI();
    toast('描画を確定しました。保存できます。');
  }

  function undo() {
    if (state.history.length > 0) {
      setPoints(state.history.pop());
      return;
    }

    if (state.points.length > 0) {
      state.points.pop();
      redrawLine();
      refreshVertexMarkers();
    }
  }

  function applySimplify() {
    const tolerance = Number(ui.rngTol()?.value ?? 15);
    if (state.points.length < 3) {
      return;
    }

    pushHistory();
    setPoints(simplifyLatLngs(state.points, tolerance));
    toast(safeT('re_msg_simplified', '簡略化しました'));
  }


  function readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('read failed'));
      reader.readAsText(file);
    });
  }

  function extractLatLngsFromImportedText(text, filename) {
    const lower = (filename || '').toLowerCase();
    if (lower.endsWith('.gpx')) {
      const xml = new DOMParser().parseFromString(text, 'application/xml');
      return Array.from(xml.querySelectorAll('trkpt, rtept')).map((node) => {
        const lat = Number(node.getAttribute('lat'));
        const lng = Number(node.getAttribute('lon'));
        return Number.isFinite(lat) && Number.isFinite(lng) ? L.latLng(lat, lng) : null;
      }).filter(Boolean);
    }
    return getActiveRouteLatLngsFromGeoJSON(JSON.parse(text));
  }

  async function importRouteFile(file) {
    if (!file) return;
    try {
      const text = await readTextFile(file);
      const latlngs = extractLatLngsFromImportedText(text, file.name);
      if (!latlngs || latlngs.length < 2) {
        toast('インポートできる線データが見つかりませんでした');
        return;
      }
      pushHistory();
      setPoints(latlngs);
      openRouteEditModal();
      updateDrawingStateUI();
      toast('インポートしました。続けて編集できます。');
    } catch (e) {
      console.error('[RouteEditor] import failed', e);
      toast('インポートに失敗しました');
    } finally {
      if (ui.importFile()) ui.importFile().value = '';
    }
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
      source: 'SamuraiRoad RouteEditor',
    },
    geometry: {
      type: 'LineString',
      coordinates: state.points.map((ll) => [ll.lng, ll.lat]),
    },
  };

  const featureCollection = {
    type: 'FeatureCollection',
    features: [feature],
  };

  const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
    type: 'application/geo+json',
  });
  const url = URL.createObjectURL(blob);

  const safeFileName =
    name
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, '_') || 'route';

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFileName}.geojson`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast(safeT('re_msg_export', '保存しました'));
}

  function updateToleranceLabel() {
    const value = Number(ui.rngTol()?.value ?? 15);
    if (ui.lblTol()) {
      ui.lblTol().textContent = `${value}m`;
    }
  }

  function wireUI() {
    ui.btnStart()?.addEventListener('click', () => {
      try {
        window.closeModalsForce?.();
      } catch (_) {}
      start();
    });

    ui.btnReset()?.addEventListener('click', reset);
    ui.btnFinish()?.addEventListener('click', finish);
    ui.btnSimplify()?.addEventListener('click', applySimplify);
    ui.importButton()?.addEventListener('click', () => ui.importFile()?.click());
    ui.importFile()?.addEventListener('change', (e) => importRouteFile(e.target.files?.[0]));

    ui.btnConfirmBar()?.addEventListener('click', finish);
    ui.btnUndoBar()?.addEventListener('click', undo);
    ui.btnResetBar()?.addEventListener('click', reset);
    ui.btnCancelBar()?.addEventListener('click', stop);

    ui.chkRef()?.addEventListener('change', refreshReferenceRoute);
    ui.chkEdit()?.addEventListener('change', refreshVertexMarkers);
    ui.rngTol()?.addEventListener('input', updateToleranceLabel);
    ui.chkPanBar()?.addEventListener('change', (e) => {
      setPanMode(!!e.target.checked);
    });
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
    refreshVertexMarkers();
    updateToleranceLabel();
    updateDrawingStateUI();
  }

  function initOnce() {
    const timer = setInterval(() => {
      const map = getMap();
      if (!map) {
        return;
      }

      clearInterval(timer);
      state.map = map;
      state.container = map.getContainer();
      bindPointerEvents();
      wireUI();
      refreshUI();
      setPanMode(false);
      log('initialized');
    }, 200);

    setTimeout(() => clearInterval(timer), 8000);
  }

  window.RouteEditor = {
    refreshUI,
    start,
    stop,
    showDrawBar,
    openMenu: openRouteEditModal,
    isActive: () => !!state.drawingArmed,
  };

  initOnce();
})();
