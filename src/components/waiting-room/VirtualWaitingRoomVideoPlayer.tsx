import {
  Maximize2,
  Pause,
  Play,
  Settings,
  Volume2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { brand } from '../../config/brand'

const DEFAULT_DURATION_SECONDS = 105
const FALLBACK_TEST_VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

type VirtualWaitingRoomVideoPlayerProps = {
  posterUrl: string
  /** Preenche o container pai (sem aspect-ratio fixo). */
  fill?: boolean
}

export function VirtualWaitingRoomVideoPlayer({
  posterUrl,
  fill = false,
}: VirtualWaitingRoomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoUrl = brand.waitingRoomVideoUrl.trim() || FALLBACK_TEST_VIDEO_URL
  const hasVideo = videoUrl.trim() !== ''
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentSeconds, setCurrentSeconds] = useState(8)
  const durationSeconds = DEFAULT_DURATION_SECONDS

  useEffect(() => {
    if (!hasVideo) return

    const video = videoRef.current
    if (!video) return

    video.muted = true
    void video.play().catch(() => setIsPlaying(false))
  }, [hasVideo])

  useEffect(() => {
    if (!isPlaying) return

    const interval = window.setInterval(() => {
      setCurrentSeconds((prev) => {
        if (prev >= durationSeconds) return 0
        return prev + 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isPlaying, durationSeconds])

  function togglePlay() {
    if (!hasVideo) return

    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
      return
    }

    void video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }

  const progress = Math.min(100, (currentSeconds / durationSeconds) * 100)

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  return (
    <div
      className={[
        'relative overflow-hidden bg-gray-900',
        fill ? 'h-full min-h-0' : 'rounded-2xl shadow-[0_4px_24px_rgba(15,23,42,0.12)]',
      ].join(' ')}
    >
      <div
        className={[
          'relative w-full',
          fill ? 'h-full min-h-0' : 'aspect-[16/10] sm:aspect-[16/9]',
        ].join(' ')}
      >
        {hasVideo ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster={posterUrl}
            playsInline
            loop
            muted
            aria-label="Vídeo informativo da Telefarmed"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <img
            src={posterUrl}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-4 pt-10">
          <div className="flex items-center gap-3 text-white">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
              aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Play className="h-4 w-4 fill-white" strokeWidth={2} />
              )}
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
              aria-label="Volume"
            >
              <Volume2 className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="text-xs font-medium tabular-nums">
              {formatTime(currentSeconds)} / {formatTime(durationSeconds)}
            </span>
            <div className="relative mx-1 hidden h-1.5 min-w-0 flex-1 rounded-full bg-white/25 sm:block">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--brand-primary)]"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow"
                style={{ left: `calc(${progress}% - 7px)` }}
              />
            </div>
            <button
              type="button"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
              aria-label="Configurações"
            >
              <Settings className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
              aria-label="Tela cheia"
            >
              <Maximize2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
