/**
 * Supabase-Anbindung.
 *
 * Bewusst optional: sind die Umgebungsvariablen nicht gesetzt, läuft die
 * App im lokalen Modus weiter — Lernstand im Browser, Liga mit
 * Beispieldaten. So kann man sie ohne jede Einrichtung starten und
 * ausprobieren, und ein Ausfall der Konfiguration macht sie nicht kaputt.
 *
 * Einrichtung: siehe docs/BACKEND.md
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined

/**
 * Der öffentliche Schlüssel, unter zwei möglichen Namen.
 *
 * Supabase hat die Schlüssel umbenannt: `sb_publishable_…` ersetzt den
 * alten `anon`-Key, der Ende 2026 ausläuft. Beide funktionieren mit
 * `createClient`, deshalb wird der neue Name bevorzugt und der alte als
 * Rückfallebene akzeptiert — ein bestehendes Deployment soll durch die
 * Umbenennung nicht ausfallen.
 */
const publicKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)

/**
 * Erlaubte E-Mail-Domain. Die eigentliche Durchsetzung gehört in die
 * Datenbank (siehe Migration) — diese Prüfung im Browser ist nur da, um
 * eine verständliche Fehlermeldung zu zeigen, statt eine rohe
 * Datenbankmeldung.
 */
export const ALLOWED_EMAIL_DOMAIN =
  (import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN as string | undefined) ?? 'green-fusion.de'

let client: SupabaseClient | null = null

if (url && publicKey) {
  client = createClient(url, publicKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
}

export const supabase = client
export const isBackendConfigured = () => client !== null

export const emailAllowed = (email: string) =>
  email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN.toLowerCase()}`)

/** Fehlermeldungen von Supabase in verständliches Deutsch übersetzen. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-Mail oder Passwort stimmt nicht.'
  if (m.includes('email not confirmed'))
    return 'Deine E-Mail-Adresse ist noch nicht bestätigt. Schau in dein Postfach.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Für diese Adresse gibt es schon ein Konto. Melde dich einfach an.'
  if (m.includes('password') && m.includes('6'))
    return 'Das Passwort braucht mindestens 6 Zeichen.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Zu viele Versuche. Warte einen Moment und probiere es nochmal.'
  if (m.includes('not allowed') || m.includes('violates'))
    return `Nur Adressen auf @${ALLOWED_EMAIL_DOMAIN} können ein Konto anlegen.`
  return message
}
