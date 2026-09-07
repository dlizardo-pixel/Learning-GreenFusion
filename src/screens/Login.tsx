import { useState } from 'react'
import { ALLOWED_EMAIL_DOMAIN, emailAllowed, friendlyAuthError, supabase } from '../backend/supabase'

type Mode = 'signIn' | 'signUp'

/**
 * Anmeldung.
 *
 * Absichtlich schmal: E-Mail und Passwort, nichts weiter. Für ein internes
 * Werkzeug ist jedes zusätzliche Feld eine Hürde ohne Gegenwert — der
 * Anzeigename wird aus der Adresse abgeleitet und lässt sich später ändern.
 */
export function Login() {
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!emailAllowed(email)) {
      setError(`Bitte deine Green-Fusion-Adresse nutzen (@${ALLOWED_EMAIL_DOMAIN}).`)
      return
    }
    if (!supabase) {
      setError('Die Anmeldung ist nicht eingerichtet.')
      return
    }

    setBusy(true)
    const credentials = { email: email.trim().toLowerCase(), password }
    const { error: err } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials)
    setBusy(false)

    if (err) {
      setError(friendlyAuthError(err.message))
      return
    }
    if (mode === 'signUp') {
      setInfo('Fast fertig – bestätige die E-Mail in deinem Postfach, dann kannst du los.')
    }
  }

  return (
    <div className="app">
      <div className="login">
        <div className="brand" style={{ justifyContent: 'center' }}>
          <span className="brand-mark" aria-hidden="true">
            🔥
          </span>
          <span>
            <span className="brand-name">Heizungsheld</span>
            <br />
            <span className="brand-sub">Green Fusion Lernapp</span>
          </span>
        </div>

        <h1 style={{ marginTop: 'var(--gf-space-8)' }}>
          {mode === 'signIn' ? 'Willkommen zurück' : 'Konto anlegen'}
        </h1>
        <p className="muted small" style={{ marginTop: 0 }}>
          {mode === 'signIn'
            ? 'Melde dich mit deiner Green-Fusion-Adresse an.'
            : `Nur Adressen auf @${ALLOWED_EMAIL_DOMAIN} können ein Konto anlegen.`}
        </p>

        <form onSubmit={submit} className="login-form">
          <label className="field">
            <span className="field-label">E-Mail</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`vorname.nachname@${ALLOWED_EMAIL_DOMAIN}`}
            />
          </label>

          <label className="field">
            <span className="field-label">Passwort</span>
            <input
              type="password"
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signUp' ? 'mindestens 6 Zeichen' : ''}
            />
          </label>

          {error && (
            <div className="field-error" role="alert">
              {error}
            </div>
          )}
          {info && (
            <div className="notice" role="status">
              {info}
            </div>
          )}

          <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
            {busy ? 'Einen Moment …' : mode === 'signIn' ? 'Anmelden' : 'Konto anlegen'}
          </button>
        </form>

        <button
          className="btn btn--ghost"
          style={{ marginTop: 'var(--gf-space-4)' }}
          onClick={() => {
            setMode(mode === 'signIn' ? 'signUp' : 'signIn')
            setError(null)
            setInfo(null)
          }}
        >
          {mode === 'signIn' ? 'Noch kein Konto? Konto anlegen' : 'Schon ein Konto? Anmelden'}
        </button>
      </div>
    </div>
  )
}
