-- Tasks may be created before a user has configured categories.
alter table public.tasks alter column category_id drop not null;
