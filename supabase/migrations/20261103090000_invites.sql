-- Invite only, while the app is being tested. A member can invite 2 people (admins any
-- number); someone joins with an invite code and their email, then signs in by email. The
-- invites function does the creating and redeeming with the service role, so learners only
-- ever read their own rows here.

create table public.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  invited_by uuid references auth.users (id) on delete set null,
  joined_at timestamptz not null default now()
);

alter table public.members enable row level security;

create policy "members: read own, admins read all" on public.members
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

grant select on public.members to authenticated;

-- Everyone with an account today is already in.
insert into public.members (user_id) select id from auth.users on conflict do nothing;

create table public.invites (
  code text primary key,
  created_by uuid not null references auth.users (id) on delete cascade,
  -- Set when the invite was emailed; only that address can use it.
  email text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz
);

create index invites_created_by on public.invites (created_by);

alter table public.invites enable row level security;

create policy "invites: read own, admins read all" on public.invites
  for select to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()));

grant select on public.invites to authenticated;

-- The invites function finds whether an email already has an account. Service role only.
create function public.user_id_for_email(address text) returns uuid
  language sql stable security definer set search_path = ''
  as $$ select id from auth.users where lower(email) = lower(address) limit 1 $$;

revoke all on function public.user_id_for_email(text) from public, anon, authenticated;
grant execute on function public.user_id_for_email(text) to service_role;
