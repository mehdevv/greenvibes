import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/public-layout";
import { useGetPostBySlug } from "@/api";
import { resolveCoverImage } from "@/lib/supabase";
import { PLACEHOLDER_IMAGES, FLOATING_NAV_OFFSET } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const { data: post, isLoading } = useGetPostBySlug(slug);

  if (isLoading) {
    return (
      <PublicLayout>
        <Skeleton className={cn("mx-auto h-96 max-w-3xl rounded-md", FLOATING_NAV_OFFSET)} />
      </PublicLayout>
    );
  }

  if (!post) {
    return (
      <PublicLayout>
        <div className={cn("mx-auto max-w-3xl px-6 pb-24 text-center", FLOATING_NAV_OFFSET)}>
          <h1 className="text-2xl font-bold">Article introuvable</h1>
          <Link to="/blog" className="mt-4 inline-block text-foreground hover:underline">
            Retour au blog
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <article className={cn("mx-auto max-w-3xl px-6 pb-16", FLOATING_NAV_OFFSET)}>
        <Reveal>
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour au blog
        </Link>
        <time className="mt-6 block text-sm text-muted-foreground">
          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("fr-FR") : ""}
        </time>
        <h1 className="mt-3 font-display text-4xl font-light text-foreground">{post.title}</h1>
        </Reveal>
        <Reveal delay={0.1}>
        <img
          src={resolveCoverImage(post.coverImage, PLACEHOLDER_IMAGES.hero)}
          alt={post.title}
          className="mt-8 w-full rounded-md object-cover"
        />
        </Reveal>
        <Reveal delay={0.15}>
        <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-muted-foreground leading-relaxed">
          {post.body}
        </div>
        </Reveal>
      </article>
    </PublicLayout>
  );
}
