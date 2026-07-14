/** Strip to digits; Algerian mobiles → last 9 digits for comparison. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 9) return digits;
  return digits.slice(-9);
}

export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.length >= 9 && normalized.length <= 10;
}
