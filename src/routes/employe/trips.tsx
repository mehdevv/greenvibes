import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/employe/trips")({
  component: EmployeTripsLayout,
});

function EmployeTripsLayout() {
  return <Outlet />;
}
