/**
 * SceneryKit — Per-theme environment decoration placement
 * Places trees, street lights, parked cars, props along roads
 * Uses InstancedMesh for performance
 */

class SceneryKit {
  constructor(game) {
    this.game = game;
    this.placedObjects = [];
    this.instancedMeshes = [];
  }

  /**
   * Place scenery along all roads in the level
   */
  decorateLevel(cfg) {
    if (!cfg.roads || cfg.roads.length === 0) return;

    const roads = cfg.roads;
    const theme = cfg.themeType || 'urban_grid';

    // Place different scenery types
    this.placeTreesAlongRoads(roads, theme);
    this.placeStreetLightsAlongRoads(roads, theme);
    this.placeParkedCarsAlongRoads(roads, theme);
    this.placeRoadsideProps(roads, theme);
    this.placeBuildingsBehindRoads(roads, theme);
    this.placeThemeSpecific(roads, theme);

    console.log(`[SceneryKit] Placed ${this.placedObjects.length} objects for theme "${theme}"`);
  }

  /**
   * Place trees along road edges
   */
  placeTreesAlongRoads(roads, theme) {
    const treeKeys = ['tree_small', 'tree_large'];
    const density = this._getThemeTreeDensity(theme);
    const spacing = 20; // meters between trees

    const instances = [];

    roads.forEach(road => {
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      const numTrees = Math.floor(len / spacing);

      for (let i = 0; i < numTrees; i++) {
        if (Math.random() > density) continue;

        const t = (i + 0.5) / numTrees;
        let x, z;

        if (isV) {
          x = road.x;
          z = road.z1 + t * (road.z2 - road.z1);
        } else {
          x = road.x1 + t * (road.x2 - road.x1);
          z = road.z;
        }

        // Offset to road edge
        const offset = (road.width || 12) / 2 + 3;
        const side = Math.random() > 0.5 ? 1 : -1;

        instances.push({
          x: isV ? x + offset * side : x,
          z: isV ? z : z + offset * side,
          ry: Math.random() * Math.PI * 2,
          scale: 0.8 + Math.random() * 0.4,
          key: treeKeys[Math.floor(Math.random() * treeKeys.length)]
        });
      }
    });

    this._placeInstances(instances, 'trees');
  }

  /**
   * Place street lights along roads
   */
  placeStreetLightsAlongRoads(roads, theme) {
    if (theme === 'free_roam') return; // Free roam uses low-poly city props
    const lightKeys = ['streetlight_curved', 'streetlight_square'];
    const spacing = 30; // meters between lights

    const instances = [];

    roads.forEach(road => {
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      const numLights = Math.floor(len / spacing);

      for (let i = 0; i < numLights; i++) {
        const t = (i + 0.5) / numLights;
        let x, z;

        if (isV) {
          x = road.x;
          z = road.z1 + t * (road.z2 - road.z1);
        } else {
          x = road.x1 + t * (road.x2 - road.x1);
          z = road.z;
        }

        const offset = (road.width || 12) / 2 + 2;
        const side = i % 2 === 0 ? 1 : -1; // Alternate sides

        instances.push({
          x: isV ? x + offset * side : x,
          z: isV ? z : z + offset * side,
          ry: isV ? (side > 0 ? Math.PI / 2 : -Math.PI / 2) : (side > 0 ? 0 : Math.PI),
          scale: 1.0,
          key: lightKeys[Math.floor(Math.random() * lightKeys.length)]
        });
      }
    });

    this._placeInstances(instances, 'streetLights');
  }

