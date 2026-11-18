-- Decision 188: a learner's own word can carry an emoji, a picture (or GIF) and a recording.
-- The files live in a private bucket, in a folder named after the learner, so only they can
-- read or change them; the word row keeps their paths.

alter table public.my_words
  add column emoji text check (char_length(emoji) <= 16),
  add column picture_path text check (char_length(picture_path) <= 200),
  add column audio_path text check (char_length(audio_path) <= 200);

grant insert (emoji, picture_path, audio_path) on public.my_words to authenticated;
grant update (emoji, picture_path, audio_path) on public.my_words to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'my-words',
    'my-words',
    false,
    2097152,
    array[
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'
    ]
  )
  on conflict (id) do nothing;

create policy "Learners read their own word files"
  on storage.objects for select to authenticated
  using (bucket_id = 'my-words' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Learners add their own word files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'my-words' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Learners change their own word files"
  on storage.objects for update to authenticated
  using (bucket_id = 'my-words' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'my-words' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Learners remove their own word files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'my-words' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Decision 190: time spent learning, per device per day. Each device uploads its own totals;
-- a learner's time on a day is the sum over their devices. A total only ever grows, so a late
-- or repeated upload never lowers it.

create table public.activity_days (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  device_id uuid not null,
  day date not null,
  seconds integer not null check (seconds between 0 and 86400),
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id, day)
);

alter table public.activity_days enable row level security;

create policy "Learners read their own time"
  on public.activity_days for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Learners add their own time"
  on public.activity_days for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Learners change their own time"
  on public.activity_days for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.activity_days from anon, authenticated;
grant select on public.activity_days to authenticated;
grant insert (user_id, device_id, day, seconds, updated_at) on public.activity_days to authenticated;
grant update (user_id, device_id, day, seconds, updated_at) on public.activity_days to authenticated;

create function public.activity_days_keep_most() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  new.seconds := greatest(new.seconds, old.seconds);
  return new;
end;
$$;

create trigger activity_days_keep_most
  before update on public.activity_days
  for each row execute function public.activity_days_keep_most();
