create table public.alert_preferences (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  habits_enabled boolean not null default true,
  focus_enabled boolean not null default true,
  deadline_lead_days integer not null default 2 check (deadline_lead_days between 0 and 30),
  daily_summary_time time not null default '08:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.alert_preferences enable row level security;
revoke all on public.alert_preferences from public, anon;
grant select, insert, update, delete on public.alert_preferences to authenticated;
create policy alert_preferences_select on public.alert_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy alert_preferences_insert on public.alert_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy alert_preferences_update on public.alert_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy alert_preferences_delete on public.alert_preferences for delete to authenticated using ((select auth.uid()) = user_id);