  /**
   * Place parked cars along roads
   */
  placeParkedCarsAlongRoads(roads, theme) {
    const carKeys = ['car', 'taxi', 'car', 'car']; // Mostly sedans
    const spacing = 15; // meters between parked cars
    const density = 0.4; // Not every spot filled

    const instances = [];

    roads.forEach(road => {
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      const numCars = Math.floor(len / spacing);

      for (let i = 0; i < numCars; i++) {
        if (Math.random() > density) continue;

        const t = (i + 0.5) / numCars;
        let x, z;

        if (isV) {
          x = road.x;
          z = road.z1 + t * (road.z2 - road.z1);
        } else {
          x = road.x1 + t * (road.x2 - road.x1);
          z = road.z;
        }

        const offset = (road.width || 12) / 2 + 4;
        const side = Math.random() > 0.5 ? 1 : -1;

        instances.push({
          x: isV ? x + offset * side : x + (Math.random() - 0.5) * 2,
          z: isV ? z + (Math.random() - 0.5) * 2 : z + offset * side,
          ry: isV ? (side > 0 ? 0 : Math.PI) : (side > 0 ? Math.PI / 2 : -Math.PI / 2),
          scale: 1.0,
          key: carKeys[Math.floor(Math.random() * carKeys.length)]
        });
      }
    });

    this._placeInstances(instances, 'parkedCars');
  }

  /**
   * Place roadside props (trash cans, benches, signs)
   */
  placeRoadsideProps(roads, theme) {
    const propKeys = ['lowpoly_trash_can_04', 'lowpoly_trash_can_05', 'lowpoly_signboard_01'];
    const spacing = 50;

    const instances = [];

    roads.forEach(road => {
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      const numProps = Math.floor(len / spacing);

      for (let i = 0; i < numProps; i++) {
        if (Math.random() > 0.5) continue;

        const t = (i + 0.5) / numProps;
        let x, z;

        if (isV) {
          x = road.x;
          z = road.z1 + t * (road.z2 - road.z1);
        } else {
          x = road.x1 + t * (road.x2 - road.x1);
          z = road.z;
        }

        const offset = (road.width || 12) / 2 + 3;
        const side = Math.random() > 0.5 ? 1 : -1;

        instances.push({
          x: isV ? x + offset * side : x,
          z: isV ? z : z + offset * side,
          ry: Math.random() * Math.PI * 2,
          scale: 1.0,
          key: propKeys[Math.floor(Math.random() * propKeys.length)]
        });
      }
    });

    this._placeInstances(instances, 'roadsideProps');
  }

  /**
   * Place buildings behind roads (setback from road edge)
   */
  placeBuildingsBehindRoads(roads, theme) {
    const buildingKeys = this._getThemeBuildings(theme);
    if (buildingKeys.length === 0) return;

    const spacing = 25; // meters between buildings
    const setback = 15; // meters behind road edge

    const instances = [];

    roads.forEach(road => {
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      const numBuildings = Math.floor(len / spacing);

      for (let i = 0; i < numBuildings; i++) {
        if (Math.random() > 0.6) continue;

        const t = (i + 0.5) / numBuildings;
        let x, z;

        if (isV) {
          x = road.x;
          z = road.z1 + t * (road.z2 - road.z1);
        } else {
          x = road.x1 + t * (road.x2 - road.x1);
          z = road.z;
        }

        const offset = (road.width || 12) / 2 + setback;
        const side = Math.random() > 0.5 ? 1 : -1;

        instances.push({
          x: isV ? x + offset * side : x + (Math.random() - 0.5) * 10,
          z: isV ? z + (Math.random() - 0.5) * 10 : z + offset * side,
          ry: Math.random() * Math.PI * 2,
          scale: 0.8 + Math.random() * 0.5,
          key: buildingKeys[Math.floor(Math.random() * buildingKeys.length)]
        });
      }
    });

    this._placeInstances(instances, 'buildings');
  }

  /**
   * Place theme-specific decorations
   */
  placeThemeSpecific(roads, theme) {
    switch (theme) {
      case 'signal_jump':
      case 'intersection_mastery':
        this.placeTrafficElements(roads, ['lowpoly_traffic_light_001', 'lowpoly_traffic_light_002', 'lowpoly_traffic_light_003']);
        break;
      case 'festival':
        this.placeFestivalDecorations(roads);
        break;
      case 'rain_driving':
      case 'puddle_etiquette':
        this.placeBarriers(roads);
        break;
      case 'highway_merge':
      case 'toll':
        this.placeHighwayElements(roads);
        break;
      case 'night_driving':
      case 'night_monsoon':
        this.placeNightElements(roads);
        break;
      case 'animals':
        this.placeAnimalCrossings(roads);
        break;
      case 'construction':
        this.placeConstructionZones(roads);
        break;
    }
  }

