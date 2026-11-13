import { useEffect, useRef } from "react";

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
  color: string;
}

interface Streamline {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  width: number;
}

/**
 * Aerodynamic Smoke & Thruster Vapor Motion Engine
 * Replicates the wind-tunnel vapor trails and high-speed jet thruster smoke
 * of the flying Roadster in automotive advert commercials.
 * Interacts with pointer movements, clicks, and touches.
 */
export function AerodynamicSmokeMotion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: SmokeParticle[] = [];
    let streamlines: Streamline[] = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Initialize horizontal aerodynamic wind-tunnel streamlines
    const initStreamlines = () => {
      streamlines = [];
      const count = Math.floor(width / 70);
      for (let i = 0; i < count; i++) {
        streamlines.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 80 + Math.random() * 220,
          speed: 2 + Math.random() * 3.5,
          opacity: 0.04 + Math.random() * 0.12,
          width: 0.6 + Math.random() * 1.4,
        });
      }
    };
    initStreamlines();

    // Spawn volumetric smoke puffs
    const spawnSmokePuff = (
      x: number,
      y: number,
      count = 8,
      speedMultiplier = 1,
      isThruster = false
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.4 + Math.random() * 2.2) * speedMultiplier;
        const isRed = isThruster && Math.random() > 0.65;
        const color = isRed ? "232, 33, 39" : "210, 220, 235";

        particles.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed + (isThruster ? -3.5 : -0.8), // subtle windward drift
          vy: Math.sin(angle) * speed * 0.6,
          size: 14 + Math.random() * 24,
          maxSize: 65 + Math.random() * 110,
          alpha: 0,
          maxAlpha: isRed ? 0.35 : 0.18 + Math.random() * 0.14,
          life: 0,
          maxLife: 70 + Math.random() * 60,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.02,
          color,
        });
      }
    };

    // User click / touch press creates an aerodynamic cold-gas burst
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      spawnSmokePuff(clientX, clientY, 20, 1.8, true);
    };

    // Pointer move leaves an aerodynamic vapor trail behind the cursor
    let lastMoveX = 0;
    let lastMoveY = 0;
    let lastMoveTime = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const now = performance.now();

      if (now - lastMoveTime > 45) {
        const dx = clientX - lastMoveX;
        const dy = clientY - lastMoveY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 8) {
          spawnSmokePuff(clientX, clientY, Math.min(6, Math.floor(dist / 12) + 2), 0.9, false);
          lastMoveX = clientX;
          lastMoveY = clientY;
          lastMoveTime = now;
        }
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });

    // Periodic ambient high-altitude vapor trails drifting across the atmosphere
    const ambientInterval = setInterval(() => {
      const startX = width + 20;
      const startY = height * (0.15 + Math.random() * 0.7);
      spawnSmokePuff(startX, startY, 4, 1.2, false);
    }, 1800);

    // Initial ambient puff
    spawnSmokePuff(width * 0.6, height * 0.35, 16, 1.2, true);

    // Main 60fps render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw horizontal aerodynamic wind-tunnel streamlines
      for (let i = 0; i < streamlines.length; i++) {
        const s = streamlines[i];
        s.x -= s.speed;
        if (s.x + s.length < 0) {
          s.x = width + Math.random() * 100;
          s.y = Math.random() * height;
        }

        const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.length, s.y);
        grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
        grad.addColorStop(0.5, `rgba(220, 230, 245, ${s.opacity})`);
        grad.addColorStop(1, `rgba(232, 33, 39, ${s.opacity * 0.4})`);

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.length, s.y);
        ctx.stroke();
      }

      // 2. Draw soft volumetric vapor puffs
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.rotation += p.vRot;

        // Size expansion
        const progress = p.life / p.maxLife;
        const currentSize = p.size + (p.maxSize - p.size) * Math.sin(progress * Math.PI * 0.5);

        // Alpha envelope: fade in quickly, fade out smoothly
        let currentAlpha = 0;
        if (progress < 0.2) {
          currentAlpha = (progress / 0.2) * p.maxAlpha;
        } else {
          currentAlpha = (1 - (progress - 0.2) / 0.8) * p.maxAlpha;
        }

        if (progress >= 1 || currentAlpha <= 0.005) {
          particles.splice(i, 1);
          continue;
        }

        // Draw soft radial blur puff
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
        grad.addColorStop(0, `rgba(${p.color}, ${currentAlpha})`);
        grad.addColorStop(0.4, `rgba(${p.color}, ${currentAlpha * 0.65})`);
        grad.addColorStop(0.8, `rgba(${p.color}, ${currentAlpha * 0.2})`);
        grad.addColorStop(1, `rgba(${p.color}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      clearInterval(ambientInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[5] h-full w-full opacity-85"
      aria-hidden="true"
    />
  );
}
