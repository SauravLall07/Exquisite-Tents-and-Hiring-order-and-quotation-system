import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const CATEGORIES = [
  { value: 'all',       label: 'All' },
  { value: 'tent',      label: 'Tents' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'extras',    label: 'Extras' },
  { value: 'covers',    label: 'Covers' },
]

export default function Catalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('all')

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setProducts(data ?? [])
        setLoading(false)
      })
  }, [])

  const visible = tab === 'all' ? products : products.filter(p => p.category === tab)

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading catalog…</div>
  }

  return (
    <div className="space-y-10">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-red-600">Our range</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">Catalog</h1>
        <p className="mt-4 text-base leading-7 text-slate-500">
          Browse our collection and request a quote for any setup.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex justify-center">
        <nav className="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-slate-100 p-1">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setTab(c.value)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                tab === c.value
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </nav>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 py-20 text-center text-slate-400">
          No products listed yet.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(p => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="h-56 w-full object-cover transition group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-56 items-center justify-center bg-slate-100 text-slate-300">
                  <span className="text-4xl font-black">{p.name.charAt(0)}</span>
                </div>
              )}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900">{p.name}</h2>
                {p.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">{p.description}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  {p.capacity && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      Up to {p.capacity} guests
                    </span>
                  )}
                  {p.price_from && (
                    <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      From R{Number(p.price_from).toLocaleString()}
                    </span>
                  )}
                </div>
                <Link
                  to="/order"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-700/20 transition hover:bg-red-800"
                >
                  Get a Quote
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] bg-red-700 px-6 py-8 text-white shadow-xl shadow-red-700/20 sm:px-10 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-red-200/90">Not sure what you need?</p>
            <p className="mt-3 text-2xl font-semibold leading-tight">Get in touch for expert advice and a free quote.</p>
          </div>
          <Link
            to="/order"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-red-700 shadow-lg shadow-red-700/20 transition hover:bg-slate-100"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  )
}
