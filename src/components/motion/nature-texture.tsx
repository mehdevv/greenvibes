import { cn } from "@/lib/utils";

export function NatureTexture({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
      aria-hidden
    >
      <div className="nature-texture-leaves absolute inset-0 opacity-[0.045]" />
      <div className="nature-texture-grain absolute inset-0 opacity-[0.035]" />
      <div className="absolute inset-0 bg-gradient-to-b from-mint/20 via-transparent to-sand/30" />
    </div>
  );
}
