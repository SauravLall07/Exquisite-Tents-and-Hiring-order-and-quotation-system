import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { TENT_TYPES } from './quoteCalculator'

// ─── design tokens ─────────────────────────────────────────────────────────────
const RED     = '#b91c1c'
const DARK    = '#1e293b'
const MID     = '#64748b'
const LIGHT   = '#f8fafc'
const BORDER  = '#e2e8f0'
const WHITE   = '#ffffff'
const GREEN   = '#16a34a'

// ─── styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: DARK,
    paddingHorizontal: 44,
    paddingTop: 0,
    paddingBottom: 48,
    backgroundColor: WHITE,
  },

  // ── header band ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: RED,
    marginHorizontal: -44,
    paddingHorizontal: 44,
    paddingTop: 28,
    paddingBottom: 24,
    marginBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bizName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 17,
    color: WHITE,
    letterSpacing: 0.6,
  },
  tagline: {
    fontSize: 8,
    color: '#fca5a5',
    marginTop: 3,
    letterSpacing: 0.4,
  },
  quoteTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
    color: WHITE,
    textAlign: 'right',
    letterSpacing: 2,
  },
  quoteMeta: {
    fontSize: 8,
    color: '#fca5a5',
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 1.7,
  },

  // ── two-column info block ─────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    marginBottom: 22,
    gap: 24,
  },
  infoCol: {
    flex: 1,
  },
  infoColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: RED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  infoName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: DARK,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 9,
    color: MID,
    lineHeight: 1.5,
  },
  infoTextRight: {
    fontSize: 9,
    color: MID,
    lineHeight: 1.5,
    textAlign: 'right',
  },

  // ── divider ───────────────────────────────────────────────────────────────────
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 14,
  },

  // ── section heading ───────────────────────────────────────────────────────────
  sectionHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: RED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 18,
  },

  // ── table ─────────────────────────────────────────────────────────────────────
  tableHead: {
    flexDirection: 'row',
    backgroundColor: LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderLeftWidth: 1,
    borderLeftColor: BORDER,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  colDesc: {
    flex: 1,
    fontSize: 9,
    color: DARK,
  },
  colDescHead: {
    flex: 1,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: MID,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  colAmt: {
    width: 72,
    fontSize: 9,
    color: DARK,
    textAlign: 'right',
  },
  colAmtHead: {
    width: 72,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: MID,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'right',
  },

  // ── totals ────────────────────────────────────────────────────────────────────
  totalsWrapper: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    width: 200,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  totalLabel: {
    flex: 1,
    fontSize: 9,
    color: MID,
  },
  totalValue: {
    width: 72,
    fontSize: 9,
    color: DARK,
    textAlign: 'right',
  },
  grandRow: {
    flexDirection: 'row',
    width: 200,
    backgroundColor: RED,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 3,
  },
  grandLabel: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: WHITE,
  },
  grandValue: {
    width: 72,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: WHITE,
    textAlign: 'right',
  },

  // ── payment block ─────────────────────────────────────────────────────────────
  paymentBlock: {
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    marginTop: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  paymentLabel: {
    fontSize: 9,
    color: MID,
  },
  paymentValue: {
    fontSize: 9,
    color: DARK,
    fontFamily: 'Helvetica-Bold',
  },

  // ── notes ─────────────────────────────────────────────────────────────────────
  notesText: {
    fontSize: 9,
    color: MID,
    lineHeight: 1.6,
    marginTop: 4,
  },

  // ── terms ─────────────────────────────────────────────────────────────────────
  termItem: {
    fontSize: 7.5,
    color: MID,
    lineHeight: 1.7,
    marginBottom: 1,
  },

  // ── footer ────────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 7,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
})

