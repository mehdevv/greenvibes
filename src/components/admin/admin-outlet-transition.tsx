import { Outlet, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { pageEnter } from "@/lib/motion";

export function AdminOutletTransition() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        exit="exit"
        variants={pageEnter}
        className="min-h-0 will-change-[opacity,transform]"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
