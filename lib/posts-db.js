import { getSupabaseClient } from "@/lib/supabase";

export function normalizePost(item) {
  return {
    id: item.id,
    title: item.title || "",
    titulo: item.title || "",
    slug: item.slug || "",
    excerpt: item.excerpt || "",
    resumo: item.excerpt || "",
    content: item.content || "",
    conteudo: item.content || "",
    image_url: item.image_url || null,
    imagem: item.image_url || null,
    published_at: item.published_at || null,
    publishedAt: item.published_at || null,
    type: item.type || "",
    club: item.club || null,
    coach_out: item.coach_out || "",
    coach_in: item.coach_in || "",
    change_date: item.change_date || null,
    round: item.round ?? null,
    featured: Boolean(item.featured),
    show_on_home: Boolean(item.show_on_home),
    home_order: item.home_order ?? null,
    status: item.status || "draft",
    x_text: item.x_text || "",
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
  };
}

export async function listPublishedPosts({
  type = null,
  showOnHome = null,
  featured = null,
  club = null,
  round = null,
  limit = null,
} = {}) {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("posts")
    .select("*")
    .eq("status", "published");

  if (type) query = query.eq("type", type);
  if (showOnHome !== null) query = query.eq("show_on_home", showOnHome);
  if (featured !== null) query = query.eq("featured", featured);
  if (club) query = query.eq("club", club);
  if (round !== null && round !== undefined) query = query.eq("round", round);

  query = query
    .order("home_order", { ascending: true, nullsFirst: false })
    .order("published_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || "Erro ao listar posts.");
  }

  return (data || []).map(normalizePost);
}

export async function getPublishedPostBySlug(slug) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("slug", slug)
    .single();

  if (error) {
    throw new Error(error.message || "Erro ao buscar post.");
  }

  if (!data) return null;

  return normalizePost(data);
}
