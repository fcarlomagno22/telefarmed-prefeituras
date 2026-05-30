import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { env } from '../config/env.js'

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  // Node.js 20 não tem WebSocket nativo; obrigatório para o cliente Supabase subir
  realtime: {
    transport: ws,
  },
})

export async function checkSupabaseConnection(): Promise<void> {
  const { error } = await supabaseAdmin.from('usuarios_admin').select('id').limit(1)
  if (error) {
    throw error
  }
}
