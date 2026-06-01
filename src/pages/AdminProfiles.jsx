import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AdminProfiles(){
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [newId, setNewId] = useState('')
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newIsStaff, setNewIsStaff] = useState(true)

  useEffect(()=>{ load() }, [])

  async function load(){
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select().order('created_at', { ascending: false })
    if(error) console.error('Load profiles error', error)
    else setProfiles(data || [])
    setLoading(false)
  }

  async function createProfile(){
    if(!newId) return alert('Provide the user id (auth.users.id)')
    const payload = { id: newId, full_name: newName || null, email: newEmail || null, is_staff: !!newIsStaff }
    const { error } = await supabase.from('profiles').upsert(payload)
    if(error) return alert('Create failed: '+error.message)
    setNewId(''); setNewName(''); setNewEmail(''); setNewIsStaff(true)
    load()
  }

  async function toggleStaff(id, current){
    const { error } = await supabase.from('profiles').update({ is_staff: !current }).eq('id', id)
    if(error) return alert('Update failed: '+error.message)
    load()
  }

  async function removeProfile(id){
    if(!confirm('Delete profile '+id+'?')) return
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if(error) return alert('Delete failed: '+error.message)
    load()
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
      <div className="mb-8 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-red-700">Admin workspace</p>
            <h2 className="text-2xl font-semibold text-slate-900">Manage user profiles</h2>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Staff-only controls</div>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">Create or update profiles manually. Use the Supabase Auth user ID when adding a new entry.</p>
      </div>

      <div className="mb-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="grid gap-4 lg:grid-cols-4">
          <input placeholder="User id (uuid)" value={newId} onChange={e=>setNewId(e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500" />
          <input placeholder="Full name" value={newName} onChange={e=>setNewName(e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500" />
          <input placeholder="Email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500" />
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3">
            <label className="flex items-center gap-3 text-sm text-slate-800">
              <input type="checkbox" checked={newIsStaff} onChange={e=>setNewIsStaff(e.target.checked)} className="h-4 w-4 text-red-700" />
              Staff
            </label>
            <button onClick={createProfile} className="ml-auto rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800">Create / Upsert</button>
          </div>
        </div>
      </div>

      {loading ? <div className="text-slate-600">Loading...</div> : (
        <div className="space-y-4">
          {profiles.length === 0 && <div className="text-slate-600">No profiles found.</div>}
          {profiles.map(p => (
            <div key={p.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{p.full_name || p.email || p.id}</div>
                  <div className="mt-1 text-sm text-slate-600">{p.email || 'No email set'} • {p.id}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${p.is_staff ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {p.is_staff ? 'Staff' : 'Customer'}
                  </span>
                  <button onClick={()=>toggleStaff(p.id, p.is_staff)} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 transition hover:bg-slate-100">Toggle role</button>
                  <button onClick={()=>removeProfile(p.id)} className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
