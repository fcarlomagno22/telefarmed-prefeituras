import { useState } from 'react'
import { getParticipantFirstName } from '../../utils/runWalkLiveShareStats'

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

type LiveShareParticipantPhotoProps = {
  name: string
  photoUrl?: string | null
  size?: 'sm' | 'md' | 'map'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-[10px] border-2',
  md: 'h-12 w-12 text-sm border-2',
  map: 'h-11 w-11 text-sm border-[3px]',
} as const

export function LiveShareParticipantPhoto({
  name,
  photoUrl,
  size = 'md',
  className = '',
}: LiveShareParticipantPhotoProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const showPhoto = Boolean(photoUrl?.trim()) && !imageFailed
  const firstName = getParticipantFirstName(name)
  const initials = getInitials(name)

  if (showPhoto) {
    return (
      <img
        src={photoUrl!}
        alt={firstName}
        onError={() => setImageFailed(true)}
        className={`shrink-0 rounded-full border-green-500 object-cover ${sizeClasses[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border-green-500 bg-[#1a1a22] font-bold text-green-300 ${sizeClasses[size]} ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  )
}

export function buildLiveShareMapMarkerHtml(photoUrl: string | null | undefined, name: string): string {
  const safeUrl = photoUrl?.trim().replace(/"/g, '&quot;').replace(/'/g, '&#39;') ?? ''
  const initials = getInitials(name)
  const ringStyle =
    'width:44px;height:44px;border-radius:9999px;border:3px solid #22c55e;box-shadow:0 2px 10px rgba(0,0,0,0.28);overflow:hidden;background:#111118;display:flex;align-items:center;justify-content:center;'

  if (safeUrl) {
    return `<div style="${ringStyle}"><img src="${safeUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>`
  }

  return `<div style="${ringStyle}color:#86efac;font:700 13px/1 system-ui,sans-serif;">${initials}</div>`
}
