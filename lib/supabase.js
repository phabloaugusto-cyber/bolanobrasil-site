import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Cliente público (somente leitura, sujeito ao RLS). A escrita é feita pelo
  // worker via getSupabaseAdminClient (service role). A anon key é segura para
  // expor; nunca usar a service role aqui.
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase env vars não configuradas.");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      // O Next.js cacheia respostas de fetch() na Data Cache (inclusive as do
      // supabase-js) — isso fazia leituras servidas a partir do build, sem
      // refletir posts criados depois. Forçar no-store garante leitura fresca.
      fetch: (input, init = {}) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
