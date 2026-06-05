export const DEFAULT_PRICING = {
  tents:        { frame: 150, stretch: 300, peg_pole: 180, bedouin: 350, marquee: 480 },
  extras:       { lighting: 50, flooring: 120, heaters: 80 },
  perGuest:     2.0,
  chairPrice:   1.5,
  tablePrice:   8.0,
  deliveryFee:  60,
  siteVisitFee: 350,
  taxRate:      0.12,
}

export const TENT_TYPES = [
  { value: 'frame',    label: 'Frame Tent' },
  { value: 'stretch',  label: 'Stretch Tent' },
  { value: 'peg_pole', label: 'Peg & Pole Tent' },
  { value: 'bedouin',  label: 'Bedouin / Arabian Tent' },
  { value: 'marquee',  label: 'Marquee' },
]

export function calculateQuote(form, pricing = {}){
  const p = {
    ...DEFAULT_PRICING,
    ...pricing,
    tents:  { ...DEFAULT_PRICING.tents,  ...(pricing.tents  ?? {}) },
    extras: { ...DEFAULT_PRICING.extras, ...(pricing.extras ?? {}) },
  }

  const base       = p.tents[form.tentType] ?? p.tents.stretch
  const guestsCost = (form.guestCount || 0) * p.perGuest
  const chairsCost = (form.chairs     || 0) * p.chairPrice
  const tablesCost = (form.tables     || 0) * p.tablePrice
  const extrasCost = (form.extras     || []).reduce((s, e) => s + (p.extras[e] || 0), 0)

  const deliveryFee  = form.delivery          ? p.deliveryFee  : 0
  const siteVisitFee = form.needsMeasurement  ? p.siteVisitFee : 0

  const subtotal = base + guestsCost + chairsCost + tablesCost + extrasCost + deliveryFee + siteVisitFee
  const tax      = subtotal * p.taxRate
  const total    = subtotal + tax

  return {
    breakdown: { base, guestsCost, chairsCost, tablesCost, extrasCost, deliveryFee, siteVisitFee, tax },
    subtotal,
    total,
  }
}
