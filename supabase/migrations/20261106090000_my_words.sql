-- Decision 185: each learner's own word list. A word is a Kinyarwanda root and its English, with
-- the learner's tags. It is learned and reviewed through the answer log like a course word, so
-- answers name it by this row's id. A removed word stays as a row, marked deleted, so every
-- device learns it is gone.

create table public.my_words (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  form_id uuid not null,
  rw text not null check (char_length(rw) between 1 and 60),
  en text not null check (char_length(en) between 1 and 120),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create index my_words_user_updated on public.my_words (user_id, updated_at);

alter table public.my_words enable row level security;

create policy "Learners read their own words"
  on public.my_words for select to authenticated
  using (user_id = auth.uid());

create policy "Learners add their own words"
  on public.my_words for insert to authenticated
  with check (user_id = auth.uid());

create policy "Learners change their own words"
  on public.my_words for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.my_words from anon, authenticated;
grant select on public.my_words to authenticated;
grant insert (id, user_id, form_id, rw, en, tags, created_at, updated_at, deleted)
  on public.my_words to authenticated;
-- Uploads are upserts, which set every column sent; user_id is never sent.
grant update (id, form_id, rw, en, tags, created_at, updated_at, deleted)
  on public.my_words to authenticated;

-- The newest change wins: an upload older than the row's last change leaves the row as it is,
-- as when a device that was offline sends an edit made before another device's.
create function public.my_words_keep_newest() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  if new.updated_at < old.updated_at then
    return old;
  end if;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger my_words_keep_newest
  before update on public.my_words
  for each row execute function public.my_words_keep_newest();
