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
    if (!scene) {return;}

    // Remove any existing suburban scenery group
    const existing = scene.getObjectByName('SuburbanNeighborhoodScenery');
    if (existing) {
      scene.remove(existing);
      existing.traverse(ch => {
        if (ch.geometry) {ch.geometry.dispose();}
        if (ch.material) {
          if (Array.isArray(ch.material)) {ch.material.forEach(m => m.dispose());}
          else {ch.material.dispose();}
        }
      });
    }

    const group = new THREE.Group();
    group.name = 'SuburbanNeighborhoodScenery';
    group.userData = { noLod: true, isGround: true };

    // ── Vibrant Low-Poly Materials Palette (Matching Screenshot) ──────────────
    const mRoad = new THREE.MeshStandardMaterial({ color: 0x3d4449, roughness: 0.85 });
    const mCenterLine = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
    const mManhole = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.6 });
    const mManholeInner = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.7 });
    const mDrainGrate = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.5 });
    const mSidewalk = new THREE.MeshStandardMaterial({ color: 0xdcdde1, roughness: 0.9 });
    const mCurbLip = new THREE.MeshStandardMaterial({ color: 0xb2bec3, roughness: 0.8 });
    const mCurbRamp = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.8 });
    const texGrassInit = (typeof createGrassCanvasTexture === 'function') ? createGrassCanvasTexture() : null;
    const mGrass = texGrassInit
      ? new THREE.MeshStandardMaterial({ map: texGrassInit, roughness: 0.85 })
      : new THREE.MeshStandardMaterial({ color: 0x3da339, roughness: 0.85 });
    const mHedge = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8 });
    const mFence = new THREE.MeshStandardMaterial({ color: 0xb7791f, roughness: 0.8 });
    const mStoneDriveway = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.85 });
    const mFlagstonePaver = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 });
    const mSteppingStone = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.85 });
    const mWoodBrown = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.75 });
    const mRedCabin = new THREE.MeshStandardMaterial({ color: 0x8b3a2a, roughness: 0.7 });
    const mRedRoof = new THREE.MeshStandardMaterial({ color: 0x9b2226, roughness: 0.6 });
    const mGreenRoof = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.6 });
    const mHousePurple = new THREE.MeshStandardMaterial({ color: 0x585cb8, roughness: 0.7 });
    const mTimberWall = new THREE.MeshStandardMaterial({ color: 0xb36224, roughness: 0.75 });
    const mTimberRoof = new THREE.MeshStandardMaterial({ color: 0x923c1d, roughness: 0.65 });
    const mBrickChimney = new THREE.MeshStandardMaterial({ color: 0xb33927, roughness: 0.8 });
    const mWindowGlass = new THREE.MeshBasicMaterial({ color: 0x70a1ff });
    const mWindowFrame = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const mRedDoor = new THREE.MeshLambertMaterial({ color: 0xd63031 });
    const mDarkDoor = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const mHydrantRed = new THREE.MeshLambertMaterial({ color: 0xeb4d4b });
    const mTrashMetal = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, roughness: 0.4, metalness: 0.4 });
    const mMailboxPost = new THREE.MeshLambertMaterial({ color: 0xd38e5d });
    const mMailboxBox = new THREE.MeshLambertMaterial({ color: 0xe056fd });
    const mMailboxFlag = new THREE.MeshLambertMaterial({ color: 0xff4757 });
    const mFlowerBlue = new THREE.MeshLambertMaterial({ color: 0x3867d6 });
    const mFlowerRed = new THREE.MeshLambertMaterial({ color: 0xeb3b5a });
    const mFlowerStem = new THREE.MeshLambertMaterial({ color: 0x20bf6b });
    const mTreeBark = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.9 });
    const mTreeFoliage = new THREE.MeshStandardMaterial({ color: 0x26de81, roughness: 0.7 });
    const mTreeFoliage2 = new THREE.MeshStandardMaterial({ color: 0x20bf6b, roughness: 0.7 });
    const mWhiteBench = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.6 });
    const mGarageWall = new THREE.MeshStandardMaterial({ color: 0x636e72, roughness: 0.8 });
    const mGarageFloor = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.85 });

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

    // ── Dedicated Multi-District Mumbai Urban City Generator (Level 5) ───────
    if (cfg.roads && cfg.roads.length > 1) {
      createMumbaiCityMultiDistrict(game, cfg, group, {
        mRoad, mCenterLine, mManhole, mManholeInner, mDrainGrate,
        mSidewalk, mCurbLip, mCurbRamp, mGrass, mHedge, mFence,
        mStoneDriveway, mFlagstonePaver, mSteppingStone, mWoodBrown,
        mRedCabin, mRedRoof, mGreenRoof, mHousePurple, mTimberWall,
        mTimberRoof, mBrickChimney, mWindowGlass, mWindowFrame,
        mRedDoor, mDarkDoor, mHydrantRed, mTrashMetal, mMailboxPost,
        mMailboxBox, mMailboxFlag, mFlowerBlue, mFlowerRed, mFlowerStem,
        mTreeBark, mTreeFoliage, mTreeFoliage2, mWhiteBench, mGarageWall, mGarageFloor
      });
      if (cfg.story) {
        setupStoryRadioHUD(game, cfg.story);
      }
      scene.add(group);
      return group;
    }

    // ── 1. Main Asphalt Road Bed ─────────────────────────────────────────────
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadMesh = new THREE.Mesh(roadGeo, mRoad);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0.01, 0);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);
    if (game.world) {game.world.push(roadMesh);}

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
      if (game.world) {game.world.push(swMesh);}

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
        if (xSign < 0) {mailbox.rotation.y = Math.PI;}
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
          const hydrant = buildHydrantFromMaterial(mHydrantRed);
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
          mWoodBrown,
          isPlayerLot
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
        flasherZ: (cfg.flasherZ !== undefined) ? cfg.flasherZ : null,
        hasAIDirector: !!cfg.hasAIDirector,
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
  function buildSuburbanGarage(mWall, mRoof, mTrim, mFloor, mWood, isPlayerLot = false) {
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

    if (isPlayerLot) {
      const interiorLight = new THREE.PointLight(0xfffaed, 0.9, 12);
      interiorLight.position.set(0, wallH - 0.4, 0);
      garage.add(interiorLight);
    }

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
    if (P['house_lowpoly_isometric']) {glbKeys.push('house_lowpoly_isometric');}
    if (P['house_mansion_lowpoly']) {glbKeys.push('house_mansion_lowpoly');}
    'abcdefghijklmnopqrstu'.split('').forEach(l => {
      if (P['suburban_' + l]) {glbKeys.push('suburban_' + l);}
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
        if (Math.abs(wx) < 3.5 && wy === 3) {continue;}
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
    if (!story || !story.dialogue || typeof document === 'undefined') {return;}

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
      if (!hud || !speakerEl || !lineEl) {return;}
      speakerEl.textContent = d.speaker || 'Dispatch';
      lineEl.textContent = d.line || '';
      hud.style.opacity = '1';
      hud.style.transform = 'translateX(-50%) translateY(0)';
      // Duck engine/wind under the voice line so radio stays intelligible
      try {
        if (window.TrafficAudio && window.TrafficAudio.duckWorld) {window.TrafficAudio.duckWorld(0.5, 7800);}
      } catch (e) {}

      if (activeTimeout) {clearTimeout(activeTimeout);}
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
    if (game._storyTimer) {clearInterval(game._storyTimer);}
    game._storyTimer = setInterval(() => {
      if (!game.playing || !game.player) {return;}
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
    // AI Director levels get the ANIMATED guard + dismissal swarm from TrafficMapAI —
    // skip the static duplicates here (they used to spawn on top of each other).
    const directorActive = !!opts.hasAIDirector;
    // Warning flasher follows the level's flasherZ (L5: 380), not a hardcoded 2050.
    const flasherZ = (opts.flasherZ !== undefined && opts.flasherZ !== null) ? opts.flasherZ : 2050;
    const schoolGrp = new THREE.Group();
    schoolGrp.name = 'SchoolZoneOverlay';
    schoolGrp.userData = { noLod: true, isGround: true };

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
      const highSchoolModel = P['building_high_school'];
      highSchoolModel.scale.set(1.1, 1.1, 1.1);
      highSchoolModel.position.set(halfRoad + sidewalkWidth + 30, 0.15, schoolZ);
      highSchoolModel.rotation.y = -Math.PI / 2;
      highSchoolModel.userData = { noLod: true };
      highSchoolModel.traverse(c => {
        c.frustumCulled = false;
        if (c.isMesh) {
          c.castShadow = false;
          c.receiveShadow = true;
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
    // (skipped when the AI Director is active — it spawns the animated guard)
    if (!directorActive) {
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
    } // end static guard (AI Director levels use the animated one)

    // ── 7. Crossing School Children (Uniformed Students on Zebra Crossing) ──
    // (skipped when the AI Director is active — it runs the 10-student dismissal swarm)
    if (!directorActive) {
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
    } // end static students (AI Director levels use the dismissal swarm)

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

    // Place warning flasher at the level's flasherZ (L5: 380m before the zebra)
    flasherPost.position.set(halfRoad + 0.8, 0.16, flasherZ);
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
  function buildHydrantFromMaterial(mRed) {
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
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.46, 3.4, 8), mTrunk);
    trunk.position.y = 1.7;
    trunk.castShadow = true;
    tree.add(trunk);

    const foliage1 = new THREE.Mesh(new THREE.SphereGeometry(1.9, 10, 8), mFoliage);
    foliage1.scale.set(1.2, 0.9, 1.2);
    foliage1.position.set(0, 3.8, 0);
    foliage1.castShadow = true;
    tree.add(foliage1);

    const foliage2 = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), mFoliage);
    foliage2.scale.set(1.1, 0.85, 1.1);
    foliage2.position.set(0.6, 4.6, -0.4);
    foliage2.castShadow = true;
    tree.add(foliage2);

    const foliage3 = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 8), mFoliage);
    foliage3.scale.set(1.1, 0.85, 1.1);
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



  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   *  AUTHENTIC MUMBAI CITY MULTI-DISTRICT GENERATOR (Level 5)
   *  Directly crafted from real-world Mumbai urban morphology & reference photos:
   *  1. Leg 1 (Z: -2450 to -1550, X = 0): Shanti Niketan & Nav Prabhat CHS
   *     • Player Home & Garage (Z = -2380)
   *     • Gated CHS Entrances with Guard Booth & Boom Barrier (Z = -2300, -1950)
   *     • 4-Story CHS Apartments with Balconies, Laundry, & Rooftop Sintex Tanks
   *     • Flowering Gulmohar Trees & Parked Scooters
   *  2. Turn 1 & Leg 2 (Z = -1600, X: 0 to 180): Corner Bazar & Chawl District
   *     • 3-Story Heritage Mumbai Chawl Buildings with wooden balconies
   *     • Mahalaxmi Kirana Stores with blue tarpaulin canopy & hanging snack strips
   *     • Corner Chai Tapri with brass kettle, cutting chai glasses, & bench
   *     • Red BEST Bus Stop Shelter with bilingual timetable sign
   *     • Curbside Black & Yellow Bajaj Autorickshaw queue
   *  3. Turn 2 & Leg 3 (X = 180, Z: -1600 to 1200): Swami Vivekananda 4-Lane Avenue
   *     • Divided Arterial with center median, hedges & streetlights
   *     • Dense Highrise CHS (Gokuldham CHS, Sagar Darshan) behind boundary walls
   *     • Street food Vada Pav stall, municipal bins & post boxes
   *  4. Turn 3 & Leg 5 (Z: 1200 to 2500, X = 0): St. Xavier School Safety Precinct
   *     • School Silence Zone signposts (No Horn)
   *     • Flashing Amber Warning Beacon at Z = 1700 (20 km/h Strict)
   *     • Curbside School Bus Bay with parked yellow Tata/Ashok Leyland buses
   *     • Tactical Yellow Thermoplastic Markings ("SCHOOL ZONE", "LOOK ◀ ▶")
   *     • Raised Tabletop Zebra Crosswalk at Z = 2320
   *     • Crossing Guard Havaldar Shinde with articulated STOP sign
   *     • Monumental St. Xavier Heritage Stone Arch Gate at Z = 2450
   *     • School compound wall with student safety murals ("STUDENTS FIRST")
   *     • Courtyard assembly lawn with Indian Tricolor flag on flagpole
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   *  OPTIMIZED MUMBAI CITY MULTI-DISTRICT GENERATOR (Level 5)
   *  - Features 5 connected road legs with 4 sharp 90° turns every 180-350m!
   *  - DENSE MUMBAI HOUSEHOLDS: Over 120+ authentic buildings (Chawls with verandas,
   *    Gated CHS Societies, Kirana stores, Chai tapris, BEST bus stops, Highrises).
   *  - SPATIAL CHUNK STREAMER: Groups scenery into 60m x 60m spatial chunks.
   *    Dynamically culls faraway chunks (>160m) so the map never overloads the GPU!
   * ═══════════════════════════════════════════════════════════════════════════════
   */
  function createMumbaiCityMultiDistrict(game, cfg, group, mats) {
    const scene = game.scene;
    const roads = cfg.roads || [];

    // Clean up any existing culling timer from previous level run
    if (game._mumbaiCullTimer) {
      clearInterval(game._mumbaiCullTimer);
      game._mumbaiCullTimer = null;
    }

    // ── Additional Mumbai Themed Materials ───────────────────────────────────
    // ── PROCEDURAL CANVAS TEXTURES ─────────────────────────────────────────
    const texAsphalt = createAsphaltCanvasTexture();
    const texSidewalk = createSidewalkPaverTexture();
    const texGrass = createGrassCanvasTexture();
    const texChsCream = createBuildingFacadeTexture('#f5f0e6', true);
    const texChsPlaster = createBuildingFacadeTexture('#e8dfd1', true);
    const texChawl = createBuildingFacadeTexture('#d4b896', false);
    const texBasalt = createBasaltStoneTexture();

    // High-Fidelity Materials with procedural textures
    if (texAsphalt && mats.mRoad) {mats.mRoad.map = texAsphalt;}
    if (texSidewalk && mats.mSidewalk) {mats.mSidewalk.map = texSidewalk;}
    if (texGrass && mats.mGrass) {
      mats.mGrass.map = texGrass;
      mats.mGrass.needsUpdate = true;
    }

    const mTactileYellow = new THREE.MeshLambertMaterial({ color: 0xf1c40f, roughness: 0.65 });

    const mMumbaiCream = new THREE.MeshLambertMaterial({
      color: 0xf5f0e6, roughness: 0.85, map: texChsCream || null
    });
    const mMumbaiChsPlaster = new THREE.MeshLambertMaterial({
      color: 0xe8dfd1, roughness: 0.9, map: texChsPlaster || null
    });
    const mMumbaiSignBlue = new THREE.MeshLambertMaterial({ color: 0x0c2461, roughness: 0.5 });
    const mGoldEmissive = new THREE.MeshBasicMaterial({ color: 0xf1c40f });
    const mSintexBlack = new THREE.MeshLambertMaterial({ color: 0x111417, roughness: 0.4 });
    const mChawlWood = new THREE.MeshLambertMaterial({ color: 0x4a2c11, roughness: 0.85 });
    const mChawlWall = new THREE.MeshLambertMaterial({
      color: 0xd4b896, roughness: 0.9, map: texChawl || null
    });
    const mBlueTarp = new THREE.MeshLambertMaterial({ color: 0x0984e3, roughness: 0.6 });
    const mTinRoof = new THREE.MeshLambertMaterial({ color: 0x7f8c8d, roughness: 0.5 });
    const mBestRed = new THREE.MeshLambertMaterial({ color: 0xd63031, roughness: 0.6 });
    const mAutoYellow = new THREE.MeshLambertMaterial({ color: 0xf1c40f, roughness: 0.5 });
    const mAutoBlack = new THREE.MeshLambertMaterial({ color: 0x1e272e, roughness: 0.6 });
    const mSchoolYellow = new THREE.MeshLambertMaterial({ color: 0xf1c40f, roughness: 0.6 });
    const mSchoolBusYellow = new THREE.MeshLambertMaterial({ color: 0xf39c12, roughness: 0.5 });
    const mSchoolBusStripe = new THREE.MeshLambertMaterial({ color: 0x8b0000, roughness: 0.6 });
    const mBasaltStone = new THREE.MeshLambertMaterial({
      color: 0x474b4e, roughness: 0.9, map: texBasalt || null
    });
    const mGulmoharFlower = new THREE.MeshLambertMaterial({ color: 0xe84118, roughness: 0.8 });
    const mGulmoharLeaf = new THREE.MeshLambertMaterial({ color: 0x218c4e, roughness: 0.7 });
    const mCurbBlack = new THREE.MeshLambertMaterial({ color: 0x2d3436, roughness: 0.8 });
    const mCurbYellow = new THREE.MeshLambertMaterial({ color: 0xf1c40f, roughness: 0.8 });
    const mSignPostGreen = new THREE.MeshLambertMaterial({ color: 0x1b4332, roughness: 0.6 });
    const mPalmBark = new THREE.MeshLambertMaterial({ color: 0x5d4037, roughness: 0.9 });
    const mPalmFrond = new THREE.MeshLambertMaterial({ color: 0x2e7d32, roughness: 0.7 });
    const mCoconutGreen = new THREE.MeshLambertMaterial({ color: 0x388e3c, roughness: 0.8 });
    const mHoardingBlue = new THREE.MeshLambertMaterial({ color: 0x003366, roughness: 0.5 });
    const mHoardingRed = new THREE.MeshLambertMaterial({ color: 0xb71c1c, roughness: 0.5 });
    const mBmcGreen = new THREE.MeshLambertMaterial({ color: 0x2e7d32, roughness: 0.6 });
    const mBmcBlue = new THREE.MeshLambertMaterial({ color: 0x1565c0, roughness: 0.6 });

    const sidewalkWidth = 3.6;
    const sidewalkHeight = 0.16;

    // ── SPATIAL CHUNK STREAMER & DISTANCE CULLING SYSTEM ─────────────────────
    // Divides scenery into 60m x 60m spatial cells. Only chunks within 160m are rendered!
    const CHUNK_SIZE = 60;
    const chunkMap = new Map();

    function getOrCreateChunk(x, z, isSkyline = false) {
      const cx = Math.floor(x / CHUNK_SIZE);
      const cz = Math.floor(z / CHUNK_SIZE);
      const key = cx + '_' + cz;
      let chunk = chunkMap.get(key);
      if (!chunk) {
        chunk = new THREE.Group();
        chunk.name = 'mumbai_chunk_' + key;
        chunk.userData = {
          cx: cx,
          cz: cz,
          centerX: (cx + 0.5) * CHUNK_SIZE,
          centerZ: (cz + 0.5) * CHUNK_SIZE,
          isSkyline: isSkyline
        };
        chunkMap.set(key, chunk);
        group.add(chunk);
      }
      return chunk;
    }

    function addScenery(obj, x, z, isSkyline = false) {
      const chunk = getOrCreateChunk(x, z, isSkyline);
      if (isSkyline) {chunk.userData.isSkyline = true;}
      chunk.add(obj);
    }

    // ── Designated Road & Sidewalk Spatial Boundary & Exclusion Enforcement ──
    // RULE: Houses, buildings, fences, and bulk obstacles CANNOT spawn on roads or sidewalks.
    function isRoadOrSidewalk(x, z, margin = 2.0) {
      for (let i = 0; i < roads.length; i++) {
        const r = roads[i];
        const halfRoadAndSidewalk = (r.width || 14) / 2 + sidewalkWidth + margin;
        if (r.type === 'v') {
          const zMin = Math.min(r.z1, r.z2) - margin;
          const zMax = Math.max(r.z1, r.z2) + margin;
          if (Math.abs(x - r.x) <= halfRoadAndSidewalk && z >= zMin && z <= zMax) {
            return true;
          }
        } else {
          const xMin = Math.min(r.x1, r.x2) - margin;
          const xMax = Math.max(r.x1, r.x2) + margin;
          if (Math.abs(z - r.z) <= halfRoadAndSidewalk && x >= xMin && x <= xMax) {
            return true;
          }
        }
      }
      return false;
    }

    // Safe scenery placement with strict road/sidewalk clearance validation
    function addScenerySafe(obj, x, z, clearance = 5.0, isSkyline = false) {
      if (!isSkyline && isRoadOrSidewalk(x, z, clearance)) {
        return false;
      }
      addScenery(obj, x, z, isSkyline);
      return true;
    }

    // Atmospheric Distance Fog: gives distant skyline depth, softens distant horizon into natural blur
    if (scene) {
      scene.fog = new THREE.FogExp2(0xa6b8c7, 0.0022);
    }

    // ── 1. Render Connected Road Network (5 Legs) ───────────────────────────
    // Drivable road planes and sidewalk bases stay in group (root) so road never pops
    roads.forEach((r, rIdx) => {
      const isV = r.type === 'v';
      const w = r.width || 14;
      const len = isV ? Math.abs(r.z2 - r.z1) : Math.abs(r.x2 - r.x1);
      const cx = isV ? r.x : (r.x1 + r.x2) / 2;
      const cz = isV ? (r.z1 + r.z2) / 2 : r.z;

      // Asphalt Road Surface
      const roadGeo = isV ? new THREE.PlaneGeometry(w, len) : new THREE.PlaneGeometry(len, w);
      const roadMesh = new THREE.Mesh(roadGeo, mats.mRoad);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(cx, 0.01, cz);
      roadMesh.receiveShadow = true;
      group.add(roadMesh);
      if (game.world) {game.world.push(roadMesh);}

      // Lane Markings & Medians
      if (isV) {
        if (r.lanes === 4) {
          // SV Avenue: Center Median with flowering hedges & street lamps
          const medianW = 1.2;
          const medianMesh = new THREE.Mesh(new THREE.BoxGeometry(medianW, 0.22, len), mats.mSidewalk);
          medianMesh.position.set(cx, 0.11, cz);
          group.add(medianMesh);

          // Median hedges & double streetlights
          for (let mz = -len / 2 + 20; mz < len / 2 - 20; mz += 35) {
            const hedgeM = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 12), mats.mHedge);
            hedgeM.position.set(cx, 0.35, cz + mz);
            addScenery(hedgeM, cx, cz + mz);

            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8), mats.mTrashMetal);
            pole.position.set(cx, 3.75, cz + mz + 15);
            addScenery(pole, cx, cz + mz + 15);

            [-1.8, 1.8].forEach(lx => {
              const arm = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(lx), 0.1, 0.1), mats.mTrashMetal);
              arm.position.set(cx + lx / 2, 7.2, cz + mz + 15);
              addScenery(arm, cx, cz + mz + 15);
              const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.4), mGoldEmissive);
              lamp.position.set(cx + lx, 7.1, cz + mz + 15);
              addScenery(lamp, cx, cz + mz + 15);
            });
          }

          // Dashed lane divider lines
          [-w / 4, w / 4].forEach(offX => {
            const numDashes = Math.floor(len / 6);
            for (let i = 0; i < numDashes; i++) {
              const dashZ = -len / 2 + i * 6 + 1.5;
              const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3.0), mats.mCenterLine);
              dash.rotation.x = -Math.PI / 2;
              dash.position.set(cx + offX, 0.02, cz + dashZ);
              group.add(dash);
            }
          });
        } else {
          // 2-Lane Center Dashes
          const numDashes = Math.floor(len / 5.6);
          for (let i = 0; i < numDashes; i++) {
            const dashZ = -len / 2 + i * 5.6 + 1.5;
            const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 3.2), mats.mCenterLine);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(cx, 0.02, cz + dashZ);
            group.add(dash);
          }
        }

        // Sidewalks on left & right with tactile blister paving & street lamps
        [-1, 1].forEach(side => {
          const swX = cx + side * (w / 2 + sidewalkWidth / 2);
          const swMesh = new THREE.Mesh(new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, len), mats.mSidewalk);
          swMesh.position.set(swX, sidewalkHeight / 2, cz);
          swMesh.receiveShadow = true;
          group.add(swMesh);
          if (game.world) {game.world.push(swMesh);}

          // Yellow Tactile Blister Paving Strip along Curb Edge
          const tactile = new THREE.Mesh(new THREE.PlaneGeometry(0.35, len), mTactileYellow);
          tactile.rotation.x = -Math.PI / 2;
          tactile.position.set(cx + side * (w / 2 + 0.35), sidewalkHeight + 0.005, cz);
          group.add(tactile);

          // Alternating Black & Yellow Curb Stones
          const curbCount = Math.floor(len / 2.0);
          for (let c = 0; c < curbCount; c++) {
            const curbZ = -len / 2 + c * 2.0 + 1.0;
            const curbMat = (c % 2 === 0) ? mCurbBlack : mCurbYellow;
            const curbStone = new THREE.Mesh(new THREE.BoxGeometry(0.24, sidewalkHeight + 0.04, 1.95), curbMat);
            curbStone.position.set(cx + side * (w / 2 + 0.12), (sidewalkHeight + 0.04) / 2, cz + curbZ);
            group.add(curbStone);
          }

          // Mumbai BMC Street Lamps along Sidewalk every 45m
          for (let lz = -len / 2 + 25; lz < len / 2 - 20; lz += 45) {
            const lamp = buildMumbaiStreetLamp();
            lamp.position.set(cx + side * (w / 2 + 1.2), 0.16, cz + lz);
            lamp.rotation.y = (side > 0) ? -Math.PI / 2 : Math.PI / 2;
            addScenery(lamp, cx + side * (w / 2 + 1.2), cz + lz);
          }
        });
      } else {
        // Horizontal Road (Leg 2 & Leg 4)
        const numDashes = Math.floor(len / 5.6);
        for (let i = 0; i < numDashes; i++) {
          const dashX = -len / 2 + i * 5.6 + 1.5;
          const dash = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.24), mats.mCenterLine);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(cx + dashX, 0.02, cz);
          group.add(dash);
        }

        [-1, 1].forEach(side => {
          const swZ = cz + side * (w / 2 + sidewalkWidth / 2);
          const swMesh = new THREE.Mesh(new THREE.BoxGeometry(len, sidewalkHeight, sidewalkWidth), mats.mSidewalk);
          swMesh.position.set(cx, sidewalkHeight / 2, swZ);
          swMesh.receiveShadow = true;
          group.add(swMesh);
          if (game.world) {game.world.push(swMesh);}

          // Yellow Tactile Blister Paving Strip along Curb Edge
          const tactile = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.35), mTactileYellow);
          tactile.rotation.x = -Math.PI / 2;
          tactile.position.set(cx, sidewalkHeight + 0.005, cz + side * (w / 2 + 0.35));
          group.add(tactile);

          const curbCount = Math.floor(len / 2.0);
          for (let c = 0; c < curbCount; c++) {
            const curbX = -len / 2 + c * 2.0 + 1.0;
            const curbMat = (c % 2 === 0) ? mCurbBlack : mCurbYellow;
            const curbStone = new THREE.Mesh(new THREE.BoxGeometry(1.95, sidewalkHeight + 0.04, 0.24), curbMat);
            curbStone.position.set(cx + curbX, (sidewalkHeight + 0.04) / 2, cz + side * (w / 2 + 0.12));
            group.add(curbStone);
          }

          // Mumbai BMC Street Lamps along Sidewalk every 45m
          for (let lx = -len / 2 + 25; lx < len / 2 - 20; lx += 45) {
            const lamp = buildMumbaiStreetLamp();
            lamp.position.set(cx + lx, 0.16, cz + side * (w / 2 + 1.2));
            lamp.rotation.y = (side > 0) ? 0 : Math.PI;
            addScenery(lamp, cx + lx, cz + side * (w / 2 + 1.2));
          }
        });
      }
    });

    // ── 2. Intersections & 90° Turn Junctions ────────────────────────────────
    const junctions = [
      { x: 0, z: -120, name: 'Turn 1: Tilak Bazar Corner Turn', sign: '↱ TILAK BAZAR MARG' },
      { x: 220, z: -120, name: 'Turn 2: Shivaji Chowk / SV Avenue', sign: '↰ S.V. ROAD 4-LANE' },
      { x: 220, z: 260, name: 'Turn 3: Gokhale Link Turn', sign: '↱ GOKHALE SCHOOL LINK' },
      { x: 440, z: 260, name: 'Turn 4: St. Xavier School Blvd Turn', sign: '↰ ST. XAVIER HIGH SCHOOL' }
    ];

    const allIntCoords = (cfg.ints && cfg.ints.length > 0)
      ? cfg.ints
      : junctions.map(j => [j.x, j.z]);

    allIntCoords.forEach(coord => {
      const ix = coord[0], iz = coord[1];
      const juncPad = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), mats.mRoad);
      juncPad.rotation.x = -Math.PI / 2;
      juncPad.position.set(ix, 0.015, iz);
      juncPad.receiveShadow = true;
      group.add(juncPad);
      if (game.world) {game.world.push(juncPad);}
    });

    junctions.forEach(j => {
      // Curved Corner Sidewalk Chamfers
      [-1, 1].forEach(sx => {
        [-1, 1].forEach(sz => {
          const cornerPillar = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, sidewalkHeight, 12), mats.mSidewalk);
          cornerPillar.position.set(j.x + sx * 12.5, sidewalkHeight / 2, j.z + sz * 12.5);
          group.add(cornerPillar);
        });
      });

      // Directional Corner Street Signboard
      const signPost = new THREE.Group();
      const poleM = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), mats.mTrashMetal);
      poleM.position.set(0, 1.6, 0);
      signPost.add(poleM);

      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 0.08), mSignPostGreen);
      signBoard.position.set(0, 2.8, 0);
      signPost.add(signBoard);

      signPost.position.set(j.x + 9.0, 0.16, j.z - 9.0);
      addScenery(signPost, j.x, j.z);
    });

    // ── 3. DISTRICT 1: Shanti Niketan & Nav Prabhat CHS (Leg 1: Z = -340 to -120)
    // A. Player Home Lot & Garage at Z = -300
    const pLotZ = -300;
    const yardW = 32, yardD = 32;
    const yardMesh = new THREE.Mesh(new THREE.BoxGeometry(yardW, 0.14, yardD), mats.mGrass);
    yardMesh.position.set(7 + 3.6 + yardW / 2, 0.07, pLotZ);
    yardMesh.receiveShadow = true;
    addScenery(yardMesh, 24, pLotZ);

    // Driveway leading from garage to road
    const driveW = 5.2, driveL = 18;
    const driveMesh = new THREE.Mesh(new THREE.BoxGeometry(driveL, 0.15, driveW), mats.mStoneDriveway);
    driveMesh.position.set(7 + 3.6 + driveL / 2, 0.075, pLotZ - 5.0);
    addScenery(driveMesh, 20, pLotZ - 5.0);

    // Suburban Cottage on Player Lot
    const house = buildGreenRoofCottage(mats.mWoodBrown, mats.mGreenRoof, mats.mWoodBrown, mats.mWindowGlass, mats.mWindowFrame, mats.mDarkDoor, mats.mWhiteBench);
    house.position.set(7 + 3.6 + 18, 0.15, pLotZ + 6.0);
    house.rotation.y = -Math.PI / 2;
    addScenery(house, 28, pLotZ + 6.0);

    // Garage Structure
    const garage = buildSuburbanGarage(mats.mGarageWall, mats.mRedRoof, mats.mWindowFrame, mats.mGarageFloor, mats.mWoodBrown, true);
    garage.position.set(7 + 3.6 + 14, 0.15, pLotZ - 5.0);
    garage.rotation.y = 0;
    addScenery(garage, 24, pLotZ - 5.0);

    // B. East Side CHS Buildings & Compounds (X = 28)
    // Shanti Niketan CHS Gate & Guard Cabin at Z = -250
    const shantiGate = buildMumbaiCHSGate("SHANTI NIKETAN CO-OP. HOUSING SOCIETY LTD.", {
      mWall: mMumbaiCream,
      mSign: mMumbaiSignBlue,
      mGold: mGoldEmissive,
      mMetal: mats.mTrashMetal,
      mCurbY: mCurbYellow,
      mCurbB: mCurbBlack,
      subText: "REGISTERED • PAREL COLONY"
    });
    shantiGate.position.set(13.0, 0, -250);
    shantiGate.rotation.y = 0;
    addScenery(shantiGate, 13, -250);

    // Shanti Niketan Wing A (4 stories) at Z = -220
    const shantiWingA = buildMumbaiApartmentBuilding({
      stories: 4, width: 24, depth: 16, storyH: 3.4,
      mWall: mMumbaiCream, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
      mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
    });
    shantiWingA.position.set(28, 0, -220);
    shantiWingA.rotation.y = -Math.PI / 2;
    addScenery(shantiWingA, 28, -220);

    // Shanti Niketan Wing B (4 stories) at Z = -180
    const shantiWingB = buildMumbaiApartmentBuilding({
      stories: 4, width: 24, depth: 16, storyH: 3.4,
      mWall: mMumbaiCream, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
      mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
    });
    shantiWingB.position.set(28, 0, -180);
    shantiWingB.rotation.y = -Math.PI / 2;
    addScenery(shantiWingB, 28, -180);

    // Row Cottages at Z = -145
    const cottageEast = buildTimberTwoStoryHouse(mats.mTimberWall, mats.mTimberRoof, mats.mBrickChimney, mats.mWoodBrown, mats.mWindowGlass, mats.mWindowFrame, mats.mRedDoor);
    cottageEast.position.set(26, 0.15, -145);
    cottageEast.rotation.y = -Math.PI / 2;
    addScenery(cottageEast, 26, -145);

    // C. West Side CHS Buildings & Chawls (X = -28)
    // Nav Prabhat CHS Gate at Z = -330
    const navGate = buildMumbaiCHSGate("NAV PRABHAT CO-OP. HSG. SOCIETY LTD.", {
      mWall: mMumbaiChsPlaster,
      mSign: mMumbaiSignBlue,
      mGold: mGoldEmissive,
      mMetal: mats.mTrashMetal,
      mCurbY: mCurbYellow,
      mCurbB: mCurbBlack,
      subText: "ESTD 1974 • PAREL (W)"
    });
    navGate.position.set(-13.0, 0, -330);
    navGate.rotation.y = Math.PI;
    addScenery(navGate, -13, -330);

    // Nav Prabhat 5-Story Apartment Building at Z = -290
    const navBuilding = buildMumbaiApartmentBuilding({
      stories: 5, width: 26, depth: 16, storyH: 3.4,
      mWall: mMumbaiChsPlaster, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
      mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
    });
    navBuilding.position.set(-28, 0, -290);
    navBuilding.rotation.y = Math.PI / 2;
    addScenery(navBuilding, -28, -290);

    // 3-Story Residential Chawl at Z = -255
    const chawlWest1 = buildChawlBuilding({
      stories: 3, width: 22, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    chawlWest1.position.set(-28, 0, -255);
    chawlWest1.rotation.y = Math.PI / 2;
    addScenery(chawlWest1, -28, -255);

    // Residential House at Z = -220
    const cottageWest2 = buildRedCabinHouse(mats.mRedCabin, mats.mRedRoof, mats.mWoodBrown, mats.mWindowGlass, mats.mWindowFrame, mats.mDarkDoor);
    cottageWest2.position.set(-26, 0.15, -220);
    cottageWest2.rotation.y = Math.PI / 2;
    addScenery(cottageWest2, -26, -220);

    // 3-Story Residential Chawl at Z = -185
    const chawlWest2 = buildChawlBuilding({
      stories: 3, width: 22, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    chawlWest2.position.set(-28, 0, -185);
    chawlWest2.rotation.y = Math.PI / 2;
    addScenery(chawlWest2, -28, -185);

    // Row Cottages at Z = -150
    const cottageWest3 = buildGreenRoofCottage(mats.mWoodBrown, mats.mGreenRoof, mats.mWoodBrown, mats.mWindowGlass, mats.mWindowFrame, mats.mDarkDoor, mats.mWhiteBench);
    cottageWest3.position.set(-26, 0.15, -150);
    cottageWest3.rotation.y = Math.PI / 2;
    addScenery(cottageWest3, -26, -150);

    // Verges: Detailed Gulmohar trees with tree grates, street lamps, civic furniture every 28m along Leg 1
    for (let lz = -330; lz <= -130; lz += 28) {
      // Lush Gulmohar Tree + Cast-Iron Tree Grate on Left Sidewalk
      const treeL = buildGulmoharTree(mats.mTreeBark, mGulmoharLeaf, mGulmoharFlower);
      treeL.position.set(-8.8, 0.16, lz);
      addScenery(treeL, -8.8, lz);
      const grateL = buildTreeGrate();
      grateL.position.set(-8.8, 0.0, lz);
      addScenery(grateL, -8.8, lz);

      // Lush Gulmohar Tree + Cast-Iron Tree Grate on Right Sidewalk
      const treeR = buildGulmoharTree(mats.mTreeBark, mGulmoharLeaf, mGulmoharFlower);
      treeR.position.set(8.8, 0.16, lz);
      addScenery(treeR, 8.8, lz);
      const grateR = buildTreeGrate();
      grateR.position.set(8.8, 0.0, lz);
      addScenery(grateR, 8.8, lz);

      // Mumbai BMC Street Lamp with Cantilever Arm over road lane & Road Light Pool
      if (lz % 56 === 0) {
        const lampL = buildMumbaiStreetLamp();
        lampL.position.set(-8.8, 0.16, lz + 14);
        lampL.rotation.y = Math.PI / 2; // Cantilever arm extends East over left lane
        addScenery(lampL, -8.8, lz + 14);
      } else {
        const lampR = buildMumbaiStreetLamp();
        lampR.position.set(8.8, 0.16, lz + 14);
        lampR.rotation.y = -Math.PI / 2; // Cantilever arm extends West over right lane
        addScenery(lampR, 8.8, lz + 14);
      }

      const sc = buildMumbaiParkedScooter();
      sc.position.set(-8.0, 0.16, lz + 8);
      sc.rotation.y = Math.PI / 2;
      addScenery(sc, -8.0, lz + 8);

      const uPole = buildUtilityPoleWithCables(mats.mTrashMetal, mChawlWood);
      uPole.position.set(8.0, 0.16, lz + 18);
      addScenery(uPole, 8.0, lz + 18);
    }

    // Civic Street Furniture along Leg 1
    const bin1 = buildBmcTwinDustbins();
    bin1.position.set(-8.2, 0.16, -270);
    addScenery(bin1, -8.2, -270);

    const bin2 = buildBmcTwinDustbins();
    bin2.position.set(8.2, 0.16, -190);
    addScenery(bin2, 8.2, -190);

    const hydrant1 = buildFireHydrant();
    hydrant1.position.set(-8.2, 0.16, -235);
    addScenery(hydrant1, -8.2, -235);

    const postBox1 = buildIndiaPostLetterbox();
    postBox1.position.set(-8.2, 0.16, -210);
    addScenery(postBox1, -8.2, -210);

    // ── 4. TURN 1 & DISTRICT 2: Tilak Bazar Market Road (X: 0 to 220, Z = -120)
    // A. Apex Corner Buildings at Turn 1 (X = 0, Z = -120)
    // 3-Story Corner Chawl with wraparound verandas at Northwest corner
    const cornerChawlNW = buildChawlBuilding({
      stories: 3, width: 22, depth: 16,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    cornerChawlNW.position.set(-18, 0, -146);
    addScenery(cornerChawlNW, -18, -146);

    // Mahalaxmi Kirana Stores at Southwest corner (X = 18, Z = -138)
    const kiranaStore = buildMahalaxmiKiranaStore({
      mWall: mChawlWall, mBlueTarp: mBlueTarp, mWood: mChawlWood, mTin: mTinRoof
    });
    kiranaStore.position.set(18, 0.16, -138);
    addScenery(kiranaStore, 18, -138);

    // Corner Chai Tapri at (X = 35, Z = -137)
    const chaiTapri = buildChaiTapri({
      mBlueTarp: mBlueTarp, mWood: mChawlWood, mMetal: mats.mTrashMetal, mGold: mGoldEmissive
    });
    chaiTapri.position.set(35, 0.16, -137);
    addScenery(chaiTapri, 35, -137);

    // B. North Side of Tilak Bazar (Z = -146)
    // Sai Krupa Medical Store Chawl at X = 65
    const chawlMed = buildChawlBuilding({
      stories: 3, width: 24, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    chawlMed.position.set(65, 0, -146);
    addScenery(chawlMed, 65, -146);

    // Red BEST Bus Stop Shelter at X = 95
    const busStop = buildBESTBusStop({
      mRed: mBestRed, mTin: mTinRoof, mMetal: mats.mTrashMetal, mGlass: mats.mWindowGlass
    });
    busStop.position.set(95, 0.16, -130.2);
    addScenery(busStop, 95, -130.2);

    // Curbside Auto-Rickshaw Stand at X = 125 in off-street bay
    const autoQueue = buildCurbsideAutoQueue(3, mAutoYellow, mAutoBlack, mats.mWindowGlass);
    autoQueue.position.set(125, 0.16, -136);
    addScenery(autoQueue, 125, -136);

    // Ganesh Bakery Chawl at X = 155
    const chawlBakery = buildChawlBuilding({
      stories: 3, width: 22, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    chawlBakery.position.set(155, 0, -146);
    addScenery(chawlBakery, 155, -146);

    // Suvarna Jyoti CHS 4-Story Building at X = 190
    const suvarnaBldg = buildMumbaiApartmentBuilding({
      stories: 4, width: 24, depth: 16, storyH: 3.4,
      mWall: mMumbaiCream, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
      mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
    });
    suvarnaBldg.position.set(190, 0, -146);
    addScenery(suvarnaBldg, 190, -146);

    // C. South Side of Tilak Bazar (Z = -96)
    // Vegetable Market Chawl at X = 30
    const chawlVeg = buildChawlBuilding({
      stories: 3, width: 22, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    chawlVeg.position.set(30, 0, -96);
    addScenery(chawlVeg, 30, -96);

    // Chawl Row at X = 65
    const chawlSouth2 = buildChawlBuilding({
      stories: 3, width: 24, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    chawlSouth2.position.set(65, 0, -96);
    addScenery(chawlSouth2, 65, -96);

    // Hot Vada Pav Street Food Cart at X = 100
    const vadaPavCart = buildStreetFoodCart(mBlueTarp, mats.mTrashMetal, mChawlWood);
    vadaPavCart.position.set(100, 0.16, -107);
    addScenery(vadaPavCart, 100, -107);

    // Stationery & Dairy Chawl at X = 130
    const chawlStat = buildChawlBuilding({
      stories: 3, width: 22, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    chawlStat.position.set(130, 0, -96);
    addScenery(chawlStat, 130, -96);

    // Samarth Krupa CHS 4-Story Building at X = 165
    const samarthBldg = buildMumbaiApartmentBuilding({
      stories: 4, width: 24, depth: 16, storyH: 3.4,
      mWall: mMumbaiChsPlaster, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
      mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
    });
    samarthBldg.position.set(165, 0, -96);
    addScenery(samarthBldg, 165, -96);

    // Fruit vendor cart at X = 200
    const fruitCart = buildStreetFoodCart(mBlueTarp, mats.mTrashMetal, mChawlWood);
    fruitCart.position.set(200, 0.16, -107);
    addScenery(fruitCart, 200, -107);

    // Overhead utility poles along Tilak Bazar
    for (let px = 15; px <= 205; px += 35) {
      const uPole = buildUtilityPoleWithCables(mats.mTrashMetal, mChawlWood);
      uPole.position.set(px, 0.16, -128);
      addScenery(uPole, px, -128);
    }

    // ── 5. TURN 2 & DISTRICT 3: Swami Vivekananda 4-Lane Avenue (X = 220, Z = -120 to 260)
    // Clear 4-way intersection for smooth turning traffic at Turn 2 (Shivaji Chowk)

    // DENSE High-Rise CHS Towers flanking SV Avenue
    const svTowers = [
      { z: -85, westStories: 5, eastStories: 6 },
      { z: -35, westStories: 7, eastStories: 7 },
      { z: 20, westStories: 6, eastStories: 5 },
      { z: 75, westStories: 8, eastStories: 6 },
      { z: 135, westStories: 6, eastStories: 8 },
      { z: 195, westStories: 5, eastStories: 5 },
      { z: 240, westStories: 4, eastStories: 4 }
    ];

    svTowers.forEach(tw => {
      // West Side High-Rise (X = 186)
      const bldgW = buildMumbaiApartmentBuilding({
        stories: tw.westStories, width: 28, depth: 16, storyH: 3.4,
        mWall: (tw.westStories % 2 === 0) ? mMumbaiCream : mMumbaiChsPlaster,
        mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal, mWood: mChawlWood,
        mSintex: mSintexBlack, mFlower: mGulmoharFlower
      });
      bldgW.position.set(186, 0, tw.z);
      bldgW.rotation.y = Math.PI / 2;
      addScenery(bldgW, 186, tw.z);

      // West boundary wall
      const wallW = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 32), mMumbaiChsPlaster);
      wallW.position.set(220 - 10 - 3.6 - 0.2, 1.1, tw.z);
      addScenery(wallW, 206, tw.z);

      // East Side High-Rise (X = 254)
      const bldgE = buildMumbaiApartmentBuilding({
        stories: tw.eastStories, width: 28, depth: 16, storyH: 3.4,
        mWall: (tw.eastStories % 2 === 0) ? mMumbaiChsPlaster : mMumbaiCream,
        mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal, mWood: mChawlWood,
        mSintex: mSintexBlack, mFlower: mGulmoharFlower
      });
      bldgE.position.set(254, 0, tw.z);
      bldgE.rotation.y = -Math.PI / 2;
      addScenery(bldgE, 254, tw.z);

      // East boundary wall
      const wallE = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 32), mMumbaiCream);
      wallE.position.set(220 + 10 + 3.6 + 0.2, 1.1, tw.z);
      addScenery(wallE, 234, tw.z);

      // Gulmohar tree on curb
      const tree = buildGulmoharTree(mats.mTreeBark, mGulmoharLeaf, mGulmoharFlower);
      tree.position.set(220 + 10 + 1.8, 0.16, tw.z + 14);
      addScenery(tree, 232, tw.z + 14);
    });

    // Advance School Warning Sign on SV Avenue at Z = 230
    const advSchoolSign = buildSilenceZoneSign(mats.mTrashMetal, mBestRed);
    advSchoolSign.position.set(220 + 11.5, 0.16, 230);
    addScenery(advSchoolSign, 232, 230);

    // ── 6. TURN 3 & DISTRICT 4: Gokhale School Link Road (X: 220 to 440, Z = 260)
    // North Side (Z = 235)
    // Saraswati CHS (4 stories) at X = 255
    const saraswatiBldg = buildMumbaiApartmentBuilding({
      stories: 4, width: 24, depth: 16, storyH: 3.4,
      mWall: mMumbaiCream, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
      mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
    });
    saraswatiBldg.position.set(255, 0, 235);
    addScenery(saraswatiBldg, 255, 235);

    // Students Corner Book Depot Chawl at X = 290
    const bookStoreChawl = buildChawlBuilding({
      stories: 3, width: 24, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    bookStoreChawl.position.set(290, 0, 235);
    addScenery(bookStoreChawl, 290, 235);

    // Residential Cottages at X = 330
    const linkCottageN = buildGreenRoofCottage(mats.mWoodBrown, mats.mGreenRoof, mats.mWoodBrown, mats.mWindowGlass, mats.mWindowFrame, mats.mDarkDoor, mats.mWhiteBench);
    linkCottageN.position.set(330, 0.15, 235);
    addScenery(linkCottageN, 330, 235);

    // School Uniform Store Chawl at X = 370
    const uniformChawl = buildChawlBuilding({
      stories: 3, width: 22, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    uniformChawl.position.set(370, 0, 235);
    addScenery(uniformChawl, 370, 235);

    // Silence Zone Signboard at X = 410
    const szSignLink = buildSilenceZoneSign(mats.mTrashMetal, mBestRed);
    szSignLink.position.set(410, 0.16, 252);
    addScenery(szSignLink, 410, 252);

    // South Side (Z = 285)
    // Adarsh CHS (4 stories) at X = 255
    const adarshBldg = buildMumbaiApartmentBuilding({
      stories: 4, width: 24, depth: 16, storyH: 3.4,
      mWall: mMumbaiChsPlaster, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
      mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
    });
    adarshBldg.position.set(255, 0, 285);
    addScenery(adarshBldg, 255, 285);

    // Garland stalls chawl at X = 295
    const garlandChawl = buildChawlBuilding({
      stories: 3, width: 22, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    garlandChawl.position.set(295, 0, 285);
    addScenery(garlandChawl, 295, 285);

    // Row Cottages at X = 335
    const linkCottageS = buildTimberTwoStoryHouse(mats.mTimberWall, mats.mTimberRoof, mats.mBrickChimney, mats.mWoodBrown, mats.mWindowGlass, mats.mWindowFrame, mats.mRedDoor);
    linkCottageS.position.set(335, 0.15, 285);
    addScenery(linkCottageS, 335, 285);

    // Residential House at X = 375
    const linkCottageS2 = buildRedCabinHouse(mats.mRedCabin, mats.mRedRoof, mats.mWoodBrown, mats.mWindowGlass, mats.mWindowFrame, mats.mDarkDoor);
    linkCottageS2.position.set(375, 0.15, 285);
    addScenery(linkCottageS2, 375, 285);

    // Trees & poles along Gokhale link
    for (let gx = 240; gx <= 420; gx += 35) {
      const gTree = buildGulmoharTree(mats.mTreeBark, mGulmoharLeaf, mGulmoharFlower);
      gTree.position.set(gx, 0.16, 251);
      addScenery(gTree, gx, 251);

      const uPole = buildUtilityPoleWithCables(mats.mTrashMetal, mChawlWood);
      uPole.position.set(gx, 0.16, 269);
      addScenery(uPole, gx, 269);
    }

    // ── 7. TURN 4 & DISTRICT 5: St. Xavier High School Safety Precinct (X = 440, Z = 260 to 640)
    // West Side (X = 428.4): Transparent Heritage Stone Plinth & Wrought-Iron Boundary Railings (Z = 290 to 570)
    // Allows completely unobstructed, transparent panoramic views into the campus, athletic field, quadrangle, and academic buildings!
    const schoolFence = buildStXavierCampusBoundaryRailings(280, {
      mStone: mBasaltStone,
      mIron: mats.mTrashMetal,
      mSign: mMumbaiSignBlue,
      mGold: mGoldEmissive
    });
    schoolFence.position.set(440 - 8 - 3.6, 0, 290);
    addScenery(schoolFence, 428, 430, true);

    // Active Flashing Amber School Warning Beacon at Z = 380
    const amberBeacon = buildAmberWarningBeacon(mats.mTrashMetal, mSchoolYellow, mGoldEmissive);
    amberBeacon.position.set(440 - 8.8, 0.16, 380);
    addScenery(amberBeacon, 431, 380);

    // Curbside School Bus Bay with 2 Parked Yellow Tata Buses at Z = 460
    const busBay = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 60), mats.mRoad);
    busBay.rotation.x = -Math.PI / 2;
    busBay.position.set(440 - 8 - 2.25, 0.012, 460);
    group.add(busBay);

    const sBus1 = buildMumbaiSchoolBus(mSchoolBusYellow, mSchoolBusStripe, mats.mTrashMetal, mats.mWindowGlass);
    sBus1.position.set(440 - 8 - 2.25, 0.16, 440);
    addScenery(sBus1, 430, 440);

    const sBus2 = buildMumbaiSchoolBus(mSchoolBusYellow, mSchoolBusStripe, mats.mTrashMetal, mats.mWindowGlass);
    sBus2.position.set(440 - 8 - 2.25, 0.16, 480);
    addScenery(sBus2, 430, 480);

    // Tactical Yellow Thermoplastic Markings at Z = 520
    const tacticalMarkings = buildTacticalSchoolMarkings(mSchoolYellow, mats.mCenterLine, 30);
    tacticalMarkings.position.set(440, 0.02, 520);
    group.add(tacticalMarkings);

    // Raised Tabletop Zebra Crosswalk at Z = 540
    const speedTableGeo = new THREE.BoxGeometry(16, 0.12, 6.0);
    const speedTableMesh = new THREE.Mesh(speedTableGeo, mats.mRoad);
    speedTableMesh.position.set(440, 0.06, 540);
    group.add(speedTableMesh);

    // Zebra stripes on speed table
    for (let zx = -6.5; zx <= 6.5; zx += 1.8) {
      const zStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 5.2), mats.mCenterLine);
      zStripe.rotation.x = -Math.PI / 2;
      zStripe.position.set(440 + zx, 0.125, 540);
      group.add(zStripe);
    }

    // Crossing Guard Havaldar Shinde with STOP paddle at Z = 540
    const guardGrp = new THREE.Group();
    guardGrp.name = 'CrossingGuardShinde';
    const gBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.4, 8), mSchoolYellow);
    gBody.position.set(0, 0.85, 0);
    guardGrp.add(gBody);
    const gHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), mats.mSteppingStone);
    gHead.position.set(0, 1.7, 0);
    guardGrp.add(gHead);
    const gCap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.12, 8), mMumbaiSignBlue);
    gCap.position.set(0, 1.85, 0);
    guardGrp.add(gCap);
    const stopSignGrp = new THREE.Group();
    const signHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), mats.mWoodBrown);
    signHandle.position.set(0, 0.9, 0);
    stopSignGrp.add(signHandle);
    const redOctagon = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 8), mBestRed);
    redOctagon.rotation.x = Math.PI / 2;
    redOctagon.position.set(0, 1.8, 0);
    stopSignGrp.add(redOctagon);
    stopSignGrp.position.set(0.6, 0.6, 0.3);
    guardGrp.add(stopSignGrp);

    guardGrp.position.set(440 - 6.5, 0.12, 540);
    guardGrp.rotation.y = Math.PI / 2;
    addScenery(guardGrp, 433, 540);

    // Uniformed St. Xavier School Children safely crossing zebra
    const crossingStudents = [
      { x: 440 + 2.5, z: 540 - 0.6, col: 0x0984e3 }, // Navy Blue uniform
      { x: 440 - 0.5, z: 540 + 0.4, col: 0xffffff }, // White uniform shirt
      { x: 440 - 3.2, z: 540 - 0.3, col: 0x0984e3 }
    ];
    crossingStudents.forEach(sp => {
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
      student.position.set(sp.x, 0.12, sp.z);
      student.rotation.y = Math.PI / 2;
      group.add(student);
    });

    // Monumental St. Xavier Heritage Basalt Stone Arch Gate at Z = 580
    const xavierArch = buildStXavierHeritageArch({
      mStone: mBasaltStone,
      mGold: mGoldEmissive,
      mMetal: mats.mTrashMetal
    });
    xavierArch.position.set(440 - 8 - 3.6, 0, 580);
    xavierArch.rotation.y = Math.PI / 2;
    addScenery(xavierArch, 428, 580, true);

    // Waiting students and parents near dismissal gate (Z = 580 to 610)
    for (let st = 0; st < 6; st++) {
      const stu = new THREE.Group();
      const sB = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.9, 8), new THREE.MeshLambertMaterial({ color: st % 2 === 0 ? 0x0984e3 : 0xffffff }));
      sB.position.y = 0.65;
      stu.add(sB);
      const sH = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mats.mSteppingStone);
      sH.position.y = 1.25;
      stu.add(sH);
      const bp = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.16), new THREE.MeshLambertMaterial({ color: st % 2 === 0 ? 0xd63031 : 0x0984e3 }));
      bp.position.set(0, 0.68, -0.16);
      stu.add(bp);
      stu.position.set(440 - 8 - 1.6 - (st % 2) * 1.2, 0.16, 582 + st * 4.2);
      stu.rotation.y = Math.random() * Math.PI * 2;
      addScenery(stu, 430, 590);
    }

    // East Side of School Boulevard (X = 465): Dense Residential Homes & Shops
    for (let rz = 300; rz <= 620; rz += 36) {
      const isApt = (rz % 72 === 0);
      if (isApt) {
        const eastApt = buildMumbaiApartmentBuilding({
          stories: 4, width: 24, depth: 16, storyH: 3.4,
          mWall: mMumbaiCream, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
          mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
        });
        eastApt.position.set(465, 0, rz);
        eastApt.rotation.y = -Math.PI / 2;
        addScenery(eastApt, 465, rz);
      } else {
        const eastChawl = buildChawlBuilding({
          stories: 3, width: 22, depth: 14,
          mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
        });
        eastChawl.position.set(465, 0, rz);
        eastChawl.rotation.y = -Math.PI / 2;
        addScenery(eastChawl, 465, rz);
      }

      const eTree = buildGulmoharTree(mats.mTreeBark, mGulmoharLeaf, mGulmoharFlower);
      eTree.position.set(440 + 8 + 1.8, 0.16, rz + 16);
      addScenery(eTree, 450, rz + 16);
    }

    
    // ── COMPLETE MUMBAI URBAN INFILL (ALL 5 SECTORS) ──
    // Shared builder options bundles
    const mandirOpts = {
      mWall: mMumbaiCream, mGold: mGoldEmissive, mBestRed: mBestRed,
      mWood: mChawlWood, mFlowerYellow: mGoldEmissive, mFlowerOrange: mGulmoharFlower
    };
    const cricketOpts = {
      mGrass: mats.mGrass, mFence: mats.mTrashMetal, mWood: mChawlWood, mWall: mMumbaiChsPlaster
    };
    const academicOpts = {
      mStone: mBasaltStone, mGold: mGoldEmissive, mFence: mats.mTrashMetal, mFlowerOrange: mGulmoharFlower
    };
    const skylineOpts = {
      mWall: mMumbaiCream, mStone: mBasaltStone, mSintex: mSintexBlack, mFence: mats.mTrashMetal
    };
    const boundaryWallOpts = {
      mWall: mMumbaiChsPlaster, mMetal: mats.mTrashMetal
    };
    const shedOpts = {
      mFence: mats.mTrashMetal, mTin: mTinRoof, mWall: mMumbaiChsPlaster
    };
    const gardenOpts = {
      mGrass: mats.mGrass, mWall: mMumbaiCream, mFence: mats.mTrashMetal, mBestRed: mBestRed
    };
    const metroOpts = {
      mPier: new THREE.MeshLambertMaterial({ color: 0x95a5a6, roughness: 0.9 }),
      mDeck: new THREE.MeshLambertMaterial({ color: 0x7f8c8d, roughness: 0.85 }),
      mTrack: mats.mTrashMetal,
      mTrainBody: new THREE.MeshLambertMaterial({ color: 0xecf0f1, roughness: 0.4 }),
      mTrainStripe: new THREE.MeshLambertMaterial({ color: 0x0984e3, roughness: 0.5 }),
      mTrainGlass: mats.mWindowGlass,
      mPantograph: mats.mTrashMetal
    };
    const railOpts = {
      mBallast: new THREE.MeshLambertMaterial({ color: 0x4a4a4a, roughness: 0.95 }),
      mSleepers: new THREE.MeshLambertMaterial({ color: 0x6d4c41, roughness: 0.9 }),
      mRails: new THREE.MeshLambertMaterial({ color: 0x718093, roughness: 0.4, metalness: 0.5 }),
      mLocalBody: new THREE.MeshLambertMaterial({ color: 0x8b0000, roughness: 0.5 }),
      mLocalCream: new THREE.MeshLambertMaterial({ color: 0xf5f6fa, roughness: 0.6 }),
      mLocalRoof: new THREE.MeshLambertMaterial({ color: 0x718093, roughness: 0.6 }),
      mCatenary: mats.mTrashMetal
    };
    const publicParkOpts = {
      mGrass: mats.mGrass,
      mPaving: mats.mFlagstonePaver,
      mFountainStone: new THREE.MeshLambertMaterial({ color: 0xdcdde1, roughness: 0.7 }),
      mWater: new THREE.MeshLambertMaterial({ color: 0x00cec9, roughness: 0.2, transparent: true, opacity: 0.85 }),
      mGazeboRoof: new THREE.MeshLambertMaterial({ color: 0x9b2226, roughness: 0.6 }),
      mGazeboPillar: new THREE.MeshLambertMaterial({ color: 0xf5f6fa, roughness: 0.8 }),
      mFlowerYellow: mGoldEmissive,
      mFlowerRed: mBestRed,
      mTreeBark: mats.mTreeBark,
      mLeaf: mGulmoharLeaf
    };
    const skyscraperOpts = {
      mWall: mMumbaiCream,
      mGlass: mats.mWindowGlass,
      mMetal: mats.mTrashMetal,
      mSintex: mSintexBlack
    };
    const skyscraperPlasterOpts = {
      mWall: mMumbaiChsPlaster,
      mGlass: mats.mWindowGlass,
      mMetal: mats.mTrashMetal,
      mSintex: mSintexBlack
    };

    // ── SECTOR 1: WEST OF LEG 1 (DENSE URBAN INFILL: X = -165 to -35, Z = -340 to -130) ──
    // Row 1 (X = -65): Continuous 5-6 Story CHS Apartments & Chawls with 3-4m Gullies
    [-320, -285, -250, -215, -180, -145].forEach((bz, bIdx) => {
      const isCream = bIdx % 2 === 0;
      const bldg = (bIdx === 5)
        ? buildChawlBuilding({ stories: 3, width: 26, depth: 14, mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass })
        : buildMumbaiApartmentBuilding({
            stories: isCream ? 6 : 5, width: 26, depth: 16, storyH: 3.4,
            mWall: isCream ? mMumbaiCream : mMumbaiChsPlaster,
            mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
            mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
          });
      bldg.position.set(-65, 0, bz);
      bldg.rotation.y = Math.PI / 2;
      addScenery(bldg, -65, bz);
    });

    // Row 2 (X = -110): Mid-Block CHS Societies & Chawl Enclaves
    [-320, -285, -250, -215, -180, -145].forEach((bz, bIdx) => {
      const isPlaster = bIdx % 2 !== 0;
      const bldg = (bIdx === 4 || bIdx === 5)
        ? buildChawlBuilding({ stories: 3, width: 26, depth: 14, mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass })
        : buildMumbaiApartmentBuilding({
            stories: isPlaster ? 6 : 5, width: 26, depth: 16, storyH: 3.4,
            mWall: isPlaster ? mMumbaiChsPlaster : mMumbaiCream,
            mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
            mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
          });
      bldg.position.set(-110, 0, bz);
      bldg.rotation.y = Math.PI / 2;
      addScenery(bldg, -110, bz);
    });

    // Row 3 (X = -155): Continuous Western Boundary High-Rise Towers (10-12 Stories)
    [-320, -270, -220, -170, -135].forEach((bz, bIdx) => {
      const stories = 10 + (bIdx % 3);
      const skyBldg = buildDistantSkylineBlock(stories, 34, 22, skylineOpts);
      skyBldg.position.set(-155, 0, bz);
      addScenery(skyBldg, -155, bz);
    });

    // Western Sector Perimeter Compound Boundary Walls
    const wallNorthW = buildSocietyBoundaryWall(135, boundaryWallOpts);
    wallNorthW.position.set(-155, 0, -340);
    wallNorthW.rotation.y = Math.PI / 2; // Extends along Z = -340 from X = -155 to -20
    addScenery(wallNorthW, -90, -340);

    const wallWestEdge = buildSocietyBoundaryWall(210, boundaryWallOpts);
    wallWestEdge.position.set(-160, 0, -340); // Extends along X = -160 from Z = -340 to -130
    addScenery(wallWestEdge, -160, -235);

    // ── SECTOR 1: EAST OF LEG 1 (DENSE URBAN INFILL: X = 35 to 195, Z = -340 to -130) ──
    // Row 1 (X = 62): Continuous CHS Societies behind Home Lot
    [-320, -280, -240, -200, -160].forEach((bz, bIdx) => {
      const isCream = bIdx % 2 === 0;
      const bldg = (bIdx === 4)
        ? buildChawlBuilding({ stories: 3, width: 26, depth: 14, mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass })
        : buildMumbaiApartmentBuilding({
            stories: isCream ? 6 : 5, width: 26, depth: 16, storyH: 3.4,
            mWall: isCream ? mMumbaiCream : mMumbaiChsPlaster,
            mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
            mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
          });
      bldg.position.set(62, 0, bz);
      bldg.rotation.y = -Math.PI / 2;
      addScenery(bldg, 62, bz);
    });

    // Row 2 (X = 110): Dense Secondary CHS Row
    [-320, -280, -240, -200, -160].forEach((bz, bIdx) => {
      const isPlaster = bIdx % 2 !== 0;
      const bldg = buildMumbaiApartmentBuilding({
        stories: isPlaster ? 6 : 5, width: 26, depth: 16, storyH: 3.4,
        mWall: isPlaster ? mMumbaiChsPlaster : mMumbaiCream,
        mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
        mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
      });
      bldg.position.set(110, 0, bz);
      bldg.rotation.y = -Math.PI / 2;
      addScenery(bldg, 110, bz);
    });

    // Row 3 (X = 165): Continuous Eastern Skyline Towers (10-12 Stories)
    [-315, -265, -215, -165].forEach((bz, bIdx) => {
      const stories = 10 + (bIdx % 3);
      const skyBldg = buildDistantSkylineBlock(stories, 34, 22, skylineOpts);
      skyBldg.position.set(165, 0, bz);
      addScenery(skyBldg, 165, bz);
    });

    // Eastern Sector Perimeter Compound Boundary Walls
    const wallNorthE = buildSocietyBoundaryWall(170, boundaryWallOpts);
    wallNorthE.position.set(30, 0, -340);
    wallNorthE.rotation.y = Math.PI / 2; // Extends along Z = -340 from X = 30 to 200
    addScenery(wallNorthE, 115, -340);

    const wallEastEdge = buildSocietyBoundaryWall(210, boundaryWallOpts);
    wallEastEdge.position.set(200, 0, -340); // Extends along X = 200 from Z = -340 to -130
    addScenery(wallEastEdge, 200, -235);

    // ── SECTOR 2: GRAND CENTRAL CITY DISTRICT (X = 35 to 190, Z = -100 to 240)
    // A. Roadside Ganesh Mandir near Tilak Bazar
    const centralMandir = buildRoadsideMandir(mandirOpts);
    centralMandir.position.set(62, 0.16, -72);
    centralMandir.rotation.y = -Math.PI / 2;
    addScenery(centralMandir, 62, -72);

    // Parel Central CHS Tower A (6 Stories)
    const parelTowerA = buildMumbaiApartmentBuilding({
      stories: 6, width: 28, depth: 16, storyH: 3.4,
      mWall: mMumbaiCream, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
      mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
    });
    parelTowerA.position.set(115, 0, -65);
    addScenery(parelTowerA, 115, -65);

    // Parel Central CHS Tower B (6 Stories)
    const parelTowerB = buildMumbaiApartmentBuilding({
      stories: 6, width: 28, depth: 16, storyH: 3.4,
      mWall: mMumbaiChsPlaster, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
      mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
    });
    parelTowerB.position.set(165, 0, -65);
    addScenery(parelTowerB, 165, -65);

    // Secondary Chawl & Wholesale Grocery Sheds
    const centralChawl1 = buildChawlBuilding({
      stories: 3, width: 24, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    centralChawl1.position.set(115, 0, -20);
    addScenery(centralChawl1, 115, -20);

    const centralChawl2 = buildChawlBuilding({
      stories: 3, width: 24, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    centralChawl2.position.set(165, 0, -20);
    addScenery(centralChawl2, 165, -20);

    // B. The Colony Cricket Ground (Maidan) at X = 110, Z = 0
    const cricketGround = buildColonyCricketGround(76, 68, cricketOpts);
    cricketGround.position.set(110, 0, 0);
    addScenerySafe(cricketGround, 110, 0, 8.0);

    // Perimeter Trees around Cricket Ground
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const bx = 110 + Math.cos(angle) * 42;
      const bz = 0 + Math.sin(angle) * 36;
      const mTree = buildGulmoharTree(mats.mTreeBark, mGulmoharLeaf, mGulmoharFlower);
      mTree.position.set(bx, 0.16, bz);
      addScenerySafe(mTree, bx, bz, 3.0);
    }

    // C. Grand Central Public City Park & Botanical Garden at X = 110, Z = 165
    const publicCityPark = buildPublicCityPark(106, 106, publicParkOpts);
    publicCityPark.position.set(110, 0, 165);
    addScenerySafe(publicCityPark, 110, 165, 8.0);

    // D. Saraswati CHS North Cluster (Towers 1, 2)
    const saraswatiTower1 = buildMumbaiApartmentBuilding({
      stories: 7, width: 28, depth: 16, storyH: 3.4,
      mWall: mMumbaiCream, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
      mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
    });
    saraswatiTower1.position.set(45, 0, 205);
    addScenerySafe(saraswatiTower1, 45, 205, 12.0);

    const saraswatiTower2 = buildMumbaiApartmentBuilding({
      stories: 8, width: 28, depth: 16, storyH: 3.4,
      mWall: mMumbaiChsPlaster, mGlass: mats.mWindowGlass, mMetal: mats.mTrashMetal,
      mWood: mChawlWood, mSintex: mSintexBlack, mFlower: mGulmoharFlower
    });
    saraswatiTower2.position.set(175, 0, 205);
    addScenerySafe(saraswatiTower2, 175, 205, 12.0);

    // Central Scooter Parking Shed
    const centralShed = buildCoveredScooterShed(22, shedOpts);
    centralShed.position.set(110, 0.16, 226);
    addScenerySafe(centralShed, 110, 226, 4.0);

    // ── SECTOR 3: MODERN HIGH-RISE SKYSCRAPER & TRANSIT CORRIDOR DISTRICT (X = 260 to 590) ─
    // Directly inspired by the reference aerial photo with rooftop HVAC chillers, fan grilles, Sintex tanks, and antennas
    const modernSkyscrapers = [
      { x: 330, z: -35, stories: 18, width: 34, depth: 26, rot: 0, opts: skyscraperOpts, name: 'The Imperial Heights (18 Stories)' },
      { x: 280, z: -55, stories: 15, width: 28, depth: 22, rot: Math.PI / 2, opts: skyscraperPlasterOpts, name: 'Kohinoor Square Commercial (15 Stories)' },
      { x: 380, z: -55, stories: 16, width: 30, depth: 24, rot: 0, opts: skyscraperOpts, name: 'Peninsula Business Park (16 Stories)' },
      { x: 280, z: 15, stories: 14, width: 28, depth: 22, rot: Math.PI / 2, opts: skyscraperPlasterOpts, name: 'One International Center (14 Stories)' },
      { x: 380, z: 15, stories: 17, width: 32, depth: 26, rot: 0, opts: skyscraperOpts, name: 'Urmi Estate Commercial (17 Stories)' },
      { x: 330, z: 120, stories: 16, width: 30, depth: 24, rot: Math.PI / 2, opts: skyscraperOpts, name: 'World Crest Towers (16 Stories)' },
      { x: 280, z: 180, stories: 14, width: 28, depth: 22, rot: 0, opts: skyscraperPlasterOpts, name: 'Marathon Futurex Hub (14 Stories)' },
      { x: 380, z: 180, stories: 16, width: 32, depth: 24, rot: Math.PI / 2, opts: skyscraperOpts, name: 'Lodha Park Central (16 Stories)' },
      { x: 330, z: 220, stories: 18, width: 34, depth: 26, rot: 0, opts: skyscraperOpts, name: 'Parel Horizon Tower (18 Stories)' }
    ];

    modernSkyscrapers.forEach(sky => {
      const bldg = buildModernHighriseSkyscraper(sky.stories, sky.width, sky.depth, sky.opts);
      bldg.position.set(sky.x, 0, sky.z);
      if (sky.rot) {bldg.rotation.y = sky.rot;}
      addScenerySafe(bldg, sky.x, sky.z, sky.width / 2);

      // Courtyard shade trees around skyscraper plaza
      const tree1 = buildGulmoharTree(mats.mTreeBark, mGulmoharLeaf, mGulmoharFlower);
      tree1.position.set(sky.x + sky.width / 2 + 5, 0.16, sky.z);
      addScenerySafe(tree1, sky.x + sky.width / 2 + 5, sky.z, 3.0);
    });

    // Elevated Mumbai Metro Viaduct along X = 500 (Z: -340 to 640)
    // Chunked into 60m spatial segments so faraway sections dynamically cull
    for (let mz = -340; mz < 640; mz += 60) {
      const segLen = Math.min(60, 640 - mz);
      const viaductSeg = buildMumbaiMetroViaduct(segLen, { ...metroOpts, withTrain: (mz >= 20 && mz < 80) });
      viaductSeg.position.set(500, 0, mz);
      addScenery(viaductSeg, 500, mz + segLen / 2);
    }

    // Suburban Railway Corridor along X = 570 (Z: -340 to 640)
    // Chunked into 60m spatial segments so faraway sections dynamically cull
    for (let rz = -340; rz < 640; rz += 60) {
      const segLen = Math.min(60, 640 - rz);
      const railSeg = buildSuburbanRailwayCorridor(segLen, { ...railOpts, withTrain: (rz >= 140 && rz < 200) });
      railSeg.position.set(570, 0, rz);
      addScenery(railSeg, 570, rz + segLen / 2);
    }

    // Electrical Substation / Transformer Yard with Safety Mesh at (X = 360, Z = -95)
    const subStation = buildElectricalSubstation(mMumbaiChsPlaster, mats.mTrashMetal, mTinRoof);
    subStation.position.set(360, 0.16, -95);
    addScenery(subStation, 360, -95);

    // ── SECTOR 4: ST. XAVIER CAMPUS & NORTH-EAST (X = 260 to 410, Z = 300 to 660)
    // 1. Main St. Xavier Bombay Gothic Academic Building with 30m Clock Tower & Assembly Quadrangle
    // Positioned at X = 370, Z = 505 facing East directly towards the boulevard at X = 440!
    // Visible directly through the open wrought iron railings and towering high above the street!
    const academicHall = buildSchoolAcademicBuilding({
      mStone: new THREE.MeshLambertMaterial({ color: 0x8b3a2a, roughness: 0.8 }),
      mCream: mMumbaiCream,
      mGold: mGoldEmissive,
      mGlass: mats.mWindowGlass,
      mRoof: new THREE.MeshLambertMaterial({ color: 0x1e293b, roughness: 0.6 }),
      mWood: mChawlWood,
      mFence: mats.mTrashMetal
    });
    academicHall.position.set(370, 0, 505);
    addScenery(academicHall, 370, 505, true); // isSkyline = true so never culled!

    // 2. St. Xavier Athletic Football Pitch, Soccer Goalposts, Running Track & Sports Pavilion
    // Placed at X = 370, Z = 365, directly visible through the railings from Turn 4 towards zebra crossing!
    const sportsComplex = buildStXavierSportsComplex({
      mGrass: mats.mGrass,
      mLine: mats.mCenterLine,
      mTrack: new THREE.MeshLambertMaterial({ color: 0x8b3a2a, roughness: 0.85 }),
      mTin: mTinRoof,
      mBench: mats.mTrashMetal,
      mGold: mGoldEmissive,
      mPost: mats.mSteppingStone
    });
    sportsComplex.position.set(370, 0, 365);
    addScenery(sportsComplex, 370, 365, true); // isSkyline = true

    // 3. St. Xavier North Secondary Wing & Dismissal Gateway (Culmination of Boulevard at Z = 650)
    // Directly in front of the driver's windshield as they approach the finish checkpoint at Z = 610!
    const northSchoolBlock = buildStXavierNorthDismissalBlock({
      mStone: new THREE.MeshLambertMaterial({ color: 0x8b3a2a, roughness: 0.8 }),
      mCream: mMumbaiCream,
      mRoof: new THREE.MeshLambertMaterial({ color: 0x1e293b, roughness: 0.6 }),
      mGlass: mats.mWindowGlass,
      mGold: mGoldEmissive,
      mMetal: mats.mTrashMetal
    });
    northSchoolBlock.position.set(440, 0, 650);
    addScenery(northSchoolBlock, 440, 650, true); // isSkyline = true

    // North Residential Enclave along Gokhale Link (North of Leg 4, Z = 295 to 350)
    const northChawl1 = buildChawlBuilding({
      stories: 3, width: 24, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    northChawl1.position.set(245, 0, 310);
    addScenery(northChawl1, 245, 310);

    const northChawl2 = buildChawlBuilding({
      stories: 3, width: 24, depth: 14,
      mWall: mChawlWall, mWood: mChawlWood, mTin: mTinRoof, mGlass: mats.mWindowGlass
    });
    northChawl2.position.set(285, 0, 310);
    addScenery(northChawl2, 285, 310);

    // ── SECTOR 5: 360° DISTANT HORIZON SKYLINE (ALWAYS VISIBLE) ──────────────
    // Western Horizon (X = -230)
    [-340, -220, -100, 20].forEach(hz => {
      const skyW = buildDistantSkylineBlock(14, 38, 22, skylineOpts);
      skyW.position.set(-230, 0, hz);
      addScenery(skyW, -230, hz, true);
    });

    // Southern Horizon (Z = -430)
    [-50, 50, 150, 250].forEach(hx => {
      const skyS = buildDistantSkylineBlock(14, 38, 22, skylineOpts);
      skyS.position.set(hx, 0, -430);
      skyS.rotation.y = Math.PI / 2;
      addScenery(skyS, hx, -430, true);
    });

    // Northern Horizon (Z = 690)
    [100, 220, 340, 460].forEach(hx => {
      const skyN = buildDistantSkylineBlock(15, 38, 22, skylineOpts);
      skyN.position.set(hx, 0, 690);
      skyN.rotation.y = Math.PI / 2;
      addScenery(skyN, hx, 690, true);
    });

    // Eastern Horizon (X = 525)
    [300, 400, 500, 600, -50].forEach(hz => {
      const skyE = buildDistantSkylineBlock(14, 38, 22, skylineOpts);
      skyE.position.set(525, 0, hz);
      addScenery(skyE, 525, hz, true);
    });


    // ── MASSIVE MUMBAI STREET CLUTTER & VENDORS ──
    // Options bundles for new street life builders
    const cartOpts = {
      mWood: mChawlWood, mMetal: mats.mTrashMetal, mStripe: mBestRed, mCurbB: mCurbBlack
    };
    const palmOpts = {
      mBark: mPalmBark, mFrond: mPalmFrond, mCoconut: mCoconutGreen
    };
    const pipeOpts = {
      mBlue: mBmcBlue, mSteel: mats.mTrashMetal, mRed: mBestRed
    };
    const bmcBinOpts = {
      mGreen: mBmcGreen, mBlue: mBmcBlue, mSteel: mats.mTrashMetal
    };

    // A. Curbside Vada Pav & Sugarcane Carts in Tilak Bazar & Chowk
    const vadaPav1 = buildVadaPavCart(cartOpts);
    vadaPav1.position.set(50, 0.16, -114);
    addScenery(vadaPav1, 50, -114);

    const vadaPav2 = buildVadaPavCart(cartOpts);
    vadaPav2.position.set(175, 0.16, -114);
    addScenery(vadaPav2, 175, -114);

    const gannaStall = buildVadaPavCart(cartOpts);
    gannaStall.position.set(215, 0.16, -135);
    gannaStall.rotation.y = Math.PI / 2;
    addScenery(gannaStall, 215, -135);

    // B. Commercial Billboard Hoardings along SV Avenue (Leg 3)
    const hoardingPolice = buildCommercialHoarding(16, 5, "MUMBAI POLICE", "HELMET PEHANO", {
      mTruss: mats.mTrashMetal, mBoard: mHoardingBlue, mGold: mGoldEmissive
    });
    hoardingPolice.position.set(248, 0, -20);
    hoardingPolice.rotation.y = -Math.PI / 2;
    addScenery(hoardingPolice, 248, -20);

    const hoardingAmul = buildCommercialHoarding(18, 5.5, "AMUL", "TASTE OF INDIA", {
      mTruss: mats.mTrashMetal, mBoard: mHoardingRed, mGold: mGoldEmissive
    });
    hoardingAmul.position.set(248, 0, 110);
    hoardingAmul.rotation.y = -Math.PI / 2;
    addScenery(hoardingAmul, 248, 110);

    // C. Curbside BMC Municipal Water Pipeline along SV Avenue (West Curb, X = 205.5)
    const bmcPipeSV = buildBmcWaterPipeline(340, pipeOpts);
    bmcPipeSV.position.set(205.5, 0, -100);
    addScenery(bmcPipeSV, 205.5, 70);

    // D. Tropical Coconut Palms along societies, median, and school grounds
    const palmCoords = [
      { x: 30, z: -280 }, { x: 30, z: -240 }, { x: -35, z: -280 }, { x: -35, z: -220 },
      { x: 75, z: -105 }, { x: 140, z: -105 }, { x: 236, z: -40 }, { x: 236, z: 40 },
      { x: 236, z: 120 }, { x: 236, z: 200 }, { x: 425, z: 320 }, { x: 425, z: 400 },
      { x: 425, z: 520 }, { x: 455, z: 360 }, { x: 455, z: 480 }
    ];
    palmCoords.forEach(pt => {
      const palm = buildCoconutPalmTree(8.5, palmOpts);
      palm.position.set(pt.x, 0.16, pt.z);
      addScenery(palm, pt.x, pt.z);
    });

    // E. Segregated BMC Municipal Dustbins (Green & Blue) every 50m
    const binCoords = [
      { x: 11, z: -270 }, { x: 11, z: -210 }, { x: 11, z: -160 },
      { x: 40, z: -128 }, { x: 110, z: -128 }, { x: 175, z: -128 },
      { x: 233, z: -70 }, { x: 233, z: 30 }, { x: 233, z: 130 }, { x: 233, z: 210 },
      { x: 260, z: 253 }, { x: 340, z: 253 }, { x: 400, z: 253 },
      { x: 449, z: 350 }, { x: 449, z: 450 }, { x: 449, z: 530 }
    ];
    binCoords.forEach(bp => {
      const bins = buildBmcMunicipalBins(bmcBinOpts);
      bins.position.set(bp.x, 0.16, bp.z);
      addScenery(bins, bp.x, bp.z);
    });

    // F. School Zone Overhead Gantries & Approach Signs (Level 5 Mission Focus)
    const schoolGantryOpts = {
      mMetal: mats.mTrashMetal,
      mYellow: mSchoolYellow,
      mEmissive: mGoldEmissive,
      mFooting: mats.mSidewalk
    };

    // Gantry 1 at Turn 3 (SV Avenue entrance to Gokhale School Link Road, X = 238, Z = 260)
    const gantry1 = buildSchoolOverheadGantry(18, schoolGantryOpts);
    gantry1.position.set(238, 0, 260);
    gantry1.rotation.y = -Math.PI / 2; // Face driver approaching from SV Avenue
    addScenery(gantry1, 238, 260);

    // Gantry 2 at Turn 4 (Entrance to St. Xavier School Boulevard, X = 440, Z = 280)
    const gantry2 = buildSchoolOverheadGantry(18, schoolGantryOpts);
    gantry2.position.set(440, 0, 280);
    gantry2.rotation.y = Math.PI; // Face driver heading north into school boulevard
    addScenery(gantry2, 440, 280);

    // Departure Mission Notice at Shanti Niketan Society Exit (X = 13, Z = -220)
    const departureNotice = buildCommercialHoarding(10, 3.8, "ST. XAVIER HIGH SCHOOL", "DISMISSAL PICKUP IN PROGRESS", {
      mTruss: mats.mTrashMetal, mBoard: mSchoolYellow, mGold: mGoldEmissive
    });
    departureNotice.position.set(13, 0, -220);
    departureNotice.rotation.y = -Math.PI / 2;
    addScenery(departureNotice, 13, -220);

    // Curbside Tata School Buses parked on Gokhale Link waiting for dismissal
    const sBusParked1 = buildMumbaiSchoolBus(mSchoolBusYellow, mSchoolBusStripe, mats.mTrashMetal, mats.mWindowGlass);
    sBusParked1.position.set(320, 0.16, 271);
    sBusParked1.rotation.y = Math.PI / 2;
    addScenery(sBusParked1, 320, 271);

    const sBusParked2 = buildMumbaiSchoolBus(mSchoolBusYellow, mSchoolBusStripe, mats.mTrashMetal, mats.mWindowGlass);
    sBusParked2.position.set(360, 0.16, 271);
    sBusParked2.rotation.y = Math.PI / 2;
    addScenery(sBusParked2, 360, 271);

// ── 8. Export Player & Vehicle Spawn Data to Game Engine ─────────────────
    const pWalkX = 14.2;
    const pWalkZ = pLotZ + 3.5;
    const vGarageX = 20.5;
    const vGarageZ = pLotZ - 5.0;

    game._garageX = vGarageX;
    game._garageZ = vGarageZ;

    game._suburbanSpawn = {
      lotZ: pLotZ,
      player: {
        x: pWalkX,
        y: 0.16,
        z: pWalkZ,
        rotY: -2.1
      },
      car: {
        x: vGarageX,
        y: 0.16,
        z: vGarageZ,
        rotY: -Math.PI / 2
      },
      garage: {
        x: 7 + 3.6 + 14,
        y: 0.16,
        z: vGarageZ,
        rotY: 0
      }
    };

    // ── 9. Setup Distance Blur, LOD Quality Scaling, and Culling Loop ────────
    // Dynamically tie culling radius to active render distance (default 150m + 25m buffer, clamped 80-180m)
    // Eliminates massive scene overload lag while ensuring no visual popping at view horizon!
    function getDynamicCullRadius() {
      const rd = (game && game.renderDistance) ? game.renderDistance : 150;
      return Math.min(Math.max(80, rd + 25), 180);
    }
    const NEAR_LOD_RADIUS_SQ = 95 * 95;

    function updateCulling(px, pz, isHighAltitude = false) {
      const cullRad = getDynamicCullRadius();
      const cullRadSq = cullRad * cullRad;

      chunkMap.forEach(chunk => {
        if (chunk.userData && (chunk.userData.isSkyline || isHighAltitude)) {
          chunk.visible = true;
          return;
        }
        const dx = chunk.userData.centerX - px;
        const dz = chunk.userData.centerZ - pz;
        const dSq = dx * dx + dz * dz;
        const isNear = dSq <= cullRadSq;
        if (chunk.visible !== isNear) {
          chunk.visible = isNear;
        }

        // Dynamic Level of Detail (LOD) Quality Scaling:
        // When objects are far (> 95m), hide fine micro-props (AC compressor units, rooftop fan grilles, small props)
        // to significantly lower geometric complexity and preserve smooth 60 FPS gameplay!
        if (isNear) {
          const isFullDetail = dSq <= NEAR_LOD_RADIUS_SQ;
          if (chunk.userData.isFullDetail !== isFullDetail) {
            chunk.userData.isFullDetail = isFullDetail;
            chunk.traverse(child => {
              if (child.userData && child.userData.isMicroProp) {
                child.visible = isFullDetail;
              }
            });
          }
        }
      });
    }

    game._updateMumbaiCulling = updateCulling;
    game._mumbaiChunkMap = chunkMap;

    // Initial culling at spawn
    updateCulling(pWalkX, pWalkZ);

    // Active tracking loop (100ms interval, negligible CPU usage)
    game._mumbaiCullTimer = setInterval(() => {
      if (!game.playing) {return;}
      const cam = game.camera;
      const target = (game.inVehicle && game.vehicle) ? game.vehicle : (game.player || game.vehicle);
      const isHighAltitude = !!(cam && cam.position && cam.position.y > 150);
      const px = cam ? cam.position.x : (target ? target.position.x : pWalkX);
      const pz = cam ? cam.position.z : (target ? target.position.z : pWalkZ);
      updateCulling(px, pz, isHighAltitude);
    }, 100);

    console.log('[MumbaiCityScenery] Optimized Mumbai Multi-District map initialized with ' + chunkMap.size + ' spatial chunks.');
  }

function buildMumbaiCHSGate(societyName, opts) {
  const g = new THREE.Group();
  g.name = 'MumbaiCHSGate';
  const { mWall, mSign, mGold, mMetal, mCurbY, mCurbB, subText } = opts;

  // Concrete Gate Pillars: Main Driveway (z = -1.5 to 5.5) + Pedestrian Wicket (z = -4.5 to -1.5)
  [-4.5, -1.5, 5.5].forEach(pz => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.2, 1.4), mWall);
    pillar.position.set(0, 2.1, pz);
    g.add(pillar);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 1.6), mWall);
    cap.position.set(0, 4.3, pz);
    g.add(cap);

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), mGold);
    sphere.position.set(0, 4.7, pz);
    g.add(sphere);
  });

  // Overhead Signboard Beam with Crisp High-Resolution Canvas Lettering
  const signTex = createSocietySignCanvasTexture(societyName, subText || 'CO-OPERATIVE HOUSING SOCIETY LTD.');
  const mSignTextured = signTex
    ? new THREE.MeshLambertMaterial({ map: signTex, roughness: 0.6 })
    : mSign;

  const signBeam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.25, 10.6), mSignTextured);
  signBeam.position.set(0, 4.2, 0.5);
  g.add(signBeam);

  // Security Guard Cabin at side
  const cabin = new THREE.Group();
  cabin.position.set(2.4, 0, 6.8);
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 2.4), mWall);
  cabBody.position.set(0, 1.3, 0);
  cabin.add(cabBody);

  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 2.8), mSign);
  cabRoof.position.set(0, 2.7, 0);
  cabin.add(cabRoof);

  // Cabin window glass
  const cabWin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 1.6), mMetal);
  cabWin.position.set(-1.21, 1.6, 0);
  cabin.add(cabWin);
  g.add(cabin);

  // Motorized Boom Barrier ONLY over vehicle roadway (z = -1.2 to 4.8)
  const barrierPivot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.1, 8), mCurbB);
  barrierPivot.position.set(0.8, 0.55, 4.6);
  g.add(barrierPivot);

  const armLen = 4.4;
  const barrierArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, armLen), mCurbY);
  barrierArm.position.set(0.8, 0.95, 4.6 - armLen / 2);
  g.add(barrierArm);

  for (let s = 0; s < armLen; s += 0.8) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.19, 0.35), mCurbB);
    stripe.position.set(0.8, 0.95, 4.6 - s - 0.2);
    g.add(stripe);
  }

  // Pedestrian Wicket Gate Arch (z = -4.5 to -1.5): Completely Open & Clear for Walking!
  const wicketArch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 2.8), mMetal);
  wicketArch.position.set(0, 3.2, -3.0);
  g.add(wicketArch);

  return g;
}

