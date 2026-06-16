import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const serviceCards = [
  { title: 'Tents',     description: 'Elegant tents in various sizes to suit any occasion.' },
  { title: 'Furniture', description: 'Chairs, tables and more to complete your setup.' },
  { title: 'Extras',    description: 'Lighting, drapes, flooring and additional add-ons.' },
  { title: 'Covers',    description: 'Custom covers and canopies for any event.' },
]

const contactDetails = {
  phone: '011 8571505',
  email: 'exquisite1@telkomsa.net',
  hours: 'Monday to Friday, 08:00 - 17:00',
}

const heroSlides = [
  {
    title: 'Frame tents',
    image: '/Frame-tent.jpg',
    alt: 'Frame tent setup for an outdoor event',
  },
  {
    title: 'Peg and pole tents',
    image: '/PegandPole-tent.jpg',
    alt: 'Peg and pole tent setup for an outdoor event',
  },
  {
    title: 'Snow peak tents',
    image: '/SnowPeak-tent.jpg',
    alt: 'Snow peak tent setup for an outdoor event',
  },
  {
    title: 'Event tents',
    image: '/hero-tent.jpg',
    alt: 'White event tent setup on a grass venue',
  },
]

export default function Home(){
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)

  useEffect(() => {
    if(!isContactOpen) return

    const handleKeyDown = (event) => {
      if(event.key === 'Escape') setIsContactOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isContactOpen])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroSlide(current => (current + 1) % heroSlides.length)
    }, 6000)

    return () => window.clearInterval(interval)
  }, [])

  const activeSlide = heroSlides[activeHeroSlide]
  const showPreviousSlide = () => {
    setActiveHeroSlide(current => (current - 1 + heroSlides.length) % heroSlides.length)
  }
  const showNextSlide = () => {
    setActiveHeroSlide(current => (current + 1) % heroSlides.length)
  }

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
              <Link to="/catalog" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                View Catalog
              </Link>
              <Link to="/my-orders" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                My Orders
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

          <div className="relative h-[420px] overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-900 shadow-2xl shadow-slate-200/40">
            <img
              key={activeSlide.title}
              src={activeSlide.image}
              alt={activeSlide.alt}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-y-0 left-4 flex items-center">
              <button type="button" onClick={showPreviousSlide} aria-label="Show previous tent type" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl font-semibold text-slate-900 shadow-lg shadow-slate-950/10 transition hover:bg-white">
                {'<'}
              </button>
            </div>
            <div className="absolute inset-y-0 right-4 flex items-center">
              <button type="button" onClick={showNextSlide} aria-label="Show next tent type" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl font-semibold text-slate-900 shadow-lg shadow-slate-950/10 transition hover:bg-white">
                {'>'}
              </button>
            </div>
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
              <Link to="/catalog" className="mt-5 inline-flex items-center text-sm font-semibold text-red-700">View options →</Link>
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
          <button type="button" onClick={() => setIsContactOpen(true)} className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-red-700 shadow-lg shadow-red-700/20 transition hover:bg-slate-100">
            Contact Us
          </button>
        </div>
      </section>

      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title" onMouseDown={() => setIsContactOpen(false)}>
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl shadow-slate-950/20 sm:p-8" onMouseDown={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-700">Contact details</p>
                <h2 id="contact-dialog-title" className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Talk to our event team</h2>
              </div>
              <button type="button" onClick={() => setIsContactOpen(false)} aria-label="Close contact details" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
                x
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <a href={`tel:${contactDetails.phone.replace(/\s/g, '')}`} className="block rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-red-100 hover:bg-red-50">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</span>
                <span className="mt-1 block text-lg font-semibold text-slate-900">{contactDetails.phone}</span>
              </a>
              <a href={`mailto:${contactDetails.email}`} className="block rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-red-100 hover:bg-red-50">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</span>
                <span className="mt-1 block break-all text-lg font-semibold text-slate-900">{contactDetails.email}</span>
              </a>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hours</span>
                <span className="mt-1 block text-base font-semibold text-slate-900">{contactDetails.hours}</span>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-slate-700">
              For faster help, include your event date, venue, guest count, preferred tent size, and any furniture or extras you need.
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/order" onClick={() => setIsContactOpen(false)} className="inline-flex flex-1 items-center justify-center rounded-full bg-red-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-800">
                Request a Quote
              </Link>
              <button type="button" onClick={() => setIsContactOpen(false)} className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
