begin;
create table public.zenkai_equipe(membre uuid primary key references auth.users on delete cascade);
alter table public.zenkai_equipe enable row level security;
revoke all on public.zenkai_equipe from public,anon,authenticated;
grant select on public.zenkai_equipe to authenticated;
create policy equipe_soi on public.zenkai_equipe for select using(membre=auth.uid());
create function public.zenkai_phase(edition integer, prochaine text) returns void
language plpgsql security definer set search_path='' as $$
declare actuelle text;
begin
 if not exists(select 1 from public.zenkai_equipe where membre=auth.uid()) then raise exception 'Accès réservé à la régie.'; end if;
 select phase into actuelle from public.zenkai_editions where annee=edition for update;
 if not found or (actuelle,prochaine) not in (('preparation','vote'),('vote','live'),('live','archives')) then raise exception 'Transition indisponible.'; end if;
 update public.zenkai_editions set phase=prochaine where annee=edition;
end $$;
revoke all on function public.zenkai_phase(integer,text) from public,anon,authenticated;
grant execute on function public.zenkai_phase(integer,text) to authenticated;
commit;
