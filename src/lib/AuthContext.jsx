import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getProfile } from './supabaseClient'

const AuthContext = createContext({ user: null, profile: null, isStaff: false, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function refresh(u) {
      if (!u?.id) {
        if (mounted) { setUser(null); setProfile(null); setLoading(false) }
        return
      }
      if (mounted) setUser(u)
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: u.id, email: u.email || null, full_name: null, is_staff: false }, { ignoreDuplicates: true })
      if (error) console.warn('Profile upsert error', error)
      const prof = await getProfile(u.id)
      if (mounted) { setProfile(prof); setLoading(false) }
    }

    supabase.auth.getUser().then(({ data }) => refresh(data?.user ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      refresh(session?.user ?? null)
    })

    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, isStaff: !!profile?.is_staff, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
