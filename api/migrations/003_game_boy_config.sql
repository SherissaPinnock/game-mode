-- ─── 003_game_boy_config.sql ────────────────────────────────────────────────
-- Add the Docker Game Boy experience to the game config seed.
-- Safe to run after 002_game_config.sql in existing environments.
-- ────────────────────────────────────────────────────────────────────────────

insert into public.game_config (game_id, published, featured)
values ('game-boy', true, false)
on conflict (game_id) do nothing;
