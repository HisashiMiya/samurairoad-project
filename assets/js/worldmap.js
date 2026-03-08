(() => {
  // =========================================
  // 0. 辞書データ (Dictionary)
  // =========================================
  const DICT = {
    ja: {
      menu_routes: "探す", menu_record: "記録", menu_report: "報告", menu_settings: "設定",
      menu_samurai: "侍の目で見る", menu_onsen: "温泉を探す", menu_food: "地元の食事・休憩", menu_trace: "なぞりゲーム", menu_routeedit: "ルート作成",
      title_select: "街道を選択", btn_close: "閉じる",
      title_record: "記録 / GPX", lbl_status: "状態", lbl_points: "点数",
      btn_start: "記録開始", btn_stop: "記録停止", btn_gpx: "GPXを保存", btn_clear: "記録をリセット", btn_import: "GPX読込",
      title_settings: "設定", title_trace: "なぞりゲーム", title_routeedit: "ルート作成", re_target: "参照", re_status: "状態", re_rule: "使い方", re_rule_text: "描画開始後、地図上を押しながらなぞって線を作成します。描画を確定で線を確定し、エクスポートでGeoJSONを書き出します。", re_start: "描画開始", re_undo: "1つ戻す", re_reset: "全消去", re_finish: "描画を確定", re_export: "エクスポート", re_showref: "参照ルートを表示", re_snap: "参照ルートへスナップ（近い時だけ）", re_name: "ルート名", re_note: "メモ・説明", re_result: "プレビュー", re_simplify: "線をなめらかに整える", re_tolerance: "補正の強さ", re_vertex_edit: "頂点を後から修正する", re_section_basic: "基本情報", re_section_assist: "表示・補助", re_section_main: "メイン操作", re_section_details: "詳細設定", re_section_output: "出力・終了", re_status_idle: "描画前です", re_status_drawing: "描画中です", re_panel_close: "パネルを閉じる", re_mode_exit: "作成モードを終了", re_cancel: "キャンセル", re_drawing_now: "描画中です", re_name_placeholder: "例：中山道（妻籠→馬籠）", re_note_placeholder: "例：現地でなぞった復元版", trace_target: "お題", trace_best: "自己ベスト", trace_rule: "ルール", trace_rule_text: "赤いルートに近いほど高得点。塗りつぶし（描きすぎ）は減点。", trace_start: "スタート", trace_reset: "リセット", trace_submit: "採点", trace_hint: "お題を表示（ヒント）", trace_panzoom: "描画中も地図操作を許可", trace_result: "結果", trace_score: "スコア", lbl_lang: "言語 / Language", lbl_wakelock: "画面常時点灯", lbl_autospeech: "自動読み上げ (AI)",
      btn_usage: "使い方ガイド",
      status_recording: "記録中...", status_stopped: "停止中",
      msg_start: "記録を開始しました", msg_stop: "記録を停止しました", msg_clear: "ログを消去しました",
      msg_confirm_clear: "⚠️ 未保存のGPSログが【すべて消滅】します。本当によろしいですか？",
      msg_no_data: "データがありません", msg_loaded: "読み込み完了", msg_error: "エラーが発生しました",
      route_no_select: "街道未選択", nav_info_init: "「探す」から街道を選んでください",
      route_loading: "読込中...", region_jp: "日本 (五街道・巡礼)", region_world: "海外 / その他",
      msg_ai_analyzing: "🤖 解析中...\nしばらくお待ちください",
      msg_ai_history_search: "📍 歴史を調査中...\n(現在地周辺)",
      ai_samurai_prefix: "【侍の目】\n",
      err_occurred: "エラーが発生しました",
      samurai_thinking: "侍が考え中...",
      onsen_thinking: "温泉を探しています...",
      food_thinking: "地元の味を探しています...",
      btn_speech_start: "読み上げ", btn_speech_stop: "停止",
      lbl_search_cond: "検索時の詳細条件",
      spot_thinking: "おすすめスポットを探しています...",
      sub_coment: "通常は数秒で完了しますが、混雑時には約45秒ほどかかる場合があります。", sub_comment: "通常は数秒で完了しますが、混雑時には約45秒ほどかかる場合があります。",
    },
    en: {
      menu_routes: "Routes", menu_record: "Record", menu_report: "Report", menu_settings: "Config",
      menu_samurai: "Samurai Vision", menu_onsen: "Find Onsen (Hot Springs)", menu_food: "Local Food & Rest", menu_trace: "Trace Game", menu_routeedit: "Route Editor",
      title_select: "Select Route", btn_close: "Close",
      title_record: "GPS & GPX", lbl_status: "Status", lbl_points: "Points",
      btn_start: "Start", btn_stop: "Stop", btn_gpx: "Save GPX", btn_clear: "Reset Record", btn_import: "Import GPX",
      title_settings: "Settings", title_trace: "Trace Game", title_routeedit: "Route Editor", re_target: "Reference", re_status: "Status", re_rule: "How to use", re_rule_text: "After tapping Start Drawing, press and trace on the map to create a line. Confirm Drawing finalizes the line, and Export writes a GeoJSON file.", re_start: "Start Drawing", re_undo: "Undo", re_reset: "Clear Current Line", re_finish: "Confirm Drawing", re_export: "Export", re_showref: "Show reference route", re_snap: "Snap to reference route (only when close)", re_name: "Route Name", re_note: "Notes / Description", re_result: "Preview", re_simplify: "Smooth the line", re_tolerance: "Adjustment strength", re_vertex_edit: "Edit vertices afterward", re_section_basic: "Basic Info", re_section_assist: "Display & Assistance", re_section_main: "Main Action", re_section_details: "Advanced Settings", re_section_output: "Export & Exit", re_status_idle: "Ready to draw", re_status_drawing: "Drawing in progress", re_panel_close: "Close Panel", re_mode_exit: "Exit Route Editor", re_cancel: "Cancel", re_drawing_now: "Drawing in progress", re_name_placeholder: "Example: Nakasendo (Tsumago → Magome)", re_note_placeholder: "Example: traced on site and restored", lbl_lang: "Language", lbl_wakelock: "Keep Screen On", lbl_autospeech: "Auto Speech (AI)",
      btn_usage: "How to Use",
      status_recording: "Recording...", status_stopped: "Stopped",
      msg_start: "Recording started", msg_stop: "Recording stopped", msg_clear: "Log cleared",
      msg_confirm_clear: "⚠️ All unsaved GPS logs will be PERMANENTLY LOST. Are you sure?",
      msg_no_data: "No data found", msg_loaded: "Route loaded", msg_error: "Error occurred",
      route_no_select: "No Route", nav_info_init: "Select a route from menu",
      route_loading: "Loading...", region_jp: "Japan", region_world: "World / Other",
      msg_ai_analyzing: "🤖 Analyzing...",
      msg_ai_history_search: "📍 Searching History...",
      ai_samurai_prefix: "[Samurai Vision]\n",
      err_occurred: "Error occurred",
      samurai_thinking: "The Samurai is thinking...",
      onsen_thinking: "Searching for Onsen...",
      food_thinking: "Searching for local food...",
      btn_speech_start: "Read Aloud", btn_speech_stop: "Stop",
      lbl_search_cond: "Search Conditions",
      spot_thinking: "Searching for spots...",
      sub_comment: "Normally this completes within a few seconds, but during peak times it may take up to about 45 seconds.",
    }
  };

  // =========================================
  // 1. データ定義
  // =========================================
  const WORLD_ROUTES = [
    { 
      region_ja: "日本 ", region_en: "Japan", 
      routes: [
        { id: "tokaido", name_ja: "東海道", name_en: "Tokaido", file: "data/tokaido_strict.geojson" },
        { id: "nakasendo", name_ja: "中山道", name_en: "Nakasendo", file: "data/nakaendo_route.geojson" },
        { id: "koshu", name_ja: "甲州街道", name_en: "Koshu Kaido", file: "data/koshu_route.geojson" },
        { id: "nikko", name_ja: "日光街道", name_en: "Nikko Kaido", file: "data/nikko_route.geojson" },
        { id: "oshu", name_ja: "奥州街道", name_en: "Oshu Kaido", file: "data/oshu_route.geojson" },
        { id: "kumano", name_ja: "熊野古道（中辺路）", name_en: "Kumano Kodo", file: "data/kumano.geojson" },
        { id: "shikoku88", name_ja: "四国遍路（88ヶ所）", name_en: "Shikoku Pilgrimage", file: "data/88tmples.geojson" },
        { id: "okunohosomichi", name_ja: "奥の細道", name_en: "Oku no Hosomichi", file: "data/okunohosomichi.geojson" }
      ]
    },
    { 
      region_ja: "アジア / ユーラシア", region_en: "Asia / Eurasia", 
      routes: [
        { id: "silkroad_uz", name_ja: "シルクロード（ウズベキスタン）", name_en: "Silk Road (Uzbekistan)", file: "data/silkroad_uz.geojson" },
        { id: "lycian", name_ja: "リキアン・ウェイ", name_en: "Lycian Way", file: "data/lycianway.geojson" },
        { id: "jeju", name_ja: "済州オルレ", name_en: "Jeju Olle Trail", file: "data/jot.geojson" },
        { id: "teahorse", name_ja: "茶馬古道", name_en: "Tea Horse Road", file: "data/teahorseroad.geojson" },
        { id: "jesustrail", name_ja: "ジーザス・トレイル", name_en: "Jesus Trail", file: "data/jesustrail.geojson" },
        { id: "jordantrail", name_ja: "ヨルダン・トレイル", name_en: "Jordan Trail", file: "data/jordantrail.geojson" },
        { id: "dragonsback", name_ja: "ドラゴンズ・バック（香港）", name_en: "Dragon's Back (Hong Kong)", file: "data/no48_dragons_back.geojson" }
      ]
    },
    { 
      region_ja: "ヨーロッパ", region_en: "Europe", 
      routes: [
        { id: "appia", name_ja: "アッピア街道", name_en: "Appian Way", file: "data/appia.geojson" },
        { id: "tmb", name_ja: "ツール・ド・モンブラン", name_en: "Tour du Mont Blanc", file: "data/tmb.geojson" },
        { id: "camino", name_ja: "サンティアゴ巡礼（フランス人の道）", name_en: "Camino de Santiago (Francés)", file: "data/camino_frances.geojson" },
        { id: "francigena", name_ja: "フランチジェナ街道", name_en: "Via Francigena", file: "data/viafrancigena.geojson" },
        { id: "whw", name_ja: "ウェスト・ハイランド・ウェイ", name_en: "West Highland Way", file: "data/whway.geojson" },
        { id: "hadrian", name_ja: "ハドリアヌスの長城パス", name_en: "Hadrian's Wall Path", file: "data/hwp.geojson" },
        { id: "stolav", name_ja: "聖オラフの道", name_en: "St. Olav's Way", file: "data/sow.geojson" },
        { id: "romanticroad", name_ja: "ロマンチック街道", name_en: "Romantic Road", file: "data/romanticroad.geojson" },
        { id: "viaalpina", name_ja: "ヴィア・アルピナ", name_en: "Via Alpina", file: "data/viaalpina.geojson" },
        { id: "cotswold", name_ja: "コッツウォルズ・ウェイ", name_en: "Cotswold Way", file: "data/cotswoldway.geojson" },
        { id: "kungsleden", name_ja: "クングスレーデン", name_en: "Kungsleden", file: "data/kungsleden.geojson" },
        { id: "reykjavik", name_ja: "レイキャヴィーク・ウォーク（アイスランド）", name_en: "Reykjavik City Walk", file: "data/no63_reykjavik.geojson" },
        { id: "albania", name_ja: "アルバニア石畳（ジロカストラ）", name_en: "Albania Cobblestone", file: "data/no83_albania_cobblestone.geojson" },
        { id: "rome_aqueducts", name_ja: "ローマ水道橋路", name_en: "Rome Aqueducts", file: "data/no95_rome_aqueducts.geojson" },
        { id: "danube_linz", name_ja: "ドナウ河畔（リンツ）", name_en: "Danube Path (Linz)", file: "data/no94_danube_linz.geojson" }
      ]
    },
    { 
      region_ja: "アメリカ大陸", region_en: "Americas", 
      routes: [
        { id: "appalachian", name_ja: "アパラチアン・トレイル", name_en: "Appalachian Trail", file: "data/appalachian.geojson" },
        { id: "route66", name_ja: "ルート66", name_en: "Route 66", file: "data/route66.geojson" },
        { id: "inca", name_ja: "インカ道", name_en: "Inca Trail", file: "data/inca.geojson" },
        { id: "pct", name_ja: "パシフィック・クレスト・トレイル (PCT)", name_en: "Pacific Crest Trail", file: "data/pct.geojson" },
        { id: "jmt", name_ja: "ジョン・ミューア・トレイル (JMT)", name_en: "John Muir Trail", file: "data/jmt.geojson" },
        { id: "qhapaqnan", name_ja: "カパック・ニャン（アンデス・ロード）", name_en: "Qhapaq Nan", file: "data/qhapaqnan.geojson" }
      ]
    },
    {
      region_ja: "オセアニア", region_en: "Oceania",
      routes: [
        { id: "milford", name_ja: "ミルフォード・トラック", name_en: "Milford Track", file: "data/milfordtrack.geojson" },
        { id: "greatocean", name_ja: "グレート・オーシャン・ウォーク", name_en: "Great Ocean Walk", file: "data/greatoceanwalk.geojson" }
      ]
    }
  ];

  // =========================================
  // 1.5 URLパラメータ & 初期設定
  // =========================================
  const urlParams = new URLSearchParams(window.location.search);
  const paramLang = urlParams.get('lang');
  if (paramLang && (paramLang === 'ja' || paramLang === 'en')) {
    localStorage.setItem('kaido_lang', paramLang);
  }
  const paramRoute = urlParams.get('route');
  let initialRouteId = null;
  if (paramRoute) {
    let found = false;
    for (const group of WORLD_ROUTES) {
      if (group.routes.some(r => r.id === paramRoute)) {
        found = true;
        break;
      }
    }
    if (found) {
      initialRouteId = paramRoute;
      localStorage.setItem('kaido_active_route', initialRouteId);
    }
  }

  // =========================================
  // 2. アプリの状態管理 (AppState)
  // =========================================
  const AppState = {
    lang: localStorage.getItem('kaido_lang') || 'ja',
    currentRouteId: initialRouteId || localStorage.getItem('kaido_active_route') || null,
    trackPoints: JSON.parse(localStorage.getItem('kaido_track_points') || '[]'),
    isRecording: false,
    watchId: null,
    currentPos: null,
    autoSpeech: (localStorage.getItem('kaido_auto_speech') === 'true'), // ★追加: 自動読み上げ (初期値はfalse)
    searchCondition: localStorage.getItem('kaido_search_cond') || '', // ★追加: 検索条件
    layers: {}
  };

  // 初期化時にチェックボックスの状態を反映
  const chkAuto = document.getElementById('chkAutoSpeech');
  if(chkAuto) {
      chkAuto.checked = AppState.autoSpeech;
      chkAuto.onchange = (e) => {
          AppState.autoSpeech = e.target.checked;
          localStorage.setItem('kaido_auto_speech', AppState.autoSpeech);
      };
  }

  const map = L.map('map', { zoomControl: false }).setView([35.681, 139.767], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  // -----------------------------------------
  // Context menu (right-click / long-press)
  // NOTE: Bind ONCE. Do not bind inside updateLanguage() to avoid duplicate handlers.
  // -----------------------------------------
  let _srContextMenuBound = false;
  function bindContextMenuOnce() {
    if (_srContextMenuBound) return;
    _srContextMenuBound = true;

    map.on('contextmenu', function(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      const title = (AppState.lang === 'ja') ? 'この場所について調べる' : 'Explore this place';
      const lblSamurai = (AppState.lang === 'ja') ? '侍' : 'Samurai';
      const lblOnsen  = (AppState.lang === 'ja') ? '温泉' : 'Onsen';
      const lblFood   = (AppState.lang === 'ja') ? '食事' : 'Food';
      const lblSpot   = (AppState.lang === 'ja') ? 'スポット' : 'Spots';
console.log("ここに来た");
      const popupContent = `
        <div style="text-align:center; font-family: sans-serif;">
            <div style="font-weight:bold; margin-bottom:8px; color:#333;">${title}</div>
            <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
              <button data-action="samurai"
                style="background:#0066cc;color:white;border:none;padding:8px 12px;border-radius:20px;font-weight:bold;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);">
                🏯 ${lblSamurai}
              </button>

              <button data-action="onsen"
                style="background:#ff99cc;color:#cc0066;border:none;padding:8px 12px;border-radius:20px;font-weight:bold;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);">
                ♨️ ${lblOnsen}
              </button>

              <button data-action="food"
                style="background:#ffcc99;color:#cc6600;border:none;padding:8px 12px;border-radius:20px;font-weight:bold;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);">
                🍴 ${lblFood}
              </button>
            </div>

            <button data-action="spots"
              style="background:#33cc33;color:white;border:none;padding:8px 12px;border-radius:20px;font-weight:bold;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);margin-top:8px;">
              🔍 ${lblSpot}
            </button>
        </div>
      `;

      const pop = L.popup().setLatLng(e.latlng).setContent(popupContent).openOn(map);

      // popup DOMが生成されたタイミングで、ボタンにイベントを貼る（inline onclick排除）
      map.once('popupopen', (ev) => {
        if (ev.popup !== pop) return;

        const root = ev.popup.getElement();
        if (!root) return;

        root.querySelectorAll('button[data-action]').forEach(btn => {
          btn.addEventListener('click', () => {
            const action = btn.dataset.action;

            console.log('[popup button]', action, lat, lng, {
              askSamuraiSpot: typeof window.askSamuraiSpot,
              askOnsen: typeof window.askOnsen,
              askLocalFood: typeof window.askLocalFood,
              askSpotSearch: typeof window.askSpotSearch,
            });

            if (action === 'samurai') window.askSamuraiSpot?.(lat, lng);
            if (action === 'onsen')  window.askOnsen?.(lat, lng);
            if (action === 'food')   window.askLocalFood?.(lat, lng);
            if (action === 'spots')  window.askSpotSearch?.(lat, lng);
          }, { once: true });
        });
      });
    });
  }


  map.on("moveend", () => {
    if (!AppState.isLoadingRoute) {
      const c = map.getCenter();
      localStorage.setItem("sr_lat", String(c.lat));
      localStorage.setItem("sr_lng", String(c.lng));
      localStorage.setItem("sr_zoom", String(map.getZoom()));
    }
  });

  function restoreMapPosition() {
    if (initialRouteId) return;
    const lat = parseFloat(localStorage.getItem("sr_lat"));
    const lng = parseFloat(localStorage.getItem("sr_lng"));
    const zoom = parseFloat(localStorage.getItem("sr_zoom"));
    if (isFinite(lat) && isFinite(lng) && isFinite(zoom)){
      map.setView([lat,lng], zoom, { animate:false });
    }
  }

  // =========================================
  // 3. UI & 翻訳 & ローディング
  // =========================================
  
  function t(key) { return DICT[AppState.lang][key] || key; }

  function updateLanguage() {
    document.querySelectorAll('[data-lang]').forEach(el => {
      el.textContent = t(el.dataset.lang);
    });

    document.querySelectorAll('[data-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.placeholder);
    });

    renderRouteMenu();
    updateRecordStats();
    renderRecordButtonState();
    updateTopBarText();
    document.getElementById('btnToggleLang').textContent = (AppState.lang === 'ja') ? "日本語" : "English";
    updateSpeechButton();
    window.RouteEditor?.refreshUI?.();
  }

  function toggleLanguage() {
    AppState.lang = (AppState.lang === 'ja') ? 'en' : 'ja';
    localStorage.setItem('kaido_lang', AppState.lang);
    updateLanguage();
  }

  function updateTopBarText() {
    if (!AppState.currentRouteId) {
      document.getElementById('lblCurrentRoute').textContent = t('route_no_select');
      document.getElementById('lblNavInfo').textContent = t('nav_info_init');
      return;
    }
    let name = "Unknown";
    for (const group of WORLD_ROUTES) {
      const found = group.routes.find(r => r.id === AppState.currentRouteId);
      if (found) { name = (AppState.lang === 'ja') ? found.name_ja : found.name_en; break; }
    }
    document.getElementById('lblCurrentRoute').textContent = name;
  }

  // ■■■ ローディング画面の制御 ■■■
  function showLoading(customTextKey = null, subTextKey = null) {
    const modal = document.getElementById('loadingModal');
    const text = document.getElementById('loadingText');

    // メインテキスト
    const mainText = customTextKey ? t(customTextKey) : t('samurai_thinking');

    // サブテキスト（存在する場合のみ改行して追加）
    if (subTextKey) {
      const subText = t(subTextKey);
      text.textContent = mainText + '\n' + subText;
    } else {
      text.textContent = mainText;
    }

    modal.style.display = "flex";
  }

  function hideLoading() {
    document.getElementById('loadingModal').style.display = "none";
  }

  // ■■■ AI結果表示用の自作ウィンドウ ■■■
  function showAIResult(text) {
     const modal = document.getElementById('aiModal');
     const content = document.getElementById('aiContent');
     content.innerHTML = text.replace(/\n/g, "<br>"); // 改行反映 (innerHTMLに変更)
     modal.style.display = "flex"; 
     
     // 読み上げ状態をリセット
     window.stopSpeech();
     updateSpeechButton();

     // ★追加: 自動読み上げがONなら即座に読み上げる
     if (AppState.autoSpeech) {
         // 少しウェイトを入れないとブラウザによっては再生されないことがある
         setTimeout(() => {
            const cleanText = text.replace(/<[^>]*>?/gm, ''); // HTMLタグ除去
            speakText(cleanText);
         }, 500);
     }
  }

  // --- 音声読み上げ機能 (Web Speech API) ---
  let isSpeaking = false;
  
  window.toggleSpeech = function() {
    if (isSpeaking) {
        window.stopSpeech();
    } else {
        const text = document.getElementById('aiContent').innerText;
        speakText(text);
    }
  };

  window.stopSpeech = function() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        updateSpeechButton();
    }
  };

  function speakText(text) {
    if (!('speechSynthesis' in window)) {
        alert("Audio not supported in this browser.");
        return;
    }
    // 既存の読み上げをキャンセル
    window.speechSynthesis.cancel();

    const uttr = new SpeechSynthesisUtterance(text);
    uttr.lang = (AppState.lang === 'ja') ? 'ja-JP' : 'en-US';
    uttr.rate = 1.0;
    
    uttr.onend = function() {
        isSpeaking = false;
        updateSpeechButton();
    };
    uttr.onerror = function() {
        isSpeaking = false;
        updateSpeechButton();
    };

    window.speechSynthesis.speak(uttr);
    isSpeaking = true;
    updateSpeechButton();
  }

  function updateSpeechButton() {
      const lbl = document.getElementById('lblSpeechBtn');
      if (isSpeaking) {
          lbl.textContent = t('btn_speech_stop') + " (Speaking...)";
          document.getElementById('btnSpeechToggle').style.backgroundColor = "#eef4ff";
      } else {
          lbl.textContent = t('btn_speech_start');
          document.getElementById('btnSpeechToggle').style.backgroundColor = "transparent";
      }
  }




  // =========================================
  // 4. 地図・ルート・AI処理
  // =========================================

  function drawTrack() {
    if (AppState.layers.trackLine) AppState.layers.trackLine.remove();
    if (AppState.trackPoints.length < 1) return;
    const latlngs = AppState.trackPoints.map(p => [p.lat, p.lng]);
    AppState.layers.trackLine = L.polyline(latlngs, { color: 'blue', weight: 4, opacity: 0.8 }).addTo(map);
  }

  function loadActiveRoute() {
    if (!AppState.currentRouteId) { updateTopBarText(); return; }

    let targetRoute = null;
    for (const group of WORLD_ROUTES) {
      const found = group.routes.find(r => r.id === AppState.currentRouteId);
      if (found) { targetRoute = found; break; }
    }
    if (!targetRoute) return;

    updateTopBarText();
    document.getElementById('lblNavInfo').textContent = t('route_loading');
    if (AppState.layers.route) AppState.layers.route.remove();
    AppState.isLoadingRoute = true;

    fetch(targetRoute.file)
      .then(res => {
        if (!res.ok) throw new Error("File not found");
        return res.json();
      })
      .then(geoJson => {
        AppState.layers.route = L.geoJSON(geoJson, {
          style: { color: '#cc0000', weight: 5, opacity: 0.7 }
        }).addTo(map);
        map.fitBounds(AppState.layers.route.getBounds(), { padding: [50, 50] });
        document.getElementById('lblNavInfo').textContent = t('msg_loaded');
        setTimeout(() => { AppState.isLoadingRoute = false; }, 1000);
      })
      .catch(err => {
        console.error(err);
        document.getElementById('lblNavInfo').textContent = "Error";
        showToast(t('msg_error'));
        AppState.isLoadingRoute = false;
      });
  }

  // --- Gemini API 呼び出し (修正版: HTTPステータスを表示) ---
  async function callGemini(prompt, image = null) {
    const base = (window.AI_HTTP || location.origin).replace(/\/$/, "");
    const endpoint = `${base}/ai/samuraimap`;
    const payload = { prompt };
    if (image) payload.image = image;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      // ★エラー詳細化: ステータスコードを含める
      if (!res.ok) throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      
      const json = await res.json();
      return json.text || json.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(json);
    } catch (e) {
      throw new Error(e.message);
    }
  }

