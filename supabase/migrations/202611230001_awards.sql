begin;
create table public.zenkai_editions (
  annee integer primary key, phase text not null default 'preparation' check(phase in ('preparation','vote','live','archives'))
);
insert into public.zenkai_editions values (2027,'preparation');
create table public.zenkai_nominations (
  annee integer references public.zenkai_editions, categorie text, nomine text,
  primary key(annee,categorie,nomine)
);
create table public.zenkai_bulletins (
  annee integer references public.zenkai_editions, membre uuid references auth.users on delete cascade,
  email text not null, choix jsonb not null, soumis timestamptz not null default now(),
  primary key(annee,membre), unique(annee,email)
);
create table public.zenkai_amities (
  demandeur uuid references auth.users on delete cascade, destinataire uuid references auth.users on delete cascade,
  accepte boolean not null default false, check(demandeur<>destinataire), primary key(demandeur,destinataire)
);
create unique index zenkai_paire on public.zenkai_amities(least(demandeur,destinataire),greatest(demandeur,destinataire));
alter table public.zenkai_editions enable row level security;
alter table public.zenkai_nominations enable row level security;
alter table public.zenkai_bulletins enable row level security;
alter table public.zenkai_amities enable row level security;
revoke all on public.zenkai_editions,public.zenkai_nominations,public.zenkai_bulletins,public.zenkai_amities from public,anon,authenticated;
grant select on public.zenkai_editions,public.zenkai_nominations to anon,authenticated;
create policy edition_lecture on public.zenkai_editions for select using(true);
create policy nominations_lecture on public.zenkai_nominations for select using(true);
grant select (annee,membre,soumis,choix) on public.zenkai_bulletins to authenticated;
create policy bulletin_personnel on public.zenkai_bulletins for select using(membre=auth.uid());
create function public.zenkai_voter(edition integer, bulletin jsonb) returns timestamptz
language plpgsql security definer set search_path='' as $$
declare adresse text; statut text; recu timestamptz;
begin
 select lower(trim(email)) into adresse from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if adresse is null then raise exception 'Confirme ton adresse e-mail.'; end if;
 select soumis into recu from public.zenkai_bulletins where annee=edition and membre=auth.uid();
 if found then return recu; end if;
 select phase into statut from public.zenkai_editions where annee=edition for share;
 if statut is distinct from 'vote' then raise exception 'Le vote est fermé.'; end if;
 if bulletin is null or jsonb_typeof(bulletin)<>'object' or bulletin='{}'::jsonb then raise exception 'Bulletin vide ou invalide.'; end if;
 if exists(select 1 from jsonb_each_text(bulletin) b where not exists(select 1 from public.zenkai_nominations n where n.annee=edition and n.categorie=b.key and n.nomine=b.value))
 then raise exception 'Une nomination a changé. Vérifie ton bulletin.'; end if;
 insert into public.zenkai_bulletins(annee,membre,email,choix) values(edition,auth.uid(),adresse,bulletin)
 on conflict(annee,membre) do nothing returning soumis into recu;
 if recu is null then select soumis into recu from public.zenkai_bulletins where annee=edition and membre=auth.uid(); end if;
 return recu;
end $$;
grant select,delete on public.zenkai_amities to authenticated;
grant insert(demandeur,destinataire),update(accepte) on public.zenkai_amities to authenticated;
create policy amis_lire on public.zenkai_amities for select using(auth.uid() in (demandeur,destinataire));
create policy amis_inviter on public.zenkai_amities for insert with check(auth.uid()=demandeur and not accepte);
create policy amis_accepter on public.zenkai_amities for update using(auth.uid()=destinataire) with check(auth.uid()=destinataire and accepte);
create policy amis_retirer on public.zenkai_amities for delete using(auth.uid() in (demandeur,destinataire));
create function public.zenkai_amis() returns table(id uuid,pseudo text,couverture jsonb,entrant boolean,accepte boolean)
language sql stable security definer set search_path='' as $$
 select u.id,coalesce(p.pseudo,'Fan Zenkai'),case when a.accepte then coalesce(u.raw_user_meta_data->'vitrine','[]'::jsonb) else '[]'::jsonb end,
 a.destinataire=auth.uid(),a.accepte from public.zenkai_amities a join auth.users u on u.id=case when a.demandeur=auth.uid() then a.destinataire else a.demandeur end
 left join public.profils p on p.id=u.id where auth.uid() in (a.demandeur,a.destinataire)
$$;
create function public.zenkai_resultats(edition integer) returns table(categorie text,nomine text,voix bigint)
language sql stable security definer set search_path='' as $$
 select b.key,b.value,count(*) from public.zenkai_bulletins v cross join lateral jsonb_each_text(v.choix) b
 join public.zenkai_editions e on e.annee=edition and e.phase='archives' where v.annee=edition group by b.key,b.value order by b.key,count(*) desc,b.value
