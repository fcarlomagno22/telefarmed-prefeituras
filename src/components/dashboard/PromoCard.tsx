import { brand } from '../../config/brand'

export function PromoCard() {
  const hasImage = brand.dashboardPromoImageUrl.trim() !== ''

  return (
    <aside className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[#ff9a3d] p-6 text-white shadow-[0_8px_24px_rgba(255,107,0,0.25)]">
      <p className="relative z-10 max-w-[220px] text-sm font-medium leading-relaxed">
        {brand.dashboardPromoText}
      </p>

      {hasImage ? (
        <img
          src={brand.dashboardPromoImageUrl}
          alt=""
          className="pointer-events-none absolute -bottom-2 right-0 max-h-40 w-auto object-contain"
        />
      ) : (
        <span
          className="pointer-events-none absolute -bottom-4 -right-4 h-36 w-36 rounded-full bg-white/10"
          aria-hidden
        />
      )}
    </aside>
  )
}
