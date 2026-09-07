import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isBackendConfigured, supabase } from './supabase'

export type AuthState =
  /** Kein Backend eingerichtet – die App läuft lokal, ohne Anmeldung. */
  | { status: 'local' }
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; session: Session }

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(() =>
    isBackendConfigured() ? { status: 'loading' } : { status: 'local' },
  )

  useEffect(() => {
    if (!supabase) return
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setState(data.session ? { status: 'signedIn', session: data.session } : { status: 'signedOut' })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? { status: 'signedIn', session } : { status: 'signedOut' })
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return state
}

export async function signOut() {
  await supabase?.auth.signOut()
}
