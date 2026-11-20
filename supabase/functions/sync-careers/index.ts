import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CATALOG_URL = "https://advancedlogiclabs.dpdns.org/careers-data.js";

const DEGREE_LABELS: Record<string, string> = {
  engineering: "Engineering (B.Tech / B.E.)",
  computing: "Computing & IT (BCA / CS)",
  health: "Medicine & Health (MBBS / BDS / Nursing)",
  science: "Science (B.Sc / B.Stat)",
  commerce: "Commerce & Finance (B.Com / BBA)",
  arts: "Arts & Humanities (B.A.)",
  law: "Law (LL.B.)",
  education: "Education (B.Ed.)",
  design: "Design & Architecture (B.Des / B.Arch)",
  management: "Management (MBA)",
  vocational: "Diploma / ITI / Vocational",
  any: "Any degree works",
};

const INTEREST_LABELS: Record<string, string> = {
  tech: "Computers & Technology",
  health: "Medicine & Health",
  numbers: "Numbers & Finance",
  business: "Business & Selling",
  machines: "Machines & Making",
  build: "Building & Construction",
  outdoors: "Outdoors & Nature",
  science: "Science & Research",
  design: "Art & Design",
  words: "Writing & Media",
  law: "Law & Public Service",
  people: "People & Care",
  teaching: "Teaching & Training",
  transport: "Transport & Travel",
  food: "Food & Hospitality",
  sport: "Sport, Music & Performance",
};

const EDU_LABELS: Record<string, string> = {
  nodegree: "No degree needed",
  diploma: "Diploma / Associate",
  bachelor: "Bachelor's degree",
  master: "Master's degree",
  doctorate: "Doctorate / MD / PhD",
};

const EXTRA_KEYS = [
  "dayInLife",
  "workMetrics",
  "whoAvoids",
  "globalPay",
  "topEmployers",
  "tools",
  "portfolioProjects",
  "exitOpportunities",
];

function mapCareerRow(c: Record<string, any>, idx: number) {
  const salary = String(c.salary || "");
  const minM = salary.match(/\$(\d+)/);
  const salaryMinK = minM ? parseInt(minM[1], 10) : 0;
  const maxNums = (salary.match(/\$(\d+)K/g) || []).map((s) =>
    parseInt(s.replace(/\D/g, ""), 10)
  );
  const salaryMaxK = maxNums.length ? Math.max(...maxNums) : salaryMinK;

  const growth = String(c.growth || "");
  const gM = growth.match(/(-?\d+)%/);
  const growthPct = gM ? parseInt(gM[1], 10) : 0;

  const isFlagship = !String(c.id || "").startsWith("ooh-") && !c.compact;

  const extras: Record<string, unknown> = {};
  for (const k of EXTRA_KEYS) {
    if (c[k] !== undefined) extras[k] = c[k];
  }

  const hardSkills: string[] =
    c.skills && Array.isArray(c.skills.hardSkills) ? c.skills.hardSkills : [];
  const entranceExams =
    c.education && c.education.entranceExams ? String(c.education.entranceExams) : "";
  const degrees: string[] = Array.isArray(c.degrees) ? c.degrees.map(String) : [];
  const interests: string[] = Array.isArray(c.interests) ? c.interests.map(String) : [];
  const aka: string[] = Array.isArray(c.aka) ? c.aka.map(String) : [];

  const searchText = [
    c.title || "",
    c.desc || "",
    c.overview || "",
    hardSkills.join(" "),
    entranceExams,
    aka.join(" "),
    degrees.map((d) => DEGREE_LABELS[d] || d).join(" "),
    interests.map((i) => INTEREST_LABELS[i] || i).join(" "),
    EDU_LABELS[String(c.edu || "")] || String(c.edu || ""),
  ]
    .join(" ")
    .toLowerCase();

  return {
    id: String(c.id),
    sort_order: idx,
    cat: String(c.cat || ""),
    cat_name: String(c.catName || ""),
    icon: String(c.icon || ""),
    title: String(c.title || ""),
    tagline: String(c.tagline || ""),
    description: String(c.desc || ""),
    stream: String(c.stream || ""),
    salary,
    salary_min_k: salaryMinK,
    salary_max_k: salaryMaxK,
    growth,
    growth_pct: growthPct,
    demand: String(c.demand || ""),
    ai_impact: String(c.aiImpact || ""),
    ai_tag: String(c.aiTag || ""),
    edu: String(c.edu || ""),
    is_flagship: isFlagship,
    compact: Boolean(c.compact),
    degrees,
    interests,
    aka,
    overview: String(c.overview || ""),
    education: c.education || {},
    roadmap: c.roadmap || {},
    skills: c.skills || {},
    roles: Array.isArray(c.roles) ? c.roles : [],
    decision_fit: c.decisionFit || {},
    reflection_questions: Array.isArray(c.reflectionQuestions)
      ? c.reflectionQuestions
      : [],
    resources: Array.isArray(c.resources) ? c.resources : [],
    bls: c.bls || null,
    bls_url: c.url ? String(c.url) : null,
    growth_years: c.growthYears ? String(c.growthYears) : null,
    openings: c.openings ? String(c.openings) : null,
    median_pay: typeof c.medianPay === "number" ? Math.trunc(c.medianPay) : null,
    extras,
    search_text: searchText,
    updated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;

  // Allow initial bootstrap when table is empty; after seeding, require service_role.
  if (!isServiceRole) {
    const countRes = await fetch(`${supabaseUrl}/rest/v1/careers?select=id`, {
      method: "HEAD",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "count=exact",
      },
    });
    const contentRange = countRes.headers.get("content-range") || "";
    const totalMatch = contentRange.match(/\/(\d+)$/);
    const existingCount = totalMatch ? parseInt(totalMatch[1], 10) : 0;
    if (existingCount > 0) {
      return new Response(
        JSON.stringify({ error: "Catalog already seeded; service_role required to re-sync", count: existingCount }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const res = await fetch(CATALOG_URL);
  if (!res.ok) {
    return new Response(JSON.stringify({ error: `Failed to fetch catalog: ${res.status}` }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const src = await res.text();
  const start = src.indexOf("[");
  const end = src.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    return new Response(JSON.stringify({ error: "Invalid catalog payload" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = JSON.parse(src.slice(start, end + 1));
  if (!Array.isArray(parsed) || parsed.length < 100) {
    return new Response(JSON.stringify({ error: "Unexpected catalog length" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = parsed.map((c, idx) => mapCareerRow(c, idx));
  const batchSize = 50;
  let synced = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const up = await fetch(`${supabaseUrl}/rest/v1/careers?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(batch),
    });
    if (!up.ok) {
      const errText = await up.text();
      return new Response(
        JSON.stringify({ error: `Upsert failed at batch ${i}`, detail: errText }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    synced += batch.length;
  }

  return new Response(JSON.stringify({ ok: true, synced }), {
    headers: { "Content-Type": "application/json" },
  });
});
