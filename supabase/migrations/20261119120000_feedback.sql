-- Learner feedback from the Feedback box on Profile. Only the feedback server function writes
-- here (with the service role); it also copies each message, without the account, into
-- feedback/FEEDBACK.md in the public GitHub repository and sets committed_at when it has.
-- Admins can read every row; learners can read their own.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- The part of the app the message is about, as the learner picked it.
  area text not null,
  app_version text not null,
  message text not null check (char_length(message) between 3 and 2000),
  committed_at timestamptz
);

create index feedback_user_created on public.feedback (user_id, created_at);
create index feedback_uncommitted on public.feedback (created_at) where committed_at is null;

alter table public.feedback enable row level security;

create policy "feedback: read own, admins read all" on public.feedback
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

grant select on public.feedback to authenticated;
