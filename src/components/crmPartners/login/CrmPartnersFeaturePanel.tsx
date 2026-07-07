import { crmPartnersBrand } from '../../../config/crmPartnersRoutes'

export function CrmPartnersFeaturePanel() {
  return (
    <section
      className="relative hidden min-h-screen shrink-0 overflow-hidden lg:block lg:w-[46%] xl:w-[48%] [clip-path:ellipse(95%_100%_at_0%_50%)]"
      aria-label={crmPartnersBrand.name}
    >
      <img
        src={crmPartnersBrand.loginImageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
    </section>
  )
}
