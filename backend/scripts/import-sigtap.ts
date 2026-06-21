import { config } from 'dotenv'
import { resolve } from 'node:path'
import { checkSupabaseConnection } from '../src/db/supabase.js'
import { importSigtapFromDirectory } from '../src/lib/sigtap/importSigtap.js'

config({ path: resolve(process.cwd(), '.env') })

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY não configurado. Rode: npm run setup:supabase-env')
    process.exit(1)
  }

  const directory =
    process.argv[2] ??
    resolve(process.cwd(), 'referencias/sigtap/202606')

  await checkSupabaseConnection()

  console.log(`Importando SIGTAP de ${directory}...`)
  const result = await importSigtapFromDirectory({ directory })

  console.log(
    [
      `Competência ${result.competencia}`,
      `${result.procedimentos} procedimentos`,
      `${result.ocupacoes} ocupações (CBO)`,
      `${result.vinculos} vínculos procedimento × CBO`,
    ].join(' · '),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
