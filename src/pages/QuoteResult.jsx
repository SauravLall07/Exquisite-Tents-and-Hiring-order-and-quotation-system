import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { TENT_TYPES } from '../lib/quoteCalculator'
import { DownloadQuoteButton } from '../components/DownloadQuoteButton'

function fmt(n){ return 'R' + (+(n ?? 0)).toFixed(2) }

export default function QuoteResult(){
  const loc = useLocation()
  const [order, setOrder] = useState(loc.state?.order || null)
  const [quote, setQuote] = useState(loc.state?.quote || null)

  useEffect(()=>{
    async function fetchIfNeeded(){
      if(!order && loc.state?.order?.id) return setOrder(loc.state.order)
      const params = new URLSearchParams(window.location.search)
      const id = params.get('orderId')
      if(id && !order){
        const { data } = await supabase.from('orders').select().eq('id', id).single()
        setOrder(data)
        setQuote(data?.quote || null)
      }
    }
    fetchIfNeeded()
  }, [])

  if(!order) return <div className="bg-white p-6 rounded shadow">No quote available.</div>

  const tentLabel = TENT_TYPES.find(t => t.value === order.tent_type)?.label ?? order.tent_type
  const b = quote?.breakdown

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-red-700">Your Quote</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Quote Result</h2>
          <p className="mt-1 text-sm text-slate-500">Order by: {order.name} ({order.email || order.phone})</p>
        </div>
        <DownloadQuoteButton order={order} variant="primary" label="Download Quote PDF" />
      </div>

      {/* Booking status + staff message */}
      {(() => {
        const s = order.status
        const hasMsg = !!order.staff_message
        if(!hasMsg && (!s || s === 'new')) return null
        const styles = {
          confirmed:   { wrap: 'border-emerald-200 bg-emerald-50', label: 'text-emerald-700', text: 'Booking Confirmed' },
          in_progress: { wrap: 'border-violet-200 bg-violet-50',   label: 'text-violet-700',  text: 'In Progress' },
          completed:   { wrap: 'border-emerald-200 bg-emerald-50', label: 'text-emerald-700', text: 'Completed' },
          cancelled:   { wrap: 'border-red-200 bg-red-50',         label: 'text-red-700',     text: 'Cancelled' },
        }
        const st = styles[s] ?? { wrap: 'border-slate-200 bg-slate-50', label: 'text-slate-500', text: s }
        return (
          <div className={`mt-5 rounded-2xl border px-4 py-4 ${st.wrap}`}>
            {s && s !== 'new' && (
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${st.label}`}>{st.text}</p>
            )}
            {hasMsg && (
              <p className={`text-sm text-slate-700 ${s && s !== 'new' ? 'mt-1' : ''}`}>{order.staff_message}</p>
            )}
          </div>
        )
      })()}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 text-sm text-slate-700">
          {order.event_date && (
            <p>
              <span className="font-medium text-slate-900">Event date:</span>{' '}
              {new Date(order.event_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {order.event_end_date && order.event_end_date !== order.event_date && (
                <> – {new Date(order.event_end_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</>
              )}
            </p>
          )}
          <p><span className="font-medium text-slate-900">Tent type:</span> {tentLabel}</p>
          {order.needs_measurement ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 font-medium">
              Site measurement requested — a team member will contact you to arrange a visit.
            </p>
          ) : (
            (order.tent_width || order.tent_length) && (
              <p><span className="font-medium text-slate-900">Dimensions:</span> {order.tent_width ?? '?'}m × {order.tent_length ?? '?'}m</p>
            )
          )}
          <p><span className="font-medium text-slate-900">Guests:</span> {order.guest_count}</p>
          <p><span className="font-medium text-slate-900">Chairs:</span> {order.chairs} · <span className="font-medium text-slate-900">Tables:</span> {order.tables}</p>
          <p><span className="font-medium text-slate-900">Extras:</span> {(order.extras || []).join(', ') || 'None'}</p>
          <p><span className="font-medium text-slate-900">Delivery:</span> {order.delivery ? 'Yes' : 'No'}</p>
        </div>

        {b && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-1 text-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Breakdown</p>
            {[
              ['Base hire', b.base],
              b.guestsCost  > 0 && ['Guests', b.guestsCost],
              b.chairsCost  > 0 && ['Chairs', b.chairsCost],
              b.tablesCost  > 0 && ['Tables', b.tablesCost],
              b.extrasCost  > 0 && ['Extras', b.extrasCost],
              b.deliveryFee > 0 && ['Delivery', b.deliveryFee],
              b.siteVisitFee > 0 && ['Site measurement visit', b.siteVisitFee],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} className="flex justify-between text-slate-600">
                <span>{k}</span><span>{fmt(v)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-600">
              <span>Tax (12%)</span><span>{fmt(b.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-base pt-1">
              <span>Total</span><span>{fmt(quote.total)}</span>
            </div>
            {order.needs_measurement && (
              <p className="mt-2 text-xs text-slate-400">* Estimate only. Final price confirmed after site visit.</p>
            )}
          </div>
        )}
      </div>

      {/* Payment summary */}
      {(order.payment_status || order.deposit_required != null) && (() => {
        const total      = quote?.total ?? 0
        const pStatus    = order.payment_status || 'unpaid'
        const depReq     = order.deposit_required ?? 0
        const depPaid    = !!order.deposit_paid
        const amountPaid = pStatus === 'fully_paid' ? total : (depPaid ? depReq : 0)
        const balance    = Math.max(0, total - amountPaid)
        const badgeCls   = pStatus === 'fully_paid' ? 'bg-emerald-100 text-emerald-700' :
                           pStatus === 'deposit_paid' ? 'bg-amber-100 text-amber-700' :
                           'bg-red-100 text-red-700'
        const badgeLabel = pStatus === 'fully_paid' ? 'Fully paid' :
                           pStatus === 'deposit_paid' ? 'Deposit paid' : 'Unpaid'
        return (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payment</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeCls}`}>{badgeLabel}</span>
            </div>
            <div className="space-y-1">
              {depReq > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Deposit required</span><span>{fmt(depReq)}</span>
                </div>
              )}
              {depReq > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Amount paid</span><span>{fmt(amountPaid)}</span>
                </div>
              )}
              <div className={`flex justify-between font-semibold ${balance <= 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                <span>Balance due</span><span>{fmt(balance)}</span>
              </div>
            </div>
          </div>
        )
      })()}

      {order.reference_image_url && (
        <figure className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Your reference image</p>
          <img
            src={order.reference_image_url}
            alt="Customer reference"
            className="max-h-72 w-full object-cover"
          />
        </figure>
      )}
    </div>
  )
}