$$;
revoke all on function public.zenkai_voter(integer,jsonb),public.zenkai_amis(),public.zenkai_resultats(integer) from public,anon,authenticated;
grant execute on function public.zenkai_voter(integer,jsonb),public.zenkai_amis() to authenticated;
grant execute on function public.zenkai_resultats(integer) to anon,authenticated;
insert into public.zenkai_nominations values
(2027,'annee','frieren-beyond-journey-s-end-season-2'),
(2027,'annee','jujutsu-kaisen-season-3-the-culling-game'),
(2027,'annee','witch-hat-atelier'),
(2027,'annee','re-zero-starting-life-in-another-world-s'),
(2027,'annee','steel-ball-run-jojo-s-bizarre-adventure-'),
(2027,'annee','bleach-thousand-year-blood-war-the-calam'),
(2027,'action','jujutsu-kaisen-season-3-the-culling-game'),
(2027,'action','hell-s-paradise-season-2'),
(2027,'action','fire-force-season-3-part-2'),
(2027,'action','bleach-thousand-year-blood-war-the-calam'),
(2027,'action','steel-ball-run-jojo-s-bizarre-adventure-'),
(2027,'action','sentenced-to-be-a-hero'),
(2027,'comedie','grand-blue-dreaming-season-3'),
(2027,'comedie','welcome-to-demon-school-iruma-kun-season'),
(2027,'comedie','kaya-chan-isn-t-scary'),
(2027,'comedie','go-for-it-nakamura-kun'),
(2027,'comedie','tamon-s-b-side'),
(2027,'comedie','gals-can-t-be-kind-to-otaku'),
(2027,'romance','you-and-i-are-polar-opposites'),
(2027,'romance','the-ramparts-of-ice'),
(2027,'romance','love-unseen-beneath-the-clear-night-sky'),
(2027,'romance','blue-box-season-2'),
(2027,'romance','love-through-a-prism'),
(2027,'romance','firefly-wedding'),
(2027,'slice','journal-with-witch'),
(2027,'slice','smoking-behind-the-supermarket-with-you'),
(2027,'slice','botan-kamiina-fully-blossoms-when-drunk'),
(2027,'slice','in-the-clear-moonlit-dusk'),
(2027,'slice','kusunoki-s-garden-of-gods'),
(2027,'slice','the-cat-and-the-dragon'),
(2027,'drama','oshi-no-ko-season-3'),
(2027,'drama','medalist-season-2'),
(2027,'drama','akane-banashi'),
(2027,'drama','jaadugar-a-witch-in-mongolia'),
(2027,'drama','classroom-of-the-elite-4th-season-second'),
(2027,'drama','agents-of-the-four-seasons-dance-of-spri'),
(2027,'seinen','steel-ball-run-jojo-s-bizarre-adventure-'),
(2027,'seinen','golden-kamuy-final-season'),
(2027,'seinen','dorohedoro-season-2'),
(2027,'seinen','the-apothecary-diaries-season-3'),
(2027,'seinen','the-ghost-in-the-shell'),
(2027,'seinen','witch-hat-atelier'),
(2027,'isekai','re-zero-starting-life-in-another-world-s'),
(2027,'isekai','mushoku-tensei-jobless-reincarnation-sea'),
(2027,'isekai','that-time-i-got-reincarnated-as-a-slime-'),
(2027,'isekai','saga-of-tanya-the-evil-season-2'),
(2027,'isekai','ascendance-of-a-bookworm-adopted-daughte'),
(2027,'isekai','reincarnated-as-a-sword-season-2'),
(2027,'nouveaute','witch-hat-atelier'),
(2027,'nouveaute','sentenced-to-be-a-hero'),
(2027,'nouveaute','daemons-of-the-shadow-realm'),
(2027,'nouveaute','journal-with-witch'),
(2027,'nouveaute','nippon-sangoku-the-three-nations-of-the-'),
(2027,'nouveaute','cosmic-princess-kaguya'),
(2027,'suite','frieren-beyond-journey-s-end-season-2'),
(2027,'suite','jujutsu-kaisen-season-3-the-culling-game'),
(2027,'suite','re-zero-starting-life-in-another-world-s'),
(2027,'suite','mushoku-tensei-jobless-reincarnation-sea'),
(2027,'suite','oshi-no-ko-season-3'),
(2027,'suite','the-apothecary-diaries-season-3'),
(2027,'film','puella-magi-madoka-magica-the-movie-walp'),
(2027,'film','made-in-abyss-mezameru-shinpi'),
(2027,'film','rascal-does-not-dream-of-a-dear-friend'),
(2027,'film','the-dangers-in-my-heart-the-movie'),
(2027,'film','mononoke-the-movie-chapter-the-curse-of-'),
(2027,'film','that-time-i-got-reincarnated-as-a-slime-'),
(2027,'deception','the-beginning-after-the-end-season-2'),
(2027,'deception','liar-game'),
(2027,'deception','black-torch'),
(2027,'deception','trigun-stargaze'),
(2027,'deception','jack-of-all-trades-party-of-none'),
(2027,'deception','rent-a-girlfriend-season-5'),
(2027,'protagoniste','yuji-itadori'),
(2027,'protagoniste','gabimaru'),
(2027,'protagoniste','subaru-natsuki'),
(2027,'protagoniste','coco'),
(2027,'protagoniste','johnny-joestar'),
(2027,'protagoniste','rudeus-greyrat'),
(2027,'antagoniste','kenjaku'),
(2027,'antagoniste','sukuna'),
(2027,'antagoniste','yhwach'),
(2027,'antagoniste','diego-brando'),
(2027,'antagoniste','haumea'),
(2027,'antagoniste','rien'),
(2027,'feminin','fern'),
(2027,'feminin','maomao'),
(2027,'feminin','kana-arima'),
(2027,'feminin','emilia'),
(2027,'feminin','inori-yuitsuka'),
(2027,'feminin','miyu-suzuki'),
(2027,'masculin','gyro-zeppeli'),
(2027,'masculin','yuta-okkotsu'),
(2027,'masculin','saichi-sugimoto'),
(2027,'masculin','aqua-hoshino'),
(2027,'masculin','ichigo-kurosaki'),
(2027,'masculin','shinra-kusakabe'),
(2027,'secondaire','stark'),
(2027,'secondaire','kinji-hakari'),
(2027,'secondaire','yuzuriha'),
(2027,'secondaire','beatrice'),
(2027,'secondaire','jinshi'),
(2027,'secondaire','arthur-boyle'),
(2027,'sensei','frieren'),
(2027,'sensei','qifrey'),
(2027,'sensei','tsukasa-akeuraji'),
(2027,'sensei','roxy-migurdia'),
(2027,'sensei','kisuke-urahara'),
(2027,'sensei','yami-sukehiro'),
(2027,'attachant','kaya'),
(2027,'attachant','teoritta'),
(2027,'attachant','asirpa'),
(2027,'attachant','mem-cho'),
(2027,'attachant','panda'),
(2027,'attachant','yusuke-tani'),
(2027,'opening','ignis'),
(2027,'opening','jjk-aizo'),
(2027,'opening','oshi-no-ko'),
(2027,'opening','witch-hat'),
(2027,'opening','sbr-spin'),
(2027,'opening','hells-paradise'),
(2027,'opening','one-piece'),
(2027,'opening','bleach-ibull'),
(2027,'opening','nippon-sangoku'),
(2027,'opening','daemons'),
(2027,'opening','rezero'),
(2027,'opening','cote'),
(2027,'opening','wistoria'),
(2027,'opening','black-clover'),
(2027,'opening','dbs-beerus'),
(2027,'opening','tokyo-revengers'),
(2027,'opening','sentenced-hero'),
(2027,'opening','marriage-toxin'),
(2027,'ending','yoake-no-uta'),
(2027,'ending','the-story-of-us'),
(2027,'ending','serenade'),
(2027,'ending','tada-utsukushii-noroi'),
(2027,'ending','inori-owareba'),
(2027,'ending','rasen'),
(2027,'chanson','i-bull'),
(2027,'chanson','recollect'),
(2027,'chanson','kumo-wo-nuke-kazashimo-e-watashi-dake'),
(2027,'chanson','megane-wo-hazushite'),
(2027,'chanson','b-no-revenge'),
(2027,'chanson','cold-night'),
(2027,'animation','witch-hat-atelier'),
(2027,'animation','frieren-beyond-journey-s-end-season-2'),
(2027,'animation','jujutsu-kaisen-season-3-the-culling-game'),
(2027,'animation','bleach-thousand-year-blood-war-the-calam'),
(2027,'animation','cyberpunk-edgerunners-2'),
(2027,'animation','steel-ball-run-jojo-s-bizarre-adventure-'),
(2027,'chara','witch-hat-atelier'),
(2027,'chara','cosmic-princess-kaguya'),
(2027,'chara','cyberpunk-edgerunners-2'),
(2027,'chara','the-ghost-in-the-shell'),
(2027,'chara','jaadugar-a-witch-in-mongolia'),
(2027,'chara','dorohedoro-season-2'),
(2027,'combat','maki-contre-le-clan-zen-in'),
(2027,'combat','yuji-contre-higuruma'),
(2027,'combat','ichigo-contre-yhwach'),
(2027,'combat','gabimaru-contre-sagiri'),
(2027,'combat','arthur-contre-dragon');
commit;
