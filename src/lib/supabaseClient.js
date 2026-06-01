import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if(!SUPABASE_URL || !SUPABASE_ANON_KEY){
  console.warn('Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function getCurrentUser(){
  try{
    const { data } = await supabase.auth.getUser()
    return data?.user ?? null
  } catch(e){
    console.warn('getCurrentUser error', e)
    return null
  }
}

export function onAuthChange(callback){
  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
  return subscription
}

export async function getProfile(userId){
  if(!userId) return null
  try{
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if(error){
      console.warn('getProfile supabase error', error)
      return null
    }
    console.debug('getProfile result', data)
    return data
  } catch(e){
    console.warn('getProfile error', e)
    return null
  }
}
