import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EDGE_PADDING = "max(1.25rem, calc((100vw - 80rem) / 2 + 1.25rem))";
const RESUME_DELAY = 4500;
const DRAG_THRESHOLD = 3;
const MOMENTUM_FRICTION = 0.92;
const MOMENTUM_MAX_VELOCITY = 4.5;
const MOMENTUM_MIN_VELOCITY = 0.015;

type HorizontalScrollProps = {
  children: ReactNode;
  className?: string;
  autoScrollInterval?: number;
  showDots?: boolean;
  itemCount?: number;
  "aria-label"?: string;
};

export function HorizontalScroll({
  children,
  className,
  autoScrollInterval = 3000,
  showDots = true,
  itemCount = 0,
  "aria-label": ariaLabel = "Défilement horizontal",
}: HorizontalScrollProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const draggingRef = useRef(false);
  const momentumRef = useRef<number | null>(null);
  const activePointerId = useRef<number | null>(null);

  const setDragSurface = useCallback((active: boolean) => {
    const el = trackRef.current;
    draggingRef.current = active;
    if (el) {
      if (active) el.dataset.dragging = "true";
      else delete el.dataset.dragging;
    }
    setDragging(active);
  }, []);

  const pausedRef = useRef(false);
  const inViewRef = useRef(true);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoScrollEnabled = autoScrollInterval > 0 && !reduceMotion;

  const getGap = useCallback((el: HTMLElement) => {
    const gap = parseFloat(getComputedStyle(el).columnGap || "0");
    return Number.isNaN(gap) ? 24 : gap;
  }, []);

  const stepWidth = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    const item = el.querySelector<HTMLElement>("[data-scroll-item]");
    return item ? item.offsetWidth + getGap(el) : el.clientWidth * 0.85;
  }, [getGap]);

  const maxIndex = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    const step = stepWidth();
    if (step <= 0) return 0;
    return Math.max(0, Math.round((el.scrollWidth - el.clientWidth) / step));
  }, [stepWidth]);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < maxScroll - 4);

    const step = stepWidth();
    setActiveIndex(step > 0 ? Math.round(scrollLeft / step) : 0);
  }, [stepWidth]);

  const scrollToIndex = useCallback(
    (index: number, smooth = true) => {
      const el = trackRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(index, maxIndex()));
      el.scrollTo({
        left: clamped * stepWidth(),
        behavior: smooth && !reduceMotion ? "smooth" : "auto",
      });
    },
    [stepWidth, maxIndex, reduceMotion],
  );

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      scrollToIndex(activeIndex + direction);
    },
    [activeIndex, scrollToIndex],
  );

  const stopMomentum = useCallback(() => {
    if (momentumRef.current != null) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }
  }, []);

  const startMomentum = useCallback(
    (pointerVelocity: number) => {
      const el = trackRef.current;
      if (!el) return;

      stopMomentum();

      // pointerVelocity is px/ms (positive = moving right → scrollLeft decreases)
      let velocity = Math.max(
        -MOMENTUM_MAX_VELOCITY,
        Math.min(MOMENTUM_MAX_VELOCITY, pointerVelocity),
      );

      if (Math.abs(velocity) < MOMENTUM_MIN_VELOCITY) {
        setSettling(false);
        return;
      }

      const maxScroll = el.scrollWidth - el.clientWidth;
      setSettling(true);

      const frame = () => {
        el.scrollLeft -= velocity * 16;
        velocity *= MOMENTUM_FRICTION;

        const atEdge = el.scrollLeft <= 0 || el.scrollLeft >= maxScroll - 0.5;
        if (Math.abs(velocity) < MOMENTUM_MIN_VELOCITY || atEdge) {
          momentumRef.current = null;
          setSettling(false);
          measure();
          return;
        }
        momentumRef.current = requestAnimationFrame(frame);
      };

      momentumRef.current = requestAnimationFrame(frame);
    },
    [stopMomentum, measure],
  );

  const pauseAutoScroll = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    measure();

    const onScroll = () => measure();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((child) => ro.observe(child));

    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.2 },
    );
    io.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      io.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return;
      if (draggingRef.current) return;

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // Let vertical wheel / trackpad scroll pass through to the page.
      if (absY >= absX || e.deltaX === 0) return;

      // Shift+wheel or clear horizontal intent → carousel scroll.
      e.preventDefault();
      stopMomentum();
      el.scrollLeft += e.deltaX;
      pauseAutoScroll();
      scheduleResume();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stopMomentum();
        scrollByPage(-1);
        pauseAutoScroll();
        scheduleResume();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        stopMomentum();
        scrollByPage(1);
        pauseAutoScroll();
        scheduleResume();
      }
    };

    let isDown = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let axis: "none" | "horizontal" | "vertical" = "none";

    const releasePointer = (pointerId: number) => {
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pauseAutoScroll();
      stopMomentum();
      setSettling(false);

      isDown = true;
      moved = false;
      axis = "none";
      activePointerId.current = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastTime = performance.now();
      velocity = 0;
      startScroll = el.scrollLeft;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown || activePointerId.current !== e.pointerId) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) {
        velocity = (e.clientX - lastX) / dt;
      }
      lastX = e.clientX;
      lastTime = now;

      if (axis === "none") {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

        if (Math.abs(dy) > Math.abs(dx)) {
          axis = "vertical";
          isDown = false;
          activePointerId.current = null;
          scheduleResume();
          return;
        }

        axis = "horizontal";
        moved = true;
        setDragSurface(true);

        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }

      if (axis === "vertical") return;

      e.preventDefault();
      el.scrollLeft = startScroll - dx;
    };

    const endDrag = (e: PointerEvent) => {
      if (!isDown || activePointerId.current !== e.pointerId) return;

      const wasHorizontal = axis === "horizontal" && moved;
      isDown = false;
      activePointerId.current = null;
      axis = "none";
      setDragSurface(false);
      releasePointer(e.pointerId);

      if (wasHorizontal) startMomentum(velocity);
      scheduleResume();
    };

    const onDragStart = (e: DragEvent) => {
      if (isDown || draggingRef.current) e.preventDefault();
    };

    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    let scrollEndTimer: ReturnType<typeof setTimeout>;
    const onScrollEnd = () => {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        if (!draggingRef.current && !isDown) measure();
      }, 80);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("scroll", onScrollEnd, { passive: true });
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("dragstart", onDragStart);
      el.removeEventListener("scroll", onScrollEnd);
      el.removeEventListener("click", onClickCapture, true);
      clearTimeout(scrollEndTimer);
      stopMomentum();
      delete el.dataset.dragging;
    };
  }, [pauseAutoScroll, scheduleResume, scrollByPage, startMomentum, stopMomentum, measure, setDragSurface]);

  useEffect(() => {
    if (!autoScrollEnabled) return;
    const el = trackRef.current;
    if (!el) return;

    const id = setInterval(() => {
      if (pausedRef.current || !inViewRef.current || document.hidden) return;
      if (el.scrollWidth <= el.clientWidth + 1) return;

      const next = activeIndex >= maxIndex() ? 0 : activeIndex + 1;
      scrollToIndex(next);
    }, autoScrollInterval);

    return () => clearInterval(id);
  }, [
    autoScrollEnabled,
    autoScrollInterval,
    scrollToIndex,
    activeIndex,
    maxIndex,
  ]);

  const dots = useMemo(
    () => (itemCount > 0 ? Array.from({ length: itemCount }) : []),
    [itemCount],
  );

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={pauseAutoScroll}
      onMouseLeave={scheduleResume}
      onFocusCapture={pauseAutoScroll}
      onBlurCapture={scheduleResume}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-20 bg-gradient-to-r from-sand via-sand/80 to-transparent transition-opacity duration-300 md:block",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-20 bg-gradient-to-l from-sand via-sand/80 to-transparent transition-opacity duration-300 md:block",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />

      <button
        type="button"
        onClick={() => {
          scrollByPage(-1);
          pauseAutoScroll();
          scheduleResume();
        }}
        disabled={!canScrollLeft}
        aria-label="Voir les offres précédentes"
        className={cn(
          "absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-forest shadow-md ring-1 ring-border/50 transition duration-300 md:flex",
          "hover:scale-105 hover:bg-mint active:scale-95",
          canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => {
          scrollByPage(1);
          pauseAutoScroll();
          scheduleResume();
        }}
        disabled={!canScrollRight}
        aria-label="Voir les offres suivantes"
        className={cn(
          "absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-forest shadow-md ring-1 ring-border/50 transition duration-300 md:flex",
          "hover:scale-105 hover:bg-mint active:scale-95",
          canScrollRight ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className={cn(
          "flex gap-5 overflow-x-auto overscroll-x-contain pb-4 pt-1 outline-none sm:gap-6",
          "[touch-action:pan-y_pinch-zoom] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          "[&[data-dragging=true]]:snap-none [&[data-dragging=true]]:scroll-auto [&[data-dragging=true]]:cursor-grabbing",
          "[&[data-dragging=true]_*]:pointer-events-none [&[data-dragging=true]_*]:select-none",
          settling
            ? "snap-none scroll-auto select-none"
            : "snap-x snap-proximity scroll-smooth",
          dragging || settling ? "select-none" : "cursor-grab",
        )}
        style={{
          paddingLeft: EDGE_PADDING,
          paddingRight: EDGE_PADDING,
          scrollPaddingLeft: EDGE_PADDING,
          scrollPaddingRight: EDGE_PADDING,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>

      {showDots && dots.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {dots.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller à l'offre ${i + 1}`}
              aria-current={i === activeIndex}
              onClick={() => {
                scrollToIndex(i);
                pauseAutoScroll();
                scheduleResume();
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === activeIndex ? "w-7 bg-coral" : "w-2 bg-forest/25 hover:bg-forest/40",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HorizontalScrollItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-scroll-item
      className={cn(
        "w-[min(88vw,360px)] shrink-0 snap-center sm:w-[380px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