  placeTrafficElements(roads, lightKeys) {
    const instances = [];
    // Place at intersections (where vertical and horizontal roads meet)
    const vRoads = roads.filter(r => r.type === 'v');
    const hRoads = roads.filter(r => r.type === 'h');

    vRoads.forEach(vr => {
      hRoads.forEach(hr => {
        if (vr.x >= hr.x1 && vr.x <= hr.x2 && hr.z >= vr.z1 && hr.z <= vr.z2) {
          // This is an intersection — place traffic light
          instances.push({
            x: vr.x + 8, z: hr.z + 8,
            ry: 0, scale: 1.2,
            key: lightKeys[Math.floor(Math.random() * lightKeys.length)]
          });
        }
      });
    });

    this._placeInstances(instances, 'trafficLights');
  }

  placeFestivalDecorations(roads) {
    const instances = [];
    const festivalKeys = ['lowpoly_billboard_2x1_03', 'lowpoly_billboard_4x1_03', 'lowpoly_spotlight_01'];

    roads.forEach(road => {
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      const count = Math.floor(len / 40);

      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const x = isV ? road.x : road.x1 + t * (road.x2 - road.x1);
        const z = isV ? road.z1 + t * (road.z2 - road.z1) : road.z;
        const offset = (road.width || 12) / 2 + 5;

        instances.push({
          x: isV ? x + offset : x, z: isV ? z : z + offset,
          ry: Math.random() * Math.PI * 2, scale: 1.0,
          key: festivalKeys[Math.floor(Math.random() * festivalKeys.length)]
        });
      }
    });

