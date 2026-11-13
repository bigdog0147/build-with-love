import { X } from "lucide-react";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  title: string;
}

export function VideoPlayerModal({ isOpen, onClose, videoId, title }: VideoPlayerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[var(--surface-elevated)] p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[var(--primary)] font-semibold">Tesla-Grade Industrial Cinema</span>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mt-4 aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            style={{ border: "none" }}
          />
        </div>
      </div>
    </div>
  );
}
