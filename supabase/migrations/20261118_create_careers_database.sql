-- Create a dedicated, indexed, read-only public catalog table and paginated RPCs
-- for all FutureScape careers (441 pathways).

create table if not exists public.careers (
  id text primary key,
  sort_order integer not null default 0,
  cat text not null,
  cat_name text not null,
  icon text not null default '',
  title text not null,
  tagline text not null default '',
  description text not null default '',
  stream text not null default '',
  salary text not null default '',
  salary_min_k integer not null default 0,
  salary_max_k integer not null default 0,
  growth text not null default '',
  growth_pct integer not null default 0,
  demand text not null default '',
  ai_impact text not null default '',
  ai_tag text not null default '',
  edu text not null default '',
  is_flagship boolean not null default false,
  compact boolean not null default false,
  degrees text[] not null default '{}',
  interests text[] not null default '{}',
  aka text[] not null default '{}',
  overview text not null default '',
  education jsonb not null default '{}'::jsonb,
  roadmap jsonb not null default '{}'::jsonb,
  skills jsonb not null default '{}'::jsonb,
  roles jsonb not null default '[]'::jsonb,
  decision_fit jsonb not null default '{}'::jsonb,
  reflection_questions jsonb not null default '[]'::jsonb,
  resources jsonb not null default '[]'::jsonb,
  bls jsonb,
  bls_url text,
  growth_years text,
  openings text,
  median_pay integer,
  extras jsonb not null default '{}'::jsonb,
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_careers_sort_order on public.careers (sort_order);
create index if not exists idx_careers_cat on public.careers (cat);
create index if not exists idx_careers_edu on public.careers (edu);
create index if not exists idx_careers_ai_tag on public.careers (ai_tag);
create index if not exists idx_careers_is_flagship on public.careers (is_flagship);
create index if not exists idx_careers_growth_pct on public.careers (growth_pct desc);
create index if not exists idx_careers_salary_min_k on public.careers (salary_min_k desc);
create index if not exists idx_careers_salary_max_k on public.careers (salary_max_k desc);
create index if not exists idx_careers_title_lower on public.careers (lower(title));
create index if not exists idx_careers_degrees_gin on public.careers using gin (degrees);
create index if not exists idx_careers_interests_gin on public.careers using gin (interests);
create index if not exists idx_careers_aka_gin on public.careers using gin (aka);

alter table public.careers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'careers' and policyname = 'Public read careers'
  ) then
    create policy "Public read careers"
      on public.careers
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

grant select on table public.careers to anon, authenticated;

-- Reconstruct a full career JSON object matching the frontend dossier schema.
create or replace function public.career_row_to_full_json(c public.careers)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select
    jsonb_strip_nulls(
      jsonb_build_object(
        'id', c.id,
        'cat', c.cat,
        'catName', c.cat_name,
        'icon', c.icon,
        'title', c.title,
        'tagline', c.tagline,
        'desc', c.description,
        'stream', c.stream,
        'salary', c.salary,
        'growth', c.growth,
        'demand', c.demand,
        'aiImpact', c.ai_impact,
        'aiTag', c.ai_tag,
        'edu', c.edu,
        'compact', case when c.compact then true else null end,
        'degrees', to_jsonb(c.degrees),
        'interests', to_jsonb(c.interests),
        'aka', to_jsonb(c.aka),
        'overview', c.overview,
        'education', c.education,
        'roadmap', c.roadmap,
        'skills', c.skills,
        'roles', c.roles,
        'decisionFit', c.decision_fit,
        'reflectionQuestions', c.reflection_questions,
        'resources', c.resources,
        'bls', c.bls,
        'url', c.bls_url,
        'growthYears', c.growth_years,
        'openings', c.openings,
        'medianPay', c.median_pay
      )
    ) || coalesce(c.extras, '{}'::jsonb);
$$;

