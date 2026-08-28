const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal PNG encoder
function createPNG(width, height, rgbaBuffer) {
  function crc32(buf) {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    return (crc ^ (-1)) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const combined = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter 0
  ihdr[12] = 0; // Non-interlaced

  const scanlines = [];
  for (let y = 0; y < height; y++) {
    scanlines.push(Buffer.from([0])); // Filter type 0 (None)
    scanlines.push(rgbaBuffer.slice(y * width * 4, (y + 1) * width * 4));
  }
  const rawData = Buffer.concat(scanlines);
  const compressed = zlib.deflateSync(rawData);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

class SkinPainter {
  constructor() {
    this.buffer = Buffer.alloc(64 * 64 * 4, 0);
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= 64 || y < 0 || y >= 64) return;
    const idx = (y * 64 + x) * 4;
    this.buffer[idx] = r;
    this.buffer[idx + 1] = g;
    this.buffer[idx + 2] = b;
    this.buffer[idx + 3] = a;
  }

  fillRect(x, y, w, h, [r, g, b, a = 255]) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }

  noiseRect(x, y, w, h, [r, g, b, a = 255], jitter = 12) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        const j = Math.floor((Math.sin(px * 12.3 + py * 45.6) * 0.5 + 0.5) * jitter * 2) - jitter;
        this.setPixel(
          px, py,
          Math.max(0, Math.min(255, r + j)),
          Math.max(0, Math.min(255, g + j)),
          Math.max(0, Math.min(255, b + j)),
          a
        );
      }
    }
  }

  toPNG() {
    return createPNG(64, 64, this.buffer);
  }
}

// 1. STEVE SKIN
function buildSteve() {
  const p = new SkinPainter();
  const skin = [187, 134, 99];
  const hair = [74, 45, 24];
  const eyes = [40, 40, 200];
  const shirt = [0, 160, 175];
  const pants = [45, 45, 140];
  const shoes = [80, 80, 80];

  // Head
  p.noiseRect(0, 0, 32, 16, skin, 8);
  p.noiseRect(8, 0, 8, 8, hair, 6); // Top head hair
  p.noiseRect(0, 8, 32, 3, hair, 6); // Hair band
  p.fillRect(10, 10, 1, 1, eyes); // Left eye
  p.fillRect(9, 10, 1, 1, [255, 255, 255]); // Left sclera
  p.fillRect(13, 10, 1, 1, eyes); // Right eye
  p.fillRect(14, 10, 1, 1, [255, 255, 255]); // Right sclera
  p.fillRect(11, 12, 2, 1, [140, 80, 60]); // Nose/Mouth

  // Torso (Cyan shirt)
  p.noiseRect(16, 16, 24, 16, shirt, 10);
  p.fillRect(22, 20, 4, 3, skin); // Neck collar

  // Right Arm (Cyan sleeve + skin)
  p.noiseRect(40, 16, 16, 4, shirt, 8);
  p.noiseRect(40, 20, 16, 12, skin, 8);

  // Left Arm (Cyan sleeve + skin)
  p.noiseRect(32, 48, 16, 4, shirt, 8);
  p.noiseRect(32, 52, 16, 12, skin, 8);

  // Right Leg (Blue jeans + shoes)
  p.noiseRect(0, 16, 16, 12, pants, 8);
  p.fillRect(0, 28, 16, 4, shoes);

  // Left Leg (Blue jeans + shoes)
  p.noiseRect(16, 48, 16, 12, pants, 8);
  p.fillRect(16, 60, 16, 4, shoes);

  return p.toPNG();
}

// 2. ALEX SKIN
function buildAlex() {
  const p = new SkinPainter();
  const skin = [220, 175, 140];
  const hair = [180, 95, 40];
  const eyes = [50, 140, 50];
  const shirt = [90, 130, 75];
  const pants = [100, 70, 50];
  const shoes = [70, 70, 70];

  // Head
  p.noiseRect(0, 0, 32, 16, skin, 6);
  p.noiseRect(8, 0, 8, 8, hair, 8);
  p.noiseRect(0, 8, 32, 4, hair, 8);
  p.fillRect(10, 10, 1, 1, eyes);
  p.fillRect(9, 10, 1, 1, [255, 255, 255]);
  p.fillRect(13, 10, 1, 1, eyes);
  p.fillRect(14, 10, 1, 1, [255, 255, 255]);
  p.fillRect(11, 12, 2, 1, [180, 120, 100]);

  // Torso (Green shirt + brown belt)
  p.noiseRect(16, 16, 24, 16, shirt, 8);
  p.fillRect(16, 29, 24, 3, [60, 45, 30]); // Belt

  // Arms
  p.noiseRect(40, 16, 16, 4, shirt, 8);
  p.noiseRect(40, 20, 16, 12, skin, 6);
  p.noiseRect(32, 48, 16, 4, shirt, 8);
  p.noiseRect(32, 52, 16, 12, skin, 6);

  // Legs
  p.noiseRect(0, 16, 16, 12, pants, 8);
  p.fillRect(0, 28, 16, 4, shoes);
  p.noiseRect(16, 48, 16, 12, pants, 8);
  p.fillRect(16, 60, 16, 4, shoes);

  return p.toPNG();
}

