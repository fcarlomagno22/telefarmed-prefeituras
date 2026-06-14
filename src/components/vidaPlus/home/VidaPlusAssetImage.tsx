import { useState, type ReactNode } from 'react'

type VidaPlusAssetImageProps = {
  src: string
  alt: string
  className?: string
  fallback: ReactNode
}

/** Imagem de asset com fallback até o arquivo existir em public/. */
export function VidaPlusAssetImage({
  src,
  alt,
  className,
  fallback,
}: VidaPlusAssetImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <>{fallback}</>
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
      decoding="async"
    />
  )
}
