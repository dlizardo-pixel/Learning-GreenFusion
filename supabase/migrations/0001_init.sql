-- ═══════════════════════════════════════════════════════════════════════
-- Heizungsheld – Datenmodell
--
-- Einmal im Supabase-SQL-Editor ausführen (Region: Frankfurt).
-- Erläuterungen: docs/BACKEND.md
-- ═══════════════════════════════════════════════════════════════════════

-- ── Personen ───────────────────────────────────────────────────────────
-- id ist bewusst dieselbe wie in auth.users: ein Benutzerverzeichnis,
-- kein zweites daneben.
create table if not exists app_user (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null unique,
  display_name        text not null,
  team                text,
  tier                text not null default 'bronze',
  daily_goal          int  not null default 50,

  -- Streak-Schutz
  freezes             int  not null default 1,
  freeze_granted_week date,
  frozen_days         date[] not null default '{}',
  lost_streak_value   int,
  lost_streak_on      date,

  -- Tages-Challenge
  challenge_day       date,
  challenge_count     int,
  challenge_claimed   boolean,

  created_at          timestamptz not null default now()
);

-- ── Lernstand je Person und Aufgabe ────────────────────────────────────
create table if not exists item_progress (
  user_id       uuid not null references app_user(id) on delete cascade,
  item_id       text not null,
  box           smallint not null default 0 check (box between 0 and 5),
  due_at        date not null,
  last_seen_at  date not null,
  times_correct int not null default 0,
  times_wrong   int not null default 0,
  primary key (user_id, item_id)
);

-- ── Ein Datensatz pro Person und Tag ───────────────────────────────────
create table if not exists daily_activity (
  user_id uuid not null references app_user(id) on delete cascade,
  day     date not null,
  xp      int  not null default 0,
  primary key (user_id, day)
);

create table if not exists lesson_completion (
  user_id uuid not null references app_user(id) on delete cascade,
  unit_id text not null,
  count   int  not null default 0,
  primary key (user_id, unit_id)
);

-- ── Wöchentliche Liga-Zuordnung ────────────────────────────────────────
create table if not exists liga_membership (
  user_id    uuid not null references app_user(id) on delete cascade,
  week_start date not null,
  tier       text not null,
  group_no   smallint not null default 0,
  primary key (user_id, week_start)
);

create index if not exists liga_membership_week_idx on liga_membership (week_start, tier, group_no);
create index if not exists daily_activity_user_day_idx on daily_activity (user_id, day);

-- ═══════════════════════════════════════════════════════════════════════
-- Anmeldung: nur die eigene Domain
-- ═══════════════════════════════════════════════════════════════════════
-- Die Prüfung gehört hierher und nicht in den Browser. Wer die Domain
-- ändern will, ändert sie an dieser einen Stelle.
create or replace function allowed_email_domain()
returns text language sql immutable as $$
  select 'green-fusion.de'
$$;

-- Legt beim ersten Anmelden das Profil an und lehnt fremde Domains ab.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) not like '%@' || allowed_email_domain() then
    raise exception 'Nur Adressen auf @% können ein Konto anlegen.', allowed_email_domain();
  end if;

  insert into app_user (id, email, display_name)
  values (
    new.id,
    lower(new.email),
    -- Anzeigename aus den Metadaten, sonst aus dem lokalen Teil der Adresse.
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      initcap(replace(split_part(new.email, '@', 1), '.', ' '))
    )
  )
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════
-- Serie: berechnet, nicht gespeichert
-- ═══════════════════════════════════════════════════════════════════════
-- Ein gespeicherter Zähler läuft unweigerlich aus dem Takt – sobald ein
-- Schreibvorgang verloren geht oder zwei Geräte gleichzeitig speichern.

-- Alle Tage, die für die Serie zählen: gelernte Tage plus überbrückte.
create or replace function streak_days(p_user uuid)
returns setof date language sql stable as $$
  select day from daily_activity where user_id = p_user and xp > 0
  union
  select unnest(u.frozen_days) from app_user u where u.id = p_user
$$;

create or replace function current_streak(p_user uuid)
returns int language plpgsql stable as $$
declare
  anchor   date;
  last_gap date;
begin
  -- Ankertag ist heute, sonst gestern: der heutige Tag kann noch kommen,
  -- eine Serie soll nicht mittags als abgerissen gelten.
  select case
           when exists (select 1 from streak_days(p_user) d where d = current_date) then current_date
           when exists (select 1 from streak_days(p_user) d where d = current_date - 1) then current_date - 1
         end
    into anchor;

  if anchor is null then
    return 0;
  end if;

  -- Letzter Tag vor dem Anker ohne Aktivität – davor endet die Serie.
  select max(g.d::date)
    into last_gap
  from generate_series(anchor - interval '400 days', anchor, interval '1 day') g(d)
  where g.d::date not in (select d from streak_days(p_user) d);

  return (anchor - coalesce(last_gap, anchor - interval '401 days')::date)::int;
end $$;

