import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, type WiseUser } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  profile: WiseUser | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, phone?: string, country?: string) => Promise<{ error: Error | null; userId?: string }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<WiseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    // Use maybeSingle() to avoid 406 when row doesn't exist
    const { data } = await supabase
      .from('wise_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (data) setProfile(data)
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email: string, password: string, fullName: string, phone?: string, country?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) return { error }
    if (data.user) {
      const userCode = 'FB' + Math.random().toString(36).slice(2, 8).toUpperCase()
      await supabase.from('wise_users').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        verified: false,
        user_code: userCode,
        phone: phone ?? null,
        country: country ?? null,
      })
      await supabase.from('currency_accounts').insert(
        { user_id: data.user.id, currency: 'USD', balance: 0, is_main: true }
      )
      await fetchProfile(data.user.id)
      return { error: null, userId: data.user.id }
    }
    return { error: null }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
