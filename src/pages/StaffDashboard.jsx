import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { TENT_TYPES } from '../lib/quoteCalculator'

// ─── constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['new', 'confirmed', 'in_progress', 'completed', 'cancelled']
const STATUS_META = {
  new:         { label: 'New',         cls: 'bg-blue-100 text-blue-700' },
  confirmed:   { label: 'Confirmed',   cls: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'In Progress', cls: 'bg-violet-100 text-violet-700' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-slate-100 text-slate-400' },
}
const TENT_COLOR = [
  'bg-sky-100 text-sky-700',
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
]
const TENT_META = Object.fromEntries(
  TENT_TYPES.map((t, i) => [t.value, { label: t.label, cls: TENT_COLOR[i % TENT_COLOR.length] }])
)
const PAYMENT_META = {
  unpaid:       { label: 'Unpaid',       cls: 'bg-red-100 text-red-700' },
  deposit_paid: { label: 'Deposit paid', cls: 'bg-amber-100 text-amber-700' },
  fully_paid:   { label: 'Fully paid',   cls: 'bg-emerald-100 text-emerald-700' },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmt(n)      { return 'R' + (+(n ?? 0)).toFixed(2) }
function fmtShort(d) { return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) }
function fmtTime(d)  { return new Date(d).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) }
function fmtDate(d)  { return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—' }
function isToday(d)  { return new Date(d).toDateString() === new Date().toDateString() }

function exportCsv(orders){
  const cols = ['id','name','email','phone','event_date','event_end_date','tent_type','guest_count','chairs','tables','extras','delivery','status','total','payment_status','deposit_required','deposit_paid','balance_due','created_at','notes']
  const rows = orders.map(o => {
    const total    = o.quote?.total ?? 0
    const depReq   = o.deposit_required ?? 0
    const depPaid  = !!o.deposit_paid
    const pStatus  = o.payment_status || 'unpaid'
    const paid     = pStatus === 'fully_paid' ? total : (depPaid ? depReq : 0)
    const balance  = Math.max(0, total - paid)
    return [
      o.id, o.name, o.email, o.phone,
      o.event_date || '', o.event_end_date || '',
      o.tent_type, o.guest_count,
      o.chairs, o.tables,
      (o.extras || []).join(';'),
      o.delivery ? 'yes' : 'no',
      o.status || 'new',
      total.toFixed(2),
      pStatus,
      depReq || '',
      depPaid ? 'yes' : 'no',
      balance.toFixed(2),
      o.created_at,
      (o.notes || '').replace(/\n/g,' '),
    ]
  })
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
    ['Base hire',              b.base],
    b.guestsCost   > 0 && ['Guests',          b.guestsCost],
    b.chairsCost   > 0 && ['Chairs',          b.chairsCost],
    b.tablesCost   > 0 && ['Tables',          b.tablesCost],
    b.extrasCost   > 0 && ['Extras',          b.extrasCost],
    b.deliveryFee  > 0 && ['Delivery',        b.deliveryFee],
    b.siteVisitFee > 0 && ['Site visit',      b.siteVisitFee],
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
  const [expanded, setExpanded]         = useState(false)
  const [updating, setUpdating]         = useState(false)
  const [staffMsg, setStaffMsg]         = useState(order.staff_message || '')
  const [savingMsg, setSavingMsg]       = useState(false)
  const [msgSaved, setMsgSaved]         = useState(false)
  const [depositRequired, setDepositRequired] = useState(order.deposit_required ?? '')
  const [depositPaid, setDepositPaid]         = useState(!!order.deposit_paid)
  const [paymentStatus, setPaymentStatus]     = useState(order.payment_status || 'unpaid')
  const [savingPayment, setSavingPayment]     = useState(false)
  const [paymentSaved, setPaymentSaved]       = useState(false)
  const status = order.status || 'new'
  const sm = STATUS_META[status] ?? STATUS_META.new
  const tm = TENT_META[order.tent_type] ?? { label: order.tent_type, cls: 'bg-slate-100 text-slate-700' }

  async function handleStatus(e){
    setUpdating(true)
    await onStatusChange(order.id, e.target.value)
    setUpdating(false)
  }

  async function saveMessage(){
    setSavingMsg(true)
    setMsgSaved(false)
    const { error } = await supabase
      .from('orders')
      .update({ staff_message: staffMsg.trim() || null })
      .eq('id', order.id)
    setSavingMsg(false)
    if(!error) setMsgSaved(true)
  }

  async function savePayment(){
    setSavingPayment(true)
    setPaymentSaved(false)
    const { error } = await supabase
      .from('orders')
      .update({
        deposit_required: depositRequired !== '' ? Number(depositRequired) : null,
        deposit_paid:     depositPaid,
        payment_status:   paymentStatus,
      })
      .eq('id', order.id)
    setSavingPayment(false)
    if(!error) setPaymentSaved(true)
  }

  const totalAmt   = order.quote?.total ?? 0
  const depositAmt = Number(depositRequired) || 0
  const amountPaid = paymentStatus === 'fully_paid' ? totalAmt : (depositPaid ? depositAmt : 0)
  const balanceDue = Math.max(0, totalAmt - amountPaid)

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

        {/* Event date */}
        {order.event_date && (
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {fmtDate(order.event_date)}
            {order.event_end_date && order.event_end_date !== order.event_date && <> – {fmtDate(order.event_end_date)}</>}
          </span>
        )}

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

        {/* Payment status */}
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${(PAYMENT_META[paymentStatus] ?? PAYMENT_META.unpaid).cls}`}>
          {(PAYMENT_META[paymentStatus] ?? PAYMENT_META.unpaid).label}
        </span>

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
                {order.event_date && (
                  <p>
                    Event: {fmtDate(order.event_date)}
                    {order.event_end_date && order.event_end_date !== order.event_date && <> – {fmtDate(order.event_end_date)}</>}
                  </p>
                )}
                <p>Tent: {tm.label}</p>
                {order.needs_measurement ? (
                  <p className="font-medium text-amber-700">Dimensions: Site visit required</p>
                ) : (order.tent_width || order.tent_length) ? (
                  <p>Dimensions: {order.tent_width ?? '?'}m × {order.tent_length ?? '?'}m</p>
                ) : null}
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

          {/* Reference image */}
          {order.reference_image_url && (
            <figure className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <p className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Reference image</p>
              <a href={order.reference_image_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={order.reference_image_url}
                  alt="Customer reference"
                  className="max-h-72 w-full object-cover transition-opacity hover:opacity-90"
                />
              </a>
              <figcaption className="px-4 py-2 text-xs text-slate-400">Click to open full size</figcaption>
            </figure>
          )}

          {/* Message to customer */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Message to customer</p>
            <p className="mb-3 text-xs text-slate-400">Visible on the customer's quote page. Use this to confirm availability or share setup details.</p>
            <textarea
              value={staffMsg}
              onChange={e => { setStaffMsg(e.target.value); setMsgSaved(false) }}
              placeholder="e.g. Your booking is confirmed! We have availability and will set up from 8am on the day."
              className="min-h-[80px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={saveMessage}
                disabled={savingMsg}
                className="rounded-full bg-red-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
              >
                {savingMsg ? 'Saving…' : 'Save message'}
              </button>
              {msgSaved && (
                <span className="text-xs font-medium text-emerald-600">Saved — now visible on the customer's quote page</span>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payment</p>
            <p className="mb-3 text-xs text-slate-400">Set the deposit amount and track payment status for this order.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Deposit required (R)</span>
                <input
                  type="number" min="0" step="0.01"
                  value={depositRequired}
                  onChange={e => { setDepositRequired(e.target.value); setPaymentSaved(false) }}
                  placeholder="e.g. 500.00"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Payment status</span>
                <select
                  value={paymentStatus}
                  onChange={e => { setPaymentStatus(e.target.value); setPaymentSaved(false) }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="deposit_paid">Deposit paid</option>
                  <option value="fully_paid">Fully paid</option>
                </select>
              </label>
              <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={depositPaid}
                  onChange={e => { setDepositPaid(e.target.checked); setPaymentSaved(false) }}
                  className="h-4 w-4 text-red-700"
                />
                Deposit received
              </label>
            </div>

            {totalAmt > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-6 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                <div><span className="text-slate-500">Total: </span><span className="font-semibold text-slate-900">{fmt(totalAmt)}</span></div>
                {depositRequired !== '' && (
                  <div><span className="text-slate-500">Deposit: </span><span className="font-semibold text-slate-900">{fmt(depositAmt)}</span></div>
                )}
                <div>
                  <span className="text-slate-500">Balance due: </span>
                  <span className={`font-semibold ${balanceDue <= 0 ? 'text-emerald-600' : 'text-red-700'}`}>{fmt(balanceDue)}</span>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={savePayment}
                disabled={savingPayment}
                className="rounded-full bg-red-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
              >
                {savingPayment ? 'Saving…' : 'Save payment'}
              </button>
              {paymentSaved && <span className="text-xs font-medium text-emerald-600">Saved</span>}
            </div>
          </div>

          {/* Meta */}
          <p className="mt-3 text-xs text-slate-400">
            Order ID: {order.id} · Submitted: {fmtShort(order.created_at)}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── booking calendar ─────────────────────────────────────────────────────────

function BookingCalendar({ orders, onStatusChange }){
  const todayStr = new Date().toISOString().slice(0, 10)
  const [ym, setYm] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selectedDate, setSelectedDate] = useState(null)

  const { year, month } = ym
  const firstDow    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel  = new Date(year, month, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  const byDate = useMemo(() => {
    const map = {}
    orders.forEach(o => {
      if(!o.event_date) return
      const key = o.event_date.slice(0, 10)
      ;(map[key] ??= []).push(o)
    })
    return map
  }, [orders])

  function go(delta){
    setYm(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
    setSelectedDate(null)
  }

  const cells = []
  for(let i = 0; i < firstDow; i++) cells.push(null)
  for(let d = 1; d <= daysInMonth; d++) cells.push(d)
  while(cells.length % 7 !== 0) cells.push(null)

  const selectedOrders = selectedDate ? (byDate[selectedDate] ?? []) : []

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <button onClick={() => go(-1)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">‹ Prev</button>
        <h3 className="text-base font-semibold text-slate-900">{monthLabel}</h3>
        <button onClick={() => go(1)}  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Next ›</button>
      </header>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {DAY_LABELS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if(!day) return <div key={i} className="min-h-[72px] border-b border-r border-slate-50" />
          const key        = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const count      = byDate[key]?.length ?? 0
          const isToday    = key === todayStr
          const isSelected = key === selectedDate
          const isPast     = key < todayStr
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(isSelected ? null : key)}
              className={[
                'min-h-[72px] border-b border-r border-slate-100 p-2 text-left transition-colors',
                isSelected                    ? 'bg-red-700'               :
                count > 0                     ? 'bg-red-50 hover:bg-red-100' :
                                                'hover:bg-slate-50',
                isPast && !isSelected         ? 'opacity-50'               : '',
              ].join(' ')}
            >
              <span className={[
                'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                isSelected ? 'bg-white text-red-700' : isToday ? 'bg-red-700 text-white' : 'text-slate-700',
              ].join(' ')}>
                {day}
              </span>
              {count > 0 && (
                <span className={`mt-1 block text-xs font-medium ${isSelected ? 'text-red-200' : 'text-red-700'}`}>
                  {count} order{count !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <section className="border-t border-slate-200 bg-slate-50 px-5 py-5">
          <h4 className="mb-4 text-sm font-semibold text-slate-700">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </h4>
          {selectedOrders.length === 0 ? (
            <p className="text-sm text-slate-400">No orders on this date.</p>
          ) : (
            <div className="space-y-3">
              {selectedOrders.map(o => (
                <OrderRow key={o.id} order={o} onStatusChange={onStatusChange} />
              ))}
            </div>
          )}
        </section>
      )}
    </section>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function StaffDashboard(){
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [view, setView]             = useState('list')  // 'list' | 'calendar'
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
    if(sort === 'oldest')     r.sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
    if(sort === 'highest')    r.sort((a,b) => (b.quote?.total ?? 0) - (a.quote?.total ?? 0))
    if(sort === 'event_date') r.sort((a,b) => (a.event_date || '9999').localeCompare(b.event_date || '9999'))
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
        <div className="flex items-center gap-2 flex-wrap">
          <nav className="flex rounded-full border border-slate-200 bg-slate-100 p-1" aria-label="View toggle">
            <button
              onClick={() => setView('list')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${view === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >List</button>
            <button
              onClick={() => setView('calendar')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${view === 'calendar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >Calendar</button>
          </nav>
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
            {TENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
            <option value="event_date">Soonest event</option>
          </select>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Showing {filtered.length} of {orders.length} orders
        </p>
      </div>

      {/* ── Order list / Calendar ── */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading orders…</div>
      ) : view === 'calendar' ? (
        <BookingCalendar orders={orders} onStatusChange={handleStatusChange} />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center text-slate-400">
          No orders match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <OrderRow key={o.id} order={o} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

    </div>
  )
}
