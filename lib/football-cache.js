// Leitura dos dados de futebol em cache no Supabase (tabelas football_*).
// Usado pelas rotas /api/standings, /api/scorers e /api/matches para servir
// dados persistidos pelo worker, evitando bater na football-data.org a cada
// visita. Cada função retorna `null` quando não há dado em cache, deixando a
// rota decidir pelo fallback à API ao vivo.

import { getSupabaseClient } from "@/lib/supabase";

export async function readStandings(competition = "BSA", season = 2026) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("football_standings")
    .select("table_json, updated_at")
    .eq("competition", competition)
    .eq("season", Number(season))
    .maybeSingle();

  if (error || !data?.table_json) return null;
  const standings = data.table_json;
  return Array.isArray(standings) && standings.length
    ? { standings, updatedAt: data.updated_at }
    : null;
}

export async function readScorers(competition = "BSA", season = 2026) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("football_scorers")
    .select("scorers_json, updated_at")
    .eq("competition", competition)
    .eq("season", Number(season))
    .maybeSingle();

  if (error || !data?.scorers_json) return null;
  const scorers = data.scorers_json;
  return Array.isArray(scorers) && scorers.length
    ? { scorers, updatedAt: data.updated_at }
    : null;
}

export async function readMatches(competition = "BSA", season = 2026) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("football_matches")
    .select("raw_json")
    .eq("competition", competition)
    .eq("season", Number(season))
    .order("utc_date", { ascending: true });

  if (error || !data?.length) return null;
  const matches = data.map((row) => row.raw_json).filter(Boolean);
  return matches.length ? { matches } : null;
}
