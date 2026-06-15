import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APP_BACKGROUND = '#f5f5f5'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const funcionalDir = path.resolve(__dirname, '../assets/funcional')

function isBackgroundSolidLayer(layer) {
  if (layer.ty !== 1) return false

  const name = (layer.nm ?? '').toLowerCase()
  if (/white solid|pale red solid|^bg$|^background$|^app background$/.test(name)) {
    return true
  }

  const color = (layer.sc ?? '').toLowerCase()
  return (
    color === '#ffffff' ||
    color === '#f5f5f5' ||
    color === '#fff' ||
    color === '#0a0a0c' ||
    color === '#14141a'
  )
}

function createAppBackgroundLayer(width, height, outPoint) {
  const centerX = width / 2
  const centerY = height / 2

  return {
    ddd: 0,
    ind: 1,
    ty: 1,
    nm: 'App Background',
    sr: 1,
    ks: {
      o: { a: 0, k: 100, ix: 11 },
      r: { a: 0, k: 0, ix: 10 },
      p: { a: 0, k: [centerX, centerY, 0], ix: 2, l: 2 },
      a: { a: 0, k: [centerX, centerY, 0], ix: 1, l: 2 },
      s: { a: 0, k: [100, 100, 100], ix: 6, l: 2 },
    },
    ao: 0,
    sw: width,
    sh: height,
    sc: APP_BACKGROUND,
    ip: 0,
    op: outPoint,
    st: 0,
    bm: 0,
  }
}

function applyBackgroundToComposition(composition) {
  const width = composition.w ?? 720
  const height = composition.h ?? 720
  const outPoint = composition.op ?? 9999
  let hasBackground = false

  if (Array.isArray(composition.layers)) {
    composition.layers = composition.layers.map((layer) => {
      if (!isBackgroundSolidLayer(layer) && layer.nm !== 'App Background') {
        return layer
      }

      hasBackground = true
      return { ...layer, nm: 'App Background', sc: APP_BACKGROUND }
    })

    if (!hasBackground) {
      composition.layers = [
        ...composition.layers,
        createAppBackgroundLayer(width, height, outPoint),
      ]
    }
  }

  if (Array.isArray(composition.assets)) {
    for (const asset of composition.assets) {
      applyBackgroundToComposition(asset)
    }
  }

  return composition
}

for (const fileName of fs.readdirSync(funcionalDir)) {
  if (!fileName.endsWith('.json')) continue

  const filePath = path.join(funcionalDir, fileName)
  const animation = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  applyBackgroundToComposition(animation)
  fs.writeFileSync(filePath, `${JSON.stringify(animation)}\n`)
  console.log(`${fileName}: app background applied`)
}
