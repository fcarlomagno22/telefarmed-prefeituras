import { env } from './config/env.js'
import { checkSupabaseConnection } from './db/supabase.js'
import { buildApp } from './app.js'
import { runAutoCloseExpiredPlantoes } from './modules/profissional-agenda/auto-close-plantao.service.js'
import { runPosConsultaCronJobs } from './modules/pos-consulta/cron.service.js'

const AUTO_CLOSE_PLANTAO_INTERVAL_MS = 30_000
const POS_CONSULTA_CRON_INTERVAL_MS = 5 * 60 * 1000

/** Servidor HTTP local (`npm run dev:api`). Em produção na Vercel, ver `api/index.ts`. */
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

  setInterval(() => {
    void runAutoCloseExpiredPlantoes().catch((error) => {
      console.error('[auto-close-plantao] Falha ao encerrar plantões expirados.', error)
    })
  }, AUTO_CLOSE_PLANTAO_INTERVAL_MS)

  setInterval(() => {
    void runPosConsultaCronJobs().catch((error) => {
      console.error('[pos-consulta-cron] Falha ao processar check-ins pós-consulta.', error)
    })
  }, POS_CONSULTA_CRON_INTERVAL_MS)

  void runPosConsultaCronJobs().catch((error) => {
    console.error('[pos-consulta-cron] Falha na execução inicial.', error)
  })

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  console.log(`[api] Servidor em http://localhost:${env.PORT}`)
}

main().catch((error) => {
  console.error('[api] Falha ao iniciar', error)
  process.exit(1)
})
