import { Lock } from 'lucide-react'
import type { EscalaRepasseRule } from '../../../types/adminEscala'
import { useAdminEscalaRepasseRule } from '../../../hooks/useAdminEscalaRepasseRule'
import {
  ESCALA_REPASSE_MODALIDADE_OPTIONS,
  ESCALA_REPASSE_TRATAMENTO_INELEGIVEL_OPTIONS,
  applyRepasseModalidadeChange,
  formatCriteriosPresencaResumo,
  formatRepasseRuleSummary,
  normalizeCriteriosPresenca,
  repasseModalidadeLabel,
  syncRepasseRuleAmounts,
} from '../../../utils/adminEscala/repasseRule'
import { maskCurrencyBrl } from '../../../utils/masks'
import { CustomSelect } from '../../ui/CustomSelect'
import { escalaComposeInputClass } from './adminEscalaComposePremium'

function formatCentsInput(cents: number) {
  if (!cents) return ''
  return maskCurrencyBrl(String(cents))
}

function parseCentsInput(value: string): number {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits ? Number(digits) : 0
}

type AdminEscalaRepasseRuleSectionProps = {
  repasseRule: EscalaRepasseRule
  amountCents: number
  onChange: (next: { repasseRule: EscalaRepasseRule; amountCents?: number }) => void
  readOnly?: boolean
}

function formatCentsDisplay(cents: number) {
  if (!cents) return 'R$ 0,00'
  return maskCurrencyBrl(String(cents))
}

