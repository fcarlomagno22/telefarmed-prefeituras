import { User } from 'lucide-react'

type AdminDoctorAvatarProps = {
  avatarUrl?: string | null
  name?: string
  size?: 'sm' | 'md'
  className?: string
  onPhotoClick?: () => void
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
} as const

const iconClasses = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
} as const

export function AdminDoctorAvatar({
  avatarUrl,
  name,
  size = 'sm',
  className = '',
  onPhotoClick,
}: AdminDoctorAvatarProps) {
  const hasAvatar = Boolean(avatarUrl?.trim())

  if (hasAvatar) {
    const image = (
      <img
        src={avatarUrl!}
        alt={name ? `Foto de ${name}` : ''}
        loading="lazy"
        className={`${sizeClasses[size]} shrink-0 rounded-full border border-gray-200 object-cover shadow-sm ${className}`}
      />
    )

    if (onPhotoClick) {
      return (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onPhotoClick()
          }}
          className="shrink-0 rounded-full transition hover:ring-2 hover:ring-[var(--brand-primary)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          aria-label={name ? `Ver foto de ${name}` : 'Ver foto do profissional'}
        >
          {image}
        </button>
      )
    }

    return image
  }

  return (
    <span
      className={`flex ${sizeClasses[size]} shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm ${className}`}
      aria-hidden={!name}
      title={name}
    >
      <User className={iconClasses[size]} strokeWidth={2} />
    </span>
  )
}
