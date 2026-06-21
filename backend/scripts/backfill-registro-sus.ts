import { config } from 'dotenv'
import { resolve } from 'node:path'
import { supabaseAdmin } from '../src/db/supabase.js'
import { rebuildConsultaRegistroSus } from '../src/lib/faturamento/rebuildRegistroSus.js'

config({ path: resolve(process.cwd(), '.env') })

async function main() {
  const { data, error } = await supabaseAdmin
    .from('consultas')
    .select('id')
    .eq('status', 'concluida')

  if (error) throw error

  let ok = 0
  for (const row of data ?? []) {
    const result = await rebuildConsultaRegistroSus(String(row.id))
    if (result) ok += 1
  }

  console.log(
    `Backfill concluído: ${ok} registro(s) SUS gerado(s) de ${(data ?? []).length} consulta(s).`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
