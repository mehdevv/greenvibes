import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useListClients, useUpdateClient } from "@/api";
import type { Client } from "@/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

export const Route = createFileRoute("/admin/clients")({
  component: AdminClientsPage,
});

type ClientFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  tags: string;
};

function clientToForm(c: Client): ClientFormState {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    notes: c.notes ?? "",
    tags: c.tags.join(", "),
  };
}

function AdminClientsPage() {
  const { canWrite } = useAuth();
  const [search, setSearch] = useState("");
  const { data: clients, isLoading } = useListClients(search || undefined);
  const updateClient = useUpdateClient();
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
    tags: "",
  });

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setForm(clientToForm(c));
  };

  const handleSave = async () => {
    if (!editingClient) return;
    try {
      await updateClient.mutateAsync({
        id: editingClient.id,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim() || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success("Client mis à jour");
      setEditingClient(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Clients</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "…" : `${clients?.length ?? 0} client(s)`}
        </p>
      </div>

      <Input
        placeholder="Rechercher par nom, email, téléphone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Annuaire clients</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Chargement...</p>
          ) : (clients ?? []).length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucun client trouvé.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 pb-3 pr-4 font-medium sm:px-0">Nom</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Téléphone</th>
                  <th className="hidden pb-3 pr-4 font-medium md:table-cell">Tags</th>
                  <th className="hidden pb-3 pr-4 font-medium lg:table-cell">Notes</th>
                  {canWrite && <th className="pb-3 font-medium"> </th>}
                </tr>
              </thead>
              <tbody>
                {(clients ?? []).map((c) => (
                  <tr key={c.id} className="border-b border-border/60 hover:bg-secondary/40">
                    <td className="px-4 py-2.5 pr-4 font-medium sm:px-0">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{c.email}</td>
                    <td className="py-2.5 pr-4">
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="hover:underline">
                          {c.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden py-2.5 pr-4 md:table-cell">
                      {c.tags.length > 0 ? (
                        <span className="line-clamp-1 text-muted-foreground">{c.tags.join(", ")}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="hidden max-w-[14rem] py-2.5 pr-4 lg:table-cell">
                      <span className="line-clamp-1 text-muted-foreground">
                        {c.notes || "—"}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="py-2.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEdit(c)}
                          aria-label="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingClient)} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="VIP, famille..."
              />
            </div>
            <div className="space-y-2">
              <Label>Notes internes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingClient(null)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={updateClient.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
