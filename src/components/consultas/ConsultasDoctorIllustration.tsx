import { brand } from '../../config/brand'

export function ConsultasDoctorIllustration() {
  const illustrationUrl = brand.dashboardConsultasImageUrl

  if (!illustrationUrl) return null

  return (
    <div className="shrink-0 overflow-hidden bg-gradient-to-b from-orange-50/40 to-white px-4 pt-4">
      <img
        src={illustrationUrl}
        alt=""
        className="mx-auto h-32 w-full max-w-[240px] object-contain object-center"
      />
    </div>
  )
}
