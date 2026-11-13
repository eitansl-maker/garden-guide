-- Paid-plan groundwork (David, 2026-11-13). Run once in Supabase > SQL Editor.
-- plan is read-only for the user: only the service role (a future payment webhook) can change it.
alter table public.profiles add column if not exists plan text not null default 'free' check (plan in ('free','pro'));
alter table public.profiles add column if not exists plan_until timestamptz;

-- Block users from upgrading themselves: the existing "profile update" policy allows updating the row,
-- so lock the two columns with a trigger.
create or replace function public.protect_plan() returns trigger language plpgsql as $$
begin
  if auth.role() <> 'service_role' and (new.plan is distinct from old.plan or new.plan_until is distinct from old.plan_until) then
    raise exception 'plan can only be changed by the service';
  end if;
  return new;
end $$;
drop trigger if exists protect_plan_trg on public.profiles;
create trigger protect_plan_trg before update on public.profiles for each row execute function public.protect_plan();
