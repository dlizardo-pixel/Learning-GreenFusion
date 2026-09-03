# Von der App zur Website mit Login

Was fehlt, um aus dem heutigen Stand eine echte Mitarbeiterplattform zu
machen: Konten, Anmeldung, geräteübergreifender Lernstand und eine echte
Liga.

Die Oberfläche muss sich dafür **nicht** ändern. Zwei Schnittstellen sind
schon gezogen:

| Schnittstelle | Datei | Ersetzt heute |
|---|---|---|
| `StorageAdapter` | `src/engine/progress.ts` | `localStorage` → API |
| `LeaderboardSource` | `src/engine/leaderboard.ts` | Beispieldaten → API |

## Zwei Wege

### Weg A — Supabase, Region Frankfurt

Gehostetes Postgres mit Anmeldung, Rechteverwaltung und API in einem.

**Dafür:** in einem Tag lauffähig. Anmeldung per E-Mail und Passwort,
beschränkbar auf `@green-fusion.de`. Row Level Security in Postgres, also
liegt die Zugriffslogik in der Datenbank und nicht im Frontend. Kostenlos
in der Grössenordnung von 100 Nutzenden.

**Dagegen:** ein weiterer Anbieter, ein zweites Benutzerverzeichnis neben
Keycloak, und ein Auftragsverarbeitungsvertrag mehr. **Region zwingend
`eu-central-1` (Frankfurt)** — die Product Specification schreibt
Verarbeitung ausschliesslich in EU/EWR fest, und das gilt auch für interne
Werkzeuge.

**Wann:** um in zwei Wochen zu wissen, ob die Belegschaft das überhaupt
nutzt.

### Weg B — eigenes AWS Frankfurt, Anmeldung über bestehendes Keycloak

Dieselbe statische Oberfläche, dahinter ein kleiner Dienst im vorhandenen
AWS-Konto; die Anmeldung läuft über das Keycloak, das die Kundenplattform
schon nutzt.

**Dafür:** kein neuer Anbieter, kein zweites Benutzerverzeichnis, kein
zusätzlicher AVV. Passt zur bestehenden DSGVO-Linie und zum
IT-Sicherheitskonzept. Wer schon Zugriff auf die Plattform hat, ist
automatisch angemeldet.

**Dagegen:** mehr Arbeit — Dienst, Datenbank, Deployment, Betrieb.

**Wann:** wenn die App bleiben soll.

### Empfehlung

**A zum Validieren, B zum Betreiben.** Das Datenmodell unten ist für beide
identisch, deshalb ist der Wechsel später ein Austausch der beiden
Adapter, keine Neuentwicklung. Wichtig ist nur, die Entscheidung *bewusst*
zu treffen: ein internes Werkzeug, das mit Klarnamen und Leistungsdaten
bei einem neuen Anbieter landet, ist keine reine Technikfrage.

## Datenmodell

Identisch für beide Wege.

```sql
-- Personen. Bei Weg B kommt die Identität aus Keycloak,
-- dann ist id die Keycloak-Subject-ID.
create table app_user (
  id            uuid primary key,
  email         text not null unique,
  display_name  text not null,
  team          text,                  -- Sales, Customer Success, Product, …
  tier          text not null default 'bronze',
  created_at    timestamptz not null default now()
);

-- Lernstand je Person und Aufgabe. Ersetzt localStorage.
create table item_progress (
  user_id        uuid not null references app_user(id) on delete cascade,
  item_id        text not null,        -- z. B. 't2-heizkurve-was'
  box            smallint not null default 0,   -- Leitner-Box 0–5
  due_at         date not null,
  last_seen_at   date not null,
  times_correct  int not null default 0,
  times_wrong    int not null default 0,
  primary key (user_id, item_id)
);

-- Ein Datensatz pro Person und Tag. Grundlage für Serie und Wochen-XP.
create table daily_activity (
  user_id  uuid not null references app_user(id) on delete cascade,
  day      date not null,
  xp       int  not null default 0,
  primary key (user_id, day)
);

-- Abgeschlossene Lektionen, für den Lernpfad.
create table lesson_completion (
  user_id  uuid not null references app_user(id) on delete cascade,
  unit_id  text not null,
  count    int  not null default 0,
  primary key (user_id, unit_id)
);

-- Wöchentliche Liga-Zuordnung. Eine Zeile je Person und Woche.
create table liga_membership (
  user_id     uuid not null references app_user(id) on delete cascade,
  week_start  date not null,           -- immer ein Montag
  tier        text not null,
  group_no    smallint not null,       -- Gruppe innerhalb der Ligastufe
  primary key (user_id, week_start)
);

-- Die Rangliste wird nicht gespeichert, sondern berechnet.
create view liga_week as
select
  m.week_start, m.tier, m.group_no,
  u.id as user_id, u.display_name, u.team,
  coalesce(sum(a.xp), 0) as weekly_xp
from liga_membership m
join app_user u on u.id = m.user_id
left join daily_activity a
  on a.user_id = m.user_id
 and a.day >= m.week_start
 and a.day <  m.week_start + 7
group by m.week_start, m.tier, m.group_no, u.id, u.display_name, u.team;
```

