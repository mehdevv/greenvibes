import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/offres/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "voyages" });
  },
});
