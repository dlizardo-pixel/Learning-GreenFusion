# Von der App zur Website mit Login

Konten, Anmeldung, geräteübergreifender Lernstand und eine echte Liga.

**Der Code dafür ist fertig.** Es fehlen nur ein Supabase-Projekt und zwei
Umgebungsvariablen — bis die gesetzt sind, läuft die App unverändert im
lokalen Modus weiter.

| Baustein | Datei |
|---|---|
| Anmeldung (E-Mail und Passwort) | `src/screens/Login.tsx`, `src/backend/useAuth.ts` |
| Lernstand in der Datenbank | `src/backend/supabaseStorage.ts` |
| Liga aus der Datenbank | `src/backend/supabaseLeaderboard.ts` |
| Tabellen, Rechte, Wochenwechsel | `supabase/migrations/0001_init.sql` |

## Entschieden: Supabase, Region Frankfurt

Gehostetes Postgres mit Anmeldung, Rechteverwaltung und API in einem. Die
Anbindung ist **fertig implementiert** — es fehlen nur das Projekt und die
Zugangsdaten.

Bewusst so: in einem Tag lauffähig, kostenlos in der Grössenordnung von
100 Nutzenden, und die Zugriffslogik liegt in der Datenbank statt im
Frontend. Der Preis ist ein weiterer Anbieter und ein zweites
Benutzerverzeichnis neben Keycloak.

**Region zwingend `eu-central-1` (Frankfurt).** Die Product Specification
schreibt Verarbeitung ausschliesslich in EU/EWR fest, und das gilt auch
für interne Werkzeuge.

### Einrichtung in sieben Schritten

1. **Projekt anlegen** auf supabase.com. Region **Frankfurt
   (eu-central-1)**. Region lässt sich später nicht ändern.

2. **Migration einspielen.** Inhalt von
   `supabase/migrations/0001_init.sql` in den SQL-Editor kopieren und
   ausführen. Legt Tabellen, Zeilen-Rechte, die Liga-Sicht, die
   Serienberechnung und den Wochenwechsel an — und den Trigger, der nur
   Adressen auf `@green-fusion.de` durchlässt.