// ★ 修正版: 画像を選択・圧縮して送信する関数 ★
  function handleSamuraiImageSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

      // ローディング表示
      showLoading();

      // 画像を圧縮してBase64にする処理
      resizeImage(file, 1024, 0.7, (base64) => {
          // 圧縮後のデータでAI処理へ
          processSamuraiImage(base64);
      });
      
      // 次回も同じファイルを選べるようにリセット
      event.target.value = '';
  }

  // ★ 追加: 画像リサイズ用ユーティリティ関数 ★
  function resizeImage(file, maxWidth, quality, callback) {
      const reader = new FileReader();
      reader.onload = function(e) {
          const img = new Image();
          img.onload = function() {
              // サイズ計算
              let width = img.width;
              let height = img.height;
              if (width > maxWidth) {
                  height = Math.round(height * (maxWidth / width));
                  width = maxWidth;
              }

              // Canvasを使ってリサイズ
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              // JPEG形式で圧縮 (quality: 0.0〜1.0)
              // data:image/jpeg;base64,..... の形式で取得される
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              
              // ヘッダー部分(data:image/jpeg;base64,)を削除して本文だけ返す
              const base64 = dataUrl.split(',')[1];
              callback(base64);
          };
          img.src = e.target.result;
      };
      reader.readAsDataURL(file);
  }

  async function processSamuraiImage(base64) {
    let prompt = "";
    
    // 言語設定 (AppState.lang) を正しく参照
    if (AppState.lang === 'en') {
        prompt = `Where is this location?
Based on the image, please explain the scenery and its historical context (especially related to old Japanese roads if possible).
Please answer in English.
[Constraint]: Do not include titles. Start directly with the content.`;
    } else {
        prompt = `ここまでの会話は忘れてください。
この画像はどこですか？
街道歩きの旅の途中で撮影されたものです。
画像から読み取れる風景や、歴史的な文脈（宿場町や史跡など）について詳しく解説してください。
【制約事項】タイトル不要。いきなり本文から始めてください。`;
    }

    try {
        const answer = await callGemini(prompt, base64);
        hideLoading();
        showAIResult(answer);
    } catch (e) {
        hideLoading();
        console.error(e);
        // ★エラー詳細化
        alert(t('msg_error') + "\n" + e.message);
    }
  }
  
  // --- 歴史ガイド (GPS) ---
  // ★ 機能1: GPS現在地から歴史ガイド + おすすめスポット
  async function askHistoryByGPS(latitude, longitude) {
    showLoading();
    let prompt = "";

    if (AppState.lang === 'en') {
        prompt = `I am currently at Latitude ${latitude}, Longitude ${longitude}.
Please act as a historical guide.
Explain the history of this location (or the nearest historical road/post town) specifically focusing on the Edo period.
Please answer in English.
[Constraint]: 
- Do not include any titles or headings at the beginning. Start directly with the explanation.
- At the end of your explanation, please create a bulleted list of 5 "Recommended Spots Nearby" (historical sites, temples, shrines, scenic spots, etc.). 
- The list title should be "[Recommended Spots Nearby (Top 5)]".`;
    } else {
        prompt = `私は今、緯度${latitude}、経度${longitude}の場所にいます。
この場所（または一番近い歴史的な街道や宿場町）について、
「昔の旅人になった気分」で楽しめるような歴史的エピソードや、江戸時代に何があったかを詳しく教えてください。
【制約事項】
・タイトルや見出しは一切書かないでください。
・挨拶も不要です。いきなり本文から書き始めてください。
・解説の最後に、「【周辺のおすすめ立ち寄りスポット5選】」という見出しをつけて、
　この場所から立ち寄れる史跡・寺社・老舗・景勝地などを5つ、箇条書きで紹介してください。`;
    }

    try {
        const answer = await callGemini(prompt);
        hideLoading();
        showAIResult(answer);
    } catch (e) {
        hideLoading();
        console.error(e);
        alert(t('msg_error') + "\n" + e.message);
    }
  }
