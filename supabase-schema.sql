-- Ganesha's Modak Rush — Supabase setup
-- Run this entire file in Supabase Dashboard -> SQL Editor.
-- Then enable Authentication -> Sign In / Providers -> Anonymous Sign-Ins.

create table if not exists public.leaderboard (
    id uuid primary key references auth.users(id) on delete cascade,
    player_name text not null check (char_length(player_name) between 1 and 20),
    high_score integer not null default 0 check (high_score >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

drop policy if exists "Leaderboard is publicly readable" on public.leaderboard;
drop policy if exists "Players can create their own score" on public.leaderboard;
drop policy if exists "Players can update their own score" on public.leaderboard;

create policy "Leaderboard is publicly readable"
on public.leaderboard
for select
to anon, authenticated
using (true);

create policy "Players can create their own score"
on public.leaderboard
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Players can update their own score"
on public.leaderboard
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

grant select on public.leaderboard to anon, authenticated;
grant insert, update on public.leaderboard to authenticated;

create index if not exists leaderboard_score_idx
on public.leaderboard (high_score desc);


-- Case-insensitive unique player names.
-- This means "maddy" and "MADDY" are treated as the same name.
-- Run this after the table exists. If you already have duplicate names
-- differing only by case, resolve those rows first before creating the index.
create unique index if not exists leaderboard_player_name_lower_uidx
on public.leaderboard (lower(player_name));

-- Server-side availability check used by the game before a player starts.
-- The current user's own name is considered available, so replaying with
-- the same name is allowed.
create or replace function public.is_player_name_available(p_name text)
returns boolean
language sql
security definer
set search_path = public
as $$
    select not exists (
        select 1
        from public.leaderboard
        where lower(trim(player_name)) = lower(trim(p_name))
          and id <> (select auth.uid())
    );
$$;

grant execute on function public.is_player_name_available(text) to anon, authenticated;
