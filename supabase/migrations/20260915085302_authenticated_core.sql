-- First authenticated utility block. No historical demo records are seeded.
-- Explicit ownership on every relation also rejects cross-account foreign keys.
begin;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  active boolean not null default true,
  source text not null default 'user' check (source = 'user'),
  kind text not null default 'Pessoal' check (kind = 'Pessoal'),
  color text not null default 'var(--color-chart-2)' check (color = 'var(--color-chart-2)'),
  -- All categories in this block are user-created. Four unique slots enforce
  -- the existing custom limit, also staying below 20 total / 16 active.
  slot smallint not null check (slot between 1 and 4),
  unique (user_id, id),
  unique (user_id, slot)
);
create unique index categories_user_name on public.categories (user_id, lower(btrim(name)));

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(btrim(name)) between 1 and 150),
  active boolean not null default true,
  category_id uuid,
  unique (user_id, id),
  foreign key (user_id, category_id) references public.categories(user_id, id)
);
create index projects_user_category on public.projects (user_id, category_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  category_id uuid not null,
  project_id uuid,
  priority text not null default 'Média' check (priority in ('Alta', 'Média', 'Baixa')),
  due_date date,
  status text not null default 'A fazer' check (status in ('A fazer', 'Em andamento', 'Aguardando', 'Concluída')),
  archived boolean not null default false,
  unique (user_id, id),
  foreign key (user_id, category_id) references public.categories(user_id, id),
  foreign key (user_id, project_id) references public.projects(user_id, id)
);
create index tasks_user_category on public.tasks (user_id, category_id);
create index tasks_user_project on public.tasks (user_id, project_id);

create table public.priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  date date not null,
  slot smallint not null check (slot between 1 and 3),
  task_id uuid,
  category_id uuid,
  -- For linked priorities the UI reads/writes tasks.status as the source of truth.
  done boolean not null default false,
  unique (user_id, date, slot),
  unique (user_id, date, task_id),
  foreign key (user_id, task_id) references public.tasks(user_id, id),
  foreign key (user_id, category_id) references public.categories(user_id, id)
);
create index priorities_user_task on public.priorities (user_id, task_id);
create index priorities_user_category on public.priorities (user_id, category_id);

create function public.set_owned_record_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.set_owned_record_updated_at() from public, anon, authenticated;

alter table public.categories enable row level security;
revoke all on table public.categories from public, anon, authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
create policy categories_select_own on public.categories for select to authenticated
  using ((select auth.uid()) = user_id);
create policy categories_insert_own on public.categories for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy categories_update_own on public.categories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy categories_delete_own on public.categories for delete to authenticated
  using ((select auth.uid()) = user_id);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_owned_record_updated_at();

alter table public.projects enable row level security;
revoke all on table public.projects from public, anon, authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
create policy projects_select_own on public.projects for select to authenticated
  using ((select auth.uid()) = user_id);
create policy projects_insert_own on public.projects for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy projects_update_own on public.projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy projects_delete_own on public.projects for delete to authenticated
  using ((select auth.uid()) = user_id);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_owned_record_updated_at();

alter table public.tasks enable row level security;
revoke all on table public.tasks from public, anon, authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
create policy tasks_select_own on public.tasks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy tasks_insert_own on public.tasks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy tasks_update_own on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy tasks_delete_own on public.tasks for delete to authenticated
  using ((select auth.uid()) = user_id);
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_owned_record_updated_at();

alter table public.priorities enable row level security;
revoke all on table public.priorities from public, anon, authenticated;
grant select, insert, update, delete on table public.priorities to authenticated;
create policy priorities_select_own on public.priorities for select to authenticated
  using ((select auth.uid()) = user_id);
create policy priorities_insert_own on public.priorities for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy priorities_update_own on public.priorities for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy priorities_delete_own on public.priorities for delete to authenticated
  using ((select auth.uid()) = user_id);
create trigger priorities_updated_at before update on public.priorities
  for each row execute function public.set_owned_record_updated_at();

commit;