-- Facet counts for quick-view mode tabs and filter dropdowns.
create or replace function public.get_career_facets()
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with totals as (
    select
      count(*)::int as total,
      count(*) filter (where is_flagship)::int as flagship,
      count(*) filter (where growth_pct >= 10)::int as growth,
      count(*) filter (where ai_tag in ('protected', 'people'))::int as ai,
      count(*) filter (where salary_max_k >= 150)::int as high_earning
    from public.careers
  ),
  doms as (
    select coalesce(jsonb_object_agg(cat, cnt), '{}'::jsonb) as data
    from (select cat, count(*)::int as cnt from public.careers group by cat) d
  ),
  degs as (
    select coalesce(jsonb_object_agg(deg, cnt), '{}'::jsonb) as data
    from (select unnest(degrees) as deg, count(*)::int as cnt from public.careers group by 1) g
  ),
  ints as (
    select coalesce(jsonb_object_agg(intr, cnt), '{}'::jsonb) as data
    from (select unnest(interests) as intr, count(*)::int as cnt from public.careers group by 1) i
  )
  select jsonb_build_object(
    'total', totals.total,
    'modes', jsonb_build_object(
      'all', totals.total,
      'flagship', totals.flagship,
      'growth', totals.growth,
      'ai', totals.ai,
      'high_earning', totals.high_earning
    ),
    'domains', doms.data,
    'degrees', degs.data,
    'interests', ints.data
  )
  from totals, doms, degs, ints;
$$;

