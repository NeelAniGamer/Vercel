import * as THREE from 'three';
import { VehicleType, VehicleCustomization } from '../types';

export class VehicleFactory {
  static createVehicle(
    type: VehicleType = 'sports_gt',
    custom?: Partial<VehicleCustomization> | number
  ): THREE.Group {
    const group = new THREE.Group();

    const customObj: VehicleCustomization = typeof custom === 'number'
      ? { bodyColor: custom, rimColor: 0xe2e8f0, caliperColor: 0xdc2626, hasSplitter: true, hasWing: true }
      : {
          bodyColor: custom?.bodyColor ?? 0x2563eb,
          rimColor: custom?.rimColor ?? 0xe2e8f0,
          caliperColor: custom?.caliperColor ?? 0xdc2626,
          hasSplitter: custom?.hasSplitter ?? true,
          hasWing: custom?.hasWing ?? true
        };

    switch (type) {
      case 'sports_gt':
      case 'supercar': {
        const bodyM = new THREE.MeshToonMaterial({ color: customObj.bodyColor });
        const carbonM = new THREE.MeshToonMaterial({ color: 0x111827 });
        const glassM = new THREE.MeshToonMaterial({ color: 0x0f172a, transparent: true, opacity: 0.88 });
        const wheelM = new THREE.MeshToonMaterial({ color: 0x09090b });
        const rimM = new THREE.MeshToonMaterial({ color: customObj.rimColor });
        const brakeM = new THREE.MeshToonMaterial({ color: customObj.caliperColor });
        const hlM = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
        const tlM = new THREE.MeshBasicMaterial({ color: 0xff1e1e });

        // Low widebody sports chassis
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.42, 4.2), bodyM);
        body.position.y = 0.38;
        body.castShadow = true;
        body.userData = { isMainHull: true };
        group.add(body);

        // Front carbon aerodynamic splitter
        if (customObj.hasSplitter) {
          const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.08, 0.5), carbonM);
          splitter.position.set(0, 0.20, 2.05);
          splitter.castShadow = true;
          group.add(splitter);
        }

        // Smoked fastback glass cockpit
        const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.38, 2.1), glassM);
        cab.position.set(0, 0.74, -0.1);
        group.add(cab);

        // Carbon fiber roof panel
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 1.4), carbonM);
        roof.position.set(0, 0.94, -0.15);
        group.add(roof);

        // Rear aerodynamic ducktail spoiler
        if (customObj.hasWing) {
          const wing = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.06, 0.35), carbonM);
          wing.position.set(0, 0.68, -2.0);
          group.add(wing);
        }

        // Dual chrome exhaust tips
        const exhM = new THREE.MeshToonMaterial({ color: 0xcccccc });
        ;[-0.45, 0.45].forEach(ex => {
          const exh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.25, 8), exhM);
          exh.rotation.x = Math.PI / 2;
          exh.position.set(ex, 0.22, -2.12);
          group.add(exh);
        });

        // Sports alloy wheels with brake calipers
        ;[
          [0.92, 0, 1.3],
          [-0.92, 0, 1.3],
          [0.92, 0, -1.3],
          [-0.92, 0, -1.3]
        ].forEach(([x, , z]) => {
          const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 12), wheelM);
          wh.rotation.z = Math.PI / 2;
          wh.position.set(x, 0.32, z);
          wh.castShadow = true;
          group.add(wh);

          const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.26, 6), rimM);
          rim.rotation.z = Math.PI / 2;
          rim.position.set(x, 0.32, z);
          group.add(rim);

          const cal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.12), brakeM);
          cal.position.set(x > 0 ? x - 0.06 : x + 0.06, 0.38, z + 0.08);
          group.add(cal);
        });

        // Xenon projector headlights & ruby rear lightbar
        const lights: [number, number, number, THREE.Material, [number, number, number]][] = [
          [0.65, 0.42, 2.11, hlM, [0.28, 0.08, 0.04]],
          [-0.65, 0.42, 2.11, hlM, [0.28, 0.08, 0.04]],
          [0, 0.46, -2.11, tlM, [1.5, 0.06, 0.04]]
        ];
        lights.forEach(([x, y, z, m, dims]) => {
          const l = new THREE.Mesh(new THREE.BoxGeometry(dims[0], dims[1], dims[2]), m);
          l.position.set(x, y, z);
          group.add(l);
        });

        break;
      }

      case 'taxi': {
        const bodyM = new THREE.MeshToonMaterial({ color: 0xffd54a });
        const roofM = new THREE.MeshToonMaterial({ color: 0x111111 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.55, 3.8), bodyM);
        body.position.y = 0.45;
        body.castShadow = true;
        group.add(body);

        const cab = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.45, 1.9), roofM);
        cab.position.set(0, 0.90, 0);
        group.add(cab);
        break;
      }

      default: {
        const bodyM = new THREE.MeshToonMaterial({ color: customObj.bodyColor });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 3.9), bodyM);
        body.position.y = 0.42;
        body.castShadow = true;
        group.add(body);
        break;
      }
    }

    return group;
  }

  static createParkedCar(seed = 0): THREE.Group {
    const palette = [0x2563eb, 0xdc2626, 0x16a34a, 0xf59e0b, 0x0284c7, 0x7c3aed];
    const col = palette[seed % palette.length];
    return this.createVehicle('sports_gt', col);
  }
}
