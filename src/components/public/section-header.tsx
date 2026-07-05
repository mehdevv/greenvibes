import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { easeOut, fadeUp } from "@/lib/motion";

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  animate = true,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
  animate?: boolean;
}) {
  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, amount: 0.3 },
        variants: fadeUp,
        transition: easeOut,
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <p className="text-sm font-medium text-forest">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-light tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          {description}
        </p>
      )}
    </Wrapper>
  );
}
