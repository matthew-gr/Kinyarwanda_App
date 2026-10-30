-- Prompt 8: speed drills.
--
-- number_phrases holds the numbers Speed Speaking and Number Listening use, with their words
-- and audio. Like the course, everyone reads it, only admins change it, and nothing is deleted.
-- drill_scores is each learner's finished sessions, append-only like the answer log, so
-- personal bests follow the learner to every device.

create table public.number_phrases (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('count', 'noun', 'money', 'phone')),
  value text not null check (value ~ '^[0-9]+$'),
  level smallint not null check (level between 1 and 7),
  -- A phone number's groups as read aloud, such as [3, 3, 2, 2].
  groups jsonb,
  noun_item_id uuid references public.items (id),
  noun text,
  noun_en text,
  text text not null check (length(trim(text)) > 0),
  en text not null check (length(trim(en)) > 0),
  audio_path text,
  audio_source text,
  status text not null default 'ai_draft'
    check (status in ('dev', 'ai_draft', 'reviewed', 'approved')),
  source text not null,
  retired boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index number_phrases_updated_at on public.number_phrases (updated_at);

create trigger number_phrases_stamp before update on public.number_phrases
  for each row execute function public.stamp_content();

alter table public.number_phrases enable row level security;

create policy "Everyone reads the numbers" on public.number_phrases
  for select to anon, authenticated using (true);
create policy "Admins add numbers" on public.number_phrases for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins change numbers" on public.number_phrases for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.number_phrases from anon, authenticated;
grant select on public.number_phrases to anon, authenticated;
grant insert (id, kind, value, level, groups, noun_item_id, noun, noun_en, text, en, status,
  source, retired) on public.number_phrases to authenticated;
grant update (kind, value, level, groups, noun_item_id, noun, noun_en, text, en, status, source,
  retired) on public.number_phrases to authenticated;

-- A clip belongs to a course form or to a number, never both.
alter table public.audio_clips alter column form_id drop not null;
alter table public.audio_clips
  add column number_phrase_id uuid references public.number_phrases (id);
alter table public.audio_clips
  add constraint audio_clips_one_owner check (num_nonnulls(form_id, number_phrase_id) = 1);
create index audio_clips_number_phrase on public.audio_clips (number_phrase_id);

create table public.drill_scores (
  -- Made on the device, so a retried upload of the same session is the same row.
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  drill text not null check (drill in ('speed_speaking', 'number_listening')),
  level smallint not null check (level between 1 and 7),
  played_at timestamptz not null,
  answers integer not null check (answers >= 0),
  correct integer not null check (correct between 0 and answers),
  median_ms integer check (median_ms >= 0),
  best_countdown_ms integer check (best_countdown_ms > 0),
  seq bigint generated always as identity unique,
  received_at timestamptz not null default now()
);

create index drill_scores_user_seq on public.drill_scores (user_id, seq);

alter table public.drill_scores enable row level security;

create policy "Learners read their own scores" on public.drill_scores
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Learners add their own scores" on public.drill_scores
  for insert to authenticated with check ((select auth.uid()) = user_id);

revoke all on public.drill_scores from anon, authenticated;
grant select on public.drill_scores to authenticated;
grant insert (id, user_id, drill, level, played_at, answers, correct, median_ms,
  best_countdown_ms) on public.drill_scores to authenticated;