Die aktuelle Serie wird ebenfalls berechnet, nicht gespeichert — aus
zusammenhängenden Tagen in `daily_activity`. Ein gespeicherter Zähler
läuft unweigerlich aus dem Takt.

### Rechte (Weg A, Row Level Security)

```sql
alter table item_progress   enable row level security;
alter table daily_activity  enable row level security;

-- Eigenen Lernstand lesen und schreiben, fremden nicht.
create policy own_progress on item_progress
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy own_activity on daily_activity
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Die Liga darf jede angemeldete Person lesen: Name, Team, Wochen-XP.
-- Bewusst nicht: welche Aufgaben jemand falsch beantwortet hat.
grant select on liga_week to authenticated;
```

Die letzte Zeile ist wichtig. Die Liga zeigt Punkte, nie Fehler. Wer welche
Aufgabe nicht konnte, gehört niemandem ausser der Person selbst.

## API-Vertrag

Was die beiden Adapter im Frontend brauchen:

```
GET  /progress                → { items, xpByDay, unitsCompleted, streak, dailyGoal }
PUT  /progress/answer         → { itemId, correct, xp }        (idempotent je Antwort)
POST /progress/lesson         → { unitId, bonusXp }
GET  /liga/group              → { tier, weekStart, members[] }
GET  /liga/members            → LigaMember[]                   (für die Team-Wertung)
```

Ein Punkt zur Vorsicht: solange die Bewertung im Browser läuft, kann man
XP fälschen — im Zweifel mit den Entwicklertools. Für Selbstlernen ist das
kein Problem. **Sobald die Liga Ansehen im Haus bedeutet, muss die
Bewertung serverseitig laufen:** der Client schickt die Antwort, der
Server bewertet sie und vergibt die Punkte. Dafür müssen die Lösungen aus
dem ausgelieferten Paket verschwinden.

## Wochenwechsel

Ein Job montags früh:

1. `liga_week` der abgelaufenen Woche je Gruppe auswerten.
2. Die vier Besten in die nächste Ligastufe, die letzten vier in die
   darunter — **wer 0 XP hatte, bleibt** (siehe
   [Liga und Punkte](LIGA-UND-PUNKTE.md)).
3. Neue Gruppen zu je rund 20 aus allen Personen einer Stufe bilden.
4. `liga_membership` für die neue Woche schreiben.

Die Logik dafür liegt schon fertig und getestet in `src/engine/liga.ts`
(`closeWeek`, `nextTier`, `previousTier`) und kann im Backend
wiederverwendet werden.

## Hosting

Das Frontend bleibt ein statisches Build (`npm run build` → `dist/`).

- **Weg A:** Vercel oder Netlify, per Git verbunden. Anmeldung und Daten
  kommen von Supabase.
- **Weg B:** S3 plus CloudFront im bestehenden AWS-Konto, gleiche Region.

In beiden Fällen: nicht öffentlich indexierbar. Die App enthält interne
Zahlen — Rabattuntergrenzen, Profitabilitätsgrenzen, Zielkundenprofil,
bekannte Produktlücken. Sie gehört hinter die Anmeldung, nicht ins offene
Netz.

## Vor dem Rollout zu klären

Nicht technisch, aber blockierend:

- **Betriebsrat.** Eine Rangliste mit Klarnamen über Lernleistung ist eine
  Leistungs- und Verhaltenskontrolle und damit mitbestimmungspflichtig
  (§ 87 Abs. 1 Nr. 6 BetrVG), sofern ein Betriebsrat besteht.
- **Zweckbindung.** Schriftlich festhalten, dass Punkte und Serien nicht
  in Mitarbeitergespräche oder Zielvereinbarungen einfliessen. Ohne diese
  Zusage wird gefarmt statt gelernt — die Begründung steht in
  [Liga und Punkte](LIGA-UND-PUNKTE.md#das-grösste-risiko-ist-nicht-technisch).
- **Löschkonzept.** Was passiert mit dem Lernstand beim Austritt.
- **Freiwilligkeit.** Ob die Teilnahme freiwillig ist — und ob das auch so
  kommuniziert wird.