// ── 2. buildMumbaiApartmentBuilding ─────────────────────────────────────────
function buildMumbaiApartmentBuilding(opts) {
  const b = new THREE.Group();
  b.name = 'MumbaiApartmentBuilding';
  const { stories, width, depth, storyH, mWall, mGlass, mMetal, mWood, mSintex, mFlower } = opts;
  const totalH = stories * storyH;

  // Main Building Block
  const body = new THREE.Mesh(new THREE.BoxGeometry(depth, totalH, width), mWall);
  body.position.set(0, totalH / 2, 0);
  b.add(body);

  // Balconies with metal grilles & laundry on every floor (starting from floor 2)
  for (let floor = 1; floor < stories; floor++) {
    const y = floor * storyH + 0.15;
    [-width / 4, width / 4].forEach(bz => {
      // Balcony slab
      const slab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 5.0), mWall);
      slab.position.set(-depth / 2 - 1.0, y, bz);
      b.add(slab);

      // Safety box grilles
      const grill = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 4.8), mMetal);
      grill.position.set(-depth / 2 - 1.0, y + 0.65, bz);
      b.add(grill);

      // Balcony potted plant / flower
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 6), mWood);
      pot.position.set(-depth / 2 - 1.8, y + 0.35, bz + 1.8);
      b.add(pot);

      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), mFlower);
      leaf.position.set(-depth / 2 - 1.8, y + 0.6, bz + 1.8);
      b.add(leaf);
    });
  }

  // Rooftop Parapet Wall
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(depth, 1.1, width), mWall);
  parapet.position.set(0, totalH + 0.55, 0);
  b.add(parapet);

  // Rooftop Black Cylindrical Sintex Water Storage Tanks
  [-width / 4, 0, width / 4].forEach(tz => {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.6, 12), mSintex);
    tank.position.set(-depth / 4, totalH + 0.9, tz);
    b.add(tank);

    // Ribs on Sintex tank
    [-0.4, 0, 0.4].forEach(ry => {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.04, 4, 12), mSintex);
      rib.rotation.x = Math.PI / 2;
      rib.position.set(-depth / 4, totalH + 0.9 + ry, tz);
      b.add(rib);
    });
  });

  // Rooftop Solar Water Heating Panels
  const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 4.2), mGlass);
  solarPanel.rotation.z = -0.25;
  solarPanel.position.set(depth / 4, totalH + 1.2, 0);
  b.add(solarPanel);

  return b;
}

