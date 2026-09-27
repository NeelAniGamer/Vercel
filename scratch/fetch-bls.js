// Scratch: try several ways to pull the BLS OOH A-Z index for data work.
const TARGET = 'https://www.bls.gov/ooh/a-z-index.htm';

const strategies = [
  {
    name: 'browser-headers',
    run: () => fetch(TARGET, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.bls.gov/ooh/'
      }
    })
  },
  {
    name: 'allorigins',
    run: () => fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(TARGET))
  },
  {
    name: 'corsproxy',
    run: () => fetch('https://corsproxy.io/?url=' + encodeURIComponent(TARGET))
  },
  {
    name: 'codetabs',
    run: () => fetch('https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(TARGET))
  }
];

(async () => {
  for (const s of strategies) {
    try {
      const r = await s.run();
      const t = await r.text();
      console.log(s.name, r.status, t.length, t.includes('Accountants and auditors') ? 'HAS-DATA' : 'no-data');
      if (r.status === 200 && t.length > 50000 && t.includes('Accountants and auditors')) {
        require('fs').writeFileSync(__dirname + '/bls-az-raw.html', t);
        console.log('saved raw html');
        break;
      }
    } catch (e) {
      console.log(s.name, 'ERR', e.message);
    }
  }
})();
