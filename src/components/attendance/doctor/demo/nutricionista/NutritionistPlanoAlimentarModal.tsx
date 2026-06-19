import { useEffect, useMemo, useState } from 'react'
import { Apple, ChevronDown, Plus, Trash2 } from 'lucide-react'
import {
  FormSection,
  PsychologistDocumentModalShell,
  TextAreaField,
  TextInputField,
  type PsychologistPatientInfo,
  type PsychologistProfessionalInfo,
} from '../psicologo/PsychologistDocumentModalShell'
import {
  formatPlanoAlimentarRefeicoesText,
  PLANO_ALIMENTAR_MEAL_TYPES,
  type PlanoAlimentarMeal,
  type PlanoAlimentarMealTypeId,
} from '../../../../../utils/clinicalDocuments/planoAlimentarRefeicoes'

type MealFoodDraft = {
  id: string
  alimento: string
  quantidade: string
}

type MealDraft = {
  tipo: PlanoAlimentarMealTypeId
  label: string
  items: MealFoodDraft[]
}

export type NutritionistPlanoAlimentarSignedPayload = {
  objetivo: string
  restricoesAlimentares?: string
  refeicoes: PlanoAlimentarMeal[]
  planoRefeicoes: string
  orientacoesGerais?: string
  duracaoPlano?: string
  observacoes?: string
}

type NutritionistPlanoAlimentarModalProps = {
  open: boolean
  onClose: () => void
  onSigned?: (payload: NutritionistPlanoAlimentarSignedPayload) => void | Promise<void>
  patient: PsychologistPatientInfo
  professional: PsychologistProfessionalInfo
}

function createEmptyFoodItem(): MealFoodDraft {
  return {
    id: crypto.randomUUID(),
    alimento: '',
    quantidade: '',
  }
}

function createInitialMeals(): MealDraft[] {
  return PLANO_ALIMENTAR_MEAL_TYPES.map((meal) => ({
    tipo: meal.id,
    label: meal.label,
    items: [createEmptyFoodItem()],
  }))
}

function countFilledItems(meal: MealDraft): number {
  return meal.items.filter((item) => item.alimento.trim() && item.quantidade.trim()).length
}

