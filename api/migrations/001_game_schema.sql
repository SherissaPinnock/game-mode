-- ─── 001_game_schema.sql ──────────────────────────────────────────────────────
-- Game Mode – initial Supabase schema
-- Run this in the Supabase SQL editor or via `supabase db push`
-- ──────────────────────────────────────────────────────────────────────────────

-- Extensions
create extension if not exists "pgcrypto";

-- ─── User Profiles ────────────────────────────────────────────────────────────
-- One row per auth.users entry (including anonymous users).
-- Auto-created by trigger on_auth_user_created.
create table if not exists public.user_profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  display_name    text        not null default 'Anonymous',
  avatar_initials text        not null default 'AN',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-insert a profile row whenever a new user signs up (including anon)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, display_name, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Anonymous'),
    upper(left(coalesce(new.raw_user_meta_data->>'display_name', 'AN'), 2))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Game Sessions ────────────────────────────────────────────────────────────
-- One row per completed (or abandoned) play-through.
create table if not exists public.game_sessions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  game_id       text        not null,
  score         int4        not null default 0,
  xp_earned     int4        not null default 0,    -- normalised XP used for ranking
  accuracy      numeric(5,2),                       -- 0.00 – 100.00
  correct_count int4        not null default 0,
  total_count   int4        not null default 0,
  duration_sec  int4,
  metadata      jsonb       not null default '{}',  -- game-specific extras (level, incidents, etc.)
  created_at    timestamptz not null default now()
);

