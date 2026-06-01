export function calculateQuote(form){
  const tentPrices = { small: 120, medium: 250, large: 450 }
  const extraPrices = { lighting: 50, flooring: 120, heaters: 80 }

  const base = tentPrices[form.tentType] || tentPrices.medium
  const perGuest = 2.0
  const chairPrice = 1.5
  const tablePrice = 8.0

  const guestsCost = (form.guestCount || 0) * perGuest
  const chairsCost = (form.chairs || 0) * chairPrice
  const tablesCost = (form.tables || 0) * tablePrice

  const extrasCost = (form.extras || []).reduce((s, e) => s + (extraPrices[e] || 0), 0)

  const deliveryFee = form.delivery ? 60 : 0

  const subtotal = base + guestsCost + chairsCost + tablesCost + extrasCost + deliveryFee
  const tax = subtotal * 0.12
  const total = subtotal + tax

  return {
    breakdown: { base, guestsCost, chairsCost, tablesCost, extrasCost, deliveryFee, tax },
    subtotal,
    total
  }
}
