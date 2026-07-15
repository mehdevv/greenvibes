import { createFileRoute } from "@tanstack/react-router";
import { InscriptionsPage } from "@/routes/admin/inscriptions";

export const Route = createFileRoute("/employe/inscriptions")({
  validateSearch: (search: Record<string, unknown>) => ({
    trip: typeof search.trip === "string" ? search.trip : undefined,
  }),
  component: EmployeInscriptionsRoute,
});

function EmployeInscriptionsRoute() {
  const { trip } = Route.useSearch();
  return <InscriptionsPage tripIdFromUrl={trip} />;
}