export function NutritionistPlanoAlimentarModal({
  open,
  onClose,
  onSigned,
  patient,
  professional,
}: NutritionistPlanoAlimentarModalProps) {
  const [objetivo, setObjetivo] = useState('')
  const [restricoesAlimentares, setRestricoesAlimentares] = useState('')
  const [meals, setMeals] = useState<MealDraft[]>(createInitialMeals)
  const [expandedMealId, setExpandedMealId] = useState<PlanoAlimentarMealTypeId>('cafe_manha')
  const [orientacoesGerais, setOrientacoesGerais] = useState('')
  const [duracaoPlano, setDuracaoPlano] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [signing, setSigning] = useState(false)
  const [validationHint, setValidationHint] = useState<string | null>(null)

  const filledMealsCount = useMemo(
    () => meals.filter((meal) => countFilledItems(meal) > 0).length,
    [meals],
  )

  useEffect(() => {
    if (!open) return
    setObjetivo('')
    setRestricoesAlimentares('')
    setMeals(createInitialMeals())
    setExpandedMealId('cafe_manha')
    setOrientacoesGerais('')
    setDuracaoPlano('')
    setObservacoes('')
    setValidationHint(null)
    setSigning(false)
  }, [open])

  function updateMealItems(
    mealId: PlanoAlimentarMealTypeId,
    updater: (items: MealFoodDraft[]) => MealFoodDraft[],
  ) {
    setMeals((current) =>
      current.map((meal) =>
        meal.tipo === mealId ? { ...meal, items: updater(meal.items) } : meal,
      ),
    )
  }

  function openMeal(mealId: PlanoAlimentarMealTypeId) {
    setExpandedMealId(mealId)
  }

  function concludeMealAndOpenNext(mealId: PlanoAlimentarMealTypeId) {
    const currentIndex = PLANO_ALIMENTAR_MEAL_TYPES.findIndex((meal) => meal.id === mealId)
    const nextMeal = PLANO_ALIMENTAR_MEAL_TYPES[currentIndex + 1]
    if (nextMeal) {
      setExpandedMealId(nextMeal.id)
      return
    }
    setExpandedMealId(mealId)
  }

  function buildSignedRefeicoes(): PlanoAlimentarMeal[] {
    return meals
      .map((meal) => ({
        tipo: meal.tipo,
        label: meal.label,
        itens: meal.items
          .filter((item) => item.alimento.trim() && item.quantidade.trim())
          .map((item) => ({
            alimento: item.alimento.trim(),
            quantidade: item.quantidade.trim(),
          })),
      }))
      .filter((meal) => meal.itens.length > 0)
  }

  async function handleSign() {
    if (!objetivo.trim()) {
      setValidationHint('Informe o objetivo do plano alimentar.')
      return
    }

    const refeicoes = buildSignedRefeicoes()
    if (refeicoes.length === 0) {
      setValidationHint('Preencha ao menos uma refeição com alimento e quantidade.')
      return
    }

    setSigning(true)
    setValidationHint(null)
    try {
      await onSigned?.({
        objetivo: objetivo.trim(),
        restricoesAlimentares: restricoesAlimentares.trim() || undefined,
        refeicoes,
        planoRefeicoes: formatPlanoAlimentarRefeicoesText(refeicoes),
        orientacoesGerais: orientacoesGerais.trim() || undefined,
        duracaoPlano: duracaoPlano.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      })
      onClose()
    } catch {
      setValidationHint('Não foi possível emitir o plano alimentar.')
    } finally {
      setSigning(false)
    }
  }

  return (
    <PsychologistDocumentModalShell
      open={open}
      title="Plano alimentar"
      subtitle="Monte cada refeição com alimentos e quantidades"
      icon={Apple}
      accent="lime"
      hint="Abra uma refeição, preencha os alimentos e use “Concluir refeição” para seguir para a próxima."
      onClose={onClose}
      onSign={handleSign}
      signing={signing}
      validationHint={validationHint}
      patient={patient}
      professional={professional}
    >
      <FormSection title="Objetivo" accent="lime">
        <TextAreaField
          label="Objetivo do plano"
          value={objetivo}
          onChange={setObjetivo}
          required
          accent="lime"
          placeholder="Ex.: controle glicêmico, redução de peso, reeducação alimentar"
        />
        <TextAreaField
          label="Restrições alimentares (opcional)"
          value={restricoesAlimentares}
          onChange={setRestricoesAlimentares}
          rows={2}
          accent="lime"
        />
      </FormSection>

      <FormSection title="Refeições do plano" accent="lime">
        <p className="text-xs text-gray-500">
          {filledMealsCount === 0
            ? 'Nenhuma refeição preenchida ainda.'
            : `${filledMealsCount} refeição(ões) preenchida(s).`}
        </p>

        <div className="space-y-2.5">
          {meals.map((meal) => {
            const expanded = expandedMealId === meal.tipo
            const filledCount = countFilledItems(meal)

            return (
              <div
                key={meal.tipo}
                className={[
                  'overflow-hidden rounded-xl border transition',
                  expanded ? 'border-lime-300 bg-lime-50/40' : 'border-gray-200 bg-white',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => openMeal(meal.tipo)}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{meal.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {filledCount > 0
                        ? `${filledCount} alimento(s) informado(s)`
                        : 'Toque para montar esta refeição'}
                    </p>
                  </div>
                  <ChevronDown
                    className={[
                      'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
                      expanded ? 'rotate-180' : '',
                    ].join(' ')}
                  />
                </button>

                {expanded ? (
                  <div className="space-y-3 border-t border-lime-100 px-3.5 py-3.5">
                    {meal.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-gray-200 bg-white p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Alimento {index + 1}
                          </span>
                          {meal.items.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                updateMealItems(meal.tipo, (items) =>
                                  items.filter((entry) => entry.id !== item.id),
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remover
                            </button>
                          ) : null}
                        </div>
                        <TextInputField
                          label="Alimento"
                          value={item.alimento}
                          onChange={(value) =>
                            updateMealItems(meal.tipo, (items) =>
                              items.map((entry) =>
                                entry.id === item.id ? { ...entry, alimento: value } : entry,
                              ),
                            )
                          }
                          accent="lime"
                          placeholder="Ex.: pão integral, ovo cozido, iogurte natural"
                        />
                        <TextInputField
                          label="Quantidade"
                          value={item.quantidade}
                          onChange={(value) =>
                            updateMealItems(meal.tipo, (items) =>
                              items.map((entry) =>
                                entry.id === item.id ? { ...entry, quantidade: value } : entry,
                              ),
                            )
                          }
                          accent="lime"
                          placeholder="Ex.: 2 fatias, 1 unidade, 150 g"
                        />
                      </div>
                    ))}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateMealItems(meal.tipo, (items) => [...items, createEmptyFoodItem()])
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm font-medium text-lime-800 hover:bg-lime-100"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar alimento
                      </button>
                      <button
                        type="button"
                        onClick={() => concludeMealAndOpenNext(meal.tipo)}
                        className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Concluir refeição
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </FormSection>

      <FormSection title="Orientações finais" accent="lime">
        <TextAreaField
          label="Orientações gerais (opcional)"
          value={orientacoesGerais}
          onChange={setOrientacoesGerais}
          rows={2}
          accent="lime"
        />
        <TextInputField
          label="Duração prevista (opcional)"
          value={duracaoPlano}
          onChange={setDuracaoPlano}
          accent="lime"
          placeholder="Ex.: 30 dias, com reavaliação"
        />
        <TextAreaField
          label="Observações (opcional)"
          value={observacoes}
          onChange={setObservacoes}
          rows={2}
          accent="lime"
        />
      </FormSection>
    </PsychologistDocumentModalShell>
  )
}
