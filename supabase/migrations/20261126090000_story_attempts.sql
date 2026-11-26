-- Decision 197: every request for a new story is logged before Claude is asked, so the daily
-- limit counts attempts (failed ones cost tokens too), and a learner can't have two stories
-- being written at once: requests sent together would otherwise all pass the limit.
-- Only the generate-story function reads or writes this table.

create table public.story_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  finished_at timestamptz
);

create index story_attempts_user_started on public.story_attempts (user_id, started_at);
-- At most one story being written per learner; a second insert fails with 23505.
create unique index story_attempts_one_running on public.story_attempts (user_id)
  where status = 'running';

alter table public.story_attempts enable row level security;
revoke all on public.story_attempts from anon, authenticated;
