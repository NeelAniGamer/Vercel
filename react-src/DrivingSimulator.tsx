import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { WebGPURenderer } from 'three/webgpu';
import { VEHICLE_STATS, LevelConfig, GameState, CORRECTIVE_QUIZ, RoadSegment, NPC, CollisionBox } from "./types";

const THEME_CONFIGS: Record<string, any> = {
  urban_grid: {
    name: 'Urban Grid', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car',
    roads: [
      { type:'v', x:-360, z1:-480, z2:480 }, { type:'v', x:-240, z1:-480, z2:480 },
      { type:'v', x:-120, z1:-480, z2:480 }, { type:'v', x:0,    z1:-480, z2:480 },
      { type:'v', x:120,  z1:-480, z2:480 }, { type:'v', x:240,  z1:-480, z2:480 },
      { type:'v', x:360,  z1:-480, z2:480 },
      { type:'h', z:-480, x1:-360, x2:360 }, { type:'h', z:-360, x1:-360, x2:360 },
      { type:'h', z:-240, x1:-360, x2:360 }, { type:'h', z:-120, x1:-360, x2:360 },
      { type:'h', z:0,    x1:-360, x2:360 }, { type:'h', z:120,  x1:-360, x2:360 },
      { type:'h', z:240,  x1:-360, x2:360 }, { type:'h', z:360,  x1:-360, x2:360 },
      { type:'h', z:480,  x1:-360, x2:360 }
    ],
    route: [{ x:0,z:-480 },{ x:0,z:-360 },{ x:0,z:-240 },{ x:0,z:-120 },{ x:0,z:0 },{ x:0,z:120 },{ x:0,z:240 },{ x:0,z:360 },{ x:0,z:480 },
            { x:120,z:480 },{ x:240,z:480 },{ x:360,z:480 },{ x:360,z:360 },{ x:360,z:240 },{ x:360,z:120 },{ x:360,z:0 },{ x:360,z:-120 },{ x:360,z:-240 },{ x:360,z:-360 },{ x:360,z:-480 }]
  },
  signal_jump: {
    name: 'Signal Junction', sky: 0x87b6d8, fog: 550, ground: 0x33691e, amb: 0.8, veh: 'car',
    roads: [
      { type:'v', x:0,    z1:-600, z2:600 }, { type:'v', x:-240, z1:-480, z2:480 }, { type:'v', x:240, z1:-480, z2:480 },
      { type:'h', z:0,    x1:-600, x2:600 }, { type:'h', z:-240, x1:-480, x2:480 }, { type:'h', z:240, x1:-480, x2:480 }
    ],
    route: [{ x:0,z:-480 },{ x:0,z:-240 },{ x:0,z:0 },{ x:0,z:240 },{ x:0,z:480 },
            { x:240,z:480 },{ x:240,z:240 },{ x:240,z:0 },{ x:240,z:-240 },{ x:240,z:-480 },
            { x:-240,z:-480 },{ x:-240,z:-240 },{ x:-240,z:0 },{ x:-240,z:240 },{ x:-240,z:480 }]
  }
};

