-- ============================================================================
-- BolaNoBrasil — Schema de dados de futebol no Supabase
-- Rode este script no SQL Editor do painel Supabase.
-- O worker grava aqui com a SERVICE ROLE; o site lê com a ANON KEY (apenas SELECT).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Classificação (uma linha por competição+temporada; o worker faz UPSERT)
-- ---------------------------------------------------------------------------
create table if not exists public.football_standings (
  id          bigint generated always as identity primary key,
  competition text        not null default 'BSA',
  season      integer     not null,
  matchday    integer,
  table_json  jsonb       not null,
  updated_at  timestamptz not null default now(),
  unique (competition, season)
);

-- ---------------------------------------------------------------------------
-- Artilheiros (uma linha por competição+temporada; UPSERT)
-- ---------------------------------------------------------------------------
create table if not exists public.football_scorers (
  id           bigint generated always as identity primary key,
  competition  text        not null default 'BSA',
  season       integer     not null,
  scorers_json jsonb       not null,
  updated_at   timestamptz not null default now(),
  unique (competition, season)
);

-- ---------------------------------------------------------------------------
-- Jogos (uma linha por partida; UPSERT por api_id)
-- ---------------------------------------------------------------------------
create table if not exists public.football_matches (
  id          bigint generated always as identity primary key,
  api_id      bigint      not null unique,
  competition text        not null default 'BSA',
  season      integer     not null,
  matchday    integer,
  utc_date    timestamptz,
  status      text,
  home_team   text,
  away_team   text,
  home_crest  text,
  away_crest  text,
  home_score  integer,
  away_score  integer,
  raw_json    jsonb,
  updated_at  timestamptz not null default now()
);

create index if not exists idx_football_matches_season  on public.football_matches (competition, season);
create index if not exists idx_football_matches_matchday on public.football_matches (competition, season, matchday);
create index if not exists idx_football_matches_utc      on public.football_matches (utc_date);

-- ---------------------------------------------------------------------------
-- Estado da automação (controle de idempotência: última rodada já resumida)
-- ---------------------------------------------------------------------------
create table if not exists public.automation_state (
  key        text primary key,
  value      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- RLS: leitura pública (anon), escrita restrita à service_role.
-- A service_role ignora RLS por padrão, então basta liberar SELECT ao anon.
-- ============================================================================
alter table public.football_standings enable row level security;
alter table public.football_scorers   enable row level security;
alter table public.football_matches   enable row level security;
alter table public.automation_state   enable row level security;

drop policy if exists "anon read standings" on public.football_standings;
create policy "anon read standings" on public.football_standings
  for select to anon, authenticated using (true);

drop policy if exists "anon read scorers" on public.football_scorers;
create policy "anon read scorers" on public.football_scorers
  for select to anon, authenticated using (true);

drop policy if exists "anon read matches" on public.football_matches;
create policy "anon read matches" on public.football_matches
  for select to anon, authenticated using (true);

-- automation_state NÃO recebe policy de leitura anon: fica acessível só à service_role.
