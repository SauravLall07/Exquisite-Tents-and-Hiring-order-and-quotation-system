import React from 'react'
import { Link } from 'react-router-dom'

const serviceCards = [
  { title: 'Tents', description: 'Elegant tents in various sizes to suit any occasion.' },
  { title: 'Furniture', description: 'Chairs, tables and more to complete your setup.' },
  { title: 'Extras', description: 'Lighting, drapes, flooring and additional add-ons.' },
  { title: 'Delivery', description: 'Delivery, setup and collection made easy.' },
]

export default function Home(){
  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
            <span className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-red-700">
              Premium Quality
            </span>
            <h1 className="mt-8 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Beautiful Tents.
              <span className="block text-red-700">Memorable Events.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              We provide high quality tents, furniture and extras to make your event exceptional.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/order" className="inline-flex items-center justify-center rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-800">
                Get a Quote
              </Link>
              <Link to="/dashboard" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                Staff Dashboard
              </Link>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {serviceCards.slice(0, 2).map(card => (
                <div key={card.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[420px] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.15),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526260325294-o9bcd1aafb9a?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center filter saturate-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90" />
            <div className="relative h-full rounded-[2rem] border border-white/50 bg-slate-100 shadow-2xl shadow-slate-200/40" />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-red-600">Our services</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Everything you need for your perfect event</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {serviceCards.map(card => (
            <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-red-100 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                <span className="text-lg font-bold">{card.title.charAt(0)}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
              <span className="mt-5 inline-flex items-center text-sm font-semibold text-red-700">View options →</span>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-red-700 px-6 py-8 text-white shadow-xl shadow-red-700/20 sm:px-10 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-red-200/90">Need help choosing the right setup?</p>
            <p className="mt-3 text-2xl font-semibold leading-tight">Contact us today for expert advice and a free quote.</p>
          </div>
          <Link to="/order" className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-red-700 shadow-lg shadow-red-700/20 transition hover:bg-slate-100">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  )
}
