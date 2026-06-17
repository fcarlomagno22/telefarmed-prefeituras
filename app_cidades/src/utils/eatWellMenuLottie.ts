import type { AnimationObject } from 'lottie-react-native'
import { isBackgroundSolidLayer } from './functionalLottieBackground'

type LottieComposition = AnimationObject & {
  layers?: Array<{ ty?: number; nm?: string; sc?: string }>
  assets?: LottieComposition[]
}

function stripBackgroundFromComposition(composition: LottieComposition) {
  if (Array.isArray(composition.layers)) {
    composition.layers = composition.layers.filter((layer) => {
      if (layer.ty !== 1) return true
      const name = (layer.nm ?? '').toLowerCase()
      if (/^bg$|^background$|^app background$/.test(name)) return false
      return !isBackgroundSolidLayer(layer)
    })
  }

  if (Array.isArray(composition.assets)) {
    for (const asset of composition.assets) {
      stripBackgroundFromComposition(asset)
    }
  }
}

/** Remove camadas de fundo branco/claro para exibir sobre o drawer escuro. */
export function stripLottieBackground(source: AnimationObject): AnimationObject {
  const cloned = JSON.parse(JSON.stringify(source)) as LottieComposition
  stripBackgroundFromComposition(cloned)
  return cloned
}
