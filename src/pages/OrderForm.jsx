import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateQuote } from '../lib/quoteCalculator'
import { supabase } from '../lib/supabaseClient'

export default function OrderForm(){
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', tentType: 'medium', guestCount: 50, chairs: 50, tables: 10, extras: [], delivery: true, notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e){
    const { name, value, type, checked } = e.target
    if(type === 'checkbox' && name === 'extras'){
      const val = value
      setForm(f => ({...f, extras: checked ? [...f.extras, val] : f.extras.filter(x => x !== val)}))
      return
    }
    const parsed = (type === 'number') ? Number(value) : value
    if(type === 'checkbox'){
      setForm(f => ({...f, [name]: checked}))
    } else {
      setForm(f => ({...f, [name]: parsed}))
    }
  }

  async function handleSubmit(e){
    e.preventDefault()
    setSubmitting(true)
    const quote = calculateQuote(form)
    // attach user_id when available
    let user = null
    try{ const res = await supabase.auth.getUser(); user = res.data?.user ?? null } catch(e){ user = null }

    // Map form (camelCase) to DB columns (snake_case)
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      tent_type: form.tentType,
      guest_count: Number(form.guestCount || 0),
      chairs: Number(form.chairs || 0),
      tables: Number(form.tables || 0),
      extras: form.extras || [],
      delivery: Boolean(form.delivery),
      notes: form.notes || null,
      quote,
      created_at: new Date().toISOString(),
      user_id: user?.id ?? null,
    }

    const { data, error } = await supabase.from('orders').insert([payload]).select().single()
    if(error){
      console.error('Save error', error)
      setSubmitting(false)
      alert('Failed to save order — check console')
      return
    }
    navigate('/quote', { state: { order: data, quote } })
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-red-700">Customer Order Form</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Book your tent package</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Complete the order details below and receive a tailored quote for your event setup.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Quote preview available after submit</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full name</span>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Jane Doe" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@example.com" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="+27 71 234 5678" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
        </label>

        <div className="grid gap-4 lg:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Tent type</span>
            <select name="tentType" value={form.tentType} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white">
              <option value="small">Small (up to 30)</option>
              <option value="medium">Medium (up to 100)</option>
              <option value="large">Large (100+)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Guest count</span>
            <input name="guestCount" value={form.guestCount} onChange={handleChange} type="number" min="1" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Chairs</span>
            <input name="chairs" value={form.chairs} onChange={handleChange} type="number" min="0" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Tables</span>
            <input name="tables" value={form.tables} onChange={handleChange} type="number" min="0" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
          </label>
          <fieldset className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <legend className="text-sm font-semibold text-slate-700">Extras</legend>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <input type="checkbox" name="extras" value="lighting" onChange={handleChange} className="h-4 w-4 text-red-700" />
                Lighting
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <input type="checkbox" name="extras" value="flooring" onChange={handleChange} className="h-4 w-4 text-red-700" />
                Flooring
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <input type="checkbox" name="extras" value="heaters" onChange={handleChange} className="h-4 w-4 text-red-700" />
                Heaters
              </label>
            </div>
          </fieldset>
        </div>

        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-800">
            <input type="checkbox" name="delivery" checked={form.delivery} onChange={handleChange} className="h-4 w-4 text-red-700" />
            Delivery required
          </label>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Included</span>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Additional notes</span>
          <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any notes" className="mt-2 min-h-[130px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
        </label>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {submitting ? 'Requesting...' : 'Request Quote'}
          </button>
        </div>
      </form>
    </div>
  )
}
