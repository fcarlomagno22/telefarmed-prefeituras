import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = join(root, 'app_cidades/dist')
const targetDir = join(root, 'dist/vd-app')

if (!existsSync(sourceDir)) {
  console.error('copyAppCidadesToDist: app_cidades/dist não encontrado.')
  process.exit(1)
}

mkdirSync(targetDir, { recursive: true })
cpSync(sourceDir, targetDir, { recursive: true })
console.log('copyAppCidadesToDist: app cidadão copiado para dist/vd-app')
