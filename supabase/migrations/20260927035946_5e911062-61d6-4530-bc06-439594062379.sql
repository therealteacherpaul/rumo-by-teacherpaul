begin;

-- Widen the historical four-slot limit into per-user counted limits.
alter table public.categories drop constraint if exists categories_user_id_slot_key;
alter table public.categories drop constraint if exists categories_slot_check;
alter table public.categories alter column slot drop not null;
alter table public.categories alter column slot set default null;

create or replace function public.guard_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  if TG_OP = 'UPDATE' then
    if new.user_id <> old.user_id or new.id <> old.id then
      raise exception 'Category identity is immutable' using errcode = '23514';
    end if;
    new.created_at := old.created_at;
  end if;
  new.updated_at := clock_timestamp();

  -- Serialize concurrent writes for the same owner so limits cannot be exceeded.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 77));

  if (select count(*) from public.categories where user_id = new.user_id and id <> new.id) >= 30 then
    raise exception 'Category total limit reached' using errcode = '23514';
  end if;

  if new.active
     and (select count(*) from public.categories
          where user_id = new.user_id and active and id <> new.id) >= 20 then
    raise exception 'Active category limit reached' using errcode = '23514';
  end if;

  return new;
end;
$$;
revoke all on function public.guard_category() from public, anon, authenticated;

drop trigger if exists categories_updated_at on public.categories;
drop trigger if exists guard_category on public.categories;
create trigger guard_category
  before insert or update on public.categories
  for each row execute function public.guard_category();

-- Permanent deletion never removes or reclassifies dependent records.
create or replace function public.guard_category_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.active then
    raise exception 'Archive the category before deleting it' using errcode = '23514';
  end if;
  if exists (select 1 from public.tasks where user_id = old.user_id and category_id = old.id) then
    raise exception 'Category still has tasks' using errcode = '23503';
  end if;
  if exists (select 1 from public.projects where user_id = old.user_id and category_id = old.id) then
    raise exception 'Category still has projects' using errcode = '23503';
  end if;
  if exists (select 1 from public.priorities where user_id = old.user_id and category_id = old.id) then
    raise exception 'Category still has priorities' using errcode = '23503';
  end if;
  return old;
end;
$$;
revoke all on function public.guard_category_delete() from public, anon, authenticated;

drop trigger if exists guard_category_delete on public.categories;
create trigger guard_category_delete
  before delete on public.categories
  for each row execute function public.guard_category_delete();

commit;