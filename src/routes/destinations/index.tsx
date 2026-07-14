import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/destinations/")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "voyages" });
  },
});
