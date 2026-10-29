-- Prompt 3: accounts and sync.
--
-- Each learner reads and writes only their own rows. The answer log is append-only: there is
-- no update or delete policy, so nobody can change an answer once it is saved. Progress (Learn
-- streaks, graduations, the Review schedule) is worked out from the log on each device, so the
-- server keeps the log and the profile, and nothing else per learner yet.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  verb_level smallint not null default 1 check (verb_level between 1 and 6),
  daily_goal smallint not null default 10 check (daily_goal between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Learners read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Learners create their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "Learners update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create table public.answer_events (
  -- Made on the device, so a retried upload of the same answer is the same row.
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id uuid not null,
  form_id uuid,
  module text not null check (module in ('learn', 'review')),
  -- One answer per card shown: a double tap or a replayed sync cannot add a second.
  card_view_id uuid not null unique,
  result text not null check (result in ('got', 'missed')),
  -- The device's clock when the learner answered. Progress is replayed in this order.
  answered_at timestamptz not null,
  -- Server order, so each device can ask for "everything after the last row I saw".
  seq bigint generated always as identity unique,
  received_at timestamptz not null default now()
);

create index answer_events_user_seq on public.answer_events (user_id, seq);

alter table public.answer_events enable row level security;

create policy "Learners read their own answers"
  on public.answer_events for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Learners add their own answers"
  on public.answer_events for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Columns the app may write. seq and received_at are always the server's.
revoke all on public.answer_events from anon, authenticated;
grant select on public.answer_events to authenticated;
grant insert (id, user_id, item_id, form_id, module, card_view_id, result, answered_at)
  on public.answer_events to authenticated;

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;