// ── 3. buildChawlBuilding ──────────────────────────────────────────────────
function buildChawlBuilding(opts) {
  const c = new THREE.Group();
  c.name = 'MumbaiChawl';
  const { stories, width, depth, mWall, mWood, mTin, mGlass } = opts;
  const storyH = 3.6;
  const totalH = stories * storyH;

  // Main Brick/Plaster Structure
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, totalH, depth), mWall);
  body.position.set(0, totalH / 2, 0);
  c.add(body);

  // Continuous Cantilevered Wooden Verandas on Upper Floors
  for (let fl = 1; fl < stories; fl++) {
    const y = fl * storyH;
    const vPlank = new THREE.Mesh(new THREE.BoxGeometry(width + 1.2, 0.2, 2.4), mWood);
    vPlank.position.set(0, y + 0.1, depth / 2 + 1.1);
    c.add(vPlank);

    // Wooden Balcony Railing
    const vRailing = new THREE.Mesh(new THREE.BoxGeometry(width + 1.2, 1.0, 0.1), mWood);
    vRailing.position.set(0, y + 0.7, depth / 2 + 2.25);
    c.add(vRailing);

    // Veranda Pillars
    for (let px = -width / 2; px <= width / 2; px += 4.0) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, storyH, 0.2), mWood);
      post.position.set(px, y + storyH / 2, depth / 2 + 2.2);
      c.add(post);
    }
  }

  // Corrugated Galvanized Tin Sloped Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 2.0, 0.3, depth + 3.2), mTin);
  roof.rotation.x = 0.15;
  roof.position.set(0, totalH + 0.8, 0.6);
  c.add(roof);

  return c;
}

