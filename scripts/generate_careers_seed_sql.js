// scripts/generate_careers_seed_sql.js
// Generates batched PostgreSQL UPSERT statements to seed public.careers in Supabase
// from careers-data.js. Outputs chunk files into a target directory (default: stdout summary).

const fs = require('fs');
const path = require('path');

const DEGREE_LABELS = {
  engineering: 'Engineering (B.Tech / B.E.)',
  computing: 'Computing & IT (BCA / CS)',
  health: 'Medicine & Health (MBBS / BDS / Nursing)',
  science: 'Science (B.Sc / B.Stat)',
  commerce: 'Commerce & Finance (B.Com / BBA)',
  arts: 'Arts & Humanities (B.A.)',
  law: 'Law (LL.B.)',
  education: 'Education (B.Ed.)',
  design: 'Design & Architecture (B.Des / B.Arch)',
  management: 'Management (MBA)',
  vocational: 'Diploma / ITI / Vocational',
  any: 'Any degree works'
};

const INTEREST_LABELS = {
  tech: 'Computers & Technology',
  health: 'Medicine & Health',
  numbers: 'Numbers & Finance',
  business: 'Business & Selling',
  machines: 'Machines & Making',
  build: 'Building & Construction',
  outdoors: 'Outdoors & Nature',
  science: 'Science & Research',
  design: 'Art & Design',
  words: 'Writing & Media',
  law: 'Law & Public Service',
  people: 'People & Care',
  teaching: 'Teaching & Training',
  transport: 'Transport & Travel',
  food: 'Food & Hospitality',
  sport: 'Sport, Music & Performance'
};

const EDU_LABELS = {
  nodegree: 'No degree needed',
  diploma: 'Diploma / Associate',
  bachelor: "Bachelor's degree",
  master: "Master's degree",
  doctorate: 'Doctorate / MD / PhD'
};

const EXTRA_KEYS = [
  'dayInLife',
  'workMetrics',
  'whoAvoids',
  'globalPay',
  'topEmployers',
  'tools',
  'portfolioProjects',
  'exitOpportunities'
];

function loadCareers() {
  const file = path.join(__dirname, '..', 'careers-data.js');
  const src = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {}, global: {} };
  const fn = new Function('window', 'global', src + '\n; return window.CAREERS_ALL || global.CAREERS_ALL;');
  return fn(sandbox.window, sandbox.global);
}

function sqlLit(val) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return Number.isFinite(val) ? String(Math.trunc(val)) : '0';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function sqlTextArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "'{}'::text[]";
  return 'ARRAY[' + arr.map(s => sqlLit(String(s))).join(',') + ']::text[]';
}

function sqlJsonb(obj) {
  if (obj === null || obj === undefined) return 'null';
  return sqlLit(JSON.stringify(obj)) + '::jsonb';
}