// --- 新機能: 温泉検索（詳細条件＋両対応の最適化版） ---
  window.askOnsen = async function(lat, lng) {
      if (!lat || !lng) return;
      map.closePopup();
      showLoading('onsen_thinking',  'sub_coment');

      // 設定画面で入力された詳細条件を取得
      const condText = AppState.searchCondition ? AppState.searchCondition.trim() : "";
      const condPromptJa = condText ? `\n【最優先条件】以下の要望を満たす温泉を提案してください：\n「${condText}」\n` : "";
      const condPromptEn = condText ? `\n[Priority Condition] Please consider the following user request:\n"${condText}"\n` : "";

      let prompt = "";
      if (AppState.lang === 'en') {
          prompt = `Regarding the location at Latitude ${lat}, Longitude ${lng}:
Please list 3 to 5 recommended "Onsen" (Day-use Hot Springs) nearby (within ~20km).
The user might be there right now or planning a future trip. Please provide information useful for both.
Focus on authentic, historical, or hidden spots that locals love (not just big resorts). ${condPromptEn}
For each spot, provide:
1. Name
2. Distance & Direction (approx.)
3. Why it is recommended & Best timing/Tips (e.g., water quality, view, history, and advice for planning such as checking business hours).
4. Google Maps Search URL (Strictly use this format: https://www.google.com/maps/search/?api=1&query=Name)
[Constraint]: Output as a clean list without extra conversation.`;
      } else {
          prompt = `指定された地点（緯度${lat}、経度${lng}）から半径20km圏内にある、「おすすめの日帰り温泉」を3〜5つ教えてください。

【重要条件】
ユーザーは今まさにその場にいる可能性もあれば、事前の旅行計画を立てている可能性もあります。どちらの用途でも役立つように解説してください。
特に、地元の人に愛される名湯や、秘湯、歴史ある温泉を優先してください（大規模レジャー施設より風情を重視）。${condPromptJa}

それぞれの温泉について、以下の4点を箇条書きで出力してください。
1. 名称
2. おおよその距離と方角
3. おすすめポイントと訪問時のアドバイス（泉質、景色、歴史などの魅力に加え、計画のヒントや営業時間確認の注意喚起などを簡潔に含めること）
4. Googleマップ検索用URL（必ずこの形式で出力: https://www.google.com/maps/search/?api=1&query=温泉名 ）`;
      }

      try {
          const answer = await callGemini(prompt);
          hideLoading();
          
          // GoogleマップURLを確実にリンクタグに変換する
          const linkedAnswer = answer.replace(/(https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=[^\s<)\n]+)/g, '<a href="$1" target="_blank" style="color:#0066cc;text-decoration:underline;">Google Mapで見る</a>');
          
          showAIResult(linkedAnswer);
      } catch (e) {
          hideLoading();
          console.error(e);
          alert(t('msg_error') + "\n" + e.message);
      }
  };


  // --- 新機能: 地元の食事・休憩（詳細条件＋両対応の最適化版） ---
  window.askLocalFood = async function(lat, lng) {
      if (!lat || !lng) return;
      map.closePopup();
      showLoading('food_thinking', 'sub_coment');

      // 設定画面で入力された詳細条件を取得
      const condText = AppState.searchCondition ? AppState.searchCondition.trim() : "";
      const condPromptJa = condText ? `\n【最優先条件】以下の要望を満たす食事処・休憩スポットを提案してください：\n「${condText}」\n` : "";
      const condPromptEn = condText ? `\n[Priority Condition] Please consider the following user request:\n"${condText}"\n` : "";

      let prompt = "";
      if (AppState.lang === 'en') {
          prompt = `Regarding the location at Latitude ${lat}, Longitude ${lng}:
Please list 3 to 5 recommended "Local Food Spots" or "Historical Rest Areas" nearby.
The user might be there right now or planning a future trip. Please provide information useful for both.
Exclude convenience stores and major fast-food chains. Focus on places offering local specialties, traditional atmosphere, or old teahouses suitable for walkers. ${condPromptEn}
For each spot, provide:
1. Name
2. Distance & Direction (approx.)
3. Recommended menu & Best timing/Tips (e.g., lunch vs dinner vibe, or advice to check holidays).
4. Google Maps Search URL (Strictly use this format: https://www.google.com/maps/search/?api=1&query=Name)
[Constraint]: Output as a clean list without extra conversation.`;
      } else {
          prompt = `指定された地点（緯度${lat}、経度${lng}）の周辺で、歩き旅の休憩や食事に最適な「地元の食事処」または「歴史的な休憩スポット」を3〜5つ教えてください。

【重要条件】
ユーザーは今まさにその場にいる可能性もあれば、事前の旅行計画を立てている可能性もあります。どちらの用途でも役立つように解説してください。
コンビニや大手チェーン店は除外してください。その土地ならではの郷土料理、古い茶屋、地元の人に愛される食堂などを優先してください。${condPromptJa}

それぞれのスポットについて、以下の4点を箇条書きで出力してください。
1. 名称
2. おおよその距離と方角
3. おすすめメニューと訪問時のアドバイス（お店の雰囲気や特徴に加え、昼夜の用途の違いや定休日確認の注意喚起など、計画のヒントを簡潔に含めること）
4. Googleマップ検索用URL（必ずこの形式で出力: https://www.google.com/maps/search/?api=1&query=店舗名 ）`;
      }

      try {
          const answer = await callGemini(prompt);
          hideLoading();
          
          // GoogleマップURLを確実にリンクタグに変換する
          const linkedAnswer = answer.replace(/(https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=[^\s<)\n]+)/g, '<a href="$1" target="_blank" style="color:#0066cc;text-decoration:underline;">Google Mapで見る</a>');
          
          showAIResult(linkedAnswer);
      } catch (e) {
          hideLoading();
          console.error(e);
          alert(t('msg_error') + "\n" + e.message);
      }
  };

