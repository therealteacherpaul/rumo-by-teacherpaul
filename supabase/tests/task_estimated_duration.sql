-- Run with ON_ERROR_STOP in a disposable Supabase database, after the duration migration.
begin;
insert into auth.users(id) values
  ('61000000-0000-0000-0000-000000000001'),
  ('61000000-0000-0000-0000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000001', true);
insert into public.categories(id,user_id,name,slot) values
  ('62000000-0000-0000-0000-000000000001',auth.uid(),'Test category',1);
insert into public.projects(id,user_id,name) values
  ('63000000-0000-0000-0000-000000000001',auth.uid(),'Test project');
insert into public.tasks(id,user_id,title,category_id,project_id) values
  ('64000000-0000-0000-0000-000000000001',auth.uid(),'Test task','62000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000001');
do $$ begin
  if (select estimate_min from public.tasks where id='64000000-0000-0000-0000-000000000001') <> 0 then raise exception 'Default estimate must be zero'; end if;
end $$;
update public.tasks set estimate_min=90, status='Concluída';
do $$ begin
  if not (select estimate_min=90 and status='Concluída' from public.tasks where id='64000000-0000-0000-0000-000000000001') then raise exception 'Estimate and completion did not persist'; end if;
  begin
    update public.tasks set estimate_min=-1;
    raise exception 'Negative duration accepted';
  exception when check_violation then null;
  end;
end $$;
update public.tasks set status='A fazer';
update public.projects set active=false;
update public.projects set active=true, name='Renamed project';

select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000002', true);
do $$ declare affected integer; begin
  if exists(select 1 from public.tasks) or exists(select 1 from public.projects) or exists(select 1 from public.categories) then raise exception 'Foreign rows visible'; end if;
  update public.tasks set estimate_min=500 where id='64000000-0000-0000-0000-000000000001';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Foreign update allowed'; end if;
  begin
    insert into public.tasks(user_id,title,category_id,project_id,estimate_min) values (auth.uid(),'Cross-account task','62000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000001',15);
    raise exception 'Cross-account reference allowed';
  exception when foreign_key_violation then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', '61000000-0000-0000-0000-000000000001', true);
do $$ begin
  if not (select estimate_min=90 and status='A fazer' from public.tasks where id='64000000-0000-0000-0000-000000000001') then raise exception 'Task did not persist across identity changes'; end if;
  if not (select active and name='Renamed project' from public.projects where id='63000000-0000-0000-0000-000000000001') then raise exception 'Project did not persist'; end if;
end $$;
update public.tasks set archived=true;
do $$ begin
  if not (select archived and estimate_min=90 from public.tasks where id='64000000-0000-0000-0000-000000000001') then raise exception 'Archive lost estimate'; end if;
end $$;
rollback;
