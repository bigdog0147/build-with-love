import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";

interface S3Logo3DProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  enableHoverTilt?: boolean;
}

export function S3Logo3D({ size = "md", className = "", enableHoverTilt = true }: S3Logo3DProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableHoverTilt || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const multiplier = 0.08;
    setRotate({
      x: -y * multiplier,
      y: x * multiplier,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const sizeClasses = {
    sm: "h-8 px-2.5 text-lg",
    md: "h-10 px-3.5 text-2xl",
    lg: "h-14 px-5 text-4xl",
  }[size];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center cursor-pointer select-none [perspective:1000px] ${className}`}
    >
      {/* 3D Container with dynamic tilt and floating animation */}
      <div
        className={`relative flex items-center justify-center font-black tracking-tighter transition-transform duration-200 ease-out [transform-style:preserve-3d] ${
          !isHovered ? "animate-[s3-float_4s_ease-in-out_infinite]" : ""
        }`}
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
      >
        {/* Ambient Red Glow Layer (Rear Depth) */}
        <div
          className="absolute -inset-2 rounded-2xl opacity-75 blur-md pointer-events-none transition-opacity duration-300 [transform:translateZ(-15px)]"
          style={{
            background:
              "radial-gradient(circle at center, rgba(232, 33, 39, 0.7) 0%, rgba(244, 63, 94, 0.3) 50%, transparent 80%)",
          }}
        />

        {/* 3D Extruded Shadow Layer */}
        <div
          className="absolute inset-0 flex items-center justify-center font-display font-black text-black/90 pointer-events-none select-none [transform:translateZ(-8px)]"
          style={{ textShadow: "0 0 16px rgba(0,0,0,0.9)" }}
        >
          <span className="tracking-tighter">S3</span>
        </div>

        {/* Glassmorphic 3D Pill Backing */}
        <div
          className="absolute inset-0 rounded-xl border border-white/20 bg-gradient-to-b from-white/10 to-black/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] [transform:translateZ(0px)]"
          style={{
            boxShadow: isHovered
              ? "0 0 25px rgba(232, 33, 39, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4)"
              : "0 0 15px rgba(232, 33, 39, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
          }}
        />

        {/* Main 3D Metallic S3 Letterforms */}
        <div className={`relative z-10 flex items-center font-display font-extrabold ${sizeClasses} [transform:translateZ(12px)]`}>
          {/* Animated 3D Shimmer Overlay */}
          <div className="relative overflow-hidden inline-block py-0.5">
            <span
              className="relative z-10 block bg-gradient-to-br from-[#ffffff] via-[#ff4d4d] to-[#b30006] bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(232,33,39,0.8)]"
              style={{
                WebkitTextStroke: "0.5px rgba(255, 255, 255, 0.4)",
              }}
            >
              S3
            </span>

            {/* Moving Light Glint / Sweep Bar */}
            <span
              className="pointer-events-none absolute inset-0 z-20 block w-full h-full bg-gradient-to-r from-transparent via-white/70 to-transparent -translate-x-full animate-[s3-sweep_3.5s_infinite_ease-in-out]"
              style={{
                mixBlendMode: "overlay",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
