begin;
create table public.zenkai_ouvertures(
 membre uuid not null references auth.users on delete cascade,
 demande uuid not null, resultat jsonb not null, obtenu timestamptz not null default now(),
 primary key(membre,demande)
);
alter table public.zenkai_ouvertures enable row level security;
revoke all on public.zenkai_ouvertures from public,anon,authenticated;
grant select on public.zenkai_ouvertures to authenticated;
create policy ouvertures_personnelles on public.zenkai_ouvertures for select using(membre=auth.uid());
create function public.zenkai_ouvrir(demande_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare paquet jsonb; utilisateur uuid:=auth.uid();
begin
 if utilisateur is null or demande_id is null then raise exception 'Compte requis.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(utilisateur::text,0));
 select resultat into paquet from public.zenkai_ouvertures where membre=utilisateur and demande=demande_id;
 if found then return paquet; end if;
 select to_jsonb(public.ouvrir_booster()) into paquet;
 if jsonb_typeof(paquet->'cartes') is distinct from 'array' then raise exception 'Tirage invalide.'; end if;
 if jsonb_array_length(paquet->'cartes')<>10 then raise exception 'Tirage incomplet.'; end if;
 insert into public.zenkai_ouvertures(membre,demande,resultat) values(utilisateur,demande_id,paquet);
 return paquet;
end $$;
revoke all on function public.zenkai_ouvrir(uuid) from public,anon,authenticated;
grant execute on function public.zenkai_ouvrir(uuid) to authenticated;
commit;
