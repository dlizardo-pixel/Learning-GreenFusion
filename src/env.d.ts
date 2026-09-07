/// <reference types="vite/client" />

/** Konfiguration über Umgebungsvariablen – alle optional, siehe docs/BACKEND.md */
interface ImportMetaEnv {
  /** Projekt-URL aus Supabase. Fehlt sie, läuft die App im lokalen Modus. */
  readonly VITE_SUPABASE_URL?: string
  /**
   * Öffentlicher Schlüssel aus Supabase (`sb_publishable_…`). Kein
   * Geheimnis, aber projektgebunden — der Schutz kommt aus den
   * Zeilen-Regeln, nicht aus der Geheimhaltung.
   */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  /**
   * Vorgänger des publishable Key. Supabase lässt den `anon`-Key Ende
   * 2026 auslaufen; bis dahin wird er weiter akzeptiert, damit
   * bestehende Deployments nicht brechen.
   */
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Erlaubte E-Mail-Domain für die Anmeldung. Standard: green-fusion.de */
  readonly VITE_ALLOWED_EMAIL_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
