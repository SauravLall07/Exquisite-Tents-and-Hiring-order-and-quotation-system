import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { TENT_TYPES } from '../lib/quoteCalculator'
import { useAuth } from '../lib/AuthContext'
import { DownloadQuoteButton } from '../components/DownloadQuoteButton'

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  new:         { label: 'Pending review', wrap: 'border-blue-200 bg-blue-50',      text: 'text-blue-700' },
  confirmed:   { label: 'Confirmed',      wrap: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700' },
  in_progress: { label: 'In progress',    wrap: 'border-violet-200 bg-violet-50',  text: 'text-violet-700' },
  completed:   { label: 'Completed',      wrap: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700' },
  cancelled:   { label: 'Cancelled',      wrap: 'border-red-200 bg-red-50',        text: 'text-red-700' },
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n)     { return 'R' + (+(n ?? 0)).toFixed(2) }
function fmtDate(d) { return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : null }
function fmtDt(d)   { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }

// ─── order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }) {
  const sm         = STATUS_META[order.status || 'new'] ?? STATUS_META.new
  const tentLabel  = TENT_TYPES.find(t => t.value === order.tent_type)?.label ?? order.tent_type
  const hasMessage = !!order.staff_message

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Card header */}
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-xs text-slate-400">Submitted {fmtDt(order.created_at)}</p>
          {order.event_date ? (
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              Event: {fmtDate(order.event_date)}
              {order.event_end_date && order.event_end_date !== order.event_date && (
                <> – {fmtDate(order.event_end_date)}</>
              )}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-slate-500">No event date set</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${sm.wrap} ${sm.text}`}>
            {sm.label}
          </span>
          <span className="text-lg font-bold text-slate-900">{fmt(order.quote?.total)}</span>
        </div>
      </header>

      {/* Staff message */}
      {hasMessage && (
        <div className={`mx-4 mb-0 rounded-2xl border px-4 py-3 ${sm.wrap}`}>
          <p className={`mb-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-70 ${sm.text}`}>
            Message from our team
          </p>
          <p className={`text-sm leading-6 ${sm.text}`}>{order.staff_message}</p>
        </div>
      )}

      {/* Order details pills */}
      <div className="flex flex-wrap gap-2 px-5 py-4 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">{tentLabel}</span>
        {order.guest_count > 0 && (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{order.guest_count} guests</span>
        )}
        {order.tent_width && order.tent_length && (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
            {order.tent_width}m × {order.tent_length}m
          </span>
        )}
        {order.needs_measurement && (
          <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">Site visit requested</span>
        )}
        {order.chairs > 0 && (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{order.chairs} chairs</span>
        )}
        {order.tables > 0 && (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{order.tables} tables</span>
        )}
        {(order.extras || []).map(e => (
          <span key={e} className="rounded-full bg-slate-100 px-3 py-1.5 capitalize text-slate-600">{e}</span>
        ))}
        {order.delivery && (
          <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">Delivery</span>
        )}
      </div>

      {/* Card footer */}
      <div className="flex items-center justify-end border-t border-slate-100 px-5 py-3">
        <DownloadQuoteButton order={order} variant="secondary" label="Download PDF" />
      </div>
    </article>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail]     = useState('')
  const [orders, setOrders]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if(user) loadByUserId(user.id)
  }, [user])

  async function loadByUserId(uid) {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select()
      .eq('user_id', uid)
      .order('event_date', { ascending: true, nullsFirst: false })
    setOrders(data || [])
    setLoading(false)
    setSearched(true)
  }

  async function handleLookup(e) {
    e.preventDefault()
    if(!email.trim()) return
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select()
      .filter('email', 'ilike', email.trim())
      .order('event_date', { ascending: true, nullsFirst: false })
    setOrders(data || [])
    setLoading(false)
    setSearched(true)
  }

  if(authLoading) return null

  const upcoming = orders?.filter(o => !o.event_date || o.event_date >= new Date().toISOString().slice(0, 10)) ?? []
  const past      = orders?.filter(o => o.event_date && o.event_date < new Date().toISOString().slice(0, 10)) ?? []

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.28em] text-red-700">Track your bookings</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">My Orders</h2>
        <p className="mt-2 text-sm text-slate-500">
          Check the status of your bookings and any messages from our team.
        </p>
      </header>

      {/* Email lookup for non-authenticated customers */}
      {!user && (
        <form
          onSubmit={handleLookup}
          className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end"
        >
          <label className="flex-1">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Email address used when ordering
            </span>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setSearched(false) }}
              required
              placeholder="you@example.com"
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-full bg-red-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Find my orders'}
          </button>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <p className="py-10 text-center text-sm text-slate-400">Loading your orders…</p>
      )}

      {/* No results */}
      {!loading && searched && orders?.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-base font-medium text-slate-600">No orders found.</p>
          <p className="mt-1 text-sm text-slate-400">
            {!user ? 'Double-check the email you used when placing your order.' : 'You haven\'t placed any orders yet.'}
          </p>
          <Link
            to="/order"
            className="mt-6 inline-flex rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
          >
            Place an order
          </Link>
        </div>
      )}

      {/* Order lists */}
      {!loading && orders && orders.length > 0 && (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Upcoming &amp; pending
              </h3>
              <div className="space-y-4">
                {upcoming.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Past events</h3>
              <div className="space-y-4 opacity-70">
                {past.map(o => <OrderCard key={o.id} order={o} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
