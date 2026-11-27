-- Pre-placed 3D Map Blueprints & Seeded Run Profiles for Traffic Simulator
-- Hybrid storage: core levels ship statically in Traffic/maps/*.json;
-- custom, community, and live-updated maps can be published here.

CREATE TABLE IF NOT EXISTS public.world_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  theme_type TEXT DEFAULT 'mumbai_city',
  seed INT DEFAULT 42,
  version INT DEFAULT 1,
  blueprint JSONB NOT NULL,
  checksum TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_world_maps_level_key ON public.world_maps(level_key);
CREATE INDEX IF NOT EXISTS idx_world_maps_published ON public.world_maps(is_published) WHERE is_published = true;

ALTER TABLE public.world_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "world_maps_public_read" ON public.world_maps;
CREATE POLICY "world_maps_public_read"
  ON public.world_maps FOR SELECT
  USING (is_published = true OR auth.uid() = created_by);

DROP POLICY IF EXISTS "world_maps_owner_write" ON public.world_maps;
CREATE POLICY "world_maps_owner_write"
  ON public.world_maps FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
