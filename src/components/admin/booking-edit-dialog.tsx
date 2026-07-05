import { useEffect, useState } from "react";
import type { Booking, BookingStatus } from "@/api/types";
import { useUpdateBooking, useListSessionsForAdmin } from "@/api";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmée" },
  { value: "paid", label: "Payée" },
  { value: "cancelled", label: "Annulée" },
  { value: "completed", label: "Terminée" },
];

type BookingEditDialogProps = {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BookingEditDialog({ booking, open, onOpenChange }: BookingEditDialogProps) {
  const updateBooking = useUpdateBooking();
  const { data: sessions } = useListSessionsForAdmin(booking?.sessionId);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [participants, setParticipants] = useState("1");
  const [status, setStatus] = useState<BookingStatus>("pending");
  const [sessionId, setSessionId] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [totalPriceDzd, setTotalPriceDzd] = useState("");

  useEffect(() => {
    if (!booking || !open) return;
    setFirstName(booking.firstName);
    setLastName(booking.lastName);
    setEmail(booking.email);
    setPhone(booking.phone);
    setParticipants(String(booking.participants));
    setStatus(booking.status);
    setSessionId(booking.sessionId);
    setSpecialRequests(booking.specialRequests ?? "");
    setTotalPriceDzd(String(booking.totalPriceDzd));
  }, [booking, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    try {
      await updateBooking.mutateAsync({
        id: booking.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        participants: Math.max(1, Number(participants) || 1),
        status,
        sessionId,
        specialRequests: specialRequests.trim() || null,
        totalPriceDzd: Number(totalPriceDzd) || undefined,
      });
      toast.success("Réservation mise à jour");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la réservation {booking?.bookingRef}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">Prénom</Label>
              <Input
                id="edit-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Nom</Label>
              <Input
                id="edit-lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Téléphone</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+213 ..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-participants">Participants</Label>
              <Input
                id="edit-participants"
                type="number"
                min={1}
                max={50}
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-total">Total (DA)</Label>
              <Input
                id="edit-total"
                type="number"
                min={0}
                value={totalPriceDzd}
                onChange={(e) => setTotalPriceDzd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-session">Session / départ</Label>
            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger id="edit-session">
                <SelectValue placeholder="Choisir une session" />
              </SelectTrigger>
              <SelectContent>
                {(sessions ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.offer?.title ?? "Circuit"} — {s.sessionDate} (
                    {s.capacity - s.bookedCount} places)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-requests">Demandes spéciales</Label>
            <Textarea
              id="edit-requests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateBooking.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
