import { useState } from "react";

interface AmbientVideoBackgroundProps {
  videoId: string;
  posterImage?: string;
  title?: string;
  overlayOpacity?: string;
}

export function AmbientVideoBackground({
  videoId,
  posterImage,
  title = "Ambient Industrial Video",
  overlayOpacity = "opacity-60",
}: AmbientVideoBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Fallback / Poster Image */}
      {posterImage && (
        <img
          src={posterImage}
          alt={title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            isLoaded ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      {/* Embedded Ambient Stream Video */}
      <div className="absolute inset-0 -top-1/4 -bottom-1/4 h-[150%] w-full overflow-hidden">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&disablekb=1&fs=0&playsinline=1&iv_load_policy=3`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={() => setIsLoaded(true)}
          className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 object-cover pointer-events-none opacity-40 mix-blend-screen scale-110"
          style={{ border: "none" }}
        />
      </div>

      {/* Film grain / dark gradient scrim overlays for contrast */}
      <div className={`absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/50 ${overlayOpacity}`} />
      <div className="absolute inset-0 bg-radial-vignette opacity-50" />
    </div>
  );
}