-- ═══════════════════════════════════════════════════════════════════════
-- Die Liga als Sicht
-- ═══════════════════════════════════════════════════════════════════════
-- Absichtlich ohne security_invoker: die Rangliste muss über alle
-- Mitglieder einer Gruppe hinweg lesen können, während die Zeilen-Rechte
-- unten jeder Person nur den *eigenen* Lernstand freigeben. Die Sicht gibt
-- ausschliesslich Name, Team, Wochen-XP und Serie heraus – nie, welche
-- Aufgabe jemand falsch beantwortet hat.
create or replace view liga_week as
select
  m.week_start,
  m.tier,
  m.group_no,
  u.id            as user_id,
  u.display_name,
  u.team,
  coalesce(sum(a.xp), 0)::int as weekly_xp,
  current_streak(u.id)        as streak
from liga_membership m
join app_user u on u.id = m.user_id
left join daily_activity a
       on a.user_id = m.user_id
      and a.day >= m.week_start
      and a.day <  m.week_start + 7
group by m.week_start, m.tier, m.group_no, u.id, u.display_name, u.team;

-- Sorgt dafür, dass die angemeldete Person in der laufenden Woche
-- überhaupt in einer Gruppe steht. Wird nach dem Login aufgerufen.
create or replace function ensure_current_membership()
returns void language plpgsql security definer set search_path = public as $$
declare
  monday date := date_trunc('week', current_date)::date;
  my_tier text;
begin
  select tier into my_tier from app_user where id = auth.uid();
  if my_tier is null then
    return;
  end if;

  insert into liga_membership (user_id, week_start, tier, group_no)
  values (auth.uid(), monday, my_tier, 0)
  on conflict (user_id, week_start) do nothing;
end $$;

-- ═══════════════════════════════════════════════════════════════════════
-- Wochenwechsel: Auf- und Abstieg
-- ═══════════════════════════════════════════════════════════════════════
-- Montags früh aufrufen (pg_cron oder von Hand). Spiegelt die Logik aus
-- src/engine/liga.ts: die vier Besten steigen auf, die letzten vier ab –
-- aber wer 0 XP hatte, bleibt. Urlaub darf nicht bestrafen.
create or replace function close_liga_week(p_week date)
returns void language plpgsql security definer set search_path = public as $$
declare
  tiers text[] := array['bronze','silber','gold','diamant'];
  group_size int := 20;
begin
  with ranked as (
    select
      w.user_id, w.tier, w.weekly_xp,
      row_number() over (
        partition by w.tier, w.group_no
        order by w.weekly_xp desc, w.streak desc, w.display_name
      ) as pos,
      greatest(count(*) over (partition by w.tier, w.group_no), group_size) as size
    from liga_week w
    where w.week_start = p_week
  ),
  moved as (
    select
      user_id,
      case
        -- Aufstieg: Platz 1-4 und nicht schon in der obersten Liga
        when pos <= 4 and weekly_xp > 0 and tier <> tiers[array_length(tiers,1)]
          then tiers[array_position(tiers, tier) + 1]
        -- Abstieg: letzte vier, aber nur wer gespielt hat
        when pos > size - 4 and weekly_xp > 0 and tier <> tiers[1]
          then tiers[array_position(tiers, tier) - 1]
        else tier
      end as new_tier
    from ranked
  )
  update app_user u
     set tier = m.new_tier
    from moved m
   where u.id = m.user_id;

  -- Neue Gruppen für die kommende Woche: je Ligastufe in Blöcke von 20.
  insert into liga_membership (user_id, week_start, tier, group_no)
  select
    u.id,
    p_week + 7,
    u.tier,
    ((row_number() over (partition by u.tier order by u.id) - 1) / group_size)::smallint
  from app_user u
  on conflict (user_id, week_start) do update set tier = excluded.tier, group_no = excluded.group_no;
end $$;

-- ═══════════════════════════════════════════════════════════════════════
-- Zeilen-Rechte
-- ═══════════════════════════════════════════════════════════════════════
alter table app_user          enable row level security;
alter table item_progress     enable row level security;
alter table daily_activity    enable row level security;
alter table lesson_completion enable row level security;
alter table liga_membership   enable row level security;

drop policy if exists own_profile on app_user;
create policy own_profile on app_user
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists own_items on item_progress;
create policy own_items on item_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_activity on daily_activity;
create policy own_activity on daily_activity
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_lessons on lesson_completion;
create policy own_lessons on lesson_completion
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Die eigene Liga-Zuordnung darf man lesen, aber nicht setzen: sonst
-- könnte sich jede Person in die Diamant-Liga schreiben.
drop policy if exists read_own_membership on liga_membership;
create policy read_own_membership on liga_membership
  for select using (user_id = auth.uid());

grant select on liga_week to authenticated;
grant execute on function ensure_current_membership() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- Hinweis zur Manipulierbarkeit
-- ═══════════════════════════════════════════════════════════════════════
-- Solange die Bewertung im Browser läuft, kann eine Person ihre eigenen
-- XP fälschen – die Rechte oben verhindern nur den Zugriff auf *fremde*
-- Daten. Für Selbstlernen ist das kein Problem. Sobald die Liga im Haus
-- Ansehen bedeutet, muss die Bewertung serverseitig laufen: der Client
-- schickt die Antwort, der Server bewertet und vergibt die Punkte.
-- Dafür müssen die Lösungen aus dem ausgelieferten Paket verschwinden.
