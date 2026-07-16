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

  return <ReservationsWorkbook />;
}
