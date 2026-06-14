import { Search, Star } from 'lucide-react'
import { ProfissionalAvaliacaoHeroCard } from './ProfissionalAvaliacaoHeroCard'
import { ProfissionalAvaliacaoTabs } from './ProfissionalAvaliacaoTabs'
import {
  PROFISSIONAL_AVALIACAO_TOUR_DEMO_CRITICAL_REVIEW_ID,
  PROFISSIONAL_AVALIACAO_TOUR_DEMO_REVIEW_ID,
} from '../../../config/profissionalAvaliacaoTour'
import type {
  ProfissionalAvaliacoesFilters,
  ProfissionalAvaliacoesTab,
  ProfissionalPatientReview,
} from '../../../types/profissionalAvaliacoes'
import type { ProfissionalAvaliacoesApiSummary } from '../../../types/profissionalAvaliacoesApi'
import { ProfissionalAvaliacaoReviewCard } from './ProfissionalAvaliacaoReviewCard'
import { profissionalAvaliacoesPanelClass } from './profissionalAvaliacoesUi'

type ProfissionalAvaliacaoMainPanelProps = {
  filters: ProfissionalAvaliacoesFilters
  onFiltersChange: (filters: ProfissionalAvaliacoesFilters) => void
  reviews: ProfissionalPatientReview[]
  summary: ProfissionalAvaliacoesApiSummary | null
  isLoading?: boolean
}

export function ProfissionalAvaliacaoMainPanel({
  filters,
  onFiltersChange,
  reviews,
  summary,
  isLoading = false,
}: ProfissionalAvaliacaoMainPanelProps) {
  const totalReviews = summary?.totalReviews ?? 0
  const criticalTotal = summary?.criticalCount ?? 0
  const averageRating = summary?.averageRating ?? 0
  const fiveStarCount = summary?.fiveStarCount ?? 0
  const fourStarCount = summary?.fourStarCount ?? 0

  function setTab(tab: ProfissionalAvaliacoesTab) {
    onFiltersChange({ ...filters, tab })
  }

  function setSearch(search: string) {
    onFiltersChange({ ...filters, search })
  }

  function resolveReviewTourTarget(review: ProfissionalPatientReview): string | undefined {
    if (review.id === PROFISSIONAL_AVALIACAO_TOUR_DEMO_REVIEW_ID && filters.tab === 'todos') {
      return 'avaliacao-review-card'
    }
    if (
      review.id === PROFISSIONAL_AVALIACAO_TOUR_DEMO_CRITICAL_REVIEW_ID &&
      filters.tab === 'criticos'
    ) {
      return 'avaliacao-critical-review-card'
    }
    return undefined
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <ProfissionalAvaliacaoHeroCard
        averageRating={averageRating}
        totalReviews={totalReviews}
        criticalTotal={criticalTotal}
        fiveStarCount={fiveStarCount}
        fourStarCount={fourStarCount}
      />

      <section className={[profissionalAvaliacoesPanelClass, 'flex min-h-0 flex-1 flex-col'].join(' ')}>
        <div className="shrink-0 px-4 pt-3 sm:px-5 sm:pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <ProfissionalAvaliacaoTabs
              activeTab={filters.tab}
              onTabChange={setTab}
              totalCount={totalReviews}
              criticalCount={criticalTotal}
            />

            <label className="relative block w-full min-w-0 sm:max-w-xs" data-tour="avaliacao-search">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome ou comentário…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50/80 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/15"
              />
            </label>
          </div>
        </div>

        <div
          data-tour="avaliacao-reviews-list"
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-500">
              Carregando avaliações…
            </div>
          ) : reviews.length === 0 ? (
            <EmptyReviewsState tab={filters.tab} hasSearch={filters.search.trim().length > 0} />
          ) : (
            <ul className="space-y-4">
              {reviews.map((review) => (
                <ProfissionalAvaliacaoReviewCard
                  key={review.id}
                  review={review}
                  tourDataTarget={resolveReviewTourTarget(review)}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function EmptyReviewsState({
  tab,
  hasSearch,
}: {
  tab: ProfissionalAvaliacoesTab
  hasSearch: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center">
      <Star className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
      <p className="mt-3 text-sm font-semibold text-gray-700">
        {hasSearch
          ? 'Nenhum comentário encontrado'
          : tab === 'criticos'
            ? 'Nenhuma avaliação crítica no momento'
            : 'Ainda não há comentários'}
      </p>
      <p className="mt-1 max-w-sm text-xs text-gray-500">
        {hasSearch
          ? 'Tente outro termo na busca ou limpe o filtro.'
          : tab === 'criticos'
            ? 'Avaliações com menos de 4 estrelas aparecerão aqui para você acompanhar.'
            : 'Quando pacientes avaliarem seus atendimentos, os comentários serão listados aqui.'}
      </p>
    </div>
  )
}
