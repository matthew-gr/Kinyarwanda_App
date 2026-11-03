-- Review reminders by web push. Each device that allows notifications has a subscription; each
-- learner has one reminder setting. Devices upload when their next review or recheck comes
-- due, and the send-reminders function (run hourly) uses that to send at most one a day.

create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: own rows" on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.push_subscriptions to authenticated;

create table public.reminder_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default true,
  hour smallint not null default 18 check (hour between 0 and 23),
  timezone text not null default 'Africa/Kigali' check (length(timezone) <= 64),
  next_due_at timestamptz,
  last_sent_on date,
  updated_at timestamptz not null default now()
);

alter table public.reminder_settings enable row level security;

create policy "reminder_settings: own row" on public.reminder_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- last_sent_on is the server's to set.
grant select, delete on public.reminder_settings to authenticated;
grant insert (user_id, enabled, hour, timezone, next_due_at, updated_at)
  on public.reminder_settings to authenticated;
grant update (enabled, hour, timezone, next_due_at, updated_at)
  on public.reminder_settings to authenticated;
