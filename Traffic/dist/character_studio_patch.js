(function() {
  const SKINS = [
    { hex: 0xffe0bd, name: 'Fair 1' }, { hex: 0xfce4c7, name: 'Fair 2' },
    { hex: 0xf1c27d, name: 'Warm Beige' }, { hex: 0xe0ac69, name: 'Wheatish' },
    { hex: 0xd4a574, name: 'Medium Mumbai' }, { hex: 0xc68642, name: 'Tan' },
    { hex: 0xb57838, name: 'Dusky' }, { hex: 0x995c2c, name: 'Deep Bronze' },
    { hex: 0x8d5524, name: 'Rich Brown' }, { hex: 0x6e3c16, name: 'Chestnut' },
    { hex: 0x5c3317, name: 'Dark' }, { hex: 0x3d200f, name: 'Deep Espresso' }
  ];
  const HAIRS = [
    { hex: 0x0a0a0a, name: 'Jet Black' }, { hex: 0x221a15, name: 'Espresso' },
    { hex: 0x3d2b1f, name: 'Dark Brown' }, { hex: 0x5c3a21, name: 'Mocha' },
    { hex: 0x8B4513, name: 'Chestnut' }, { hex: 0xb5651d, name: 'Auburn' },
    { hex: 0xd4a017, name: 'Dark Blonde' }, { hex: 0xe8c872, name: 'Golden' },
    { hex: 0xc0c0c0, name: 'Silver Gray' }, { hex: 0xffffff, name: 'Platinum' },
    { hex: 0xd32f2f, name: 'Crimson' }, { hex: 0xe91e63, name: 'Neon Pink' },
    { hex: 0x9c27b0, name: 'Purple' }, { hex: 0x00bcd4, name: 'Cyan Blue' },
    { hex: 0x4caf50, name: 'Emerald' }, { hex: 0xff9800, name: 'Orange Flame' }
  ];
  const HAIRSTYLES = [
    { id: 'quiff', name: 'Modern Quiff', icon: '💇‍♂️', desc: 'Pompadour fade' },
    { id: 'textured_fade', name: 'Textured Fade', icon: '✂️', desc: 'Spiky textured top' },
    { id: 'long_waves', name: 'Long Waves', icon: '🌊', desc: 'Flowing locks' },
    { id: 'ponytail', name: 'High Ponytail', icon: '🎀', desc: 'Sleek tie & ribbon' },
    { id: 'side_part', name: 'Executive Part', icon: '💼', desc: 'Classic side parting' },
    { id: 'curly_afro', name: 'Curly Afro', icon: '🌀', desc: 'Tight textured curls' },
    { id: 'anime_spikes', name: 'Anime Spikes', icon: '⚡', desc: 'Dynamic styled spikes' },
    { id: 'turban', name: 'Royal Pagri', icon: '👑', desc: 'Traditional turban & crest' },
    { id: 'hijab', name: 'Modern Hijab', icon: '🧕', desc: 'Elegant draped wrap' },
    { id: 'buzz', name: 'Buzz Cut', icon: '💈', desc: 'Clean razor fade' },
    { id: 'bald', name: 'Sleek Bald', icon: '✨', desc: 'Smooth aerodynamic' }
  ];
  const FACIAL_HAIR = [
    { id: 'none', name: 'Clean Shaved', icon: '🪒' },
    { id: 'stubble', name: "5 O'Clock Stubble", icon: '🧔‍♂️' },
    { id: 'beard', name: 'Full Sculpted Beard', icon: '🧔' },
    { id: 'mustache', name: 'Mumbai Mustache', icon: '🥸' }
  ];
  const EYES = [
    { hex: 0x4a90d9, name: 'Sky Blue' }, { hex: 0x3d2b1f, name: 'Dark Brown' },
    { hex: 0x2e7d32, name: 'Emerald Green' }, { hex: 0x616161, name: 'Steel Gray' },
    { hex: 0x6d4c41, name: 'Warm Hazel' }, { hex: 0x00acc1, name: 'Bright Teal' },
    { hex: 0x8e24aa, name: 'Amethyst' }, { hex: 0xf59e0b, name: 'Amber Gold' },
    { hex: 0xef4444, name: 'Ruby Glow' }, { hex: 0x111827, name: 'Obsidian' }
  ];
  const OUTFIT_MODELS = [
    { id: 'streetwear', name: 'Urban Hoodie', icon: '🛹', desc: 'Layered streetwear hoodie' },
    { id: 'kaali_peeli', name: 'Kaali-Peeli Jacket', icon: '🚕', desc: 'Yellow racing stripe pilot' },
    { id: 'kurta', name: 'Royal Kurta', icon: '✨', desc: 'Traditional Nehru collar' },
    { id: 'police', name: 'Traffic Police', icon: '👮', desc: 'Khaki duty uniform & badge' },
    { id: 'varsity', name: 'College Varsity', icon: '🎓', desc: 'Striped ribbed jacket' },
    { id: 'safety_vest', name: 'High-Vis Rider', icon: '🦺', desc: 'Reflective safety vest' },
    { id: 'suit', name: 'Executive Suit', icon: '👔', desc: 'Tailored formal blazer' }
  ];
  const SHIRTS = [
    { hex: 0xe74c3c, name: 'Red' }, { hex: 0x3498db, name: 'Blue' },
    { hex: 0x2ecc71, name: 'Green' }, { hex: 0xf39c12, name: 'Orange' },
    { hex: 0x9b59b6, name: 'Purple' }, { hex: 0x1abc9c, name: 'Teal' },
    { hex: 0xe67e22, name: 'Amber' }, { hex: 0x34495e, name: 'Navy' },
    { hex: 0xffffff, name: 'White' }, { hex: 0x18181b, name: 'Black' },
    { hex: 0xf43f5e, name: 'Rose' }, { hex: 0x06b6d4, name: 'Cyan' },
    { hex: 0x84cc16, name: 'Lime' }, { hex: 0x6366f1, name: 'Indigo' },
    { hex: 0xd97706, name: 'Gold' }, { hex: 0x475569, name: 'Slate' }
  ];
  const PANTS_MODELS = [
    { id: 'jeans', name: 'Denim Jeans', icon: '👖' },
    { id: 'cargo', name: 'Cargo Joggers', icon: '🪖' },
    { id: 'chinos', name: 'Slim Chinos', icon: '👔' },
    { id: 'dhoti', name: 'Churidar / Dhoti', icon: '🥻' },
    { id: 'shorts', name: 'Urban Shorts', icon: '🩳' },
    { id: 'formal', name: 'Formal Slacks', icon: '🤵' }
  ];
  const SHOE_MODELS = [
    { id: 'hightops', name: 'High-Top Kicks', icon: '👟' },
    { id: 'runners', name: 'Air Runners', icon: '🏃' },
    { id: 'boots', name: 'Combat Boots', icon: '🥾' },
    { id: 'loafers', name: 'Casual Loafers', icon: '👞' },
    { id: 'sandals', name: 'Kolhapuri Sandals', icon: '👡' },
    { id: 'oxfords', name: 'Formal Oxfords', icon: '✨' }
  ];
  const ACCESSORIES_LIST = [
    { id: 'cap', name: '🧢 Baseball Cap (Front)' },
    { id: 'capBackwards', name: '🧢 Snapback (Back)' },
    { id: 'beanie', name: '🧶 Winter Beanie' },
    { id: 'helmet', name: '⛑️ Racing Full Helmet' },
    { id: 'sunglasses', name: '🕶️ Aviator Sunglasses' },
    { id: 'glasses', name: '👓 Clear Wire Glasses' },
    { id: 'cyberVisor', name: '⚡ Cyberpunk Visor' },
    { id: 'backpack', name: '🎒 Tech Backpack' },
    { id: 'smartwatch', name: '⌚ Glowing Smartwatch' },
    { id: 'headphones', name: '🎧 DJ Headphones' }
  ];

  const OUTFIT_PRESETS = [
    {
      id: 'mumbai_street',
      name: 'Mumbai Streetwear',
      icon: '🛹',
      outfit: 'streetwear',
      shirt: 0xe74c3c,
      shirtAccent: 0xffffff,
      pants: 0x18181b,
      shoes: 0xffffff,
      hairStyle: 'quiff',
      accessories: { cap: true, smartwatch: true, backpack: true }
    },
    {
      id: 'kaali_peeli_driver',
      name: 'Kaali-Peeli Pilot',
      icon: '🚕',
      outfit: 'kaali_peeli',
      shirt: 0x18181b,
      shirtAccent: 0xf5b81e,
      pants: 0x34495e,
      shoes: 0x18181b,
      hairStyle: 'side_part',
      facialHair: 'mustache',
      accessories: { sunglasses: true, smartwatch: true }
    },
    {
      id: 'traffic_warden',
      name: 'Mumbai Traffic Police',
      icon: '👮',
      outfit: 'police',
      shirt: 0xd7b987,
      shirtAccent: 0x1e293b,
      pants: 0xd7b987,
      shoes: 0x18181b,
      hairStyle: 'buzz',
      facialHair: 'mustache',
      accessories: { cap: true }
    },
    {
      id: 'royal_kurta',
      name: 'Royal Nehru Kurta',
      icon: '👑',
      outfit: 'kurta',
      shirt: 0xffffff,
      shirtAccent: 0xd97706,
      pants: 0xf5f5f5,
      shoes: 0xb57838,
      hairStyle: 'turban',
      accessories: { glasses: true }
    },
    {
      id: 'varsity_casual',
      name: 'Varsity Student',
      icon: '🎓',
      outfit: 'varsity',
      shirt: 0x3498db,
      shirtAccent: 0xffffff,
      pants: 0x475569,
      shoes: 0xffffff,
      hairStyle: 'textured_fade',
      accessories: { headphones: true, backpack: true, smartwatch: true }
    },
    {
      id: 'night_rider',
      name: 'Cyberpunk Night Rider',
      icon: '⚡',
      outfit: 'kaali_peeli',
      shirt: 0x111827,
      shirtAccent: 0x00f0cc,
      pants: 0x111827,
      shoes: 0x00f0cc,
      hairStyle: 'anime_spikes',
      hair: 0x00bcd4,
      accessories: { cyberVisor: true, smartwatch: true }
    }
  ];

  let _current = {
    charType: 'stylized',
    gender: 'male',
    mcSkin: 'steve',
    mcSkinUrl: 'skins/steve.png',
    mcIsSlim: false,
    outfit: 'streetwear',
    skin: 0xd4a574,
    hair: 0x1a1a1a,
    hairStyle: 'quiff',
    hairHighlight: 0x3498db,
    facialHair: 'none',
    eyeColor: 0x4a90d9,
    shirt: 0xe74c3c,
    shirtAccent: 0xffffff,
    pants: 0x2c3e50,
    pantsStyle: 'jeans',
    shoes: 0x1a1a1a,
    shoeStyle: 'hightops',
    accessories: {
      cap: false,
      capBackwards: false,
      beanie: false,
      helmet: false,
      sunglasses: false,
      glasses: false,
      cyberVisor: false,
      backpack: true,
      smartwatch: true,
      headphones: false
    }
  };

  let _activeStudioTab = 'identity';
  let _activeMCTab = 'presets';
  let _studioPose = 'idle';
  let _studioLighting = 'studio';
  let _previewScene, _previewCamera, _previewRenderer, _previewChar, _previewRAF;
  let _keyLight, _fillLight, _rimLight;

  function _loadSaved() {
    try {
      const s = JSON.parse(localStorage.getItem('traffic_appearance'));
      if (s) {
        _current = Object.assign({}, _current, s);
      }
    } catch (e) {}
  }

  async function _syncAppearanceFromCloud() {
    if (!window.supabaseClient || !window.colUser?.id) return;
    try {
      const { data, error } = await window.supabaseClient
        .from('user_profiles')
        .select('appearance, appearance_updated_at')
        .eq('user_id', window.colUser.id)
        .maybeSingle();
      if (error || !data || !data.appearance) return;
      const localRaw = localStorage.getItem('traffic_appearance');
      if (localRaw) {
        try {
          const local = JSON.parse(localRaw);
          const cloudTime = data.appearance_updated_at ? new Date(data.appearance_updated_at).getTime() : 0;
          const localTime = local._updated || 0;
          if (cloudTime <= localTime) return;
        } catch (e) {}
      }
      localStorage.setItem('traffic_appearance', JSON.stringify(data.appearance));
      _loadSaved();
      _renderStudioUI();
      _updatePreviewModel();
    } catch (e) {
      console.warn('[customize] Cloud sync error:', e);
    }
  }

  async function _syncAppearanceToCloud() {
    if (!window.supabaseClient || !window.colUser?.id) return;
    try {
      await window.supabaseClient
        .from('user_profiles')
        .upsert({
          user_id: window.colUser.id,
          appearance: Object.assign({}, _current, { _updated: Date.now() }),
          appearance_updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('[customize] Cloud save error:', e);
    }
  }

  function _swatchHTML(items, selected, group) {
    return items.map(function(it) {
      const isSel = it.hex === selected;
      const css = new THREE.Color(it.hex).getStyle();
      return '<button title="' + it.name + '" onclick="window._pickSwatch(\'' + group + '\',' + it.hex + ')" class="studio-swatch-btn ' + (isSel ? 'active' : '') + '" style="background:' + css + ';"></button>';
    }).join('');
  }

  function _renderStudioUI() {
    const mStylized = document.getElementById('mode-stylized');
    const mMC = document.getElementById('mode-minecraft');
    const stylTabs = document.getElementById('stylized-tabs-bar');
    const mcTabs = document.getElementById('mc-tabs-bar');
    const stylPanels = document.getElementById('stylized-panels-container');
    const mcPanels = document.getElementById('mc-panels-container');

    const isMC = _current.charType === 'minecraft';
    if (mStylized) mStylized.className = 'studio-mode-btn ' + (!isMC ? 'active' : '');
    if (mMC) mMC.className = 'studio-mode-btn mc-mode ' + (isMC ? 'active' : '');
    if (stylTabs) stylTabs.style.display = isMC ? 'none' : 'flex';
    if (mcTabs) mcTabs.style.display = isMC ? 'flex' : 'none';
    if (stylPanels) stylPanels.style.display = isMC ? 'none' : 'flex';
    if (mcPanels) mcPanels.style.display = isMC ? 'flex' : 'none';

    const gM = document.getElementById('gender-male');
    const gF = document.getElementById('gender-female');
    if (gM) gM.className = 'studio-icon-btn ' + (_current.gender === 'male' ? 'active' : '');
    if (gF) gF.className = 'studio-icon-btn ' + (_current.gender === 'female' ? 'active' : '');

    const pGrid = document.getElementById('outfit-presets-grid');
    if (pGrid) {
      pGrid.innerHTML = OUTFIT_PRESETS.map(function(p) {
        return '<button class="studio-card-btn" onclick="window._pickOutfitPreset(\'' + p.id + '\')">' +
          '<span class="studio-card-icon">' + p.icon + '</span>' +
          '<span class="studio-card-name">' + p.name + '</span>' +
        '</button>';
      }).join('');
    }

    const ss = document.getElementById('skin-swatches');
    const hs = document.getElementById('hair-swatches');
    const es = document.getElementById('eye-swatches');
    const shs = document.getElementById('shirt-swatches');
    const shAcc = document.getElementById('shirt-accent-swatches');
    const ps = document.getElementById('pants-swatches');
    const shoes = document.getElementById('shoe-swatches');

    if (ss) ss.innerHTML = _swatchHTML(SKINS, _current.skin, 'skin');
    if (hs) hs.innerHTML = _swatchHTML(HAIRS, _current.hair, 'hair');
    if (es) es.innerHTML = _swatchHTML(EYES, _current.eyeColor, 'eyeColor');
    if (shs) shs.innerHTML = _swatchHTML(SHIRTS, _current.shirt, 'shirt');
    if (shAcc) shAcc.innerHTML = _swatchHTML(SHIRTS, _current.shirtAccent, 'shirtAccent');
    if (ps) ps.innerHTML = _swatchHTML(SHIRTS, _current.pants, 'pants');
    if (shoes) shoes.innerHTML = _swatchHTML(SHIRTS, _current.shoes, 'shoes');

    const hys = document.getElementById('hairstyle-options');
    if (hys) {
      hys.innerHTML = HAIRSTYLES.map(function(h) {
        return '<button class="studio-card-btn ' + (_current.hairStyle === h.id ? 'active' : '') + '" onclick="window._pickHairstyle(\'' + h.id + '\')">' +
          '<span class="studio-card-icon">' + h.icon + '</span>' +
          '<span class="studio-card-name">' + h.name + '</span>' +
          '<span class="studio-card-sub">' + h.desc + '</span>' +
        '</button>';
      }).join('');
    }

    const fhs = document.getElementById('facial-hair-options');
    if (fhs) {
      fhs.innerHTML = FACIAL_HAIR.map(function(f) {
        return '<button class="studio-card-btn ' + (_current.facialHair === f.id ? 'active' : '') + '" onclick="window._pickFacialHair(\'' + f.id + '\')">' +
          '<span class="studio-card-icon">' + f.icon + '</span>' +
          '<span class="studio-card-name">' + f.name + '</span>' +
        '</button>';
      }).join('');
    }

    const oms = document.getElementById('outfit-model-options');
    if (oms) {
      oms.innerHTML = OUTFIT_MODELS.map(function(o) {
        return '<button class="studio-card-btn ' + (_current.outfit === o.id ? 'active' : '') + '" onclick="window._pickOutfitModel(\'' + o.id + '\')">' +
          '<span class="studio-card-icon">' + o.icon + '</span>' +
          '<span class="studio-card-name">' + o.name + '</span>' +
          '<span class="studio-card-sub">' + o.desc + '</span>' +
        '</button>';
      }).join('');
    }

    const pms = document.getElementById('pants-model-options');
    if (pms) {
      pms.innerHTML = PANTS_MODELS.map(function(p) {
        return '<button class="studio-card-btn ' + (_current.pantsStyle === p.id ? 'active' : '') + '" onclick="window._pickPantsModel(\'' + p.id + '\')">' +
          '<span class="studio-card-icon">' + p.icon + '</span>' +
          '<span class="studio-card-name">' + p.name + '</span>' +
        '</button>';
      }).join('');
    }

    const sms = document.getElementById('shoe-model-options');
    if (sms) {
      sms.innerHTML = SHOE_MODELS.map(function(s) {
        return '<button class="studio-card-btn ' + (_current.shoeStyle === s.id ? 'active' : '') + '" onclick="window._pickShoeModel(\'' + s.id + '\')">' +
          '<span class="studio-card-icon">' + s.icon + '</span>' +
          '<span class="studio-card-name">' + s.name + '</span>' +
        '</button>';
      }).join('');
    }

    const aos = document.getElementById('accessory-options');
    if (aos) {
      aos.innerHTML = ACCESSORIES_LIST.map(function(a) {
        const on = !!_current.accessories[a.id];
        return '<button class="studio-card-btn ' + (on ? 'active' : '') + '" onclick="window._toggleAccessory(\'' + a.id + '\')">' +
          '<span class="studio-card-name">' + a.name + '</span>' +
          '<span class="studio-card-sub">' + (on ? '🟢 Equipped' : '⚪ Unequipped') + '</span>' +
        '</button>';
      }).join('');
    }

    const mcGrid = document.getElementById('mc-presets-grid');
    if (mcGrid && window.MinecraftSkinManager) {
      const defSkins = window.MinecraftSkinManager.DEFAULT_SKINS;
      mcGrid.innerHTML = defSkins.map(function(s) {
        return '<button class="studio-card-btn ' + (_current.mcSkin === s.id && !_current.mcIsCustom ? 'active' : '') + '" onclick="window._pickMCPreset(\'' + s.id + '\')">' +
          '<span class="studio-card-icon">' + s.icon + '</span>' +
          '<span class="studio-card-name">' + s.name + '</span>' +
          '<span class="studio-card-sub">' + s.desc + '</span>' +
        '</button>';
      }).join('');
    }

    const libGrid = document.getElementById('mc-custom-library-grid');
    if (libGrid && window.MinecraftSkinManager) {
      const customs = window.MinecraftSkinManager.getCustomSkins();
      if (customs.length === 0) {
        libGrid.innerHTML = '<div style="color:rgba(255,255,255,0.5); font-size:0.85rem; padding:20px; text-align:center; grid-column:1/-1;">No custom skins uploaded yet. Use the Upload tab to add one!</div>';
      } else {
        libGrid.innerHTML = customs.map(function(c) {
          return '<div class="studio-card-btn ' + (_current.mcSkinUrl === c.dataUrl ? 'active' : '') + '" style="position:relative;">' +
            '<div onclick="window._pickMCCustomSkin(\'' + c.id + '\')" style="cursor:pointer;">' +
              '<span class="studio-card-icon">🎨</span>' +
              '<span class="studio-card-name">' + c.name + '</span>' +
            '</div>' +
            '<button onclick="window._deleteCustomSkin(\'' + c.id + '\')" style="position:absolute; top:6px; right:6px; background:rgba(239,68,68,0.2); border:none; color:#ef4444; border-radius:6px; width:22px; height:22px; cursor:pointer;" title="Delete Skin">✕</button>' +
          '</div>';
        }).join('');
      }
    }
  }

  function _initPreview() {
    const canvas = document.getElementById('customize-preview');
    if (!canvas || !window.THREE) return;

    if (!canvas.dataset.dragInit) {
      canvas.dataset.dragInit = "true";
      let isDragging = false;
      let prevX = 0;

      canvas.addEventListener('mousedown', function(e) {
        isDragging = true;
        window._autoRotatePreview = false;
        prevX = e.clientX;
      });
      window.addEventListener('mousemove', function(e) {
        if (isDragging && _previewChar) {
          const dx = e.clientX - prevX;
          _previewChar.rotation.y += dx * 0.012;
          prevX = e.clientX;
        }
      });
      window.addEventListener('mouseup', function() { isDragging = false; });

      canvas.addEventListener('touchstart', function(e) {
        isDragging = true;
        window._autoRotatePreview = false;
        prevX = e.touches[0].clientX;
      }, { passive: true });
      window.addEventListener('touchmove', function(e) {
        if (isDragging && _previewChar && e.touches[0]) {
          const dx = e.touches[0].clientX - prevX;
          _previewChar.rotation.y += dx * 0.012;
          prevX = e.touches[0].clientX;
        }
      }, { passive: true });
      window.addEventListener('touchend', function() { isDragging = false; });
    }

    if (_previewRenderer) {
      cancelAnimationFrame(_previewRAF);
      _previewRenderer.dispose();
    }

    _previewScene = new THREE.Scene();
    _previewScene.background = new THREE.Color(0x070a14);

    _previewCamera = new THREE.PerspectiveCamera(32, canvas.width / canvas.height, 0.1, 50);
    _previewCamera.position.set(0, 0.92, 3.4);
    _previewCamera.lookAt(0, 0.88, 0);

    _previewRenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    _previewRenderer.setSize(canvas.width, canvas.height);
    _previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    _previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    _previewRenderer.toneMappingExposure = 1.1;

    const amb = new THREE.AmbientLight(0x8899bb, 0.45);
    _previewScene.add(amb);

    _keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    _keyLight.position.set(3, 4, 4);
    _previewScene.add(_keyLight);

    _fillLight = new THREE.DirectionalLight(0x88bbff, 0.5);
    _fillLight.position.set(-3, 2, 3);
    _previewScene.add(_fillLight);

    _rimLight = new THREE.DirectionalLight(0x5ed4f5, 0.8);
    _rimLight.position.set(0, 3, -4);
    _previewScene.add(_rimLight);

    const floorGeo = new THREE.CircleGeometry(2.2, 32);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x0e172a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    _previewScene.add(floor);

    const floorRing = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.73, 48),
      new THREE.MeshBasicMaterial({ color: 0x5ed4f5, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })
    );
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = 0.001;
    _previewScene.add(floorRing);

    _updatePreviewModel();
  }

  function _updatePreviewModel() {
    if (!_previewScene) return;
    if (_previewChar) _previewScene.remove(_previewChar);
    _previewChar = _buildHuman(true, _current);
    _previewChar.position.set(0, 0, 0);
    if (_previewChar.userData) _previewChar.userData.pose = _studioPose;
    _previewScene.add(_previewChar);
  }

  function _animatePreview() {
    if (!_previewRenderer) return;
    _previewRAF = requestAnimationFrame(_animatePreview);
    if (_previewChar) {
      if (window._autoRotatePreview !== false) {
        _previewChar.rotation.y += 0.005;
      }
      if (_previewChar.userData && typeof _previewChar.userData.update === 'function') {
        _previewChar.userData.pose = _studioPose;
        _previewChar.userData.update(0.016, _studioPose === 'walk' ? 0.8 : 0);
      }
    }
    _previewRenderer.render(_previewScene, _previewCamera);
  }

  window._setCharMode = function(mode) {
    _current.charType = mode;
    _renderStudioUI();
    _updatePreviewModel();
  };

  window._switchStudioTab = function(tab) {
    _activeStudioTab = tab;
    document.querySelectorAll('#stylized-tabs-bar .studio-tab').forEach(function(b) {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('#stylized-panels-container .studio-panel').forEach(function(p) {
      p.style.display = p.id === 'panel-' + tab ? 'block' : 'none';
    });
  };

  window._switchMCTab = function(mctab) {
    _activeMCTab = mctab;
    document.querySelectorAll('#mc-tabs-bar .studio-tab').forEach(function(b) {
      b.classList.toggle('active', b.dataset.mctab === mctab);
    });
    document.querySelectorAll('#mc-panels-container .studio-panel').forEach(function(p) {
      p.style.display = p.id === 'mcpanel-' + mctab ? 'block' : 'none';
    });
  };

  window._pickOutfitPreset = function(presetId) {
    const p = OUTFIT_PRESETS.find(function(x) { return x.id === presetId; });
    if (p) {
      _current.outfit = p.outfit;
      _current.shirt = p.shirt;
      _current.shirtAccent = p.shirtAccent;
      _current.pants = p.pants;
      _current.shoes = p.shoes;
      if (p.hairStyle) _current.hairStyle = p.hairStyle;
      if (p.hair) _current.hair = p.hair;
      if (p.facialHair) _current.facialHair = p.facialHair;
      if (p.accessories) _current.accessories = Object.assign({}, p.accessories);
      _renderStudioUI();
      _updatePreviewModel();
    }
  };

  window._setGender = function(gender) {
    _current.gender = gender;
    _renderStudioUI();
    _updatePreviewModel();
  };

  window._pickSwatch = function(group, hex) {
    _current[group] = hex;
    _renderStudioUI();
    _updatePreviewModel();
  };

  window._pickHairstyle = function(id) {
    _current.hairStyle = id;
    _renderStudioUI();
    _updatePreviewModel();
  };

  window._pickFacialHair = function(id) {
    _current.facialHair = id;
    _renderStudioUI();
    _updatePreviewModel();
  };

  window._pickOutfitModel = function(id) {
    _current.outfit = id;
    _renderStudioUI();
    _updatePreviewModel();
  };

  window._pickPantsModel = function(id) {
    _current.pantsStyle = id;
    _renderStudioUI();
    _updatePreviewModel();
  };

  window._pickShoeModel = function(id) {
    _current.shoeStyle = id;
    _renderStudioUI();
    _updatePreviewModel();
  };

  window._toggleAccessory = function(id) {
    _current.accessories[id] = !_current.accessories[id];
    if (id === 'cap' && _current.accessories.cap) { _current.accessories.capBackwards = false; _current.accessories.beanie = false; _current.accessories.helmet = false; }
    if (id === 'capBackwards' && _current.accessories.capBackwards) { _current.accessories.cap = false; _current.accessories.beanie = false; _current.accessories.helmet = false; }
    if (id === 'beanie' && _current.accessories.beanie) { _current.accessories.cap = false; _current.accessories.capBackwards = false; _current.accessories.helmet = false; }
    if (id === 'helmet' && _current.accessories.helmet) { _current.accessories.cap = false; _current.accessories.capBackwards = false; _current.accessories.beanie = false; }
    _renderStudioUI();
    _updatePreviewModel();
  };

  window._pickMCPreset = function(id) {
    _current.mcSkin = id;
    _current.mcSkinUrl = 'skins/' + id + '.png';
    _current.mcIsCustom = false;
    const s = window.MinecraftSkinManager?.DEFAULT_SKINS?.find(function(x) { return x.id === id; });
    if (s && s.isSlim !== undefined) _current.mcIsSlim = s.isSlim;
    _renderStudioUI();
    _updatePreviewModel();
  };

  window._setMCArm = function(isSlim) {
    _current.mcIsSlim = isSlim;
    const cArm = document.getElementById('mc-arm-classic');
    const sArm = document.getElementById('mc-arm-slim');
    if (cArm) cArm.classList.toggle('active', !isSlim);
    if (sArm) sArm.classList.toggle('active', isSlim);
    _updatePreviewModel();
  };

  window._handleSkinFileUpload = async function(event) {
    const file = event.target?.files?.[0];
    if (!file || !window.MinecraftSkinManager) return;
    try {
      const res = await window.MinecraftSkinManager.processSkinFile(file);
      const saved = window.MinecraftSkinManager.saveCustomSkin(res.name, res.dataUrl);
      _current.mcSkinUrl = saved.dataUrl;
      _current.mcSkin = saved.id;
      _current.mcIsCustom = true;
      _renderStudioUI();
      _updatePreviewModel();
      window._switchMCTab('library');
      toast('✅ Custom Minecraft Skin loaded!', '#2ecc71');
    } catch (e) {
      alert(e.message || 'Failed to upload skin');
    }
  };

  window._pickMCCustomSkin = function(id) {
    const customs = window.MinecraftSkinManager?.getCustomSkins() || [];
    const skin = customs.find(function(s) { return s.id === id; });
    if (skin) {
      _current.mcSkinUrl = skin.dataUrl;
      _current.mcSkin = skin.id;
      _current.mcIsCustom = true;
      _renderStudioUI();
      _updatePreviewModel();
    }
  };

  window._deleteCustomSkin = function(id) {
    if (window.MinecraftSkinManager) {
      window.MinecraftSkinManager.deleteCustomSkin(id);
      _renderStudioUI();
    }
  };

  window._setStudioCamera = function(view) {
    document.querySelectorAll('.studio-controls-row .studio-icon-btn').forEach(function(b) {
      if (b.id && b.id.startsWith('cam-')) b.classList.toggle('active', b.id === 'cam-' + view);
    });
    if (!_previewCamera) return;
    if (view === 'face') {
      _previewCamera.position.set(0, 1.56, 1.6);
      _previewCamera.lookAt(0, 1.50, 0);
    } else if (view === 'outfit') {
      _previewCamera.position.set(0, 1.15, 2.2);
      _previewCamera.lookAt(0, 1.05, 0);
    } else if (view === 'shoes') {
      _previewCamera.position.set(0, 0.40, 1.8);
      _previewCamera.lookAt(0, 0.20, 0);
    } else {
      _previewCamera.position.set(0, 0.92, 3.4);
      _previewCamera.lookAt(0, 0.88, 0);
    }
  };

  window._setStudioPose = function(pose) {
    _studioPose = pose;
    document.querySelectorAll('.studio-controls-row .studio-icon-btn').forEach(function(b) {
      if (b.id && b.id.startsWith('pose-')) b.classList.toggle('active', b.id === 'pose-' + (pose === 'thumbs_up' ? 'thumbs' : pose));
    });
    if (_previewChar && _previewChar.userData) {
      _previewChar.userData.pose = pose;
    }
  };

  window._setStudioLighting = function(light) {
    _studioLighting = light;
    document.querySelectorAll('.studio-controls-row .studio-icon-btn').forEach(function(b) {
      if (b.id && b.id.startsWith('light-')) b.classList.toggle('active', b.id === 'light-' + light);
    });
    if (!_keyLight || !_fillLight || !_rimLight) return;
    if (light === 'neon') {
      _keyLight.color.setHex(0x00f0cc); _keyLight.intensity = 1.4;
      _fillLight.color.setHex(0xff007f); _fillLight.intensity = 1.0;
      _rimLight.color.setHex(0x38bdf8); _rimLight.intensity = 1.2;
    } else if (light === 'sunset') {
      _keyLight.color.setHex(0xffaa44); _keyLight.intensity = 1.5;
      _fillLight.color.setHex(0x883399); _fillLight.intensity = 0.6;
      _rimLight.color.setHex(0xffdd66); _rimLight.intensity = 0.9;
    } else {
      _keyLight.color.setHex(0xffeedd); _keyLight.intensity = 1.2;
      _fillLight.color.setHex(0x88bbff); _fillLight.intensity = 0.5;
      _rimLight.color.setHex(0x5ed4f5); _rimLight.intensity = 0.8;
    }
  };

  window._randomizeCustomize = function() {
    if (_current.charType === 'minecraft') {
      const defs = window.MinecraftSkinManager?.DEFAULT_SKINS || [];
      const pick = defs[Math.floor(Math.random() * defs.length)];
      if (pick) window._pickMCPreset(pick.id);
    } else {
      _current.skin = SKINS[Math.floor(Math.random() * SKINS.length)].hex;
      _current.hair = HAIRS[Math.floor(Math.random() * HAIRS.length)].hex;
      _current.hairStyle = HAIRSTYLES[Math.floor(Math.random() * HAIRSTYLES.length)].id;
      _current.eyeColor = EYES[Math.floor(Math.random() * EYES.length)].hex;
      _current.shirt = SHIRTS[Math.floor(Math.random() * SHIRTS.length)].hex;
      _current.shirtAccent = SHIRTS[Math.floor(Math.random() * SHIRTS.length)].hex;
      _current.pants = SHIRTS[Math.floor(Math.random() * SHIRTS.length)].hex;
      _current.shoes = SHIRTS[Math.floor(Math.random() * SHIRTS.length)].hex;
      _current.outfit = OUTFIT_MODELS[Math.floor(Math.random() * OUTFIT_MODELS.length)].id;
      _renderStudioUI();
      _updatePreviewModel();
    }
  };

  window._resetCustomizeDefault = function() {
    _current = {
      charType: 'stylized',
      gender: 'male',
      mcSkin: 'steve',
      mcSkinUrl: 'skins/steve.png',
      mcIsSlim: false,
      outfit: 'streetwear',
      skin: 0xd4a574,
      hair: 0x1a1a1a,
      hairStyle: 'quiff',
      hairHighlight: 0x3498db,
      facialHair: 'none',
      eyeColor: 0x4a90d9,
      shirt: 0xe74c3c,
      shirtAccent: 0xffffff,
      pants: 0x2c3e50,
      pantsStyle: 'jeans',
      shoes: 0x1a1a1a,
      shoeStyle: 'hightops',
      accessories: { cap: false, capBackwards: false, beanie: false, helmet: false, sunglasses: false, glasses: false, cyberVisor: false, backpack: true, smartwatch: true, headphones: false }
    };
    _renderStudioUI();
    _updatePreviewModel();
  };

  window._saveCustomize = function() {
    _current._updated = Date.now();
    localStorage.setItem('traffic_appearance', JSON.stringify(_current));
    _syncAppearanceToCloud();

    const modal = document.getElementById('customize-modal');
    if (modal) modal.style.display = 'none';
    if (_previewRenderer) { cancelAnimationFrame(_previewRAF); _previewRenderer.dispose(); _previewRenderer = null; }

    if (window.game && window.game.player && window.game.playerCharacter) {
      const pos = window.game.playerCharacter.position.clone();
      const rot = window.game.playerCharacter.rotation.y;
      window.game.scene.remove(window.game.playerCharacter);
      window.game.playerCharacter = _buildHuman(true);
      window.game.playerCharacter.position.copy(pos);
      window.game.playerCharacter.rotation.y = rot;
      window.game.scene.add(window.game.playerCharacter);
      window.game.player = window.game.playerCharacter;
      toast('✨ Character & Outfit updated live!', '#34d399');
    } else {
      toast('✨ Appearance saved!', '#34d399');
    }
  };

  window.openCustomize = function() {
    _loadSaved();
    _syncAppearanceFromCloud();
    const modal = document.getElementById('customize-modal');
    if (modal) {
      modal.style.display = 'flex';
      _renderStudioUI();
      _initPreview();
      _animatePreview();
    }
  };
})();
