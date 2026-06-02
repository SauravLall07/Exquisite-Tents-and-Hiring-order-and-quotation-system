import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

// ─── constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['new', 'confirmed', 'in_progress', 'completed', 'cancelled']
const STATUS_META = {
  new:         { label: 'New',         cls: 'bg-blue-100 text-blue-700' },
  confirmed:   { label: 'Confirmed',   cls: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In Progress', cls: 'bg-violet-100 text-violet-700' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-slate-100 text-slate-400' },
}
const TENT_META = {
  small:  { label: 'Small',  cls: 'bg-sky-100 text-sky-700' },
  medium: { label: 'Medium', cls: 'bg-indigo-100 text-indigo-700' },
  large:  { label: 'Large',  cls: 'bg-purple-100 text-purple-700' },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(n)   { return 'R' + (+(n ?? 0)).toFixed(2) }
function fmtShort(d){ return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) }
function fmtTime(d) { return new Date(d).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) }
function isToday(d) { return new Date(d).toDateString() === new Date().toDateString() }

function exportCsv(orders){
  const cols = ['id','name','email','phone','tent_type','guest_count','chairs','tables','extras','delivery','status','total','created_at','notes']
  const rows = orders.map(o => [
    o.id, o.name, o.email, o.phone, o.tent_type, o.guest_count,
    o.chairs, o.tables,
    (o.extras || []).join(';'),
    o.delivery ? 'yes' : 'no',
    o.status || 'new',
    (o.quote?.total ?? 0).toFixed(2),
    o.created_at,
    (o.notes || '').replace(/\n/g,' '),
  ])
  const csv = [cols, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }){
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${accent ? 'border-red-200 bg-red-700 text-white' : 'border-slate-200 bg-white'}`}>
      <div className={`text-xs font-semibold uppercase tracking-[0.24em] ${accent ? 'text-red-200' : 'text-slate-400'}`}>{label}</div>
      <div className={`mt-2 text-2xl font-bold ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</div>
      {sub && <div className={`mt-1 text-xs ${accent ? 'text-red-200' : 'text-slate-400'}`}>{sub}</div>}
    </div>
  )
}

