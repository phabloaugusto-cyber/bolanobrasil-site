// Cliente Supabase com SERVICE ROLE — permite ESCRITA (insert/update/upsert).
// ATENÇÃO: usar SOMENTE em código server-side (worker). Nunca importar em
// componentes client nem expor a chave via NEXT_PUBLIC_*.
//
// Suporta uso tanto em ESM (Next) quanto em CommonJS (worker.js) via require.

const { createClient } = require("@supabase/supabase-js");

let cached = null;

function getSupabaseAdminClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}

module.exports = { getSupabaseAdminClient };
