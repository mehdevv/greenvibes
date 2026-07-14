/** Trip availability copy per cahier des charges */
export function tripAvailabilityLabel(remaining: number, capacity: number): string {
  if (remaining <= 0) return "Complet";
  if (remaining <= Math.max(2, Math.floor(capacity * 0.25))) return "Presque complet";
  return `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`;
}

export function tripAvailabilityBarColor(remaining: number, capacity: number): string {
  if (remaining <= 0) return "bg-red-500";
  const ratio = remaining / capacity;
  if (ratio <= 0.25) return "bg-orange-500";
  return "bg-[#52B788]";
}

export function tripSpotsRemaining(capacity: number, spotsTaken: number): number {
  return Math.max(0, capacity - spotsTaken);
}
