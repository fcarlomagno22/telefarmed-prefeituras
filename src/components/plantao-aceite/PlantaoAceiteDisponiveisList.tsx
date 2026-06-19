import type { PlantaoAceitePublico } from '../../types/plantaoAceitePublico'
import { formatProfissionalCurrency } from '../../utils/profissional/formatProfissionalCurrency'
import { formatProfissionalEscalaTimeRange } from '../profissional/escala/profissionalEscalaUi'

type PlantaoAceiteDisponiveisListProps = {
  plantoes: PlantaoAceitePublico[]
  checkedSlotIds: string[]
  onToggle: (slotId: string) => void
}

function formatDateLabel(startAt: string): string {
  const date = new Date(startAt)
  const label = date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatValorResumo(plantao: PlantaoAceitePublico): string {
  const { repasseRule, amountCents } = plantao
  switch (repasseRule.modalidade) {
    case 'plantao_fixo':
      return formatProfissionalCurrency(repasseRule.valorPlantaoCentavos || amountCents)
    case 'por_consulta':
      return `${formatProfissionalCurrency(repasseRule.valorConsultaCentavos)} / consulta`
    case 'hibrido':
      return `${formatProfissionalCurrency(repasseRule.valorPlantaoCentavos)} + ${formatProfissionalCurrency(repasseRule.valorConsultaCentavos)} / consulta`
    default:
      return formatProfissionalCurrency(amountCents)
  }
}

export function isPlantaoAceiteSelectable(plantao: PlantaoAceitePublico): boolean {
  return (
    (plantao.status === 'disponivel' && plantao.vacancies > 0) ||
    (plantao.status === 'vagas_esgotadas' && plantao.canApplyAsReserve)
  )
}

function statusLabel(plantao: PlantaoAceitePublico): string {
  if (plantao.status === 'disponivel' && plantao.vacancies > 0) {
    return `${plantao.vacancies} vaga${plantao.vacancies === 1 ? '' : 's'}`
  }
  if (plantao.status === 'vagas_esgotadas' && plantao.canApplyAsReserve) {
    return 'Fila de reserva'
  }
  if (plantao.status === 'expirado') return 'Prazo encerrado'
  return 'Indisponível'
}

export function PlantaoAceiteDisponiveisList({
  plantoes,
  checkedSlotIds,
  onToggle,
}: PlantaoAceiteDisponiveisListProps) {
  return (
    <ul className="list-none">
      {plantoes.map((plantao, index) => {
        const selectable = isPlantaoAceiteSelectable(plantao)
        const checked = checkedSlotIds.includes(plantao.slotId)
        const isReserve =
          plantao.status === 'vagas_esgotadas' && plantao.canApplyAsReserve

        return (
          <li key={plantao.slotId}>
            <label
              className={`flex items-start gap-3 py-4 ${
                selectable ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!selectable}
                onChange={() => onToggle(plantao.slotId)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--brand-primary)] disabled:cursor-not-allowed"
              />

              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">
                      {plantao.specialty}
                    </span>
                    <span className="mt-0.5 block text-sm text-gray-600">
                      {formatDateLabel(plantao.startAt)} ·{' '}
                      {formatProfissionalEscalaTimeRange(plantao.startAt, plantao.endAt)}
                    </span>
                    <span className="mt-0.5 block text-sm font-medium text-[var(--brand-primary)]">
                      {formatValorResumo(plantao)}
                    </span>
                    {isReserve ? (
                      <span className="mt-1 block text-xs text-violet-700">
                        Candidatura na fila de reserva
                      </span>
                    ) : null}
                  </span>

                  <span className="shrink-0 text-right text-[11px] font-medium text-gray-500">
                    {statusLabel(plantao)}
                  </span>
                </span>

                {index < plantoes.length - 1 ? (
                  <span
                    className="mt-4 block border-b border-gray-200"
                    aria-hidden
                  />
                ) : null}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
