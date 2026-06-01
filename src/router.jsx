import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import OrderForm from './pages/OrderForm'
import QuoteResult from './pages/QuoteResult'
import StaffDashboard from './pages/StaffDashboard'
import AdminProfiles from './pages/AdminProfiles'
import { getProfile } from './lib/supabaseClient'
import { supabase } from './lib/supabaseClient'

export default function AppRouter(){
  const [isStaff, setIsStaff] = useState(false)

  useEffect(()=>{
    let mounted = true
    async function init(){
      try{
        const { data } = await supabase.auth.getUser()
        const user = data?.user ?? null
        if(user?.id){
          const profile = await getProfile(user.id)
          if(mounted) setIsStaff(!!profile?.is_staff)
        }
      } catch(e){ console.warn('init auth check failed', e) }
    }
    init()
    const { data: subData } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      if(user?.id){
        const profile = await getProfile(user.id)
        if(mounted) setIsStaff(!!profile?.is_staff)
      } else {
        if(mounted) setIsStaff(false)
      }
    })
    const subscription = subData?.subscription ?? subData
    return ()=>{ mounted = false; subscription?.unsubscribe?.() }
  }, [])

  return (
    <div className="space-y-8">
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/order" element={<OrderForm/>} />
        <Route path="/quote" element={<QuoteResult/>} />
        <Route path="/dashboard" element={<StaffDashboard/>} />
        <Route path="/admin" element={<AdminProfiles/>} />
      </Routes>
    </div>
  )
}
