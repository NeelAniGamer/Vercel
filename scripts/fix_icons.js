const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'careers-data.js');
let raw = fs.readFileSync(dataFilePath, 'utf8');

const FLAGSHIP_ICONS = {
  'ai-ml': '🤖',
  'cybersecurity': '🛡️',
  'fullstack-systems': '💻',
  'cloud-devops': '☁️',
  'data-science': '📊',
  'game-dev-xr': '🎮',
  'blockchain-web3': '⛓️',
  'medicine-surgery': '🩺',
  'biotech-genetics': '🧬',
  'biomedical-robotics': '🦾',
  'robotics-mechatronics': '🤖',
  'aerospace-space': '🚀',
  'semiconductor-vlsi': '🔬',
  'renewable-cleantech': '☀️',
  'quantum-computing': '⚛️',
  'astrophysics-space': '🔭',
  'quant-finance': '📈',
  'corporate-law': '⚖️',
  'product-management': '🎯',
  'ui-ux-design': '🎨',
  'architecture-spatial': '🏛️',
  'investment-banking': '💼',
  'civil-services-diplomacy': '🏛️',
  'nursing-critical-care': '💉',
  'pharmacy-drug-discovery': '💊',
  'physiotherapy-sports-rehab': '🏃',
  'public-health-epidemiology': '🌐',
  'mechanical-automotive-ev': '🚗',
  'civil-structural-smartcity': '🏗️',
  'chemical-materials-nanotech': '🧪',
  'merchant-navy-marine': '⚓',
  'nuclear-fusion-energy': '⚛️',
  'chartered-accountancy-audit': '📑',
  'management-consulting-strategy': '♟️',
  'supply-chain-logistics': '📦',
  'marketing-growth-digital': '🚀',
  'actuarial-risk-science': '📉',
  'pure-mathematics-cryptography': '🔢',
  'marine-biology-oceanography': '🌊',
  'climate-meteorology-earth': '🌦️',
  'criminal-litigation-judiciary': '⚖️',
  'international-diplomacy-un': '🕊️',
  'public-policy-thinktank': '📜',
  'filmmaking-cinematography': '🎬',
  'animation-vfx-cgi': '✨',
  'modern-agritech-hydroponics': '🌱',
  'academic-professorship-research': '🎓',
  'master-electrician-automation': '⚡',
  'tech-startup-entrepreneur': '💡',
  'clinical-perfusion-cardio': '🫀',
  'space-traffic-orbital': '🛰️',
  'flavor-chemist-sensory': '🧪',
  'acoustical-architecture-physics': '🔊',
  'carbon-sequestration-geology': '🌍',
  'maritime-admiralty-law': '⚓',
  'art-conservation-forensics': '🖼️',
  'forensic-odontology-pathology': '🔍'
};

const DOMAIN_FALLBACKS = {
  tech: '💻', health: '🩺', eng: '⚙️', space: '🚀', biz: '📈',
  law: '⚖️', creative: '🎨', eco: '🌱', trades: '🔧', edu: '🎓',
  service: '🤝', safety: '🛡️', marine: '⚓', agri: '🌾', hosp: '🍽️'
};

const vm = require('vm');
const sandbox = { window: {}, global: {} };
sandbox.global = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(raw, sandbox);
const careers = sandbox.window.CAREERS_ALL;

let updatedCount = 0;
careers.forEach(c => {
  if (!c.icon) {
    c.icon = FLAGSHIP_ICONS[c.id] || DOMAIN_FALLBACKS[c.cat] || '💼';
    updatedCount++;
  }
});

console.log(`Updated icons for ${updatedCount} careers.`);

const newContent = `if (typeof window === 'undefined') { var window = global; }
window.CAREERS_ALL = ` + JSON.stringify(careers, null, 2) + `;
if (typeof module !== 'undefined' && module.exports) { module.exports = { CAREERS_ALL: window.CAREERS_ALL }; }
`;

fs.writeFileSync(dataFilePath, newContent, 'utf8');
console.log('Successfully saved careers-data.js with universal module support and complete icons.');
