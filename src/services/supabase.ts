import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Saat development, beri pesan error yang jelas jika env belum diset.
  console.error(
    '[Supabase] VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diset. ' +
    'Salin .env.example ke .env.local dan isi kredensial Anda.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})