3. **Anmeldung konfigurieren** (Authentication → Providers): "Email"
   aktivieren, "Confirm email" eingeschaltet lassen. Andere Provider aus.
   Unter URL Configuration die Adresse der ausgelieferten App als Site URL
   eintragen, sonst führen die Bestätigungslinks ins Leere. **Ohne eigenen
   SMTP verschickt Supabase überhaupt nur an Mitglieder der eigenen
   Organisation** — siehe [Mailversand](#mailversand-ist-der-blocker-für-den-rollout).

4. **Zugangsdaten hinterlegen.** `.env.example` nach `.env` kopieren und
   füllen. Die Werte holst du im Dashboard über den **Connect**-Button
   (Framework: Vite) oder unter Settings → API Keys. Der öffentliche
   Schlüssel ist kein Geheimnis; die Rechte kommen aus den Zeilen-Regeln,
   nicht aus der Geheimhaltung des Keys.

   ```
   VITE_SUPABASE_URL=https://dein-projekt.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   Supabase hat die Schlüssel umbenannt: `sb_publishable_…` ersetzt den
   `anon`-Key, der Ende 2026 ausläuft. Die App akzeptiert beide —
   `VITE_SUPABASE_ANON_KEY` bleibt als Rückfallebene gültig, damit
   bestehende Deployments nicht ausfallen.

   Ohne diese Werte läuft die App weiter im lokalen Modus. Das ist Absicht:
   eine vergessene Konfiguration macht sie nicht kaputt.

5. **Ausliefern.** `npm run build` erzeugt `dist/`. Bei Vercel oder Netlify
   das Repository verbinden, Build-Kommando `npm run build`,
   Ausgabeverzeichnis `dist`, und die beiden Variablen in den
   Projekt-Einstellungen hinterlegen. **Nicht öffentlich indexierbar
   lassen** — die App enthält Rabattuntergrenzen, Profitabilitätsgrenzen,
   Zielkundenprofil und bekannte Produktlücken.

6. **Wochenwechsel einrichten.** Montags früh muss
   `close_liga_week(letzter_montag)` laufen — mit der Erweiterung
   `pg_cron`:

   ```sql
   select cron.schedule(
     'liga-wochenwechsel', '5 2 * * 1',
     $$select close_liga_week((current_date - 7)::date)$$
   );
   ```

   Für den Anfang genügt auch ein wöchentlicher Aufruf von Hand.

7. **Erste Leute einladen.** Konto anlegen geht selbst über den
   Anmeldebildschirm; es braucht keine Nutzerverwaltung. Team-Zuordnung
   (`app_user.team`) setzt man einmalig per SQL — davon hängt die
   Team-Wertung ab.

### Später: Umzug auf eigenes AWS und Keycloak

Wenn die App bleibt, ist der saubere Zielzustand ein kleiner Dienst im
vorhandenen AWS-Konto mit Anmeldung über das Keycloak, das die
Kundenplattform schon nutzt: kein zweiter Anbieter, kein zweites
Benutzerverzeichnis, kein zusätzlicher AVV.

Das Datenmodell unten ist identisch, deshalb ist der Umzug ein Austausch
von zwei Dateien — `src/backend/supabaseStorage.ts` und
`src/backend/supabaseLeaderboard.ts` — plus eine Datenübernahme. Die
Oberfläche bleibt unberührt.

## Deployment auf Vercel — vier Fallen

Der Weg von „Repository importiert" zu „Login funktioniert" hat vier
Stellen, an denen es **stumm** schiefgeht. Alle vier sind in der Praxis
aufgetreten; sie stehen hier in der Reihenfolge, in der sie zuschlagen.

### 1. Die Supabase-Integration setzt die falschen Namen

Verbindet man Supabase über die Vercel-Integration, legt sie rund ein
Dutzend Variablen an: `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_PUBLISHABLE_KEY`, `POSTGRES_*`, `SUPABASE_SERVICE_ROLE_KEY` und
weitere. **Keine davon erreicht die App.**

Vite stellt dem Browser ausschliesslich Variablen mit dem Präfix `VITE_`
zur Verfügung. Alles andere wird beim Build ignoriert. Es braucht also
zusätzlich, von Hand:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Die Integrationsvariablen sind grau und nicht bearbeitbar — das ist
Absicht, sie gehören der Integration. Man legt die `VITE_`-Variablen
daneben an, statt sie umzubenennen.

**Symptom, wenn sie fehlen:** kein Login-Bildschirm, und der Liga-Tab
zeigt den Hinweis „Beispieldaten". Die App fällt in den lokalen Modus,
ohne Fehlermeldung. Das ist so gebaut, damit eine vergessene
Konfiguration die App nicht kaputt macht — beim Einrichten arbeitet es
gegen dich.

### 2. „Sensitive" lässt sich nicht zurücknehmen

Vercel kennt zwei Arten von Variablen: *Config* (lesbar) und
*Sensitive/Secret* (verschlüsselt, nicht mehr auslesbar). Legt man die
`VITE_`-Variablen als Sensitive an, warnt Vercel zu Recht:

> Remove the public framework prefix to keep this value private. Public
> prefixes expose values to the browser.

Beides zusammen widerspricht sich: der Wert landet über den `VITE_`-Präfix
ohnehin im Browser-Bundle, die Secret-Markierung erzeugt nur
Scheinsicherheit. Richtig ist **Config** — und der Präfix bleibt, sonst
sieht die App den Wert nicht.

Der Haken: **eine Sensitive-Variable kann nicht in Config umgewandelt
werden.** Der Wert ist verschlüsselt und nicht lesbar, es gibt keinen Weg
zurück. Also löschen und als Config neu anlegen.

### 3. Vite backt die Werte beim Build ein

Env-Variablen werden bei Vite **zur Buildzeit** in das Bundle
hineingeschrieben, nicht zur Laufzeit gelesen. Eine neu gesetzte oder
geänderte Variable wirkt daher erst nach einem **Redeploy**
(Deployments → ⋯ → Redeploy). Speichern allein ändert nichts an der
ausgelieferten App.

### 4. Die Migration läuft nicht von selbst

Die Vercel-Integration legt das Supabase-Projekt an und verbindet es —
sie führt **keine Migration aus.** `supabase/migrations/0001_init.sql`
muss einmal von Hand im SQL Editor laufen.

Und das ist keine Formalie: die Migration schaltet Row Level Security auf
allen fünf Tabellen ein. **Genau das macht den öffentlichen Schlüssel
harmlos.** Ein Projekt mit Tabellen, aber ohne aktive Zeilen-Regeln und
mit einem öffentlichen Key im Browser-Bundle wäre offen lesbar. Solange
keine Tabellen existieren, gibt es nichts zu holen — vor den ersten
echten Nutzerdaten muss die Migration also gelaufen sein.

### Was niemals einen `VITE_`-Präfix bekommen darf

`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY` (`sb_secret_…`),
`SUPABASE_JWT_SECRET` und `POSTGRES_PASSWORD`. Der service_role- bzw.
secret-Key umgeht die Zeilen-Regeln vollständig. Im Browser-Bundle wäre
die Datenbank vollständig offen — lesend und schreibend.

Diese Variablen dürfen im Vercel-Projekt liegen; ohne Präfix erreichen
sie den Browser nicht, und die App liest keine von ihnen.

## Mailversand ist der Blocker für den Rollout

Ohne eigenen SMTP-Server verschickt Supabase Auth-Mails **nur an
Adressen, die Mitglied der eigenen Supabase-Organisation sind.** Alle
anderen scheitern mit „Email address not authorized". Dazu ein Limit von
zwei Nachrichten pro Stunde. Der eingebaute Versand ist ausdrücklich nur
zur Demonstration gedacht
([Supabase-Doku](https://supabase.com/docs/guides/auth/auth-smtp)).

Für ein Team bedeutet das: **ohne eigenen SMTP kann sich niemand
registrieren.** Einzurichten unter Authentication → Emails → SMTP
Settings. Passend zur Vorgabe „Verarbeitung in EU/EWR" gehört dort ein
EU-gehosteter Versender hin — sonst liegt die Datenbank in Frankfurt und
die Mailadressen aller Mitarbeitenden bei einem Dienst ausserhalb.

### Sich selbst freischalten, ohne etwas zu schwächen

Für den ersten Zugang braucht es keinen SMTP:
Authentication → Users → **Add user**, E-Mail und Passwort eintragen,
**Auto Confirm User** anhaken. Kein Setting verändert, keine Mail nötig.

### Warum die Bestätigung nicht einfach abgeschaltet wird

Die naheliegende Abkürzung wäre, „Confirm email" auszuschalten. Sie hat
eine Folge, die man kennen muss: **die Domain-Prüfung testet nur die
Zeichenkette, nicht den Besitz des Postfachs.** Weder die Prüfung im
Browser noch der Trigger in der Datenbank können feststellen, ob jemand
die Adresse wirklich hat — sie sehen nur, dass sie auf
`@green-fusion.de` endet.

Die Bestätigungsmail ist genau der Beweis dieses Besitzes. Ohne sie kann
jede Person, die die URL kennt, ein Konto auf einer beliebigen
`@green-fusion.de`-Adresse anlegen — auch auf der einer echten Kollegin.
Das ist der Unterschied zwischen „nur Green Fusion" und „alle, die die
URL kennen".

## Wenn der Login nicht geht: Symptom → Ursache

Die App übersetzt Supabase-Fehler ins Deutsche. Was auf dem Bildschirm
steht, benennt die Ursache:

| Was du siehst | Ursache | Behebung |
|---|---|---|
| Kein Login-Bildschirm, Liga zeigt „Beispieldaten" | `VITE_`-Variablen fehlen im Bundle | Variablen anlegen, **Redeploy** |
| „Die Anmeldung ist nicht eingerichtet." | dito | dito |
| „Bitte deine Green-Fusion-Adresse nutzen (@@…)" | `VITE_ALLOWED_EMAIL_DOMAIN` enthält das `@` | Variable löschen, Standard greift |
| „E-Mail oder Passwort stimmt nicht." | Konto existiert noch nicht | erst **„Konto anlegen"** — eigener Modus im Login |
| „Deine E-Mail-Adresse ist noch nicht bestätigt." | Mail nicht angekommen | Auto Confirm oder SMTP, siehe oben |
| „Database error saving new user" (unübersetzt) | Trigger `handle_new_user` schlägt fehl | Authentication → Logs lesen |
| Login geht, aber kein Fortschritt wird gespeichert | Migration nicht gelaufen | `0001_init.sql` ausführen |

Den echten Fehler zeigt Supabase immer unter **Authentication → Logs** —
das ist die erste Stelle zum Nachsehen, nicht die letzte.

## Datenmodell

Vollständig und ausführbar in **`supabase/migrations/0001_init.sql`** —
dort steht die verbindliche Fassung, damit dieselbe Definition nicht an
zwei Stellen gepflegt wird. Im Überblick:

| Tabelle | Inhalt |
|---|---|
| `app_user` | Person, Team, Ligastufe, Tagesziel, Schutztage, Challenge-Stand |
| `item_progress` | Leitner-Box und Fälligkeit je Person und Aufgabe |
| `daily_activity` | XP je Person und Tag — Grundlage für Serie und Wochen-XP |
| `lesson_completion` | abgeschlossene Lektionen je Person |
| `liga_membership` | Ligastufe und Gruppe je Person und Woche |
| `liga_week` (Sicht) | berechnete Rangliste: Name, Team, Wochen-XP, Serie |

Drei Entscheidungen darin sind erklärungswürdig:

- **Die Serie wird berechnet, nicht gespeichert** (`current_streak`). Ein
  gespeicherter Zähler läuft unweigerlich aus dem Takt, sobald ein
  Schreibvorgang verloren geht oder zwei Geräte gleichzeitig speichern.
- **Die Rangliste ist eine Sicht, keine Tabelle.** Was berechnet wird,
  kann nicht veralten.
- **Die Zeilen-Rechte geben den eigenen Lernstand frei, die Liga-Sicht die
  Punkte aller.** Was jemand falsch beantwortet hat, sieht niemand ausser
  der Person selbst — das ist bewusst so geschnitten und nicht bloss
  vergessen.

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
  kommen von Supabase. Die Stolperstellen dabei stehen oben unter
  [Deployment auf Vercel](#deployment-auf-vercel--vier-fallen).
- **Weg B:** S3 plus CloudFront im bestehenden AWS-Konto, gleiche Region.

In beiden Fällen: nicht öffentlich indexierbar. Die App enthält interne
Zahlen — Rabattuntergrenzen, Profitabilitätsgrenzen, Zielkundenprofil,
bekannte Produktlücken. Sie gehört hinter die Anmeldung, nicht ins offene
Netz.

## Was der lokale Modus offenlässt

Zwei Eigenschaften der Anbindung sind absichtlich so gebaut und sollten
bekannt sein:

- **Schreiben blockiert das Lernen nicht.** Jeder Stand wird zuerst lokal
  gespeichert, dann zum Server geschickt. Schlägt das fehl, lernt man
  weiter und der Stand geht beim nächsten Speichern mit. Eine Lektion darf
  nie an einem Netzwackler scheitern.
- **Die Liga fällt sichtbar zurück.** Ist die Rangliste nicht erreichbar,
  zeigt der Bildschirm Beispieldaten *und* den Hinweis darauf. Erfundene
  Namen dürfen nie wie echte Kolleg:innen aussehen.

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