function QuoteBreakdown({ q }){
  if(!q?.breakdown) return <p className="text-sm text-slate-400">No breakdown available.</p>
  const b = q.breakdown
  const rows = [
    ['Base tent',  b.base],
    b.guestsCost  > 0 && ['Guests',   b.guestsCost],
    b.chairsCost  > 0 && ['Chairs',   b.chairsCost],
    b.tablesCost  > 0 && ['Tables',   b.tablesCost],
    b.extrasCost  > 0 && ['Extras',   b.extrasCost],
    b.deliveryFee > 0 && ['Delivery', b.deliveryFee],
  ].filter(Boolean)
  return (
    <div className="space-y-1 text-sm">
      {rows.map(([k,v]) => (
        <div key={k} className="flex justify-between text-slate-600">
          <span>{k}</span><span>{fmt(v)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-600">
        <span>Tax (12%)</span><span>{fmt(b.tax)}</span>
      </div>
      <div className="flex justify-between font-semibold text-slate-900">
        <span>Total</span><span>{fmt(q.total)}</span>
      </div>
    </div>
  )
}

function OrderRow({ order, onStatusChange }){
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const status = order.status || 'new'
  const sm = STATUS_META[status] ?? STATUS_META.new
  const tm = TENT_META[order.tent_type] ?? { label: order.tent_type, cls: 'bg-slate-100 text-slate-700' }

  async function handleStatus(e){
    setUpdating(true)
    await onStatusChange(order.id, e.target.value)
    setUpdating(false)
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        {/* Customer info */}
        <div className="min-w-[160px] flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 truncate">{order.name || '—'}</span>
            {isToday(order.created_at) && (
              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Today</span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 truncate">
            {order.email || order.phone || '—'}
          </div>
        </div>

        {/* Tent + guests */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tm.cls}`}>{tm.label}</span>
          <span className="text-xs text-slate-500">{order.guest_count ?? '—'} guests</span>
        </div>

        {/* Extras */}
        {Array.isArray(order.extras) && order.extras.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1 max-w-[160px] shrink-0">
            {order.extras.map(ex => (
              <span key={ex} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 capitalize">{ex}</span>
            ))}
          </div>
        )}

        {/* Delivery */}
        {order.delivery && (
          <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Delivery</span>
        )}

        {/* Status selector */}
        <select
          value={status}
          onChange={handleStatus}
          disabled={updating}
          className={`shrink-0 cursor-pointer rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none ring-1 ring-inset ring-transparent focus:ring-slate-300 disabled:opacity-50 ${sm.cls}`}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>

        {/* Total */}
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-slate-900">{fmt(order.quote?.total)}</div>
          <div className="text-xs text-slate-400">{fmtTime(order.created_at)}</div>
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
        >
          {expanded ? 'Hide' : 'Details'}
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-5">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Contact */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Contact</p>
              <div className="space-y-1 text-sm text-slate-700">
                <p>{order.name || '—'}</p>
                {order.email && <p>{order.email}</p>}
                {order.phone && <p>{order.phone}</p>}
              </div>
            </div>

            {/* Order details */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Order details</p>
              <div className="space-y-1 text-sm text-slate-700">
                <p>Tent: {tm.label}</p>
                <p>Guests: {order.guest_count ?? '—'}</p>
                <p>Chairs: {order.chairs ?? 0} · Tables: {order.tables ?? 0}</p>
                {Array.isArray(order.extras) && order.extras.length > 0 && (
                  <p>Extras: {order.extras.map(e => e[0].toUpperCase()+e.slice(1)).join(', ')}</p>
                )}
                <p>Delivery: {order.delivery ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Quote breakdown */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Quote breakdown</p>
              <QuoteBreakdown q={order.quote} />
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Notes</p>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{order.notes}</p>
            </div>
          )}

          {/* Meta */}
          <p className="mt-3 text-xs text-slate-400">
            Order ID: {order.id} · Submitted: {fmtShort(order.created_at)}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function StaffDashboard(){
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [tentFilter, setTentFilter] = useState('all')
  const [statusFilter, setStatus]   = useState('all')
  const [sort, setSort]             = useState('newest')

  async function load(){
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select()
      .order('created_at', { ascending: false })
      .limit(500)
    if(error) console.error('Load orders error', error)
    else setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleStatusChange(id, newStatus){
    const oldStatus = orders.find(o => o.id === id)?.status || 'new'
    // Optimistic update — UI reflects the change immediately
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    if(error){
      console.error('Status update error', error)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: oldStatus } : o))
      alert('Could not save status: ' + error.message)
    }
  }

  // KPI stats
  const stats = useMemo(() => {
    const revenue  = orders.reduce((s, o) => s + (o.quote?.total ?? 0), 0)
    const weekAgo  = Date.now() - 7 * 24 * 60 * 60 * 1000
    const thisWeek = orders.filter(o => new Date(o.created_at) > weekAgo).length
    const pending  = orders.filter(o => !o.status || o.status === 'new' || o.status === 'confirmed').length
    return { total: orders.length, revenue, thisWeek, pending }
  }, [orders])

  // Filter + sort
  const filtered = useMemo(() => {
    let r = [...orders]
    if(search){
      const q = search.toLowerCase()
      r = r.filter(o =>
        (o.name  || '').toLowerCase().includes(q) ||
        (o.email || '').toLowerCase().includes(q) ||
        (o.phone || '').includes(q)
      )
    }
    if(tentFilter !== 'all')   r = r.filter(o => o.tent_type === tentFilter)
    if(statusFilter !== 'all'){
      if(statusFilter === 'new') r = r.filter(o => !o.status || o.status === 'new')
      else r = r.filter(o => o.status === statusFilter)
    }
    if(sort === 'oldest')  r.sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
    if(sort === 'highest') r.sort((a,b) => (b.quote?.total ?? 0) - (a.quote?.total ?? 0))
    return r
  }, [orders, search, tentFilter, statusFilter, sort])

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-700">Staff workspace</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Orders Dashboard</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders"    value={stats.total} />
        <StatCard label="Total revenue"   value={fmt(stats.revenue)} accent />
        <StatCard label="This week"       value={stats.thisWeek} sub="orders in last 7 days" />
        <StatCard label="Active orders"   value={stats.pending}  sub="new + confirmed" />
      </div>

      {/* ── Filters ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="min-w-[200px] flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-red-500"
          />
          <select value={tentFilter} onChange={e => setTentFilter(e.target.value)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-red-500">
            <option value="all">All tent types</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-red-500">
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-red-500">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest value</option>
          </select>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Showing {filtered.length} of {orders.length} orders
        </p>
      </div>

      {/* ── Order list ── */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center text-slate-400">
          No orders match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <OrderRow key={o.id} order={o} onStatusChange={handleStatusChange}  />
          ))}
        </div>
      )}

    </div>
  )
}
