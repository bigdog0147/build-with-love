import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

/* ------------------------------------------------------------------ */
/* Shared IntersectionObserver + rAF-batched visibility updates       */
/* ------------------------------------------------------------------ */

type RevealCallback = (visible: boolean) => void;

const callbacks = new WeakMap<Element, RevealCallback>();
const onceSet = new WeakSet<Element>();
let sharedObserver: IntersectionObserver | null = null;
let pending: Array<[Element, boolean]> = [];
let rafId = 0;

function flush() {
  rafId = 0;
  const batch = pending;
  pending = [];
  for (const [el, vis] of batch) {
    const cb = callbacks.get(el);
    if (cb) cb(vis);
  }
}

function schedule(el: Element, vis: boolean) {
  pending.push([el, vis]);
  if (!rafId) rafId = requestAnimationFrame(flush);
}

function getObserver() {
  if (sharedObserver || typeof window === "undefined") return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        if (entry.isIntersecting) {
          schedule(el, true);
          if (onceSet.has(el)) sharedObserver?.unobserve(el);
        } else {
          if (!onceSet.has(el)) schedule(el, false);
        }
      }
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
  );
  return sharedObserver;
}

function observe(el: Element, once: boolean, cb: RevealCallback) {
  callbacks.set(el, cb);
  if (once) onceSet.add(el);
  getObserver()?.observe(el);
}

function unobserve(el: Element) {
  callbacks.delete(el);
  onceSet.delete(el);
  sharedObserver?.unobserve(el);
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function isCoarseOrNarrow() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(max-width: 768px)").matches ||
    window.matchMedia?.("(pointer: coarse)").matches
  );
}

/* ------------------------------------------------------------------ */
/* Reveal                                                              */
/* ------------------------------------------------------------------ */

export function Reveal({
  children,
  as: Tag = "div",
  direction = "up",
  distance = 32,
  delay = 0,
  duration = 900,
  once = true,
  className = "",
  style,
}: {
  children: ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  direction?: Direction;
  distance?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isCoarseOrNarrow());
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }
    observe(el, once, setVisible);
    return () => unobserve(el);
  }, [once]);

  // Skip the blur filter on mobile — it's a heavy per-frame compositor cost.
  const useBlur = !mobile;
  const activeDistance = mobile ? Math.min(distance, 18) : distance;
  const activeDuration = mobile ? Math.min(duration, 600) : duration;

  const axis =
    direction === "up"
      ? `translate3d(0, ${activeDistance}px, 0)`
      : direction === "down"
        ? `translate3d(0, -${activeDistance}px, 0)`
        : direction === "left"
          ? `translate3d(${activeDistance}px, 0, 0)`
          : direction === "right"
            ? `translate3d(-${activeDistance}px, 0, 0)`
            : "none";

  const composed: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translate3d(0,0,0) scale(1)" : `${axis} scale(0.99)`,
    ...(useBlur ? { filter: visible ? "blur(0)" : "blur(6px)" } : null),
    transition: useBlur
      ? `opacity ${activeDuration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform ${activeDuration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, filter ${activeDuration}ms ease ${delay}ms`
      : `opacity ${activeDuration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform ${activeDuration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    willChange: visible ? "auto" : "opacity, transform",
    ...style,
  };

  return (
    // @ts-expect-error dynamic tag
    <Tag ref={ref} className={className} style={composed}>
      {children}
    </Tag>
  );
}

export function useInView<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    observe(el, true, (vis) => {
      if (vis) setInView(true);
    });
    return () => unobserve(el);
  }, []);
  return { ref, inView };
}

/** Animated counter that runs when scrolled into view. */
export function CountUp({
  value,
  duration = 1600,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setN(value);
      return;
    }
    let raf = 0;
    let start = 0;
    let last = -1;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = value * eased;
      // Throttle React updates to meaningful changes only.
      const rounded = Math.round(next * Math.pow(10, decimals + 1));
      if (rounded !== last) {
        last = rounded;
        setN(next);
      }
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, decimals]);

  const formatted = n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
