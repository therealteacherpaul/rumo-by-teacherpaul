begin;
alter table public.tasks
  add column estimate_min integer not null default 0
  constraint tasks_estimate_min_nonnegative check (estimate_min >= 0);
comment on column public.tasks.estimate_min is
  'Estimated duration in minutes. Zero means no estimate has been provided.';
commit;