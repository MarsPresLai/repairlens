import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Part } from "../shared/guide";
export default function DeviceView({
  step,
  progress,
  onPart,
  onFailure,
}: {
  step: number;
  progress: number;
  onPart: (part: Part) => void;
  onFailure: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef({ step, progress, onPart });
  latest.current = { step, progress, onPart };
  useEffect(() => {
    if (!host.current) return;
    const el = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      onFailure();
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor("#e9e9e2");
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e9e9e2");
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(8, 10, 10);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.8, 0.3);
    controls.enableDamping = true;
    controls.minDistance = 8;
    controls.maxDistance = 23;
    controls.maxPolarAngle = Math.PI * 0.47;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x5e6c68, 3));
    const key = new THREE.DirectionalLight(0xffffff, 5);
    key.position.set(3, 8, -4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xf8d8b8, 2);
    rim.position.set(-5, 4, 5);
    scene.add(rim);
    const dark = new THREE.MeshStandardMaterial({
        color: "#26363b",
        roughness: 0.45,
      }),
      black = new THREE.MeshStandardMaterial({
        color: "#172429",
        roughness: 0.65,
      }),
      orange = new THREE.MeshStandardMaterial({
        color: "#e87943",
        roughness: 0.4,
      }),
      metal = new THREE.MeshStandardMaterial({
        color: "#b9c6c5",
        metalness: 0.9,
        roughness: 0.3,
      }),
      light = new THREE.MeshStandardMaterial({
        color: "#dce0d9",
        roughness: 0.5,
      });
    const hits: THREE.Object3D[] = [];
    function box(
      w: number,
      h: number,
      d: number,
      r: number,
      mat: THREE.Material,
      part: Part,
    ) {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat);
      mesh.userData.part = part;
      hits.push(mesh);
      return mesh;
    }
    const body = box(3.6, 1.15, 5.8, 0.55, dark, "body");
    body.position.y = -0.3;
    scene.add(body);
    const plate = box(3.05, 0.12, 5.15, 0.4, black, "body");
    plate.position.y = 0.31;
    scene.add(plate);
    const cover = new THREE.Group();
    const door = box(2.45, 0.16, 3.4, 0.25, dark, "cover");
    door.position.set(0, 0, 0.9);
    cover.add(door);
    for (let i = 0; i < 3; i++) {
      const groove = box(0.65, 0.015, 0.035, 0.01, light, "cover");
      groove.position.set(0, 0.09, 1.65 + i * 0.13);
      cover.add(groove);
    }
    scene.add(cover);
    const tray = box(1.22, 0.12, 3.25, 0.08, black, "battery");
    tray.position.set(0.55, 0.43, 0.85);
    scene.add(tray);
    for (const z of [-0.62, 2.32]) {
      const terminal = box(0.9, 0.4, 0.12, 0.03, metal, "battery");
      terminal.position.set(0.55, 0.6, z);
      scene.add(terminal);
    }
    const battery = new THREE.Group();
    const cell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 2.65, 48),
      orange,
    );
    cell.rotation.x = Math.PI / 2;
    cell.userData.part = "battery";
    hits.push(cell);
    battery.add(cell);
    for (const z of [-1.33, 1.33]) {
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.06, 32),
        metal,
      );
      cap.rotation.x = Math.PI / 2;
      cap.position.z = z;
      battery.add(cap);
    }
    const positive = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.1, 24),
      metal,
    );
    positive.rotation.x = Math.PI / 2;
    positive.position.z = -1.4;
    battery.add(positive);
    scene.add(battery);
    const sensor = box(0.5, 0.05, 0.7, 0.12, metal, "body");
    sensor.position.set(-0.65, 0.43, -1.3);
    scene.add(sensor);
    const switchBase = box(0.48, 0.12, 0.85, 0.09, black, "power");
    switchBase.position.set(0.72, 0.45, -1.6);
    scene.add(switchBase);
    const toggle = box(0.34, 0.12, 0.32, 0.04, orange, "power");
    toggle.position.set(0.72, 0.55, -1.8);
    scene.add(toggle);
    const receiver = box(0.5, 0.15, 0.75, 0.06, light, "body");
    receiver.position.set(-0.7, 0.5, 0.15);
    scene.add(receiver);
    const usb = box(0.4, 0.1, 0.35, 0.02, metal, "body");
    usb.position.set(-0.7, 0.5, -0.27);
    scene.add(usb);
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(15, 80),
      new THREE.MeshStandardMaterial({ color: "#e9e9e2", roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.05;
    scene.add(ground);
    const ring = new THREE.GridHelper(18, 24, 0xc3cdc4, 0xd8dfd5);
    ring.position.y = -1.02;
    scene.add(ring);
    const ray = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let down = { x: 0, y: 0 };
    const start = (event: PointerEvent) => {
      down = { x: event.clientX, y: event.clientY };
    };
    const pick = (event: PointerEvent) => {
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5)
        return;
      const r = el.getBoundingClientRect();
      pointer.set(
        ((event.clientX - r.left) / r.width) * 2 - 1,
        (-(event.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(hits)[0];
      if (hit) latest.current.onPart(hit.object.userData.part);
    };
    renderer.domElement.addEventListener("pointerdown", start);
    renderer.domElement.addEventListener("pointerup", pick);
    const resize = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      renderer.setSize(r.width, r.height);
      camera.aspect = r.width / Math.max(r.height, 1);
      camera.updateProjectionMatrix();
    });
    resize.observe(el);
    let frame = 0;
    function animate() {
      frame = requestAnimationFrame(animate);
      const { step: s, progress: p } = latest.current;
      const t = p * p * (3 - 2 * p);
      const open = s === 0 ? 0 : s === 1 ? t : s === 4 ? 1 - t : 1;
      cover.position.set(-open * 1.3, 1.04 + open * 2.4, open * 2.15);
      cover.rotation.z = -open * 0.13;
      const lift = s < 2 ? 0 : s === 2 ? t : s === 3 ? 1 - t : 0;
      battery.position.set(0.55, 0.62 + lift * 2.3, 0.85 - lift * 0.25);
      battery.rotation.z = lift * 0.12;
      toggle.position.z =
        s === 0 ? -1.45 - 0.35 * t : s === 4 ? -1.8 + 0.35 * t : -1.8;
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", start);
      renderer.domElement.removeEventListener("pointerup", pick);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        if (m.material)
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((v) =>
            v.dispose(),
          );
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onFailure]);
  return (
    <div
      ref={host}
      className="device-view"
      aria-label="Interactive illustrative 3D mouse assembly. Drag to rotate, scroll to zoom, or click a part."
    />
  );
}
