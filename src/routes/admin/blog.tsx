import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useListAllPosts, useCreateBlogPost, useDeleteBlogPost } from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/blog")({
  component: AdminBlogPage,
});

function AdminBlogPage() {
  const { canWrite } = useAuth();
  const { data: posts, isLoading } = useListAllPosts();
  const createPost = useCreateBlogPost();
  const deletePost = useDeleteBlogPost();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    coverImage: "",
    publish: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPost.mutateAsync({
        slug: form.slug,
        title: form.title,
        excerpt: form.excerpt,
        body: form.body,
        coverImage: form.coverImage || null,
        publishedAt: form.publish ? new Date().toISOString() : null,
      });
      toast.success("Article publié");
      setShowForm(false);
      setForm({ slug: "", title: "", excerpt: "", body: "", coverImage: "", publish: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-foreground">Blog</h1>
        {canWrite && (
          <Button className="" onClick={() => setShowForm(!showForm)}>
            Nouvel article
          </Button>
        )}
      </div>

      {showForm && canWrite && (
        <Card>
          <CardHeader><CardTitle>Nouvel article</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Titre</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label>Extrait</Label>
                <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>Contenu</Label>
                <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={8} />
              </div>
              <ImageUpload
                label="Image de couverture"
                value={form.coverImage}
                onChange={(coverImage) => setForm({ ...form, coverImage })}
              />
              <Button type="submit" className="w-fit rounded-full" disabled={createPost.isPending}>
                Publier
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <div className="grid gap-4">
          {(posts ?? []).map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-muted-foreground">
                    /blog/{p.slug} · {p.publishedAt ? "Publié" : "Brouillon"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/blog/$slug" params={{ slug: p.slug }}>Voir</Link>
                  </Button>
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={async () => {
                        if (!confirm("Supprimer cet article ?")) return;
                        try {
                          await deletePost.mutateAsync(p.id);
                          toast.success("Article supprimé");
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Erreur");
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
