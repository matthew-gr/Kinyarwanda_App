-- Re-recording a clip (decision 175). Anyone can ask for a form's audio to be made again; an
-- admin approves or rejects the request. Approved requests, and an admin's own, wait in a queue
-- until there are 15, which generate-audio then records in one take and cuts apart.
--
--   requested  a learner asked; waiting for an admin
--   queued     approved, or asked by an admin; waiting for a batch
--   done       re-recorded
--   rejected   an admin said the audio is fine

create table public.audio_requests (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.item_forms (id) on delete cascade,
  requested_by uuid default auth.uid() references auth.users (id) on delete set null,
  note text check (char_length(note) <= 500),
  status text not null default 'requested'
    check (status in ('requested', 'queued', 'done', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users (id) on delete set null,
  done_at timestamptz
);

-- One open request per form: asking again while one waits changes nothing.
create unique index audio_requests_open on public.audio_requests (form_id)
  where status in ('requested', 'queued');
create index audio_requests_queue on public.audio_requests (created_at)
  where status = 'queued';

alter table public.audio_requests enable row level security;

-- Learners only ask; an admin's request goes straight into the queue.
create policy "Anyone asks for a re-record" on public.audio_requests for insert
  to anon, authenticated
  with check (status = 'requested' or (status = 'queued' and (select public.is_admin())));
create policy "Admins read re-record requests" on public.audio_requests for select
  to authenticated using ((select public.is_admin()));
create policy "Admins decide re-record requests" on public.audio_requests for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.audio_requests from anon, authenticated;
grant insert (form_id, note, status) on public.audio_requests to anon, authenticated;
grant select on public.audio_requests to authenticated;
grant update (status, decided_at, decided_by, done_at) on public.audio_requests to authenticated;