export default function DrivingSimulator() {
  const mountRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>("Initializing WebGPU…");
  const [unsupported, setUnsupported] = useState(false);
  const [gameStats, setGameStats] = useState<GameState>({
    speed: 0,
    gear: "N",
    timeOfDay: 8,
    violations: [],
    score: 100,
    fine: 0,
  });
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let renderer: any = null;
    let animationId = 0;

    const state = {
      velocity: 0,
      heading: 0,
      steerAngle: 0,
      timeHours: 8,
      isPedestrian: true,
      camSnapped: false,
      camPos: new THREE.Vector3(0, 8, -12),
      camTarget: new THREE.Vector3(),
      keys: {} as Record<string, boolean>,
      violationsLog: [] as string[],
      player: new THREE.Group(),
      playerVehicle: new THREE.Group(),
      playerCharacter: new THREE.Group(),
      npcs: [] as NPC[],
      peds: [] as any[],
      obstacles: [] as CollisionBox[],
      world: [] as any[],
    };

    (async () => {
      if (!("gpu" in navigator)) {
        setUnsupported(true);
        setStatus("WebGPU not available.");
        return;
      }

      try {
        renderer = new WebGPURenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.shadowMap.enabled = true;
        await renderer.init();
      } catch (err) {
        console.error(err);
        setUnsupported(true);
        setStatus("Failed to init WebGPU.");
        return;
      }

      if (disposed || !renderer) return;
      mount.appendChild(renderer.domElement);
      setStatus("");

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87b6d8);
      scene.fog = new THREE.Fog(0x0b1020, 120, 500);
      const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1200);

      const hemi = new THREE.HemisphereLight(0x88aaff, 0x223355, 0.6);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xffe0b0, 1.4);
      sun.castShadow = true;
      scene.add(sun);

      // --- World Generation (THEMED) ---
      const theme = THEME_CONFIGS.urban_grid;
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x14161c });
      const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x6b7280 });

      const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: 0x1a2a1f }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      theme.roads.forEach((r: RoadSegment) => {
        let mesh: THREE.Mesh;
        if (r.type === 'v') {
          mesh = new THREE.Mesh(new THREE.PlaneGeometry(12, r.z2! - r.z1!), roadMat);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(r.x!, 0.01, (r.z1! + r.z2!) / 2);
        } else {
          mesh = new THREE.Mesh(new THREE.PlaneGeometry(r.x2! - r.x1!, 12), roadMat);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set((r.x1! + r.x2!) / 2, 0.01, r.z!);
        }
        scene.add(mesh);
      });

      // --- Player Setup ---
      const createCar = (color: number) => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 4.4), new THREE.MeshStandardMaterial({ color }));
        body.position.y = 0.55;
        g.add(body);
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 2.2), new THREE.MeshStandardMaterial({ color: 0x14141e }));
        cabin.position.set(0, 1.15, -0.2);
        g.add(cabin);
        return g;
      };

      state.playerVehicle = createCar(0xe63946);
      state.playerVehicle.position.set(0, 0, -480);
      scene.add(state.playerVehicle);

      const createHuman = () => {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.2), new THREE.MeshStandardMaterial({ color: 0xccd5e1 }));
        body.position.y = 0.6;
        g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22), new THREE.MeshStandardMaterial({ color: 0xffd7a8 }));
        head.position.y = 1.4;
        g.add(head);
        return g;
      };

      state.playerCharacter = createHuman();
      state.playerCharacter.position.set(5, 0, -480);
      scene.add(state.playerCharacter);
      state.player = state.playerCharacter;

      // --- NPCs with Waypoints ---
      const spawnNPC = () => {
        const car = createCar(Math.random() * 0xffffff);
        const route = theme.route;
        const npc: NPC = {
          obj: car,
          headMat: new THREE.MeshStandardMaterial(),
          tailMat: new THREE.MeshStandardMaterial(),
          route: route,
          routeIdx: 0,
          speed: 10 + Math.random() * 10,
          stuckTimer: 0,
          axis: 'z',
          lane: 0,
          dir: 1
        };
        npc.obj.position.set(route[0].x, 0, route[0].z);
        scene.add(car);
        return npc;
      };

      for (let i = 0; i < 20; i++) state.npcs.push(spawnNPC());

      // --- Input ---
      const onKey = (e: KeyboardEvent, down: boolean) => {
        const k = e.key.toLowerCase();
        state.keys[k] = down;
      };
      window.addEventListener("keydown", (e) => onKey(e, true));
      window.addEventListener("keyup", (e) => onKey(e, false));

      const clock = new THREE.Clock();
      const tick = () => {
        const dt = Math.min(clock.getDelta(), 0.05);

        // Day/Night
        state.timeHours = (state.timeHours + 0.15 * dt) % 24;
        const daylight = Math.max(0, Math.sin((state.timeHours - 6) / 24 * Math.PI * 2));
        sun.position.set(Math.cos(state.timeHours) * 100, daylight * 100, 50);
        sun.intensity = daylight * 1.6;
        scene.background?.setHSL(0.6, 0.5, 0.2 + daylight * 0.5);

        // GTA Interaction
        if (state.keys['f']) {
          if (state.isPedestrian) {
            if (state.player.position.distanceTo(state.playerVehicle.position) < 3) {
              state.isPedestrian = false;
              state.playerCharacter.visible = false;
              state.player = state.playerVehicle;
              state.camSnapped = false;
            }
          } else {
            state.isPedestrian = true;
            state.playerCharacter.visible = true;
            state.playerCharacter.position.copy(state.playerVehicle.position).add(new THREE.Vector3(3, 0, 0));
            state.player = state.playerCharacter;
            state.camSnapped = false;
          }
          state.keys['f'] = false;
        }

        // Movement
        const forward = state.keys['w'];
        const back = state.keys['s'];
        const left = state.keys['a'];
        const right = state.keys['d'];

        if (state.isPedestrian) {
          const speed = 0.12;
          let dx = 0, dz = 0;
          if (forward) dz = 1; if (back) dz = -1;
          if (left) dx = 1; if (right) dx = -1;
          if (dx !== 0 || dz !== 0) {
            const yaw = state.player.rotation.y;
            const moveX = Math.sin(yaw) * dz + Math.sin(yaw + Math.PI/2) * dx;
            const moveZ = Math.cos(yaw) * dz + Math.cos(yaw + Math.PI/2) * dx;
            const len = Math.hypot(moveX, moveZ);
            state.player.position.x += (moveX/len) * speed;
            state.player.position.z += (moveZ/len) * speed;
          }
        } else {
          const stats = VEHICLE_STATS.car;
          if (forward) state.velocity += stats.accel * 60 * dt;
          else if (back) state.velocity -= stats.accel * 40 * dt;
          state.velocity *= Math.pow(stats.fric, dt * 60);
          state.velocity = Math.max(-18, Math.min(stats.maxSpd * 50, state.velocity));
          const steerTarget = ((left ? 1 : 0) - (right ? 1 : 0)) * 0.5;
          state.steerAngle += (steerTarget - state.steerAngle) * Math.min(1, dt * 8);
          state.heading += state.steerAngle * stats.turn * dt * 60 * Math.sign(state.velocity || 1);
          state.player.rotation.y = state.heading;
          state.player.position.x += Math.sin(state.heading) * state.velocity * dt;
          state.player.position.z += Math.cos(state.heading) * state.velocity * dt;
        }

        // NPC AI (Waypoint Following)
        state.npcs.forEach(n => {
          const target = n.route[n.routeIdx];
          const dist = n.obj.position.distanceTo(new THREE.Vector3(target.x, 0, target.z));
          if (dist < 5) {
            n.routeIdx = (n.routeIdx + 1) % n.route.length;
          }
          const dir = new THREE.Vector3(target.x - n.obj.position.x, 0, target.z - n.obj.position.z).normalize();
          n.obj.position.addScaledVector(dir, n.speed * dt);
          n.obj.rotation.y = Math.atan2(dir.x, dir.z);
        });

        // Camera
        const rotY = state.player.rotation.y;
        const camDist = state.isPedestrian ? 4 : 12;
        const camHeight = state.isPedestrian ? 2.5 : 4.5;
        const desired = new THREE.Vector3(
          state.player.position.x - Math.sin(rotY) * camDist,
          camHeight,
          state.player.position.z - Math.cos(rotY) * camDist
        );
        state.camPos.lerp(desired, 1 - Math.pow(0.001, dt));
        camera.position.copy(state.camPos);
        const lookAhead = state.isPedestrian ? 3 : 7;
        camera.lookAt(state.player.position.x + Math.sin(rotY) * lookAhead, 1.5, state.player.position.z + Math.cos(rotY) * lookAhead);

        if (Math.random() < 0.1) {
          setGameStats(prev => ({ ...prev, speed: Math.round(Math.abs(state.velocity) * 3.6), gear: state.velocity > 0.1 ? "D" : state.velocity < -0.1 ? "R" : "N", timeOfDay: state.timeHours }));
        }

        renderer.render(scene, camera);
        animationId = requestAnimationFrame(tick);
      };

      tick();
      return () => {
        disposed = true;
        cancelAnimationFrame(animationId);
        renderer?.dispose();
      };
    })();
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b1020]">
      <div ref={mountRef} className="absolute inset-0" />
      {status && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-md rounded-lg border border-white/10 bg-black/60 p-6 text-center backdrop-blur">
            <h2 className="text-lg font-semibold text-white">{unsupported ? "WebGPU required" : "Loading"}</h2>
            <p className="mt-2 text-sm text-white/70">{status}</p>
          </div>
        </div>
      )}
      {!status && (
        <>
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-white/10 bg-black/50 px-4 py-3 font-mono text-white backdrop-blur">
            <div className="text-[10px] uppercase tracking-widest text-white/50">NeoDrive · WebGPU</div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-4xl font-bold tabular-nums">{gameStats.speed}</span>
              <span className="text-xs text-white/60">km/h</span>
              <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-sm font-semibold">{gameStats.gear}</span>
            </div >
            <div className="mt-1 text-[11px] text-white/50">🕒 {Math.floor(gameStats.timeOfDay).toString().padStart(2, '0')}:00</div>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-black/50 px-5 py-2.5 text-xs text-white/80 backdrop-blur">
            <span className="font-mono">
              <kbd className="rounded bg-white/10 px-1.5 py-0.5">W A S D</kbd> move · <kbd className="rounded bg-white/10 px-1.5 py-0.5">F</kbd> enter/exit car
            </span>
          </div>
        </>
      )}
    </div>
  );
}
