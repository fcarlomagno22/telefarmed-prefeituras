import { brand } from '../../config/brand'

export function AccessCredentialsSidebarIllustration() {
  const illustrationUrl = brand.dashboardCredentialsImageUrl

  if (!illustrationUrl) return null

  return (
    <div className="shrink-0 overflow-hidden bg-white px-3 pt-4 pb-2">
      <img
        src={illustrationUrl}
        alt=""
        aria-hidden
        className="mx-auto h-36 w-full max-w-[280px] object-contain object-top sm:h-40"
      />
    </div>
  )
}
