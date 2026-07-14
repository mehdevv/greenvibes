import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/offres/")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "voyages" });
  },
});
