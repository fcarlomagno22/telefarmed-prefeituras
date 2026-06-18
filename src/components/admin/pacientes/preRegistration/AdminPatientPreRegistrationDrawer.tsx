import { UserPlus, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type {
  AdminMunicipalPatient,
  AdminPatientContractingEntity,
} from '../../../../types/adminPacientes'
import type { PatientLookupResult } from '../../../../types/patientLookup'
import {
  emptyAttendanceSession,
  emptyPatientRegistration,
  inferAgeGroupFromBirthDate,
  normalizePatientRegistration,
  type PatientRegistration,
} from '../../../../types/attendance'
import { AgeGroupSelectionStep } from '../../../dashboard/AgeGroupSelectionStep'
import { CpfLookupStep } from '../../../dashboard/CpfLookupStep'
import { PatientAddressStep } from '../../../dashboard/PatientAddressStep'
import { shouldEnforcePatientMunicipalityTerritory } from '../../../../utils/entidadeTerritoryPolicy'
import { PatientContactsStep } from '../../../dashboard/PatientContactsStep'
import { PatientRegistrationForm } from '../../../dashboard/PatientRegistrationForm'
import { AdminPatientContractingEntityStep } from './AdminPatientContractingEntityStep'
import { AdminPatientExistingRegistrationStep } from './AdminPatientExistingRegistrationStep'
import { AdminPatientPreRegistrationFlowStepper } from './AdminPatientPreRegistrationFlowStepper'
import { AdminPatientPreRegistrationSuccess } from './AdminPatientPreRegistrationSuccess'
import type { AdminPatientPreRegistrationStep } from './adminPatientPreRegistrationTypes'
import {
  adminPatientToRegistration,
  findAdminPatientByCpf,
  registrationToAdminMunicipalPatient,
  registrationToPreCadastroPayload,
  registrationToUpdatePayload,
} from './adminPatientRegistrationMapper'

type AdminPatientPreRegistrationDrawerProps = {
  open: boolean
  closing: boolean
  contractingEntities: AdminPatientContractingEntity[]
  defaultEntityId?: string
  existingPatients: AdminMunicipalPatient[]
  submitting?: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onFinalize?: (
    registration: PatientRegistration,
    entity: AdminPatientContractingEntity,
  ) => Promise<AdminMunicipalPatient>
  onSaveDraft?: (
    registration: PatientRegistration,
    entity: AdminPatientContractingEntity,
  ) => Promise<{ preCadastroId: string }>
  onConcludeDraft?: (preCadastroId: string) => Promise<AdminMunicipalPatient>
  onCancelDraft?: (preCadastroId: string) => Promise<void>
  onCreateDirect?: (
    registration: PatientRegistration,
    entity: AdminPatientContractingEntity,
  ) => Promise<AdminMunicipalPatient>
  onUpdateExisting?: (
    patientId: string,
    registration: PatientRegistration,
  ) => Promise<AdminMunicipalPatient>
  onLookupPatientByCpf?: (
    cpf: string,
    entidadeContratanteId: string,
  ) => Promise<AdminMunicipalPatient | null>
  onCompleted: (patient: AdminMunicipalPatient, isUpdate: boolean) => void
  onDraftSaved?: (preCadastroId: string) => void
}

export function AdminPatientPreRegistrationDrawer({
  open,
  closing,
  contractingEntities,
  defaultEntityId,
  existingPatients,
  submitting = false,
  onClose,
  onTransitionEnd,
  onFinalize,
  onSaveDraft,
  onConcludeDraft,
  onCancelDraft,
  onCreateDirect,
  onUpdateExisting,
  onLookupPatientByCpf,
  onCompleted,
  onDraftSaved,
}: AdminPatientPreRegistrationDrawerProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [draftNotice, setDraftNotice] = useState<string | null>(null)
  const [preCadastroId, setPreCadastroId] = useState<string | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [creatingDirect, setCreatingDirect] = useState(false)
  const [entered, setEntered] = useState(false)
  const [step, setStep] = useState<AdminPatientPreRegistrationStep>('contracting_entity')
  const [registration, setRegistration] = useState(() => emptyPatientRegistration())
  const [session, setSession] = useState(() => emptyAttendanceSession())
  const [isReturningPatient, setIsReturningPatient] = useState(false)
  const [matchedExistingPatient, setMatchedExistingPatient] = useState<AdminMunicipalPatient | null>(
    null,
  )
  const [selectedEntity, setSelectedEntity] = useState<AdminPatientContractingEntity | null>(null)

  const resolveDefaultEntity = useCallback(() => {
    if (!defaultEntityId) return contractingEntities[0] ?? null
    return contractingEntities.find((entity) => entity.id === defaultEntityId) ?? contractingEntities[0] ?? null
  }, [contractingEntities, defaultEntityId])

  const resetFlow = useCallback(() => {
    setStep('contracting_entity')
    setRegistration(emptyPatientRegistration())
    setSession(emptyAttendanceSession())
    setIsReturningPatient(false)
    setMatchedExistingPatient(null)
    setSelectedEntity(resolveDefaultEntity())
    setPreCadastroId(null)
    setDraftNotice(null)
    setSubmitError(null)
  }, [resolveDefaultEntity])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    resetFlow()
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const adminLookupByCpf = useCallback(
    async (cpf: string): Promise<PatientLookupResult> => {
      const existingInList = findAdminPatientByCpf(existingPatients, cpf)
      if (existingInList) {
        return {
          status: 'found',
          patient: adminPatientToRegistration(existingInList),
        }
      }

      if (selectedEntity && onLookupPatientByCpf) {
        const fromApi = await onLookupPatientByCpf(cpf, selectedEntity.id)
        if (fromApi) {
          return {
            status: 'found',
            patient: adminPatientToRegistration(fromApi),
          }
        }
      }

      return { status: 'not_found' }
    },
    [existingPatients, onLookupPatientByCpf, selectedEntity],
  )

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && step !== 'success') void handleCloseRequest()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose, step])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  async function completePreRegistration(nextRegistration: PatientRegistration) {
    if (!selectedEntity) return

    setSubmitError(null)

    try {
      let patient: AdminMunicipalPatient

      if (matchedExistingPatient && onUpdateExisting) {
        patient = await onUpdateExisting(matchedExistingPatient.id, nextRegistration)
      } else if (preCadastroId && onConcludeDraft) {
        patient = await onConcludeDraft(preCadastroId)
      } else if (onFinalize) {
        patient = await onFinalize(nextRegistration, selectedEntity)
      } else {
        patient = registrationToAdminMunicipalPatient(nextRegistration, {
          contractingEntity: selectedEntity,
          existingPatient: matchedExistingPatient,
        })
      }

      onCompleted(patient, matchedExistingPatient !== null)
      setRegistration(nextRegistration)
      setPreCadastroId(null)
      setDraftNotice(null)
      setStep('success')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Não foi possível concluir o pré-cadastro.',
      )
    }
  }

  async function saveDraftPreRegistration(nextRegistration: PatientRegistration) {
    if (!selectedEntity || !onSaveDraft) return

    setSubmitError(null)
    setSavingDraft(true)
    try {
      const result = await onSaveDraft(nextRegistration, selectedEntity)
      setPreCadastroId(result.preCadastroId)
      setDraftNotice('Rascunho salvo. Conclua o pré-cadastro quando estiver pronto.')
      onDraftSaved?.(result.preCadastroId)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Não foi possível salvar o rascunho.',
      )
    } finally {
      setSavingDraft(false)
    }
  }

  async function createDirectRegistration(nextRegistration: PatientRegistration) {
    if (!selectedEntity || !onCreateDirect || isReturningPatient) return

    setSubmitError(null)
    setCreatingDirect(true)
    try {
      const patient = await onCreateDirect(nextRegistration, selectedEntity)
      onCompleted(patient, false)
      setRegistration(nextRegistration)
      setPreCadastroId(null)
      setDraftNotice(null)
      setStep('success')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Não foi possível cadastrar o paciente.',
      )
    } finally {
      setCreatingDirect(false)
    }
  }

  async function handleCloseRequest() {
    if (step === 'success') {
      handleCloseAfterSuccess()
      return
    }

    if (preCadastroId && onCancelDraft) {
      const shouldCancel = window.confirm(
        'Existe um rascunho em andamento. Deseja cancelar o pré-cadastro?',
      )
      if (!shouldCancel) return
      try {
        await onCancelDraft(preCadastroId)
      } catch {
        setSubmitError('Não foi possível cancelar o rascunho.')
        return
      }
    }

    onClose()
  }

  function handleCloseAfterSuccess() {
    onClose()
  }

  function goToExistingRegistrationChoice(
    found: PatientRegistration,
    existingInList: AdminMunicipalPatient | null,
  ) {
    const normalized = normalizePatientRegistration(found)
    setIsReturningPatient(true)
    setMatchedExistingPatient(existingInList)
    setRegistration(normalized)
    setSession((prev) => ({
      ...prev,
      ageGroup: inferAgeGroupFromBirthDate(normalized.birthDate),
    }))
    setStep('existing_registration_choice')
  }

  function startNewPatientRegistration(cpf: string) {
    setIsReturningPatient(false)
    setMatchedExistingPatient(null)
    setRegistration(normalizePatientRegistration({ cpf }))
    setSession((prev) => ({ ...prev, ageGroup: null }))
    setStep('age_group')
  }

  function startEditExistingRegistration() {
    const inferredAgeGroup = inferAgeGroupFromBirthDate(registration.birthDate)
    setSession((prev) => ({ ...prev, ageGroup: inferredAgeGroup }))
    setStep(registration.birthDate ? 'registration' : 'age_group')
  }

  function registrationBackTarget(): AdminPatientPreRegistrationStep {
    return isReturningPatient ? 'existing_registration_choice' : 'age_group'
  }

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        tabIndex={panelVisible ? 0 : -1}
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar pré-cadastro"
        onClick={step === 'success' ? handleCloseAfterSuccess : () => void handleCloseRequest()}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-patient-pre-registration-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/60 to-white px-5 pb-4 pt-4 sm:px-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)]">
              <UserPlus className="h-6 w-6" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="admin-patient-pre-registration-title"
                className="text-lg font-bold text-gray-900 sm:text-xl"
              >
                Pré-cadastro de paciente
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Vincule o paciente a uma entidade contratante e complete o cadastro antes do primeiro
                atendimento.
                {selectedEntity ? (
                  <>
                    {' '}
                    Entidade:{' '}
                    <strong className="font-semibold text-gray-700">
                      {selectedEntity.razaoSocial}
                    </strong>
                  </>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              onClick={step === 'success' ? handleCloseAfterSuccess : () => void handleCloseRequest()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {step !== 'success' ? (
            <div className="mt-4">
              <AdminPatientPreRegistrationFlowStepper step={step} />
            </div>
          ) : null}
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 sm:px-6 sm:py-5">
          {draftNotice ? (
            <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              {draftNotice}
            </div>
          ) : null}

          {submitError ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          {step === 'contracting_entity' && (
            <AdminPatientContractingEntityStep
              entities={contractingEntities}
              selectedId={selectedEntity?.id ?? ''}
              onSelect={setSelectedEntity}
              onBack={() => void handleCloseRequest()}
              onContinue={() => {
                if (!selectedEntity) return
                setStep('cpf_lookup')
              }}
            />
          )}

          {step === 'cpf_lookup' && (
            <CpfLookupStep
              cpf={registration.cpf}
              lookupByCpf={adminLookupByCpf}
              onChangeCpf={(cpf) => setRegistration((prev) => ({ ...prev, cpf }))}
              onFound={(found) => {
                goToExistingRegistrationChoice(
                  found,
                  findAdminPatientByCpf(existingPatients, found.cpf) ?? null,
                )
              }}
              onFoundPendingFirstVisit={(payload) => {
                goToExistingRegistrationChoice(
                  payload.patient,
                  findAdminPatientByCpf(existingPatients, payload.patient.cpf) ?? null,
                )
              }}
              onNotFound={(cpf) => {
                void (async () => {
                  const existingInList = findAdminPatientByCpf(existingPatients, cpf)
                  if (existingInList) {
                    goToExistingRegistrationChoice(
                      adminPatientToRegistration(existingInList),
                      existingInList,
                    )
                    return
                  }

                  if (selectedEntity && onLookupPatientByCpf) {
                    const fromApi = await onLookupPatientByCpf(cpf, selectedEntity.id)
                    if (fromApi) {
                      goToExistingRegistrationChoice(
                        adminPatientToRegistration(fromApi),
                        fromApi,
                      )
                      return
                    }
                  }

                  startNewPatientRegistration(cpf)
                })()
              }}
              onBack={() => setStep('contracting_entity')}
            />
          )}

          {step === 'existing_registration_choice' && (
            <AdminPatientExistingRegistrationStep
              registration={registration}
              existingPatient={matchedExistingPatient}
              onKeepRegistration={onClose}
              onEditRegistration={startEditExistingRegistration}
              onBack={() => setStep('cpf_lookup')}
            />
          )}

          {step === 'age_group' && (
            <AgeGroupSelectionStep
              selected={session.ageGroup}
              onSelect={(group) => setSession((prev) => ({ ...prev, ageGroup: group }))}
              onBack={() =>
                setStep(isReturningPatient ? 'existing_registration_choice' : 'cpf_lookup')
              }
              onContinue={() => {
                if (!session.ageGroup) return
                setStep('registration')
              }}
            />
          )}

          {step === 'registration' && (
            <PatientRegistrationForm
              data={registration}
              ageGroup={session.ageGroup ?? 'adult'}
              cpfLocked
              description={
                isReturningPatient
                  ? 'Atualize os dados cadastrais do paciente. O CPF permanece bloqueado.'
                  : undefined
              }
              onChange={setRegistration}
              onSubmit={() => setStep('contacts')}
              onBack={() => setStep(registrationBackTarget())}
            />
          )}

          {step === 'contacts' && (
            <PatientContactsStep
              data={registration}
              onChange={setRegistration}
              onSubmit={() => setStep('address')}
              onBack={() => setStep('registration')}
            />
          )}

          {step === 'address' && selectedEntity ? (
            <PatientAddressStep
              data={registration}
              onChange={setRegistration}
              onSubmit={() => void completePreRegistration(registration)}
              onBack={() => setStep('contacts')}
              continueLabel="Concluir pré-cadastro"
              extraActions={[
                ...(onSaveDraft
                  ? [
                      {
                        label: 'Salvar rascunho',
                        onClick: () => void saveDraftPreRegistration(registration),
                        loading: savingDraft,
                        disabled: submitting || creatingDirect,
                      },
                    ]
                  : []),
                ...(onCreateDirect && !isReturningPatient
                  ? [
                      {
                        label: 'Cadastro direto (ativo)',
                        onClick: () => void createDirectRegistration(registration),
                        loading: creatingDirect,
                        disabled: submitting || savingDraft,
                      },
                    ]
                  : []),
                ...(preCadastroId && onCancelDraft
                  ? [
                      {
                        label: 'Cancelar rascunho',
                        onClick: () => {
                          void (async () => {
                            try {
                              await onCancelDraft(preCadastroId)
                              setPreCadastroId(null)
                              setDraftNotice(null)
                            } catch (error) {
                              setSubmitError(
                                error instanceof Error
                                  ? error.message
                                  : 'Não foi possível cancelar o rascunho.',
                              )
                            }
                          })()
                        },
                        disabled: submitting || savingDraft || creatingDirect,
                      },
                    ]
                  : []),
              ]}
              requiredTerritory={
                shouldEnforcePatientMunicipalityTerritory(
                  selectedEntity.tipoEntidade,
                  selectedEntity.aceitaPacientesOutrosMunicipios,
                )
                  ? {
                      municipality: selectedEntity.municipality,
                      uf: selectedEntity.uf,
                    }
                  : undefined
              }
              contractAllowsOtherMunicipalities={
                !shouldEnforcePatientMunicipalityTerritory(
                  selectedEntity.tipoEntidade,
                  selectedEntity.aceitaPacientesOutrosMunicipios,
                )
              }
              entidadeTipo={selectedEntity.tipoEntidade}
            />
          ) : null}

          {step === 'success' && selectedEntity ? (
            <AdminPatientPreRegistrationSuccess
              draft={{
                registration,
                ageGroup: session.ageGroup,
                isReturningPatient,
                contractingEntity: selectedEntity,
              }}
              onClose={handleCloseAfterSuccess}
            />
          ) : null}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