// ── 4. buildMahalaxmiKiranaStore ───────────────────────────────────────────
function buildMahalaxmiKiranaStore(opts) {
  const s = new THREE.Group();
  s.name = 'MahalaxmiKiranaStores';
  const { mWall, mBlueTarp, mWood, mTin } = opts;

  // Shop facade base
  const stall = new THREE.Mesh(new THREE.BoxGeometry(7.5, 3.4, 4.5), mWall);
  stall.position.set(0, 1.7, 0);
  s.add(stall);

  // Shop counter
  const counter = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.0, 1.2), mWood);
  counter.position.set(0, 0.5, 2.1);
  s.add(counter);

  // Bright Blue Tarpaulin Weather Awning
  const tarp = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.08, 3.2), mBlueTarp);
  tarp.rotation.x = 0.22;
  tarp.position.set(0, 3.2, 3.2);
  s.add(tarp);

  // Hanging strips of snack packets (Kurkure / Lays)
  for (let hx = -2.5; hx <= 2.5; hx += 1.2) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 0.05), mBlueTarp);
    strip.position.set(hx, 2.2, 3.4);
    s.add(strip);
  }

  // Grain / rice sacks stacked in front
  for (let bx = -2.2; bx <= 2.2; bx += 1.1) {
    const sack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), mWood);
    sack.position.set(bx, 0.3, 3.0);
    s.add(sack);
  }

  return s;
}