function buildRow(c, idx) {
  const salary = String(c.salary || '');
  const minM = salary.match(/\$(\d+)/);
  const salaryMinK = minM ? parseInt(minM[1], 10) : 0;
  const maxNums = (salary.match(/\$(\d+)K/g) || []).map(s => parseInt(s.replace(/\D/g, ''), 10));
  const salaryMaxK = maxNums.length ? Math.max(...maxNums) : salaryMinK;

  const growth = String(c.growth || '');
  const gM = growth.match(/(-?\d+)%/);
  const growthPct = gM ? parseInt(gM[1], 10) : 0;

  const isFlagship = !String(c.id || '').startsWith('ooh-') && !c.compact;

  const extras = {};
  for (const k of EXTRA_KEYS) {
    if (c[k] !== undefined) extras[k] = c[k];
  }

  const hardSkills = (c.skills && Array.isArray(c.skills.hardSkills)) ? c.skills.hardSkills : [];
  const entranceExams = (c.education && c.education.entranceExams) ? c.education.entranceExams : '';
  const degrees = Array.isArray(c.degrees) ? c.degrees : [];
  const interests = Array.isArray(c.interests) ? c.interests : [];
  const aka = Array.isArray(c.aka) ? c.aka : [];

  const searchParts = [
    c.title || '',
    c.desc || '',
    c.overview || '',
    hardSkills.join(' '),
    entranceExams,
    aka.join(' '),
    degrees.map(d => DEGREE_LABELS[d] || d).join(' '),
    interests.map(i => INTEREST_LABELS[i] || i).join(' '),
    EDU_LABELS[c.edu] || c.edu || ''
  ];
  const searchText = searchParts.join(' ').toLowerCase();

  return [
    sqlLit(c.id),
    idx,
    sqlLit(c.cat || ''),
    sqlLit(c.catName || ''),
    sqlLit(c.icon || ''),
    sqlLit(c.title || ''),
    sqlLit(c.tagline || ''),
    sqlLit(c.desc || ''),
    sqlLit(c.stream || ''),
    sqlLit(salary),
    salaryMinK,
    salaryMaxK,
    sqlLit(growth),
    growthPct,
    sqlLit(c.demand || ''),
    sqlLit(c.aiImpact || ''),
    sqlLit(c.aiTag || ''),
    sqlLit(c.edu || ''),
    sqlLit(isFlagship),
    sqlLit(Boolean(c.compact)),
    sqlTextArray(degrees),
    sqlTextArray(interests),
    sqlTextArray(aka),
    sqlLit(c.overview || ''),
    sqlJsonb(c.education || {}),
    sqlJsonb(c.roadmap || {}),
    sqlJsonb(c.skills || {}),
    sqlJsonb(c.roles || []),
    sqlJsonb(c.decisionFit || {}),
    sqlJsonb(c.reflectionQuestions || []),
    sqlJsonb(c.resources || []),
    c.bls ? sqlJsonb(c.bls) : 'null',
    c.url ? sqlLit(c.url) : 'null',
    c.growthYears ? sqlLit(c.growthYears) : 'null',
    c.openings ? sqlLit(c.openings) : 'null',
    typeof c.medianPay === 'number' ? Math.trunc(c.medianPay) : 'null',
    sqlJsonb(extras),
    sqlLit(searchText)
  ];
}

const COLS = [
  'id', 'sort_order', 'cat', 'cat_name', 'icon', 'title', 'tagline', 'description',
  'stream', 'salary', 'salary_min_k', 'salary_max_k', 'growth', 'growth_pct', 'demand',
  'ai_impact', 'ai_tag', 'edu', 'is_flagship', 'compact', 'degrees', 'interests', 'aka',
  'overview', 'education', 'roadmap', 'skills', 'roles', 'decision_fit',
  'reflection_questions', 'resources', 'bls', 'bls_url', 'growth_years', 'openings',
  'median_pay', 'extras', 'search_text'
];

const UPDATE_SET = COLS.filter(c => c !== 'id')
  .map(c => `${c} = excluded.${c}`)
  .concat(['updated_at = now()'])
  .join(', ');

function buildBatchSql(slice, startIdx) {
  const values = slice.map((c, i) => '(' + buildRow(c, startIdx + i).join(',') + ')').join(',\n');
  return `insert into public.careers (${COLS.join(', ')}) values\n${values}\non conflict (id) do update set ${UPDATE_SET};`;
}

if (require.main === module) {
  const outDir = process.argv[2];
  const batchSize = parseInt(process.argv[3] || '80', 10);
  const careers = loadCareers();
  const batches = [];
  for (let i = 0; i < careers.length; i += batchSize) {
    batches.push(buildBatchSql(careers.slice(i, i + batchSize), i));
  }
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    batches.forEach((sql, idx) => {
      const p = path.join(outDir, `careers_seed_${idx + 1}.sql`);
      fs.writeFileSync(p, sql, 'utf8');
      console.log(`Wrote ${p} (${sql.length} bytes)`);
    });
  } else {
    console.log(`Prepared ${batches.length} SQL batches for ${careers.length} careers.`);
  }
}

module.exports = { loadCareers, buildBatchSql };
