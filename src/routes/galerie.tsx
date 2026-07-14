import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/galerie")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "galerie" });
  },
});