// ── 5. buildChaiTapri ──────────────────────────────────────────────────────
function buildChaiTapri(opts) {
  const t = new THREE.Group();
  t.name = 'CornerChaiTapri';
  const { mBlueTarp, mWood, mMetal, mGold } = opts;

  // Wooden Table / Stall Counter
  const table = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 1.6), mWood);
  table.position.set(0, 0.5, 0);
  t.add(table);

  // Brass Boiling Samovar / Tea Kettle
  const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.65, 8), mGold);
  kettle.position.set(-0.7, 1.35, 0);
  t.add(kettle);

  // Stainless Steel Milk Can / Churn
  const milkCan = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.75, 8), mMetal);
  milkCan.position.set(0.7, 1.4, 0);
  t.add(milkCan);

  // Blue Tarpaulin Canopy on 4 Wooden Poles
  [[-1.4, -0.7], [1.4, -0.7], [-1.4, 0.7], [1.4, 0.7]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), mWood);
    post.position.set(px, 1.3, pz);
    t.add(post);
  });

  const tarpRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 2.2), mBlueTarp);
  tarpRoof.position.set(0, 2.6, 0);
  t.add(tarpRoof);

  // Wooden Customer Sit-Out Bench
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 0.6), mWood);
  bench.position.set(0, 0.25, 1.6);
  t.add(bench);

  return t;
}

// ── 6. buildBESTBusStop ────────────────────────────────────────────────────
function buildBESTBusStop(opts) {
  const bs = new THREE.Group();
  bs.name = 'BESTBusStop';
  const { mRed, mTin, mMetal, mGlass } = opts;

  // Red Tubular Steel Uprights
  [-1.8, 1.8].forEach(px => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), mRed);
    post.position.set(px, 1.4, -0.8);
    bs.add(post);
  });

  // Curved Metal Canopy
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.1, 2.4), mTin);
  roof.position.set(0, 2.85, 0);
  bs.add(roof);

  // Back Advertising / Route Timetable Panel
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.8, 0.08), mRed);
  panel.position.set(0, 1.6, -0.8);
  bs.add(panel);

  // Perforated Stainless Steel Passenger Bench
  const seat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.45, 0.5), mMetal);
  seat.position.set(0, 0.45, -0.4);
  bs.add(seat);

  return bs;
}

// ── 7. buildCurbsideAutoQueue ──────────────────────────────────────────────
function buildCurbsideAutoQueue(count, mYellow, mBlack, mGlass) {
  const q = new THREE.Group();
  q.name = 'CurbsideAutoQueue';

  for (let i = 0; i < count; i++) {
    const auto = new THREE.Group();
    // Line up parallel along X in dedicated curbside parking bay, facing East (+X)
    auto.position.set(i * 4.6, 0, 0);
    auto.rotation.y = Math.PI / 2;

    // Black Body Chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 2.5), mBlack);
    body.position.set(0, 0.62, 0);
    auto.add(body);

    // Yellow Mumbai Upper Canopy Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.8, 1.8), mYellow);
    roof.position.set(0, 1.38, -0.2);
    auto.add(roof);

    // Front Fairing Cowl
    const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.7), mYellow);
    cowl.position.set(0, 0.75, 1.0);
    auto.add(cowl);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.65), mGlass);
    windshield.position.set(0, 1.25, 0.82);
    auto.add(windshield);

    // Front Round Chrome Headlight
    const hLight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 8), mYellow);
    hLight.rotation.x = Math.PI / 2;
    hLight.position.set(0, 0.75, 1.38);
    auto.add(hLight);

    // Front Single Wheel
    const fWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 8), mBlack);
    fWheel.rotation.z = Math.PI / 2;
    fWheel.position.set(0, 0.24, 1.1);
    auto.add(fWheel);

    // Rear Two Wheels
    [-0.72, 0.72].forEach(rx => {
      const rWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 8), mBlack);
      rWheel.rotation.z = Math.PI / 2;
      rWheel.position.set(rx, 0.24, -0.75);
      auto.add(rWheel);
    });

    q.add(auto);
  }

  return q;
}

// ── 7B. buildElectricalSubstation ──────────────────────────────────────────
function buildElectricalSubstation(mWall, mMetal, mTin) {
  const sub = new THREE.Group();
  sub.name = 'ElectricalSubstation';

  // Concrete Base Slab
  const base = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.25, 8.0), mWall);
  base.position.set(0, 0.12, 0);
  sub.add(base);

  // Gravel Yard Bed
  const gravel = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.05, 7.6), mWall);
  gravel.position.set(0, 0.26, 0);
  sub.add(gravel);

  // Security Perimeter Mesh Fence
  const fenceH = 2.4;
  [
    { w: 9.8, d: 0.1, x: 0, z: -3.8 },
    { w: 9.8, d: 0.1, x: 0, z: 3.8 },
    { w: 0.1, d: 7.6, x: -4.8, z: 0 },
    { w: 0.1, d: 7.6, x: 4.8, z: 0 }
  ].forEach(fn => {
    const fw = new THREE.Mesh(new THREE.BoxGeometry(fn.w, fenceH, fn.d), mMetal);
    fw.position.set(fn.x, fenceH / 2 + 0.25, fn.z);
    sub.add(fw);
  });

  // Two Electrical Transformers
  [-2.2, 2.2].forEach(tx => {
    const tBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 2.0), mWall);
    tBody.position.set(tx, 1.25, 0);
    sub.add(tBody);

    const cons = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.0, 8), mMetal);
    cons.rotation.z = Math.PI / 2;
    cons.position.set(tx, 2.45, -0.4);
    sub.add(cons);

    [-0.6, 0, 0.6].forEach(bx => {
      const bushing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.8, 6), mTin);
      bushing.position.set(tx + bx, 2.65, 0.4);
      sub.add(bushing);
    });
  });

  // Warning Signboard
  const warnSign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.05), mTin);
  warnSign.position.set(0, 1.5, 3.82);
  sub.add(warnSign);

  return sub;
}

// ── 8. buildUtilityPoleWithCables ──────────────────────────────────────────
function buildUtilityPoleWithCables(mMetal, mWood) {
  const p = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.0, 6), mWood);
  pole.position.y = 3.5;
  p.add(pole);

  // Horizontal Crossarm
  const cross = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.1), mMetal);
  cross.position.set(0, 6.4, 0);
  p.add(cross);

  // Ceramic Insulators
  [-1.0, 0, 1.0].forEach(ix => {
    const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 6), mMetal);
    ins.position.set(ix, 6.55, 0);
    p.add(ins);
  });

  return p;
}

// ── 9. buildStreetFoodCart ─────────────────────────────────────────────────
function buildStreetFoodCart(mTarp, mMetal, mWood) {
  const c = new THREE.Group();
  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.1), mWood);
  cartBody.position.set(0, 0.6, 0);
  c.add(cartBody);

  // Stove / griddle
  const griddle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.6), mMetal);
  griddle.position.set(-0.4, 1.05, 0);
  c.add(griddle);

  // Big Yellow/Blue Umbrella
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), mMetal);
  pole.position.set(0.6, 1.2, 0);
  c.add(pole);

  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.6, 8), mTarp);
  umbrella.position.set(0.6, 2.4, 0);
  c.add(umbrella);

  return c;
}

// ── 10. buildGulmoharTree (High-Detail Organic Mumbai Umbrella Canopy) ──────
function buildGulmoharTree(mTrunk, mLeaf, mFlower) {
  const tree = new THREE.Group();
  tree.name = 'GulmoharTree';

  // Base flared trunk with woody bark
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.58, 4.0, 10), mTrunk);
  trunk.position.y = 2.0;
  trunk.castShadow = true;
  tree.add(trunk);

  // Organic Branching Limbs extending outwards to support umbrella canopy
  const branchConfigs = [
    { len: 2.6, r1: 0.16, r2: 0.24, px: 0.8, py: 4.2, pz: 0.6, rx: 0.35, rz: -0.45 },
    { len: 2.8, r1: 0.16, r2: 0.24, px: -0.9, py: 4.3, pz: -0.5, rx: -0.3, rz: 0.5 },
    { len: 2.5, r1: 0.15, r2: 0.22, px: 0.4, py: 4.4, pz: -0.9, rx: -0.45, rz: -0.25 },
    { len: 2.7, r1: 0.15, r2: 0.22, px: -0.5, py: 4.3, pz: 0.9, rx: 0.4, rz: 0.3 }
  ];
  branchConfigs.forEach(bc => {
    const br = new THREE.Mesh(new THREE.CylinderGeometry(bc.r1, bc.r2, bc.len, 7), mTrunk);
    br.position.set(bc.px, bc.py, bc.pz);
    br.rotation.x = bc.rx;
    br.rotation.z = bc.rz;
    br.castShadow = true;
    tree.add(br);
  });

  // Dense Multi-Cluster Leafy Canopy (Flattened Umbrella Profile)
  // Main central crown
  const crown = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 10), mLeaf);
  crown.scale.set(1.35, 0.72, 1.35);
  crown.position.set(0, 5.5, 0);
  crown.castShadow = true;
  tree.add(crown);

  // Overlapping secondary foliage lobes
  const foliageLobes = [
    { x: 1.6, y: 5.1, z: 0.7, rx: 1.5, ry: 0.8, rz: 1.4 },
    { x: -1.7, y: 5.2, z: -0.6, rx: 1.6, ry: 0.85, rz: 1.5 },
    { x: 0.6, y: 5.3, z: -1.7, rx: 1.4, ry: 0.8, rz: 1.6 },
    { x: -0.7, y: 5.0, z: 1.6, rx: 1.5, ry: 0.8, rz: 1.4 },
    { x: 1.4, y: 5.4, z: -1.2, rx: 1.3, ry: 0.75, rz: 1.3 },
    { x: -1.3, y: 5.3, z: 1.2, rx: 1.3, ry: 0.75, rz: 1.3 }
  ];
  foliageLobes.forEach(fl => {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(1.4, 10, 8), mLeaf);
    lobe.scale.set(fl.rx, fl.ry, fl.rz);
    lobe.position.set(fl.x, fl.y, fl.z);
    lobe.castShadow = true;
    tree.add(lobe);
  });

  // Cascading Fiery Scarlet/Orange Blossom Clusters ("Gul-Mohar" Flower Clouds)
  const blossomClusters = [
    { x: 0.0, y: 6.1, z: 0.0, r: 1.2, sy: 0.65 },
    { x: 1.5, y: 5.7, z: 0.8, r: 1.0, sy: 0.6 },
    { x: -1.5, y: 5.8, z: -0.7, r: 1.0, sy: 0.6 },
    { x: 0.7, y: 5.9, z: -1.5, r: 0.95, sy: 0.55 },
    { x: -0.8, y: 5.7, z: 1.5, r: 0.95, sy: 0.55 },
    { x: 2.1, y: 5.3, z: -0.3, r: 0.85, sy: 0.5 },
    { x: -2.0, y: 5.4, z: 0.4, r: 0.85, sy: 0.5 },
    { x: 0.4, y: 5.8, z: 1.8, r: 0.85, sy: 0.5 }
  ];
  blossomClusters.forEach(bc => {
    const blossom = new THREE.Mesh(new THREE.SphereGeometry(bc.r, 10, 8), mFlower);
    blossom.scale.set(1.15, bc.sy, 1.15);
    blossom.position.set(bc.x, bc.y, bc.z);
    blossom.castShadow = true;
    tree.add(blossom);
  });

  return tree;
}

// ── 11. buildMumbaiParkedScooter ────────────────────────────────────────────
function buildMumbaiParkedScooter() {
  const sc = new THREE.Group();
  const mBody = new THREE.MeshLambertMaterial({ color: 0x636e72 });
  const mSeat = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
  const mBlack = new THREE.MeshLambertMaterial({ color: 0x1e272e });

  // Main apron & footboard
  const apron = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.25), mBody);
  apron.position.set(0, 0.55, 0.7);
  sc.add(apron);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.9), mSeat);
  seat.position.set(0, 0.65, -0.1);
  sc.add(seat);

  // Wheels
  [-0.6, 0.7].forEach(wz => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 8), mBlack);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.2, wz);
    sc.add(wheel);
  });

  return sc;
}

// ── 12. buildSilenceZoneSign ───────────────────────────────────────────────
function buildSilenceZoneSign(mPost, mRed) {
  const s = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6), mPost);
  pole.position.y = 1.6;
  s.add(pole);

  // Circular Signplate: No Honking
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 16), mRed);
  plate.rotation.x = Math.PI / 2;
  plate.position.set(0, 2.8, 0);
  s.add(plate);

  return s;
}

// ── 12B. buildSchoolOverheadGantry ─────────────────────────────────────────
function buildSchoolOverheadGantry(width, opts) {
  const g = new THREE.Group();
  g.name = 'SchoolOverheadGantry';
  const { mMetal, mYellow, mEmissive } = opts;

  // Concrete footing blocks and steel vertical trusses
  [-width / 2 + 0.5, width / 2 - 0.5].forEach(gx => {
    const footing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), opts.mFooting || mMetal);
    footing.position.set(gx, 0.25, 0);
    g.add(footing);

    const truss = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.20, 6.2, 8), mMetal);
    truss.position.set(gx, 3.3, 0);
    g.add(truss);
  });

  // Cross beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.45, 0.45), mMetal);
  beam.position.set(0, 6.2, 0);
  g.add(beam);

  // High-Resolution Crisp Gantry Signboard
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.lineWidth = 14; ctx.strokeStyle = '#111827';
    ctx.strokeRect(7, 7, 1010, 242);
    ctx.fillStyle = '#111827';
    ctx.font = '900 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏫 ST. XAVIER HIGH SCHOOL CAMPUS', 512, 78);
    ctx.font = '800 42px sans-serif';
    ctx.fillStyle = '#b71c1c';
    ctx.fillText('SPEED LIMIT 20 KM/H • SILENCE ZONE (NO HONKING)', 512, 142);
    ctx.font = '700 36px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('STUDENTS DISMISSAL CORRIDOR • YIELD AT CROSSWALK', 512, 202);

    const tex = new THREE.CanvasTexture(canvas);
    const mBoard = new THREE.MeshBasicMaterial({ map: tex });
    const board = new THREE.Mesh(new THREE.BoxGeometry(width - 1.8, 1.8, 0.12), mBoard);
    board.position.set(0, 5.2, 0);
    g.add(board);
  } catch(e) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(width - 1.8, 1.8, 0.12), mYellow);
    board.position.set(0, 5.2, 0);
    g.add(board);
  }

  // Twin Flashing Amber Warning LED Cylinders on top
  [-3.0, 3.0].forEach(fx => {
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 10), mEmissive);
    beacon.position.set(fx, 6.6, 0);
    g.add(beacon);
  });

  return g;
}

// ── 13. buildAmberWarningBeacon ────────────────────────────────────────────
function buildAmberWarningBeacon(mPost, mYellow, mEmissive) {
  const b = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.8, 8), mPost);
  pole.position.y = 2.4;
  b.add(pole);

  // Diamond Warning Board: SCHOOL ZONE
  const diamond = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.06), mYellow);
  diamond.rotation.z = Math.PI / 4;
  diamond.position.set(0, 3.8, 0);
  b.add(diamond);

  // Twin Alternating Amber LED Flashers
  [-0.45, 0.45].forEach(fx => {
    const flasher = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 10), mEmissive);
    flasher.rotation.x = Math.PI / 2;
    flasher.position.set(fx, 4.6, 0.06);
    b.add(flasher);
  });

  return b;
}

// ── 14. buildMumbaiSchoolBus ───────────────────────────────────────────────
function buildMumbaiSchoolBus(mYellow, mStripe, mMetal, mGlass) {
  const bus = new THREE.Group();
  bus.name = 'MumbaiSchoolBus';

  const len = 10.5, h = 3.2, w = 2.6;

  // Main Yellow Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.8, len), mYellow);
  body.position.set(0, h / 2 + 0.3, 0);
  bus.add(body);

  // Maroon Waistband Stripe (Mumbai School Bus Standard)
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.45, len + 0.02), mStripe);
  stripe.position.set(0, 1.4, 0);
  bus.add(stripe);

  // Side Passenger Windows
  const windowBarL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, len - 2.0), mGlass);
  windowBarL.position.set(-w / 2 - 0.02, 2.2, 0);
  bus.add(windowBarL);

  const windowBarR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, len - 2.0), mGlass);
  windowBarR.position.set(w / 2 + 0.02, 2.2, 0);
  bus.add(windowBarR);

  // Front Windshield
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, 1.0), mGlass);
  windshield.position.set(0, 2.2, len / 2 + 0.02);
  bus.add(windshield);

  // 4 Heavy Wheels
  [[-w / 2 - 0.05, 2.8], [w / 2 + 0.05, 2.8], [-w / 2 - 0.05, -3.0], [w / 2 + 0.05, -3.0]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12), mMetal);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.5, wz);
    bus.add(wheel);
  });

  return bus;
}

// ── 15. buildTacticalSchoolMarkings ────────────────────────────────────────
function buildTacticalSchoolMarkings(mYellow, mWhite) {
  const t = new THREE.Group();

  // Wide yellow chevron carpet on road surface
  const chevronCarpet = new THREE.Mesh(new THREE.PlaneGeometry(15.5, 30), mYellow);
  chevronCarpet.rotation.x = -Math.PI / 2;
  chevronCarpet.position.set(0, 0.02, 0);
  t.add(chevronCarpet);

  // White contrast bands
  for (let bz = -12; bz <= 12; bz += 4.0) {
    const band = new THREE.Mesh(new THREE.PlaneGeometry(15.0, 0.8), mWhite);
    band.rotation.x = -Math.PI / 2;
    band.position.set(0, 0.025, bz);
    t.add(band);
  }

  return t;
}

// ── 16. buildStXavierHeritageArch ──────────────────────────────────────────
function buildStXavierHeritageArch(opts, arg2, arg3) {
  const a = new THREE.Group();
  a.name = 'StXavierHeritageArch';
  let mStone, mGold, mMetal;
  if (opts && opts.isMaterial) {
    mStone = opts;
    mGold = arg2;
    mMetal = arg3;
  } else if (opts) {
    mStone = opts.mStone;
    mGold = opts.mGold;
    mMetal = opts.mMetal;
  }
  mStone = mStone || new THREE.MeshLambertMaterial({ color: 0x474b4e, roughness: 0.9 });
  mGold = mGold || new THREE.MeshBasicMaterial({ color: 0xf1c40f });
  mMetal = mMetal || new THREE.MeshLambertMaterial({ color: 0x2d3436, roughness: 0.6 });

  const archW = 16.0, archH = 7.8;

  // Left & Right Basalt Stone Gate Pillars
  [-archW / 2 + 1.2, archW / 2 - 1.2].forEach(px => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.4, archH, 2.4), mStone);
    pillar.position.set(px, archH / 2, 0);
    a.add(pillar);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 2.8), mStone);
    cap.position.set(px, archH + 0.2, 0);
    a.add(cap);

    const urn = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), mGold);
    urn.position.set(px, archH + 0.85, 0);
    a.add(urn);
  });

  // Basalt Arch Header Span
  const span = new THREE.Mesh(new THREE.BoxGeometry(archW, 1.8, 2.0), mStone);
  span.position.set(0, archH - 0.5, 0);
  a.add(span);

  // School Crest Medallion
  const crest = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.25, 16), mGold);
  crest.rotation.x = Math.PI / 2;
  crest.position.set(0, archH + 0.9, 1.05);
  a.add(crest);

  // High-DPI Illuminated Canvas Banner on Arch
  if (typeof document !== 'undefined') {
    const aCanvas = document.createElement('canvas');
    aCanvas.width = 1024;
    aCanvas.height = 256;
    const aCtx = aCanvas.getContext('2d');
    if (aCtx) {
      aCtx.fillStyle = '#0c2461';
      aCtx.fillRect(0, 0, 1024, 256);
      aCtx.lineWidth = 10;
      aCtx.strokeStyle = '#f1c40f';
      aCtx.strokeRect(8, 8, 1008, 240);

      aCtx.fillStyle = '#f1c40f';
      aCtx.font = 'bold 34px sans-serif';
      aCtx.textAlign = 'center';
      aCtx.fillText('★  ★  ★   FOUNDED 1869   ★  ★  ★', 512, 58);

      aCtx.fillStyle = '#ffffff';
      aCtx.font = '900 60px "Segoe UI", Arial, sans-serif';
      aCtx.fillText('🏫 ST. XAVIER HIGH SCHOOL', 512, 130);

      aCtx.fillStyle = '#facc15';
      aCtx.font = 'bold 36px sans-serif';
      aCtx.fillText('MAIN CAMPUS GATE  •  PAREL, MUMBAI', 512, 185);

      aCtx.fillStyle = '#93c5fd';
      aCtx.font = 'bold 24px sans-serif';
      aCtx.fillText('DISMISSAL & VISITOR ENTRANCE', 512, 225);

      const aTex = new THREE.CanvasTexture(aCanvas);
      const aSign = new THREE.Mesh(
        new THREE.PlaneGeometry(archW - 2.8, 2.2),
        new THREE.MeshBasicMaterial({ map: aTex, side: THREE.DoubleSide })
      );
      aSign.position.set(0, archH - 0.5, 1.05);
      a.add(aSign);
    }
  }

  // Wrought Iron Gates swung open for dismissal
  [-archW / 4, archW / 4].forEach((gx, gIdx) => {
    const gateLeaf = new THREE.Mesh(new THREE.BoxGeometry(archW / 2 - 2.0, 3.5, 0.1), mMetal);
    gateLeaf.position.set(gx, 1.75, gIdx === 0 ? -2.5 : 2.5);
    gateLeaf.rotation.y = gIdx === 0 ? Math.PI / 4 : -Math.PI / 4;
    a.add(gateLeaf);
  });

  // Security Cabin next to arch
  const booth = new THREE.Group();
  const bWall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.8, 3.2), mStone);
  bWall.position.set(0, 1.4, 0);
  booth.add(bWall);
  const bRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 3.6), mGold);
  bRoof.position.set(0, 2.95, 0);
  booth.add(bRoof);
  booth.position.set(archW / 2 + 2.5, 0, 0);
  a.add(booth);

  return a;
}

