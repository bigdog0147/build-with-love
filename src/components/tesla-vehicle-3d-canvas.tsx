import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface TeslaVehicle3DProps {
  model: "cybertruck" | "roadster";
  isDriving: boolean;
  speed: number;
  thrusterFiring?: boolean;
  headlightsOn?: boolean;
  vaultOpen?: boolean;
}

export function TeslaVehicle3DCanvas({
  model,
  isDriving,
  speed,
  thrusterFiring = false,
  headlightsOn = true,
  vaultOpen = false,
}: TeslaVehicle3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 360;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 7.8);
    camera.lookAt(0, 0.3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x3e6ae1, 3.0);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // Car Root Group
    const carGroup = new THREE.Group();
    scene.add(carGroup);

    const wheels: THREE.Mesh[] = [];

    // =========================================================================
    // BUILD 3D PROCEDURAL MESH BASED ON SELECTED MODEL
    // =========================================================================
    if (model === "cybertruck") {
      // 1. Stainless Steel Cyber Exoskeleton Material
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x8a8d98,
        metalness: 0.92,
        roughness: 0.25,
        flatShading: true,
      });

      const darkSteelMat = new THREE.MeshStandardMaterial({
        color: 0x3a3c44,
        metalness: 0.8,
        roughness: 0.4,
      });

      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x111622,
        metalness: 0.95,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      });

      // Angular Main Hull
      const bodyGeo = new THREE.ConeGeometry(2.4, 4.6, 4, 1, false, Math.PI / 4);
      bodyGeo.scale(1.2, 0.5, 0.65);
      bodyGeo.rotateX(Math.PI / 2);
      const bodyMesh = new THREE.Mesh(bodyGeo, steelMat);
      bodyMesh.position.set(0, 0.55, 0);
      carGroup.add(bodyMesh);

      // Glass Roof Apex
      const roofGeo = new THREE.ConeGeometry(1.6, 2.4, 4, 1, false, Math.PI / 4);
      roofGeo.scale(0.9, 0.45, 0.55);
      roofGeo.rotateX(Math.PI / 2);
      const roofMesh = new THREE.Mesh(roofGeo, glassMat);
      roofMesh.position.set(0, 0.82, -0.15);
      carGroup.add(roofMesh);

      // Front Full Lightbar
      const lightbarGeo = new THREE.BoxGeometry(2.1, 0.08, 0.08);
      const lightbarMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const lightbar = new THREE.Mesh(lightbarGeo, lightbarMat);
      lightbar.position.set(0, 0.52, 2.22);
      carGroup.add(lightbar);

      // Rear Red Tail Blade
      const tailbarGeo = new THREE.BoxGeometry(2.05, 0.08, 0.08);
      const tailbarMat = new THREE.MeshBasicMaterial({ color: 0xe82127 });
      const tailbar = new THREE.Mesh(tailbarGeo, tailbarMat);
      tailbar.position.set(0, 0.65, -2.22);
      carGroup.add(tailbar);

      // 4 Heavy-Duty Cyber Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.32, 16);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelPositions = [
        [-1.15, 0.4, 1.4],
        [1.15, 0.4, 1.4],
        [-1.15, 0.4, -1.4],
        [1.15, 0.4, -1.4],
      ];

      wheelPositions.forEach((pos) => {
        const wheel = new THREE.Mesh(wheelGeo, darkSteelMat);
        wheel.position.set(pos[0], pos[1], pos[2]);
        carGroup.add(wheel);
        wheels.push(wheel);
      });
    } else {
      // 2. Roadster Founders Aerospace Carbon & Pearl White Material
      const pearlWhiteMat = new THREE.MeshStandardMaterial({
        color: 0xf8f9fc,
        metalness: 0.35,
        roughness: 0.18,
      });

      const carbonMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1e,
        metalness: 0.7,
        roughness: 0.4,
      });

      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x090b10,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      });

      // Sculpted Aerodynamic Supercar Hull
      const bodyGeo = new THREE.CylinderGeometry(0.9, 1.25, 4.4, 16);
      bodyGeo.scale(1.0, 0.35, 1.0);
      bodyGeo.rotateX(Math.PI / 2);
      const bodyMesh = new THREE.Mesh(bodyGeo, pearlWhiteMat);
      bodyMesh.position.set(0, 0.42, 0);
      carGroup.add(bodyMesh);

      // Glass Cockpit Canopy
      const canopyGeo = new THREE.SphereGeometry(1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      canopyGeo.scale(0.8, 0.45, 1.3);
      const canopyMesh = new THREE.Mesh(canopyGeo, glassMat);
      canopyMesh.position.set(0, 0.48, -0.2);
      carGroup.add(canopyMesh);

      // Active Deployable Carbon Aero Wing
      const wingGeo = new THREE.BoxGeometry(1.9, 0.06, 0.35);
      const wingMesh = new THREE.Mesh(wingGeo, carbonMat);
      wingMesh.position.set(0, 0.7, -1.95);
      carGroup.add(wingMesh);

      // Front Headlight Strips
      const headLGeo = new THREE.BoxGeometry(0.4, 0.05, 0.2);
      const headLMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const headL = new THREE.Mesh(headLGeo, headLMat);
      headL.position.set(-0.7, 0.42, 2.05);
      carGroup.add(headL);

      const headR = new THREE.Mesh(headLGeo, headLMat);
      headR.position.set(0.7, 0.42, 2.05);
      carGroup.add(headR);

      // 4 Forged Track Aero Wheels with Red Brake Calipers
      const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.28, 18);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelPositions = [
        [-1.05, 0.36, 1.35],
        [1.05, 0.36, 1.35],
        [-1.05, 0.36, -1.35],
        [1.05, 0.36, -1.35],
      ];

      wheelPositions.forEach((pos) => {
        const wheel = new THREE.Mesh(wheelGeo, carbonMat);
        wheel.position.set(pos[0], pos[1], pos[2]);
        carGroup.add(wheel);
        wheels.push(wheel);
      });
    }

    // Ground Grid
    const gridHelper = new THREE.GridHelper(24, 24, 0x3e6ae1, 0x1f2430);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // Mouse Interaction for 3D Drag-to-Rotate
    let isDragging = false;
    let prevMouseX = 0;
    let autoRotateAngle = 0.35;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - prevMouseX;
      carGroup.rotation.y += delta * 0.012;
      prevMouseX = e.clientX;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Wheel spinning if driving
      if (isDriving) {
        wheels.forEach((w) => {
          w.rotation.x -= 0.15;
        });
        // Scroll grid
        gridHelper.position.z = (gridHelper.position.z + 0.15) % 1;
      }

      // Idle smooth auto-spin if not actively dragged
      if (!isDragging) {
        carGroup.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [model, isDriving, speed, thrusterFiring, headlightsOn, vaultOpen]);

  return (
    <div className="relative w-full h-full min-h-[360px] sm:min-h-[440px] flex items-center justify-center cursor-grab active:cursor-grabbing">
      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      {/* 3D Interactive Badge & Drag Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none rounded-full bg-black/75 border border-white/15 px-4 py-1 text-[11px] font-mono text-white/80 backdrop-blur-md flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>3D WEBGL TWIN · DRAG TO ROTATE 360°</span>
      </div>
    </div>
  );
}
