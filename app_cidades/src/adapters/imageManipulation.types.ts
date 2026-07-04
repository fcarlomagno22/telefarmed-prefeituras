import type { CropRect } from '../utils/imageCrop'
import type { ResolvedImageSource } from './imageSource.types'

export type ManipulatedImage = {
  uri: string
  width: number
  height: number
  /** Web-only: revoke temporary blob URLs created by manipulation. */
  revoke?: () => void
}

export type ResizeByLongEdgeOptions = {
  maxLongEdge: number
  compress: number
}

export type CropAndResizeOptions = {
  outputSize: number
  compress: number
  cropRect: CropRect
}

export type ResizeToFitOptions = {
  maxLongEdge: number
  compress: number
}
