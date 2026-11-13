import { useState, useRef } from "react";

interface X3Logo3DProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  enableHoverTilt?: boolean;
  variant?: "badge" | "watermark";
}

export function X3Logo3D({
  size = "md",
  className = "",
  enableHoverTilt = true,
  variant = "badge",
}: X3Logo3DProps) {
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
      x: Math.max(-10, Math.min(10, -y * multiplier)),
      y: Math.max(-12, Math.min(12, x * multiplier)),
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  // Compact, refined luxury automotive dimensions (smaller, no bulky footprint)
  const dimensions = {
    xs: { w: 42, h: 18 },
    sm: { w: 56, h: 22 },
    md: { w: 72, h: 26 },
    lg: { w: 104, h: 36 },
    xl: { w: 144, h: 48 },
  }[size];

  const isWatermark = variant === "watermark";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center select-none [perspective:900px] ${
        isWatermark ? "pointer-events-none" : "cursor-pointer"
      } ${className}`}
      aria-label="X3"
    >
      {/* 3D Motion Container with Realistic Laminated Finish */}
      <div
        className="relative transition-transform duration-200 ease-out [transform-style:preserve-3d]"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
      >
        {/* Precision Chiseled SVG Emblem - Pure X3 only, NO bottom text */}
        <svg
          width={dimensions.w}
          height={dimensions.h}
          viewBox="0 0 110 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 overflow-visible transition-all duration-300 ${
            isWatermark ? "opacity-60 contrast-125" : "opacity-100"
          }`}
        >
          <defs>
            {/* Laminated Satin Metal - Light Chisel Facet */}
            <linearGradient id="chiseled-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Chiseled Metal - Deep Contrast Shade */}
            <linearGradient id="chiseled-dark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Precision Chrome Knife Edge */}
            <linearGradient id="chrome-edge" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </linearGradient>

            {/* Genuine Automotive Red Lacquer Inlay */}
            <linearGradient id="red-enamel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff2830" />
              <stop offset="55%" stopColor="#e82127" />
              <stop offset="100%" stopColor="#9e0a10" />
            </linearGradient>

            {/* Specular Red Inlay Highlight */}
            <linearGradient id="red-ridge" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff9da2" />
              <stop offset="100%" stopColor="#b8090f" />
            </linearGradient>
          </defs>

          {/* ================= LETTER "X" ================= */}
          <g>
            {/* Left Diagonal Blade */}
            <polygon points="6,4 17,4 37,32 26,32" fill="url(#chiseled-light)" />
            <polygon points="17,4 20,4 40,32 37,32" fill="url(#chiseled-dark)" />
            <line x1="6" y1="4" x2="26" y2="32" stroke="url(#chrome-edge)" strokeWidth="0.8" />

            {/* Right Diagonal Blade */}
            <polygon points="34,4 45,4 25,32 14,32" fill="url(#chiseled-light)" opacity="0.92" />
            <polygon points="42,4 45,4 25,32 22,32" fill="url(#chiseled-dark)" />
            <line x1="45" y1="4" x2="25" y2="32" stroke="#ffffff" strokeWidth="0.6" strokeOpacity="0.75" />
          </g>

          {/* Vertical Architectural Inset */}
          <line
            x1="52"
            y1="8"
            x2="52"
            y2="28"
            stroke="#ffffff"
            strokeOpacity="0.22"
            strokeWidth="0.8"
          />

          {/* ================= NUMBER "3" ================= */}
          <g>
            {/* Top Aero Wing Bar */}
            <polygon points="60,4 98,4 94,10 63,10" fill="url(#red-enamel)" />
            <line x1="60" y1="4" x2="98" y2="4" stroke="url(#red-ridge)" strokeWidth="0.9" />

            {/* Upper Right Downward Fin */}
            <polygon points="98,4 94,10 88,18 94,18" fill="url(#red-enamel)" />

            {/* Center Aero Strobe */}
            <polygon points="68,16 93,16 89,21 72,21" fill="url(#red-enamel)" />
            <line x1="68" y1="16" x2="93" y2="16" stroke="#ffb0b4" strokeWidth="0.7" />

            {/* Lower Right Downward Fin */}
            <polygon points="93,21 86,32 79,32 87,21" fill="url(#red-enamel)" />

            {/* Bottom Aero Base Bar */}
            <polygon points="60,32 86,32 82,26 63,26" fill="url(#red-enamel)" />
            <line x1="60" y1="32" x2="86" y2="32" stroke="#680105" strokeWidth="0.9" />

            {/* Laminated Bevel Highlights */}
            <polygon points="98,4 100,5 96,11 94,10" fill="#ffffff" fillOpacity="0.4" />
            <polygon points="93,21 95,22 88,33 86,32" fill="#ffffff" fillOpacity="0.35" />
          </g>
        </svg>
      </div>
    </div>
  );
}
