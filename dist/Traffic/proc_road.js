// Procedural Road Generator for Traffic Simulator
// Gradient-following algorithm with self-avoidance and Bezier smoothing
// Compatible with Three.js r128, integrates with ProcTerrain

// ============================================
// SpatialHash - for fast self-intersection checks
// ============================================
class SpatialHash {
  constructor(cellSize = 10) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  _key(x, z) {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cz}`;
  }

  insert(x, z, data) {
    const key = this._key(x, z);
    if (!this.cells.has(key)) this.cells.set(key, []);
    this.cells.get(key).push({ x, z, data });
  }

  // Check if any point exists within radius of (x, z)
  hasNearby(x, z, radius) {
    const rCells = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    for (let dx = -rCells; dx <= rCells; dx++) {
      for (let dz = -rCells; dz <= rCells; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const p of cell) {
            const dist = Math.sqrt((p.x - x) ** 2 + (p.z - z) ** 2);
            if (dist < radius) return true;
          }
        }
      }
    }
    return false;
  }

  // Get all points within radius
  queryNearby(x, z, radius) {
    const results = [];
    const rCells = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    for (let dx = -rCells; dx <= rCells; dx++) {
      for (let dz = -rCells; dz <= rCells; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const p of cell) {
            const dist = Math.sqrt((p.x - x) ** 2 + (p.z - z) ** 2);
            if (dist < radius) results.push(p);
          }
        }
      }
    }
    return results;
  }

  clear() {
    this.cells.clear();
  }

  get size() {
    return this.cells.size;
  }
}

// ============================================
// RoadGenerator - creates self-avoiding roads
// ============================================
class RoadGenerator {
  constructor(terrain, opts = {}) {
    this.terrain = terrain;
    this.stepSize = opts.stepSize || 10;       // coarse resolution (meters)
    this.maxSlope = opts.maxSlope || 0.12;     // max gradient for road
    this.roadWidth = opts.roadWidth || 8;      // meters
    this.minCurveRadius = opts.minCurveRadius || 30;
    this.lookaheadSteps = opts.lookaheadSteps || 5;
    this.turnbackDepth = opts.turnbackDepth || 8;
    this.numDirections = 16;                    // directions to sample
  }

  // Find a good starting point for the road
  findStartPoint(searchRadius = 200) {
    const rng = this.terrain.noise;
    let bestPoint = null;
    let bestScore = -Infinity;
    for (let attempt = 0; attempt < 200; attempt++) {
      const angle = rng.noise2D(attempt * 123.45, 0) * Math.PI * searchRadius;
      const dist = Math.abs(rng.noise2D(0, attempt * 67.89)) * searchRadius;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const h = this.terrain.getHeight(x, z);
      const slope = this.terrain.getSlope(x, z);
      if (h > this.terrain.waterLevel + 5 && slope < this.maxSlope * 0.5) {
        // Score: prefer higher ground (less likely to hit water) and flatter
        const score = (h - this.terrain.waterLevel) - slope * 100;
        if (score > bestScore) {
          bestScore = score;
          bestPoint = { x, z };
        }
      }
    }
    if (bestPoint) return bestPoint;
    // Fallback: any roadable point
    for (let attempt = 0; attempt < 500; attempt++) {
      const x = (Math.random() - 0.5) * searchRadius * 2;
      const z = (Math.random() - 0.5) * searchRadius * 2;
      if (this.terrain.isRoadable(x, z)) return { x, z };
    }
    return { x: 0, z: 0 };
  }

  // Score a direction: lower = better for road
  // leniency > 1 allows steeper slopes when stuck
  _scoreDirection(x, z, dx, dz, prevDx, prevDz, leniency = 1.0) {
    const nx = x + dx * this.stepSize;
    const nz = z + dz * this.stepSize;
    const slope = this.terrain.getSlope(nx, nz);
    if (slope > this.maxSlope * leniency) return Infinity;

    const height = this.terrain.getHeight(nx, nz);
    if (height < this.terrain.waterLevel) return Infinity;

    let score = slope * 50;

    // Prefer continuing in same direction (smooth curves)
    if (prevDx !== undefined && (prevDx !== 0 || prevDz !== 0)) {
      const dot = dx * prevDx + dz * prevDz;
      score += (1 - dot) * 15;
    }

    // Lookahead: prefer directions with more roadable ahead
    let roadableCount = 0;
    for (let i = 1; i <= this.lookaheadSteps; i++) {
      const lx = x + dx * this.stepSize * i;
      const lz = z + dz * this.stepSize * i;
      if (this.terrain.isRoadable(lx, lz)) roadableCount++;
    }
    score += (this.lookaheadSteps - roadableCount) * 5;

    return score;
  }

  // Generate the full road
  generate(maxLength = 15000) {
    const start = this.findStartPoint();
    const startH = this.terrain.getHeight(start.x, start.z);
    const points = [{ x: start.x, z: start.z, h: startH, width: this.roadWidth }];
    const spatialHash = new SpatialHash(this.stepSize * 2);
    spatialHash.insert(start.x, start.z, { index: 0 });

    // Pick initial direction: find best direction from start
    let prevDx = 0, prevDz = 0;
    let bestInitScore = Infinity;
    for (let i = 0; i < this.numDirections; i++) {
      const angle = (i / this.numDirections) * Math.PI * 2;
      const dx = Math.cos(angle), dz = Math.sin(angle);
      const score = this._scoreDirection(start.x, start.z, dx, dz, undefined, undefined, 1.5);
      if (score < bestInitScore) {
        bestInitScore = score;
        prevDx = dx;
        prevDz = dz;
      }
    }
    // If no direction works with leniency, just go with whatever
    if (bestInitScore === Infinity) { prevDx = 0; prevDz = 1; }

    let currentX = start.x, currentZ = start.z;
    let stuckCount = 0;
    let totalSteps = Math.floor(maxLength / this.stepSize);

    for (let step = 1; step <= totalSteps; step++) {
      // Score all directions (exclude reverse)
      let bestScore = Infinity;
      let bestDx = 0, bestDz = 0;

      for (let i = 0; i < this.numDirections; i++) {
        const angle = (i / this.numDirections) * Math.PI * 2;
        const dx = Math.cos(angle);
        const dz = Math.sin(angle);

        // Skip reverse direction (dot product < -0.5 = more than 135 degrees)
        if (prevDx !== 0 || prevDz !== 0) {
          if (dx * prevDx + dz * prevDz < -0.3) continue;
        }

        const nx = currentX + dx * this.stepSize;
        const nz = currentZ + dz * this.stepSize;

        // Self-avoidance: check if too close to existing road (but not the immediate previous point)
        if (spatialHash.hasNearby(nx, nz, this.stepSize * 1.2)) continue;

        const score = this._scoreDirection(currentX, currentZ, dx, dz, prevDx, prevDz);
        if (score < bestScore) {
          bestScore = score;
          bestDx = dx;
          bestDz = dz;
        }
      }

      if (bestScore === Infinity) {
        // Stuck! Try with more leniency
        for (let len = 1.5; len <= 3.0; len += 0.5) {
          for (let i = 0; i < this.numDirections; i++) {
            const angle = (i / this.numDirections) * Math.PI * 2;
            const dx = Math.cos(angle);
            const dz = Math.sin(angle);
            if (prevDx !== 0 || prevDz !== 0) {
              if (dx * prevDx + dz * prevDz < -0.3) continue;
            }
            const nx = currentX + dx * this.stepSize;
            const nz = currentZ + dz * this.stepSize;
            if (spatialHash.hasNearby(nx, nz, this.stepSize * 1.0)) continue;
            const score = this._scoreDirection(currentX, currentZ, dx, dz, prevDx, prevDz, len);
            if (score < bestScore) {
              bestScore = score;
              bestDx = dx;
              bestDz = dz;
            }
          }
          if (bestScore !== Infinity) break;
        }
      }

      if (bestScore === Infinity) {
        // Still stuck - turn back
        stuckCount++;
        if (stuckCount > this.turnbackDepth || points.length < 3) break;
        // Remove last few points and try from earlier position
        const backtrack = Math.min(this.turnbackDepth, Math.floor(points.length / 3));
        for (let i = 0; i < backtrack; i++) {
          const removed = points.pop();
          spatialHash.cells.delete(spatialHash._key(removed.x, removed.z));
        }
        if (points.length < 2) break;
        const lastPoint = points[points.length - 1];
        currentX = lastPoint.x;
        currentZ = lastPoint.z;
        prevDx = -prevDx;
        prevDz = -prevDz;
        continue;
      }

      stuckCount = 0;
      currentX += bestDx * this.stepSize;
      currentZ += bestDz * this.stepSize;
      prevDx = bestDx;
      prevDz = bestDz;

      const h = this.terrain.getHeight(currentX, currentZ);
      const point = { x: currentX, z: currentZ, h, width: this.roadWidth };
      points.push(point);
      spatialHash.insert(currentX, currentZ, { index: points.length - 1 });
    }

    // Post-process: smooth heights
    this._smoothHeights(points);

    // Generate fine resolution with Bezier
    const finePoints = this._bezierInterpolate(points, 1);

    return {
      coarse: points,
      fine: finePoints,
      length: (points.length - 1) * this.stepSize,
      bounds: this._calcBounds(points),
    };
  }

  // Try to find a way out when stuck
  _tryTurnback(points, spatialHash, x, z, prevDx, prevDz) {
    // Remove last few points to backtrack
    const backtrack = Math.min(this.turnbackDepth, Math.floor(points.length / 3));
    for (let i = 0; i < backtrack; i++) {
      const removed = points.pop();
      spatialHash.cells.delete(spatialHash._key(removed.x, removed.z));
    }
    if (points.length < 2) return false;
    return true;
  }

  // Smooth road heights with moving average
  _smoothHeights(points, windowSize = 4) {
    const original = points.map(p => p.h);
    for (let i = 0; i < points.length; i++) {
      let sum = 0, count = 0;
      for (let j = -windowSize; j <= windowSize; j++) {
        const idx = i + j;
        if (idx >= 0 && idx < original.length) {
          sum += original[idx];
          count++;
        }
      }
      points[i].h = sum / count;
    }
  }

  // Bezier interpolation from coarse (10m) to fine (1m) resolution
  _bezierInterpolate(coarsePoints, resolution = 1) {
    const fine = [];
    const step = this.stepSize;

    for (let i = 0; i < coarsePoints.length - 1; i++) {
      const p0 = coarsePoints[Math.max(0, i - 1)];
      const p1 = coarsePoints[i];
      const p2 = coarsePoints[i + 1];
      const p3 = coarsePoints[Math.min(coarsePoints.length - 1, i + 2)];

      const numFine = Math.floor(step / resolution);
      for (let t = 0; t < numFine; t++) {
        const u = t / numFine;
        // Catmull-Rom spline (smooth through control points)
        const u2 = u * u;
        const u3 = u2 * u;

        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3
        );
        const z = 0.5 * (
          (2 * p1.z) +
          (-p0.z + p2.z) * u +
          (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * u2 +
          (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * u3
        );
        const h = 0.5 * (
          (2 * p1.h) +
          (-p0.h + p2.h) * u +
          (2 * p0.h - 5 * p1.h + 4 * p2.h - p3.h) * u2 +
          (-p0.h + 3 * p1.h - 3 * p2.h + p3.h) * u3
        );

        fine.push({ x, z, h, width: p1.width });
      }
    }

    // Add final point
    const last = coarsePoints[coarsePoints.length - 1];
    fine.push({ x: last.x, z: last.z, h: last.h, width: last.width });

    return fine;
  }

  _calcBounds(points) {
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    return { minX, maxX, minZ, maxZ };
  }
}

// ============================================
// RoadMeshGenerator - Three.js road meshes
// ============================================
class RoadMeshGenerator {
  constructor(terrain) {
    this.terrain = terrain;
    this.chunkLength = 100; // meters per road chunk
  }

  // Generate a road ribbon mesh from fine points
  generateRoadMesh(finePoints, startIdx = 0, count = null) {
    if (!count) count = finePoints.length - startIdx;
    const endIdx = Math.min(startIdx + count, finePoints.length);
    const pts = finePoints.slice(startIdx, endIdx);

    if (pts.length < 2) return null;

    const positions = [];
    const indices = [];
    const uvs = [];
    const halfWidth = pts[0].width / 2;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      // Direction vector (tangent)
      let dx = 0, dz = 1;
      if (i < pts.length - 1) {
        dx = pts[i + 1].x - p.x;
        dz = pts[i + 1].z - p.z;
      } else if (i > 0) {
        dx = p.x - pts[i - 1].x;
        dz = p.z - pts[i - 1].z;
      }
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      dx /= len;
      dz /= len;

      // Perpendicular
      const px = -dz * halfWidth;
      const pz = dx * halfWidth;

      // Left and right vertices
      positions.push(p.x + px, p.h + 0.1, p.z + pz);
      positions.push(p.x - px, p.h + 0.1, p.z - pz);

      // UV for texture tiling
      const v = i / pts.length;
      uvs.push(0, v);
      uvs.push(1, v);

      // Triangles
      if (i < pts.length - 1) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
      color: 0x333333,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 1; // render above terrain
    return mesh;
  }

  // Generate road chunks for streaming
  generateChunks(finePoints, chunkSize = 100) {
    const chunks = [];
    const totalLength = finePoints.length;
    let distance = 0;

    for (let i = 0; i < totalLength; i += chunkSize) {
      const end = Math.min(i + chunkSize + 1, totalLength); // overlap for seams
      const chunk = this.generateRoadMesh(finePoints, i, end - i);
      if (chunk) {
        chunk.chunkIndex = chunks.length;
        chunk.startDistance = distance;
        chunks.push(chunk);
      }
      distance += chunkSize;
    }

    return chunks;
  }
}

// ============================================
// RoadManager - handles road streaming & queries
// ============================================
class RoadManager {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.meshGen = new RoadMeshGenerator(terrain);
    this.roadData = null;
    this.chunks = [];
    this.activeChunks = new Set();
    this.viewDistance = 300; // meters
  }

  // Generate and load a road
  generateRoad(seed = null) {
    if (seed) this.terrain = new ProcTerrain({ seed });
    const gen = new RoadGenerator(this.terrain);
    this.roadData = gen.generate(15000);

    // Create chunks
    this.chunks = this.meshGen.generateChunks(this.roadData.fine, 100);
    return this.roadData;
  }

  // Update which road chunks to show based on player position
  update(playerX, playerZ) {
    if (!this.roadData) return;

    // Find closest point on road
    const closestIdx = this._findClosestPoint(playerX, playerZ);
    const startChunk = Math.floor(closestIdx / 100) - 1;
    const endChunk = startChunk + Math.ceil(this.viewDistance / 100) + 2;

    const needed = new Set();
    for (let i = Math.max(0, startChunk); i <= Math.min(this.chunks.length - 1, endChunk); i++) {
      needed.add(i);
    }

    // Hide/show chunks
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      if (needed.has(i) && !this.activeChunks.has(i)) {
        this.scene.add(chunk);
        this.activeChunks.add(i);
      } else if (!needed.has(i) && this.activeChunks.has(i)) {
        this.scene.remove(chunk);
        this.activeChunks.delete(i);
      }
    }
  }

  // Find closest road point to world position
  _findClosestPoint(x, z) {
    if (!this.roadData || !this.roadData.fine.length) return 0;
    let bestDist = Infinity;
    let bestIdx = 0;
    // Sample every 10th point for speed
    for (let i = 0; i < this.roadData.fine.length; i += 10) {
      const p = this.roadData.fine[i];
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  // Get road position at distance (for AI, spawn points)
  getPointAtDistance(dist) {
    if (!this.roadData) return null;
    const idx = Math.floor(dist);
    if (idx >= 0 && idx < this.roadData.fine.length) {
      return this.roadData.fine[idx];
    }
    return null;
  }

  // Get road direction at a point (for AI steering)
  getDirectionAt(idx) {
    if (!this.roadData || idx < 0 || idx >= this.roadData.fine.length - 1) {
      return { x: 0, z: 1 };
    }
    const p1 = this.roadData.fine[idx];
    const p2 = this.roadData.fine[idx + 1];
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    return { x: dx / len, z: dz / len };
  }

  get length() {
    return this.roadData ? this.roadData.length : 0;
  }

  getPointCount() {
    return this.roadData ? this.roadData.fine.length : 0;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SpatialHash = SpatialHash;
  window.RoadGenerator = RoadGenerator;
  window.RoadMeshGenerator = RoadMeshGenerator;
  window.RoadManager = RoadManager;
}