    this._placeInstances(instances, 'festival');
  }

  placeBarriers(roads) {
    const instances = [];
    roads.forEach(road => {
      if (Math.random() > 0.3) return;
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      const startT = Math.random() * 0.3;
      const t = startT + 0.1;
      const x = isV ? road.x : road.x1 + t * (road.x2 - road.x1);
      const z = isV ? road.z1 + t * (road.z2 - road.z1) : road.z;

      instances.push({ x, z, ry: isV ? 0 : Math.PI / 2, scale: 1.0, key: 'barrier' });
    });
    this._placeInstances(instances, 'barriers');
  }

  placeHighwayElements(roads) {
    const instances = [];
    const hwKeys = ['sign_highway', 'sign_highway_detailed', 'lowpoly_billboard_4x1_03'];
    roads.forEach(road => {
      if (road.width < 18) return; // Only wide roads
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      const count = Math.floor(len / 60);
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const x = isV ? road.x : road.x1 + t * (road.x2 - road.x1);
        const z = isV ? road.z1 + t * (road.z2 - road.z1) : road.z;
        const offset = (road.width || 12) / 2 + 8;
        instances.push({
          x: isV ? x + offset : x, z: isV ? z : z + offset,
          ry: 0, scale: 1.5,
          key: hwKeys[Math.floor(Math.random() * hwKeys.length)]
        });
      }
    });
    this._placeInstances(instances, 'highway');
  }

  placeNightElements(roads) {
    // Extra street lights for night levels
    this.placeStreetLightsAlongRoads(roads, 'night');
  }

  placeAnimalCrossings(roads) {
    const instances = [];
    const animalKeys = ['animal_cow', 'animal_dog'];
    roads.forEach(road => {
      if (Math.random() > 0.4) return;
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      const t = 0.3 + Math.random() * 0.4;
      const x = isV ? road.x : road.x1 + t * (road.x2 - road.x1);
      const z = isV ? road.z1 + t * (road.z2 - road.z1) : road.z;

      instances.push({
        x: x + (Math.random() - 0.5) * 6,
        z: z + (Math.random() - 0.5) * 6,
        ry: Math.random() * Math.PI * 2,
        scale: 1.0,
        key: animalKeys[Math.floor(Math.random() * animalKeys.length)]
      });
    });
    this._placeInstances(instances, 'animals');
  }

  placeConstructionZones(roads) {
    const instances = [];
    const consKeys = ['barrier', 'cone', 'construction_light'];
    roads.forEach(road => {
      if (Math.random() > 0.5) return;
      const isV = road.type === 'v';
      const len = isV ? Math.abs(road.z2 - road.z1) : Math.abs(road.x2 - road.x1);
      const count = Math.floor(len / 20);
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const x = isV ? road.x : road.x1 + t * (road.x2 - road.x1);
        const z = isV ? road.z1 + t * (road.z2 - road.z1) : road.z;
        instances.push({
          x, z,
          ry: Math.random() * Math.PI * 2,
          scale: 1.0,
          key: consKeys[Math.floor(Math.random() * consKeys.length)]
        });
      }
    });
    this._placeInstances(instances, 'construction');
  }

  /**
   * Get tree density based on theme
   */
  _getThemeTreeDensity(theme) {
    const densities = {
      free_roam: 0.8,
      rural: 0.9,
      mountain: 0.7,
      suburb: 0.6,
      residential: 0.7,
      urban_grid: 0.3,
      highway_merge: 0.2,
      toll: 0.2,
      signal_jump: 0.4,
      festival: 0.3,
      night_driving: 0.4,
      rain_driving: 0.3,
      default: 0.4
    };
    return densities[theme] || densities.default;
  }

  /**
   * Get building types based on theme
   */
  _getThemeBuildings(theme) {
    const themes = {
      urban_grid: ['suburban_a', 'suburban_b', 'suburban_c', 'suburban_d', 'suburban_e'],
      suburb: ['suburban_a', 'suburban_f', 'suburban_g', 'suburban_h', 'suburban_i'],
      residential: ['suburban_j', 'suburban_k', 'suburban_l', 'suburban_m'],
      industrial: ['industrial_a', 'industrial_b', 'industrial_c', 'industrial_d', 'industrial_e'],
      commercial: ['mbuilding_sample-house-a', 'mbuilding_sample-tower-a', 'mbuilding_sample-tower-b'],
      downtown: ['mbuilding_sample-tower-a', 'mbuilding_sample-tower-b', 'mbuilding_sample-tower-c', 'mbuilding_sample-tower-d'],
      rural: ['suburban_n', 'suburban_o', 'suburban_p'],
      mountain: ['suburban_q', 'suburban_r'],
      highway_merge: ['industrial_f', 'industrial_g'],
      toll: ['industrial_h', 'industrial_i'],
      signal_jump: ['suburban_s', 'suburban_t', 'suburban_u'],
      festival: ['suburban_a', 'suburban_b', 'industrial_a'],
      night_driving: ['suburban_a', 'suburban_b', 'mbuilding_sample-tower-a'],
      rain_driving: ['suburban_c', 'suburban_d', 'industrial_b'],
      default: ['suburban_a', 'suburban_b', 'industrial_a']
    };
    return themes[theme] || themes.default;
  }

  /**
   * Place instances using individual clones (for variety)
   */
  _placeInstances(instances, groupName) {
    if (instances.length === 0) return;
    if (!window.PRELOADED_MODELS) return;

    const scene = this.game.scene;
    if (!scene) return;

    const group = new THREE.Group();
    group.name = `scenery_${groupName}`;

    let placed = 0;

    instances.forEach(inst => {
      const model = window.PRELOADED_MODELS[inst.key];
      if (!model) return;

      const obj = model.clone();
      obj.position.set(inst.x, 0, inst.z);
      obj.rotation.y = inst.ry || 0;
      const s = inst.scale || 1.0;
      obj.scale.set(s * 4.5, s * 4.5, s * 4.5); // Match existing scale

      obj.traverse(c => {
        if (c.isMesh) {
          c.castShadow = s > 0.5;
          c.receiveShadow = true;
          c.frustumCulled = true;
        }
      });

      group.add(obj);
      placed++;
    });

    if (placed > 0) {
      scene.add(group);
      this.placedObjects.push(group);
    }
  }

  /**
   * Clear all placed scenery
   */
  clear() {
    if (!this.game.scene) return;
    this.placedObjects.forEach(group => {
      this.game.scene.remove(group);
      group.traverse(c => {
        if (c.isMesh) {
          c.geometry?.dispose();
          if (c.material) {
            if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
            else c.material.dispose();
          }
        }
      });
    });
    this.placedObjects = [];
  }
}

window.SceneryKit = SceneryKit;
