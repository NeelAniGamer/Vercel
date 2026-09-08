/**
 * suburban_scenery.js
 * High-fidelity Low-Poly Suburban Residential Avenue Generator for Mumbai Traffic Hero
 * Recreates the exact vibrant aesthetic from the reference screenshot:
 * - Asphalt road with dashed center line, manhole covers, and storm sewer drain grates
 * - Light concrete sidewalks with chamfered curbs and sloped driveway curb cuts
 * - Green front lawns, cobblestone/flagstone paved driveways and walkway paths
 * - Stylized low-poly houses (including new imported GLB mansion & isometric houses)
 * - Boxwood property dividing hedges, rear wooden fences, flower beds, low-poly trees
 * - Suburban mailboxes on posts, red fire hydrants, metal trash cans, porch benches, and parked driveway cars
 */

(function () {
  'use strict';

  function createSuburbanNeighborhood(game, cfg) {
    const scene = game.scene;
    if (!scene) return;

    const group = new THREE.Group();
    group.name = 'SuburbanNeighborhoodScenery';

    // Materials Palette (Low-poly Vibrant Shading)
    const mRoad = new THREE.MeshLambertMaterial({ color: 0x3d4449, roughness: 0.85 });
    const mCenterLine = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
    const mManhole = new THREE.MeshLambertMaterial({ color: 0x2d3436, roughness: 0.6 });
    const mManholeInner = new THREE.MeshLambertMaterial({ color: 0x1e272e, roughness: 0.7 });
    const mDrainGrate = new THREE.MeshLambertMaterial({ color: 0x1e272e, roughness: 0.5 });
    const mSidewalk = new THREE.MeshLambertMaterial({ color: 0xdcdde1, roughness: 0.9 });
    const mCurbRamp = new THREE.MeshLambertMaterial({ color: 0xc8d6e5, roughness: 0.9 });
    const mGrass = new THREE.MeshLambertMaterial({ color: 0x44bd32, roughness: 0.9 });
    const mHedge = new THREE.MeshLambertMaterial({ color: 0x2ed573, roughness: 0.8 });
    const mFence = new THREE.MeshLambertMaterial({ color: 0xb7791f, roughness: 0.8 });
    const mStoneDriveway = new THREE.MeshLambertMaterial({ color: 0x8395a7, roughness: 0.8 });
    const mSteppingStone = new THREE.MeshLambertMaterial({ color: 0xecf0f1, roughness: 0.85 });
    const mWoodBrown = new THREE.MeshLambertMaterial({ color: 0x8d6e63, roughness: 0.75 });
    const mRedCabin = new THREE.MeshLambertMaterial({ color: 0x8b3a2a, roughness: 0.7 });
    const mRedRoof = new THREE.MeshLambertMaterial({ color: 0x9b2226, roughness: 0.6 });
    const mGreenRoof = new THREE.MeshLambertMaterial({ color: 0x2d6a4f, roughness: 0.6 });
    const mHousePurple = new THREE.MeshLambertMaterial({ color: 0x686de0, roughness: 0.7 });
    const mWindowGlass = new THREE.MeshBasicMaterial({ color: 0x70a1ff });
    const mWindowFrame = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const mRedDoor = new THREE.MeshLambertMaterial({ color: 0xd63031 });
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

    // Road Dimensions
    const roadWidth = 14;
    const halfRoad = roadWidth / 2;
    const roadLength = (cfg.roadLength || 320);
    const sidewalkWidth = 3.6;
    const sidewalkHeight = 0.16;
    const lotSpacing = 38; // spacing between houses along Z
    const numLotsPerSide = Math.floor(roadLength / lotSpacing);
    const lotDepth = 35;
    const startZ = -roadLength / 2 + lotSpacing / 2;

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
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.24, dashLength), mCenterLine);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.02, z);
      group.add(dash);
    }

    // ── 3. Manhole Covers along the road center ─────────────────────────────
    const manholeInterval = 45;
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

      manholeGrp.position.set((Math.random() - 0.5) * 1.5, 0.015, z);
      group.add(manholeGrp);
    }

    // ── 4. Sidewalks & Curbs (Left & Right Sides) ────────────────────────────
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
        new THREE.MeshLambertMaterial({ color: 0xb2bec3 })
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

        // Driveway Curb Cut
        const curbRamp = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, sidewalkHeight, 3.8),
          mCurbRamp
        );
        curbRamp.position.set(xSign * (halfRoad + 0.6), sidewalkHeight / 2 - 0.04, lotZ - 4);
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

        // Cobblestone / Flagstone Paved Driveway leading to garage / parking
        const drivewayWidth = 4.2;
        const drivewayLength = 18;
        const drivewayX = xSign * (halfRoad + sidewalkWidth + drivewayLength / 2);
        const drivewayZ = lotZ - 4;

        const drivewayMesh = new THREE.Mesh(
          new THREE.BoxGeometry(drivewayLength, 0.15, drivewayWidth),
          mStoneDriveway
        );
        drivewayMesh.position.set(drivewayX, 0.075, drivewayZ);
        drivewayMesh.receiveShadow = true;
        group.add(drivewayMesh);

        // Stone Pavers detail (flagstone pattern)
        for (let px = -drivewayLength / 2 + 1; px < drivewayLength / 2 - 1; px += 1.6) {
          for (let pz = -drivewayWidth / 2 + 0.8; pz < drivewayWidth / 2 - 0.8; pz += 1.2) {
            const stone = new THREE.Mesh(
              new THREE.BoxGeometry(1.2 + (Math.random() - 0.5) * 0.3, 0.02, 0.8 + (Math.random() - 0.5) * 0.2),
              mSteppingStone
            );
            stone.position.set(drivewayX + px, 0.155, drivewayZ + pz);
            group.add(stone);
          }
        }

        // Stepping Stone Walkway from sidewalk to Front Porch
        const walkwayZ = lotZ + 3.5;
        for (let stepX = halfRoad + sidewalkWidth + 1.2; stepX < halfRoad + sidewalkWidth + 12; stepX += 1.4) {
          const step = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 1.2), mSteppingStone);
          step.position.set(xSign * stepX, 0.155, walkwayZ);
          group.add(step);
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
          new THREE.BoxGeometry(1.2, 0.9, 8),
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

        // Low-Poly Trees in the front yard
        const treeX = xSign * (halfRoad + sidewalkWidth + 4.5 + Math.random() * 2.5);
        const treeZ = lotZ + (Math.random() > 0.5 ? 7 : -9);
        const tree = buildLowPolySuburbanTree(mTreeBark, i % 2 === 0 ? mTreeFoliage : mTreeFoliage2);
        tree.position.set(treeX, 0, treeZ);
        group.add(tree);

        // Flower Beds (Blue and Red flowers near walkway)
        const flowerGroup = buildFlowerBed(mFlowerBlue, mFlowerRed, mFlowerStem);
        flowerGroup.position.set(xSign * (halfRoad + sidewalkWidth + 3.0), 0.15, walkwayZ + (xSign > 0 ? 1.5 : -1.5));
        group.add(flowerGroup);

        // Street Furniture Props: Mailbox near driveway
        const mailbox = buildSuburbanMailbox(mMailboxPost, mMailboxBox, mMailboxFlag);
        mailbox.position.set(xSign * (halfRoad + sidewalkWidth - 0.5), 0, drivewayZ + (xSign > 0 ? 2.5 : -2.5));
        if (xSign < 0) mailbox.rotation.y = Math.PI;
        group.add(mailbox);

        // Red Fire Hydrant on sidewalk (every other lot)
        if (i % 2 === 0) {
          const hydrant = buildFireHydrant(mHydrantRed);
          hydrant.position.set(xSign * (halfRoad + 0.6), 0.16, lotZ + 12);
          group.add(hydrant);
        }

        // Metal Trash Can on sidewalk
        const trashCan = buildTrashCan(mTrashMetal);
        trashCan.position.set(xSign * (halfRoad + sidewalkWidth - 0.6), 0.16, lotZ - 9);
        group.add(trashCan);

        // ── 7. House Architecture Placement ──────────────────────────────────
        const houseX = xSign * (halfRoad + sidewalkWidth + 14);
        const houseZ = lotZ;
        const houseVariant = (i + (side > 0 ? 1 : 0)) % 4;

        let houseMesh = null;
        const PM = window.PRELOADED_MODELS || {};

        if (houseVariant === 0 && (PM.house_lowpoly_isometric || PM.free__house_low_poly_isometric)) {
          // Imported GLB Isometric Modern House
          const base = PM.house_lowpoly_isometric || PM.free__house_low_poly_isometric;
          houseMesh = base.clone(true);
          normalizeHouseScale(houseMesh, 14, 8, 12);
          houseMesh.rotation.y = xSign > 0 ? -Math.PI / 2 : Math.PI / 2;
          houseMesh.position.set(houseX, 0.14, houseZ);
        } else if (houseVariant === 1 && (PM.house_mansion_lowpoly || PM.low_poly_mansion__house)) {
          // Imported GLB Mansion / Villa
          const base = PM.house_mansion_lowpoly || PM.low_poly_mansion__house;
          houseMesh = base.clone(true);
          normalizeHouseScale(houseMesh, 16, 9, 14);
          houseMesh.rotation.y = xSign > 0 ? -Math.PI / 2 : Math.PI / 2;
          houseMesh.position.set(houseX, 0.14, houseZ);
        } else if (houseVariant === 2) {
          // Red Log Cabin with Porch & Shingled Roof (from screenshot)
          houseMesh = buildRedCabinHouse(mRedCabin, mRedRoof, mWoodBrown, mWindowGlass, mWindowFrame, mRedDoor);
          houseMesh.rotation.y = xSign > 0 ? -Math.PI / 2 : Math.PI / 2;
          houseMesh.position.set(houseX, 0.14, houseZ);
        } else {
          // Purple/Lilac Cottage with Green Shingle Roof & Front Porch (from screenshot)
          houseMesh = buildGreenRoofCottage(mHousePurple, mGreenRoof, mWoodBrown, mWindowGlass, mWindowFrame, mRedDoor);
          houseMesh.rotation.y = xSign > 0 ? -Math.PI / 2 : Math.PI / 2;
          houseMesh.position.set(houseX, 0.14, houseZ);

          // Parked compact car in driveway
          const parkedCar = buildLowPolyParkedCar();
          parkedCar.position.set(drivewayX, 0.16, drivewayZ);
          parkedCar.rotation.y = xSign > 0 ? -Math.PI / 2 : Math.PI / 2;
          group.add(parkedCar);
        }

        if (houseMesh) {
          houseMesh.castShadow = true;
          houseMesh.receiveShadow = true;
          group.add(houseMesh);
        }
      }
    });

    scene.add(group);
    return group;
  }

  // ── Helper Sub-Builders ───────────────────────────────────────────────────

  function normalizeHouseScale(obj, targetW, targetH, targetD) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.z);
    const scale = targetW / (maxDim || 1);
    obj.scale.set(scale, scale, scale);

    obj.updateMatrixWorld(true);
    box.setFromObject(obj);
    obj.position.y -= box.min.y;
  }

  function buildLowPolySuburbanTree(mTrunk, mFoliage) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 3.2, 5), mTrunk);
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    tree.add(trunk);

    const foliageCluster1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 0), mFoliage);
    foliageCluster1.position.set(0, 3.8, 0);
    foliageCluster1.castShadow = true;
    tree.add(foliageCluster1);

    const foliageCluster2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), mFoliage);
    foliageCluster2.position.set(0.6, 4.6, -0.4);
    foliageCluster2.castShadow = true;
    tree.add(foliageCluster2);

    const foliageCluster3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), mFoliage);
    foliageCluster3.position.set(-0.7, 4.2, 0.5);
    foliageCluster3.castShadow = true;
    tree.add(foliageCluster3);

    return tree;
  }

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

  function buildRedCabinHouse(mWall, mRoof, mWood, mGlass, mFrame, mDoor) {
    const house = new THREE.Group();

    const body = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 7), mWall);
    body.position.set(0, 2.25, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    house.add(body);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 3.2, 4), mRoof);
    roof.position.set(0, 6.0, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    const porch = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 3), mWood);
    porch.position.set(0, 0.15, 4.8);
    house.add(porch);

    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.25, 3.2), mRoof);
    porchRoof.position.set(0, 3.0, 4.8);
    house.add(porchRoof);

    [-2.6, 2.6].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 0.2), mWood);
      pillar.position.set(px, 1.5, 6.0);
      house.add(pillar);
    });

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 0.1), mDoor);
    door.position.set(0, 1.45, 3.55);
    house.add(door);

    [-3.0, 3.0].forEach(wx => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.15), mGlass);
      win.position.set(wx, 2.4, 3.55);
      house.add(win);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 0.08), mFrame);
      frame.position.set(wx, 2.4, 3.52);
      house.add(frame);
    });

    return house;
  }

  function buildGreenRoofCottage(mWall, mRoof, mWood, mGlass, mFrame, mDoor) {
    const house = new THREE.Group();

    const bodyLower = new THREE.Mesh(new THREE.BoxGeometry(9, 4.0, 8), mWall);
    bodyLower.position.set(0, 2.0, 0);
    bodyLower.castShadow = true;
    bodyLower.receiveShadow = true;
    house.add(bodyLower);

    const bodyUpper = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 6), mWall);
    bodyUpper.position.set(0, 5.2, 0);
    bodyUpper.castShadow = true;
    house.add(bodyUpper);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.8, 3.0, 4), mRoof);
    roof.position.set(0, 7.8, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    const porch = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.3, 2.8), mWood);
    porch.position.set(0, 0.15, 5.2);
    house.add(porch);

    const bench = new THREE.Group();
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.6), mFrame);
    benchSeat.position.set(0, 0.5, 0);
    bench.add(benchSeat);
    const benchBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.06), mFrame);
    benchBack.position.set(0, 0.8, -0.28);
    bench.add(benchBack);
    bench.position.set(-1.6, 0.15, 5.2);
    house.add(bench);

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.5, 0.1), mDoor);
    door.position.set(1.2, 1.4, 4.05);
    house.add(door);

    [-2.5, 2.5].forEach(wx => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.15), mGlass);
      win.position.set(wx, 2.2, 4.05);
      house.add(win);
    });

    return house;
  }

  function buildLowPolyParkedCar() {
    const car = new THREE.Group();
    const mCarBody = new THREE.MeshLambertMaterial({ color: 0x0984e3 });
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
