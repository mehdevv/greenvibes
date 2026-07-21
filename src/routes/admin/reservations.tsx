import { createFileRoute } from "@tanstack/react-router";
import { ReservationsWorkbook } from "@/components/admin/reservations-workbook";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/reservations")({
  component: AdminReservationsRoute,
});

function AdminReservationsRoute() {
  return <ReservationsPage />;
}

export function ReservationsPage() {
  const { can } = useAuth();

  if (!can("reservations", "read") && !can("tripLists", "read")) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">Vous n&apos;avez pas la permission de consulter les réservations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">Réservations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez toutes les inscriptions par offre ou en ordre chronologique.
        </p>
      </div>
      <ReservationsWorkbook />
    </div>
  );
}
