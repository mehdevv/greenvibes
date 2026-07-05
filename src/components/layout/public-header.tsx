import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { DEFAULT_OFFRES_SEARCH } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { headerEnter } from "@/lib/motion";

const SCROLL_THRESHOLD = 32;

const exploreLinks = [
  { label: "Destinations", to: "/destinations" as const },
  { label: "Circuits", to: "/offres" as const, search: DEFAULT_OFFRES_SEARCH },
  { label: "Galerie", to: "/galerie" as const },
] as const;

const infoLinks = [
  { label: "À propos", to: "/a-propos" as const },
  { label: "Blog", to: "/blog" as const },
  { label: "Contact", to: "/contact" as const },
] as const;

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isHome = pathname === "/";
  const heroOverlay = isHome && atTop && !open;

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={headerEnter}
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
        heroOverlay
          ? "border-b border-transparent bg-transparent shadow-none"
          : "border-b border-border bg-background/95 shadow-sm backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="shrink-0">
          <Logo
            size="md"
            showText
            textClassName={cn(
              "text-lg transition-colors duration-300",
              heroOverlay ? "text-white" : "text-forest",
            )}
          />
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
          {[...exploreLinks, ...infoLinks.slice(0, 2)].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              {...("search" in link ? { search: link.search } : {})}
              className={cn(
                "text-sm transition-colors duration-300",
                heroOverlay
                  ? isActive(link.to)
                    ? "font-medium text-white"
                    : "text-white/80 hover:text-white"
                  : isActive(link.to)
                    ? "font-medium text-forest"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            asChild
            className={cn(
              "hidden md:inline-flex transition-colors duration-300",
              heroOverlay &&
                "border border-white/35 bg-white/10 text-white shadow-none hover:bg-white/20 hover:text-white",
            )}
          >
            <Link to="/offres" search={DEFAULT_OFFRES_SEARCH}>
              Réserver
            </Link>
          </Button>

          <button
            type="button"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[4px] transition-colors duration-300 xl:hidden",
              heroOverlay
                ? "text-white hover:bg-white/10"
                : "text-forest hover:bg-muted",
            )}
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "overflow-hidden xl:hidden",
              heroOverlay
                ? "border-t border-white/15 bg-forest/95 backdrop-blur-md"
                : "border-t border-border bg-background",
            )}
          >
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
              {[...exploreLinks, ...infoLinks].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  {...("search" in link ? { search: link.search } : {})}
                  className={cn(
                    "rounded-[4px] px-3 py-2.5 text-sm transition",
                    heroOverlay
                      ? isActive(link.to)
                        ? "bg-white/15 font-medium text-white"
                        : "text-white/90 hover:bg-white/10 hover:text-white"
                      : isActive(link.to)
                        ? "bg-muted font-medium text-forest"
                        : "text-foreground hover:bg-muted",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/offres"
                search={DEFAULT_OFFRES_SEARCH}
                onClick={() => setOpen(false)}
                className="mt-2"
              >
                <Button
                  className={cn(
                    "w-full",
                    heroOverlay &&
                      "border border-white/35 bg-white text-forest hover:bg-white/90",
                  )}
                >
                  Réserver un circuit
                </Button>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
