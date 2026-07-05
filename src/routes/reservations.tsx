import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_RESERVATION_SEARCH } from "@/lib/constants";

export const Route = createFileRoute("/reservations")({
  beforeLoad: () => {
    throw redirect({ to: "/reservation", search: DEFAULT_RESERVATION_SEARCH });
  },
});
