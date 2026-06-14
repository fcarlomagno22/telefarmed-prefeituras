import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileUp,
  IdCard,
  Info,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { BR_UF_OPTIONS } from '../../../config/medicoCadastroLanding'
import {
  createMedicoCadastroMedicalSpecialty,
  getMedicoCadastroConselhoLabel,
  getMedicoCadastroDocumentFields,
  getMedicoCadastroSpecialtyOptions,
  isMedicoCadastroMedicinaFormation,
  MEDICO_CADASTRO_ACCEPTED_DOCUMENT_TYPES,
  MEDICO_CADASTRO_DOCUMENT_MAX_BYTES,
  getMedicoCadastroFormSteps,
  medicoCadastroFormationOptions,
  type MedicoCadastroFormation,
  type MedicoCadastroFormStepId,
} from '../../../config/medicoCadastroForm'
import type {
  MedicoCadastroDocumentUploads,
  MedicoCadastroFormErrors,
  MedicoCadastroFormValues,
  MedicoCadastroMedicalSpecialty,
} from '../../../types/medicoCadastro'
import { maskBirthDate, maskCpf, maskPhone } from '../../../utils/masks'
import {
  hasMedicoCadastroFormErrors,
  validateMedicoCadastroAddressStep,
  validateMedicoCadastroDocumentsStep,
  validateMedicoCadastroPersonalStep,
  validateMedicoCadastroProfessionalStep,
  validateMedicoCadastroSpecialtiesStep,
} from '../../../utils/medicoCadastro/validateMedicoCadastroForm'
import {
  submitProfissionalCadastro,
  isProfissionalCadastroApiError,
  type SubmitProfissionalCadastroProgress,
} from '../../../lib/services/profissional/cadastro'
import { MedicoCadastroSubmitProgress } from './MedicoCadastroSubmitProgress'
import { CustomSelect } from '../../ui/CustomSelect'
import { MedicoCadastroAddressFields } from './MedicoCadastroAddressFields'
import { MedicoCadastroSuccessPanel } from './MedicoCadastroSuccessPanel'
import {
  MedicoCadastroFormField,
  medicoCadastroInputClass,
  medicoCadastroSelectClass,
} from './MedicoCadastroFormField'
import { MedicoCadastroFormStepper } from './MedicoCadastroFormStepper'
import { MedicoCadastroMedicalSpecialtiesFields } from './MedicoCadastroMedicalSpecialtiesFields'

type MedicoCadastroRegistrationFormProps = {
  id?: string
  className?: string
  onSubmitted?: () => void
}

const DOCUMENT_IDS = ['doc-conselho', 'doc-identidade', 'doc-profissional', 'doc-endereco'] as const

const emptyValues = (): MedicoCadastroFormValues => ({
  fullName: '',
  cpf: '',
  birthDate: '',
  formation: '',
  medicalSpecialties: [createMedicoCadastroMedicalSpecialty()],
  crm: '',
  uf: '',
  email: '',
  phone: '',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  professionalDescription: '',
})

const emptyDocuments = (): MedicoCadastroDocumentUploads =>
  Object.fromEntries(DOCUMENT_IDS.map((id) => [id, null]))

