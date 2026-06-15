import type { AnimationObject } from 'lottie-react-native'

/** Fundo claro do “palco” do Lottie — contraste para figuras escuras dos exercícios. */
export const FUNCTIONAL_LOTTIE_STAGE = '#f5f5f5'

/** Borda do palco sobre o fundo escuro do app. */
export const FUNCTIONAL_LOTTIE_STAGE_BORDER = 'rgba(255, 255, 255, 0.1)'

type LottieLayer = {
  ty?: number
  nm?: string
  sc?: string
  ind?: number
  refId?: string
  ks?: {
    s?: {
      a?: number
      k?: number | number[]
      ix?: number
    }
    p?: {
      a?: number
      k?: number | number[]
      ix?: number
    }
  }
}

type LottieComposition = AnimationObject & {
  w?: number
  h?: number
  op?: number
  layers?: LottieLayer[]
  assets?: LottieComposition[]
}

const REPLACED_BACKGROUND_COLORS = new Set([
  '#ffffff',
  '#fff',
  '#f5f5f5',
  '#0a0a0c',
  '#14141a',
  FUNCTIONAL_LOTTIE_STAGE.toLowerCase(),
])

export function isBackgroundSolidLayer(layer: LottieLayer) {
  if (layer.ty !== 1) return false

  const name = (layer.nm ?? '').toLowerCase()
  if (
    /white solid|pale red solid|^bg$|^background$|^app background$/.test(name)
  ) {
    return true
  }

  const color = (layer.sc ?? '').toLowerCase()
  return REPLACED_BACKGROUND_COLORS.has(color)
}

function createStageBackgroundLayer(width: number, height: number, outPoint: number) {
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
    sc: FUNCTIONAL_LOTTIE_STAGE,
    ip: 0,
    op: outPoint,
    st: 0,
    bm: 0,
  }
}

/** Escala do personagem dentro do artboard para evitar cortes nos movimentos amplos. */
export const FUNCTIONAL_LOTTIE_CONTENT_SCALE = 0.88

const EXERCISE_CONTENT_SCALE: Record<string, number> = {}

const EXERCISE_EXTRA_PADDING: Record<string, number> = {}

export function getFunctionalLottieExtraPadding(exerciseId?: string) {
  if (!exerciseId) return 0
  return EXERCISE_EXTRA_PADDING[exerciseId] ?? 0
}

function isAppBackgroundLayer(layer: LottieLayer) {
  return layer.ty === 1 && (layer.nm === 'App Background' || isBackgroundSolidLayer(layer))
}

function scaleLayerTransform(layer: LottieLayer, scale: number) {
  const transform = layer.ks?.s
  if (!transform) return

  if (transform.a === 0 && Array.isArray(transform.k)) {
    transform.k = [
      transform.k[0] * scale,
      transform.k[1] * scale,
      transform.k[2] ?? 100,
    ]
    return
  }

  if (transform.a === 0 && typeof transform.k === 'number') {
    transform.k = transform.k * scale
  }
}

/** Reduz camadas de conteúdo na raiz de cada composição (não mexe no fundo). */
function fitRootContentLayers(composition: LottieComposition, scale: number) {
  if (!Array.isArray(composition.layers)) return

  for (const layer of composition.layers) {
    if (isAppBackgroundLayer(layer)) continue
    scaleLayerTransform(layer, scale)
  }
}

function fitContentInAllCompositions(composition: LottieComposition, scale: number) {
  fitRootContentLayers(composition, scale)
}

function applyBackgroundToComposition(composition: LottieComposition) {
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
      return {
        ...layer,
        nm: 'App Background',
        sc: FUNCTIONAL_LOTTIE_STAGE,
      }
    })

    if (!hasBackground) {
      composition.layers = [
        ...composition.layers,
        createStageBackgroundLayer(width, height, outPoint),
      ]
    }
  }

  if (Array.isArray(composition.assets)) {
    composition.assets = composition.assets.map((asset) => {
      applyBackgroundToComposition(asset)
      return asset
    })
  }
}

export function applyFunctionalLottieBackground(
  source: AnimationObject,
  exerciseId?: string,
): AnimationObject {
  const cloned = JSON.parse(JSON.stringify(source)) as LottieComposition
  applyBackgroundToComposition(cloned)

  const scale =
    exerciseId != null
      ? (EXERCISE_CONTENT_SCALE[exerciseId] ?? FUNCTIONAL_LOTTIE_CONTENT_SCALE)
      : FUNCTIONAL_LOTTIE_CONTENT_SCALE

  fitContentInAllCompositions(cloned, scale)

  return cloned
}
