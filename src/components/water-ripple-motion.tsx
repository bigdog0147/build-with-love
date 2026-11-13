import { useEffect, useRef } from "react";

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  intensity: number;
  color: string;
}

export function WaterRippleMotion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let ripples: Ripple[] = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Stone drop ripple factory: creates concentric liquid wave fronts
    const addStoneDrop = (x: number, y: number, isMajor = false) => {
      const ringCount = isMajor ? 4 : 2;
      const baseColor = isMajor ? "rgba(255, 255, 255, " : "rgba(232, 33, 39, ";

      for (let i = 0; i < ringCount; i++) {
        setTimeout(() => {
          ripples.push({
            x,
            y,
            radius: 2 + i * 4,
            maxRadius: isMajor ? Math.min(width, height) * 0.65 : 220,
            speed: isMajor ? 3.2 : 2.2,
            intensity: isMajor ? 0.85 : 0.45,
            color: baseColor,
          });
        }, i * 160);
      }
    };

    // User click anywhere on the interface = throwing a stone into water
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      addStoneDrop(clientX, clientY, true);
    };

    // Cursor movement = smooth water disturbance wake
    let lastMoveTime = 0;
    const handlePointerMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMoveTime > 90) {
        lastMoveTime = now;
        ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 3,
          maxRadius: 130,
          speed: 1.8,
          intensity: 0.35,
          color: "rgba(255, 255, 255, ",
        });
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("mousemove", handlePointerMove, { passive: true });

    // Idle ambient natural water droplet drops periodically
    const dropletInterval = setInterval(() => {
      const rx = width * (0.2 + Math.random() * 0.6);
      const ry = height * (0.2 + Math.random() * 0.6);
      addStoneDrop(rx, ry, false);
    }, 3800);

    // Initial gentle ripples on load
    addStoneDrop(width * 0.5, height * 0.35, true);

    // Render loop: draws propagating liquid refraction rings with high-speed damping
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        const life = 1 - r.radius / r.maxRadius;

        if (life <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        const alpha = Math.max(0, life * r.intensity);

        // Outer specular wave crest
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1, 2.5 * life);
        ctx.strokeStyle = `${r.color}${alpha * 0.75})`;
        ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
        ctx.shadowBlur = 6 * life;
        ctx.stroke();

        // Inner refracted caustic ring
        if (r.radius > 8) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, Math.max(1, r.radius - 4), 0, Math.PI * 2);
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(232, 33, 39, ${alpha * 0.35})`;
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("mousemove", handlePointerMove);
      clearInterval(dropletInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-30 h-full w-full"
      style={{
        mixBlendMode: "screen",
      }}
    />
  );
}
