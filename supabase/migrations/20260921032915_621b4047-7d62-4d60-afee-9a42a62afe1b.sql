create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id uuid,
  started_at timestamptz not null,
  ended_at timestamptz,
  planned_minutes integer not null check (planned_minutes > 0 and planned_minutes <= 1440),
  actual_minutes integer not null default 0 check (actual_minutes >= 0 and actual_minutes <= 1440),
  status text not null check (status in ('completed','ended','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  foreign key (user_id, task_id) references public.tasks(user_id, id) on delete set null,
  check (ended_at is null or ended_at >= started_at)
);
create index focus_sessions_user_started on public.focus_sessions(user_id, started_at desc);
create index focus_sessions_user_task on public.focus_sessions(user_id, task_id);
alter table public.focus_sessions enable row level security;
revoke all on public.focus_sessions from public, anon;
grant select, insert, update, delete on public.focus_sessions to authenticated;
create policy focus_sessions_select on public.focus_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy focus_sessions_insert on public.focus_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy focus_sessions_update on public.focus_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy focus_sessions_delete on public.focus_sessions for delete to authenticated using ((select auth.uid()) = user_id);