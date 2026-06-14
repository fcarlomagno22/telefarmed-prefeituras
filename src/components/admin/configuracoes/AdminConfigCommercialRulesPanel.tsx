import { Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminAuthApiError, verifyAdminAuthorizationPin } from '../../../lib/services/admin/auth'
import type { ConfigCommercialRules } from '../../../types/adminConfiguracoes'
import { maskCurrencyBrl } from '../../../utils/masks'
import {
  buildCommercialRulesPayloadFromDraft,
  commercialRulesAreEqual,
  formatCommercialRulesAvulsoForInput,
  validateCommercialRulesDraft,
} from './adminConfigCommercialRules'
import {
  configInputClass,
  configPanelFooterClass,
  configPanelSectionClass,
} from './adminConfiguracoesUi'
import { AdminConfigCatalogPinModal } from './AdminConfigCatalogPinModal'

type AdminConfigCommercialRulesPanelProps = {
  commercialRules: ConfigCommercialRules
  onSaveCommercialRules: (value: ConfigCommercialRules) => Promise<void>
  getAccessToken?: () => string | null
  onNotify?: (message: string, variant?: 'success' | 'error') => void
}

function ConfigToggleField({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 transition hover:border-gray-300"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{description}</span>
      </span>
    </label>
  )
}

export function AdminConfigCommercialRulesPanel({
  commercialRules,
  onSaveCommercialRules,
  getAccessToken,
  onNotify,
}: AdminConfigCommercialRulesPanelProps) {
  const [draft, setDraft] = useState<ConfigCommercialRules>(commercialRules)
  const [avulsoInput, setAvulsoInput] = useState(() =>
    formatCommercialRulesAvulsoForInput(commercialRules.defaultAvulsoUnitValueBrl),
  )
  const [pinOpen, setPinOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraft(commercialRules)
    setAvulsoInput(formatCommercialRulesAvulsoForInput(commercialRules.defaultAvulsoUnitValueBrl))
  }, [commercialRules])

  const payload = useMemo(
    () => buildCommercialRulesPayloadFromDraft(draft, avulsoInput),
    [avulsoInput, draft],
  )

  const isDirty = useMemo(
    () => !commercialRulesAreEqual(payload, commercialRules),
    [commercialRules, payload],
  )

  const verifyAdminPin = useCallback(
    async (pin: string) => {
      const token = getAccessToken?.()
      if (!token) {
        onNotify?.('Sessão expirada. Faça login novamente.', 'error')
        setPinOpen(false)
        return false
      }

      try {
        await verifyAdminAuthorizationPin(token, pin)
        return true
      } catch (error) {
        if (error instanceof AdminAuthApiError && error.code === 'PIN_NOT_CONFIGURED') {
          onNotify?.(error.message, 'error')
          setPinOpen(false)
        }
        return false
      }
    },
    [getAccessToken, onNotify],
  )

  function handleRequestSave() {
    const validationError = validateCommercialRulesDraft(payload)
    if (validationError) {
      onNotify?.(validationError, 'error')
      return
    }
    setPinOpen(true)
  }

  async function handlePinConfirmed() {
    setPinOpen(false)
    setIsSaving(true)
    try {
      await onSaveCommercialRules(payload)
      onNotify?.('Regras comerciais atualizadas.', 'success')
    } catch {
      // Erros tratados na página
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <section className={`${configPanelSectionClass} shrink-0 border-t border-gray-100 pt-6`}>
        <div>
          <h2 className="text-base font-bold text-gray-900">Regras comerciais padrão</h2>
          <p className="mt-1 text-sm text-gray-500">
            Valores e comportamentos aplicados por padrão ao cadastrar novos contratos de clientes.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ConfigToggleField
            id="config-commercial-allow-exceed"
            label="Permitir exceder pacote por padrão"
            description="Novos contratos podem ultrapassar o pacote contratado, conforme regras de excedente."
            checked={draft.defaultAllowExceedPackage}
            onChange={(checked) =>
              setDraft((current) => ({ ...current, defaultAllowExceedPackage: checked }))
            }
          />
          <ConfigToggleField
            id="config-commercial-require-specialties"
            label="Exigir especialidades autorizadas no contrato"
            description="O contrato deve definir explicitamente quais especialidades estão cobertas."
            checked={draft.requireAuthorizedSpecialtiesOnContract}
            onChange={(checked) =>
              setDraft((current) => ({
                ...current,
                requireAuthorizedSpecialtiesOnContract: checked,
              }))
            }
          />
          <ConfigToggleField
            id="config-commercial-block-consult"
            label="Bloquear consulta quando pacote excedido"
            description="Impede novas consultas quando o pacote mensal já foi consumido."
            checked={draft.blockConsultWhenPackageExceeded}
            onChange={(checked) =>
              setDraft((current) => ({ ...current, blockConsultWhenPackageExceeded: checked }))
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-1">
            <span className="text-xs font-semibold text-gray-700">Valor avulso unitário</span>
            <input
              type="text"
              inputMode="decimal"
              value={avulsoInput}
              onChange={(event) => setAvulsoInput(maskCurrencyBrl(event.target.value))}
              placeholder="R$ 0,00"
              className={`${configInputClass} mt-1.5`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Mínimo de meses de contrato</span>
            <input
              type="number"
              min={1}
              max={120}
              value={draft.minContractMonths}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  minContractMonths: Number(event.target.value) || 0,
                }))
              }
              className={`${configInputClass} mt-1.5`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-gray-700">Implantação padrão (dias)</span>
            <input
              type="number"
              min={1}
              max={365}
              value={draft.defaultImplantationDays}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  defaultImplantationDays: Number(event.target.value) || 0,
                }))
              }
              className={`${configInputClass} mt-1.5`}
            />
          </label>
        </div>

        <div className={configPanelFooterClass}>
          <button
            type="button"
            onClick={handleRequestSave}
            disabled={!isDirty || isSaving}
            className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save className="h-4 w-4" aria-hidden />
            {isSaving ? 'Salvando…' : 'Salvar regras'}
          </button>
        </div>
      </section>

      <AdminConfigCatalogPinModal
        open={pinOpen}
        action="edit"
        itemLabel="regras comerciais padrão"
        entityLabel="regra comercial"
        title="Salvar regras comerciais"
        description="Para atualizar as regras comerciais padrão da plataforma, informe sua senha de autorização de 6 dígitos."
        onClose={() => setPinOpen(false)}
        onSuccess={() => void handlePinConfirmed()}
        verifyPin={verifyAdminPin}
      />
    </>
  )
}