// 3. MUMBAI TRAFFIC POLICE
function buildPolice() {
  const p = new SkinPainter();
  const skin = [190, 140, 100];
  const hair = [30, 25, 25];
  const khaki = [215, 185, 135];
  const khakiDk = [170, 140, 95];
  const navy = [25, 35, 60];
  const gold = [250, 200, 40];
  const black = [20, 20, 20];

  // Head
  p.noiseRect(0, 0, 32, 16, skin, 6);
  p.noiseRect(8, 0, 8, 8, hair, 4);
  p.noiseRect(0, 8, 32, 3, hair, 4);
  p.fillRect(10, 10, 1, 1, [50, 40, 30]);
  p.fillRect(9, 10, 1, 1, [255, 255, 255]);
  p.fillRect(13, 10, 1, 1, [50, 40, 30]);
  p.fillRect(14, 10, 1, 1, [255, 255, 255]);
  p.fillRect(10, 12, 4, 1, [40, 30, 25]); // Mustache

  // Police Cap (Layer 2 Head)
  p.fillRect(32, 0, 32, 16, [0, 0, 0, 0]); // clear layer 2
  p.noiseRect(40, 0, 8, 8, navy, 4); // Cap top
  p.noiseRect(32, 8, 32, 4, navy, 4); // Cap band
  p.fillRect(43, 9, 2, 2, gold); // Badge
  p.fillRect(40, 12, 8, 2, black); // Visor

  // Torso (Khaki Uniform with Badges & Belt)
  p.noiseRect(16, 16, 24, 16, khaki, 6);
  p.fillRect(21, 22, 2, 2, khakiDk); // Left pocket
  p.fillRect(25, 22, 2, 2, khakiDk); // Right pocket
  p.fillRect(21, 21, 1, 1, gold); // Star badge
  p.fillRect(16, 29, 24, 3, black); // Police duty belt
  p.fillRect(23, 29, 2, 3, gold); // Brass buckle

  // Epaulettes on shoulders (Layer 2 Torso)
  p.fillRect(16, 32, 24, 16, [0, 0, 0, 0]);
  p.fillRect(20, 32, 2, 4, navy);
  p.fillRect(26, 32, 2, 4, navy);

  // Arms (Khaki sleeves + skin)
  p.noiseRect(40, 16, 16, 6, khaki, 6);
  p.noiseRect(40, 22, 16, 10, skin, 6);
  p.noiseRect(32, 48, 16, 6, khaki, 6);
  p.noiseRect(32, 54, 16, 10, skin, 6);

  // Legs (Khaki trousers + black boots)
  p.noiseRect(0, 16, 16, 12, khaki, 6);
  p.fillRect(0, 28, 16, 4, black);
  p.noiseRect(16, 48, 16, 12, khaki, 6);
  p.fillRect(16, 60, 16, 4, black);

  return p.toPNG();
}

// 4. MUMBAI KAALI-PEELI TAXI DRIVER
function buildMumbaiDriver() {
  const p = new SkinPainter();
  const skin = [180, 130, 90];
  const hair = [35, 30, 25];
  const black = [24, 24, 28];
  const yellow = [245, 185, 30];
  const jeans = [40, 60, 95];
  const shoes = [40, 35, 30];

  // Head
  p.noiseRect(0, 0, 32, 16, skin, 6);
  p.noiseRect(8, 0, 8, 8, hair, 4);
  p.noiseRect(0, 8, 32, 3, hair, 4);
  p.fillRect(10, 10, 1, 1, [40, 30, 25]);
  p.fillRect(9, 10, 1, 1, [255, 255, 255]);
  p.fillRect(13, 10, 1, 1, [40, 30, 25]);
  p.fillRect(14, 10, 1, 1, [255, 255, 255]);
  p.fillRect(10, 12, 4, 1, [30, 25, 20]); // Mustache

  // Torso: Kaali-Peeli Black Jacket with Yellow Racing Stripe
  p.noiseRect(16, 16, 24, 16, black, 6);
  p.fillRect(20, 20, 8, 3, yellow); // Yellow horizontal chest stripe
  p.fillRect(20, 23, 8, 1, [255, 255, 255]); // White border
  p.fillRect(22, 20, 4, 2, skin); // Neck

  // Arms: Black jacket with yellow forearm band
  p.noiseRect(40, 16, 16, 12, black, 6);
  p.fillRect(40, 24, 16, 2, yellow);
  p.noiseRect(40, 28, 16, 4, skin, 6);

  p.noiseRect(32, 48, 16, 12, black, 6);
  p.fillRect(32, 56, 16, 2, yellow);
  p.noiseRect(32, 60, 16, 4, skin, 6);

  // Legs: Classic Denim Jeans + Kolhapuri/Sneakers
  p.noiseRect(0, 16, 16, 12, jeans, 8);
  p.fillRect(0, 28, 16, 4, shoes);
  p.noiseRect(16, 48, 16, 12, jeans, 8);
  p.fillRect(16, 60, 16, 4, shoes);

  return p.toPNG();
}

