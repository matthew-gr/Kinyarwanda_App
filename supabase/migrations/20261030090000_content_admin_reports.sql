-- Prompt 5: course content, admins, audio and mistake reports.
--
-- Content is public: every learner reads the same words and phrases, signed in or not. Only
-- admins change it, and nothing is deleted: a removed item is marked retired, so every device
-- hears that it is gone. Each change stamps updated_at, and devices download rows changed
-- since the last stamp they saw.

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "People can see whether they are an admin"
  on public.admins for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

create function public.is_admin() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.admins where user_id = (select auth.uid())) $$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Matt is the first admin.
insert into public.admins (user_id)
  select id from auth.users where email = 'matthew@growrwanda.com'
  on conflict do nothing;

create table public.items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('word', 'phrase')),
  base text not null check (length(trim(base)) > 0),
  en text not null check (length(trim(en)) > 0),
  word_type text not null check (word_type in ('noun', 'verb', 'other')),
  noun_class text,
  pronunciation text not null default '',
  -- {"rw": "...", "en": "..."}
  example jsonb,
  -- [{"rw": "...", "en": "..."}, ...]
  breakdown jsonb,
  rank integer not null check (rank > 0),
  tier integer not null check (tier > 0),
  status text not null default 'ai_draft'
    check (status in ('dev', 'ai_draft', 'reviewed', 'approved')),
  source text not null,
  retired boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index items_updated_at on public.items (updated_at);

create table public.item_forms (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id),
  text text not null check (length(trim(text)) > 0),
  en text not null check (length(trim(en)) > 0),
  is_base boolean not null default false,
  number text check (number in ('singular', 'plural')),
  person text check (person in ('1sg', '2sg', '3sg', '1pl', '2pl', '3pl')),
  tense text,
  verb_level smallint check (verb_level between 1 and 6),
  -- The current clip's public URL and the voice that made it; history is in audio_clips.
  audio_path text,
  audio_source text,
  status text not null default 'ai_draft'
    check (status in ('dev', 'ai_draft', 'reviewed', 'approved')),
  source text not null,
  retired boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index item_forms_item on public.item_forms (item_id);
create index item_forms_updated_at on public.item_forms (updated_at);

-- Every change is stamped, so devices can download what changed since they last looked.
create function public.stamp_content() returns trigger
  language plpgsql set search_path = ''
  as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger items_stamp before update on public.items
  for each row execute function public.stamp_content();
create trigger item_forms_stamp before update on public.item_forms
  for each row execute function public.stamp_content();

alter table public.items enable row level security;
alter table public.item_forms enable row level security;

create policy "Everyone reads the course" on public.items for select to anon, authenticated
  using (true);
create policy "Admins add items" on public.items for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins change items" on public.items for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "Everyone reads the forms" on public.item_forms for select to anon, authenticated
  using (true);
create policy "Admins add forms" on public.item_forms for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins change forms" on public.item_forms for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- No deletes: retire instead. updated_at and updated_by are always the server's.
revoke all on public.items, public.item_forms from anon, authenticated;
grant select on public.items, public.item_forms to anon, authenticated;
grant insert (id, kind, base, en, word_type, noun_class, pronunciation, example, breakdown,
  rank, tier, status, source, retired) on public.items to authenticated;
grant update (base, en, word_type, noun_class, pronunciation, example, breakdown, rank, tier,
  status, source, retired) on public.items to authenticated;
grant insert (id, item_id, text, en, is_base, number, person, tense, verb_level, status, source,
  retired) on public.item_forms to authenticated;
grant update (text, en, is_base, number, person, tense, verb_level, status, source, retired)
  on public.item_forms to authenticated;

-- Every clip ever made, so a regenerated or re-recorded clip never loses the one before.
-- Written only by the audio server function, which also points the form at its new clip.
create table public.audio_clips (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.item_forms (id),
  path text not null,
  -- ai:<voice> or native:<speaker>
  source text not null,
  status text not null default 'ai_draft'
    check (status in ('ai_draft', 'reviewed', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index audio_clips_form on public.audio_clips (form_id);

alter table public.audio_clips enable row level security;

create policy "Admins read clips" on public.audio_clips for select to authenticated
  using ((select public.is_admin()));

revoke all on public.audio_clips from anon, authenticated;
grant select on public.audio_clips to authenticated;

-- Audio files are public to read; only the server function writes them.
insert into storage.buckets (id, name, public, allowed_mime_types)
  values ('audio', 'audio', true, array['audio/mpeg', 'audio/wav', 'audio/ogg'])
  on conflict (id) do nothing;

-- Report a mistake. Anyone can send one, signed in or not; only admins read and resolve them.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  item_id uuid not null references public.items (id),
  form_id uuid references public.item_forms (id),
  module text not null check (module in ('learn', 'review')),
  -- What the card showed, in case the content changes before an admin looks.
  shown_text text not null check (length(shown_text) <= 500),
  message text not null check (length(trim(message)) between 1 and 1000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  resolution text check (length(resolution) <= 1000)
);

create index reports_open on public.reports (created_at) where resolved_at is null;

alter table public.reports enable row level security;

create policy "Anyone reports a mistake" on public.reports for insert to anon, authenticated
  with check (user_id is not distinct from (select auth.uid()));
create policy "Admins read reports" on public.reports for select to authenticated
  using ((select public.is_admin()));
create policy "Admins resolve reports" on public.reports for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.reports from anon, authenticated;
grant insert (id, user_id, item_id, form_id, module, shown_text, message)
  on public.reports to anon, authenticated;
grant select on public.reports to authenticated;
grant update (resolved_at, resolved_by, resolution) on public.reports to authenticated;
