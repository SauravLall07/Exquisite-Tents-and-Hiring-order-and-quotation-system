import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function StaffDashboard(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    async function load(){
      const { data, error } = await supabase.from('orders').select().order('created_at', { ascending: false }).limit(100)
      if(error) console.error(error)
      else setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Staff Dashboard</h2>
      {loading ? <div>Loading...</div> : (
        <div className="space-y-4">
          {orders.length === 0 && <div className="text-gray-600">No orders yet.</div>}
          {orders.map(o => (
            <div key={o.id} className="p-3 border rounded">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{o.name} <span className="text-sm text-gray-500">({o.email || o.phone})</span></div>
                  <div className="text-sm text-gray-600">{o.tentType} — Guests: {o.guestCount}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">£{o.quote?.total?.toFixed?.(2) ?? '—'}</div>
                  <div className="text-sm text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
