import { config } from 'dotenv'
import { resolve } from 'node:path'
import { checkSupabaseConnection } from '../src/db/supabase.js'
import { ensureMasterUser } from '../src/modules/admin-auth/service.js'
import { supabaseAdmin } from '../src/db/supabase.js'

config({ path: resolve(process.cwd(), '.env') })

const MASTER_CPF = process.env.ADMIN_MASTER_CPF ?? '22652204858'
const MASTER_NAME = process.env.ADMIN_MASTER_NAME ?? 'Fernando Carlomagno'
const MASTER_EMAIL = process.env.ADMIN_MASTER_EMAIL ?? 'fernando.carlomagno@telefarmed.com.br'
const MASTER_PASSWORD = process.env.ADMIN_MASTER_PASSWORD

async function main() {
  if (!MASTER_PASSWORD || MASTER_PASSWORD.length < 8) {
    console.error(
      'Defina ADMIN_MASTER_PASSWORD no .env (mín. 8 caracteres) antes de executar o seed.',
    )
    process.exit(1)
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY não configurado. Rode: npm run setup:supabase-env')
    process.exit(1)
  }

  await checkSupabaseConnection()

  await ensureMasterUser({
    cpf: MASTER_CPF,
    nome: MASTER_NAME,
    email: MASTER_EMAIL,
    password: MASTER_PASSWORD,
  })

  const { data: user, error } = await supabaseAdmin
    .from('usuarios_admin')
    .select('id, cpf, eh_master')
    .eq('cpf', MASTER_CPF.replace(/\D/g, ''))
    .maybeSingle()

  if (error || !user) {
    console.error('Usuário master não encontrado após seed.', error)
    process.exit(1)
  }

  console.log(`[seed] Master admin pronto: ${user.id} (CPF ${user.cpf})`)
}

main().catch((error) => {
  console.error('[seed] Falha', error)
  process.exit(1)
})
