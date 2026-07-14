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
  { label: "Sorties", to: "/offres" as const, search: DEFAULT_OFFRES_SEARCH },
  { label: "À propos", to: "/a-propos" as const },
  { label: "Galerie", to: "/galerie" as const },
  { label: "Contact", to: "/contact" as const },
] as const;

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={headerEnter}
      className={cn(
        "sticky top-0 z-50 border-b border-transparent bg-background/90 backdrop-blur-md transition-all duration-300",
        !atTop && "border-border shadow-soft",
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-6">
        <Link to="/" className="shrink-0">
          <Logo size="md" showText textClassName="text-lg font-medium text-foreground" />
        </Link>

        <nav className="hidden items-center gap-8 xl:flex">
          {exploreLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              {...("search" in link ? { search: link.search } : {})}
              className={cn(
                "text-sm transition-colors",
                isActive(link.to)
                  ? "font-medium text-forest"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Button asChild className="hidden md:inline-flex" size="default">
            <Link to="/offres" search={DEFAULT_OFFRES_SEARCH}>
              Réserver
            </Link>
          </Button>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted xl:hidden"
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
            className="overflow-hidden border-t border-border bg-background xl:hidden"
          >
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
              {exploreLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  {...("search" in link ? { search: link.search } : {})}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-sm transition",
                    isActive(link.to)
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
                <Button className="w-full">Réserver une sortie</Button>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