// ── 17. buildSchoolSafetyMurals ────────────────────────────────────────────
function buildSchoolSafetyMurals(mStone, mPlaster) {
  const m = new THREE.Group();
  const wallL = 60;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.4, wallL), mStone);
  wall.position.set(0, 1.2, 0);
  m.add(wall);

  // Mural art panels
  for (let pz = -wallL / 2 + 6; pz < wallL / 2 - 6; pz += 12) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.6), mPlaster);
    panel.position.set(-0.2, 1.2, pz);
    m.add(panel);
  }

  return m;
}




  /**
   * ═══════════════════════════════════════════════════════════════════════════════
   *  AUTHENTIC MUMBAI CITY MULTI-DISTRICT GENERATOR (Level 5)
   *  Directly crafted from real-world Mumbai urban morphology & reference photos:
   *  1. Leg 1 (Z: -2450 to -1550, X = 0): Shanti Niketan & Nav Prabhat CHS
   *     • Player Home & Garage (Z = -2380)
   *     • Gated CHS Entrances with Guard Booth & Boom Barrier (Z = -2300, -1950)
   *     • 4-Story CHS Apartments with Balconies, Laundry, & Rooftop Sintex Tanks
   *     • Flowering Gulmohar Trees & Parked Scooters
   *  2. Turn 1 & Leg 2 (Z = -1600, X: 0 to 180): Corner Bazar & Chawl District
   *     • 3-Story Heritage Mumbai Chawl Buildings with wooden balconies
   *     • Mahalaxmi Kirana Stores with blue tarpaulin canopy & hanging snack strips
   *     • Corner Chai Tapri with brass kettle, cutting chai glasses, & bench
   *     • Red BEST Bus Stop Shelter with bilingual timetable sign
   *     • Curbside Black & Yellow Bajaj Autorickshaw queue
   *  3. Turn 2 & Leg 3 (X = 180, Z: -1600 to 1200): Swami Vivekananda 4-Lane Avenue
   *     • Divided Arterial with center median, hedges & streetlights
   *     • Dense Highrise CHS (Gokuldham CHS, Sagar Darshan) behind boundary walls
   *     • Street food Vada Pav stall, municipal bins & post boxes
   *  4. Turn 3 & Leg 5 (Z: 1200 to 2500, X = 0): St. Xavier School Safety Precinct
   *     • School Silence Zone signposts (No Horn)
   *     • Flashing Amber Warning Beacon at Z = 1700 (20 km/h Strict)
   *     • Curbside School Bus Bay with parked yellow Tata/Ashok Leyland buses
   *     • Tactical Yellow Thermoplastic Markings ("SCHOOL ZONE", "LOOK ◀ ▶")
   *     • Raised Tabletop Zebra Crosswalk at Z = 2320
   *     • Crossing Guard Havaldar Shinde with articulated STOP sign
   *     • Monumental St. Xavier Heritage Stone Arch Gate at Z = 2450
   *     • School compound wall with student safety murals ("STUDENTS FIRST")
   *     • Courtyard assembly lawn with Indian Tricolor flag on flagpole
   * ═══════════════════════════════════════════════════════════════════════════════
   */
    
// ── 18. buildRoadsideMandir ──────────────────────────────────────────────────
function buildRoadsideMandir(opts) {
  const g = new THREE.Group();
  g.name = 'MumbaiRoadsideMandir';
  const { mWall, mGold, mBestRed, mWood, mFlowerYellow, mFlowerOrange } = opts;

  // Marble Plinth Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.7, 6.4), mWall);
  base.position.set(0, 0.35, 0);
  g.add(base);

  // Front Entrance Marble Steps
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.6), mWall);
    step.position.set(0, 0.1 + s * 0.2, 3.5 + s * 0.5);
    g.add(step);
  }

  // 4 Corner Carved Marble Pillars
  [-2.4, 2.4].forEach(px => {
    [-2.4, 2.4].forEach(pz => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 3.2, 8), mWall);
      pillar.position.set(px, 2.3, pz);
      g.add(pillar);
    });
  });

  // Arch Canopy Header
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.4, 5.6), mWall);
  canopy.position.set(0, 4.1, 0);
  g.add(canopy);

  // Pyramidal Shikhar (Temple Dome Spire)
  const shikhar = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.2, 4), mWall);
  shikhar.rotation.y = Math.PI / 4;
  shikhar.position.set(0, 6.4, 0);
  g.add(shikhar);

  // Golden Kalash Finial
  const kalash = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), mGold);
  kalash.position.set(0, 8.6, 0);
  g.add(kalash);

  // Saffron Dhwaja (Flag Mast & Fluttering Triangular Flag)
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), mGold);
  flagPole.position.set(0, 9.6, 0);
  g.add(flagPole);

  const flag = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.1, 3), mFlowerOrange);
  flag.rotation.z = -Math.PI / 2;
  flag.position.set(0.6, 9.9, 0);
  g.add(flag);

  // Brass Temple Bell hanging in center arch
  const bellChain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), mGold);
  bellChain.position.set(0, 3.4, 0);
  g.add(bellChain);
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.35, 8), mGold);
  bell.position.set(0, 2.8, 0);
  g.add(bell);

  // Marigold Flower Garland Stall (Phoolwala)
  const stall = new THREE.Group();
  stall.position.set(4.0, 0.35, 2.0);
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.2), mWood);
  table.position.set(0, 0.4, 0);
  stall.add(table);

  for (let gIdx = -0.6; gIdx <= 0.6; gIdx += 0.4) {
    const garland = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 6, 8), (gIdx < 0) ? mFlowerOrange : mFlowerYellow);
    garland.rotation.x = Math.PI / 2;
    garland.position.set(gIdx, 0.85, 0.2);
    stall.add(garland);
  }
  g.add(stall);

  return g;
}

// ── 19. buildColonyCricketGround ─────────────────────────────────────────────
function buildColonyCricketGround(width, depth, opts) {
  const c = new THREE.Group();
  c.name = 'ColonyCricketGround';
  const { mGrass, mFence, mWood, mWall } = opts;

  // Grass Field
  const grass = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, depth), mGrass);
  grass.position.set(0, 0.05, 0);
  c.add(grass);

  // Central Clay Cricket Pitch (22 yards = ~20 meters)
  const pitch = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 20.0), mWall);
  pitch.position.set(0, 0.06, 0);
  c.add(pitch);

  // Stumps at both bowling ends
  [-8.5, 8.5].forEach(sz => {
    [-0.2, 0, 0.2].forEach(sx => {
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), mWood);
      stump.position.set(sx, 0.45, sz);
      c.add(stump);
    });
  });

  // Perimeter Wire-Mesh Fence
  const fenceH = 2.2;
  [-depth / 2, depth / 2].forEach(fz => {
    const fMesh = new THREE.Mesh(new THREE.BoxGeometry(width, fenceH, 0.15), mFence);
    fMesh.position.set(0, fenceH / 2 + 0.1, fz);
    c.add(fMesh);
  });
  [-width / 2, width / 2].forEach(fx => {
    const fMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, fenceH, depth), mFence);
    fMesh.position.set(fx, fenceH / 2 + 0.1, 0);
    c.add(fMesh);
  });

  return c;
}

// ── 20. buildSchoolAcademicBuilding & St. Xavier High School Campus ───────────
function buildSchoolAcademicBuilding(opts) {
  const s = new THREE.Group();
  s.name = 'StXavierAcademicHall';
  const mStone = opts.mStone || new THREE.MeshLambertMaterial({ color: 0x8b3a2a, roughness: 0.8 });
  const mCream = opts.mCream || opts.mWall || new THREE.MeshLambertMaterial({ color: 0xf5f0e6, roughness: 0.85 });
  const mGold = opts.mGold || new THREE.MeshBasicMaterial({ color: 0xf1c40f });
  const mGlass = opts.mGlass || new THREE.MeshBasicMaterial({ color: 0x70a1ff });
  const mRoof = opts.mRoof || new THREE.MeshLambertMaterial({ color: 0x1e293b, roughness: 0.6 });
  const mWood = opts.mWood || new THREE.MeshLambertMaterial({ color: 0x4a2c11, roughness: 0.85 });
  const mFence = opts.mFence || new THREE.MeshLambertMaterial({ color: 0x2d3436, roughness: 0.6 });
  const mBell = new THREE.MeshLambertMaterial({ color: 0xcd7f32, roughness: 0.4, metalness: 0.6 });

  // Main 4-story Gothic Academic Hall (Center block)
  const hallW = 56, hallD = 24, hallH = 16;
  const body = new THREE.Mesh(new THREE.BoxGeometry(hallD, hallH, hallW), mStone);
  body.position.set(0, hallH / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  s.add(body);

  // Horizontal stone stringcourses & cornices
  [4.0, 8.0, 12.0, 16.0].forEach(cy => {
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(hallD + 0.6, 0.4, hallW + 0.6), mCream);
    cornice.position.set(0, cy, 0);
    s.add(cornice);
  });

  // Corner stone quoining
  [[-hallD / 2, -hallW / 2], [-hallD / 2, hallW / 2], [hallD / 2, -hallW / 2], [hallD / 2, hallW / 2]].forEach(([qx, qz]) => {
    const quoin = new THREE.Mesh(new THREE.BoxGeometry(1.4, hallH, 1.4), mCream);
    quoin.position.set(qx, hallH / 2, qz);
    s.add(quoin);
  });

  // Main Slate Hip Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(hallD + 2.0, 4.2, hallW + 2.0), mRoof);
  roof.position.set(0, hallH + 2.1, 0);
  s.add(roof);

  // Left & Right Symmetrical Classroom Wings
  [-hallW / 2 - 12, hallW / 2 + 12].forEach(wz => {
    const wingW = 24, wingD = 20, wingH = 13;
    const wing = new THREE.Mesh(new THREE.BoxGeometry(wingD, wingH, wingW), mStone);
    wing.position.set(-2, wingH / 2, wz);
    s.add(wing);

    const wingRoof = new THREE.Mesh(new THREE.BoxGeometry(wingD + 1.2, 3.2, wingW + 1.2), mRoof);
    wingRoof.position.set(-2, wingH + 1.6, wz);
    s.add(wingRoof);

    // Classroom windows along wing facade (facing X positive / road direction)
    for (let f = 0; f < 3; f++) {
      for (let w = -wingW / 2 + 3; w < wingW / 2 - 2; w += 4.5) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.4), mGlass);
        win.position.set(wingD / 2 - 1.95, 2.8 + f * 3.8, wz + w);
        win.rotation.y = Math.PI / 2;
        s.add(win);

        const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 2.2), mCream);
        winFrame.position.set(wingD / 2 - 1.98, 2.8 + f * 3.8, wz + w);
        s.add(winFrame);
      }
    }
  });

  // Windows along main facade (facing X positive / road)
  for (let f = 0; f < 4; f++) {
    for (let w = -hallW / 2 + 4; w < hallW / 2 - 3; w += 4.8) {
      if (Math.abs(w) < 5.0 && f === 0) {continue;} // Entrance portico opening
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), mGlass);
      win.position.set(hallD / 2 + 0.05, 2.6 + f * 3.8, w);
      win.rotation.y = Math.PI / 2;
      s.add(win);

      const sill = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 2.5), mCream);
      sill.position.set(hallD / 2 + 0.1, 1.2 + f * 3.8, w);
      s.add(sill);
    }
  }

  // Grand Classical Entrance Portico (Center of facade facing East / road)
  const porticoW = 14, porticoD = 5.5, porticoH = 9.0;
  const porticoBase = new THREE.Mesh(new THREE.BoxGeometry(porticoD, 0.6, porticoW), mCream);
  porticoBase.position.set(hallD / 2 + porticoD / 2, 0.3, 0);
  s.add(porticoBase);

  // 6 Classical Stone Columns
  [-porticoW / 2 + 1.2, -porticoW / 6, porticoW / 6, porticoW / 2 - 1.2].forEach(colZ => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, porticoH, 16), mCream);
    col.position.set(hallD / 2 + porticoD - 0.6, porticoH / 2 + 0.6, colZ);
    s.add(col);
  });

  // Portico Entablature & Pediment
  const pediment = new THREE.Mesh(new THREE.ConeGeometry(porticoW * 0.55, 3.2, 4), mCream);
  pediment.rotation.y = Math.PI / 4;
  pediment.position.set(hallD / 2 + porticoD / 2, porticoH + 2.2, 0);
  s.add(pediment);

  // High-DPI School Signage Banner above Portico
  if (typeof document !== 'undefined') {
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 1024;
    bCanvas.height = 256;
    const bCtx = bCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#0c2461';
      bCtx.fillRect(0, 0, 1024, 256);
      bCtx.lineWidth = 12;
      bCtx.strokeStyle = '#f1c40f';
      bCtx.strokeRect(10, 10, 1004, 236);

      bCtx.lineWidth = 4;
      bCtx.strokeStyle = '#ffffff';
      bCtx.strokeRect(22, 22, 980, 212);

      bCtx.fillStyle = '#f1c40f';
      bCtx.font = 'bold 32px sans-serif';
      bCtx.textAlign = 'center';
      bCtx.fillText('★ ★ ★   ESTD 1869   ★ ★ ★', 512, 60);

      bCtx.fillStyle = '#ffffff';
      bCtx.font = '900 64px "Segoe UI", Arial, sans-serif';
      bCtx.fillText('🏫 ST. XAVIER HIGH SCHOOL', 512, 135);

      bCtx.fillStyle = '#f1c40f';
      bCtx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
      bCtx.fillText('PAREL CAMPUS  •  "PRO BONO ET VERO"', 512, 195);

      bCtx.fillStyle = '#93c5fd';
      bCtx.font = 'bold 24px sans-serif';
      bCtx.fillText('AFFILIATED TO MAHARASHTRA STATE BOARD OF EDUCATION', 512, 230);

      const bTex = new THREE.CanvasTexture(bCanvas);
      const bannerMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(16.0, 4.0),
        new THREE.MeshBasicMaterial({ map: bTex, side: THREE.DoubleSide })
      );
      bannerMesh.rotation.y = Math.PI / 2;
      bannerMesh.position.set(hallD / 2 + porticoD + 0.1, porticoH + 0.5, 0);
      s.add(bannerMesh);
    }
  }

  // 4-Tier 30-Meter Central Gothic Clock & Bell Tower
  const towerH = 30;
  const towerBase = new THREE.Mesh(new THREE.BoxGeometry(9.0, 14.0, 9.0), mStone);
  towerBase.position.set(0, hallH + 7.0, 0);
  s.add(towerBase);

  // Arched Belfry chamber with open arches
  const belfry = new THREE.Mesh(new THREE.BoxGeometry(8.2, 5.5, 8.2), mCream);
  belfry.position.set(0, hallH + 16.75, 0);
  s.add(belfry);

  // Bronze school bell inside belfry
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 2.2, 16), mBell);
  bell.position.set(0, hallH + 16.5, 0);
  s.add(bell);

  // 4 Golden Clock Dials showing 1:15 PM dismissal time
  if (typeof document !== 'undefined') {
    const clkCanvas = document.createElement('canvas');
    clkCanvas.width = 256;
    clkCanvas.height = 256;
    const clkCtx = clkCanvas.getContext('2d');
    if (clkCtx) {
      clkCtx.fillStyle = '#ffffff';
      clkCtx.beginPath();
      clkCtx.arc(128, 128, 120, 0, Math.PI * 2);
      clkCtx.fill();
      clkCtx.lineWidth = 10;
      clkCtx.strokeStyle = '#f1c40f';
      clkCtx.stroke();

      // Hour marks
      clkCtx.strokeStyle = '#1e293b';
      clkCtx.lineWidth = 5;
      for (let h = 0; h < 12; h++) {
        const ang = (h / 12) * Math.PI * 2;
        clkCtx.beginPath();
        clkCtx.moveTo(128 + Math.cos(ang) * 95, 128 + Math.sin(ang) * 95);
        clkCtx.lineTo(128 + Math.cos(ang) * 110, 128 + Math.sin(ang) * 110);
        clkCtx.stroke();
      }

      // Hands at 1:15 PM (Hour hand near 1, Minute hand at 3)
      clkCtx.lineWidth = 8;
      clkCtx.lineCap = 'round';
      clkCtx.beginPath();
      clkCtx.moveTo(128, 128);
      clkCtx.lineTo(165, 75); // ~1 o'clock
      clkCtx.stroke();

      clkCtx.lineWidth = 5;
      clkCtx.beginPath();
      clkCtx.moveTo(128, 128);
      clkCtx.lineTo(215, 128); // 3 o'clock (15 mins)
      clkCtx.stroke();

      const clkTex = new THREE.CanvasTexture(clkCanvas);
      // East (road facing)
      const clkE = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: clkTex }));
      clkE.rotation.y = Math.PI / 2;
      clkE.position.set(4.55, hallH + 11.5, 0);
      s.add(clkE);

      // West
      const clkW = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: clkTex }));
      clkW.rotation.y = -Math.PI / 2;
      clkW.position.set(-4.55, hallH + 11.5, 0);
      s.add(clkW);

      // North & South
      const clkN = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: clkTex }));
      clkN.position.set(0, hallH + 11.5, 4.55);
      s.add(clkN);
      const clkS = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: clkTex }));
      clkS.rotation.y = Math.PI;
      clkS.position.set(0, hallH + 11.5, -4.55);
      s.add(clkS);
    }
  }

  // Pointed Gothic Spire
  const spire = new THREE.Mesh(new THREE.ConeGeometry(5.2, 9.5, 8), mGold);
  spire.position.set(0, hallH + 24.25, 0);
  s.add(spire);

  const crossPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), mGold);
  crossPole.position.set(0, hallH + 29.5, 0);
  s.add(crossPole);

  // Assembly Quadrangle Courtyard in front (X = 0 to 45)
  const quadW = 75, quadD = 40;
  const quadGround = new THREE.Mesh(new THREE.BoxGeometry(quadD, 0.16, quadW), mCream);
  quadGround.position.set(quadD / 2 + 10, 0.08, 0);
  quadGround.receiveShadow = true;
  s.add(quadGround);

  // 14m Indian Flagpole in Assembly Courtyard
  const poleH = 14;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, poleH, 12), new THREE.MeshLambertMaterial({ color: 0xdcdde1 }));
  pole.position.set(quadD / 2 + 8, poleH / 2, 0);
  s.add(pole);

  // Indian Tricolor Flag
  if (typeof document !== 'undefined') {
    const fCanvas = document.createElement('canvas');
    fCanvas.width = 300;
    fCanvas.height = 200;
    const fCtx = fCanvas.getContext('2d');
    if (fCtx) {
      fCtx.fillStyle = '#FF9933'; fCtx.fillRect(0, 0, 300, 67); // Saffron
      fCtx.fillStyle = '#FFFFFF'; fCtx.fillRect(0, 67, 300, 66); // White
      fCtx.fillStyle = '#128807'; fCtx.fillRect(0, 133, 300, 67); // Green
      // Ashoka Chakra
      fCtx.strokeStyle = '#000080';
      fCtx.lineWidth = 3;
      fCtx.beginPath();
      fCtx.arc(150, 100, 24, 0, Math.PI * 2);
      fCtx.stroke();
      for (let sp = 0; sp < 24; sp++) {
        const sang = (sp / 24) * Math.PI * 2;
        fCtx.beginPath();
        fCtx.moveTo(150, 100);
        fCtx.lineTo(150 + Math.cos(sang) * 24, 100 + Math.sin(sang) * 24);
        fCtx.stroke();
      }
      const flagTex = new THREE.CanvasTexture(fCanvas);
      const flagMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 2.4),
        new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide })
      );
      flagMesh.position.set(quadD / 2 + 9.8, poleH - 1.4, 0);
      s.add(flagMesh);
    }
  }

  // Circular flowerbeds and palm trees in quadrangle
  [-quadW / 3, quadW / 3].forEach(fz => {
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.2, 0.4, 16), mStone);
    bed.position.set(quadD / 2 + 8, 0.2, fz);
    s.add(bed);

    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 7.5, 8), mWood);
    trunk.position.y = 3.75;
    palm.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 8), new THREE.MeshLambertMaterial({ color: 0x27ae60 }));
    crown.position.y = 7.5;
    palm.add(crown);
    palm.position.set(quadD / 2 + 8, 0.2, fz);
    s.add(palm);
  });

  return s;
}

// ── 20B. buildStXavierSportsComplex ──────────────────────────────────────────
function buildStXavierSportsComplex(opts) {
  const g = new THREE.Group();
  g.name = 'StXavierSportsComplex';
  const { mGrass, mLine, mTrack, mTin, mBench, mGold, mPost } = opts;

  // Athletic Football Pitch (70m x 100m)
  const pitchW = 70, pitchL = 100;
  const turf = new THREE.Mesh(new THREE.BoxGeometry(pitchW, 0.12, pitchL), mGrass);
  turf.position.set(0, 0.06, 0);
  turf.receiveShadow = true;
  g.add(turf);

  // Red Clay Running Track (Border)
  const trackW = 6.0;
  const trackBed = new THREE.Mesh(new THREE.BoxGeometry(pitchW + trackW * 2, 0.08, pitchL + trackW * 2), mTrack);
  trackBed.position.set(0, 0.04, 0);
  g.add(trackBed);

  // Pitch Chalk Markings (Lines)
  const halfW = pitchW / 2 - 2, halfL = pitchL / 2 - 2;
  const lineMat = mLine || new THREE.MeshBasicMaterial({ color: 0xffffff });
  [
    { x: 0, z: -halfL, w: pitchW - 4, h: 0.2 },
    { x: 0, z: halfL, w: pitchW - 4, h: 0.2 },
    { x: -halfW, z: 0, w: 0.2, h: pitchL - 4 },
    { x: halfW, z: 0, w: 0.2, h: pitchL - 4 },
    { x: 0, z: 0, w: pitchW - 4, h: 0.2 } // Halfway line
  ].forEach(ln => {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(ln.w, ln.h), lineMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(ln.x, 0.13, ln.z);
    g.add(stripe);
  });

  // Centre Circle
  const circle = new THREE.Mesh(new THREE.RingGeometry(8.0, 8.2, 32), lineMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(0, 0.13, 0);
  g.add(circle);

  // 2 Regulation Soccer Goal Posts (North and South ends)
  [-halfL, halfL].forEach((gz, gIdx) => {
    const goal = new THREE.Group();
    const postMat = mPost || new THREE.MeshLambertMaterial({ color: 0xffffff });
    const goalW = 7.32, goalH = 2.44;

    // Left & Right uprights
    [-goalW / 2, goalW / 2].forEach(gx => {
      const up = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, goalH, 8), postMat);
      up.position.set(gx, goalH / 2, 0);
      goal.add(up);
    });

    // Crossbar
    const bar = new THREE.Mesh(new THREE.BoxGeometry(goalW + 0.16, 0.12, 0.12), postMat);
    bar.position.set(0, goalH, 0);
    goal.add(bar);

    // Goal net backing
    const net = new THREE.Mesh(
      new THREE.BoxGeometry(goalW, goalH, 2.0),
      new THREE.MeshBasicMaterial({ color: 0xecf0f1, wireframe: true, transparent: true, opacity: 0.6 })
    );
    net.position.set(0, goalH / 2, gIdx === 0 ? -1.0 : 1.0);
    goal.add(net);

    goal.position.set(0, 0.12, gz);
    g.add(goal);
  });

  // Covered Spectator Grandstand / Pavilion (on West side of pitch)
  const stand = new THREE.Group();
  const standW = 32, standD = 8.0, standH = 4.5;
  const standBase = new THREE.Mesh(new THREE.BoxGeometry(standD, 0.4, standW), mBench);
  standBase.position.set(0, 0.2, 0);
  stand.add(standBase);

  // 3 Tiered bench rows
  for (let t = 0; t < 3; t++) {
    const tier = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45 * (t + 1), standW - 2), mBench);
    tier.position.set(-standD / 2 + 1.2 + t * 2.2, (0.45 * (t + 1)) / 2 + 0.4, 0);
    stand.add(tier);
  }

  // Canopy Roof (Red corrugated tin)
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(standD + 1.5, 0.2, standW + 1.5), mTin);
  canopy.position.set(0, standH, 0);
  stand.add(canopy);

  // Steel canopy posts
  [-standW / 2 + 1.0, standW / 2 - 1.0].forEach(pz => {
    [standD / 2 - 0.5, -standD / 2 + 0.5].forEach(px => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, standH, 8), mBench);
      p.position.set(px, standH / 2, pz);
      stand.add(p);
    });
  });

  // Sports Pavilion Banner
  if (typeof document !== 'undefined') {
    const spCanvas = document.createElement('canvas');
    spCanvas.width = 512;
    spCanvas.height = 128;
    const spCtx = spCanvas.getContext('2d');
    if (spCtx) {
      spCtx.fillStyle = '#9b2226';
      spCtx.fillRect(0, 0, 512, 128);
      spCtx.strokeStyle = '#f1c40f';
      spCtx.lineWidth = 6;
      spCtx.strokeRect(6, 6, 500, 116);
      spCtx.fillStyle = '#ffffff';
      spCtx.font = 'bold 30px sans-serif';
      spCtx.textAlign = 'center';
      spCtx.fillText('🏆 ST. XAVIER SPORTS PAVILION', 256, 54);
      spCtx.fillStyle = '#f1c40f';
      spCtx.font = 'bold 22px sans-serif';
      spCtx.fillText('ATHLETIC GROUNDS & XAVIERITE ARENA', 256, 96);
      const spTex = new THREE.CanvasTexture(spCanvas);
      const spBanner = new THREE.Mesh(
        new THREE.PlaneGeometry(standW * 0.7, 1.8),
        new THREE.MeshBasicMaterial({ map: spTex, side: THREE.DoubleSide })
      );
      spBanner.position.set(standD / 2 + 0.1, standH - 0.9, 0);
      spBanner.rotation.y = Math.PI / 2;
      stand.add(spBanner);
    }
  }

  stand.position.set(-pitchW / 2 - 6, 0.05, 0);
  g.add(stand);

  return g;
}

