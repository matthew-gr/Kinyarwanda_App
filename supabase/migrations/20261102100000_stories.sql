-- Prompt 10: Stories.
--
-- Each learner's stories, written by the generate-story function, which alone adds them.
-- The learner reads their own and records reading progress and difficulty feedback; devices
-- download stories changed since the last updated_at they saw. Admins read every story, so a
-- reported mistake can be checked.

create table public.stories (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  title_en text not null,
  -- [{rw, en, audio_path}], one per sentence.
  sentences jsonb not null,
  -- [{word, en}]: every distinct word as written in the story.
  glossary jsonb not null,
  -- [{question, options, answer}].
  questions jsonb not null,
  -- What the story was asked for: share, limit, verb level, tense, feedback, note.
  settings jsonb not null,
  coverage smallint not null check (coverage between 0 and 100),
  source text not null,
  audio_source text,
  status text not null default 'ai_draft' check (status in ('ai_draft', 'reviewed', 'approved')),
  -- Reading and repeats: read once, then back after 1 day, 1 week, 1 month and 3 months.
  reads smallint not null default 0 check (reads >= 0),
  last_read_at timestamptz,
  next_due_at timestamptz,
  retired boolean not null default false,
  feedback text check (feedback in ('too_hard', 'too_easy', 'just_right')),
  feedback_note text check (length(feedback_note) <= 140),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stories_user_updated on public.stories (user_id, updated_at);
create index stories_user_created on public.stories (user_id, created_at);

create function public.touch_updated_at() returns trigger
  language plpgsql set search_path = ''
  as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger stories_touch before update on public.stories
  for each row execute function public.touch_updated_at();

alter table public.stories enable row level security;

create policy "Learners read their own stories" on public.stories
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Admins read stories" on public.stories
  for select to authenticated using ((select public.is_admin()));
create policy "Learners record their reading" on public.stories
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.stories from anon, authenticated;
grant select on public.stories to authenticated;
grant update (reads, last_read_at, next_due_at, retired, feedback, feedback_note)
  on public.stories to authenticated;

-- A mistake report is about a course item or, from Stories, about a story.
alter table public.reports alter column item_id drop not null;
alter table public.reports
  add column story_id uuid references public.stories (id) on delete set null;
alter table public.reports drop constraint reports_module_check;
alter table public.reports add constraint reports_module_check
  check (module in ('learn', 'review', 'stories'));
alter table public.reports add constraint reports_about_one_thing
  check ((module = 'stories') = (item_id is null));
create index reports_story on public.reports (story_id);

grant insert (story_id) on public.reports to anon, authenticated;