// ■■■ 指定地点の侍解説を実行する関数（修正済） ■■■
// ★ 機能2: 地図長押しから侍解説 + おすすめスポット
  window.askSamuraiSpot = async function(lat, lng) {
  console.log("ここに来た2");
      map.closePopup(); // ポップアップを閉じる
      showLoading();    // ローディング開始
console.log("ここに来た3");
      try {
          let prompt = "";
          const latitudeVal = lat;
          const longitudeVal = lng;

          if (AppState.lang === 'en') {
              prompt = `I am pointing at a location on the map (Latitude ${latitudeVal}, Longitude ${longitudeVal}).
Please act as a historical Samurai guide.
Explain the history, famous landmarks, or hidden gems near this specific location.
Focus on the Edo period or old roads if applicable.
[Constraint]: 
- No titles. Start directly with the explanation.
- At the end of your explanation, please create a bulleted list of 5 "Recommended Spots Nearby" (historical sites, temples, shrines, scenic spots, etc.). 
- The list title should be "[Recommended Spots Nearby (Top 5)]".`;
          } else {
              prompt = `私は地図上のこの地点（緯度${latitudeVal}、経度${longitudeVal}）を指しています。
この場所、あるいはここから最も近い名所・旧跡・宿場町について、
「土地勘のある侍」として詳しく解説してください。
特に、その土地の歴史的背景や、旅人が立ち寄るべきスポットがあれば教えてください。
【制約事項】
・タイトルや見出しは不要です。いきなり本文から語り始めてください。
・口調は威厳がありつつも親切な侍言葉で。
・解説の最後に、「【周辺のおすすめ立ち寄りスポット5選】」という見出しをつけて、
　この地点周辺の史跡・寺社・老舗・景勝地などを5つ、箇条書きで紹介してください。`;
          }

          // API呼び出し
          const answer = await callGemini(prompt);
          hideLoading();
          showAIResult(answer);

      } catch (e) {
          hideLoading();
          console.error(e);
          alert(t('msg_error') + ": " + e.message);
      }
  };

