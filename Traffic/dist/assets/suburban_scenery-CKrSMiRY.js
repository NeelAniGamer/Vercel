/**
 * suburban_scenery.js
 * High-fidelity Low-Poly Suburban Residential Avenue Generator for Mumbai Traffic Hero
 * Recreates the exact vibrant aesthetic from the reference screenshot:
 * - Asphalt road with dashed center line, manhole covers, and storm sewer drain grates
 * - Light concrete sidewalks with chamfered curbs and sloped driveway curb cuts
 * - Green front lawns, cobblestone/flagstone paved driveways and walkway paths
 * - Stylized low-poly houses (Green roof cottage with bench, Timber 2-story with chimney, Red log cabin)
 * - Dedicated Garage structure with interior lighting, workbench, and car parking space
 * - Boxwood property dividing hedges, rear wooden fences, flower beds, low-poly trees
 * - Suburban mailboxes on posts, red fire hydrants, metal trash cans, porch benches
 * - Seamless integration with Level 5 (School Zone) and Level 54 (Suburban Avenue)
 */

(function () {
  'use strict';

  function createSuburbanNeighborhood(game, cfg) {
    const scene = game.scene;
    if (!scene) return;

    // Remove any existing suburban scenery group
    const existing = scene.getObjectByName('SuburbanNeighborhoodScenery');
    if (existing) {
      scene.remove(existing);
      existing.traverse(ch => {
        if (ch.geometry) ch.geometry.dispose();
        if (ch.material) {
          if (Array.isArray(ch.material)) ch.material.forEach(m => m.dispose());
          else ch.material.dispose();
        }
      });
    }

    const group = new THREE.Group();
    group.name = 'SuburbanNeighborhoodScenery';

    // ── Vibrant Low-Poly Materials Palette (Matching Screenshot) ──────────────
    const mRoad = new THREE.MeshLambertMaterial({ color: 0x3d4449, roughness: 0.85 });
    const mCenterLine = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
    const mManhole = new THREE.MeshLambertMaterial({ color: 0x2d3436, roughness: 0.6 });
    const mManholeInner = new THREE.MeshLambertMaterial({ color: 0x1e272e, roughness: 0.7 });
    const mDrainGrate = new THREE.MeshLambertMaterial({ color: 0x1e272e, roughness: 0.5 });
    const mSidewalk = new THREE.MeshLambertMaterial({ color: 0xdcdde1, roughness: 0.9 });
    const mCurbLip = new THREE.MeshLambertMaterial({ color: 0xb2bec3, roughness: 0.8 });
    const mCurbRamp = new THREE.MeshLambertMaterial({ color: 0xc8d6e5, roughness: 0.9 });
    const mGrass = new THREE.MeshLambertMaterial({ color: 0x44bd32, roughness: 0.9 });
    const mHedge = new THREE.MeshLambertMaterial({ color: 0x27ae60, roughness: 0.8 });
    const mFence = new THREE.MeshLambertMaterial({ color: 0xb7791f, roughness: 0.8 });
    const mStoneDriveway = new THREE.MeshLambertMaterial({ color: 0x7f8c8d, roughness: 0.85 });
    const mFlagstonePaver = new THREE.MeshLambertMaterial({ color: 0xe2e8f0, roughness: 0.85 });
    const mSteppingStone = new THREE.MeshLambertMaterial({ color: 0xf5f6fa, roughness: 0.85 });
    const mWoodBrown = new THREE.MeshLambertMaterial({ color: 0x8d6e63, roughness: 0.75 });
    const mRedCabin = new THREE.MeshLambertMaterial({ color: 0x8b3a2a, roughness: 0.7 });
    const mRedRoof = new THREE.MeshLambertMaterial({ color: 0x9b2226, roughness: 0.6 });
    const mGreenRoof = new THREE.MeshLambertMaterial({ color: 0x2d6a4f, roughness: 0.6 });
    const mHousePurple = new THREE.MeshLambertMaterial({ color: 0x585cb8, roughness: 0.7 });
    const mTimberWall = new THREE.MeshLambertMaterial({ color: 0xb36224, roughness: 0.75 });
    const mTimberRoof = new THREE.MeshLambertMaterial({ color: 0x923c1d, roughness: 0.65 });
    const mBrickChimney = new THREE.MeshLambertMaterial({ color: 0xb33927, roughness: 0.8 });
    const mWindowGlass = new THREE.MeshBasicMaterial({ color: 0x70a1ff });
    const mWindowFrame = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const mRedDoor = new THREE.MeshLambertMaterial({ color: 0xd63031 });
    const mDarkDoor = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const mHydrantRed = new THREE.MeshLambertMaterial({ color: 0xeb4d4b });
    const mTrashMetal = new THREE.MeshLambertMaterial({ color: 0x7f8c8d, roughness: 0.4, metalness: 0.4 });
    const mMailboxPost = new THREE.MeshLambertMaterial({ color: 0xd38e5d });
    const mMailboxBox = new THREE.MeshLambertMaterial({ color: 0xe056fd });
    const mMailboxFlag = new THREE.MeshLambertMaterial({ color: 0xff4757 });
    const mFlowerBlue = new THREE.MeshLambertMaterial({ color: 0x3867d6 });
    const mFlowerRed = new THREE.MeshLambertMaterial({ color: 0xeb3b5a });
    const mFlowerStem = new THREE.MeshLambertMaterial({ color: 0x20bf6b });
    const mTreeBark = new THREE.MeshLambertMaterial({ color: 0x795548, roughness: 0.9 });
    const mTreeFoliage = new THREE.MeshLambertMaterial({ color: 0x26de81, roughness: 0.7 });
    const mTreeFoliage2 = new THREE.MeshLambertMaterial({ color: 0x20bf6b, roughness: 0.7 });
    const mWhiteBench = new THREE.MeshLambertMaterial({ color: 0xf8f9fa, roughness: 0.6 });
    const mGarageWall = new THREE.MeshLambertMaterial({ color: 0x636e72, roughness: 0.8 });
    const mGarageFloor = new THREE.MeshLambertMaterial({ color: 0x95a5a6, roughness: 0.85 });

    // Road & Lot Dimensions
    const roadWidth = 14;
    const halfRoad = roadWidth / 2;
    const roadLength = (cfg.roadLength || 5000);
    const sidewalkWidth = 3.6;
    const sidewalkHeight = 0.16;
    const lotSpacing = 38;
    const numLotsPerSide = Math.floor(roadLength / lotSpacing);
    const lotDepth = 35;
    const startZ = -roadLength / 2 + lotSpacing / 2;

    // Designate Lot 2 on East Side (side = 1) as Player's Home Lot
    const playerLotIdx = Math.min(2, numLotsPerSide - 1);
    const playerLotZ = startZ + playerLotIdx * lotSpacing;

    // Calculate School Zone campus lots for Level 5 St. Xavier Campus
    const schoolZ = cfg.hasSchool ? (cfg.schoolZ || 2320) : null;
    const schoolLotStartIdx = schoolZ !== null ? Math.floor((schoolZ - 50 - startZ) / lotSpacing) : -999;
    const schoolLotEndIdx = schoolZ !== null ? Math.ceil((schoolZ + 50 - startZ) / lotSpacing) : -999;

    // ── 1. Main Asphalt Road Bed ─────────────────────────────────────────────
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadMesh = new THREE.Mesh(roadGeo, mRoad);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0.01, 0);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);
    if (game.world) game.world.push(roadMesh);

    // ── 2. White Centerline Paint Stripes ───────────────────────────────────
    const dashLength = 3.2;
    const dashGap = 2.4;
    const stride = dashLength + dashGap;
    const numDashes = Math.floor(roadLength / stride);
    const dashStart = -roadLength / 2 + (roadLength - numDashes * stride) / 2 + dashLength / 2;

    for (let i = 0; i < numDashes; i++) {
      const z = dashStart + i * stride;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.26, dashLength), mCenterLine);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.02, z);
      group.add(dash);
    }

    // ── 3. Manhole Covers along the road center ─────────────────────────────
    const manholeInterval = 48;
    for (let z = -roadLength / 2 + 25; z < roadLength / 2 - 20; z += manholeInterval) {
      const manholeGrp = new THREE.Group();
      const outerRim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.02, 24), mManhole);
      const innerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.025, 16), mManholeInner);
      manholeGrp.add(outerRim);
      manholeGrp.add(innerCap);

      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.6), mManhole);
        spoke.rotation.y = a;
        manholeGrp.add(spoke);
      }

      manholeGrp.position.set((Math.random() - 0.5) * 1.2, 0.015, z);
      group.add(manholeGrp);
    }

    // ── 4. Sidewalks, Curbs & Lots (Left & Right Sides) ─────────────────────
    [-1, 1].forEach(side => {
      const xSign = side;
      const swCenterX = xSign * (halfRoad + sidewalkWidth / 2);

      // Continuous Sidewalk Bed
      const swMesh = new THREE.Mesh(
        new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, roadLength),
        mSidewalk
      );
      swMesh.position.set(swCenterX, sidewalkHeight / 2, 0);
      swMesh.receiveShadow = true;
      group.add(swMesh);
      if (game.world) game.world.push(swMesh);

      // Chamfered Curb Stone Lip facing the street
      const curbLip = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, sidewalkHeight, roadLength),
        mCurbLip
      );
      curbLip.position.set(xSign * (halfRoad + 0.125), sidewalkHeight / 2, 0);
      group.add(curbLip);

      // ── 5. Storm Drain Sewer Grates along Curb ─────────────────────────────
      for (let z = -roadLength / 2 + 15; z < roadLength / 2 - 15; z += 35) {
        const grate = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 1.4), mDrainGrate);
        grate.add(frame);
        for (let b = -0.5; b <= 0.5; b += 0.15) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.025, 0.05), new THREE.MeshLambertMaterial({ color: 0x000000 }));
          bar.position.set(0, 0.005, b);
          grate.add(bar);
        }
        grate.position.set(xSign * (halfRoad - 0.45), 0.015, z);
        group.add(grate);
      }

      // ── 6. Lots / Houses / Yards on this side ──────────────────────────────
      for (let i = 0; i < numLotsPerSide; i++) {
        const lotZ = startZ + i * lotSpacing;
        const yardCenterX = xSign * (halfRoad + sidewalkWidth + lotDepth / 2);
        const isPlayerLot = (side === 1 && i === playerLotIdx);
        const isSchoolCampusLot = (side === 1 && cfg.hasSchool && i >= schoolLotStartIdx && i <= schoolLotEndIdx);

        // If this lot is dedicated to the St. Xavier High School Campus, skip standard residential housing
        if (isSchoolCampusLot) {
          continue;
        }

        // Driveway Curb Cut & Apron (Sloped sidewalk ramp)
        const curbRamp = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, sidewalkHeight, 4.2),
          mCurbRamp
        );
        curbRamp.position.set(xSign * (halfRoad + 0.7), sidewalkHeight / 2 - 0.04, lotZ - 5.0);
        curbRamp.rotation.z = xSign * 0.12;
        group.add(curbRamp);

        // Grass Front & Back Yard
        const yardMesh = new THREE.Mesh(
          new THREE.BoxGeometry(lotDepth, 0.14, lotSpacing - 0.5),
          mGrass
        );
        yardMesh.position.set(yardCenterX, 0.07, lotZ);
        yardMesh.receiveShadow = true;
        group.add(yardMesh);

        // Driveway Geometry
        const drivewayWidth = 4.8;
        const drivewayLength = 17;
        const drivewayX = xSign * (halfRoad + sidewalkWidth + drivewayLength / 2);
        const drivewayZ = lotZ - 5.0;

        const drivewayMesh = new THREE.Mesh(
          new THREE.BoxGeometry(drivewayLength, 0.15, drivewayWidth),
          mStoneDriveway
        );
        drivewayMesh.position.set(drivewayX, 0.075, drivewayZ);
        drivewayMesh.receiveShadow = true;
        group.add(drivewayMesh);

        // Flagstone Pavers on the Driveway (high density on player lot, optimized on others)
        if (isPlayerLot || i % 4 === 0) {
          for (let px = -drivewayLength / 2 + 1; px < drivewayLength / 2 - 1; px += 2.0) {
            for (let pz = -drivewayWidth / 2 + 0.75; pz < drivewayWidth / 2 - 0.75; pz += 1.3) {
              const stone = new THREE.Mesh(
                new THREE.BoxGeometry(1.2 + (Math.random() - 0.5) * 0.25, 0.02, 0.8 + (Math.random() - 0.5) * 0.2),
                mFlagstonePaver
              );
              stone.position.set(drivewayX + px, 0.155, drivewayZ + pz);
              group.add(stone);
            }
          }
        }

        // Stepping Stone Walkway from sidewalk to Front Porch
        const walkwayZ = lotZ + 3.5;
        if (isPlayerLot || i % 2 === 0) {
          for (let stepX = halfRoad + sidewalkWidth + 1.2; stepX < halfRoad + sidewalkWidth + 11.5; stepX += 1.6) {
            const step = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 1.2), mSteppingStone);
            step.position.set(xSign * stepX, 0.155, walkwayZ);
            group.add(step);
          }
        }

        // Boxwood Dividing Hedges between properties
        const hedgeLength = lotDepth - 2;
        const hedgeZ = lotZ + lotSpacing / 2;
        const hedge = new THREE.Mesh(
          new THREE.BoxGeometry(hedgeLength, 1.2, 1.4),
          mHedge
        );
        hedge.position.set(yardCenterX, 0.65, hedgeZ);
        hedge.castShadow = true;
        hedge.receiveShadow = true;
        group.add(hedge);

        // Front hedge along sidewalk
        const frontHedge = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.9, 7.5),
          mHedge
        );
        frontHedge.position.set(xSign * (halfRoad + sidewalkWidth + 0.8), 0.52, lotZ + 9);
        frontHedge.castShadow = true;
        group.add(frontHedge);

        // Wooden Picket Fence along the rear of the lot
        const rearFenceX = xSign * (halfRoad + sidewalkWidth + lotDepth - 0.8);
        const fence = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 1.4, lotSpacing),
          mFence
        );
        fence.position.set(rearFenceX, 0.77, lotZ);
        fence.castShadow = true;
        group.add(fence);

        // Trees in the front yard (using preloaded Kenney GLB trees when available)
        const treeX = xSign * (halfRoad + sidewalkWidth + 4.5 + (i % 2 === 0 ? 1.5 : -0.5));
        const treeZ = lotZ + (i % 2 === 0 ? 7.5 : -9.5);
        const tree = placeSuburbanTree(treeX, treeZ, { mTreeBark, mTreeFoliage, mTreeFoliage2 });
        group.add(tree);

        // Flower Beds (near walkway on select lots)
        if (isPlayerLot || i % 3 === 0) {
          const flowerGroup = buildFlowerBed(mFlowerBlue, mFlowerRed, mFlowerStem);
          flowerGroup.position.set(xSign * (halfRoad + sidewalkWidth + 3.0), 0.15, walkwayZ + (xSign > 0 ? 1.6 : -1.6));
          group.add(flowerGroup);
        }

        // Street Furniture Props: Mailbox near driveway
        const mailbox = buildSuburbanMailbox(mMailboxPost, mMailboxBox, mMailboxFlag);
        mailbox.position.set(xSign * (halfRoad + sidewalkWidth - 0.5), 0, drivewayZ + (xSign > 0 ? 2.6 : -2.6));
        if (xSign < 0) mailbox.rotation.y = Math.PI;
        group.add(mailbox);

        // Street lights every 2 lots
        if (i % 2 === 0) {
          const P = window.PRELOADED_MODELS || {};
          const lightKey = (i % 4 === 0 && P['streetlight_curved']) ? 'streetlight_curved' : (P['streetlight_square'] ? 'streetlight_square' : null);
          if (lightKey && P[lightKey]) {
            const lightObj = P[lightKey].clone();
            lightObj.scale.set(2.2, 2.2, 2.2);
            lightObj.position.set(xSign * (halfRoad + 0.5), 0.16, lotZ + 6);
            lightObj.rotation.y = xSign > 0 ? Math.PI / 2 : -Math.PI / 2;
            lightObj.traverse(c => {
              if (c.isMesh) {
                c.castShadow = false;
                c.receiveShadow = true;
                c.frustumCulled = true;
              }
            });
            group.add(lightObj);
          }
        }

        // Decorative Brick Parcel Pillar
        if (i % 2 === 1) {
          const parcelPillar = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.9, 0.6),
            new THREE.MeshLambertMaterial({ color: 0xd35400 })
          );
          parcelPillar.position.set(xSign * (halfRoad + sidewalkWidth + 1.2), 0.45, drivewayZ + (xSign > 0 ? -2.2 : 2.2));
          group.add(parcelPillar);
        }

        // Red Fire Hydrant on sidewalk (every 3 lots)
        if (i % 3 === 0) {
          const hydrant = buildFireHydrant(mHydrantRed);
          hydrant.position.set(xSign * (halfRoad + 0.6), 0.16, lotZ + 12);
          group.add(hydrant);
        }

        // Metal Trash Can on sidewalk
        if (i % 2 === 0) {
          const trashCan = buildTrashCan(mTrashMetal);
          trashCan.position.set(xSign * (halfRoad + sidewalkWidth - 0.6), 0.16, lotZ - 10);
          group.add(trashCan);
        }

        // ── 7. House & Garage Architecture Placement ─────────────────────────
        const houseX = xSign * (halfRoad + sidewalkWidth + 14);
        const houseZ = lotZ + 2.5;
        const garageX = xSign * (halfRoad + sidewalkWidth + 14);
        const garageZ = lotZ - 5.0;

        // Build House (uses GLB models or procedural screenshot designs)
        const houseMesh = buildSuburbanHouseWithModels(
          i,
          isPlayerLot,
          xSign,
          houseX,
          houseZ,
          {
            mHousePurple, mGreenRoof, mWoodBrown, mWindowGlass, mWindowFrame, mDarkDoor, mWhiteBench,
            mTimberWall, mTimberRoof, mBrickChimney, mRedDoor,
            mRedCabin, mRedRoof
          }
        );
        if (houseMesh) {
          group.add(houseMesh);
        }

        // ── 8. Garage Structure Placement ──────────────────────────────────
        // Build Garage at the end of the driveway next to the house
        const garageMesh = buildSuburbanGarage(
          isPlayerLot ? mHousePurple : mGarageWall,
          isPlayerLot ? mGreenRoof : mTimberRoof,
          mWindowFrame,
          mGarageFloor,
          mWoodBrown
        );
        garageMesh.position.set(garageX, 0.08, garageZ);
        garageMesh.rotation.y = xSign > 0 ? 0 : Math.PI;
        group.add(garageMesh);

        // Neighboring lots get parked cars in driveway; Player lot has Real Drivable Car inside garage!
        if (!isPlayerLot && (i % 3 === 0 || i === 1)) {
          const parkedCar = buildLowPolyParkedCar();
          parkedCar.position.set(drivewayX, 0.16, drivewayZ);
          parkedCar.rotation.y = xSign > 0 ? -Math.PI / 2 : Math.PI / 2;
          group.add(parkedCar);
        }
      }
    });

    // ── 9. School Zone Construction (for Level 5 St. Xavier School) ──────────
    if (cfg.hasSchool) {
      buildSchoolZoneOverlay(group, {
        halfRoad,
        sidewalkWidth,
        schoolZ: schoolZ || 2320,
        mRoad,
        mSidewalk
      });
    }

    // ── 10. Storyline Radio Dispatch System ──────────────────────────────────
    if (cfg.story) {
      setupStoryRadioHUD(game, cfg.story);
    }

    // ── 10. Export Player & Vehicle Spawn Data to Game Engine ─────────────────
    // Player spawns on foot in front of their household on the front walkway/porch steps
    // Player's drivable vehicle spawns parked inside the garage at the end of the driveway
    const pWalkX = halfRoad + sidewalkWidth + 3.6; // ~14.2m (stepping stone path in front of house)
    const pWalkZ = playerLotZ + 3.5; // ~-61.5m
    const vGarageX = halfRoad + sidewalkWidth + 9.9; // ~20.5m (on flagstone driveway pad at garage)
    const vGarageZ = playerLotZ - 5.0; // ~-70.0m

    game._garageX = vGarageX;
    game._garageZ = vGarageZ;

    game._suburbanSpawn = {
      lotZ: playerLotZ,
      player: {
        x: pWalkX,
        y: 0.16,
        z: pWalkZ,
        rotY: -2.1 // Facing toward front yard, garage, driveway & street
      },
      car: {
        x: vGarageX,
        y: 0.16,
        z: vGarageZ,
        rotY: -Math.PI / 2 // Facing out of garage down driveway toward road
      },
      garage: {
        x: halfRoad + sidewalkWidth + 14,
        y: 0.16,
        z: vGarageZ,
        rotY: 0
      }
    };

    console.log('[SuburbanScenery] Spawn initialized:', game._suburbanSpawn);

    scene.add(group);
    return group;
  }

  // ── Helper Builders ───────────────────────────────────────────────────────

  /**
   * Dedicated Suburban Garage Structure with Interior Details & Lighting
   */
  function buildSuburbanGarage(mWall, mRoof, mTrim, mFloor, mWood) {
    const garage = new THREE.Group();
    garage.name = 'SuburbanGarage';

    const widthZ = 5.8;
    const depthX = 7.8;
    const wallH = 2.9;

    // Concrete Garage Floor Pad
    const floor = new THREE.Mesh(new THREE.BoxGeometry(depthX, 0.16, widthZ), mFloor);
    floor.position.set(0, 0.08, 0);
    floor.receiveShadow = true;
    garage.add(floor);

    // Back Wall (enclosed, at +X local)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, wallH, widthZ), mWall);
    backWall.position.set(depthX / 2 - 0.125, wallH / 2 + 0.16, 0);
    backWall.castShadow = true;
    garage.add(backWall);

    // Left Wall (at -Z local)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(depthX, wallH, 0.25), mWall);
    leftWall.position.set(0, wallH / 2 + 0.16, -widthZ / 2 + 0.125);
    leftWall.castShadow = true;
    garage.add(leftWall);

    // Right Wall (at +Z local)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(depthX, wallH, 0.25), mWall);
    rightWall.position.set(0, wallH / 2 + 0.16, widthZ / 2 - 0.125);
    rightWall.castShadow = true;
    garage.add(rightWall);

    // Front Portal Wall (at -X local, facing driveway)
    // Flanking pillars + Header lintel over open vehicle doorway
    const doorW = 4.0;
    const sidePillarW = (widthZ - doorW) / 2; // ~0.9m
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.25, wallH, sidePillarW), mWall);
    leftPillar.position.set(-depthX / 2 + 0.125, wallH / 2 + 0.16, -widthZ / 2 + sidePillarW / 2);
    garage.add(leftPillar);

    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.25, wallH, sidePillarW), mWall);
    rightPillar.position.set(-depthX / 2 + 0.125, wallH / 2 + 0.16, widthZ / 2 - sidePillarW / 2);
    garage.add(rightPillar);

    const headerLintel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, widthZ), mWall);
    headerLintel.position.set(-depthX / 2 + 0.125, wallH - 0.1, 0);
    garage.add(headerLintel);

    // White Trim Casing around Garage Door
    const trimHeader = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, doorW + 0.2), mTrim);
    trimHeader.position.set(-depthX / 2 - 0.05, wallH - 0.35, 0);
    garage.add(trimHeader);

    [-doorW / 2, doorW / 2].forEach(pz => {
      const trimPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallH - 0.3, 0.12), mTrim);
      trimPost.position.set(-depthX / 2 - 0.05, (wallH - 0.3) / 2 + 0.16, pz);
      garage.add(trimPost);
    });

    // Decorative Rolled-Up Garage Door Panel
    const rollDoor = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.35, doorW - 0.1),
      new THREE.MeshLambertMaterial({ color: 0x34495e })
    );
    rollDoor.position.set(-depthX / 2 + 0.15, wallH - 0.45, 0);
    garage.add(rollDoor);

    // Two Carriage Coach Lamps on Garage Front
    [-doorW / 2 - 0.4, doorW / 2 + 0.4].forEach(lz => {
      const lampBracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.25, 0.15),
        new THREE.MeshLambertMaterial({ color: 0x111111 })
      );
      lampBracket.position.set(-depthX / 2 - 0.08, 2.0, lz);
      garage.add(lampBracket);

      const lampGlow = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.16, 0.12),
        new THREE.MeshBasicMaterial({ color: 0xfff275 })
      );
      lampGlow.position.set(-depthX / 2 - 0.08, 1.98, lz);
      garage.add(lampGlow);
    });

    // Pitched Gabled Roof
    const roofSlopeL = new THREE.Mesh(new THREE.BoxGeometry(depthX + 0.6, 0.16, 3.4), mRoof);
    roofSlopeL.position.set(0, wallH + 0.75, -1.35);
    roofSlopeL.rotation.x = 0.45;
    roofSlopeL.castShadow = true;
    garage.add(roofSlopeL);

    const roofSlopeR = new THREE.Mesh(new THREE.BoxGeometry(depthX + 0.6, 0.16, 3.4), mRoof);
    roofSlopeR.position.set(0, wallH + 0.75, 1.35);
    roofSlopeR.rotation.x = -0.45;
    roofSlopeR.castShadow = true;
    garage.add(roofSlopeR);

    // Roof Ridge Cap
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(depthX + 0.64, 0.12, 0.35), mTrim);
    ridge.position.set(0, wallH + 1.48, 0);
    garage.add(ridge);

    // Triangular Gable Infill (Front and Back)
    const gableGeo = new THREE.ConeGeometry(3.0, 1.4, 4);
    const gableFront = new THREE.Mesh(gableGeo, mWall);
    gableFront.position.set(-depthX / 2 + 0.12, wallH + 0.75, 0);
    gableFront.rotation.y = Math.PI / 4;
    gableFront.scale.set(1, 1, 0.1);
    garage.add(gableFront);

    const gableBack = new THREE.Mesh(gableGeo, mWall);
    gableBack.position.set(depthX / 2 - 0.12, wallH + 0.75, 0);
    gableBack.rotation.y = Math.PI / 4;
    gableBack.scale.set(1, 1, 0.1);
    garage.add(gableBack);

    // Interior Garage Pendant Light (illuminates the parked car)
    const pendantCord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    pendantCord.position.set(0, wallH + 0.2, 0);
    garage.add(pendantCord);

    const pendantShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.35, 0.18, 10, 1, true),
      new THREE.MeshLambertMaterial({ color: 0x2c3e50 })
    );
    pendantShade.position.set(0, wallH - 0.25, 0);
    garage.add(pendantShade);

    const pendantBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff4d0 })
    );
    pendantBulb.position.set(0, wallH - 0.3, 0);
    garage.add(pendantBulb);

    const interiorLight = new THREE.PointLight(0xfffaed, 0.9, 8.5);
    interiorLight.position.set(0, wallH - 0.4, 0);
    garage.add(interiorLight);

    // Interior Workbench against Back Wall
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 2.2), mWood);
    benchTop.position.set(depthX / 2 - 0.65, 0.9, 0);
    garage.add(benchTop);

    [[-0.3, -0.9], [-0.3, 0.9], [0.3, -0.9], [0.3, 0.9]].forEach(([bx, bz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.82, 0.08), mWood);
      leg.position.set(depthX / 2 - 0.65 + bx, 0.45, bz);
      garage.add(leg);
    });

    // Red Metal Toolbox on Workbench
    const toolbox = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.2, 0.5),
      new THREE.MeshLambertMaterial({ color: 0xd63031 })
    );
    toolbox.position.set(depthX / 2 - 0.65, 1.05, -0.5);
    garage.add(toolbox);

    // Stacked Spare Car Tires in Corner
    [0.26, 0.66].forEach(ty => {
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 0.24, 14),
        new THREE.MeshLambertMaterial({ color: 0x2d3436 })
      );
      tire.position.set(depthX / 2 - 0.7, ty, widthZ / 2 - 0.7);
      garage.add(tire);
    });

    // Blue Oil Drum Can
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.8, 12),
      new THREE.MeshLambertMaterial({ color: 0x0984e3 })
    );
    drum.position.set(depthX / 2 - 0.65, 0.45, -widthZ / 2 + 0.7);
    garage.add(drum);

    return garage;
  }

  /**
   * Variant 0: Purple/Slate Cottage with Green Shingle Roof, Front Porch & Bench
   * (Matches the house on the right in the screenshot)
   */
  function buildGreenRoofCottage(mWall, mRoof, mWood, mGlass, mFrame, mDoor, mBench) {
    const house = new THREE.Group();

    // Main Lower House Body
    const bodyLower = new THREE.Mesh(new THREE.BoxGeometry(9.2, 4.0, 8.4), mWall);
    bodyLower.position.set(0, 2.0, 0);
    bodyLower.castShadow = true;
    bodyLower.receiveShadow = true;
    house.add(bodyLower);

    // Upper Gable Attic Level
    const bodyUpper = new THREE.Mesh(new THREE.BoxGeometry(6.2, 3.2, 6.2), mWall);
    bodyUpper.position.set(0, 5.2, 0);
    bodyUpper.castShadow = true;
    house.add(bodyUpper);

    // Green Pitched Gabled Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.7, 2.8, 4), mRoof);
    roof.position.set(0, 8.0, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    // White Roof Trim Eaves
    const eave = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.15, 6.8), mFrame);
    eave.position.set(0, 6.45, 0);
    house.add(eave);

    // Covered Front Porch Deck & Steps
    const porch = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.3, 3.0), mWood);
    porch.position.set(0, 0.15, 5.4);
    house.add(porch);

    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.22, 3.2), mRoof);
    porchRoof.position.set(0, 3.2, 5.4);
    house.add(porchRoof);

    // White Square Porch Pillars
    [-2.6, 2.6].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.9, 0.2), mFrame);
      pillar.position.set(px, 1.6, 6.6);
      house.add(pillar);
    });

    // White Slatted Porch Bench (Featured in Screenshot!)
    const bench = new THREE.Group();
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.6), mBench);
    benchSeat.position.set(0, 0.45, 0);
    bench.add(benchSeat);

    const benchBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.06), mBench);
    benchBack.position.set(0, 0.75, -0.27);
    bench.add(benchBack);

    [-0.8, 0.8].forEach(lx => {
      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), mBench);
      leg1.position.set(lx, 0.225, 0.25);
      bench.add(leg1);
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.06), mBench);
      leg2.position.set(lx, 0.375, -0.25);
      bench.add(leg2);
    });
    bench.position.set(-1.6, 0.15, 5.4);
    house.add(bench);

    // Front Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.5, 0.1), mDoor);
    door.position.set(1.2, 1.4, 4.25);
    house.add(door);

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.7, 0.06), mFrame);
    doorFrame.position.set(1.2, 1.4, 4.22);
    house.add(doorFrame);

    // Multi-Pane White Framed Windows on Front Facade
    [-2.8, 2.8].forEach(wx => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.15), mGlass);
      win.position.set(wx, 2.3, 4.25);
      house.add(win);

      const f = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 0.08), mFrame);
      f.position.set(wx, 2.3, 4.22);
      house.add(f);

      // Window Muntins (Cross Bars)
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.16), mFrame);
      hBar.position.set(wx, 2.3, 4.25);
      house.add(hBar);
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.16), mFrame);
      vBar.position.set(wx, 2.3, 4.25);
      house.add(vBar);
    });

    // Angled Bay Window on the Left Side (from screenshot)
    const bay = new THREE.Group();
    const bayBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 2.2), mWall);
    bay.add(bayBase);
    const bayWin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 1.6), mGlass);
    bayWin.position.set(-0.7, 0.1, 0);
    bay.add(bayWin);
    const bayRoof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.8, 4), mRoof);
    bayRoof.position.set(0, 1.45, 0);
    bayRoof.rotation.y = Math.PI / 4;
    bay.add(bayRoof);
    bay.position.set(-4.9, 2.2, 1.2);
    house.add(bay);

    return house;
  }

  /**
   * Variant 1: Two-Story Timber House with Dormer & Brick Chimney
   * (Matches the house in the middle of the screenshot)
   */
  function buildTimberTwoStoryHouse(mTimber, mRoof, mBrick, mWood, mGlass, mFrame, mDoor) {
    const house = new THREE.Group();

    // First Floor (Warm Honey Timber Siding)
    const floor1 = new THREE.Mesh(new THREE.BoxGeometry(9.8, 3.6, 7.5), mTimber);
    floor1.position.set(0, 1.8, 0);
    floor1.castShadow = true;
    floor1.receiveShadow = true;
    house.add(floor1);

    // Second Floor (Upper Attic Section)
    const floor2 = new THREE.Mesh(new THREE.BoxGeometry(6.6, 2.8, 5.8), mTimber);
    floor2.position.set(0, 4.9, 0);
    floor2.castShadow = true;
    house.add(floor2);

    // Warm Terracotta Pitched Roof
    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 3.0, 4), mRoof);
    mainRoof.position.set(0, 7.6, 0);
    mainRoof.rotation.y = Math.PI / 4;
    mainRoof.castShadow = true;
    house.add(mainRoof);

    // Red Brick Chimney Stack on Right Side (Featured in screenshot!)
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.8, 1.1), mBrick);
    chimney.position.set(3.6, 5.8, -0.6);
    chimney.castShadow = true;
    house.add(chimney);

    const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 1.3), mFrame);
    chimneyCap.position.set(3.6, 8.25, -0.6);
    house.add(chimneyCap);

    // Front Dormer Window on Second Floor
    const dormer = new THREE.Group();
    const dormerBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 1.6), mTimber);
    dormer.add(dormerBody);
    const dormerRoof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.9, 4), mRoof);
    dormerRoof.position.set(0, 1.1, 0);
    dormerRoof.rotation.y = Math.PI / 4;
    dormer.add(dormerRoof);
    const dormerWin = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.1), mGlass);
    dormerWin.position.set(0, 0.1, 0.82);
    dormer.add(dormerWin);
    dormer.position.set(0, 5.2, 2.8);
    house.add(dormer);

    // Wide Front Porch with Steps
    const porch = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 2.8), mWood);
    porch.position.set(0, 0.125, 4.8);
    house.add(porch);

    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(6.7, 0.2, 3.0), mRoof);
    porchRoof.position.set(0, 2.8, 4.8);
    house.add(porchRoof);

    [-2.8, 2.8].forEach(px => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.6, 0.18), mFrame);
      post.position.set(px, 1.4, 5.9);
      house.add(post);
    });

    // Front Door (Red Door as in screenshot)
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.4, 0.1), mDoor);
    door.position.set(0.6, 1.35, 3.8);
    house.add(door);

    // Front Windows with White Panes
    [-2.6, 2.6].forEach(wx => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.12), mGlass);
      win.position.set(wx, 2.1, 3.8);
      house.add(win);
      const f = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.08), mFrame);
      f.position.set(wx, 2.1, 3.77);
      house.add(f);
    });

    return house;
  }

  /**
   * Variant 2: Russet Red Log Cabin with Horizontal Siding
   * (Matches the house on the left in the screenshot)
   */
  function buildRedCabinHouse(mWall, mRoof, mWood, mGlass, mFrame, mDoor) {
    const house = new THREE.Group();

    // Horizontal Timber Log Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(10.2, 4.4, 7.2), mWall);
    body.position.set(0, 2.2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    house.add(body);

    // Steep Shingled Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.4, 3.2, 4), mRoof);
    roof.position.set(0, 6.0, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    // Front Porch
    const porch = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.28, 2.8), mWood);
    porch.position.set(0, 0.14, 4.8);
    house.add(porch);

    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.2, 3.0), mRoof);
    porchRoof.position.set(0, 2.9, 4.8);
    house.add(porchRoof);

    [-2.7, 2.7].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.7, 0.2), mWood);
      pillar.position.set(px, 1.45, 6.0);
      house.add(pillar);
    });

    // Front Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.5, 0.1), mDoor);
    door.position.set(0, 1.4, 3.65);
    house.add(door);

    // 4 Large Multi-Pane Windows Across Front (as in screenshot)
    [-3.8, -1.8, 1.8, 3.8].forEach(wx => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.12), mGlass);
      win.position.set(wx, 2.3, 3.65);
      house.add(win);
      const f = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 0.08), mFrame);
      f.position.set(wx, 2.3, 3.62);
      house.add(f);
    });

    return house;
  }

  /**
   * Helper to build suburban houses using repository GLB models with procedural variety
   */
  function buildSuburbanHouseWithModels(lotIndex, isPlayerLot, xSign, houseX, houseZ, materials) {
    if (isPlayerLot) {
      // Player lot: authentic screenshot purple cottage with green shingled roof, porch, bench
      const houseMesh = buildGreenRoofCottage(
        materials.mHousePurple,
        materials.mGreenRoof,
        materials.mWoodBrown,
        materials.mWindowGlass,
        materials.mWindowFrame,
        materials.mDarkDoor,
        materials.mWhiteBench
      );
      houseMesh.rotation.y = xSign > 0 ? -Math.PI / 2 : Math.PI / 2;
      houseMesh.position.set(houseX, 0.14, houseZ);
      return houseMesh;
    }

    const P = window.PRELOADED_MODELS || {};
    const glbKeys = [];
    if (P['house_lowpoly_isometric']) glbKeys.push('house_lowpoly_isometric');
    if (P['house_mansion_lowpoly']) glbKeys.push('house_mansion_lowpoly');
    'abcdefghijklmnopqrstu'.split('').forEach(l => {
      if (P['suburban_' + l]) glbKeys.push('suburban_' + l);
    });

    const variant = lotIndex % 6;

    // Use GLB models on 50% of neighbor lots
    if (glbKeys.length > 0 && (variant === 0 || variant === 2 || variant === 4)) {
      const key = glbKeys[lotIndex % glbKeys.length];
      const model = P[key];
      if (model) {
        const clone = model.clone();
        clone.rotation.y = xSign > 0 ? -Math.PI / 2 : Math.PI / 2;

        if (key === 'house_lowpoly_isometric') {
          clone.scale.set(0.48, 0.48, 0.48);
          clone.position.set(houseX + (xSign > 0 ? 1.5 : -1.5), 0.14, houseZ);
        } else if (key === 'house_mansion_lowpoly') {
          const s = 14 / 25751;
          clone.scale.set(s, s, s);
          clone.position.set(houseX + (xSign > 0 ? 2 : -2), 0.14, houseZ);
        } else {
          clone.scale.set(2.2, 2.2, 2.2);
          clone.position.set(houseX, 0.14, houseZ);
        }

        clone.traverse(c => {
          if (c.isMesh) {
            c.castShadow = false;
            c.receiveShadow = true;
            c.frustumCulled = true;
          }
        });
        return clone;
      }
    }

    // Procedural designs matching reference screenshot
    if (variant === 1 || variant === 3) {
      const houseMesh = buildTimberTwoStoryHouse(
        materials.mTimberWall,
        materials.mTimberRoof,
        materials.mBrickChimney,
        materials.mWoodBrown,
        materials.mWindowGlass,
        materials.mWindowFrame,
        materials.mRedDoor
      );
      houseMesh.rotation.y = xSign > 0 ? -Math.PI / 2 : Math.PI / 2;
      houseMesh.position.set(houseX, 0.14, houseZ);
      return houseMesh;
    } else {
      const houseMesh = buildRedCabinHouse(
        materials.mRedCabin,
        materials.mRedRoof,
        materials.mWoodBrown,
        materials.mWindowGlass,
        materials.mWindowFrame,
        materials.mRedDoor
      );
      houseMesh.rotation.y = xSign > 0 ? -Math.PI / 2 : Math.PI / 2;
      houseMesh.position.set(houseX, 0.14, houseZ);
      return houseMesh;
    }
  }

  /**
   * Helper to place trees in suburban lots using GLB models or procedural fallback
   */
  function placeSuburbanTree(x, z, materials) {
    const P = window.PRELOADED_MODELS || {};
    if (P['tree_large'] && Math.random() > 0.4) {
      const tree = P['tree_large'].clone();
      tree.scale.set(2.0, 2.0, 2.0);
      tree.position.set(x, 0.14, z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.traverse(c => {
        if (c.isMesh) {
          c.castShadow = false;
          c.receiveShadow = true;
          c.frustumCulled = true;
        }
      });
      return tree;
    } else if (P['tree_small'] && Math.random() > 0.4) {
      const tree = P['tree_small'].clone();
      tree.scale.set(2.0, 2.0, 2.0);
      tree.position.set(x, 0.14, z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.traverse(c => {
        if (c.isMesh) {
          c.castShadow = false;
          c.receiveShadow = true;
          c.frustumCulled = true;
        }
      });
      return tree;
    }
    const tree = buildLowPolySuburbanTree(materials.mTreeBark, Math.random() > 0.5 ? materials.mTreeFoliage : materials.mTreeFoliage2);
    tree.position.set(x, 0, z);
    return tree;
  }

  /**
   * Complete Procedural High School Architectural Fallback
   */
  function buildProceduralHighSchool() {
    const school = new THREE.Group();
    const mBrick = new THREE.MeshLambertMaterial({ color: 0x8b3a2a, roughness: 0.8 });
    const mStone = new THREE.MeshLambertMaterial({ color: 0xdcdde1, roughness: 0.7 });
    const mRoof = new THREE.MeshLambertMaterial({ color: 0x2c3e50, roughness: 0.6 });
    const mGlass = new THREE.MeshBasicMaterial({ color: 0x74b9ff });
    const mGold = new THREE.MeshLambertMaterial({ color: 0xf1c40f });

    // Central 3-Story Block
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(32, 12, 14), mBrick);
    mainBody.position.set(0, 6, 0);
    school.add(mainBody);

    // Left Classroom Wing
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 12), mBrick);
    leftWing.position.set(-24, 5, -2);
    school.add(leftWing);

    // Right Classroom Wing
    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 12), mBrick);
    rightWing.position.set(24, 5, -2);
    school.add(rightWing);

    // Main Roof
    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(24, 4, 4), mRoof);
    mainRoof.position.set(0, 14, 0);
    mainRoof.rotation.y = Math.PI / 4;
    school.add(mainRoof);

    // Clock Tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(7, 10, 7), mBrick);
    tower.position.set(0, 17, 2);
    school.add(tower);

    const towerSpire = new THREE.Mesh(new THREE.ConeGeometry(5, 6, 4), mGold);
    towerSpire.position.set(0, 25, 2);
    towerSpire.rotation.y = Math.PI / 4;
    school.add(towerSpire);

    const clock = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.2, 24), mStone);
    clock.rotation.x = Math.PI / 2;
    clock.position.set(0, 18.5, 5.6);
    school.add(clock);

    // Portico Pillars
    for (let px = -5; px <= 5; px += 2.5) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 6, 12), mStone);
      col.position.set(px, 3, 7.8);
      school.add(col);
    }
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(7, 2.5, 4), mStone);
    pediment.position.set(0, 7.2, 7.8);
    pediment.rotation.y = Math.PI / 4;
    school.add(pediment);

    // Windows
    for (let wx = -13; wx <= 13; wx += 3.5) {
      for (let wy = 3; wy <= 9; wy += 3) {
        if (Math.abs(wx) < 3.5 && wy === 3) continue;
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 0.1), mGlass);
        win.position.set(wx, wy, 7.05);
        school.add(win);
      }
    }

    return school;
  }

  /**
   * In-Game Storyline Radio Dispatch HUD System
   */
  function setupStoryRadioHUD(game, story) {
    if (!story || !story.dialogue || typeof document === 'undefined') return;

    let hud = document.getElementById('suburban-radio-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'suburban-radio-hud';
      hud.style.cssText = `
        position: fixed;
        bottom: 75px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        max-width: 600px;
        width: 92%;
        background: linear-gradient(135deg, rgba(13, 20, 36, 0.95), rgba(24, 32, 54, 0.95));
        border: 1.5px solid rgba(241, 196, 15, 0.7);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.75), 0 0 15px rgba(241, 196, 15, 0.25);
        border-radius: 14px;
        padding: 12px 18px;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.4s ease, transform 0.4s ease;
      `;
      hud.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.12); padding-bottom:6px; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem;">📻</span>
            <span style="font-size:0.75rem; font-weight:800; color:#f1c40f; letter-spacing:1.5px; text-transform:uppercase;">POLICE & FAMILY DISPATCH</span>
          </div>
          <span id="suburban-radio-speaker" style="font-size:0.82rem; font-weight:700; color:#5ed4f5;">Dispatch</span>
        </div>
        <div id="suburban-radio-line" style="font-size:0.92rem; line-height:1.45; color:#f5f6fa; font-weight:500;">...</div>
      `;
      document.body.appendChild(hud);
    }

    const speakerEl = document.getElementById('suburban-radio-speaker');
    const lineEl = document.getElementById('suburban-radio-line');
    let activeTimeout = null;
    const triggeredSet = new Set();

    function showDialogue(d) {
      if (!hud || !speakerEl || !lineEl) return;
      speakerEl.textContent = d.speaker || 'Dispatch';
      lineEl.textContent = d.line || '';
      hud.style.opacity = '1';
      hud.style.transform = 'translateX(-50%) translateY(0)';

      if (activeTimeout) clearTimeout(activeTimeout);
      activeTimeout = setTimeout(() => {
        hud.style.opacity = '0';
        hud.style.transform = 'translateX(-50%) translateY(20px)';
      }, 7500);
    }

    // Trigger initial spawn dialogue
    const spawnDialogue = story.dialogue.find(d => d.triggerZ <= -2350);
    if (spawnDialogue) {
      setTimeout(() => {
        triggeredSet.add(spawnDialogue.triggerZ);
        showDialogue(spawnDialogue);
      }, 1200);
    }

    // Polling hook based on player Z position
    if (game._storyTimer) clearInterval(game._storyTimer);
    game._storyTimer = setInterval(() => {
      if (!game.playing || !game.player) return;
      const pZ = game.player.position ? game.player.position.z : (game.vehicle ? game.vehicle.position.z : 0);
      story.dialogue.forEach(d => {
        if (!triggeredSet.has(d.triggerZ) && pZ >= d.triggerZ - 20 && pZ <= d.triggerZ + 80) {
          triggeredSet.add(d.triggerZ);
          showDialogue(d);
        }
      });
    }, 200);
  }

  /**
   * St. Xavier High School 3D Campus & School Zone Overlay for Level 5
   */
  function buildSchoolZoneOverlay(parentGroup, opts) {
    const { halfRoad, sidewalkWidth, schoolZ } = opts;
    const schoolGrp = new THREE.Group();
    schoolGrp.name = 'SchoolZoneOverlay';

    // ── 1. St. Xavier High School Campus Grounds ──────────────────────────────
    const campusWidth = 90; // along Z
    const campusDepth = 55; // along X
    const campusCenterX = halfRoad + sidewalkWidth + campusDepth / 2;

    // Green Campus Lawn
    const lawnGeo = new THREE.BoxGeometry(campusDepth, 0.14, campusWidth);
    const mLawn = new THREE.MeshLambertMaterial({ color: 0x27ae60, roughness: 0.9 });
    const campusLawn = new THREE.Mesh(lawnGeo, mLawn);
    campusLawn.position.set(campusCenterX, 0.07, schoolZ);
    campusLawn.receiveShadow = true;
    schoolGrp.add(campusLawn);

    // Paved Entrance Courtyard / Assembly Plaza
    const plazaGeo = new THREE.BoxGeometry(28, 0.16, 42);
    const mPlaza = new THREE.MeshLambertMaterial({ color: 0xc8d6e5, roughness: 0.8 });
    const plaza = new THREE.Mesh(plazaGeo, mPlaza);
    plaza.position.set(halfRoad + sidewalkWidth + 15, 0.08, schoolZ);
    plaza.receiveShadow = true;
    schoolGrp.add(plaza);

    // ── 2. Real 3D School Building Model (building_high_school.glb) ───────────
    const P = window.PRELOADED_MODELS || {};
    if (P['building_high_school']) {
      const highSchoolModel = P['building_high_school'].clone();
      const s = 55 / 211.77; // raw x: 211.77 -> 55m width
      highSchoolModel.scale.set(s, s, s);
      highSchoolModel.position.set(halfRoad + sidewalkWidth + 34, 0.15, schoolZ);
      highSchoolModel.rotation.y = -Math.PI / 2;
      highSchoolModel.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          c.frustumCulled = true;
        }
      });
      schoolGrp.add(highSchoolModel);
    } else if (typeof THREE !== 'undefined' && THREE.GLTFLoader) {
      new THREE.GLTFLoader().load('Models/building_high_school.glb', gltf => {
        const m = gltf.scene;
        const s = 55 / 211.77;
        m.scale.set(s, s, s);
        m.position.set(halfRoad + sidewalkWidth + 34, 0.15, schoolZ);
        m.rotation.y = -Math.PI / 2;
        m.traverse(c => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
            c.frustumCulled = true;
          }
        });
        schoolGrp.add(m);
      }, undefined, () => {
        const procSchool = buildProceduralHighSchool();
        procSchool.position.set(halfRoad + sidewalkWidth + 32, 0.15, schoolZ);
        procSchool.rotation.y = -Math.PI / 2;
        schoolGrp.add(procSchool);
      });
    } else {
      const procSchool = buildProceduralHighSchool();
      procSchool.position.set(halfRoad + sidewalkWidth + 32, 0.15, schoolZ);
      procSchool.rotation.y = -Math.PI / 2;
      schoolGrp.add(procSchool);
    }

    // ── 3. Campus Perimeter Fence & Monumental Entrance Archway ───────────────
    const mPillar = new THREE.MeshLambertMaterial({ color: 0x9b2226, roughness: 0.8 });
    const mStoneCap = new THREE.MeshLambertMaterial({ color: 0xf5f6fa, roughness: 0.7 });
    const mIronFence = new THREE.MeshLambertMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.8 });

    const gateOpening = 14;
    const fenceZ1 = schoolZ - campusWidth / 2;
    const fenceZ2 = schoolZ + campusWidth / 2;
    const fenceX = halfRoad + sidewalkWidth + 0.5;

    const leftFenceLen = (schoolZ - gateOpening / 2) - fenceZ1;
    const leftFence = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, leftFenceLen), mIronFence);
    leftFence.position.set(fenceX, 1.1, fenceZ1 + leftFenceLen / 2);
    schoolGrp.add(leftFence);

    const rightFenceLen = fenceZ2 - (schoolZ + gateOpening / 2);
    const rightFence = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, rightFenceLen), mIronFence);
    rightFence.position.set(fenceX, 1.1, (schoolZ + gateOpening / 2) + rightFenceLen / 2);
    schoolGrp.add(rightFence);

    // Gate Pillars
    [-gateOpening / 2, gateOpening / 2].forEach(gz => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.4, 1.2), mPillar);
      pillar.position.set(fenceX, 1.7, schoolZ + gz);
      schoolGrp.add(pillar);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 1.4), mStoneCap);
      cap.position.set(fenceX, 3.5, schoolZ + gz);
      schoolGrp.add(cap);

      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), mStoneCap);
      sphere.position.set(fenceX, 3.95, schoolZ + gz);
      schoolGrp.add(sphere);
    });

    // Monumental Overhead Entrance Arch
    const archBar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, gateOpening + 0.8), mPillar);
    archBar.position.set(fenceX, 4.2, schoolZ);
    schoolGrp.add(archBar);

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0c2461';
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 500, 116);
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ST. XAVIER HIGH SCHOOL', 256, 56);
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('ESTD 1869 • PAREL CAMPUS', 256, 96);
        const archTex = new THREE.CanvasTexture(canvas);
        const archSignMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(gateOpening - 1.2, 0.65),
          new THREE.MeshBasicMaterial({ map: archTex, transparent: true })
        );
        archSignMesh.rotation.y = -Math.PI / 2;
        archSignMesh.position.set(fenceX - 0.25, 4.2, schoolZ);
        schoolGrp.add(archSignMesh);
      }
    }

    // Flagpole in Courtyard with Indian Tricolor Flag
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 11, 8), mStoneCap);
    flagPole.position.set(halfRoad + sidewalkWidth + 16, 5.5, schoolZ);
    schoolGrp.add(flagPole);

    if (typeof document !== 'undefined') {
      const fCanvas = document.createElement('canvas');
      fCanvas.width = 180;
      fCanvas.height = 120;
      const fctx = fCanvas.getContext('2d');
      if (fctx) {
        fctx.fillStyle = '#FF9933'; fctx.fillRect(0, 0, 180, 40);
        fctx.fillStyle = '#FFFFFF'; fctx.fillRect(0, 40, 180, 40);
        fctx.fillStyle = '#128807'; fctx.fillRect(0, 80, 180, 40);
        fctx.strokeStyle = '#000080'; fctx.lineWidth = 2;
        fctx.beginPath(); fctx.arc(90, 60, 14, 0, Math.PI * 2); fctx.stroke();
        const flagMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2.4, 1.6),
          new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fCanvas), side: THREE.DoubleSide })
        );
        flagMesh.position.set(halfRoad + sidewalkWidth + 17.2, 10.0, schoolZ);
        schoolGrp.add(flagMesh);
      }
    }

    // ── 4. High-Visibility Zebra Crossing Across 14m Avenue ──────────────────
    const zebraW = 13.6;
    const stripeCount = 12;
    const stripeW = 0.8;
    const stripeL = 3.6;
    const mZebra = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });

    for (let i = 0; i < stripeCount; i++) {
      const sx = -zebraW / 2 + i * (zebraW / stripeCount) + 0.6;
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeW, stripeL), mZebra);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(sx, 0.025, schoolZ);
      schoolGrp.add(stripe);
    }

    // White Stop Line ahead of Zebra Crossing
    const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 0.5), mZebra);
    stopLine.rotation.x = -Math.PI / 2;
    stopLine.position.set(3.5, 0.025, schoolZ - 6.0);
    schoolGrp.add(stopLine);

    // ── 5. Yellow School Bus at Dropoff Curb ────────────────────────────────
    const mBusBody = new THREE.MeshLambertMaterial({ color: 0xf1c40f });
    const mBusStripe = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const mBusGlass = new THREE.MeshBasicMaterial({ color: 0x74b9ff });
    const mBusWheel = new THREE.MeshLambertMaterial({ color: 0x2d3436 });

    const bus = new THREE.Group();
    const busBody = new THREE.Mesh(new THREE.BoxGeometry(9.2, 2.8, 3.0), mBusBody);
    busBody.position.set(0, 1.7, 0);
    busBody.castShadow = true;
    bus.add(busBody);

    const busStripe = new THREE.Mesh(new THREE.BoxGeometry(9.25, 0.4, 3.02), mBusStripe);
    busStripe.position.set(0, 1.3, 0);
    bus.add(busStripe);

    const busGlass = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.0, 3.05), mBusGlass);
    busGlass.position.set(0.4, 2.1, 0);
    bus.add(busGlass);

    [[-2.8, -1.5], [-2.8, 1.5], [2.8, -1.5], [2.8, 1.5]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.45, 16), mBusWheel);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.6, wz);
      bus.add(w);
    });

    bus.position.set(halfRoad + 2.2, 0, schoolZ - 25);
    bus.rotation.y = Math.PI;
    schoolGrp.add(bus);

    // ── 6. School Crossing Guard Mr. Shinde with Handheld STOP Sign ──────────
    const guard = new THREE.Group();
    const guardBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 1.4, 8),
      new THREE.MeshLambertMaterial({ color: 0xffd32a })
    );
    guardBody.position.y = 1.0;
    guard.add(guardBody);

    const guardHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x685449 })
    );
    guardHead.position.y = 1.85;
    guard.add(guardHead);

    const signPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6),
      new THREE.MeshLambertMaterial({ color: 0xdcdde1 })
    );
    signPole.position.set(0.45, 1.2, 0.35);
    guard.add(signPole);

    const stopSign = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.05, 8),
      new THREE.MeshLambertMaterial({ color: 0xd63031 })
    );
    stopSign.rotation.z = Math.PI / 2;
    stopSign.position.set(0.45, 2.2, 0.35);
    guard.add(stopSign);

    guard.position.set(halfRoad + 0.8, 0.16, schoolZ + 2.2);
    schoolGrp.add(guard);

    // ── 7. Crossing School Children (Uniformed Students on Zebra Crossing) ──
    const studentPositions = [
      { x: 2.0, z: schoolZ - 0.4, col: 0x0984e3 },
      { x: -1.2, z: schoolZ + 0.6, col: 0xffffff },
      { x: -3.8, z: schoolZ - 0.2, col: 0x0984e3 }
    ];
    studentPositions.forEach(sp => {
      const student = new THREE.Group();
      const sBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.9, 8), new THREE.MeshLambertMaterial({ color: sp.col }));
      sBody.position.y = 0.65;
      student.add(sBody);
      const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshLambertMaterial({ color: 0x795548 }));
      sHead.position.y = 1.25;
      student.add(sHead);
      const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.18), new THREE.MeshLambertMaterial({ color: 0xd63031 }));
      backpack.position.set(0, 0.7, -0.18);
      student.add(backpack);
      student.position.set(sp.x, 0.02, sp.z);
      student.rotation.y = Math.PI / 2;
      schoolGrp.add(student);
    });

    // ── 8. Amber Flasher School Zone Warning Beacon (at Z = 2050m) ───────────
    const flasherPost = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.2, 8), new THREE.MeshLambertMaterial({ color: 0x7f8c8d }));
    post.position.y = 2.1;
    flasherPost.add(post);

    const yellowSign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.08), new THREE.MeshLambertMaterial({ color: 0xf1c40f }));
    yellowSign.position.set(0, 3.2, 0);
    flasherPost.add(yellowSign);

    const flasherBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color: 0xff9f1a }));
    flasherBeacon.position.set(0, 4.15, 0);
    flasherPost.add(flasherBeacon);

    // Place warning flasher at Z = 2050 (270m before school zebra)
    flasherPost.position.set(halfRoad + 0.8, 0.16, 2050);
    schoolGrp.add(flasherPost);

    parentGroup.add(schoolGrp);
  }

  /**
   * Low-Poly Suburban Mailbox on Wooden Post
   */
  function buildSuburbanMailbox(mPost, mBox, mFlag) {
    const mb = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6), mPost);
    post.position.y = 0.55;
    post.castShadow = true;
    mb.add(post);

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.6), mBox);
    box.position.set(0, 1.15, 0.1);
    box.castShadow = true;
    mb.add(box);

    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.1), mFlag);
    flag.position.set(0.18, 1.25, 0.15);
    mb.add(flag);

    return mb;
  }

  /**
   * Low-Poly Red Fire Hydrant
   */
  function buildFireHydrant(mRed) {
    const fh = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 8), mRed);
    body.position.y = 0.35;
    body.castShadow = true;
    fh.add(body);

    const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mRed);
    topCap.position.y = 0.72;
    fh.add(topCap);

    const sideNut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 6), mRed);
    sideNut.rotation.z = Math.PI / 2;
    sideNut.position.y = 0.45;
    fh.add(sideNut);

    return fh;
  }

  /**
   * Galvanized Metal Trash Can with Lid
   */
  function buildTrashCan(mMetal) {
    const tc = new THREE.Group();
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.85, 10), mMetal);
    can.position.y = 0.425;
    can.castShadow = true;
    tc.add(can);

    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 10), mMetal);
    lid.position.y = 0.88;
    tc.add(lid);

    return tc;
  }

  /**
   * Low-Poly Faceted Tree (Multifaceted trunk and foliage clusters)
   */
  function buildLowPolySuburbanTree(mTrunk, mFoliage) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 3.2, 5), mTrunk);
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    tree.add(trunk);

    const foliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 0), mFoliage);
    foliage1.position.set(0, 3.8, 0);
    foliage1.castShadow = true;
    tree.add(foliage1);

    const foliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), mFoliage);
    foliage2.position.set(0.6, 4.6, -0.4);
    foliage2.castShadow = true;
    tree.add(foliage2);

    const foliage3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), mFoliage);
    foliage3.position.set(-0.7, 4.2, 0.5);
    foliage3.castShadow = true;
    tree.add(foliage3);

    return tree;
  }

  /**
   * Flower Bed (Blue and Red low-poly blossoms)
   */
  function buildFlowerBed(mBlue, mRed, mStem) {
    const bed = new THREE.Group();
    const count = 18;
    for (let i = 0; i < count; i++) {
      const isRed = (i % 3 === 0);
      const mat = isRed ? mRed : mBlue;
      const x = (Math.random() - 0.5) * 2.2;
      const z = (Math.random() - 0.5) * 1.8;
      const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), mat);
      flower.position.set(x, 0.22, z);
      bed.add(flower);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 4), mStem);
      stem.position.set(x, 0.11, z);
      bed.add(stem);
    }
    return bed;
  }

  /**
   * Low-Poly Compact Parked Car for Neighboring Driveways
   */
  function buildLowPolyParkedCar() {
    const car = new THREE.Group();
    const colors = [0x0984e3, 0xd63031, 0x6c5ce7, 0x00b894, 0xe17055];
    const col = colors[Math.floor(Math.random() * colors.length)];
    const mCarBody = new THREE.MeshLambertMaterial({ color: col });
    const mCarGlass = new THREE.MeshBasicMaterial({ color: 0x74b9ff });
    const mCarTire = new THREE.MeshLambertMaterial({ color: 0x2d3436 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 1.7), mCarBody);
    body.position.set(0, 0.65, 0);
    body.castShadow = true;
    car.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.75, 1.4), mCarGlass);
    cabin.position.set(-0.2, 1.35, 0);
    cabin.castShadow = true;
    car.add(cabin);

    [[-1.1, -0.85], [-1.1, 0.85], [1.1, -0.85], [1.1, 0.85]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 12), mCarTire);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.32, wz);
      car.add(wheel);
    });

    return car;
  }

  window.createSuburbanNeighborhood = createSuburbanNeighborhood;
})();
