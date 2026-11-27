/**
 * PrecompiledMapLoader — Hydrates pre-placed 3D map blueprints from
 * `Traffic/maps/level_<id>.json` (offline-first codebase manifest) with optional
 * Supabase `world_maps` lookup for custom/cloud-published maps.
 */
(function (root) {
  'use strict';

  const cache = new Map();

  async function loadMapBlueprint(levelId) {
    const key = String(levelId);
    if (cache.has(key)) {
      return cache.get(key);
    }

    const safeId = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    try {
      const res = await fetch(`maps/level_${safeId}.json`, { cache: 'force-cache' });
      if (res.ok) {
        const bp = await res.json();
        cache.set(key, bp);
        root.PRECOMPILED_MAPS = root.PRECOMPILED_MAPS || {};
        root.PRECOMPILED_MAPS[key] = bp;
        return bp;
      }
    } catch (e) {
      // Offline / missing local file falls through to optional Supabase check
    }

    try {
      const sb = root.supabaseClient || root.supabase;
      if (sb && typeof sb.from === 'function') {
        const { data } = await sb
          .from('world_maps')
          .select('blueprint')
          .eq('level_key', key)
          .eq('is_published', true)
          .maybeSingle();
        if (data && data.blueprint) {
          cache.set(key, data.blueprint);
          root.PRECOMPILED_MAPS = root.PRECOMPILED_MAPS || {};
          root.PRECOMPILED_MAPS[key] = data.blueprint;
          return data.blueprint;
        }
      }
    } catch (e) {}

    return null;
  }

  function getCachedBlueprint(levelId) {
    return cache.get(String(levelId)) || (root.PRECOMPILED_MAPS && root.PRECOMPILED_MAPS[String(levelId)]) || null;
  }

  root.PrecompiledMapLoader = {
    loadMapBlueprint,
    getCachedBlueprint
  };
})(typeof window !== 'undefined' ? window : globalThis);
