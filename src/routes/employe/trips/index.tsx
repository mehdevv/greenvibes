import { createFileRoute } from "@tanstack/react-router";
import { TripsListPage } from "@/routes/admin/trips/index";

export const Route = createFileRoute("/employe/trips/")({
  component: TripsListPage,
});