-- ─── Game Attempts ────────────────────────────────────────────────────────────
-- One row per individual question / task attempt.
create table if not exists public.game_attempts (
  id          uuid        primary key default gen_random_uuid(),
  session_id  uuid        references public.game_sessions(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  game_id     text        not null,
  category    text        not null,  -- matches frontend Category type
  is_correct  boolean     not null,
  latency_ms  int4,                  -- response time in milliseconds
  question_id text,                  -- optional reference to CMS/JSON content
  created_at  timestamptz not null default now()
);

-- ─── Game Saves ───────────────────────────────────────────────────────────────
-- One resume-state slot per user per game (upsert on conflict).
create table if not exists public.game_saves (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  game_id    text        not null,
  save_state jsonb       not null default '{}',
  label      text        not null default '',  -- e.g. "Incident 2 of 3"
  saved_at   timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- ─── Roadmap Progress ────────────────────────────────────────────────────────
-- Completed level IDs per user per game.
create table if not exists public.roadmap_progress (
  user_id          uuid        not null references auth.users(id) on delete cascade,
  game_id          text        not null,
  completed_levels text[]      not null default '{}',
  updated_at       timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- ─── Game Leaderboard ────────────────────────────────────────────────────────
-- Denormalised summary maintained by trigger — fast reads, no aggregation at query time.
-- game_id = 'global' for the cross-game XP total row.
create table if not exists public.game_leaderboard (
  user_id         uuid        not null references auth.users(id) on delete cascade,
  game_id         text        not null,
  high_score      int4        not null default 0,
  total_xp        int4        not null default 0,
  sessions_played int4        not null default 0,
  avg_accuracy    numeric(5,2) not null default 0,
  display_name    text        not null default 'Anonymous',
  avatar_initials text        not null default 'AN',
  updated_at      timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- ─── Trigger: maintain leaderboard on session insert ─────────────────────────
create or replace function public.update_leaderboard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_display_name    text;
  v_avatar_initials text;
begin
  select display_name, avatar_initials
    into v_display_name, v_avatar_initials
    from public.user_profiles
   where id = new.user_id;

  v_display_name    := coalesce(v_display_name, 'Anonymous');
  v_avatar_initials := coalesce(v_avatar_initials, 'AN');

  -- Per-game row
  insert into public.game_leaderboard
    (user_id, game_id, high_score, total_xp, sessions_played, avg_accuracy,
     display_name, avatar_initials, updated_at)
  values
    (new.user_id, new.game_id, new.score, new.xp_earned, 1,
     coalesce(new.accuracy, 0), v_display_name, v_avatar_initials, now())
  on conflict (user_id, game_id) do update set
    high_score      = greatest(game_leaderboard.high_score, excluded.high_score),
    total_xp        = game_leaderboard.total_xp + excluded.total_xp,
    sessions_played = game_leaderboard.sessions_played + 1,
    avg_accuracy    = round(
      (game_leaderboard.avg_accuracy * game_leaderboard.sessions_played + excluded.avg_accuracy)
      / (game_leaderboard.sessions_played + 1), 2),
    display_name    = excluded.display_name,
    avatar_initials = excluded.avatar_initials,
    updated_at      = now();

  -- Global XP row (game_id = 'global')
  insert into public.game_leaderboard
    (user_id, game_id, high_score, total_xp, sessions_played, avg_accuracy,
     display_name, avatar_initials, updated_at)
  values
    (new.user_id, 'global', new.score, new.xp_earned, 1,
     coalesce(new.accuracy, 0), v_display_name, v_avatar_initials, now())
  on conflict (user_id, game_id) do update set
    high_score      = greatest(game_leaderboard.high_score, excluded.high_score),
    total_xp        = game_leaderboard.total_xp + excluded.total_xp,
    sessions_played = game_leaderboard.sessions_played + 1,
    avg_accuracy    = round(
      (game_leaderboard.avg_accuracy * game_leaderboard.sessions_played + excluded.avg_accuracy)
      / (game_leaderboard.sessions_played + 1), 2),
    display_name    = excluded.display_name,
    avatar_initials = excluded.avatar_initials,
    updated_at      = now();

  return new;
end;
$$;

drop trigger if exists on_game_session_created on public.game_sessions;
create trigger on_game_session_created
  after insert on public.game_sessions
  for each row execute procedure public.update_leaderboard();

-- ─── Views ────────────────────────────────────────────────────────────────────

-- Per-game ranked leaderboard (public, used by game-specific boards)
create or replace view public.v_leaderboard_by_game as
select
  user_id,
  game_id,
  display_name,
  avatar_initials,
  high_score,
  total_xp,
  sessions_played,
  round(avg_accuracy, 1)                                        as avg_accuracy_pct,
  rank() over (partition by game_id order by total_xp desc)    as rank
from public.game_leaderboard
where game_id <> 'global';

-- Global XP leaderboard (public, used on landing page)
create or replace view public.v_leaderboard_global as
select
  user_id,
  display_name,
  avatar_initials,
  total_xp,
  sessions_played,
  round(avg_accuracy, 1)                  as avg_accuracy_pct,
  rank() over (order by total_xp desc)   as rank
from public.game_leaderboard
where game_id = 'global';

-- Per-user category accuracy — feeds GameRecommendations weak-area logic
create or replace view public.v_user_category_accuracy as
select
  user_id,
  game_id,
  category,
  count(*)                                                            as total_attempts,
  sum(case when is_correct then 1 else 0 end)                        as correct_count,
  round(100.0 * sum(case when is_correct then 1 else 0 end) / count(*), 1) as accuracy_pct
from public.game_attempts
group by user_id, game_id, category;

-- User progress profile card — games played, XP, accuracy
create or replace view public.v_user_progress as
select
  u.id                                          as user_id,
  p.display_name,
  p.avatar_initials,
  count(distinct s.id)                          as total_sessions,
  count(distinct s.game_id)                     as games_played,
  coalesce(sum(s.xp_earned), 0)                 as total_xp,
  coalesce(round(avg(s.accuracy), 1), 0)        as overall_accuracy
from auth.users u
left join public.user_profiles  p on p.id = u.id
left join public.game_sessions  s on s.user_id = u.id
group by u.id, p.display_name, p.avatar_initials;

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.user_profiles    enable row level security;
alter table public.game_sessions    enable row level security;
alter table public.game_attempts    enable row level security;
alter table public.game_saves       enable row level security;
alter table public.roadmap_progress enable row level security;
alter table public.game_leaderboard enable row level security;

-- user_profiles
create policy "profiles_own_select" on public.user_profiles for select using (auth.uid() = id);
create policy "profiles_own_insert" on public.user_profiles for insert with check (auth.uid() = id);
create policy "profiles_own_update" on public.user_profiles for update using (auth.uid() = id);

-- game_sessions: users own their rows
create policy "sessions_own"        on public.game_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- game_attempts: users own their rows
create policy "attempts_own"        on public.game_attempts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- game_saves: users own their rows
create policy "saves_own"           on public.game_saves for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- roadmap_progress: users own their rows
create policy "progress_own"        on public.roadmap_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- game_leaderboard: public read, own write (trigger uses security definer so it bypasses RLS)
create policy "lb_public_read"      on public.game_leaderboard for select using (true);
create policy "lb_own_write"        on public.game_leaderboard for insert
  with check (auth.uid() = user_id);
create policy "lb_own_update"       on public.game_leaderboard for update
  using (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_game_sessions_user      on public.game_sessions(user_id);
create index if not exists idx_game_sessions_game      on public.game_sessions(game_id);
create index if not exists idx_game_sessions_created   on public.game_sessions(created_at desc);
create index if not exists idx_game_attempts_session   on public.game_attempts(session_id);
create index if not exists idx_game_attempts_user_game on public.game_attempts(user_id, game_id);
create index if not exists idx_game_attempts_category  on public.game_attempts(user_id, category);
create index if not exists idx_leaderboard_game_xp     on public.game_leaderboard(game_id, total_xp desc);
create index if not exists idx_roadmap_user_game       on public.roadmap_progress(user_id, game_id);