// 5. CYBERPUNK NEON RUNNER
function buildCyberpunk() {
  const p = new SkinPainter();
  const skin = [210, 180, 160];
  const darkSuit = [18, 22, 32];
  const cyan = [0, 240, 255];
  const magenta = [255, 0, 128];
  const white = [255, 255, 255];

  // Head with cybernetic implants
  p.noiseRect(0, 0, 32, 16, skin, 6);
  p.noiseRect(8, 0, 8, 8, [30, 30, 40], 4);
  p.fillRect(9, 9, 3, 2, cyan); // Cyber eye left
  p.fillRect(13, 9, 3, 2, magenta); // Cyber eye right

  // Cyber Visor on Layer 2
  p.fillRect(32, 0, 32, 16, [0, 0, 0, 0]);
  p.fillRect(40, 9, 8, 2, [0, 240, 255, 200]); // Glowing Visor

  // Torso: Carbon Suit with Neon Circuits
  p.noiseRect(16, 16, 24, 16, darkSuit, 4);
  p.fillRect(23, 20, 2, 8, cyan); // Center spine LED
  p.fillRect(20, 24, 8, 1, magenta); // Chest line
  p.fillRect(16, 30, 24, 2, cyan); // Belt neon

  // Arms: Glowing forearm strips
  p.noiseRect(40, 16, 16, 16, darkSuit, 4);
  p.fillRect(44, 22, 2, 8, cyan);
  p.noiseRect(32, 48, 16, 16, darkSuit, 4);
  p.fillRect(36, 54, 2, 8, magenta);

  // Legs: Exo-legs with neon joints
  p.noiseRect(0, 16, 16, 16, darkSuit, 4);
  p.fillRect(4, 24, 4, 2, cyan); // Knee power pack
  p.noiseRect(16, 48, 16, 16, darkSuit, 4);
  p.fillRect(20, 56, 4, 2, magenta);

  return p.toPNG();
}

// 6. URBAN STREETWEAR HOODIE
function buildHoodie() {
  const p = new SkinPainter();
  const skin = [200, 150, 110];
  const hair = [40, 35, 30];
  const hoodie = [235, 60, 50]; // Bright red hoodie
  const black = [25, 25, 30];
  const white = [250, 250, 250];

  // Head
  p.noiseRect(0, 0, 32, 16, skin, 6);
  p.noiseRect(8, 0, 8, 8, hair, 6);
  p.fillRect(10, 10, 1, 1, [30, 30, 30]);
  p.fillRect(9, 10, 1, 1, white);
  p.fillRect(13, 10, 1, 1, [30, 30, 30]);
  p.fillRect(14, 10, 1, 1, white);

  // Hoodie Hat on Layer 2
  p.fillRect(32, 0, 32, 16, [0, 0, 0, 0]);
  p.noiseRect(40, 0, 8, 8, hoodie, 6); // Top
  p.noiseRect(32, 8, 8, 8, hoodie, 6); // Right
  p.noiseRect(48, 8, 8, 8, hoodie, 6); // Left
  p.noiseRect(56, 8, 8, 8, hoodie, 6); // Back

  // Torso: Red Hoodie with Drawstrings & Kangaroo Pocket
  p.noiseRect(16, 16, 24, 16, hoodie, 6);
  p.fillRect(22, 20, 1, 5, white); // Left drawstring
  p.fillRect(25, 20, 1, 5, white); // Right drawstring
  p.fillRect(21, 26, 6, 4, [190, 40, 35]); // Kangaroo pocket

  // Arms: Red sleeves + White sneakers cuffs
  p.noiseRect(40, 16, 16, 12, hoodie, 6);
  p.noiseRect(40, 28, 16, 4, skin, 6);
  p.noiseRect(32, 48, 16, 12, hoodie, 6);
  p.noiseRect(32, 60, 16, 4, skin, 6);

  // Legs: Black Cargo Joggers + White Kicks
  p.noiseRect(0, 16, 16, 12, black, 6);
  p.fillRect(0, 28, 16, 4, white); // White kicks
  p.noiseRect(16, 48, 16, 12, black, 6);
  p.fillRect(16, 60, 16, 4, white);

  return p.toPNG();
}