// --- 新機能: おすすめスポット検索（リアルタイム・事前調べ両対応版） ---
  window.askSpotSearch = async function(lat, lng) {
      if (!lat || !lng) return;
      map.closePopup();
      showLoading('spot_thinking', 'sub_coment');

      // 設定画面で入力された詳細条件を取得
      const condText = AppState.searchCondition ? AppState.searchCondition.trim() : "";
      const condPromptJa = condText ? `\n【最優先条件】以下のユーザーからの要望を満たす場所を提案してください：\n「${condText}」\n` : "";
      const condPromptEn = condText ? `\n[Priority Condition] Please consider the following user request:\n"${condText}"\n` : "";

      let prompt = "";
      if (AppState.lang === 'en') {
          prompt = `Regarding the location at Latitude ${lat}, Longitude ${lng}:
Please list 5 to 10 recommended spots (sightseeing, cafes, historical places, scenic views, etc.) nearby.
The user might be there right now, or planning a future trip. Please provide information useful for both situations. ${condPromptEn}
For each spot, provide:
1. Name
2. Distance & Direction (approx. walking distance from the specified point)
3. Why it is recommended & Best timing (Briefly mention the best season, time of day, or differences between day/night to help with planning).
4. Google Maps Search URL (Strictly use this format: https://www.google.com/maps/search/?api=1&query=[Spot Name])
[Constraint]: Output as a clean list without extra conversation.`;
      } else {
          prompt = `指定された地点（緯度${lat}、経度${lng}）の周辺について。
歩き旅の旅人が立ち寄るべき「おすすめスポット（観光地、カフェ、名所、絶景ポイントなど）」を5〜10件教えてください。

【重要条件】
ユーザーは今まさにその場にいる可能性もあれば、事前の旅行計画を立てている可能性もあります。どちらの用途でも役立つように解説してください。${condPromptJa}

それぞれのスポットについて、以下の4点を箇条書きで出力してください。
1. 名称
2. おおよその距離と方角（指定地点からの徒歩での目安）
3. おすすめポイントと最適な訪問タイミング（「昼夜での見え方の違い」や「特におすすめの季節・時間帯」など、計画のヒントになる情報を簡潔に含めること）
4. Googleマップ検索用URL（必ずこの形式で出力: https://www.google.com/maps/search/?api=1&query=スポット名 ）`;
      }

      try {
          const answer = await callGemini(prompt);
          hideLoading();
          
          // GoogleマップURLを確実にリンクタグに変換する
          const linkedAnswer = answer.replace(/(https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=[^\s<)\n]+)/g, '<a href="$1" target="_blank" style="color:#0066cc;text-decoration:underline;">Google Mapで見る</a>');
          
          showAIResult(linkedAnswer);
      } catch (e) {
          hideLoading();
          console.error(e);
          alert(t('msg_error') + "\n" + e.message);
      }
  };
  // =========================================
  // 5. 記録・インポート・エクスポート
  // =========================================
  function updateRecordStats() {
    const pts = AppState.trackPoints;
    document.getElementById('valRecStatus').textContent = AppState.isRecording ? t('status_recording') : t('status_stopped');
    document.getElementById('valRecStatus').style.color = AppState.isRecording ? "#cc0000" : "#333";
    document.getElementById('valRecPoints').textContent = pts.length;
    const btnText = document.getElementById('lblRecordBtn');
    btnText.textContent = AppState.isRecording ? "STOP" : t('menu_record');
    btnText.style.color = AppState.isRecording ? "#cc0000" : "";

    // ★追加: 未保存バッジの制御
    const unsavedBadge = document.getElementById('unsavedBadge');
    if (unsavedBadge) {
      // データが1点以上あれば「(未保存)」を表示
      unsavedBadge.style.display = (pts.length > 0) ? "inline" : "none";
    }

    // ★追加: データがない時は保存とクリアボタンを押せないようにする
    const btnDownload = document.getElementById('btnDownloadGpx');
    const btnClear = document.getElementById('btnClearRecord');
    const hasData = pts.length > 0;

    if (btnDownload) {
      btnDownload.disabled = !hasData;
      btnDownload.style.opacity = hasData ? "1" : "0.5";
      btnDownload.style.cursor = hasData ? "pointer" : "not-allowed";
    }
    if (btnClear) {
      btnClear.disabled = !hasData;
      btnClear.style.opacity = hasData ? "1" : "0.5";
      btnClear.style.cursor = hasData ? "pointer" : "not-allowed";
    }
  }
  function renderRecordButtonState(){
    const btn = document.getElementById('btnStartStopRecord');
    btn.textContent = AppState.isRecording ? t('btn_stop') : t('btn_start');
    btn.className = AppState.isRecording ? "btn-block btn-danger" : "btn-block";
  }
  function toggleRecord() {
    AppState.isRecording = !AppState.isRecording;
    if (AppState.isRecording) {
      if (!navigator.geolocation) { alert("GPS Not Supported"); AppState.isRecording=false; return; }
      AppState.watchId = navigator.geolocation.watchPosition(
        pos => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, t: Date.now() };
          AppState.trackPoints.push(p);
          localStorage.setItem('kaido_track_points', JSON.stringify(AppState.trackPoints));
          updateRecordStats();
          drawTrack();
        },
        err => { console.error(err); },
        { enableHighAccuracy: true }
      );
      showToast(t('msg_start'));
    } else {
      if (AppState.watchId) navigator.geolocation.clearWatch(AppState.watchId);
      showToast(t('msg_stop'));
    }
    updateRecordStats();
    renderRecordButtonState();
  }
  function clearRecord() {
    if(!confirm(t('msg_confirm_clear'))) return;
    
    AppState.trackPoints = [];
    localStorage.setItem('kaido_track_points', '[]');
    if(AppState.layers.trackLine) AppState.layers.trackLine.remove();
    updateRecordStats();
    showToast(t('msg_clear'));
  }
  function downloadGpx() {
    const pts = AppState.trackPoints;
    if (pts.length === 0) { alert(t('msg_no_data')); return; }
    const now = new Date();
    const defaultName = `track_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    let fileName = prompt("File Name", defaultName);
    if (fileName === null) return;
    if (!fileName.trim()) fileName = defaultName;
    if (!fileName.toLowerCase().endsWith('.gpx')) fileName += '.gpx';
    let gpx = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg>`;
    pts.forEach(p => {
      gpx += `<trkpt lat="${p.lat}" lon="${p.lng}"><time>${new Date(p.t).toISOString()}</time></trkpt>`;
    });
    gpx += `</trkseg></trk></gpx>`;
    const blob = new Blob([gpx], {type: "application/gpx+xml"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
  }
  function importGpx(event) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const trkpts = xmlDoc.getElementsByTagName("trkpt");
      AppState.trackPoints = []; 
      for (let i = 0; i < trkpts.length; i++) {
        const lat = parseFloat(trkpts[i].getAttribute("lat"));
        const lon = parseFloat(trkpts[i].getAttribute("lon"));
        const timeTag = trkpts[i].getElementsByTagName("time")[0];
        const time = timeTag ? new Date(timeTag.textContent).getTime() : Date.now();
        AppState.trackPoints.push({ lat: lat, lng: lon, t: time });
      }
      localStorage.setItem('kaido_track_points', JSON.stringify(AppState.trackPoints));
      drawTrack();
      updateRecordStats();
      if(AppState.trackPoints.length > 0) map.fitBounds(AppState.layers.trackLine.getBounds());
      showToast(t('msg_loaded'));
      closeModals();
    };
    reader.readAsText(file);
  }

  function openReportForm() {
    const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSctfcD7qgXA3t7X1bWQnXiqyTSCdh2iy1uuM07otO4xGGoU_g/viewform";
    const ID_LAT   = "entry.1725964949";
    const ID_LNG   = "entry.1039750529";
    const ID_ROUTE = "entry.2062767095";
    let params = [];
    if (AppState.currentPos) {
      params.push(`${ID_LAT}=${AppState.currentPos.lat}`);
      params.push(`${ID_LNG}=${AppState.currentPos.lng}`);
    }
    if (AppState.currentRouteId) {
      let name = AppState.currentRouteId;
      for (const group of WORLD_ROUTES) {
        const found = group.routes.find(r => r.id === AppState.currentRouteId);
        if(found) name = found.name_ja;
      }
      params.push(`${ID_ROUTE}=${encodeURIComponent(name)}`);
    }
    window.open(`${formUrl}?${params.join('&')}`, "_blank"); 
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
window.closeModals = function(opts = {}) {
  const force = !!opts.force;

  const re = document.getElementById('modalRouteEdit');
  const tg = document.getElementById('modalTraceGame');

  const reActive = !!window.RouteEditor?.isActive?.();
  const tgActive = !!window.TraceGame?.isActive?.();

  // 稼働中は“最小化”はするが、処理は止めない（returnしない）
  if (!force && re && re.classList.contains('open') && reActive) {
    re.classList.add('minimized');
  }
  if (!force && tg && tg.classList.contains('open') && tgActive) {
    tg.classList.add('minimized');
  }

  // それ以外は閉じる。ただし、稼働中の2つは閉じない
  document.querySelectorAll('.modal-overlay, .modal').forEach(el => {
    if (el === re && reActive && !force) return;
    if (el === tg && tgActive && !force) return;
    el.classList.remove('open');
    el.classList.remove('minimized');
  });
};

// 終了用（UI強制クローズ）
window.closeModalsForce = function() {
  window.closeModals({ force: true });
};



// --- Modal open helper (global) ---
window.openModal = function(id) {
  // 既存モーダルを閉じる（ただし closeModals の中で最小化ロジックがあるならそのまま効く）
  if (window.closeModals) window.closeModals();

  const el = document.getElementById(id);
  if (!el) {
    console.warn(`[openModal] not found: #${id}`);
    return;
  }

  // 最小化してたら復帰
  el.classList.remove('minimized');

  // 表示
  el.classList.add('open');
};


// --- Exit（終了）: stop() → UI強制全閉じ ---
const btnRouteEditExit = document.getElementById('btnRouteEditExit');
if (btnRouteEditExit) btnRouteEditExit.onclick = () => {
  try { window.RouteEditor?.stop?.(); } catch(e) { console.warn(e); }
  window.closeModalsForce?.();
};

const btnTraceGameExit = document.getElementById('btnTraceGameExit');
if (btnTraceGameExit) btnTraceGameExit.onclick = () => {
  try { window.TraceGame?.stop?.(); } catch(e) { console.warn(e); }
  window.closeModalsForce?.();
};
  // =========================================
  // ：WakeLock延命 & ポケットモード
  // =========================================
  let wakeLock = null;
  const chkWakeLock = document.getElementById('chkWakeLock');

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      if (wakeLock !== null) return;
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        console.log('WakeLock released by OS');
        wakeLock = null;
      });
      console.log('WakeLock active');
    } catch (err) {
      console.error('WakeLock error:', err);
      wakeLock = null;
    }
  }

  function releaseWakeLock() {
    if (wakeLock !== null) {
      wakeLock.release();
      wakeLock = null;
    }
  }

  if (chkWakeLock) {
    chkWakeLock.addEventListener('change', async (e) => {
      if (e.target.checked) {
        await requestWakeLock();
        showToast("画面常時点灯：ON");
      } else {
        releaseWakeLock();
        showToast("画面常時点灯：OFF");
      }
    });
  }

  // OS仕様対策：強力な再点火（延命）ロジック
  const handleReignition = async () => {
    const isWakeLockIntended = (chkWakeLock && chkWakeLock.checked) || (pocketOverlay && pocketOverlay.style.display === 'flex');
    if (isWakeLockIntended && document.visibilityState === 'visible') {
      await requestWakeLock();
    }
  };
  document.addEventListener('visibilitychange', handleReignition);
  window.addEventListener('focus', handleReignition);
  window.addEventListener('pageshow', handleReignition);

  // --- ポケットモード（OLED節電・誤作動防止）制御 ---
  const pocketOverlay = document.getElementById('pocketModeOverlay');
  const pocketProgress = document.getElementById('pocketModeProgress');
  const btnPocket = document.getElementById('btnPocket');
  
  let holdInterval = null;
  let holdProgress = 0;
  let tapCount = 0;
  let tapTimer = null;

  if (btnPocket && pocketOverlay) {
    btnPocket.onclick = async () => {
      if (chkWakeLock && !chkWakeLock.checked) {
        chkWakeLock.checked = true;
      }
      await requestWakeLock(); 
      pocketOverlay.style.display = 'flex';
      showToast("ポケットモード起動");
    };

    function startUnlock(e) {
      e.preventDefault(); 
      cancelUnlock();
      holdProgress = 0;
      if (pocketProgress) pocketProgress.style.width = '0%';
      
      holdInterval = setInterval(() => {
        holdProgress += (100 / 30); // 3秒で100%
        if (pocketProgress) pocketProgress.style.width = `${holdProgress}%`;
        
        if (holdProgress >= 100) {
          forceUnlock();
          showToast("ポケットモード解除");
        }
      }, 100);
    }

    function cancelUnlock() {
      if (holdInterval) {
        clearInterval(holdInterval);
        holdInterval = null;
      }
      holdProgress = 0;
      if (pocketProgress) pocketProgress.style.width = '0%';
    }

    function forceUnlock() {
      cancelUnlock();
      pocketOverlay.style.display = 'none';
      tapCount = 0;
    }

    // Pointer Eventsによる堅牢なロック解除（水滴等によるtouchcancel対策）
    function onPocketPointerDown(e) {
      // Hold-to-unlock progress
      startUnlock(e);

      // 5-tap quick unlock (works together with hold)
      tapCount++;
      clearTimeout(tapTimer);
      if (tapCount >= 5) {
        forceUnlock();
        showToast("強制解除 (5回タップ)");
      } else {
        tapTimer = setTimeout(() => { tapCount = 0; }, 500);
      }
    }

    pocketOverlay.addEventListener('pointerdown', onPocketPointerDown);
    pocketOverlay.addEventListener('pointerup', cancelUnlock);
    pocketOverlay.addEventListener('pointercancel', cancelUnlock);
    pocketOverlay.addEventListener('pointerleave', cancelUnlock);
    pocketOverlay.addEventListener('touchmove', (e) => e.preventDefault(), {passive: false});

    // フェイルセーフ1: ESCキー
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && pocketOverlay.style.display === 'flex') {
        forceUnlock();
        showToast("緊急解除 (ESC)");
      }
    });

  }
  
  function renderRouteMenu() {
    const container = document.getElementById('routeListContainer');
    container.innerHTML = "";
    WORLD_ROUTES.forEach(group => {
      const h3 = document.createElement('div');
      h3.style.cssText = "font-size:12px; color:#666; margin-top:10px; margin-bottom:4px; font-weight:bold;";
      h3.textContent = (AppState.lang === 'ja') ? group.region_ja : group.region_en;
      container.appendChild(h3);
      group.routes.forEach(route => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.textContent = (AppState.lang === 'ja') ? route.name_ja : route.name_en;
        div.onclick = () => {
          AppState.currentRouteId = route.id;
          localStorage.setItem('kaido_active_route', route.id);
          loadActiveRoute();
          closeModals();
          showToast(div.textContent + " Selected");
        };
        container.appendChild(div);
      });
    });
  }

  // =========================================
  // 6. イベントリスナー登録
  // =========================================
  document.getElementById('btnMenuRoutes').onclick = () => openModal('modalRoutes');
  document.getElementById('btnMenuRecord').onclick = () => openModal('modalRecord');
  document.getElementById('btnMenuSettings').onclick = () => openModal('modalSettings');
  document.getElementById('btnMenuReport').onclick = openReportForm;
  document.getElementById('btnStartStopRecord').onclick = () => toggleRecord();
  document.getElementById('btnClearRecord').onclick = clearRecord;
  document.getElementById('btnDownloadGpx').onclick = downloadGpx;
  document.getElementById('btnToggleLang').onclick = toggleLanguage;
  document.getElementById('inpGpxFile').addEventListener('change', importGpx);
  
  // 音声読み上げボタン
  document.getElementById('btnSpeechToggle').onclick = toggleSpeech;

  document.getElementById('btnHamburger').onclick = () => openModal('modalMainMenu');
  document.getElementById('menuItemRoutes').onclick = () => { closeModals(); openModal('modalRoutes'); };
  document.getElementById('menuItemRecord').onclick = () => { closeModals(); openModal('modalRecord'); };
  document.getElementById('menuItemRouteEdit').onclick = () => { closeModals(); openModal('modalRouteEdit'); if (window.RouteEditor) RouteEditor.refreshUI(); };
  document.getElementById('menuItemTrace').onclick = () => { closeModals(); openModal('modalTraceGame'); if (window.TraceGame) TraceGame.refreshUI?.(); };
  document.getElementById('menuItemReport').onclick = () => { closeModals(); openReportForm(); };
  document.getElementById('menuItemSettings').onclick = () => { closeModals(); openModal('modalSettings'); };

  // ★ 侍の目 (画像) イベント修正 ★
  document.getElementById('menuItemSamurai').onclick = () => {
    closeModals();
    document.getElementById('inpSamuraiCamera').click();
  };
  // ファイルが選択されたら handleSamuraiImageSelect を呼ぶ
  document.getElementById('inpSamuraiCamera').onchange = handleSamuraiImageSelect;

  // ★ 温泉 (GPS) ★
  document.getElementById('menuItemOnsen').onclick = () => {
      if(!navigator.geolocation) {
          alert("GPS Not Supported"); return;
      }
      closeModals();
      navigator.geolocation.getCurrentPosition(pos => {
          askOnsen(pos.coords.latitude, pos.coords.longitude);
      }, err => alert("GPS Error: " + err.message));
  };

  // ★ 食事 (GPS) ★
  document.getElementById('menuItemFood').onclick = () => {
      if(!navigator.geolocation) {
          alert("GPS Not Supported"); return;
      }
      closeModals();
      navigator.geolocation.getCurrentPosition(pos => {
          askLocalFood(pos.coords.latitude, pos.coords.longitude);
      }, err => alert("GPS Error: " + err.message));
  };

  // ★ 歴史ガイド (GPS) イベント ★
  document.getElementById('btnHistory').onclick = () => {
      if(!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(pos => {
          askHistoryByGPS(pos.coords.latitude, pos.coords.longitude);
      }, err => alert("GPS Error: " + err.message));
  };

  // 現在地移動
  document.getElementById('btnLocate').onclick = () => {
    if(!navigator.geolocation) return;
    showToast(t('route_loading'));
    navigator.geolocation.getCurrentPosition(pos => {
      const {latitude, longitude} = pos.coords;
      AppState.currentPos = { lat: latitude, lng: longitude };
      map.setView([latitude, longitude], 15);
      if(AppState.layers.me) AppState.layers.me.remove();
      AppState.layers.me = L.circleMarker([latitude, longitude], { radius:8, color:'white', fillColor:'#0066cc', fillOpacity:1 }).addTo(map);
    }, err => alert("GPS Error: " + err.message));
  };


// =========================================
  // 99. 公開API（プラグイン用）
  // =========================================
  // =========================================
  // ★追加：ネイティブGPS連携ヘルパー
  // =========================================
  function getCurrentLocationNative(callback) {
      if (window.AndroidLocation) {
          // アプリ版：Android側でGPSを取得
          const funcName = "onSingleLocation_" + Date.now();
          window[funcName] = function(lat, lng) {
              callback({coords: {latitude: lat, longitude: lng}});
              delete window[funcName]; // メモリ解放
          };
          window.AndroidLocation.requestSingleLocation(funcName);
      } else if (navigator.geolocation) {
          // ブラウザ版（フォールバック）
          navigator.geolocation.getCurrentPosition(callback, err => alert("GPS Error: " + err.message));
      } else {
          alert("GPS Not Supported");
      }
  }

  // アプリ版でのトラッキングデータ受信口
  window.onAndroidLocationUpdated = function(lat, lng) {
      const p = { lat: lat, lng: lng, t: Date.now() };
      AppState.trackPoints.push(p);
      localStorage.setItem('kaido_track_points', JSON.stringify(AppState.trackPoints));
      updateRecordStats();
      drawTrack();
  };
  
  window.SRWorldMap = {
    getMap: () => map,
    getLang: () => AppState.lang,
    t: (k) => t(k),
    getCurrentRouteId: () => AppState.currentRouteId,
    getActiveRouteGeoJSON: () => (AppState.layers.route ? AppState.layers.route.toGeoJSON() : null),
    getActiveRouteBounds: () => (AppState.layers.route ? AppState.layers.route.getBounds() : null)
  };

  // 初期化実行
  restoreMapPosition();
  bindContextMenuOnce();
  updateLanguage();
  if (AppState.currentRouteId) loadActiveRoute();
  drawTrack();

})();