import React from 'react'
import AppRouter from './router'
import { Link } from 'react-router-dom'
import Auth from './components/Auth'
import { useAuth } from './lib/AuthContext'

export default function App(){
  const { isStaff } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm shadow-slate-200/50 backdrop-blur-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo.jpeg"
                alt="Exquisite Tents & Hiring logo"
                className="h-12 w-12 rounded-2xl border border-slate-200 bg-white object-cover shadow-lg shadow-red-700/20"
              />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-700">Exquisite Tents</p>
                <p className="text-sm text-slate-500">Premium events made easy</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
              <Link to="/" className="rounded-full px-4 py-2 transition hover:bg-slate-100">Home</Link>
<Link to="/order" className="rounded-full px-4 py-2 transition hover:bg-slate-100">Order</Link>
              <Link to="/my-orders" className="rounded-full px-4 py-2 transition hover:bg-slate-100">My Orders</Link>
              {isStaff && <Link to="/dashboard" className="rounded-full px-4 py-2 transition hover:bg-slate-100">Staff</Link>}
              {isStaff && <Link to="/admin" className="rounded-full px-4 py-2 transition hover:bg-slate-100">Admin</Link>}
              {isStaff && <Link to="/pricing" className="rounded-full px-4 py-2 transition hover:bg-slate-100">Pricing</Link>}
            </div>
            <div className="flex items-center justify-end">
              <Auth />
            </div>
          </div>
        </header>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <AppRouter />
      </main>
    </div>
  )
}
