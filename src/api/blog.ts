import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BlogPost } from "./types";
import { mapBlogPost } from "./mappers";
import { supabase } from "@/lib/supabase";

export function useListPublishedPosts() {
  return useQuery({
    queryKey: ["blog", "published"],
    queryFn: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => mapBlogPost(r));
    },
  });
}

export function useListAllPosts() {
  return useQuery({
    queryKey: ["blog", "all"],
    queryFn: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => mapBlogPost(r));
    },
  });
}

export function useGetPostBySlug(slug: string) {
  return useQuery({
    queryKey: ["blog", slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<BlogPost | null> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? mapBlogPost(data) : null;
    },
  });
}

export type BlogPostInput = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage?: string | null;
  publishedAt?: string | null;
};

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BlogPostInput) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert({
          slug: input.slug,
          title: input.title,
          excerpt: input.excerpt,
          body: input.body,
          cover_image: input.coverImage,
          published_at: input.publishedAt,
        })
        .select()
        .single();
      if (error) throw error;
      return mapBlogPost(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog"] }),
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: BlogPostInput & { id: string }) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .update({
          slug: input.slug,
          title: input.title,
          excerpt: input.excerpt,
          body: input.body,
          cover_image: input.coverImage,
          published_at: input.publishedAt,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapBlogPost(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog"] }),
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog"] }),
  });
}
