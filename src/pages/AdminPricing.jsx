import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { DEFAULT_PRICING, TENT_TYPES } from '../lib/quoteCalculator'

const EXTRA_LABELS = { lighting: 'Lighting', flooring: 'Flooring', heaters: 'Heaters' }

function NumInput({ label, value, onChange, prefix = 'R', step = '0.01', min = '0' }){
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">{prefix}</span>
        )}
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={onChange}
          className={`w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white ${prefix ? 'pl-8 pr-4' : 'px-4'}`}
        />
      </div>
    </label>
  )
}

function Section({ title, children }){
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  )
}

export default function AdminPricing(){
  const [config, setConfig] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => { load() }, [])

  async function load(){
    setLoading(true)
    const { data } = await supabase
      .from('pricing')
      .select('config')
      .eq('id', 'default')
      .single()

    const remote = data?.config ?? {}
    setConfig({
      ...DEFAULT_PRICING,
      ...remote,
      tents:  { ...DEFAULT_PRICING.tents,  ...(remote.tents  ?? {}) },
      extras: { ...DEFAULT_PRICING.extras, ...(remote.extras ?? {}) },
    })
    setLoading(false)
  }

  function setTent(key, val){
    setConfig(c => ({ ...c, tents: { ...c.tents, [key]: parseFloat(val) || 0 } }))
    setSaved(false)
  }

  function setExtra(key, val){
    setConfig(c => ({ ...c, extras: { ...c.extras, [key]: parseFloat(val) || 0 } }))
    setSaved(false)
  }

  function setField(key, val){
    setConfig(c => ({ ...c, [key]: parseFloat(val) || 0 }))
    setSaved(false)
  }

  async function handleSave(e){
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    const { error: err } = await supabase
      .from('pricing')
      .upsert({ id: 'default', config, updated_at: new Date().toISOString() })
    setSaving(false)
    if(err){ setError(err.message); return }
    setSaved(true)
  }

  if(loading) return <div className="py-16 text-center text-slate-400">Loading pricing…</div>

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.28em] text-red-700">Admin workspace</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">Price Editor</h2>
        <p className="mt-1 text-sm text-slate-500">Changes take effect immediately for all new quotes.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        <Section title="Tent base hire prices">
          {TENT_TYPES.map(t => (
            <NumInput
              key={t.value}
              label={t.label}
              value={config.tents[t.value] ?? ''}
              onChange={e => setTent(t.value, e.target.value)}
            />
          ))}
        </Section>

        <Section title="Extras add-on prices">
          {Object.keys(DEFAULT_PRICING.extras).map(key => (
            <NumInput
              key={key}
              label={EXTRA_LABELS[key] ?? key}
              value={config.extras[key] ?? ''}
              onChange={e => setExtra(key, e.target.value)}
            />
          ))}
        </Section>

        <Section title="Per-item rates">
          <NumInput label="Per guest"    value={config.perGuest}    onChange={e => setField('perGuest',    e.target.value)} step="0.10" />
          <NumInput label="Per chair"    value={config.chairPrice}  onChange={e => setField('chairPrice',  e.target.value)} step="0.10" />
          <NumInput label="Per table"    value={config.tablePrice}  onChange={e => setField('tablePrice',  e.target.value)} step="0.10" />
        </Section>

        <Section title="Fees">
          <NumInput label="Delivery fee"   value={config.deliveryFee}  onChange={e => setField('deliveryFee',  e.target.value)} />
          <NumInput label="Site visit fee" value={config.siteVisitFee} onChange={e => setField('siteVisitFee', e.target.value)} />
        </Section>

        <Section title="Tax">
          <NumInput
            label="Tax rate (e.g. 0.12 = 12%)"
            value={config.taxRate}
            onChange={e => setField('taxRate', e.target.value)}
            prefix=""
            step="0.01"
            min="0"
          />
        </Section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save pricing'}
          </button>
          {saved  && <span className="text-sm font-medium text-emerald-600">Saved — new quotes will use these prices</span>}
          {error  && <span className="text-sm font-medium text-red-600">Error: {error}</span>}
        </div>

      </form>
    </div>
  )
}
