import { env } from './config/env.js'
import { checkSupabaseConnection } from './db/supabase.js'
import { buildApp } from './app.js'

async function main() {
  const app = await buildApp()

  try {
    await checkSupabaseConnection()
  } catch (error) {
    console.error(
      '[supabase] Falha ao conectar. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (npm run setup:supabase-env).',
      error,
    )
    process.exit(1)
  }

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  console.log(`[api] Servidor em http://localhost:${env.PORT}`)
}

main().catch((error) => {
  console.error('[api] Falha ao iniciar', error)
  process.exit(1)
})
