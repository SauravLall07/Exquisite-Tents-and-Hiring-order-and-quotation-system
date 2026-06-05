import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateQuote, TENT_TYPES } from '../lib/quoteCalculator'
import { usePricing } from '../lib/usePricing'
import { supabase } from '../lib/supabaseClient'

export default function OrderForm(){
  const navigate = useNavigate()
  const { pricing } = usePricing()
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    eventDate: '', eventEndDate: '',
    tentType: 'stretch', guestCount: 50, chairs: 50, tables: 10,
    tentWidth: '', tentLength: '', needsMeasurement: false,
    extras: [], delivery: true, notes: ''
  })
  const [referenceImage, setReferenceImage]     = useState(null)
  const [imagePreview, setImagePreview]         = useState(null)
  const [dateAvailability, setDateAvailability] = useState(null) // null | { count }
  const [checkingDate, setCheckingDate]         = useState(false)
  const [submitting, setSubmitting]             = useState(false)

  useEffect(() => {
    if(!form.eventDate){ setDateAvailability(null); return }
    setCheckingDate(true)
    const timer = setTimeout(async () => {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('event_date', form.eventDate)
        .or('status.is.null,status.neq.cancelled')
      setDateAvailability({ count: count ?? 0 })
      setCheckingDate(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [form.eventDate])

  function handleFileChange(e){
    const file = e.target.files[0] || null
    if(imagePreview) URL.revokeObjectURL(imagePreview)
    setReferenceImage(file)
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  function removeImage(){
    if(imagePreview) URL.revokeObjectURL(imagePreview)
    setReferenceImage(null)
    setImagePreview(null)
  }

  function handleChange(e){
    const { name, value, type, checked } = e.target
    if(type === 'checkbox' && name === 'extras'){
      setForm(f => ({...f, extras: checked ? [...f.extras, value] : f.extras.filter(x => x !== value)}))
      return
    }
    if(type === 'checkbox'){
      setForm(f => ({...f, [name]: checked}))
      return
    }
    const parsed = (type === 'number') ? (value === '' ? '' : Number(value)) : value
    setForm(f => ({...f, [name]: parsed}))
  }

  async function handleSubmit(e){
    e.preventDefault()
    setSubmitting(true)
    const quote = calculateQuote(form, pricing)
    let user = null
    try{ const res = await supabase.auth.getUser(); user = res.data?.user ?? null } catch(e){ user = null }

    // Upload reference image to Supabase Storage (bucket: order-images)
    let referenceImageUrl = null
    if(referenceImage){
      if(referenceImage.size > 5 * 1024 * 1024){
        setSubmitting(false)
        alert('Image must be under 5 MB')
        return
      }
      const ext  = referenceImage.name.split('.').pop().toLowerCase()
      const path = `${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('order-images')
        .upload(path, referenceImage, { contentType: referenceImage.type })
      if(uploadError){
        console.error('Image upload error', uploadError)
        setSubmitting(false)
        alert('Failed to upload image — check console')
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('order-images').getPublicUrl(path)
      referenceImageUrl = publicUrl
    }

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      event_date:     form.eventDate     || null,
      event_end_date: form.eventEndDate  || null,
      tent_type: form.tentType,
      guest_count: Number(form.guestCount || 0),
      chairs: Number(form.chairs || 0),
      tables: Number(form.tables || 0),
      tent_width: form.needsMeasurement ? null : (form.tentWidth !== '' ? Number(form.tentWidth) : null),
      tent_length: form.needsMeasurement ? null : (form.tentLength !== '' ? Number(form.tentLength) : null),
      needs_measurement: Boolean(form.needsMeasurement),
      extras: form.extras || [],
      delivery: Boolean(form.delivery),
      notes: form.notes || null,
      reference_image_url: referenceImageUrl,
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

    // Send quote email — fire-and-forget so failures never block the customer
    if(payload.email){
      supabase.functions
        .invoke('send-quote-email', { body: { orderId: data.id } })
        .catch(err => console.warn('Quote email not sent:', err))
    }

    navigate('/quote', { state: { order: data, quote } })
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <hgroup>
          <p className="text-sm uppercase tracking-[0.28em] text-red-700">Customer Order Form</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Book your tent package</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Complete the order details below and receive a tailored quote for your event setup.</p>
        </hgroup>
        <p className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Quote preview available after submit</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact details */}
        <fieldset className="grid gap-4 lg:grid-cols-2 border-0 p-0 m-0 min-w-0">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full name</span>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Jane Doe" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@example.com" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
          </label>
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="+27 71 234 5678" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
        </label>

        {/* Event date */}
        <fieldset className="grid gap-4 lg:grid-cols-2 border-0 p-0 m-0 min-w-0">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Event date <span className="text-red-500">*</span></span>
            <input
              name="eventDate"
              value={form.eventDate}
              onChange={handleChange}
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white"
            />
            {form.eventDate && (
              <span className="mt-1.5 block text-xs">
                {checkingDate ? (
                  <span className="text-slate-400">Checking availability…</span>
                ) : dateAvailability?.count > 0 ? (
                  <span className="font-medium text-amber-600">
                    {dateAvailability.count} order{dateAvailability.count !== 1 ? 's' : ''} already on this date — we'll confirm availability with you.
                  </span>
                ) : dateAvailability?.count === 0 ? (
                  <span className="font-medium text-emerald-600">This date looks available.</span>
                ) : null}
              </span>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">End date <span className="font-normal text-slate-400">(for multi-day events)</span></span>
            <input
              name="eventEndDate"
              value={form.eventEndDate}
              onChange={handleChange}
              type="date"
              min={form.eventDate || new Date().toISOString().slice(0, 10)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white"
            />
          </label>
        </fieldset>

        {/* Tent type + guest count */}
        <fieldset className="grid gap-4 lg:grid-cols-2 border-0 p-0 m-0 min-w-0">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Tent type</span>
            <select name="tentType" value={form.tentType} onChange={handleChange} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white">
              {TENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label} — R{pricing.tents[t.value]} base hire</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Guest count</span>
            <input name="guestCount" value={form.guestCount} onChange={handleChange} type="number" min="1" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
          </label>
        </fieldset>

        {/* Dimensions */}
        {!form.needsMeasurement && (
          <fieldset className="grid gap-4 lg:grid-cols-2 border-0 p-0 m-0 min-w-0">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Tent width (metres)</span>
              <input name="tentWidth" value={form.tentWidth} onChange={handleChange} type="number" min="0" step="0.5" placeholder="e.g. 6" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Tent length (metres)</span>
              <input name="tentLength" value={form.tentLength} onChange={handleChange} type="number" min="0" step="0.5" placeholder="e.g. 12" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
            </label>
          </fieldset>
        )}

        {/* Site measurement option */}
        <fieldset className={`rounded-3xl border px-4 py-4 transition-colors ${form.needsMeasurement ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" name="needsMeasurement" checked={form.needsMeasurement} onChange={handleChange} className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
            <span className="block">
              <strong className="block text-sm font-semibold text-slate-800">I don't know the dimensions — please come measure</strong>
              <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                A team member will visit your venue to take measurements and advise on the best setup.
                A <strong className="font-semibold text-amber-700">R{pricing.siteVisitFee} site visit fee</strong> applies and will be credited toward your final invoice if you proceed.
              </span>
            </span>
          </label>
        </fieldset>

        {/* Reference image */}
        <fieldset className="border-0 p-0 m-0">
          <legend className="mb-2 text-sm font-medium text-slate-700">
            Reference image <span className="font-normal text-slate-400">(optional)</span>
          </legend>
          {imagePreview ? (
            <figure className="relative overflow-hidden rounded-3xl border border-slate-200">
              <img src={imagePreview} alt="Your reference" className="max-h-64 w-full object-cover" />
              <figcaption className="sr-only">Selected reference image preview</figcaption>
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow transition hover:bg-white"
              >
                Remove
              </button>
            </figure>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center transition-colors hover:border-red-400 hover:bg-red-50">
              <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
              <span className="text-sm text-slate-500">Click to attach an image showing your preferred tent style</span>
              <span className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP — max 5 MB</span>
            </label>
          )}
        </fieldset>

        {/* Furniture & extras */}
        <fieldset className="grid gap-4 lg:grid-cols-3 border-0 p-0 m-0 min-w-0">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Chairs</span>
            <input name="chairs" value={form.chairs} onChange={handleChange} type="number" min="0" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Tables</span>
            <input name="tables" value={form.tables} onChange={handleChange} type="number" min="0" className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
          </label>
          <fieldset className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <legend className="text-sm font-semibold text-slate-700">Extras</legend>
            <ul className="mt-3 flex list-none flex-wrap gap-3 p-0 m-0 text-sm text-slate-700">
              <li>
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <input type="checkbox" name="extras" value="lighting" onChange={handleChange} className="h-4 w-4 text-red-700" />
                  Lighting
                </label>
              </li>
              <li>
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <input type="checkbox" name="extras" value="flooring" onChange={handleChange} className="h-4 w-4 text-red-700" />
                  Flooring
                </label>
              </li>
              <li>
                <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                  <input type="checkbox" name="extras" value="heaters" onChange={handleChange} className="h-4 w-4 text-red-700" />
                  Heaters
                </label>
              </li>
            </ul>
          </fieldset>
        </fieldset>

        {/* Delivery */}
        <fieldset className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-800">
            <input type="checkbox" name="delivery" checked={form.delivery} onChange={handleChange} className="h-4 w-4 text-red-700" />
            Delivery required
          </label>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">+R{pricing.deliveryFee}</span>
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Additional notes</span>
          <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any notes" className="mt-2 min-h-[130px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white" />
        </label>

        <footer className="flex justify-end">
          <button type="submit" disabled={submitting} className="rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            {submitting ? 'Requesting...' : 'Request Quote'}
          </button>
        </footer>
      </form>
    </section>
  )
}
