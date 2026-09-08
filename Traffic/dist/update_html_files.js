const fs = require('fs');
const path = require('path');

const studioHTML = `  <!-- Character & Minecraft Skins Studio Modal -->
  <div id="customize-modal" class="studio-modal-backdrop" style="display:none;">
    <div class="studio-container">
      <!-- Modal Header -->
      <div class="studio-header">
        <div class="studio-title-block">
          <div class="studio-badge">HERO STUDIO</div>
          <h2 class="studio-title">Character & Skins Studio</h2>
        </div>
        <div class="studio-header-actions">
          <button class="studio-close-btn" onclick="document.getElementById('customize-modal').style.display='none'" title="Close Studio">✕</button>
        </div>
      </div>

      <!-- Mode Switcher (Stylized 3D vs Minecraft) -->
      <div class="studio-mode-switcher">
        <button id="mode-stylized" class="studio-mode-btn active" onclick="window._setCharMode('stylized')">
          <span class="mode-btn-icon">👤</span>
          <span class="mode-btn-text">3D Stylized Hero</span>
        </button>
        <button id="mode-minecraft" class="studio-mode-btn mc-mode" onclick="window._setCharMode('minecraft')">
          <span class="mode-btn-icon">🟩</span>
          <span class="mode-btn-text">Minecraft Character</span>
        </button>
      </div>

      <!-- Studio Body Grid -->
      <div class="studio-body">
        <!-- Left: 3D Live Turntable Stage -->
        <div class="studio-viewport-card">
          <div class="studio-canvas-wrap">
            <canvas id="customize-preview" width="340" height="460"></canvas>
            <div class="studio-hint-pill">Drag to Rotate 360°</div>
          </div>

          <!-- Interactive Viewport Controls (Camera, Poses, Lighting) -->
          <div class="studio-viewport-controls">
            <!-- Camera Presets -->
            <div class="studio-controls-row">
              <span class="studio-controls-label">Camera</span>
              <div class="studio-btn-group">
                <button id="cam-full" class="studio-icon-btn active" onclick="window._setStudioCamera('full')" title="Full Body View">🧍 Full</button>
                <button id="cam-face" class="studio-icon-btn" onclick="window._setStudioCamera('face')" title="Close-Up Face View">👤 Face</button>
                <button id="cam-outfit" class="studio-icon-btn" onclick="window._setStudioCamera('outfit')" title="Outfit Focus">👕 Top</button>
                <button id="cam-shoes" class="studio-icon-btn" onclick="window._setStudioCamera('shoes')" title="Kicks View">👟 Shoes</button>
              </div>
            </div>

            <!-- Animation / Pose Deck -->
            <div class="studio-controls-row">
              <span class="studio-controls-label">Pose</span>
              <div class="studio-btn-group">
                <button id="pose-idle" class="studio-icon-btn active" onclick="window._setStudioPose('idle')" title="Natural Idle">🧍 Idle</button>
                <button id="pose-walk" class="studio-icon-btn" onclick="window._setStudioPose('walk')" title="Dynamic Walk Cycle">🚶 Walk</button>
                <button id="pose-wave" class="studio-icon-btn" onclick="window._setStudioPose('wave')" title="Friendly Wave">👋 Wave</button>
                <button id="pose-thumbs" class="studio-icon-btn" onclick="window._setStudioPose('thumbs_up')" title="Thumbs Up">👍 Thumbs</button>
                <button id="pose-victory" class="studio-icon-btn" onclick="window._setStudioPose('victory')" title="Victory Cheers">🏆 Victory</button>
              </div>
            </div>

            <!-- Studio Lighting Presets -->
            <div class="studio-controls-row">
              <span class="studio-controls-label">Light</span>
              <div class="studio-btn-group">
                <button id="light-studio" class="studio-icon-btn active" onclick="window._setStudioLighting('studio')" title="Clean Studio 3-Point Light">💡 Studio</button>
                <button id="light-neon" class="studio-icon-btn" onclick="window._setStudioLighting('neon')" title="Cyberpunk Neon Cyan/Magenta">⚡ Neon</button>
                <button id="light-sunset" class="studio-icon-btn" onclick="window._setStudioLighting('sunset')" title="Golden Hour Sunset">🌅 Sunset</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Customization Deck -->
        <div class="studio-customization-deck">
          <!-- 1. STYLIZED 3D CHARACTER CONTROLS -->
          <div id="stylized-tabs-bar" class="studio-tabs-bar">
            <button class="studio-tab active" data-tab="identity" onclick="window._switchStudioTab('identity')">🎭 Identity</button>
            <button class="studio-tab" data-tab="hair" onclick="window._switchStudioTab('hair')">💇 Hair & Face</button>
            <button class="studio-tab" data-tab="outfit" onclick="window._switchStudioTab('outfit')">👕 Outfits</button>
            <button class="studio-tab" data-tab="colors" onclick="window._switchStudioTab('colors')">🎨 Color Palette</button>
            <button class="studio-tab" data-tab="gear" onclick="window._switchStudioTab('gear')">🎒 Gear & Acc</button>
          </div>

          <div id="stylized-panels-container">
            <!-- Identity Tab -->
            <div id="panel-identity" class="studio-panel active">
              <div class="studio-section">
                <div class="studio-section-title">Gender & Frame</div>
                <div style="display:flex; gap:10px;">
                  <button id="gender-male" class="studio-icon-btn active" style="flex:1; padding:10px; font-weight:700;" onclick="window._setGender('male')">👨 Male</button>
                  <button id="gender-female" class="studio-icon-btn" style="flex:1; padding:10px; font-weight:700;" onclick="window._setGender('female')">👩 Female</button>
                </div>
              </div>

              <div class="studio-section">
                <div class="studio-section-title">Quick Mumbai Preset Outfits</div>
                <div id="outfit-presets-grid" class="studio-grid-2"></div>
              </div>

              <div class="studio-section">
                <div class="studio-section-title">Skin Complexion</div>
                <div id="skin-swatches" class="studio-swatches-grid"></div>
              </div>
            </div>

            <!-- Hair & Face Tab -->
            <div id="panel-hair" class="studio-panel" style="display:none;">
              <div class="studio-section">
                <div class="studio-section-title">Hairstyle</div>
                <div id="hairstyle-options" class="studio-grid-2"></div>
              </div>

              <div class="studio-section">
                <div class="studio-section-title">Hair Color</div>
                <div id="hair-swatches" class="studio-swatches-grid"></div>
              </div>

              <div class="studio-section">
                <div class="studio-section-title">Facial Hair</div>
                <div id="facial-hair-options" class="studio-grid-2"></div>
              </div>

              <div class="studio-section">
                <div class="studio-section-title">Eye Iris Color</div>
                <div id="eye-swatches" class="studio-swatches-grid"></div>
              </div>
            </div>

            <!-- Outfits Tab -->
            <div id="panel-outfit" class="studio-panel" style="display:none;">
              <div class="studio-section">
                <div class="studio-section-title">Top & Outerwear</div>
                <div id="outfit-model-options" class="studio-grid-2"></div>
              </div>

              <div class="studio-section">
                <div class="studio-section-title">Bottoms & Pants</div>
                <div id="pants-model-options" class="studio-grid-2"></div>
              </div>

              <div class="studio-section">
                <div class="studio-section-title">Footwear & Kicks</div>
                <div id="shoe-model-options" class="studio-grid-2"></div>
              </div>
            </div>

            <!-- Color Palette Tab -->
            <div id="panel-colors" class="studio-panel" style="display:none;">
              <div class="studio-section">
                <div class="studio-section-title">Top Primary Color</div>
                <div id="shirt-swatches" class="studio-swatches-grid"></div>
              </div>

              <div class="studio-section">
                <div class="studio-section-title">Top Accent / Stripes</div>
                <div id="shirt-accent-swatches" class="studio-swatches-grid"></div>
              </div>

              <div class="studio-section">
                <div class="studio-section-title">Pants / Bottom Color</div>
                <div id="pants-swatches" class="studio-swatches-grid"></div>
              </div>

              <div class="studio-section">
                <div class="studio-section-title">Shoe Main Color</div>
                <div id="shoe-swatches" class="studio-swatches-grid"></div>
              </div>
            </div>

            <!-- Gear & Accessories Tab -->
            <div id="panel-gear" class="studio-panel" style="display:none;">
              <div class="studio-section">
                <div class="studio-section-title">Headwear, Eyewear & Accessories</div>
                <div id="accessory-options" class="studio-grid-2"></div>
              </div>
            </div>
          </div>

          <!-- 2. MINECRAFT CHARACTER CONTROLS -->
          <div id="mc-tabs-bar" class="studio-tabs-bar" style="display:none;">
            <button class="studio-tab active" data-mctab="presets" onclick="window._switchMCTab('presets')">📦 Default Skins</button>
            <button class="studio-tab" data-mctab="upload" onclick="window._switchMCTab('upload')">📤 Custom Upload</button>
            <button class="studio-tab" data-mctab="library" onclick="window._switchMCTab('library')">💾 My Library</button>
          </div>

          <div id="mc-panels-container" style="display:none;">
            <!-- Minecraft Presets Panel -->
            <div id="mcpanel-presets" class="studio-panel active">
              <div class="studio-section">
                <div class="studio-section-title">Arm Model Geometry</div>
                <div style="display:flex; gap:10px;">
                  <button id="mc-arm-classic" class="studio-icon-btn active" style="flex:1; padding:10px; font-weight:700;" onclick="window._setMCArm(false)">Classic (4px Arms)</button>
                  <button id="mc-arm-slim" class="studio-icon-btn" style="flex:1; padding:10px; font-weight:700;" onclick="window._setMCArm(true)">Alex / Slim (3px Arms)</button>
                </div>
              </div>

              <div class="studio-section">
                <div class="studio-section-title">Preloaded Skins Folder</div>
                <div id="mc-presets-grid" class="studio-grid-2"></div>
              </div>
            </div>

            <!-- Minecraft Upload Panel -->
            <div id="mcpanel-upload" class="studio-panel" style="display:none;">
              <div class="studio-section">
                <div class="studio-section-title">Upload Minecraft PNG Skin</div>
                <div class="skin-upload-dropzone" onclick="document.getElementById('mc-skin-file-input').click()">
                  <div style="font-size:2.5rem; margin-bottom:8px;">📁</div>
                  <div style="font-weight:700; color:#fff; margin-bottom:4px;">Click or Drag & Drop Skin File</div>
                  <div style="font-size:0.75rem; color:var(--muted);">Standard 64x64 or 64x32 PNG file</div>
                  <input type="file" id="mc-skin-file-input" accept="image/png" style="display:none;" onchange="window._handleSkinFileUpload(event)" />
                </div>
                <div style="font-size:0.8rem; color:rgba(255,255,255,0.6); line-height:1.5; margin-top:12px;">
                  💡 <strong>Supports all Minecraft skins:</strong> Dual outer jacket/hat/armor layers, transparency, and automatic conversion of legacy 64x32 skins.
                </div>
              </div>
            </div>

            <!-- Minecraft Saved Library Panel -->
            <div id="mcpanel-library" class="studio-panel" style="display:none;">
              <div class="studio-section">
                <div class="studio-section-title">Uploaded & Saved Custom Skins</div>
                <div id="mc-custom-library-grid" class="studio-grid-2"></div>
              </div>
            </div>
          </div>

          <!-- Studio Footer Action Deck -->
          <div class="studio-actions-footer">
            <button class="studio-action-btn secondary" onclick="window._randomizeCustomize()">🎲 Randomize</button>
            <button class="studio-action-btn secondary" onclick="window._resetCustomizeDefault()">🔄 Reset</button>
            <button class="studio-action-btn primary" onclick="window._saveCustomize()">✨ Save & Equip</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;

// 1. Process Driving.html
let drivingPath = path.join(__dirname, 'Driving.html');
let driving = fs.readFileSync(drivingPath, 'utf8');

// Insert minecraft_character.js script tag before ui.js if not present
if (!driving.includes('minecraft_character.js')) {
  driving = driving.replace('<script src="ui.js', '<script src="minecraft_character.js"></script>\n  <script src="ui.js');
}

// Replace #customize-modal
const modalRegex = /<div id="customize-modal"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
if (modalRegex.test(driving)) {
  driving = driving.replace(modalRegex, studioHTML);
}

// Add Customizer button to pause settings if not present
if (!driving.includes('Character & Skins Studio') && driving.includes('pause-amb-volume')) {
  const pauseAnchor = 'id="pause-amb-volume-val"';
  const pauseInsert = `\n      <div style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">
        <button class="btn btn-g" style="width:100%; justify-content:center; gap:10px; font-size:0.92rem; font-weight:700; background:linear-gradient(135deg, rgba(242,184,75,0.15), rgba(94,212,245,0.15)); border:1px solid rgba(242,184,75,0.4); color:#f2b84b; padding:12px; border-radius:12px; cursor:pointer;" onclick="if(window.openCustomize) window.openCustomize();">
          🎨 Character & Skins Studio
        </button>
      </div>`;
  driving = driving.replace(/<\/div>\s*<\/div>\s*<div id="pause-tab-controls"/, `${pauseInsert}\n    </div>\n    <div id="pause-tab-controls"`);
}

fs.writeFileSync(drivingPath, driving, 'utf8');
console.log('Driving.html updated successfully!');

// 2. Process Academy.html
let academyPath = path.join(__dirname, 'Academy.html');
let academy = fs.readFileSync(academyPath, 'utf8');

// Add customizer-studio.css to Academy.html head if not present
if (!academy.includes('customizer-studio.css')) {
  academy = academy.replace('<link rel="stylesheet" href="animations.css" />', '<link rel="stylesheet" href="animations.css" />\n  <link rel="stylesheet" href="customizer-studio.css" />');
}

// Add minecraft_character.js script tag before ui.js if not present
if (!academy.includes('minecraft_character.js')) {
  academy = academy.replace('<script src="ui.js', '<script src="minecraft_character.js"></script>\n  <script src="ui.js');
}

// Replace #customize-modal in Academy.html
if (modalRegex.test(academy)) {
  academy = academy.replace(modalRegex, studioHTML);
}

fs.writeFileSync(academyPath, academy, 'utf8');
console.log('Academy.html updated successfully!');
