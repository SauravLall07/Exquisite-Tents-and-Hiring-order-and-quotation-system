import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function QuoteResult(){
  const loc = useLocation()
  const [order, setOrder] = useState(loc.state?.order || null)
  const [quote, setQuote] = useState(loc.state?.quote || null)

  useEffect(()=>{
    async function fetchIfNeeded(){
      if(!order && loc.state?.order?.id) return setOrder(loc.state.order)
      const params = new URLSearchParams(window.location.search)
      const id = params.get('orderId')
      if(id && !order){
        const { data } = await supabase.from('orders').select().eq('id', id).single()
        setOrder(data)
        setQuote(data?.quote || null)
      }
    }
    fetchIfNeeded()
  }, [])

  if(!order) return <div className="bg-white p-6 rounded shadow">No quote available.</div>

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Quote Result</h2>
      <p className="text-sm text-gray-600 mb-4">Order by: {order.name} ({order.email || order.phone})</p>
      <div className="space-y-2">
        <div><strong>Tent:</strong> {order.tentType}</div>
        <div><strong>Guests:</strong> {order.guestCount}</div>
        <div><strong>Chairs:</strong> {order.chairs}</div>
        <div><strong>Tables:</strong> {order.tables}</div>
        <div><strong>Extras:</strong> {(order.extras || []).join(', ') || 'None'}</div>
        <div><strong>Delivery:</strong> {order.delivery ? 'Yes' : 'No'}</div>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <div className="text-sm text-gray-600">Estimated total</div>
        <div className="text-2xl font-bold mt-1">£{quote?.total?.toFixed(2)}</div>
      </div>
    </div>
  )
}
