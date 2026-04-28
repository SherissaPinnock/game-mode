-- ─── 002_game_config.sql ──────────────────────────────────────────────────────
-- Admin-controlled game visibility and featured flags.
-- Toggle any game on/off without redeploying the app.
-- Run in the Supabase SQL editor after 001_game_schema.sql
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists public.game_config (
  game_id    text        primary key,
  published  boolean     not null default true,
  featured   boolean     not null default false,
  sort_order int4        not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.game_config enable row level security;

-- Anyone can read (app fetches this on load to know which games to show)
create policy "game_config_public_read" on public.game_config
  for select using (true);

-- Authenticated users (including anonymous) can write.
-- The /admin route is additionally protected by VITE_ADMIN_PASSWORD.
create policy "game_config_auth_write" on public.game_config
  for all
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ─── Seed: all 16 games, 4 featured ──────────────────────────────────────────
insert into public.game_config (game_id, published, featured) values
  ('archery-quiz',       true,  false),
  ('python-and-ladders', true,  true),
  ('connections',        true,  false),
  ('memory-match',       true,  true),
  ('scale-or-die',       true,  false),
  ('prompt-sculptor',    true,  false),
  ('build-a-startup',    true,  false),
  ('devops-dynamo',      true,  true),
  ('clue-game',          true,  false),
  ('sudoku',             true,  false),
  ('checkers',           true,  true),
  ('hackgammon',         true,  false),
  ('mahjong',            true,  false),
  ('chess-clouds',       true,  false),
  ('db-quest',           true,  false),
  ('mystery',            true,  false)
on conflict (game_id) do nothing;