// ─── helpers ───────────────────────────────────────────────────────────────────
function rands(n)   { return 'R ' + (+(n ?? 0)).toFixed(2) }
function fmtD(d)    { return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' }
function today()    { return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }

// ─── main document ─────────────────────────────────────────────────────────────
export function QuotePDF({ order }) {
  const quote    = order.quote    ?? {}
  const b        = quote.breakdown ?? {}
  const tentLabel = TENT_TYPES.find(t => t.value === order.tent_type)?.label ?? order.tent_type ?? '—'
  const refNo    = (order.id ?? '').slice(0, 8).toUpperCase()

  // payment
  const pStatus    = order.payment_status  ?? 'unpaid'
  const depReq     = order.deposit_required ?? 0
  const depPaid    = !!order.deposit_paid
  const totalAmt   = quote.total ?? 0
  const amountPaid = pStatus === 'fully_paid' ? totalAmt : (depPaid ? depReq : 0)
  const balance    = Math.max(0, totalAmt - amountPaid)
  const showPayment = depReq > 0 || pStatus !== 'unpaid'

  const paymentStatusLabel =
    pStatus === 'fully_paid'   ? 'Fully paid'   :
    pStatus === 'deposit_paid' ? 'Deposit paid' : 'Unpaid'

  // line items
  const items = [
    b.base        > 0 && { desc: `${tentLabel} – base hire`,                          amt: b.base },
    b.guestsCost  > 0 && { desc: `Guests (${order.guest_count ?? 0} pax @ per-guest)`, amt: b.guestsCost },
    b.chairsCost  > 0 && { desc: `Chairs × ${order.chairs ?? 0}`,                     amt: b.chairsCost },
    b.tablesCost  > 0 && { desc: `Tables × ${order.tables ?? 0}`,                     amt: b.tablesCost },
    b.extrasCost  > 0 && { desc: `Extras (${(order.extras ?? []).map(e => e[0].toUpperCase() + e.slice(1)).join(', ')})`, amt: b.extrasCost },
    b.deliveryFee > 0 && { desc: 'Delivery',                                           amt: b.deliveryFee },
    b.siteVisitFee > 0 && { desc: 'Site measurement visit',                            amt: b.siteVisitFee },
  ].filter(Boolean)

  // event date string
  let eventDateStr = fmtD(order.event_date)
  if(order.event_end_date && order.event_end_date !== order.event_date){
    eventDateStr += ' – ' + fmtD(order.event_end_date)
  }

  return (
    <Document title={`Quotation – ${order.name ?? 'Customer'}`} author="Exquisite Tents & Hiring">
      <Page size="A4" style={s.page}>

        {/* ── Header band ──────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.bizName}>EXQUISITE TENTS &amp; HIRING</Text>
            <Text style={s.tagline}>Premium events made easy</Text>
          </View>
          <View>
            <Text style={s.quoteTitle}>QUOTATION</Text>
            <Text style={s.quoteMeta}>
              {'Ref: ' + refNo + '\n' +
               'Issued: ' + today() + '\n' +
               'Valid for 30 days'}
            </Text>
          </View>
        </View>

        {/* ── Bill to / Event summary ──────────────────────────────────────── */}
        <View style={s.infoRow}>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>Bill to</Text>
            <Text style={s.infoName}>{order.name ?? '—'}</Text>
            {order.email ? <Text style={s.infoText}>{order.email}</Text> : null}
            {order.phone ? <Text style={s.infoText}>{order.phone}</Text> : null}
          </View>
          <View style={s.infoColRight}>
            <Text style={s.infoLabel}>Event</Text>
            <Text style={s.infoTextRight}>{eventDateStr}</Text>
            <Text style={s.infoTextRight}>{tentLabel}</Text>
            <Text style={s.infoTextRight}>{order.guest_count ?? '—'} guests</Text>
            {order.needs_measurement
              ? <Text style={s.infoTextRight}>Dimensions: site visit required</Text>
              : (order.tent_width && order.tent_length)
                ? <Text style={s.infoTextRight}>{order.tent_width}m × {order.tent_length}m</Text>
                : null
            }
            {order.delivery ? <Text style={s.infoTextRight}>Delivery included</Text> : null}
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Line items ───────────────────────────────────────────────────── */}
        <Text style={s.sectionHeading}>Quote Breakdown</Text>
        <View style={s.tableHead}>
          <Text style={s.colDescHead}>Description</Text>
          <Text style={s.colAmtHead}>Amount</Text>
        </View>
        {items.map((item, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={s.colDesc}>{item.desc}</Text>
            <Text style={s.colAmt}>{rands(item.amt)}</Text>
          </View>
        ))}

        {/* ── Totals ───────────────────────────────────────────────────────── */}
        <View style={s.totalsWrapper}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{rands(quote.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Tax (VAT)</Text>
            <Text style={s.totalValue}>{rands(b.tax)}</Text>
          </View>
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>TOTAL DUE</Text>
            <Text style={s.grandValue}>{rands(quote.total)}</Text>
          </View>
        </View>

        {/* ── Payment ──────────────────────────────────────────────────────── */}
        {showPayment && (
          <>
            <Text style={s.sectionHeading}>Payment</Text>
            <View style={s.paymentBlock}>
              <View style={s.paymentRow}>
                <Text style={s.paymentLabel}>Status</Text>
                <Text style={[s.paymentValue, { color: pStatus === 'fully_paid' ? GREEN : pStatus === 'deposit_paid' ? '#d97706' : RED }]}>
                  {paymentStatusLabel}
                </Text>
              </View>
              {depReq > 0 && (
                <View style={s.paymentRow}>
                  <Text style={s.paymentLabel}>Deposit required</Text>
                  <Text style={s.paymentValue}>{rands(depReq)}</Text>
                </View>
              )}
              {depReq > 0 && (
                <View style={s.paymentRow}>
                  <Text style={s.paymentLabel}>Amount paid</Text>
                  <Text style={s.paymentValue}>{rands(amountPaid)}</Text>
                </View>
              )}
              <View style={[s.paymentRow, { borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4, paddingTop: 6 }]}>
                <Text style={[s.paymentLabel, { fontFamily: 'Helvetica-Bold', color: DARK }]}>Balance due</Text>
                <Text style={[s.paymentValue, { color: balance <= 0 ? GREEN : RED }]}>{rands(balance)}</Text>
              </View>
            </View>
          </>
        )}

        {/* ── Notes ────────────────────────────────────────────────────────── */}
        {order.notes ? (
          <>
            <Text style={s.sectionHeading}>Notes</Text>
            <Text style={s.notesText}>{order.notes}</Text>
          </>
        ) : null}

        {/* ── Site visit note ───────────────────────────────────────────────── */}
        {order.needs_measurement && (
          <>
            <Text style={s.sectionHeading}>Site Measurement</Text>
            <Text style={s.notesText}>
              {'A site measurement visit has been requested. The ' + rands(b.siteVisitFee ?? 350) +
               ' site visit fee is included in this estimate and will be credited toward your final invoice if you proceed with the booking.'}
            </Text>
          </>
        )}

        {/* ── Terms ────────────────────────────────────────────────────────── */}
        <Text style={s.sectionHeading}>Terms &amp; Conditions</Text>
        <Text style={s.termItem}>1.  Payment: A 50% non-refundable deposit is required to confirm your booking. The remaining balance must be settled no later than 48 hours before the event date.</Text>
        <Text style={s.termItem}>2.  Cancellation: Cancellations made more than 14 days before the event will receive a full refund of the deposit. Cancellations within 14 days forfeit the deposit in full.</Text>
        <Text style={s.termItem}>3.  Damage &amp; Liability: The client is responsible for any damage to hired equipment during the hire period. Charges will reflect the actual cost of repair or replacement.</Text>
        <Text style={s.termItem}>4.  Access &amp; Setup: Clear vehicle access and a reasonably level ground surface are required. Specific setup requirements must be discussed and agreed upon in advance of the event.</Text>
        <Text style={s.termItem}>5.  Validity: This quotation is valid for 30 days from the date of issue. Prices are subject to revision after the validity period.</Text>
        <Text style={s.termItem}>6.  Force Majeure: Exquisite Tents &amp; Hiring shall not be held liable for failure to perform due to circumstances beyond reasonable control (severe weather, civil unrest, etc.).</Text>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Exquisite Tents &amp; Hiring  ·  Premium events made easy</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}
