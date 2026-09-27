// Probe one BLS OOH page to find the exact markup for summary, pay, and outlook.
const H = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

(async () => {
  const url = process.argv[2] || 'https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm';
  const html = await (await fetch(url, { headers: H })).text();

  const show = (label, re, len = 700) => {
    const m = html.match(re);
    console.log('\n=== ' + label + ' ===');
    console.log(m ? m[0].slice(0, len) : 'NOT FOUND');
  };

  show('meta description', /<meta name="description" content="[^"]+"/);
  show('what-they-do block', /<h2[^>]*>What [\s\S]{0,60}?Do<\/h2>[\s\S]{0,900}/);
  show('duties marker', /<h2[^>]*>Duties<\/h2>/);
  show('median wage', /The median annual wage for[\s\S]{0,220}/);
  show('outlook', /Employment of [\s\S]{0,300}?20\d\d\./);
  show('number of jobs', /Number of Jobs, 20\d\d<\/[\s\S]{0,200}/);
  show('quick facts', /Quick Facts[\s\S]{0,1500}/, 1500);
})();
