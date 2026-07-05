import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/public-layout";
import { useListPublishedPosts } from "@/api";
import { resolveCoverImage } from "@/lib/supabase";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { PageIntro } from "@/components/public/page-intro";
import { Stagger, StaggerItem } from "@/components/motion";

export const Route = createFileRoute("/blog/")({
  component: BlogListPage,
});

function BlogListPage() {
  const { data: posts, isLoading } = useListPublishedPosts();

  return (
    <PublicLayout>
      <PageIntro
        title="Blog & actualités"
        description="Conseils, récits et inspirations pour voyager en Algérie."
      >
        {isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-md" />
            ))}
          </div>
        ) : (
          <Stagger className="mt-10 grid gap-6 md:grid-cols-2">
            {(posts ?? []).map((post) => (
              <StaggerItem key={post.id}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="group block overflow-hidden rounded-md border border-border bg-card transition hover:shadow-elevated"
                >
                  <img
                    src={resolveCoverImage(post.coverImage, PLACEHOLDER_IMAGES.hero)}
                    alt={post.title}
                    className="aspect-video w-full object-cover transition group-hover:scale-105"
                  />
                  <div className="p-6">
                    <time className="text-xs text-muted-foreground">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("fr-FR")
                        : ""}
                    </time>
                    <h2 className="mt-2 font-display text-xl font-bold text-foreground group-hover:text-primary">
                      {post.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </PageIntro>
    </PublicLayout>
  );
}
