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

  if (safeUrl) {
    return (
      '<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;' +
      'background:#22c55e;border:3px solid #fff;' +
      'box-shadow:0 0 0 4px rgba(34,197,94,0.22),0 4px 12px rgba(0,0,0,0.35);">' +
      `<img src="${safeUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />` +
      '</div>'
    )
  }

  return (
    '<div style="position:relative;width:30px;height:30px;">' +
    '<div style="position:absolute;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;' +
    'border-radius:50%;border:2px solid rgba(34,197,94,0.45);"></div>' +
    '<div style="width:22px;height:22px;border-radius:50%;background:#22c55e;border:3px solid #fff;' +
    'box-shadow:0 0 0 4px rgba(34,197,94,0.22);display:flex;align-items:center;justify-content:center;' +
    'color:#fff;font:800 9px/1 system-ui,sans-serif;">' +
    initials +
    '</div></div>'
  )
}
