import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** The Supabase user object — null before auth resolves or when offline. */
  user: User | null
  /** Shorthand for user?.id — use this as the userId in all API calls. */
  userId: string | null
  /** True once the initial auth check is complete (session restore or anon sign-in). */
  isReady: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user:    null,
  userId:  null,
  isReady: false,
})

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Wraps the app and signs every visitor in anonymously so we always have a
 * stable UUID — no login required. Anonymous sessions persist across page
 * refreshes via the Supabase session cookie.
 *
 * If `supabase` is null (env vars missing) the provider still mounts and
 * isReady becomes true immediately so the app works in offline mode.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!supabase) {
      // Running offline — mark ready immediately
      setIsReady(true)
      return
    }
    const client = supabase

    // 1. Restore an existing session first
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setIsReady(true)
      } else {
        // 2. No session — sign in anonymously
        client.auth.signInAnonymously().then(({ data, error }) => {
          if (error) {
            console.error('[Auth] Anonymous sign-in failed:', error.message)
          } else {
            console.log('[Auth] Signed in anonymously, userId=', data?.user?.id)
          }
          setUser(data?.user ?? null)
          setIsReady(true)
        })
      }
    })

    // 3. Keep in sync with auth state changes (tab focus, token refresh, etc.)
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null),
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, userId: user?.id ?? null, isReady }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
