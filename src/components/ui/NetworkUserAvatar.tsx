import { useState } from 'react'
import type { NetworkUser } from '../../data/networkUsersMock'
import { resolveNetworkUserAvatarUrl } from '../../utils/networkUserAvatar'

type NetworkUserAvatarProps = {
  user: NetworkUser
  size?: 'sm' | 'md'
  className?: string
  rounded?: 'full' | '2xl'
}

const sizeClasses = {
  sm: { box: 'h-10 w-10', text: 'text-xs' },
  md: { box: 'h-16 w-16', text: 'text-lg' },
} as const

export function NetworkUserAvatar({
  user,
  size = 'sm',
  className = '',
  rounded = 'full',
}: NetworkUserAvatarProps) {
  const avatarUrl = resolveNetworkUserAvatarUrl(user)
  const [imageFailed, setImageFailed] = useState(false)
  const showPhoto = Boolean(avatarUrl) && !imageFailed
  const radiusClass = rounded === '2xl' ? 'rounded-2xl' : 'rounded-full'
  const { box, text } = sizeClasses[size]

  if (showPhoto) {
    return (
      <img
        key={avatarUrl}
        src={avatarUrl}
        alt=""
        loading="lazy"
        onError={() => setImageFailed(true)}
        className={`${box} shrink-0 border border-gray-200 object-cover shadow-sm ${radiusClass} ${className}`}
      />
    )
  }

  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center ${radiusClass} font-bold ${text} ${user.avatarClassName} ${rounded === '2xl' ? 'border border-gray-200 shadow-sm' : ''} ${className}`}
    >
      {user.initials}
    </span>
  )
}
