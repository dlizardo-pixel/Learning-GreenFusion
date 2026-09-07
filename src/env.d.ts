/// <reference types="vite/client" />

/** Konfiguration über Umgebungsvariablen – alle optional, siehe docs/BACKEND.md */
interface ImportMetaEnv {
  /** Projekt-URL aus Supabase. Fehlt sie, läuft die App im lokalen Modus. */
  readonly VITE_SUPABASE_URL?: string
  /** Öffentlicher anon-Key aus Supabase. Kein Geheimnis, aber projektgebunden. */
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Erlaubte E-Mail-Domain für die Anmeldung. Standard: green-fusion.de */
  readonly VITE_ALLOWED_EMAIL_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
