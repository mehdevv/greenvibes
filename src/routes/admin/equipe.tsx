import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useCreateAdminUser,
  useDeleteAdminUser,
  useListAdminUsers,
  useUpdateAdminUser,
} from "@/api";
import type { AdminPermissions } from "@/api/types";
import { PermissionMatrix, PermissionSummary } from "@/components/admin/permission-matrix";
import { useAuth } from "@/lib/auth";
import { DEFAULT_WORKER_PERMISSIONS } from "@/lib/admin-permissions";
import { getSiteOrigin } from "@/lib/trip-slug";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/equipe")({
  component: AdminTeamPage,
});

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Propriétaire",
  worker: "Employé",
  manager: "Manager",
  commercial: "Commercial",
  reader: "Lecture seule",
};

function AdminTeamPage() {
  const { user, isSuperAdmin } = useAuth();
  const { data: members = [], isLoading } = useListAdminUsers();
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const loginUrl = `${getSiteOrigin()}/employe/login`;

  const workers = useMemo(
    () => members.filter((m) => m.role !== "super_admin"),
    [members],
  );

  const editing = members.find((m) => m.id === editId) ?? null;

  if (!isSuperAdmin) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">Réservé au propriétaire du compte.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/dashboard">Retour au tableau de bord</Link>
        </Button>
      </div>
    );
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      toast.success("Lien de connexion copié");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Équipe</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Créez des comptes employés, définissez leurs droits et partagez le lien de connexion.
          </p>
        </div>
        <Button className="gap-2 rounded-full" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvel employé
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lien de connexion employés</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <code className="flex-1 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
            {loginUrl}
          </code>
          <Button type="button" variant="outline" className="gap-1.5" onClick={handleCopyLink}>
            <Copy className="h-4 w-4" />
            Copier le lien
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Users className="h-4 w-4" />
          Comptes ({members.length})
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{member.fullName || member.email}</p>
                    <Badge variant={member.role === "super_admin" ? "default" : "secondary"}>
                      {ROLE_LABELS[member.role] ?? member.role}
                    </Badge>
                    {member.id === user?.id && (
                      <Badge variant="outline">Vous</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  {member.role === "worker" && (
                    <div className="mt-2">
                      <PermissionSummary permissions={member.permissions} />
                    </div>
                  )}
                </div>
                {member.role === "worker" && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setEditId(member.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Droits
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive"
                      onClick={async () => {
                        if (!window.confirm(`Supprimer le compte de ${member.fullName} ?`)) return;
                        try {
                          await deleteUser.mutateAsync(member.id);
                          toast.success("Compte supprimé");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Erreur");
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {workers.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Aucun employé pour l&apos;instant. Créez un compte pour qu&apos;il puisse inscrire des clients.
              </p>
            )}
          </div>
        )}
      </div>

      <WorkerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nouvel employé"
        submitLabel="Créer le compte"
        pending={createUser.isPending}
        onSubmit={async (data) => {
          try {
            await createUser.mutateAsync(data);
            toast.success("Compte créé — partagez le lien de connexion");
            setCreateOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur");
          }
        }}
      />

      {editing && (
        <WorkerFormDialog
          key={editing.id}
          open
          onOpenChange={(open) => !open && setEditId(null)}
          title={`Droits — ${editing.fullName}`}
          submitLabel="Enregistrer"
          pending={updateUser.isPending}
          initial={{
            fullName: editing.fullName,
            email: editing.email,
            permissions: editing.permissions,
          }}
          allowPassword
          onSubmit={async (data) => {
            try {
              await updateUser.mutateAsync({
                id: editing.id,
                fullName: data.fullName,
                permissions: data.permissions,
                password: data.password || undefined,
              });
              toast.success("Compte mis à jour");
              setEditId(null);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Erreur");
            }
          }}
        />
      )}
    </div>
  );
}

type WorkerFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  pending: boolean;
  initial?: {
    fullName: string;
    email: string;
    permissions: AdminPermissions;
  };
  allowPassword?: boolean;
  onSubmit: (data: {
    fullName: string;
    email: string;
    password: string;
    permissions: AdminPermissions;
  }) => Promise<void>;
};

function WorkerFormDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  pending,
  initial,
  allowPassword,
  onSubmit,
}: WorkerFormDialogProps) {
  const isEdit = Boolean(initial);
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<AdminPermissions>(
    initial?.permissions ?? DEFAULT_WORKER_PERMISSIONS,
  );

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setFullName(initial?.fullName ?? "");
      setEmail(initial?.email ?? "");
      setPassword("");
      setPermissions(initial?.permissions ?? DEFAULT_WORKER_PERMISSIONS);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="worker-name">Nom affiché</Label>
            <Input
              id="worker-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex. Amina"
              className="mt-1"
            />
          </div>
          {!isEdit && (
            <div>
              <Label htmlFor="worker-email">Email de connexion</Label>
              <Input
                id="worker-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employe@exemple.com"
                className="mt-1"
                autoComplete="off"
              />
            </div>
          )}
          <div>
            <Label htmlFor="worker-password">
              {isEdit ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
            </Label>
            <Input
              id="worker-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "Laisser vide pour ne pas changer" : "8 caractères minimum"}
              className="mt-1"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label className="mb-2 block">Permissions</Label>
            <PermissionMatrix value={permissions} onChange={setPermissions} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={async () => {
              if (!fullName.trim()) {
                toast.error("Le nom est requis");
                return;
              }
              if (!isEdit && !email.trim()) {
                toast.error("L'email est requis");
                return;
              }
              if (!isEdit && password.length < 8) {
                toast.error("Mot de passe : 8 caractères minimum");
                return;
              }
              if (allowPassword && password && password.length < 8) {
                toast.error("Mot de passe : 8 caractères minimum");
                return;
              }
              await onSubmit({
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                password,
                permissions,
              });
            }}
          >
            {pending ? "Enregistrement…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
