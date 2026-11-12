-- ═══════════════════════════════════════════════════════════════════
-- Birdex : comptes et sauvegarde du carnet d'observations
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller → Run.
-- Le script peut être relancé sans risque (idempotent).
-- ═══════════════════════════════════════════════════════════════════

-- 1. Observations ------------------------------------------------------
create table if not exists public.observations (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  espece_id    text not null check (char_length(espece_id) between 1 and 120),
  date         date not null,
  zone         text not null check (char_length(zone) between 1 and 40),
  lieu         text not null default '' check (char_length(lieu) <= 120),
  note         text not null default '' check (char_length(note) <= 2000),
  photo_chemin text check (photo_chemin is null or char_length(photo_chemin) <= 200),
  validation   text not null default 'manuelle' check (validation in ('manuelle', 'ia')),
  cree_le      timestamptz not null default now(),
  modifie_le   timestamptz not null default now(),
  -- Suppression « douce » : permet de propager une suppression vers les autres appareils
  supprime     boolean not null default false
);

create index if not exists observations_user_id_idx on public.observations (user_id);

-- Chaque utilisateur ne voit et ne modifie que ses propres observations
alter table public.observations enable row level security;

revoke all on table public.observations from anon, authenticated;
grant select, insert, update on table public.observations to authenticated;

drop policy if exists "observations : lecture de ses données" on public.observations;
create policy "observations : lecture de ses données" on public.observations
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "observations : ajout de ses données" on public.observations;
create policy "observations : ajout de ses données" on public.observations
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "observations : modification de ses données" on public.observations;
create policy "observations : modification de ses données" on public.observations
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 2. Photos des observations (espace privé, un dossier par utilisateur) -
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos-observations', 'photos-observations', false, 1048576, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "photos : lecture de ses photos" on storage.objects;
create policy "photos : lecture de ses photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos-observations' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "photos : ajout de ses photos" on storage.objects;
create policy "photos : ajout de ses photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos-observations' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "photos : remplacement de ses photos" on storage.objects;
create policy "photos : remplacement de ses photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos-observations' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'photos-observations' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "photos : suppression de ses photos" on storage.objects;
create policy "photos : suppression de ses photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos-observations' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 3. Suppression de compte (droit à l'effacement, RGPD) -----------------
-- SECURITY DEFINER est nécessaire pour supprimer une ligne de auth.users ;
-- la fonction ne supprime QUE le compte de la personne connectée.
-- Les photos sont supprimées par l'application juste avant l'appel.
create or replace function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Connexion requise';
  end if;
  delete from auth.users where id = uid; -- les observations suivent (on delete cascade)
end;
$$;

revoke execute on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
