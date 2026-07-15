import { createFileRoute } from "@tanstack/react-router";
import { ReservationsPage } from "@/routes/admin/reservations";

export const Route = createFileRoute("/employe/reservations")({
  component: ReservationsPage,
});
