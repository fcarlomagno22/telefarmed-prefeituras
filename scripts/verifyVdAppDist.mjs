import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const indexPath = join(root, 'dist/vd-app/index.html')

if (!existsSync(indexPath)) {
  console.error('verifyVdAppDist: dist/vd-app/index.html não encontrado.')
  process.exit(1)
}

const html = readFileSync(indexPath, 'utf8')
if (!html.includes('/_expo/static/js/web/')) {
  console.error('verifyVdAppDist: dist/vd-app/index.html não parece ser o bundle Expo web.')
  process.exit(1)
}

console.log('verifyVdAppDist: dist/vd-app OK.')