// ── 20C. buildStXavierCampusBoundaryRailings ──────────────────────────────────
function buildStXavierCampusBoundaryRailings(length, opts) {
  const g = new THREE.Group();
  g.name = 'StXavierCampusBoundaryRailings';
  const { mStone, mIron, mSign, mGold } = opts;

  // 1. Low Basalt Stone Wall Plinth (H = 0.65m)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, length), mStone);
  plinth.position.set(0, 0.325, length / 2);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  g.add(plinth);

  // 2. Periodic Stone Pillars (every 8m)
  const pillarSpacing = 8.0;
  const numPillars = Math.floor(length / pillarSpacing);
  const pillarH = 2.4;

  for (let i = 0; i <= numPillars; i++) {
    const pz = i * pillarSpacing;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.75, pillarH, 0.75), mStone);
    pillar.position.set(0, pillarH / 2, pz);
    pillar.castShadow = true;
    g.add(pillar);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.9), mStone);
    cap.position.set(0, pillarH + 0.1, pz);
    g.add(cap);

    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), mGold || mStone);
    finial.position.set(0, pillarH + 0.4, pz);
    g.add(finial);
  }

  // 3. Black Wrought-Iron Grills between Pillars
  const railH = 1.6; // from Y = 0.65 to 2.25
  for (let i = 0; i < numPillars; i++) {
    const pz1 = i * pillarSpacing + 0.4;
    const pz2 = (i + 1) * pillarSpacing - 0.4;
    const spanLen = pz2 - pz1;
    const spanCenterZ = (pz1 + pz2) / 2;

    // Top and bottom horizontal rails
    [0.72, 2.2].forEach(ry => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, spanLen), mIron);
      rail.position.set(0, ry, spanCenterZ);
      g.add(rail);
    });

    // Vertical railing bars (every 0.4m)
    const numBars = Math.floor(spanLen / 0.4);
    for (let b = 0; b < numBars; b++) {
      const bz = pz1 + 0.2 + b * 0.4;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, railH, 6), mIron);
      bar.position.set(0, 0.65 + railH / 2, bz);
      g.add(bar);

      // Spearhead pointed tip
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 6), mIron);
      tip.position.set(0, 0.65 + railH + 0.075, bz);
      g.add(tip);
    }
  }

  // 4. Mounted Campus Notice Plates along the Railing
  if (typeof document !== 'undefined') {
    const signs = [
      { text1: '🏫 ST. XAVIER HIGH SCHOOL', text2: 'PAREL CAMPUS • FOUNDED 1869', z: 30 },
      { text1: '⚠️ SCHOOL ZONE — STRICT 20 KM/H', text2: 'WATCH FOR STUDENTS CROSSING', z: 90 },
      { text1: '🔇 SILENCE ZONE (NO HONKING)', text2: 'MV ACT SEC 194F — FINE ₹1000', z: 150 },
      { text1: '🚌 SCHOOL BUS PICKUP ZONE', text2: 'KEEP CLEAR DURING DISMISSAL', z: 210 }
    ];

    signs.forEach(sInfo => {
      if (sInfo.z <= length - 10) {
        const sCanvas = document.createElement('canvas');
        sCanvas.width = 512;
        sCanvas.height = 160;
        const sCtx = sCanvas.getContext('2d');
        if (sCtx) {
          sCtx.fillStyle = '#0c2461';
          sCtx.fillRect(0, 0, 512, 160);
          sCtx.lineWidth = 8;
          sCtx.strokeStyle = '#f1c40f';
          sCtx.strokeRect(4, 4, 504, 152);

          sCtx.fillStyle = '#ffffff';
          sCtx.font = 'bold 36px sans-serif';
          sCtx.textAlign = 'center';
          sCtx.fillText(sInfo.text1, 256, 65);

          sCtx.fillStyle = '#facc15';
          sCtx.font = 'bold 26px sans-serif';
          sCtx.fillText(sInfo.text2, 256, 120);

          const sTex = new THREE.CanvasTexture(sCanvas);
          const sMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(3.6, 1.1),
            new THREE.MeshBasicMaterial({ map: sTex, side: THREE.DoubleSide })
          );
          sMesh.rotation.y = Math.PI / 2; // Facing the street
          sMesh.position.set(0.3, 1.5, sInfo.z);
          g.add(sMesh);
        }
      }
    });
  }

  return g;
}

// ── 20D. buildStXavierNorthDismissalBlock ─────────────────────────────────────
function buildStXavierNorthDismissalBlock(opts) {
  const g = new THREE.Group();
  g.name = 'StXavierNorthDismissalBlock';
  const { mStone, mCream, mRoof, mGlass, mGold, mMetal } = opts;

  // 4-Story Academic & Auditorium Building spanning across the road terminus (56m x 18m x 16m)
  const bldg = new THREE.Mesh(new THREE.BoxGeometry(56, 16, 18), mStone);
  bldg.position.set(0, 8.0, 0);
  g.add(bldg);

  // Cream quoining & cornices
  [4.0, 8.0, 12.0, 16.0].forEach(cy => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(57, 0.4, 19), mCream);
    c.position.set(0, cy, 0);
    g.add(c);
  });

  // Pitched slate roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(58, 4.0, 20), mRoof);
  roof.position.set(0, 18.0, 0);
  g.add(roof);

  // Central Clock Tower
  const tower = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 8), mCream);
  tower.position.set(0, 25.0, 0);
  g.add(tower);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(5.0, 8.0, 8), mGold);
  spire.position.set(0, 34.0, 0);
  g.add(spire);

  // Arched Windows on south facade (facing driver approaching from south)
  for (let f = 0; f < 4; f++) {
    for (let x = -24; x <= 24; x += 6) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.8), mGlass);
      win.position.set(x, 2.8 + f * 3.8, -9.05);
      win.rotation.y = Math.PI;
      g.add(win);
    }
  }

  // Grand Overhead Campus Dismissal Portal spanning across the road at Z = -16 (ahead of building)
  const portalW = 20, portalH = 8.5;
  [-portalW / 2, portalW / 2].forEach(px => {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(2.2, portalH, 2.2), mStone);
    pil.position.set(px, portalH / 2, -16);
    g.add(pil);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 2.6), mCream);
    cap.position.set(px, portalH + 0.2, -16);
    g.add(cap);

    const urn = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), mGold);
    urn.position.set(px, portalH + 0.8, -16);
    g.add(urn);
  });

  const span = new THREE.Mesh(new THREE.BoxGeometry(portalW, 1.8, 1.2), mStone);
  span.position.set(0, portalH - 0.4, -16);
  g.add(span);

  // Illuminated Canvas Banner on Portal
  if (typeof document !== 'undefined') {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 1024;
    pCanvas.height = 256;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      pCtx.fillStyle = '#0c2461';
      pCtx.fillRect(0, 0, 1024, 256);
      pCtx.lineWidth = 10;
      pCtx.strokeStyle = '#f1c40f';
      pCtx.strokeRect(8, 8, 1008, 240);

      pCtx.fillStyle = '#f1c40f';
      pCtx.font = 'bold 32px sans-serif';
      pCtx.textAlign = 'center';
      pCtx.fillText('★ ★ ★   WELCOME TO ST. XAVIER HIGH SCHOOL   ★ ★ ★', 512, 60);

      pCtx.fillStyle = '#ffffff';
      pCtx.font = '900 58px "Segoe UI", Arial, sans-serif';
      pCtx.fillText('🏁 CAMPUS DISMISSAL & PICKUP GATE', 512, 135);

      pCtx.fillStyle = '#facc15';
      pCtx.font = 'bold 32px sans-serif';
      pCtx.fillText('SAFE DISMISSAL PRECINCT  •  DRIVE WITH CARE', 512, 195);

      const pTex = new THREE.CanvasTexture(pCanvas);
      const pMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(portalW - 1.0, 2.4),
        new THREE.MeshBasicMaterial({ map: pTex, side: THREE.DoubleSide })
      );
      pMesh.position.set(0, portalH - 0.4, -16.65);
      pMesh.rotation.y = Math.PI; // Face driver coming from South
      g.add(pMesh);
    }
  }

  return g;
}

// ── 21. buildDistantSkylineBlock ─────────────────────────────────────────────
function buildDistantSkylineBlock(stories, width, depth, opts) {
  const b = new THREE.Group();
  b.name = 'DistantSkylineBlock';
  const { mWall, mStone, mSintex, mFence } = opts;
  const totalH = stories * 3.2;

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(depth, totalH, width), mWall);
  mainBody.position.set(0, totalH / 2, 0);
  b.add(mainBody);

  // Rooftop Elevator Machine Room
  const liftRoom = new THREE.Mesh(new THREE.BoxGeometry(depth * 0.45, 3.0, width * 0.35), mStone);
  liftRoom.position.set(0, totalH + 1.5, 0);
  b.add(liftRoom);

  // Rooftop Sintex Water Tanks
  [-width / 4, width / 4].forEach(tz => {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.5, 8), mSintex);
    tank.position.set(depth / 4, totalH + 0.75, tz);
    b.add(tank);
  });

  // Rooftop Cellular Antenna Mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 7.0, 6), mFence);
  mast.position.set(0, totalH + 6.5, 0);
  b.add(mast);

  return b;
}

// ── 22. buildCoveredScooterShed ──────────────────────────────────────────────
function buildCoveredScooterShed(len, opts) {
  const g = new THREE.Group();
  g.name = 'CoveredScooterShed';
  const { mFence, mTin, mWall } = opts;

  // Concrete Base Pad
  const pad = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 4.4), mWall);
  pad.position.set(0, 0.05, 0);
  g.add(pad);

  // Metal Frame Uprights
  for (let x = -len / 2 + 1; x <= len / 2 - 1; x += 4) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), mFence);
    p.position.set(x, 1.2, -1.8);
    g.add(p);
  }

  // Sloped Corrugated Blue/Tin Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(len + 0.6, 0.08, 4.6), mTin);
  roof.rotation.x = 0.12;
  roof.position.set(0, 2.4, 0);
  g.add(roof);

  return g;
}

// ── 23. buildSocietyGarden ───────────────────────────────────────────────────
function buildSocietyGarden(w, d, opts) {
  const g = new THREE.Group();
  g.name = 'SocietyGarden';
  const { mGrass, mWall, mFence, mBestRed } = opts;

  // Outer Lawn
  const lawn = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), mGrass);
  lawn.position.set(0, 0.05, 0);
  g.add(lawn);

  // Perimeter Walkway Path
  const path = new THREE.Mesh(new THREE.BoxGeometry(w - 6, 0.12, d - 6), mWall);
  path.position.set(0, 0.06, 0);
  g.add(path);

  const innerLawn = new THREE.Mesh(new THREE.BoxGeometry(w - 12, 0.14, d - 12), mGrass);
  innerLawn.position.set(0, 0.07, 0);
  g.add(innerLawn);

  // Children's Swing Set
  const swingA1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 6), mFence);
  swingA1.position.set(-6, 1.4, -4);
  swingA1.rotation.z = 0.2;
  g.add(swingA1);

  const swingA2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 6), mFence);
  swingA2.position.set(-2, 1.4, -4);
  swingA2.rotation.z = -0.2;
  g.add(swingA2);

  const swingBar = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.1, 0.1), mFence);
  swingBar.position.set(-4, 2.7, -4);
  g.add(swingBar);

  // Children's Slide
  const slideChute = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 3.4), mBestRed);
  slideChute.position.set(4, 1.2, -3);
  slideChute.rotation.x = -0.55;
  g.add(slideChute);

  return g;
}


// ═════════════════════════════════════════════════════════════════════════════
// PROCEDURAL CANVAS TEXTURE GENERATORS (Zero-GC, Instant WebGL Upload)
// ═════════════════════════════════════════════════════════════════════════════
function createAsphaltCanvasTexture() {
  if (typeof document === 'undefined') {return null;}
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Dark asphalt base
  ctx.fillStyle = '#2b3034';
  ctx.fillRect(0, 0, 512, 512);

  // Aggregate stone noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 32;
    d[i]   = Math.min(255, Math.max(0, d[i] + n));
    d[i+1] = Math.min(255, Math.max(0, d[i+1] + n));
    d[i+2] = Math.min(255, Math.max(0, d[i+2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // Tar repair crack lines
  ctx.strokeStyle = '#181b1d';
  ctx.lineWidth = 2.4;
  for (let c = 0; c < 6; c++) {
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    ctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      x += (Math.random() - 0.5) * 70;
      y += (Math.random() - 0.5) * 70;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Faint tire wear tracks
  ctx.fillStyle = 'rgba(18, 21, 23, 0.18)';
  ctx.fillRect(70, 0, 110, 512);
  ctx.fillRect(332, 0, 110, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 8);
  return tex;
}

function createSidewalkPaverTexture() {
  if (typeof document === 'undefined') {return null;}
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#dcdde1';
  ctx.fillRect(0, 0, 256, 256);

  const imgData = ctx.getImageData(0, 0, 256, 256);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    d[i]   = Math.max(0, Math.min(255, d[i] + n));
    d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
    d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // Concrete paver joint grid
  ctx.strokeStyle = '#b2bec3';
  ctx.lineWidth = 3;
  for (let p = 0; p <= 256; p += 64) {
    ctx.beginPath();
    ctx.moveTo(p, 0); ctx.lineTo(p, 256); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p); ctx.lineTo(256, p); ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 12);
  return tex;
}

function createBuildingFacadeTexture(baseColorHex, isHighrise) {
  if (typeof document === 'undefined') {return null;}
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseColorHex || '#e8dfd1';
  ctx.fillRect(0, 0, 512, 512);

  // Stucco noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    d[i]   = Math.max(0, Math.min(255, d[i] + n));
    d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
    d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  const rows = isHighrise ? 8 : 4;
  const cols = 6;
  const colW = 512 / cols;
  const rowH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    const y = r * rowH + 12;
    // Floor dividing molding
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * rowH);
    ctx.lineTo(512, r * rowH);
    ctx.stroke();

    for (let c = 0; c < cols; c++) {
      const x = c * colW + 12;
      const winW = colW - 24;
      const winH = rowH - 24;

      // Dark frame
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(x - 2, y - 2, winW + 4, winH + 4);

      // Glass with reflective sky tint
      const hasCurtain = (r + c) % 3 === 0;
      ctx.fillStyle = hasCurtain ? '#74b9ff' : '#0984e3';
      ctx.fillRect(x, y, winW, winH);

      // Mullion cross
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + winW / 2, y); ctx.lineTo(x + winW / 2, y + winH);
      ctx.moveTo(x, y + winH / 2); ctx.lineTo(x + winW, y + winH / 2);
      ctx.stroke();

      // Split AC outdoor unit under 35% of windows
      if ((r * 5 + c * 7) % 4 === 0) {
        ctx.fillStyle = '#dfe6e9';
        ctx.fillRect(x + winW * 0.2, y + winH + 3, winW * 0.6, 7);
        ctx.fillStyle = '#636e72';
        ctx.fillRect(x + winW * 0.55, y + winH + 4, winW * 0.2, 5);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createBasaltStoneTexture() {
  if (typeof document === 'undefined') {return null;}
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3d4144';
  ctx.fillRect(0, 0, 256, 256);

  const imgData = ctx.getImageData(0, 0, 256, 256);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 28;
    d[i]   = Math.max(0, Math.min(255, d[i] + n));
    d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
    d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  ctx.strokeStyle = '#222528';
  ctx.lineWidth = 2.4;
  const rowH = 32;
  for (let r = 0; r <= 256; r += rowH) {
    ctx.beginPath();
    ctx.moveTo(0, r); ctx.lineTo(256, r); ctx.stroke();
    const offset = (r / rowH % 2 === 0) ? 0 : 32;
    for (let c = offset; c <= 256; c += 64) {
      ctx.beginPath();
      ctx.moveTo(c, r); ctx.lineTo(c, r + rowH); ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);
  return tex;
}

// ── Procedural High-Resolution Organic Grass Texture ────────────────────────
function createGrassCanvasTexture() {
  if (typeof document === 'undefined') {return null;}
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Rich organic grass base (lush warm green with subtle hue variance)
  ctx.fillStyle = '#3a8a38';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle alternating lawn mower stripes
  ctx.fillStyle = 'rgba(46, 117, 44, 0.22)';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(0, y, 512, 32);
  }

  // Micro organic soil noise and blade tint variation
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 26;
    const gn = (Math.random() - 0.45) * 34;
    d[i]   = Math.max(0, Math.min(255, d[i] + n * 0.8));
    d[i+1] = Math.max(0, Math.min(255, d[i+1] + gn));
    d[i+2] = Math.max(0, Math.min(255, d[i+2] + n * 0.6));
  }
  ctx.putImageData(imgData, 0, 0);

  // Multitudes of individual organic grass blade flecks
  for (let b = 0; b < 2400; b++) {
    const bx = Math.random() * 512;
    const by = Math.random() * 512;
    const len = 3 + Math.random() * 6;
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 0.7;
    const shade = Math.random();
    ctx.strokeStyle = shade < 0.35 ? '#2d6a30' : (shade < 0.75 ? '#48a845' : '#7bc654');
    ctx.lineWidth = 1.0 + Math.random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(ang) * len, by + Math.sin(ang) * len);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(45, 45);
  return tex;
}
window.createGrassCanvasTexture = createGrassCanvasTexture;

// ── Crisp High-Resolution Society Signboard Texture ─────────────────────────
function createSocietySignCanvasTexture(mainText, subText) {
  if (typeof document === 'undefined') {return null;}
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Deep Royal Blue background with golden border
  ctx.fillStyle = '#0a3d62';
  ctx.fillRect(0, 0, 1024, 128);

  ctx.strokeStyle = '#f1c40f';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 1012, 116);
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, 1000, 104);

  // Main Society Name (Golden embossed lettering)
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 44px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(mainText, 512, 50);

  // Subtext (Registration / Location in crisp white)
  if (subText) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Arial", sans-serif';
    ctx.shadowBlur = 2;
    ctx.fillText(subText, 512, 94);
  }

  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// ── Shared Materials for Mumbai Nighttime Street Lighting ───────────────────
window._mumbaiStreetLampLens = new THREE.MeshLambertMaterial({
  color: 0xffffff,
  emissive: 0xffe066,
  emissiveIntensity: 0.15
});

window._mumbaiLightPoolMat = new THREE.MeshBasicMaterial({
  color: 0xffea88,
  transparent: true,
  opacity: 0.0,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

// ── Authentic Mumbai BMC Street Lamp with Cantilever Arm & Road Light Pool ───
function buildMumbaiStreetLamp(opts = {}) {
  const g = new THREE.Group();
  g.name = 'MumbaiStreetLamp';
  const mPole = opts.mPole || new THREE.MeshLambertMaterial({ color: 0x4b6584, roughness: 0.6, metalness: 0.4 });
  const mHead = opts.mHead || new THREE.MeshLambertMaterial({ color: 0x2f3640, roughness: 0.5 });
  const mLens = opts.mLens || window._mumbaiStreetLampLens;
  const poolMat = opts.mPool || window._mumbaiLightPoolMat;

  // Concrete Base Plinth (prevents water pooling)
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.5, 8), mPole);
  plinth.position.set(0, 0.25, 0);
  g.add(plinth);

  // Main Vertical Steel Mast (6.8m)
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 6.8, 10), mPole);
  mast.position.set(0, 3.9, 0);
  g.add(mast);

  // Curved Cantilever Outreach Arm (curves 2.8m out over the road lane)
  const armLen = 2.8;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, armLen), mPole);
  arm.position.set(0, 7.3, armLen / 2);
  arm.rotation.x = -0.10;
  g.add(arm);

  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.4), mPole);
  brace.position.set(0, 6.8, 0.7);
  brace.rotation.x = 0.5;
  g.add(brace);

  // Aerodynamic Cobra-Head Luminaire Fixture
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.95), mHead);
  head.position.set(0, 7.45, armLen);
  g.add(head);

  // Emissive Lamp Lens
  const lens = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.8), mLens);
  lens.position.set(0, 7.36, armLen);
  g.add(lens);

  // Soft Radial Road Light Pool Disc on Road Pavement
  const lightPool = new THREE.Mesh(new THREE.CircleGeometry(5.2, 16), poolMat);
  lightPool.rotation.x = -Math.PI / 2;
  lightPool.position.set(0, 0.04, armLen);
  g.add(lightPool);

  g.userData = {
    isStreetLamp: true,
    lensMesh: lens,
    poolMesh: lightPool,
    armOffset: armLen
  };

  return g;
}

// ── Continuous Society Compound Perimeter Boundary Wall ─────────────────────
function buildSocietyBoundaryWall(length, opts) {
  const g = new THREE.Group();
  g.name = 'SocietyBoundaryWall';
  const { mWall, mMetal } = opts;

  // Concrete Wall Base (1.4m high, 0.35m thick)
  const wallBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, length), mWall);
  wallBase.position.set(0, 0.7, length / 2);
  wallBase.receiveShadow = true;
  g.add(wallBase);

  // Concrete Wall Coping
  const coping = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, length), mWall);
  coping.position.set(0, 1.46, length / 2);
  g.add(coping);

  // Ornamental Black Steel Spearhead Vertical Railings (1.1m high on top)
  const railH = 1.1;
  const numPales = Math.floor(length / 0.5);
  for (let i = 0; i < numPales; i++) {
    const pz = i * 0.5 + 0.25;
    const pale = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, railH, 4), mMetal);
    pale.position.set(0, 1.52 + railH / 2, pz);
    g.add(pale);
    const spear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 4), mMetal);
    spear.position.set(0, 1.52 + railH + 0.07, pz);
    g.add(spear);
  }

  // Horizontal Support Bars for Railings
  [1.7, 2.5].forEach(ry => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, length), mMetal);
    bar.position.set(0, ry, length / 2);
    g.add(bar);
  });

  // Structural Pillars every 6m with Pyramid Caps
  for (let z = 0; z <= length; z += 6.0) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.7, 0.55), mWall);
    pil.position.set(0, 1.35, z);
    g.add(pil);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.35, 4), mWall);
    cap.rotation.y = Math.PI / 4;
    cap.position.set(0, 2.87, z);
    g.add(cap);
  }

  return g;
}

// ── BMC Segregated Twin Dustbins (Green = Wet, Blue = Dry) ──────────────────
function buildBmcTwinDustbins() {
  const g = new THREE.Group();
  g.name = 'BmcTwinDustbins';
  const mPole = new THREE.MeshLambertMaterial({ color: 0x718093, roughness: 0.5, metalness: 0.4 });
  const mGreen = new THREE.MeshLambertMaterial({ color: 0x10ac84, roughness: 0.6 });
  const mBlue = new THREE.MeshLambertMaterial({ color: 0x2e86de, roughness: 0.6 });

  // Central Mounting Post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), mPole);
  post.position.set(0, 0.6, 0);
  g.add(post);

  // Crossbar
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.8), mPole);
  cross.position.set(0, 0.95, 0);
  g.add(cross);

  // Green Wet Waste Bin
  const binG = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.65, 12), mGreen);
  binG.position.set(0, 0.75, -0.28);
  g.add(binG);

  // Blue Dry Waste Bin
  const binB = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.65, 12), mBlue);
  binB.position.set(0, 0.75, 0.28);
  g.add(binB);

  return g;
}

