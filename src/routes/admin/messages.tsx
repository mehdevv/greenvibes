import { createFileRoute } from "@tanstack/react-router";
import { useListContactMessages, useMarkContactRead } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/messages")({
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  const { canWrite } = useAuth();
  const { data: messages, isLoading } = useListContactMessages();
  const markRead = useMarkContactRead();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-foreground">Messages contact</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <div className="grid gap-4">
          {(messages ?? []).map((m) => (
            <Card key={m.id} className={!m.isRead ? "border-l-4 border-l-leaf" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{m.subject || "Sans objet"}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString("fr-FR")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-medium">{m.name} — {m.email}</div>
                {m.phone && <div className="text-muted-foreground">{m.phone}</div>}
                <p className="whitespace-pre-wrap text-muted-foreground">{m.message}</p>
                {canWrite && !m.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await markRead.mutateAsync(m.id);
                        toast.success("Marqué comme lu");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Erreur");
                      }
                    }}
                  >
                    Marquer comme lu
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {(messages ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
          )}
        </div>
      )}
    </div>
  );
}
