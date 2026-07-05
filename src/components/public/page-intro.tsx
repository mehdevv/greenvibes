import type { ReactNode } from "react";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";
import { FLOATING_NAV_OFFSET } from "@/lib/constants";

export function PageIntro({
  title,
  description,
  className,
  children,
}: {
  title: ReactNode;
  description?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-6 pb-16", FLOATING_NAV_OFFSET, className)}>
      <Reveal>
        <h1 className="text-4xl font-light tracking-tight text-foreground md:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-muted-foreground">{description}</p>}
      </Reveal>
      {children}
    </div>
  );
}