// 7. GRAND PRIX RACER
function buildRacer() {
  const p = new SkinPainter();
  const skin = [210, 165, 130];
  const suit = [240, 200, 30]; // Racing Yellow
  const dark = [30, 35, 45];
  const red = [225, 40, 40];
  const white = [255, 255, 255];

  // Head
  p.noiseRect(0, 0, 32, 16, skin, 6);
  p.noiseRect(8, 0, 8, 8, [40, 35, 30], 4);
  p.fillRect(10, 10, 1, 1, [40, 35, 30]);
  p.fillRect(9, 10, 1, 1, white);
  p.fillRect(13, 10, 1, 1, [40, 35, 30]);
  p.fillRect(14, 10, 1, 1, white);

  // Helmet on Layer 2
  p.fillRect(32, 0, 32, 16, [0, 0, 0, 0]);
  p.noiseRect(40, 0, 8, 8, suit, 6);
  p.noiseRect(32, 8, 32, 8, suit, 6);
  p.fillRect(40, 9, 8, 3, [20, 25, 35]); // Dark Tint Visor
  p.fillRect(40, 12, 8, 1, red); // Red Racing Stripe

  // Torso: Racing Jumpsuit with Sponsor Chevrons
  p.noiseRect(16, 16, 24, 16, suit, 6);
  p.fillRect(20, 20, 8, 2, red);
  p.fillRect(22, 23, 4, 3, dark); // Number patch
  p.fillRect(23, 24, 2, 2, white);
  p.fillRect(16, 29, 24, 3, dark);

  // Arms & Legs
  p.noiseRect(40, 16, 16, 16, suit, 6);
  p.fillRect(40, 28, 16, 4, dark); // Gloves
  p.noiseRect(32, 48, 16, 16, suit, 6);
  p.fillRect(32, 60, 16, 4, dark); // Gloves

  p.noiseRect(0, 16, 16, 12, suit, 6);
  p.fillRect(0, 28, 16, 4, red); // Boots
  p.noiseRect(16, 48, 16, 12, suit, 6);
  p.fillRect(16, 60, 16, 4, red);

  return p.toPNG();
}

// 8. HACKER / SECRET AGENT
function buildHacker() {
  const p = new SkinPainter();
  const skin = [210, 175, 145];
  const suit = [15, 20, 25];
  const neon = [0, 255, 128];
  const white = [255, 255, 255];

  // Head with dark shades
  p.noiseRect(0, 0, 32, 16, skin, 6);
  p.noiseRect(8, 0, 8, 8, [20, 20, 20], 4);
  p.fillRect(8, 9, 10, 3, [10, 10, 15]); // Black Sunglasses
  p.fillRect(10, 10, 1, 1, neon); // HUD data reflection

  // Torso: Sleek Trenchcoat & Tie
  p.noiseRect(16, 16, 24, 16, suit, 4);
  p.fillRect(23, 20, 2, 3, white); // Shirt collar
  p.fillRect(23, 23, 2, 6, neon); // Neon Matrix Tie
  p.fillRect(16, 29, 24, 3, [10, 12, 18]); // Belt

  // Arms
  p.noiseRect(40, 16, 16, 16, suit, 4);
  p.fillRect(40, 28, 16, 4, [10, 10, 15]);
  p.noiseRect(32, 48, 16, 16, suit, 4);
  p.fillRect(32, 60, 16, 4, [10, 10, 15]);

  // Legs
  p.noiseRect(0, 16, 16, 12, suit, 4);
  p.fillRect(0, 28, 16, 4, [10, 10, 15]);
  p.noiseRect(16, 48, 16, 12, suit, 4);
  p.fillRect(16, 60, 16, 4, [10, 10, 15]);

  return p.toPNG();
}

const skins = {
  'steve.png': buildSteve(),
  'alex.png': buildAlex(),
  'police.png': buildPolice(),
  'mumbai_driver.png': buildMumbaiDriver(),
  'cyberpunk.png': buildCyberpunk(),
  'hoodie.png': buildHoodie(),
  'racer.png': buildRacer(),
  'hacker.png': buildHacker()
};

const skinsDir = path.join(__dirname, 'skins');
if (!fs.existsSync(skinsDir)) fs.mkdirSync(skinsDir, { recursive: true });

for (const [filename, pngData] of Object.entries(skins)) {
  const filePath = path.join(skinsDir, filename);
  fs.writeFileSync(filePath, pngData);
  console.log(`Generated default skin: ${filePath} (${pngData.length} bytes)`);
}

console.log('All 8 default Minecraft skins generated successfully in skins/ folder.');
