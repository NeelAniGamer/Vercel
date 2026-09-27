// Bulk pull of BLS OOH occupation pages (public domain), extracting only what
// we need: summary line, overview paragraph, first duties, median pay, growth,
// jobs, education. Saves incrementally so an interrupted run can resume.
const fs = require('fs');
const OUT = __dirname + '/bls-pages.json';

const H = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

global.window = {};
require('../careers-data.js');
const all = global.window.CAREERS_ALL.filter(c => c.id.startsWith('ooh-'));

const done = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const sleep = ms => new Promise(r => setTimeout(r, ms));

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '--')
    .replace(/&#8217;|&lsquo;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extract(html) {
  const out = {};

  const meta = html.match(/<meta name="description" content="([^"]+)"/);
  out.summary = meta ? stripTags(meta[1]) : null;

  // Overview: first real paragraph between the "What X Do" heading and the
  // Duties heading. Skip the "typically do the following" lead-in line.
  const wd = html.indexOf('id="what-they-do"');
  if (wd > -1) {
    const dutiesAt = html.indexOf('<h3', wd);
    const region = html.slice(wd, dutiesAt > wd ? dutiesAt : wd + 6000);
    const pRe = /<p(?:\s[^>]*)?>([\s\S]{0,3000}?)<\/p>/g;
    let m;
    while ((m = pRe.exec(region))) {
      const text = stripTags(m[1]);
      if (!text || /typically do the following/i.test(text)) continue;
      if (text.length < 60) continue;
      out.overview = text;
      break;
    }
  }

  // First few duty bullets, used as card copy when the overview is one line.
  const dutiesLead = html.search(/typically do the following/i);
  if (dutiesLead > -1) {
    const ul = html.indexOf('<ul', dutiesLead);
    const ulEnd = html.indexOf('</ul>', ul);
    if (ul > -1 && ulEnd > ul) {
      const items = [...html.slice(ul, ulEnd).matchAll(/<li[^>]*>([\s\S]{0,600}?)<\/li>/g)]
        .map(x => stripTags(x[1]))
        .filter(Boolean)
        .slice(0, 3);
      if (items.length) out.duties = items;
    }
  }

  const pay = html.match(/\$[\d,]+\s*per year/);
  if (pay) out.medianUsd = parseInt(pay[0].replace(/[$,\s]|per year/g, ''), 10);

  const outlook = html.match(/is projected to (grow|decline)\s*(\d+) percent from (\d{4}) to (\d{4}),?\s*([^.]*)./);
  if (outlook) {
    out.growthPct = parseInt(outlook[2], 10);
    out.growthDir = outlook[1];
    out.growthPhrase = stripTags(outlook[5] || '');
    out.growthYears = outlook[3] + '\u2013' + outlook[4];
  } else if (/little or no change/.test(html)) {
    out.growthPct = 0;
    out.growthDir = 'flat';
    const m2 = html.match(/little or no change[^.]{0,160}/);
    out.growthPhrase = m2 ? stripTags(m2[0]) : '';
  }

  const jobs = html.match(/Number of Jobs,[^<]*<\/a><\/th>[\s\S]{0,200}?<td>\s*([\d,]+)\s*<\/td>/);
  if (jobs) out.jobs = jobs[1].trim();

  const edu = html.match(/Typical Entry-Level Education[\s\S]{0,400}?<td>\s*([^<]+?)\s*<\/td>/);
  if (edu) out.entryEducation = stripTags(edu[1]);

  return out;
}

async function grab(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: H });
      if (r.status === 200) return await r.text();
      if (r.status === 404) return null;
      await sleep(3000 * (attempt + 1));
    } catch (e) {
      await sleep(3000 * (attempt + 1));
    }
  }
  throw new Error('failed ' + url);
}

(async () => {
  const todo = all.filter(c => !done[c.id] || !done[c.id].duties);
  console.log('pages to fetch:', todo.length, '/', all.length);
  let n = 0;
  const CONCURRENCY = 2;
  let idx = 0;
  async function worker() {
    while (idx < todo.length) {
      const c = todo[idx++];
      n++;
      try {
        const html = await grab(c.url);
        done[c.id] = html ? extract(html) : { error: '404' };
      } catch (e) {
        done[c.id] = { error: e.message };
      }
      if (n % 25 === 0 || n >= todo.length) {
        fs.writeFileSync(OUT, JSON.stringify(done));
        console.log(n + '/' + todo.length, 'saved');
      }
      await sleep(450);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  fs.writeFileSync(OUT, JSON.stringify(done));
  const vals = Object.values(done);
  console.log('DONE. errors:', vals.filter(v => v.error).length,
    'no overview:', vals.filter(v => !v.overview).length,
    'with duties:', vals.filter(v => v.duties).length);
})();