-- Server-side filtered, searched, sorted, and numbered-paginated query.
create or replace function public.query_careers(
  p_mode text default 'all',
  p_cat text default 'all',
  p_stream text default 'all',
  p_edu text default 'all',
  p_degree text default 'all',
  p_interest text default 'all',
  p_search text default '',
  p_sort text default 'match',
  p_ids text[] default null,
  p_page integer default 1,
  p_page_size integer default 24
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_page_size int := least(greatest(coalesce(p_page_size, 24), 1), 100);
  v_q text := lower(btrim(coalesce(p_search, '')));
  v_q_like text;
  v_total int;
  v_total_pages int;
  v_page int;
  v_offset int;
  v_items jsonb;
begin
  if v_q <> '' then
    v_q_like := '%' || replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  else
    v_q_like := null;
  end if;

  select count(*)::int into v_total
  from public.careers c
  where
    (p_mode = 'all'
      or (p_mode = 'flagship' and c.is_flagship)
      or (p_mode = 'growth' and c.growth_pct >= 10)
      or (p_mode = 'ai' and c.ai_tag in ('protected', 'people'))
      or (p_mode = 'high_earning' and c.salary_max_k >= 150)
      or (p_mode = 'shortlist' and c.id = any(coalesce(p_ids, '{}'::text[]))))
    and (p_cat = 'all' or c.cat = p_cat)
    and (p_stream = 'all'
      or (p_stream = 'pcm' and (lower(c.stream) like '%pcm%' or lower(c.stream) like '%math%'))
      or (p_stream = 'pcb' and (lower(c.stream) like '%pcb%' or lower(c.stream) like '%bio%'))
      or (p_stream = 'commerce' and (lower(c.stream) like '%commerce%' or lower(c.stream) like '%math%' or lower(c.stream) like '%any%'))
      or (p_stream = 'arts' and (lower(c.stream) like '%arts%' or lower(c.stream) like '%humanities%' or lower(c.stream) like '%any%'))
      or (p_stream = 'any' and lower(c.stream) like '%any%'))
    and (p_edu = 'all' or c.edu = p_edu)
    and (p_degree = 'all' or p_degree = any(c.degrees))
    and (p_interest = 'all' or p_interest = any(c.interests))
    and (v_q_like is null or c.search_text like v_q_like escape '\');

  v_total_pages := greatest(1, ceil(v_total::numeric / v_page_size)::int);
  v_page := least(greatest(coalesce(p_page, 1), 1), v_total_pages);
  v_offset := (v_page - 1) * v_page_size;

  select coalesce(jsonb_agg(row_json), '[]'::jsonb) into v_items
  from (
    select jsonb_build_object(
      'id', c.id,
      'cat', c.cat,
      'catName', c.cat_name,
      'icon', c.icon,
      'title', c.title,
      'tagline', c.tagline,
      'stream', c.stream,
      'salary', c.salary,
      'growth', c.growth,
      'demand', c.demand,
      'aiTag', c.ai_tag,
      'edu', c.edu,
      'compact', c.compact,
      'matchedAlias', case
        when v_q_like is not null
          and not (
            lower(c.title) like v_q_like escape '\'
            or lower(c.description) like v_q_like escape '\'
            or lower(c.overview) like v_q_like escape '\'
            or lower(coalesce(c.education->>'entranceExams', '')) like v_q_like escape '\'
            or exists (
              select 1 from jsonb_array_elements_text(coalesce(c.skills->'hardSkills', '[]'::jsonb)) hs
              where lower(hs) like v_q_like escape '\'
            )
          )
        then (
          select a from unnest(c.aka) a
          where lower(a) like v_q_like escape '\'
          limit 1
        )
        else null
      end
    ) as row_json
    from public.careers c
    where
      (p_mode = 'all'
        or (p_mode = 'flagship' and c.is_flagship)
        or (p_mode = 'growth' and c.growth_pct >= 10)
        or (p_mode = 'ai' and c.ai_tag in ('protected', 'people'))
        or (p_mode = 'high_earning' and c.salary_max_k >= 150)
        or (p_mode = 'shortlist' and c.id = any(coalesce(p_ids, '{}'::text[]))))
      and (p_cat = 'all' or c.cat = p_cat)
      and (p_stream = 'all'
        or (p_stream = 'pcm' and (lower(c.stream) like '%pcm%' or lower(c.stream) like '%math%'))
        or (p_stream = 'pcb' and (lower(c.stream) like '%pcb%' or lower(c.stream) like '%bio%'))
        or (p_stream = 'commerce' and (lower(c.stream) like '%commerce%' or lower(c.stream) like '%math%' or lower(c.stream) like '%any%'))
        or (p_stream = 'arts' and (lower(c.stream) like '%arts%' or lower(c.stream) like '%humanities%' or lower(c.stream) like '%any%'))
        or (p_stream = 'any' and lower(c.stream) like '%any%'))
      and (p_edu = 'all' or c.edu = p_edu)
      and (p_degree = 'all' or p_degree = any(c.degrees))
      and (p_interest = 'all' or p_interest = any(c.interests))
      and (v_q_like is null or c.search_text like v_q_like escape '\')
    order by
      case when p_sort = 'alpha' then lower(c.title) end asc nulls last,
      case when p_sort = 'salary' then c.salary_min_k end desc nulls last,
      case when p_sort = 'growth' then c.growth_pct end desc nulls last,
      c.sort_order asc
    offset v_offset
    limit v_page_size
  ) sub;

  return jsonb_build_object(
    'total', v_total,
    'page', v_page,
    'page_size', v_page_size,
    'total_pages', v_total_pages,
    'items', v_items
  );
end;
$$;

-- Fetch one complete career dossier by id.
create or replace function public.get_career_detail(p_id text)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select public.career_row_to_full_json(c)
  from public.careers c
  where c.id = p_id
  limit 1;
$$;

-- Fetch multiple complete career dossiers (used for Compare modal & drawer).
create or replace function public.get_careers_by_ids(p_ids text[])
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(public.career_row_to_full_json(c) order by array_position(p_ids, c.id)), '[]'::jsonb)
  from public.careers c
  where c.id = any(coalesce(p_ids, '{}'::text[]));
$$;

-- Lightweight catalog projection for the Career Compass quiz scorer.
create or replace function public.get_careers_compass_index()
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'cat', c.cat,
      'catName', c.cat_name,
      'icon', c.icon,
      'title', c.title,
      'tagline', c.tagline,
      'stream', c.stream,
      'salary', c.salary,
      'growth', c.growth,
      'demand', c.demand,
      'aiTag', c.ai_tag,
      'edu', c.edu,
      'compact', c.compact,
      'degrees', to_jsonb(c.degrees),
      'interests', to_jsonb(c.interests),
      'aka', to_jsonb(c.aka)
    ) order by c.sort_order asc
  ), '[]'::jsonb)
  from public.careers c;
$$;

grant execute on function public.career_row_to_full_json(public.careers) to anon, authenticated;
grant execute on function public.get_career_facets() to anon, authenticated;
grant execute on function public.query_careers(text, text, text, text, text, text, text, text, text[], integer, integer) to anon, authenticated;
grant execute on function public.get_career_detail(text) to anon, authenticated;
grant execute on function public.get_careers_by_ids(text[]) to anon, authenticated;
grant execute on function public.get_careers_compass_index() to anon, authenticated;
