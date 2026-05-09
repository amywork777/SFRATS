import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase env vars not set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). ' +
    'The app will still mount but data fetches will fail until you configure them in frontend/.env. ' +
    'See README for setup.'
  )
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)

if (isSupabaseConfigured) {
  supabase.from('items').select('count').single()
    .then(({ error }) => {
      if (error) {
        console.error('Supabase connection test failed:', error)
      } else {
        console.log('Supabase connection test successful')
      }
    })
}