// ── Red Cast-Iron Municipal Fire Hydrant ─────────────────────────────────────
function buildFireHydrant() {
  const g = new THREE.Group();
  g.name = 'FireHydrant';
  const mRed = new THREE.MeshLambertMaterial({ color: 0xd63031, roughness: 0.5 });
  const mBrass = new THREE.MeshLambertMaterial({ color: 0xf39c12, roughness: 0.4, metalness: 0.5 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.75, 12), mRed);
  body.position.set(0, 0.38, 0);
  g.add(body);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), mRed);
  dome.position.set(0, 0.75, 0);
  g.add(dome);

  const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 6), mBrass);
  nut.position.set(0, 0.92, 0);
  g.add(nut);

  [-0.18, 0.18].forEach(nx => {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8), mBrass);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(nx, 0.52, 0);
    g.add(nozzle);
  });

  return g;
}

// ── Red India Post Pillar Letterbox ─────────────────────────────────────────
function buildIndiaPostLetterbox() {
  const g = new THREE.Group();
  g.name = 'IndiaPostLetterbox';
  const mPostRed = new THREE.MeshLambertMaterial({ color: 0xc0392b, roughness: 0.5 });
  const mBlack = new THREE.MeshLambertMaterial({ color: 0x1e272e, roughness: 0.6 });
  const mGold = new THREE.MeshBasicMaterial({ color: 0xf1c40f });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.2, 16), mBlack);
  base.position.set(0, 0.1, 0);
  g.add(base);

  const postBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.85, 16), mPostRed);
  postBody.position.set(0, 0.62, 0);
  g.add(postBody);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10), mPostRed);
  dome.position.set(0, 1.05, 0);
  g.add(dome);

  // Mail slot
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.18), mBlack);
  slot.position.set(0.21, 0.88, 0);
  g.add(slot);

  // India post gold emblem
  const logo = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.08), mGold);
  logo.position.set(0.22, 0.72, 0);
  g.add(logo);

  return g;
}

// ── Cast-Iron Sidewalk Tree Grate ───────────────────────────────────────────
function buildTreeGrate() {
  const g = new THREE.Group();
  g.name = 'TreeGrate';
  const mIron = new THREE.MeshLambertMaterial({ color: 0x2d3436, roughness: 0.7 });

  const grate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 1.6), mIron);
  grate.position.set(0, 0.165, 0);
  g.add(grate);

  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 16), new THREE.MeshLambertMaterial({ color: 0x4a2c11 }));
  hole.position.set(0, 0.17, 0);
  g.add(hole);

  return g;
}

// ── 24. buildVadaPavCart ─────────────────────────────────────────────────────
function buildVadaPavCart(opts) {
  const g = new THREE.Group();
  g.name = 'VadaPavCart';
  const { mWood, mMetal, mStripe, mCurbB } = opts;

  // Wooden Handcart Base
  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.4), mWood);
  cartBody.position.set(0, 0.8, 0);
  g.add(cartBody);

  // 4 Spoke Cart Wheels
  [-1.0, 1.0].forEach(wx => {
    [-0.75, 0.75].forEach(wz => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 10), mCurbB);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.35, wz);
      g.add(wheel);
    });
  });

  // Stainless Steel Frying Kadai (Wok)
  const kadai = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.25, 0.25, 12), mMetal);
  kadai.position.set(-0.5, 1.15, 0);
  g.add(kadai);

  // Chutney & Pav Bread Boxes
  const breadBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.8), mWood);
  breadBox.position.set(0.6, 1.15, 0);
  g.add(breadBox);

  // Striped Fabric Canopy Awning
  [-1.1, 1.1].forEach(px => {
    [-0.6, 0.6].forEach(pz => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), mMetal);
      pole.position.set(px, 1.9, pz);
      g.add(pole);
    });
  });

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.6), mStripe);
  canopy.position.set(0, 2.8, 0);
  g.add(canopy);

  return g;
}

// ── 25. buildCommercialHoarding ──────────────────────────────────────────────
function buildCommercialHoarding(w, h, textTitle, subText, opts) {
  const g = new THREE.Group();
  g.name = 'CommercialHoarding_' + textTitle.replace(/\s+/g, '_');
  const { mTruss, mBoard, mGold } = opts;

  // Steel Truss Legs (elevated 8m)
  [-w / 3, w / 3].forEach(lx => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 8.0, 8), mTruss);
    leg.position.set(lx, 4.0, 0);
    g.add(leg);

    // Diagonal Cross Brace
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 9.0, 6), mTruss);
    brace.position.set(0, 4.0, 0);
    brace.rotation.z = (lx > 0) ? 0.7 : -0.7;
    g.add(brace);
  });

  // Giant Billboard Board
  const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), mBoard);
  board.position.set(0, 8.0 + h / 2, 0);
  g.add(board);

  // Board Frame Lip
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, h + 0.6, 0.2), mTruss);
  frame.position.set(0, 8.0 + h / 2, -0.15);
  g.add(frame);

  // Overhead Floodlights
  for (let fx = -w / 2 + 2; fx <= w / 2 - 2; fx += w / 3) {
    const lampArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.2), mTruss);
    lampArm.position.set(fx, 8.0 + h + 0.3, 0.6);
    g.add(lampArm);

    const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.5), mGold);
    lampHead.position.set(fx, 8.0 + h + 0.3, 1.2);
    g.add(lampHead);
  }

  return g;
}

// ── 26. buildCoconutPalmTree ─────────────────────────────────────────────────
function buildCoconutPalmTree(height, opts) {
  const g = new THREE.Group();
  g.name = 'CoconutPalmTree';
  const { mBark, mFrond, mCoconut } = opts;

  // Curving segmented trunk
  const segs = 6;
  const segH = height / segs;
  let curY = 0;
  let curX = 0;
  for (let s = 0; s < segs; s++) {
    const lean = Math.sin((s / segs) * Math.PI) * 0.25;
    const trunkSeg = new THREE.Mesh(new THREE.CylinderGeometry(0.25 - s * 0.02, 0.3 - s * 0.02, segH, 8), mBark);
    trunkSeg.position.set(curX + lean / 2, curY + segH / 2, 0);
    trunkSeg.rotation.z = -lean * 0.5;
    g.add(trunkSeg);
    curY += segH;
    curX += lean;
  }

  // Radiating Coconut Palm Fronds
  const numFronds = 8;
  for (let f = 0; f < numFronds; f++) {
    const angle = (f / numFronds) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4.5, 4), mFrond);
    frond.position.set(curX + Math.cos(angle) * 1.8, curY - 0.5, Math.sin(angle) * 1.8);
    frond.rotation.x = Math.sin(angle) * 1.1;
    frond.rotation.z = -Math.cos(angle) * 1.1;
    g.add(frond);
  }

  // Cluster of Coconuts under crown
  for (let c = 0; c < 4; c++) {
    const cAng = (c / 4) * Math.PI * 2;
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), mCoconut);
    nut.position.set(curX + Math.cos(cAng) * 0.35, curY - 0.2, Math.sin(cAng) * 0.35);
    g.add(nut);
  }

  return g;
}

// ── 27. buildBmcWaterPipeline ────────────────────────────────────────────────
function buildBmcWaterPipeline(length, opts) {
  const g = new THREE.Group();
  g.name = 'BmcWaterPipeline';
  const { mBlue, mSteel, mRed } = opts;

  // Main Blue Water Pipe (0.6m diameter)
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, length, 12), mBlue);
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(0, 0.35, length / 2);
  g.add(pipe);

  // Flanges & Gate Valves every 15m
  for (let z = 5; z < length - 5; z += 15) {
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 12), mSteel);
    flange.rotation.x = Math.PI / 2;
    flange.position.set(0, 0.35, z);
    g.add(flange);

    // Circular Wheel Valve
    const valveStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), mSteel);
    valveStem.position.set(0, 0.7, z);
    g.add(valveStem);

    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 12), mRed);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0, 0.95, z);
    g.add(wheel);
  }

  return g;
}

// ── 28. buildBmcMunicipalBins ────────────────────────────────────────────────
function buildBmcMunicipalBins(opts) {
  const g = new THREE.Group();
  g.name = 'BmcMunicipalBins';
  const { mGreen, mBlue, mSteel } = opts;

  // Steel Mounting Frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.1), mSteel);
  frame.position.set(0, 0.5, 0);
  g.add(frame);

  // Green Bin (Wet Waste)
  const binG = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.85, 10), mGreen);
  binG.position.set(-0.45, 0.6, 0.2);
  g.add(binG);

  // Blue Bin (Dry Waste)
  const binB = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.85, 10), mBlue);
  binB.position.set(0.45, 0.6, 0.2);
  g.add(binB);

  return g;
}

// ── 29. buildModernHighriseSkyscraper (Matching Reference Image) ──────────
function buildModernHighriseSkyscraper(stories, width, depth, opts) {
  const g = new THREE.Group();
  g.name = 'ModernHighriseSkyscraper';
  const { mWall, mGlass, mMetal, mSintex } = opts;
  const storyH = 3.6;
  const totalH = stories * storyH;

  // Main High-Rise Shaft
  const tower = new THREE.Mesh(new THREE.BoxGeometry(width, totalH, depth), mWall);
  tower.position.set(0, totalH / 2, 0);
  tower.castShadow = true;
  tower.receiveShadow = true;
  g.add(tower);

  // Micro-details group for near LOD (< 80m)
  const detailGroup = new THREE.Group();
  detailGroup.name = 'tower_details';
  detailGroup.userData = { isMicroProp: true };

  // Floor Cornice Moldings and Split AC Units
  for (let fl = 1; fl < stories; fl++) {
    const y = fl * storyH;
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.22, depth + 0.4), mWall);
    cornice.position.set(0, y, 0);
    g.add(cornice);

    // Split AC outdoor compressor units below windows
    [-width / 3, 0, width / 3].forEach(acX => {
      const acUnit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.45), mMetal);
      acUnit.position.set(acX, y - 0.7, depth / 2 + 0.25);
      detailGroup.add(acUnit);

      const acUnitBack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.45), mMetal);
      acUnitBack.position.set(acX, y - 0.7, -depth / 2 - 0.25);
      detailGroup.add(acUnitBack);
    });
  }

  // ── Rooftop Mechanical Penthouse (Matching Reference Image) ──
  // Rooftop perimeter parapet wall
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 1.2, depth + 0.2), mWall);
  parapet.position.set(0, totalH + 0.6, 0);
  g.add(parapet);

  // Heavy Industrial HVAC Chiller Box with Dual Top Intake Fan Grilles
  const hvac = new THREE.Mesh(new THREE.BoxGeometry(width * 0.45, 1.8, depth * 0.4), mMetal);
  hvac.position.set(-width * 0.15, totalH + 0.9, -depth * 0.15);
  detailGroup.add(hvac);

  [-width * 0.22, -width * 0.08].forEach(fx => {
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 12), mSintex);
    fan.position.set(fx, totalH + 1.85, -depth * 0.15);
    detailGroup.add(fan);
  });

  // Elevator Motor Penthouse Bulkhead
  const penthouse = new THREE.Mesh(new THREE.BoxGeometry(width * 0.35, 3.2, depth * 0.35), mWall);
  penthouse.position.set(width * 0.2, totalH + 1.6, depth * 0.15);
  g.add(penthouse);

  // Twin Black Cylindrical Sintex Water Storage Tanks
  [-0.9, 0.9].forEach(tz => {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.8, 12), mSintex);
    tank.position.set(-width * 0.2, totalH + 1.0, depth * 0.2 + tz);
    detailGroup.add(tank);
  });

  // Steel Lattice Communications & Radio Mast Antenna
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 6.5, 6), mMetal);
  mast.position.set(width * 0.2, totalH + 3.2 + 3.25, depth * 0.15);
  detailGroup.add(mast);

  const redBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  redBeacon.position.set(width * 0.2, totalH + 3.2 + 6.5, depth * 0.15);
  detailGroup.add(redBeacon);

  g.add(detailGroup);
  return g;
}

// ── 30. buildMumbaiMetroViaduct & Train ─────────────────────────────────────
function buildMumbaiMetroViaduct(length, opts) {
  const g = new THREE.Group();
  g.name = 'MumbaiMetroViaduct';
  const { mPier, mDeck, mTrack, mTrainBody, mTrainStripe, mTrainGlass, mPantograph } = opts;

  const pierSpacing = 32;
  const deckHeight = 10.5;
  const deckWidth = 8.8;

  // Concrete Dual-Track Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(deckWidth, 1.2, length), mDeck);
  deck.position.set(0, deckHeight, length / 2);
  deck.receiveShadow = true;
  g.add(deck);

  // Side Acoustic Crash Barriers (Left & Right)
  [-deckWidth / 2 + 0.15, deckWidth / 2 - 0.15].forEach(bx => {
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.3, length), mDeck);
    barrier.position.set(bx, deckHeight + 1.1, length / 2);
    g.add(barrier);
  });

  // Center Deck Dividing Wall
  const divider = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, length), mDeck);
  divider.position.set(0, deckHeight + 0.8, length / 2);
  g.add(divider);

  // Elevated Concrete T-Pillars / Piers
  for (let z = 12; z <= length - 12; z += pierSpacing) {
    const pierCol = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, deckHeight - 0.6, 12), mPier);
    pierCol.position.set(0, (deckHeight - 0.6) / 2, z);
    pierCol.castShadow = true;
    g.add(pierCol);

    const pierCap = new THREE.Mesh(new THREE.BoxGeometry(deckWidth + 0.8, 1.4, 3.2), mPier);
    pierCap.position.set(0, deckHeight - 0.7, z);
    g.add(pierCap);
  }

  // Steel Metro Rails on Deck
  [-2.2, -1.2, 1.2, 2.2].forEach(rx => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, length), mTrack);
    rail.position.set(rx, deckHeight + 0.66, length / 2);
    g.add(rail);
  });

  // ── Sleek Modern 4-Car Mumbai Metro Train (Only added on segments with withTrain: true) ──
  if (opts && opts.withTrain) {
    const trainGrp = new THREE.Group();
    trainGrp.name = 'MumbaiMetroTrain';
    const numCars = 4;
    const carLength = 15.5;
    const carWidth = 3.0;
    const carHeight = 3.2;

    for (let c = 0; c < numCars; c++) {
      const car = new THREE.Group();
      const carZ = c * (carLength + 0.5);

      const carBody = new THREE.Mesh(new THREE.BoxGeometry(carWidth, carHeight, carLength), mTrainBody);
      carBody.position.set(-1.7, deckHeight + 0.7 + carHeight / 2, carZ);
      car.add(carBody);

      [-carWidth / 2 - 0.02, carWidth / 2 + 0.02].forEach(sx => {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, carLength), mTrainStripe);
        stripe.position.set(-1.7 + sx, deckHeight + 0.7 + carHeight * 0.55, carZ);
        car.add(stripe);

        for (let wz = -carLength / 2 + 2.0; wz <= carLength / 2 - 2.0; wz += 3.2) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.1), mTrainGlass);
          win.position.set(-1.7 + sx, deckHeight + 0.7 + carHeight * 0.6, carZ + wz);
          win.rotation.y = (sx > 0) ? Math.PI / 2 : -Math.PI / 2;
          car.add(win);
        }
      });

      if (c === 0) {
        const nose = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.4, 4), mTrainStripe);
        nose.rotation.x = Math.PI / 2;
        nose.rotation.y = Math.PI / 4;
        nose.position.set(-1.7, deckHeight + 0.7 + carHeight * 0.45, carZ - carLength / 2 - 1.0);
        car.add(nose);

        [-0.7, 0.7].forEach(hx => {
          const light = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
          light.position.set(-1.7 + hx, deckHeight + 0.7 + 0.9, carZ - carLength / 2 - 1.2);
          car.add(light);
        });
      }

      const acPod = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 6.0), mTrainBody);
      acPod.position.set(-1.7, deckHeight + 0.7 + carHeight + 0.22, carZ);
      car.add(acPod);

      if (c === 1 || c === 3) {
        const panto = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), mPantograph);
        panto.rotation.z = Math.PI / 4;
        panto.position.set(-1.7, deckHeight + 0.7 + carHeight + 0.9, carZ);
        car.add(panto);
      }

      trainGrp.add(car);
    }

    trainGrp.position.z = 2.0;
    g.add(trainGrp);
  }

  return g;
}

// ── 31. buildSuburbanRailwayCorridor & Local Train ─────────────────────────
function buildSuburbanRailwayCorridor(length, opts) {
  const g = new THREE.Group();
  g.name = 'SuburbanRailwayCorridor';
  const { mBallast, mSleepers, mRails, mLocalBody, mLocalCream, mLocalRoof, mCatenary } = opts;

  const trackW = 10.0;
  const ballast = new THREE.Mesh(new THREE.BoxGeometry(trackW, 0.35, length), mBallast);
  ballast.position.set(0, 0.17, length / 2);
  ballast.receiveShadow = true;
  g.add(ballast);

  const sleeperSpacing = 1.8;
  const numSleepers = Math.floor(length / sleeperSpacing);

  for (let i = 0; i < numSleepers; i++) {
    const sz = i * sleeperSpacing + 0.9;
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 0.3), mSleepers);
    s1.position.set(-2.4, 0.38, sz);
    g.add(s1);

    const s2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 0.3), mSleepers);
    s2.position.set(2.4, 0.38, sz);
    g.add(s2);
  }

  [-3.2, -1.6, 1.6, 3.2].forEach(rx => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, length), mRails);
    rail.position.set(rx, 0.52, length / 2);
    g.add(rail);
  });

  for (let z = 20; z <= length - 20; z += 45) {
    [-trackW / 2 - 0.6, trackW / 2 + 0.6].forEach(px => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 7.8, 6), mCatenary);
      mast.position.set(px, 3.9, z);
      g.add(mast);
    });

    const portalBeam = new THREE.Mesh(new THREE.BoxGeometry(trackW + 1.6, 0.25, 0.25), mCatenary);
    portalBeam.position.set(0, 7.6, z);
    g.add(portalBeam);
  }

  // ── 6-Car Mumbai Suburban EMU Local Train (Only added on segments with withTrain: true) ──
  if (opts && opts.withTrain) {
    const trainGrp = new THREE.Group();
    trainGrp.name = 'MumbaiLocalTrain';
    const numCars = 6;
    const carLen = 16.0;
    const carW = 3.2;
    const carH = 3.4;

    for (let c = 0; c < numCars; c++) {
      const car = new THREE.Group();
      const carZ = c * (carLen + 0.6);

      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(carW, carH * 0.55, carLen), mLocalBody);
      lowerBody.position.set(2.4, 0.5 + (carH * 0.55) / 2, carZ);
      car.add(lowerBody);

      const upperBand = new THREE.Mesh(new THREE.BoxGeometry(carW, carH * 0.45, carLen), mLocalCream);
      upperBand.position.set(2.4, 0.5 + carH * 0.55 + (carH * 0.45) / 2, carZ);
      car.add(upperBand);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(carW + 0.2, 0.35, carLen + 0.2), mLocalRoof);
      roof.position.set(2.4, 0.5 + carH + 0.17, carZ);
      car.add(roof);

      [-carLen / 3, 0, carLen / 3].forEach(dz => {
        [-carW / 2 - 0.02, carW / 2 + 0.02].forEach(dx => {
          const doorVoid = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.2), mBallast);
          doorVoid.position.set(2.4 + dx, 0.5 + 1.2, carZ + dz);
          doorVoid.rotation.y = (dx > 0) ? Math.PI / 2 : -Math.PI / 2;
          car.add(doorVoid);
        });
      });

      if (c === 0 || c === 2 || c === 5) {
        const panto = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.4), mCatenary);
        panto.position.set(2.4, 0.5 + carH + 0.6, carZ);
        car.add(panto);
      }

      trainGrp.add(car);
    }

    trainGrp.position.z = 2.0;
    g.add(trainGrp);
  }

  return g;
}

// ── 32. buildPublicCityPark & Botanical Gardens ─────────────────────────────
function buildPublicCityPark(width, depth, opts) {
  const p = new THREE.Group();
  p.name = 'PublicCityPark';
  const { mGrass, mPaving, mFountainStone, mWater, mGazeboRoof, mGazeboPillar, mFlowerYellow, mFlowerRed, mTreeBark, mLeaf } = opts;

  const lawn = new THREE.Mesh(new THREE.BoxGeometry(width, 0.16, depth), mGrass);
  lawn.position.set(0, 0.08, 0);
  lawn.receiveShadow = true;
  p.add(lawn);

  const pathW = 4.2;
  const pathZ = new THREE.Mesh(new THREE.BoxGeometry(pathW, 0.18, depth), mPaving);
  pathZ.position.set(0, 0.09, 0);
  p.add(pathZ);

  const pathX = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, pathW), mPaving);
  pathX.position.set(0, 0.09, 0);
  p.add(pathX);

  // Central Ornamental 3-Tier Water Fountain
  const fountainGrp = new THREE.Group();
  fountainGrp.position.set(0, 0.18, 0);

  const basin1 = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 0.7, 24), mFountainStone);
  basin1.position.y = 0.35;
  fountainGrp.add(basin1);

  const water1 = new THREE.Mesh(new THREE.CircleGeometry(4.8, 24), mWater);
  water1.rotation.x = -Math.PI / 2;
  water1.position.y = 0.68;
  fountainGrp.add(water1);

  const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 1.4, 16), mFountainStone);
  pillar1.position.y = 1.35;
  fountainGrp.add(pillar1);

  const basin2 = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.1, 0.5, 20), mFountainStone);
  basin2.position.y = 2.1;
  fountainGrp.add(basin2);

  const water2 = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20), mWater);
  water2.rotation.x = -Math.PI / 2;
  water2.position.y = 2.36;
  fountainGrp.add(water2);

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), mFountainStone);
  finial.position.y = 2.9;
  fountainGrp.add(finial);

  p.add(fountainGrp);

  // Classical Park Gazebo Pavilion
  const gazebo = new THREE.Group();
  gazebo.position.set(width * 0.28, 0.18, depth * 0.28);

  const gFloor = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.8, 0.4, 8), mFountainStone);
  gFloor.position.y = 0.2;
  gazebo.add(gFloor);

  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const px = Math.cos(ang) * 3.8;
    const pz = Math.sin(ang) * 3.8;
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.2, 8), mGazeboPillar);
    pil.position.set(px, 1.8, pz);
    gazebo.add(pil);
  }

  const gRoof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.2, 8), mGazeboRoof);
  gRoof.position.y = 4.4;
  gazebo.add(gRoof);

  p.add(gazebo);

  // Concentric Blooming Flowerbeds
  [[-width * 0.28, -depth * 0.28], [width * 0.28, -depth * 0.28], [-width * 0.28, depth * 0.28]].forEach(([bx, bz]) => {
    const bed = new THREE.Group();
    bed.position.set(bx, 0.18, bz);

    const stoneRing = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.35, 6, 24), mFountainStone);
    stoneRing.rotation.x = Math.PI / 2;
    bed.add(stoneRing);

    for (let f = 0; f < 12; f++) {
      const ang = (f / 12) * Math.PI * 2;
      const fMat = (f % 2 === 0) ? mFlowerYellow : mFlowerRed;
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), fMat);
      flower.position.set(Math.cos(ang) * 2.6, 0.25, Math.sin(ang) * 2.6);
      bed.add(flower);
    }
    p.add(bed);
  });

  // Perimeter Trees
  for (let x = -width / 2 + 8; x <= width / 2 - 8; x += 22) {
    const tN = buildGulmoharTree(mTreeBark, mLeaf, mFlowerRed);
    tN.position.set(x, 0.18, -depth / 2 + 5);
    p.add(tN);

    const tS = buildGulmoharTree(mTreeBark, mLeaf, mFlowerRed);
    tS.position.set(x, 0.18, depth / 2 - 5);
    p.add(tS);
  }

  return p;
}

window.createSuburbanNeighborhood = createSuburbanNeighborhood;
})();
