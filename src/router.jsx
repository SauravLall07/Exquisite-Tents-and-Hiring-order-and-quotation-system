import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import OrderForm from './pages/OrderForm'
import QuoteResult from './pages/QuoteResult'
import MyOrders from './pages/MyOrders'
import StaffDashboard from './pages/StaffDashboard'
import AdminProfiles from './pages/AdminProfiles'
import AdminPricing from './pages/AdminPricing'
import Catalog from './pages/Catalog'
import AdminCatalog from './pages/AdminCatalog'
import { useAuth } from './lib/AuthContext'

function StaffOnly({ children }){
  const { isStaff, loading } = useAuth()
  if(loading) return <div className="py-10 text-center text-slate-500">Loading...</div>
  if(!isStaff) return <Navigate to="/" replace />
  return children
}

export default function AppRouter(){
  return (
    <div className="space-y-8">
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/order" element={<OrderForm/>} />
        <Route path="/quote" element={<QuoteResult/>} />
        <Route path="/my-orders" element={<MyOrders/>} />
        <Route path="/dashboard" element={<StaffOnly><StaffDashboard/></StaffOnly>} />
        <Route path="/admin" element={<StaffOnly><AdminProfiles/></StaffOnly>} />
        <Route path="/pricing" element={<StaffOnly><AdminPricing/></StaffOnly>} />
        <Route path="/catalog" element={<Catalog/>} />
        <Route path="/catalog/manage" element={<StaffOnly><AdminCatalog/></StaffOnly>} />
      </Routes>
    </div>
  )
}
