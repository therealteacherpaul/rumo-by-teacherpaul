create table public.user_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 100),
  source text not null default 'user' check (source in ('system', 'user')),
  active boolean not null default true,
  frequency_type text not null check (frequency_type in ('daily','everyDays','everyHours')),
  frequency_interval integer,
  target_type text not null check (target_type in ('occurrence','durationMin','quantity')),
  target_value numeric not null check (target_value > 0 and target_value <= 1000000),
  target_unit text,
  minimum_value numeric check (minimum_value > 0 and minimum_value <= target_value),
  start_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id,id),
  check ((frequency_type = 'daily' and frequency_interval is null) or
    (frequency_type = 'everyDays' and frequency_interval between 1 and 365) or
    (frequency_type = 'everyHours' and frequency_interval between 1 and 24)),
  check (frequency_type = 'daily' or frequency_interval is not null),
  check ((target_type = 'quantity' and target_unit is not null and length(btrim(target_unit)) between 1 and 40) or
    (target_type <> 'quantity' and target_unit is null))
);
create unique index user_habits_name on public.user_habits(user_id, lower(btrim(name)));
create index user_habits_active on public.user_habits(user_id, active);

create table public.habit_check_ins (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id uuid not null,
  date date not null,
  value numeric not null check (value >= 0 and value <= 1000000),
  mode text not null check (mode in ('principal','leve')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, habit_id, date),
  foreign key (user_id,habit_id) references public.user_habits(user_id,id) on delete cascade
);
create index habit_check_ins_user_date on public.habit_check_ins(user_id,date);

create table public.habit_initializations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_habits enable row level security;
alter table public.habit_check_ins enable row level security;
alter table public.habit_initializations enable row level security;
revoke all on public.user_habits, public.habit_check_ins, public.habit_initializations from public, anon, authenticated;
grant select, insert, update, delete on public.user_habits, public.habit_check_ins to authenticated;
grant select on public.habit_initializations to authenticated;

create policy habits_select on public.user_habits for select to authenticated using ((select auth.uid()) = user_id);
create policy habits_insert on public.user_habits for insert to authenticated with check ((select auth.uid()) = user_id);
create policy habits_update on public.user_habits for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy habits_delete on public.user_habits for delete to authenticated using ((select auth.uid()) = user_id);
create policy check_ins_select on public.habit_check_ins for select to authenticated using ((select auth.uid()) = user_id);
create policy check_ins_insert on public.habit_check_ins for insert to authenticated with check ((select auth.uid()) = user_id);
create policy check_ins_update on public.habit_check_ins for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy check_ins_delete on public.habit_check_ins for delete to authenticated using ((select auth.uid()) = user_id);
create policy initialization_select on public.habit_initializations for select to authenticated using ((select auth.uid()) = user_id);
create policy initialization_insert on public.habit_initializations for insert to authenticated with check (false);
create policy initialization_update on public.habit_initializations for update to authenticated using (false) with check (false);
create policy initialization_delete on public.habit_initializations for delete to authenticated using (false);

create function public.guard_user_habit() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'INSERT' and current_user = 'authenticated' and new.source <> 'user' then
    raise exception 'System habits are initialized by the server' using errcode = '23514';
  end if;
  if TG_OP = 'UPDATE' and (new.user_id <> old.user_id or new.id <> old.id or new.source <> old.source) then
    raise exception 'Habit identity is immutable' using errcode = '23514';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 42));
  if (select count(*) from public.user_habits where user_id=new.user_id and id<>new.id) >= 20 then
    raise exception 'Habit limit reached' using errcode = '23514';
  end if;
  if new.active and (select count(*) from public.user_habits where user_id=new.user_id and active and id<>new.id) >= 12 then
    raise exception 'Active habit limit reached' using errcode = '23514';
  end if;
  if new.source='user' and (select count(*) from public.user_habits where user_id=new.user_id and source='user' and id<>new.id) >= 10 then
    raise exception 'Custom habit limit reached' using errcode = '23514';
  end if;
  new.name := btrim(new.name);
  new.updated_at := clock_timestamp();
  if TG_OP='UPDATE' then new.created_at := old.created_at; end if;
  return new;
end;
$$;
create trigger guard_user_habit before insert or update on public.user_habits for each row execute function public.guard_user_habit();
create function public.touch_habit_check_in() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.user_id <> old.user_id or new.habit_id <> old.habit_id or new.date <> old.date then
    raise exception 'Check-in identity is immutable' using errcode = '23514';
  end if;
  new.created_at := old.created_at;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
create trigger touch_habit_check_in before update on public.habit_check_ins for each row execute function public.touch_habit_check_in();

create function public.initialize_user_habits() returns void language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid();
begin
  if caller is null then raise exception 'Authentication required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text,42));
  if exists(select 1 from public.habit_initializations where user_id=caller) then return; end if;
  if not exists(select 1 from public.user_habits where user_id=caller) then
    insert into public.user_habits(user_id,name,source,frequency_type,frequency_interval,target_type,target_value,target_unit,minimum_value)
    values
      (caller,'Beber água','system','everyHours',2,'quantity',8,'copos',4),
      (caller,'Meditar','system','daily',null,'durationMin',10,null,3),
      (caller,'Dormir no horário','system','daily',null,'occurrence',1,null,null),
      (caller,'Orar','system','daily',null,'occurrence',1,null,1),
      (caller,'Exercitar-se','system','everyDays',2,'durationMin',30,null,10),
      (caller,'Ler','system','daily',null,'durationMin',20,null,5),
      (caller,'Alongar','system','everyDays',2,'durationMin',10,null,3),
      (caller,'Planejar o dia','system','daily',null,'durationMin',10,null,2);
  end if;
  insert into public.habit_initializations(user_id) values(caller);
end;
$$;
revoke all on function public.initialize_user_habits() from public, anon;
grant execute on function public.initialize_user_habits() to authenticated;
revoke all on function public.guard_user_habit(), public.touch_habit_check_in() from public, anon, authenticated;