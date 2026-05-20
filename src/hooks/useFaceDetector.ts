import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  getOvalGuide,
  isFaceAlignedInOval,
  mirrorFaceBox,
  type FaceBox,
} from '../utils/faceAlignment'

const MEDIAPIPE_VERSION = '0.10.35'
const WASM_CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'

const STABLE_FRAMES_REQUIRED = 8
const FALLBACK_STABLE_FRAMES = 20

type DetectFn = (video: HTMLVideoElement) => Promise<FaceBox | null>

type FaceDetectorBackend = {
  detect: DetectFn
}

let backendPromise: Promise<FaceDetectorBackend | null> | null = null

function boxFromDomRect(rect: DOMRectReadOnly): FaceBox {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

async function createNativeBackend(): Promise<FaceDetectorBackend | null> {
  const FaceDetectorCtor = (
    window as Window & {
      FaceDetector?: new (options?: {
        fastMode?: boolean
        maxDetectedFaces?: number
      }) => { detect: (source: ImageBitmapSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>> }
    }
  ).FaceDetector

  if (!FaceDetectorCtor) return null

  try {
    const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 })
    return {
      detect: async (video) => {
        const faces = await detector.detect(video)
        const face = faces[0]
        return face ? boxFromDomRect(face.boundingBox) : null
      },
    }
  } catch {
    return null
  }
}

async function createMediaPipeBackend(): Promise<FaceDetectorBackend | null> {
  try {
    const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision')
    const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
    const detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
    })

    return {
      detect: async (video) => {
        const result = detector.detectForVideo(video, performance.now())
        const box = result.detections[0]?.boundingBox
        if (!box) return null
        return {
          x: box.originX,
          y: box.originY,
          width: box.width,
          height: box.height,
        }
      },
    }
  } catch {
    return null
  }
}

async function getBackend(): Promise<FaceDetectorBackend | null> {
  if (!backendPromise) {
    backendPromise = (async () => {
      const native = await createNativeBackend()
      if (native) return native
      return createMediaPipeBackend()
    })()
  }
  return backendPromise
}

type UseFaceDetectorOptions = {
  videoRef: RefObject<HTMLVideoElement | null>
  active: boolean
}

export function useFaceDetector({ videoRef, active }: UseFaceDetectorOptions) {
  const [isReady, setIsReady] = useState(false)
  const [isAligned, setIsAligned] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const backendRef = useRef<FaceDetectorBackend | null>(null)
  const stableFramesRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) {
      stableFramesRef.current = 0
      setIsAligned(false)
      setIsReady(false)
      setUseFallback(false)
      return
    }

    let cancelled = false

    getBackend()
      .then((backend) => {
        if (cancelled) return
        if (backend) {
          backendRef.current = backend
          setUseFallback(false)
        } else {
          backendRef.current = null
          setUseFallback(true)
        }
        setIsReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          backendRef.current = null
          setUseFallback(true)
          setIsReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [active])

  useEffect(() => {
    if (!active || !isReady) return

    let cancelled = false

    function tick() {
      if (cancelled) return

      const video = videoRef.current
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const width = video.videoWidth
      const height = video.videoHeight

      if (width > 0 && height > 0) {
        const backend = backendRef.current

        if (!backend || useFallback) {
          stableFramesRef.current += 1
          setIsAligned(stableFramesRef.current >= FALLBACK_STABLE_FRAMES)
        } else {
          void backend
            .detect(video)
            .then((raw) => {
              if (cancelled) return

              const guide = getOvalGuide(width, height)
              let aligned = false

              if (raw) {
                const mirrored = mirrorFaceBox(raw, width)
                aligned = isFaceAlignedInOval(mirrored, guide)
              }

              if (aligned) {
                stableFramesRef.current += 1
              } else {
                stableFramesRef.current = 0
              }

              setIsAligned(stableFramesRef.current >= STABLE_FRAMES_REQUIRED)
            })
            .catch(() => {
              stableFramesRef.current = 0
              setIsAligned(false)
            })
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
      stableFramesRef.current = 0
      setIsAligned(false)
    }
  }, [active, isReady, useFallback, videoRef])

  return { isReady, isAligned, useFallback }
}
