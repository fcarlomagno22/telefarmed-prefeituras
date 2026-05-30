import {
  AboutPanelBarSectionSkeleton,
  AboutPanelIllustrationSkeleton,
  AboutPanelMiniKpiGridSkeleton,
} from './adminCredenciaisSkeletonUi'

export function AdminCredenciaisInternoAboutPanelSkeleton() {
  return (
    <aside
      className="flex h-full w-full shrink-0 flex-col rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-hidden
    >
      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
        <header className="shrink-0 text-center">
          <h2 className="text-lg font-bold text-gray-900">Acessos internos</h2>
          <p className="mt-1 text-xs text-gray-500">Equipe Telefarmed no painel /admin</p>
        </header>

        <AboutPanelMiniKpiGridSkeleton blockedSpan2 />

        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <AboutPanelBarSectionSkeleton titleWidth="w-14" rows={4} />
          <AboutPanelBarSectionSkeleton titleWidth="w-28" rows={4} />
        </div>

        <AboutPanelIllustrationSkeleton />
      </div>
    </aside>
  )
}