export function MedicoCadastroRegistrationForm({
  id = 'cadastro-form',
  className = '',
  onSubmitted,
}: MedicoCadastroRegistrationFormProps) {
  const [step, setStep] = useState<MedicoCadastroFormStepId>('personal')
  const [values, setValues] = useState<MedicoCadastroFormValues>(emptyValues)
  const [documents, setDocuments] = useState<MedicoCadastroDocumentUploads>(emptyDocuments)
  const [errors, setErrors] = useState<MedicoCadastroFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitProgress, setSubmitProgress] = useState<SubmitProfissionalCadastroProgress | null>(
    null,
  )
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const formSteps = useMemo(
    () => getMedicoCadastroFormSteps(values.formation),
    [values.formation],
  )
  const stepIndex = formSteps.findIndex((item) => item.id === step)
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === formSteps.length - 1
  const isMedicina = isMedicoCadastroMedicinaFormation(values.formation)
  const conselhoLabel = values.formation
    ? getMedicoCadastroConselhoLabel(values.formation)
    : 'Conselho'

  const specialtyOptions = useMemo(
    () => getMedicoCadastroSpecialtyOptions(values.formation),
    [values.formation],
  )

  const documentFields = useMemo(
    () =>
      values.formation
        ? getMedicoCadastroDocumentFields(values.formation)
        : getMedicoCadastroDocumentFields('medicina'),
    [values.formation],
  )

  const formationSelectOptions = useMemo(
    () =>
      medicoCadastroFormationOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [],
  )

  const ufSelectOptions = useMemo(
    () => BR_UF_OPTIONS.map((state) => ({ value: state, label: state })),
    [],
  )

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  useEffect(() => {
    if (formSteps.some((item) => item.id === step)) return
    const fallback = formSteps[Math.min(stepIndex, formSteps.length - 1)] ?? formSteps[0]
    if (fallback) setStep(fallback.id)
  }, [formSteps, step, stepIndex])

  function patchFormation(formation: MedicoCadastroFormation | '') {
    setValues((prev) => ({
      ...prev,
      formation,
      medicalSpecialties: isMedicoCadastroMedicinaFormation(formation)
        ? prev.medicalSpecialties.length > 0
          ? prev.medicalSpecialties
          : [createMedicoCadastroMedicalSpecialty()]
        : [],
    }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.formation
      delete next.medicalSpecialties
      return next
    })
  }

  function patchMedicalSpecialties(specialties: MedicoCadastroMedicalSpecialty[]) {
    setValues((prev) => ({ ...prev, medicalSpecialties: specialties }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.medicalSpecialties
      for (const key of Object.keys(next)) {
        if (key.startsWith('medicalSpecialty:')) delete next[key as keyof MedicoCadastroFormErrors]
      }
      return next
    })
  }

  function clearMedicalSpecialtyError(key: `medicalSpecialty:${string}`) {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      delete next.medicalSpecialties
      return next
    })
  }

  function clearFieldErrors(fields: (keyof MedicoCadastroFormValues)[]) {
    setErrors((prev) => {
      const next = { ...prev }
      for (const field of fields) delete next[field]
      return next
    })
  }

  function patchValues<K extends keyof MedicoCadastroFormValues>(
    field: K,
    value: MedicoCadastroFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }))
    clearFieldErrors([field])
  }

  function patchValuesBatch(patch: Partial<MedicoCadastroFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }))
    clearFieldErrors(Object.keys(patch) as (keyof MedicoCadastroFormValues)[])
  }

  function patchDocument(fieldId: string, file: File | null) {
    setDocuments((prev) => ({ ...prev, [fieldId]: file }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`document:${fieldId}`]
      return next
    })
  }

  function handleDocumentChange(fieldId: string, file: File | undefined) {
    if (!file) {
      patchDocument(fieldId, null)
      return
    }

    if (file.size > MEDICO_CADASTRO_DOCUMENT_MAX_BYTES) {
      setErrors((prev) => ({
        ...prev,
        [`document:${fieldId}`]: 'Arquivo muito grande (máx. 8 MB).',
      }))
      return
    }

    patchDocument(fieldId, file)
  }

  function validateCurrentStep() {
    if (step === 'personal') return validateMedicoCadastroPersonalStep(values)
    if (step === 'professional') return validateMedicoCadastroProfessionalStep(values)
    if (step === 'specialties') return validateMedicoCadastroSpecialtiesStep(values)
    if (step === 'address') return validateMedicoCadastroAddressStep(values)
    return validateMedicoCadastroDocumentsStep(documents, values.formation)
  }

  function goNext() {
    const stepErrors = validateCurrentStep()
    setErrors(stepErrors)
    if (hasMedicoCadastroFormErrors(stepErrors)) return

    const next = formSteps[stepIndex + 1]
    if (next) setStep(next.id)
  }

  function goBack() {
    const prev = formSteps[stepIndex - 1]
    if (prev) setStep(prev.id)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const stepErrors = validateMedicoCadastroDocumentsStep(documents, values.formation)
    setErrors(stepErrors)
    if (hasMedicoCadastroFormErrors(stepErrors)) return

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitProgress({ percent: 0, message: 'Preparando seus dados com cuidado...' })
    try {
      await submitProfissionalCadastro({ values, documents }, (progress) => {
        setSubmitProgress(progress)
      })
      setSubmitted(true)
      onSubmitted?.()
    } catch (error) {
      const message = isProfissionalCadastroApiError(error)
        ? error.message
        : 'Não foi possível enviar sua candidatura. Tente novamente.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
      setSubmitProgress(null)
    }
  }

  return (
    <div
      id={id}
      className={[
        'flex max-h-[min(88vh,920px)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.08)]',
        className,
      ].join(' ')}
    >
      {!submitted ? (
        <header className="shrink-0 px-5 pt-5 sm:px-6">
          <h2 className="text-base font-bold leading-snug text-gray-900 sm:text-[17px]">
            Cadastre-se e comece a fazer{' '}
            <span className="text-[var(--brand-primary)]">plantões online</span>
          </h2>
        </header>
      ) : null}

      {!submitted ? <MedicoCadastroFormStepper currentStep={step} steps={formSteps} /> : null}

      <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 no-scrollbar sm:px-6">
        {isSubmitting && submitProgress ? (
          <MedicoCadastroSubmitProgress progress={submitProgress} />
        ) : submitted ? (
          <MedicoCadastroSuccessPanel />
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {step === 'personal' ? (
              <div className="space-y-3">
                <MedicoCadastroFormField
                  label="Nome completo"
                  icon={User}
                  error={errors.fullName}
                >
                  <input
                    className={medicoCadastroInputClass(Boolean(errors.fullName), {
                      withIcon: true,
                    })}
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    value={values.fullName}
                    onChange={(e) => patchValues('fullName', e.target.value)}
                  />
                </MedicoCadastroFormField>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MedicoCadastroFormField label="CPF" icon={IdCard} error={errors.cpf}>
                    <input
                      className={medicoCadastroInputClass(Boolean(errors.cpf), { withIcon: true })}
                      type="text"
                      name="cpf"
                      inputMode="numeric"
                      value={values.cpf}
                      onChange={(e) => patchValues('cpf', maskCpf(e.target.value))}
                    />
                  </MedicoCadastroFormField>

                  <MedicoCadastroFormField
                    label="Data de nascimento"
                    icon={CalendarDays}
                    error={errors.birthDate}
                  >
                    <input
                      className={medicoCadastroInputClass(Boolean(errors.birthDate), {
                        withIcon: true,
                      })}
                      type="text"
                      name="birthDate"
                      placeholder="dd/mm/aaaa"
                      inputMode="numeric"
                      value={values.birthDate}
                      onChange={(e) => patchValues('birthDate', maskBirthDate(e.target.value))}
                    />
                  </MedicoCadastroFormField>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MedicoCadastroFormField label="E-mail" icon={Mail} error={errors.email}>
                    <input
                      className={medicoCadastroInputClass(Boolean(errors.email), {
                        withIcon: true,
                      })}
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={values.email}
                      onChange={(e) => patchValues('email', e.target.value)}
                    />
                  </MedicoCadastroFormField>

                  <MedicoCadastroFormField
                    label="Telefone / WhatsApp"
                    icon={Phone}
                    error={errors.phone}
                  >
                    <input
                      className={medicoCadastroInputClass(Boolean(errors.phone), {
                        withIcon: true,
                      })}
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      value={values.phone}
                      onChange={(e) => patchValues('phone', maskPhone(e.target.value))}
                    />
                  </MedicoCadastroFormField>
                </div>
              </div>
            ) : null}

            {step === 'professional' ? (
              <div className="space-y-3">
                <MedicoCadastroFormField label="Formação" error={errors.formation}>
                  <CustomSelect
                    value={values.formation}
                    onChange={(value) => patchFormation(value as MedicoCadastroFormation | '')}
                    options={formationSelectOptions}
                    placeholder="Selecione"
                    required
                    size="compact"
                    className={medicoCadastroSelectClass(Boolean(errors.formation))}
                  />
                </MedicoCadastroFormField>

                <div className="grid grid-cols-[1fr_88px] gap-3">
                  <MedicoCadastroFormField
                    label={`Nº no conselho (${conselhoLabel})`}
                    icon={IdCard}
                    error={errors.crm}
                  >
                    <input
                      className={medicoCadastroInputClass(Boolean(errors.crm), { withIcon: true })}
                      type="text"
                      name="crm"
                      inputMode="numeric"
                      value={values.crm}
                      onChange={(e) =>
                        patchValues('crm', e.target.value.replace(/\D/g, '').slice(0, 7))
                      }
                    />
                  </MedicoCadastroFormField>

                  <MedicoCadastroFormField label="UF" error={errors.uf}>
                    <CustomSelect
                      value={values.uf}
                      onChange={(value) => patchValues('uf', value)}
                      options={ufSelectOptions}
                      placeholder="UF"
                      required
                      size="compact"
                      menuMinWidthPx={120}
                      className={medicoCadastroSelectClass(Boolean(errors.uf))}
                    />
                  </MedicoCadastroFormField>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-gray-600">
                    Descrição profissional (opcional)
                  </span>
                  <textarea
                    className={`${medicoCadastroInputClass(false)} min-h-[72px] resize-none py-2.5 pl-3`}
                    name="professionalDescription"
                    rows={2}
                    maxLength={500}
                    placeholder="Resumo da sua atuação"
                    value={values.professionalDescription}
                    onChange={(e) =>
                      patchValues('professionalDescription', e.target.value.slice(0, 500))
                    }
                  />
                </label>
              </div>
            ) : null}

            {step === 'specialties' ? (
              <div className="space-y-3">
                <MedicoCadastroMedicalSpecialtiesFields
                  specialties={values.medicalSpecialties}
                  specialtyOptions={specialtyOptions}
                  errors={errors}
                  onChange={patchMedicalSpecialties}
                  onClearError={clearMedicalSpecialtyError}
                />
                {errors.medicalSpecialties ? (
                  <p className="text-[11px] font-medium text-red-600" role="alert">
                    {errors.medicalSpecialties}
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 'address' ? (
              <MedicoCadastroAddressFields
                values={values}
                errors={errors}
                onChange={patchValuesBatch}
                onClearErrors={clearFieldErrors}
              />
            ) : null}

            {step === 'documents' ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/90 px-3 py-2.5 text-xs leading-relaxed text-sky-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <p>
                    PDF ou imagem, até 8 MB. Após aprovação, complete foto, certificado e dados
                    bancários no painel.
                  </p>
                </div>

                <ul className="space-y-3">
                  {documentFields.map((field) => {
                    const file = documents[field.id]
                    const error = errors[`document:${field.id}`]

                    return (
                      <li
                        key={field.id}
                        className={[
                          'rounded-xl border px-3 py-3',
                          error ? 'border-red-200 bg-red-50/40' : 'border-gray-100 bg-gray-50/60',
                        ].join(' ')}
                      >
                        <div className="flex items-start gap-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--brand-primary)] shadow-sm">
                            <FileUp className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-900">{field.label}</p>
                            <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                              {field.hint}
                            </p>
                            {file ? (
                              <p className="mt-1 truncate text-[11px] font-medium text-emerald-700">
                                {file.name}
                              </p>
                            ) : null}
                            {error ? (
                              <p
                                className="mt-1 text-[11px] font-medium text-red-600"
                                role="alert"
                              >
                                {error}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <label className="mt-2 flex cursor-pointer">
                          <input
                            type="file"
                            className="sr-only"
                            accept={MEDICO_CADASTRO_ACCEPTED_DOCUMENT_TYPES}
                            onChange={(e) =>
                              handleDocumentChange(field.id, e.target.files?.[0])
                            }
                          />
                          <span className="inline-flex w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[var(--brand-primary)]/40 hover:text-[var(--brand-primary)]">
                            {file ? 'Trocar arquivo' : 'Selecionar arquivo'}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}

            {submitError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </p>
            ) : null}

            <div className="flex items-center gap-2 pt-2">
              <div className="min-w-0 flex-1">
                {!isFirstStep ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Voltar
                  </button>
                ) : null}
              </div>

              {isLastStep ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)] disabled:opacity-70"
                >
                  {isSubmitting ? 'Enviando…' : 'Enviar para análise'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
                >
                  Continuar
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <p className="flex shrink-0 items-center justify-center gap-1.5 border-t border-gray-100 px-5 py-3 text-center text-[11px] text-gray-400 sm:text-xs">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Seus dados estão protegidos. Não enviamos spam.
      </p>
    </div>
  )
}

export function MedicoCadastroFooterCtaButton({
  className = '',
}: {
  className?: string
}) {
  function scrollToForm() {
    document
      .getElementById('cadastro-form')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <button
      type="button"
      onClick={scrollToForm}
      className={[
        'inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[var(--brand-primary)] shadow-lg transition hover:bg-orange-50',
        className,
      ].join(' ')}
    >
      Quero fazer parte
      <ChevronRight className="h-5 w-5" strokeWidth={2.5} aria-hidden />
    </button>
  )
}
