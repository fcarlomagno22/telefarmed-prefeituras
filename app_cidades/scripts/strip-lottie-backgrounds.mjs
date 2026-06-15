import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const funcionalDir = path.resolve(__dirname, '../assets/funcional')

function isBackgroundSolidLayer(layer) {
  if (layer.ty !== 1) return false

  const name = (layer.nm ?? '').toLowerCase()
  if (/white solid|pale red solid|^bg$|^background$/.test(name)) return true

  const color = (layer.sc ?? '').toLowerCase()
  return color === '#ffffff' || color === '#f5f5f5' || color === '#fff'
}

function stripBackgroundSolids(animation) {
  if (!animation || typeof animation !== 'object') return 0

  let removed = 0

  if (Array.isArray(animation.layers)) {
    const before = animation.layers.length
    animation.layers = animation.layers.filter((layer) => !isBackgroundSolidLayer(layer))
    removed += before - animation.layers.length
  }

  if (Array.isArray(animation.assets)) {
    for (const asset of animation.assets) {
      removed += stripBackgroundSolids(asset)
    }
  }

  return removed
}

for (const fileName of fs.readdirSync(funcionalDir)) {
  if (!fileName.endsWith('.json')) continue

  const filePath = path.join(funcionalDir, fileName)
  const animation = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const removed = stripBackgroundSolids(animation)

  if (removed > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(animation)}\n`)
    console.log(`${fileName}: removed ${removed} background layer(s)`)
  } else {
    console.log(`${fileName}: no background layer found`)
  }
}
