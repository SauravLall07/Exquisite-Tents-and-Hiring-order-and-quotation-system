import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { DEFAULT_PRICING } from './quoteCalculator'

export function usePricing(){
  const [pricing, setPricing] = useState(DEFAULT_PRICING)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('pricing')
      .select('config')
      .eq('id', 'default')
      .single()
      .then(({ data }) => {
        if(data?.config){
          setPricing({
            ...DEFAULT_PRICING,
            ...data.config,
            tents:  { ...DEFAULT_PRICING.tents,  ...(data.config.tents  ?? {}) },
            extras: { ...DEFAULT_PRICING.extras, ...(data.config.extras ?? {}) },
          })
        }
        setLoading(false)
      })
  }, [])

  return { pricing, loading }
}
