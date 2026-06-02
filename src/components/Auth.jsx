import React, { useState, useEffect } from 'react'
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase, getCurrentUser, onAuthChange, getProfile } from '../lib/supabaseClient'

export default function Auth(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [sending, setSending] = useState(false)

  useEffect(()=>{
    let mounted = true
    let sub = onAuthChange(async (u)=>{
      setUser(u)
      if(u?.id){
        // ensure a profile row exists for this user (non-staff by default)
        try{
          await supabase.from('profiles').upsert({ id: u.id, email: u.email || null, full_name: null, is_staff: false })
        } catch(e){ /* ignore */ }
        const prof = await getProfile(u.id)
        if(mounted) setProfile(prof)
      } else {
        if(mounted) setProfile(null)
      }
    })
    getCurrentUser().then(async u=>{
      if(mounted) setUser(u)
      if(u?.id){
        try{ await supabase.from('profiles').upsert({ id: u.id, email: u.email || null, full_name: null, is_staff: false }) }catch(e){}
        const prof = await getProfile(u.id); if(mounted) setProfile(prof)
      }
    })
    return ()=>{ mounted = false; sub?.subscription?.unsubscribe?.(); if(sub?.unsubscribe) sub.unsubscribe() }
  }, [])

  async function signIn(){
    setSending(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSending(false)
    if(error) alert('Sign-in failed: ' + error.message)
  }

  async function signUp(){
    setSending(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setSending(false)
    if(error){
      alert('Sign-up failed: ' + error.message)
    } else if(data?.user){
      alert('Account created successfully. You are now signed in.')
    } else {
      alert('Sign-up successful. Please check your email to confirm your account.')
    }
  }

  function timeout(ms){
    return new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timed out')), ms))
  }

  function clearLocalAuthSession(){
    try {
      Object.keys(localStorage).forEach(key => {
        const lower = key.toLowerCase()
        if(lower.includes('supabase') || lower.includes('sb-') || lower.includes('auth')){
          localStorage.removeItem(key)
        }
      })
      console.debug('Cleared local auth session storage')
    } catch (e) {
      console.warn('Failed to clear local auth session storage', e)
    }
  }

  async function fetchLogoutFallback(accessToken){
    if(!SUPABASE_URL){
      console.warn('No SUPABASE_URL available for logout fallback')
      return false
    }
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      console.debug('Fallback logout response', response.status, await response.text())
      return response.ok
    } catch (e) {
      console.error('Fallback logout request failed', e)
      return false
    }
  }

  async function signOut(){
    setSending(true)
    let signedOut = false
    console.log('Starting sign out...')
    let session = null
    try {
      const sessionResult = await supabase.auth.getSession()
      session = sessionResult.data?.session
      console.log('Current session', session)
    } catch (e) {
      console.warn('Failed to get auth session before sign out', e)
    }

    try {
      const { error } = await Promise.race([
        supabase.auth.signOut(),
        timeout(10000),
      ])
      if(error){
        console.error('Sign out failed', error)
        alert('Sign out failed: ' + error.message)
      } else {
        signedOut = true
        console.log('User signed out successfully')
      }
    } catch (e) {
      console.error('Sign out exception', e)
      alert('Sign out failed: ' + (e?.message || 'unknown error'))
      if(e?.message?.includes('timed out')){
        console.log('Attempting fallback logout request')
        signedOut = await fetchLogoutFallback(session?.access_token)
        if(signedOut){
          console.log('Fallback logout succeeded')
        }
      }
    } finally {
      setSending(false)
      setUser(null)
      setProfile(null)
      setEmail('')
      setPassword('')
      clearLocalAuthSession()
      if(!signedOut){
        console.warn('Sign out fallback active: cleared local session without server logout')
      }
      window.location.reload()
    }
  }

  if(user){
    return (
      <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{user.email}</div>
          <div className="text-xs text-slate-500">{profile ? (profile.is_staff ? 'Staff member' : 'Customer') : 'Signed in'}</div>
        </div>
        <button
          onClick={signOut}
          disabled={sending}
          className="ml-auto rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {sending ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:grid-cols-[minmax(140px,_1fr)_minmax(140px,_1fr)] sm:items-end">
      <div className="sm:col-span-2">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-red-700">Account access</div>
        <div className="text-sm text-slate-500">Sign in with email and password, or create a new account.</div>
      </div>
      <input
        value={email}
        onChange={e=>setEmail(e.target.value)}
        type="email"
        placeholder="Email address"
        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500"
      />
      <input
        value={password}
        onChange={e=>setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500"
      />
      <div className="flex gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={signIn}
          disabled={!email || !password || sending}
          className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {sending ? 'Working...' : 'Sign in'}
        </button>
        <button
          type="button"
          onClick={signUp}
          disabled={!email || !password || sending}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200"
        >
          {sending ? 'Working...' : 'Sign up'}
        </button>
      </div>
    </div>
  )
}

