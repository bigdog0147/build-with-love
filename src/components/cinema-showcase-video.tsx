import { useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause, Maximize2 } from "lucide-react";

interface CinemaShowcaseVideoProps {
  src?: string;
  className?: string;
  stats?: { k: string; l: string }[];
}

export function CinemaShowcaseVideo({
  src = "/showcase-video.mp4",
  className = "",
  stats,
}: CinemaShowcaseVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden border-y border-white/10 bg-black shadow-2xl group ${className}`}
    >
      {/* Full-Bleed Edge-to-Edge Fluid Aerodynamic Video */}
      <div className="relative w-full h-screen min-h-screen bg-black">
        <video
          ref={videoRef}
          src={src}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 h-full w-full object-cover object-center filter contrast-110 brightness-105"
        />

        {/* Ambient Lamination Gradient to blend seamlessly into adjacent sections */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[var(--background)] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent" />

        {/* Subtle Water Shimmer Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Floating Minimalist Control Dock */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2 opacity-75 transition-opacity duration-300 group-hover:opacity-100">
          <button
            onClick={togglePlay}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105"
            aria-label={isPlaying ? "Pause video" : "Play video"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-white" />}
          </button>

          <button
            onClick={toggleMute}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105"
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-white/70" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-[var(--primary)]" />
            )}
          </button>

          <button
            onClick={handleFullscreen}
            className="hidden sm:grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105"
            aria-label="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Laminated Glass Stats Ribbon Embedded Seamlessly at the Bottom */}
        {stats && stats.length > 0 && (
          <div className="absolute bottom-6 inset-x-0 z-20 mx-auto max-w-7xl px-6">
            <div className="rounded-2xl border border-white/15 bg-black/40 backdrop-blur-xl p-5 shadow-2xl">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.l} className="space-y-0.5 px-3">
                    <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {s.k}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/70 font-semibold">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
