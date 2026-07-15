import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/trips")({
  component: AdminTripsLayout,
});

function AdminTripsLayout() {
  return <Outlet />;
}
