import { createFileRoute } from "@tanstack/react-router";
import { TripDetailPage } from "@/routes/admin/trips/$tripId";

export const Route = createFileRoute("/employe/trips/$tripId")({
  component: EmployeTripDetailRoute,
});

function EmployeTripDetailRoute() {
  const { tripId } = Route.useParams();
  return <TripDetailPage tripId={tripId} />;
}
