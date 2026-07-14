import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_OFFRES_SEARCH } from "@/lib/constants";

export const Route = createFileRoute("/destinations/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/offres", search: DEFAULT_OFFRES_SEARCH });
  },
});
