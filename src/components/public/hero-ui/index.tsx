import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { ChevronsDown, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/* ── Layout ───────────────────────────────────────────── */

type HeroTone = "white" | "sand" | "background";

const toneClass: Record<HeroTone, string> = {
  white: "bg-white",
  sand: "bg-sand",
  background: "bg-background",
};

export function HeroSection({
  id,
  children,
  className,
  tone = "white",
  padded = true,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: HeroTone;
  padded?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        id && "scroll-mt-24",
        toneClass[tone],
        padded && "gv-section",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function HeroContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("gv-container px-5 sm:px-8", className)}>{children}</div>;
}

/* ── Typography ─────────────────────────────────────── */

export function HeroQuote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-quote text-lg italic text-leaf md:text-xl", className)}>{children}</p>
  );
}

export function HeroEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-sm font-semibold uppercase tracking-widest text-leaf",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function HeroTitle({
  as: Tag = "h2",
  children,
  className,
  highlight,
}: {
  as?: "h1" | "h2" | "h3";
  children: ReactNode;
  className?: string;
  highlight?: ReactNode;
}) {
  const sizes = {
    h1: "text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] leading-[1.12]",
    h2: "text-3xl md:text-4xl lg:text-[2.75rem] leading-tight",
    h3: "text-xl md:text-2xl",
  };

  return (
    <Tag
      className={cn(
        "font-display font-bold tracking-tight text-foreground",
        sizes[Tag],
        className,
      )}
    >
      {children}
      {highlight && <> <span className="text-forest">{highlight}</span></>}
    </Tag>
  );
}

export function HeroLead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-base leading-relaxed text-muted-foreground md:text-lg md:leading-8",
        className,
      )}
    >
      {children}
    </p>
  );
}

function HeroScrollChevron({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn("text-leaf", className)}
      animate={
        reduceMotion
          ? undefined
          : {
              y: [0, 10, 0],
              opacity: [0.55, 1, 0.55],
            }
      }
      transition={{
        duration: 1.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      aria-hidden
    >
      <ChevronsDown className="h-8 w-8 md:h-9 md:w-9" strokeWidth={2.25} />
    </motion.div>
  );
}

export function HeroBlockHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  titleAs = "h2",
  showChevron,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
  titleAs?: "h1" | "h2" | "h3";
  /** Scroll hint chevron — defaults to on when `eyebrow` is set */
  showChevron?: boolean;
}) {
  const centered = align === "center";
  const displayChevron = showChevron ?? !!eyebrow;

  return (
    <Reveal className={cn(centered && "text-center", className)}>
      {eyebrow && <HeroEyebrow>{eyebrow}</HeroEyebrow>}
      {displayChevron && centered && (
        <div
          className={cn(
            "flex justify-center",
            eyebrow ? "mt-2" : "mb-3",
          )}
        >
          <HeroScrollChevron />
        </div>
      )}
      <HeroTitle as={titleAs} className={cn("text-forest", eyebrow && "mt-4")}>
        {title}
      </HeroTitle>
      {subtitle && (
        <HeroLead className={cn("mt-4 max-w-2xl", centered && "mx-auto")}>{subtitle}</HeroLead>
      )}
    </Reveal>
  );
}

/* ── Actions & surfaces ─────────────────────────────── */

type HeroButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "outline";
  size?: "md" | "lg";
  icon?: LucideIcon;
};

const btnVariants = {
  primary: "bg-forest text-white hover:bg-leaf shadow-md hover:shadow-lg",
  accent: "bg-coral text-white hover:bg-forest shadow-md hover:shadow-lg",
  outline: "border border-border bg-white text-forest hover:bg-sand",
};

const btnSizes = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export function HeroButton({
  variant = "primary",
  size = "lg",
  icon: Icon,
  children,
  className,
  ...props
}: HeroButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 active:scale-[0.97]",
        btnVariants[variant],
        btnSizes[size],
        className,
      )}
      {...props}
    >
      {children}
      {Icon && <Icon className="h-4 w-4" />}
    </button>
  );
}

export function HeroCard({
  children,
  className,
  tone = "white",
}: {
  children: ReactNode;
  className?: string;
  tone?: "white" | "sand";
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl shadow-lift ring-1 ring-border/40",
        tone === "white" ? "bg-white" : "bg-sand/80",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function HeroMediaFrame({
  children,
  className,
  decor = true,
}: {
  children: ReactNode;
  className?: string;
  decor?: boolean;
}) {
  return (
    <div className={cn("relative mx-auto w-full", className)}>
      <div className="relative overflow-hidden rounded-3xl bg-sand shadow-lift ring-1 ring-border/40">
        {children}
      </div>
      {decor && (
        <>
          <HeroDecorBlob position="bl" />
          <HeroDecorBlob position="tr" />
        </>
      )}
    </div>
  );
}

export function HeroDecorBlob({
  position = "bl",
  className,
}: {
  position?: "bl" | "tr" | "tl" | "br";
  className?: string;
}) {
  const pos = {
    bl: "absolute -bottom-6 -left-6 -z-10 hidden h-32 w-32 rounded-[2rem] bg-mint/60 lg:block",
    tr: "absolute -right-4 -top-4 -z-10 hidden h-24 w-48 rotate-12 rounded-full bg-sand lg:block",
    tl: "absolute -left-16 top-1/4 hidden h-64 w-40 -rotate-12 rounded-[3rem] bg-mint/50 lg:block",
    br: "absolute -right-16 bottom-1/4 hidden h-56 w-36 rotate-12 rounded-[3rem] bg-leaf/20 lg:block",
  };

  return <div className={cn(pos[position], className)} aria-hidden />;
}

export function HeroBadge({
  children,
  variant = "mint",
  className,
}: {
  children: ReactNode;
  variant?: "mint" | "white" | "danger";
  className?: string;
}) {
  const variants = {
    mint: "bg-mint text-forest",
    white: "bg-white/95 text-forest shadow-sm",
    danger: "bg-red-500 text-white",
  };

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function HeroInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-border bg-sand/30 px-4 py-3 text-foreground outline-none transition",
        "placeholder:text-muted-foreground focus:border-forest focus:ring-2 focus:ring-forest/20",
        className,
      )}
      {...props}
    />
  );
}

export function HeroTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-2xl border border-border bg-sand/30 px-4 py-3 text-foreground outline-none transition",
        "placeholder:text-muted-foreground focus:border-forest focus:ring-2 focus:ring-forest/20",
        className,
      )}
      {...props}
    />
  );
}

export function HeroStat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <HeroCard className="flex flex-col items-center p-6 text-center shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/80 text-forest">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-forest md:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </HeroCard>
  );
}

export function heroBtnClasses(
  variant: "primary" | "accent" | "outline" = "accent",
  opts?: { full?: boolean; size?: "md" | "lg" },
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 active:scale-[0.97]",
    btnVariants[variant],
    btnSizes[opts?.size ?? "md"],
    opts?.full && "w-full",
  );
}

export function HeroReveal({
  children,
  className,
  delay = 0,
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { HorizontalScroll, HorizontalScrollItem } from "./horizontal-scroll";