export function AdminEscalaRepasseRuleSection({
  repasseRule,
  amountCents,
  onChange,
  readOnly = false,
}: AdminEscalaRepasseRuleSectionProps) {
  const {
    safeRule,
    validationError,
    summaryLabel,
    isReadOnly,
    readOnlyNotice,
    criteriosResumo,
  } = useAdminEscalaRepasseRule({ repasseRule, amountCents, readOnly })
  const criterios = normalizeCriteriosPresenca(safeRule.criteriosPresenca)
  const selectedHelp =
    ESCALA_REPASSE_MODALIDADE_OPTIONS.find((item) => item.value === safeRule.modalidade)?.help ??
    ''

  const showValorPlantao =
    safeRule.modalidade === 'plantao_fixo' || safeRule.modalidade === 'hibrido'
  const showValorConsulta =
    safeRule.modalidade === 'por_consulta' || safeRule.modalidade === 'hibrido'

  function patchRule(patch: Partial<EscalaRepasseRule>) {
    if (isReadOnly) return
    const merged = syncRepasseRuleAmounts({ ...safeRule, ...patch }, amountCents)
    onChange({
      repasseRule: merged,
      amountCents:
        merged.modalidade === 'por_consulta'
          ? merged.valorConsultaCentavos
          : amountCents > 0
            ? amountCents
            : merged.valorPlantaoCentavos,
    })
  }

  return (
    <div className="space-y-4 rounded-xl border border-orange-100/80 bg-orange-50/30 p-4 ring-1 ring-orange-100/60">
      {isReadOnly ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <p>{readOnlyNotice}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900">Regra de repasse ao profissional</p>
          <p className="mt-0.5 text-xs text-gray-600">
            {readOnly
              ? 'Regra vinculada ao slot publicado — somente leitura.'
              : 'Define como este plantão será auditado e pago no financeiro.'}
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-primary)] ring-1 ring-orange-100">
          {summaryLabel}
        </span>
      </div>

      {validationError && !isReadOnly ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {validationError}
        </p>
      ) : null}

      {isReadOnly ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-orange-100/70 bg-white/80 px-3 py-2.5">
            <dt className="text-[10px] font-semibold uppercase text-gray-500">Modalidade</dt>
            <dd className="mt-1 font-semibold text-gray-900">
              {repasseModalidadeLabel(safeRule.modalidade)}
            </dd>
          </div>
          {showValorPlantao ? (
            <div className="rounded-lg border border-orange-100/70 bg-white/80 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase text-gray-500">
                {safeRule.modalidade === 'hibrido' ? 'Base fixa' : 'Valor plantão'}
              </dt>
              <dd className="mt-1 font-semibold tabular-nums text-gray-900">
                {formatCentsDisplay(
                  safeRule.modalidade === 'hibrido'
                    ? safeRule.valorPlantaoCentavos
                    : amountCents,
                )}
              </dd>
            </div>
          ) : null}
          {showValorConsulta ? (
            <div className="rounded-lg border border-orange-100/70 bg-white/80 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase text-gray-500">Valor consulta</dt>
              <dd className="mt-1 font-semibold tabular-nums text-gray-900">
                {formatCentsDisplay(safeRule.valorConsultaCentavos)}
              </dd>
            </div>
          ) : null}
          {safeRule.modalidade === 'hibrido' ? (
            <div className="rounded-lg border border-orange-100/70 bg-white/80 px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase text-gray-500">Percentual fixo</dt>
              <dd className="mt-1 font-semibold text-gray-900">
                {safeRule.percentualFixoHibrido ?? 0}%
              </dd>
            </div>
          ) : null}
          <div className="rounded-lg border border-orange-100/70 bg-white/80 px-3 py-2.5 sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase text-gray-500">Critérios de presença</dt>
            <dd className="mt-1 text-xs leading-relaxed text-gray-700">{criteriosResumo}</dd>
          </div>
        </dl>
      ) : (
        <>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-800">Modalidade de repasse</p>
        <CustomSelect
          value={safeRule.modalidade}
          onChange={(value) => {
            const nextRule = applyRepasseModalidadeChange(
              value as EscalaRepasseRule['modalidade'],
              safeRule,
              amountCents,
            )
            onChange({
              repasseRule: nextRule,
              amountCents:
                nextRule.modalidade === 'por_consulta'
                  ? nextRule.valorConsultaCentavos
                  : amountCents > 0
                    ? amountCents
                    : nextRule.valorPlantaoCentavos,
            })
          }}
          options={ESCALA_REPASSE_MODALIDADE_OPTIONS.map((item) => ({
            value: item.value,
            label: item.label,
          }))}
        />
        {selectedHelp ? (
          <p className="mt-2 text-xs leading-relaxed text-gray-600">{selectedHelp}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {showValorPlantao ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">
              {safeRule.modalidade === 'hibrido' ? 'Base fixa do plantão' : 'Valor por plantão'}
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={formatCentsInput(
                safeRule.modalidade === 'hibrido'
                  ? safeRule.valorPlantaoCentavos
                  : amountCents,
              )}
              onChange={(e) => {
                const cents = parseCentsInput(e.target.value)
                const nextRule = syncRepasseRuleAmounts(
                  { ...safeRule, valorPlantaoCentavos: cents },
                  cents,
                )
                onChange({ repasseRule: nextRule, amountCents: cents })
              }}
              className={escalaComposeInputClass}
              placeholder="R$ 0,00"
            />
          </div>
        ) : null}

        {showValorConsulta ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">Valor por consulta</p>
            <input
              type="text"
              inputMode="numeric"
              value={formatCentsInput(safeRule.valorConsultaCentavos)}
              onChange={(e) => {
                const cents = parseCentsInput(e.target.value)
                patchRule({ valorConsultaCentavos: cents })
                if (safeRule.modalidade === 'por_consulta') {
                  onChange({
                    repasseRule: syncRepasseRuleAmounts(
                      { ...safeRule, valorConsultaCentavos: cents },
                      cents,
                    ),
                    amountCents: cents,
                  })
                }
              }}
              className={escalaComposeInputClass}
              placeholder="R$ 0,00"
            />
          </div>
        ) : null}

        {safeRule.modalidade === 'hibrido' ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-800">Percentual fixo do híbrido</p>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={99}
                value={safeRule.percentualFixoHibrido ?? 30}
                onChange={(e) =>
                  patchRule({
                    percentualFixoHibrido: Math.min(
                      99,
                      Math.max(1, Number(e.target.value) || 1),
                    ),
                  })
                }
                className={escalaComposeInputClass}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                %
              </span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Ex.: 30% do valor fixo + consultas concluídas no complemento.
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 border-t border-orange-100/80 pt-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">Critérios de presença</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            Pagamento integral do plantão fixo só se cumprir <strong>todos</strong> os critérios abaixo.
            Caso contrário, o sistema não gera conta a pagar cheia automaticamente.
          </p>
        </div>

        <div className="rounded-lg border border-orange-100/70 bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Pagamento integral exige
          </p>
          <ul className="mt-2 space-y-1 text-xs text-gray-600">
            <li>• Permanecer online ≥ {criterios.minPercentualOnline}% do turno</li>
            <li>
              •{' '}
              {criterios.exigeEncerramentoFormal
                ? 'Encerrar o plantão formalmente na agenda'
                : 'Encerramento formal não exigido'}
            </li>
            <li>
              •{' '}
              {criterios.aceitaSemDemandaComprovada && criterios.minConsultasConcluidas > 0
                ? `Atender ≥ ${criterios.minConsultasConcluidas} consultas concluídas ou turno sem demanda comprovada (zero na fila/agenda)`
                : criterios.aceitaSemDemandaComprovada
                  ? 'Turno sem demanda comprovada (zero na fila/agenda)'
                  : `Atender ≥ ${criterios.minConsultasConcluidas} consultas concluídas`}
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-gray-700">Mínimo online no turno</p>
          <div className="relative max-w-[12rem]">
            <input
              type="number"
              min={1}
              max={100}
              value={criterios.minPercentualOnline}
              onChange={(e) =>
                patchRule({
                  criteriosPresenca: {
                    ...criterios,
                    minPercentualOnline: Math.min(
                      100,
                      Math.max(1, Number(e.target.value) || 1),
                    ),
                  },
                })
              }
              className={escalaComposeInputClass}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              %
            </span>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={criterios.exigeEncerramentoFormal}
            onChange={(e) =>
              patchRule({
                criteriosPresenca: {
                  ...criterios,
                  exigeEncerramentoFormal: e.target.checked,
                },
              })
            }
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
          />
          <span className="text-sm text-gray-700">
            Exigir encerramento formal do plantão na agenda
            <span className="mt-0.5 block text-xs text-gray-500">
              O profissional precisa encerrar o turno no portal para ser elegível ao pagamento integral.
            </span>
          </span>
        </label>

        <div>
          <p className="mb-2 text-xs font-semibold text-gray-700">Mínimo de consultas concluídas (≥ N)</p>
          <input
            type="number"
            min={0}
            max={999}
            value={criterios.minConsultasConcluidas}
            onChange={(e) =>
              patchRule({
                criteriosPresenca: {
                  ...criterios,
                  minConsultasConcluidas: Math.max(0, Number(e.target.value) || 0),
                },
              })
            }
            className={`${escalaComposeInputClass} max-w-[12rem]`}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Quantidade mínima de consultas concluídas no turno para liberar pagamento integral.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={criterios.aceitaSemDemandaComprovada}
            onChange={(e) =>
              patchRule({
                criteriosPresenca: {
                  ...criterios,
                  aceitaSemDemandaComprovada: e.target.checked,
                },
              })
            }
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
          />
          <span className="text-sm text-gray-700">
            Aceitar turno sem demanda comprovada (zero na fila/agenda)
            <span className="mt-0.5 block text-xs text-gray-500">
              Alternativa ao mínimo de consultas: se não houve pacientes na fila ou agenda, o critério
              de demanda é considerado atendido.
            </span>
          </span>
        </label>

        <div className="border-t border-orange-100/60 pt-4">
          <p className="mb-2 text-sm font-semibold text-gray-800">Se não cumprir todos os critérios</p>
          <CustomSelect
            value={criterios.tratamentoInelegivel}
            onChange={(value) =>
              patchRule({
                criteriosPresenca: {
                  ...criterios,
                  tratamentoInelegivel: value as typeof criterios.tratamentoInelegivel,
                },
              })
            }
            options={ESCALA_REPASSE_TRATAMENTO_INELEGIVEL_OPTIONS.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />
          <p className="mt-2 text-xs leading-relaxed text-gray-600">
            {
              ESCALA_REPASSE_TRATAMENTO_INELEGIVEL_OPTIONS.find(
                (item) => item.value === criterios.tratamentoInelegivel,
              )?.help
            }
          </p>
        </div>

        <p className="rounded-lg bg-white/80 px-3 py-2 text-xs leading-relaxed text-gray-600 ring-1 ring-orange-100/60">
          {formatCriteriosPresencaResumo(criterios)}
        </p>
      </div>
        </>
      )}
    </div>
  )
}
