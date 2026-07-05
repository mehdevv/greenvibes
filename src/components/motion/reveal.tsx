import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  easeOut,
  fadeIn,
  fadeLeft,
  fadeRight,
  fadeUp,
  scaleIn,
  viewport,
} from "@/lib/motion";

type RevealVariant = "fadeUp" | "fadeIn" | "fadeLeft" | "fadeRight" | "scaleIn";

const variantMap: Record<RevealVariant, Variants> = {
  fadeUp,
  fadeIn,
  fadeLeft,
  fadeRight,
  scaleIn,
};

function useRevealVisible() {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, viewport);

  return {
    ref,
    visible: Boolean(reduceMotion || isInView),
    reduceMotion: Boolean(reduceMotion),
  };
}

type RevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "article" | "blockquote" | "li";
};

export function Reveal({
  children,
  variant = "fadeUp",
  delay = 0,
  duration,
  className,
  as = "div",
  ...props
}: RevealProps) {
  const { ref, visible, reduceMotion } = useRevealVisible();
  const Component = motion[as];

  return (
    <Component
      ref={ref}
      initial={reduceMotion ? false : "hidden"}
      animate={visible ? "visible" : "hidden"}
      variants={variantMap[variant]}
      transition={{
        ...easeOut,
        ...(duration ? { duration } : {}),
        delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Stagger({
  children,
  className,
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode; delay?: number }) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
  variant = "fadeUp",
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode; variant?: RevealVariant }) {
  const { ref, visible, reduceMotion } = useRevealVisible();

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? false : "hidden"}
      animate={visible ? "visible" : "hidden"}
      variants={variantMap[variant]}
      transition={easeOut}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function PageEnter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      exit="exit"
      variants={fadeIn}
      transition={easeOut}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const { ref, visible, reduceMotion } = useRevealVisible();

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={reduceMotion ? false : "hidden"}
      animate={visible ? "visible" : "hidden"}
      variants={fadeIn}
      transition={easeOut}
      className={className}
    >
      {children}
    </motion.section>
  );
}
