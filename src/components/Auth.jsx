import React, { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'

export default function Auth(){
  const { user, profile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  function getFields(){
    return {
      e: email || emailRef.current?.value || '',
      p: password || passwordRef.current?.value || '',
    }
  }

  async function signIn(){
    const { e, p } = getFields()
    if(!e || !p){ alert('Please enter your email and password.'); return }
    setSending(true)
    setNeedsConfirm(false)
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p })
    setSending(false)
    if(error){
      const unconfirmed = /confirm|confirmation|verify|not confirmed/i.test(error.message)
      if(unconfirmed) setNeedsConfirm(true)
      alert(
        `Sign-in failed: ${error.message}` +
        (unconfirmed ? '\n\nPlease check your inbox (and spam folder) for a confirmation email, then try again.' : '')
      )
    }
  }

  async function signUp(){
    const { e, p } = getFields()
    if(!e || !p){ alert('Please enter your email and password.'); return }
    setSending(true)
    setNeedsConfirm(false)
    const { data, error } = await supabase.auth.signUp({
      email: e,
      password: p,
      options: { emailRedirectTo: window.location.origin },
    })
    setSending(false)
    if(error){
      alert('Sign-up failed: ' + error.message)
    } else if(data?.user && data?.session){
      alert('Account created and signed in successfully.')
    } else {
      setNeedsConfirm(true)
      alert(
        `Sign-up successful!\n\nA confirmation email has been sent to ${email}.\n` +
        'Please check your inbox and spam folder, then click the confirmation link before signing in.'
      )
    }
  }

  async function resendConfirmation(){
    if(!email){ alert('Enter your email address first.'); return }
    setSending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setSending(false)
    if(error) alert('Could not resend: ' + error.message)
    else alert(`Confirmation email resent to ${email}. Check your inbox and spam folder.`)
  }

  async function signOut(){
    setSending(true)
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise(resolve => setTimeout(resolve, 5000)),
      ])
    } catch(e) {
      console.error('Sign out error', e)
    } finally {
      try {
        Object.keys(localStorage).forEach(key => {
          if(/supabase|sb-|auth/i.test(key)) localStorage.removeItem(key)
        })
      } catch(_){}
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
        ref={emailRef}
        value={email}
        onChange={e=>setEmail(e.target.value)}
        type="email"
        placeholder="Email address"
        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500"
      />
      <input
        ref={passwordRef}
        value={password}
        onChange={e=>setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        className="w-full rounded-full border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-red-500"
      />
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={signIn}
          disabled={sending}
          className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {sending ? 'Working...' : 'Sign in'}
        </button>
        <button
          type="button"
          onClick={signUp}
          disabled={sending}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200"
        >
          {sending ? 'Working...' : 'Sign up'}
        </button>
        {needsConfirm && (
          <button
            type="button"
            onClick={resendConfirmation}
            disabled={!email || sending}
            className="rounded-full border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resend confirmation email
          </button>
        )}
      </div>
      {needsConfirm && (
        <p className="sm:col-span-2 text-xs text-amber-700">
          Check your inbox and spam folder for a confirmation link. Use "Resend" if you haven't received it.
        </p>
      )}
    </div>
  )
}
