import { useCallback, useEffect, useState } from 'react'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminConfigClinicoPanel } from '../components/admin/configuracoes/AdminConfigClinicoPanel'
import { AdminConfigConsultaPanel } from '../components/admin/configuracoes/AdminConfigConsultaPanel'
import { AdminConfigContratosPanel } from '../components/admin/configuracoes/AdminConfigContratosPanel'
import { AdminConfigLegalPanel } from '../components/admin/configuracoes/AdminConfigLegalPanel'
import { AdminConfiguracoesTabs } from '../components/admin/configuracoes/AdminConfiguracoesTabs'
import { AdminConfiguracoesPageContentSkeleton } from '../components/admin/configuracoes/skeletons/AdminConfiguracoesPageContentSkeleton'
import { configPanelShellClass } from '../components/admin/configuracoes/adminConfiguracoesUi'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { adminConfiguracoesInitial } from '../data/adminConfiguracoesInitial'
import {
  createContractType,
  createExamCategory,
  createExamItem,
  createLegalDocument,
  deleteContractType,
  deleteExamCategory,
  deleteExamItem,
  deleteLegalDocument,
  fetchClinicoCatalog,
  fetchConsultaCatalog,
  fetchContratosCatalog,
  fetchLegalCatalog,
  AdminConfiguracoesApiError,
  isConfiguracoesApiError,
  saveClinicoCatalog,
  setContractTypeStatus,
  setExamCategoryStatus,
  setExamItemStatus,
  setLegalDocumentPublished,
  updateContractType,
  updateExamCategory,
  updateExamItem,
  updateLegalDocument,
} from '../lib/api/adminConfiguracoesApi'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'
import type {
  AdminConfiguracoesState,
  AdminConfiguracoesTab,
  ConfigContractType,
  ConfigExamCategory,
  ConfigExamItem,
  ConfigLegalDocument,
  ConfigProfession,
  ConfigSpecialty,
} from '../types/adminConfiguracoes'

function mapContractTypeFromApi(row: ConfigContractType & { sortOrder?: number }): ConfigContractType {
  return {
    id: row.id,
    label: row.label,
    description: row.description,
    active: row.active,
  }
}

export function AdminConfiguracoesPage() {
  const isLoading = usePageSkeletonLoading(800)
  const [activeTab, setActiveTab] = useState<AdminConfiguracoesTab>('clinico')
  const [config, setConfig] = useState<AdminConfiguracoesState>(() => ({
    ...adminConfiguracoesInitial,
    legalDocuments: [],
  }))
  const [isLoadingClinico, setIsLoadingClinico] = useState(true)
  const [isLoadingContratos, setIsLoadingContratos] = useState(true)
  const [isLoadingConsulta, setIsLoadingConsulta] = useState(true)
  const [isLoadingLegal, setIsLoadingLegal] = useState(true)
  const { getAccessToken } = useAdminAuth()
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(
    null,
  )

  const patchConfig = useCallback((patch: Partial<AdminConfiguracoesState>) => {
    setConfig((current) => ({ ...current, ...patch }))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadClinicoCatalog() {
      try {
        const catalog = await fetchClinicoCatalog()
        if (!cancelled) {
          patchConfig({
            professions: catalog.professions,
            specialties: catalog.specialties,
          })
        }
      } catch (error) {
        if (!cancelled) {
          const message = isConfiguracoesApiError(error)
            ? error.message
            : 'Não foi possível carregar o catálogo clínico.'
          setToast({ message, variant: 'error' })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingClinico(false)
        }
      }
    }

    void loadClinicoCatalog()

    return () => {
      cancelled = true
    }
  }, [patchConfig])

  useEffect(() => {
    let cancelled = false

    async function loadContratosCatalog() {
      try {
        const catalog = await fetchContratosCatalog()
        if (!cancelled) {
          patchConfig({
            contractTypes: catalog.contractTypes.map(mapContractTypeFromApi),
          })
        }
      } catch (error) {
        if (!cancelled) {
          const message = isConfiguracoesApiError(error)
            ? error.message
            : 'Não foi possível carregar os tipos de contrato.'
          setToast({ message, variant: 'error' })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingContratos(false)
        }
      }
    }

    void loadContratosCatalog()

    return () => {
      cancelled = true
    }
  }, [patchConfig])

  useEffect(() => {
    let cancelled = false

    async function loadConsultaCatalog() {
      try {
        const catalog = await fetchConsultaCatalog()
        if (!cancelled) {
          patchConfig({
            examCategories: catalog.examCategories,
            examItems: catalog.examItems,
          })
        }
      } catch (error) {
        if (!cancelled) {
          const message = isConfiguracoesApiError(error)
            ? error.message
            : 'Não foi possível carregar o catálogo de exames.'
          setToast({ message, variant: 'error' })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingConsulta(false)
        }
      }
    }

    void loadConsultaCatalog()

    return () => {
      cancelled = true
    }
  }, [patchConfig])

  useEffect(() => {
    let cancelled = false

    async function loadLegalCatalog() {
      try {
        const catalog = await fetchLegalCatalog()
        if (!cancelled) {
          patchConfig({
            legalDocuments: catalog.documents,
          })
        }
      } catch (error) {
        if (!cancelled) {
          const message = isConfiguracoesApiError(error)
            ? error.message
            : 'Não foi possível carregar os documentos legais.'
          setToast({ message, variant: 'error' })
        }
      } finally {
        if (!cancelled) {
          setIsLoadingLegal(false)
        }
      }
    }

    void loadLegalCatalog()

    return () => {
      cancelled = true
    }
  }, [patchConfig])

  const requireAccessToken = useCallback(() => {
    const token = getAccessToken()
    if (!token) {
      setToast({ message: 'Sessão expirada. Faça login novamente.', variant: 'error' })
      return null
    }
    return token
  }, [getAccessToken])

  const requireAccessTokenOrThrow = useCallback(() => {
    const token = requireAccessToken()
    if (!token) {
      throw new AdminConfiguracoesApiError(
        'Sessão expirada. Faça login novamente.',
        401,
        'UNAUTHORIZED',
      )
    }
    return token
  }, [requireAccessToken])

  const handleConfigApiError = useCallback((error: unknown, fallbackMessage: string) => {
    const message = isConfiguracoesApiError(error) ? error.message : fallbackMessage
    setToast({ message, variant: 'error' })
    throw error
  }, [])

  const persistClinicoCatalog = useCallback(
    async (professions: ConfigProfession[], specialties: ConfigSpecialty[]) => {
      const token = requireAccessToken()
      if (!token) return

      const saved = await saveClinicoCatalog(token, {
        professions: professions.map(({ specialtyIds: _specialtyIds, ...profession }) => profession),
        specialties,
      })

      patchConfig({
        professions: saved.professions,
        specialties: saved.specialties,
      })
    },
    [patchConfig, requireAccessToken],
  )

  const handleCreateProfession = useCallback(
    async (value: ConfigProfession) => {
      try {
        await persistClinicoCatalog([...config.professions, value], config.specialties)
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível criar a profissão.')
      }
    },
    [config.professions, config.specialties, handleConfigApiError, persistClinicoCatalog],
  )

  const handleUpdateProfession = useCallback(
    async (value: ConfigProfession) => {
      try {
        await persistClinicoCatalog(
          config.professions.map((row) => (row.id === value.id ? value : row)),
          config.specialties,
        )
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível atualizar a profissão.')
      }
    },
    [config.professions, config.specialties, handleConfigApiError, persistClinicoCatalog],
  )

  const handleDeleteProfession = useCallback(
    async (id: string) => {
      try {
        await persistClinicoCatalog(
          config.professions.filter((row) => row.id !== id),
          config.specialties.map((specialty) => ({
            ...specialty,
            professionIds: specialty.professionIds.filter((professionId) => professionId !== id),
          })),
        )
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível excluir a profissão.')
      }
    },
    [config.professions, config.specialties, handleConfigApiError, persistClinicoCatalog],
  )

  const handleSetProfessionStatus = useCallback(
    async (id: string, active: boolean) => {
      try {
        await persistClinicoCatalog(
          config.professions.map((row) => (row.id === id ? { ...row, active } : row)),
          config.specialties,
        )
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível alterar o status da profissão.')
      }
    },
    [config.professions, config.specialties, handleConfigApiError, persistClinicoCatalog],
  )

  const handleCreateSpecialty = useCallback(
    async (value: ConfigSpecialty) => {
      try {
        await persistClinicoCatalog(config.professions, [...config.specialties, value])
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível criar a especialidade.')
      }
    },
    [config.professions, config.specialties, handleConfigApiError, persistClinicoCatalog],
  )

  const handleUpdateSpecialty = useCallback(
    async (value: ConfigSpecialty) => {
      try {
        await persistClinicoCatalog(
          config.professions,
          config.specialties.map((row) => (row.id === value.id ? value : row)),
        )
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível atualizar a especialidade.')
      }
    },
    [config.professions, config.specialties, handleConfigApiError, persistClinicoCatalog],
  )

  const handleDeleteSpecialty = useCallback(
    async (id: string) => {
      try {
        await persistClinicoCatalog(
          config.professions.map((profession) => ({
            ...profession,
            specialtyIds: profession.specialtyIds.filter((specialtyId) => specialtyId !== id),
          })),
          config.specialties.filter((row) => row.id !== id),
        )
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível excluir a especialidade.')
      }
    },
    [config.professions, config.specialties, handleConfigApiError, persistClinicoCatalog],
  )

  const handleSetSpecialtyStatus = useCallback(
    async (id: string, active: boolean) => {
      try {
        await persistClinicoCatalog(
          config.professions,
          config.specialties.map((row) => (row.id === id ? { ...row, active } : row)),
        )
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível alterar o status da especialidade.')
      }
    },
    [config.professions, config.specialties, handleConfigApiError, persistClinicoCatalog],
  )

  const handleCreateContractType = useCallback(
    async (value: ConfigContractType) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        const created = await createContractType(token, {
          id: value.id,
          label: value.label,
          description: value.description,
          active: value.active,
        })
        patchConfig({
          contractTypes: [...config.contractTypes, mapContractTypeFromApi(created)],
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível criar o tipo de contrato.')
      }
    },
    [config.contractTypes, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleUpdateContractType = useCallback(
    async (value: ConfigContractType) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        const updated = await updateContractType(token, value.id, {
          label: value.label,
          description: value.description,
        })
        patchConfig({
          contractTypes: config.contractTypes.map((row) =>
            row.id === value.id ? mapContractTypeFromApi(updated) : row,
          ),
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível atualizar o tipo de contrato.')
      }
    },
    [config.contractTypes, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleDeleteContractType = useCallback(
    async (id: string) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        await deleteContractType(token, id)
        patchConfig({
          contractTypes: config.contractTypes.filter((row) => row.id !== id),
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível excluir o tipo de contrato.')
      }
    },
    [config.contractTypes, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleSetContractTypeStatus = useCallback(
    async (id: string, active: boolean) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        const updated = await setContractTypeStatus(token, id, active)
        patchConfig({
          contractTypes: config.contractTypes.map((row) =>
            row.id === id ? mapContractTypeFromApi(updated) : row,
          ),
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível alterar o status do tipo de contrato.')
      }
    },
    [config.contractTypes, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleCreateExamCategory = useCallback(
    async (value: ConfigExamCategory) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        const created = await createExamCategory(token, {
          id: value.id,
          name: value.name,
          active: value.active,
        })
        patchConfig({
          examCategories: [...config.examCategories, created],
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível criar a categoria.')
      }
    },
    [config.examCategories, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleUpdateExamCategory = useCallback(
    async (value: ConfigExamCategory) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        const updated = await updateExamCategory(token, value.id, { name: value.name })
        patchConfig({
          examCategories: config.examCategories.map((row) =>
            row.id === value.id ? updated : row,
          ),
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível atualizar a categoria.')
      }
    },
    [config.examCategories, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleDeleteExamCategory = useCallback(
    async (id: string) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        await deleteExamCategory(token, id)
        patchConfig({
          examCategories: config.examCategories.filter((row) => row.id !== id),
          examItems: config.examItems.filter((row) => row.categoryId !== id),
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível excluir a categoria.')
      }
    },
    [config.examCategories, config.examItems, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleSetExamCategoryStatus = useCallback(
    async (id: string, active: boolean) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        const updated = await setExamCategoryStatus(token, id, active)
        patchConfig({
          examCategories: config.examCategories.map((row) =>
            row.id === id ? updated : row,
          ),
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível alterar o status da categoria.')
      }
    },
    [config.examCategories, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleCreateExamItem = useCallback(
    async (value: ConfigExamItem) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        const created = await createExamItem(token, {
          id: value.id,
          name: value.name,
          categoryId: value.categoryId,
          active: value.active,
        })
        patchConfig({
          examItems: [...config.examItems, created],
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível criar o exame.')
      }
    },
    [config.examItems, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleUpdateExamItem = useCallback(
    async (value: ConfigExamItem) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        const updated = await updateExamItem(token, value.id, {
          name: value.name,
          categoryId: value.categoryId,
        })
        patchConfig({
          examItems: config.examItems.map((row) => (row.id === value.id ? updated : row)),
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível atualizar o exame.')
      }
    },
    [config.examItems, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleDeleteExamItem = useCallback(
    async (id: string) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        await deleteExamItem(token, id)
        patchConfig({
          examItems: config.examItems.filter((row) => row.id !== id),
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível excluir o exame.')
      }
    },
    [config.examItems, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleSetExamItemStatus = useCallback(
    async (id: string, active: boolean) => {
      const token = requireAccessToken()
      if (!token) return

      try {
        const updated = await setExamItemStatus(token, id, active)
        patchConfig({
          examItems: config.examItems.map((row) => (row.id === id ? updated : row)),
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível alterar o status do exame.')
      }
    },
    [config.examItems, handleConfigApiError, patchConfig, requireAccessToken],
  )

  const handleCreateLegalDocument = useCallback(
    async (value: ConfigLegalDocument) => {
      const token = requireAccessTokenOrThrow()

      try {
        const created = await createLegalDocument(token, {
          id: value.id,
          title: value.title,
          content: value.content,
          version: value.version,
          updatedAtLabel: value.updatedAtLabel,
          published: value.published,
          portals: value.portals,
        })
        setConfig((current) => {
          const exists = current.legalDocuments.some((row) => row.id === created.id)
          return {
            ...current,
            legalDocuments: exists
              ? current.legalDocuments.map((row) => (row.id === created.id ? created : row))
              : [...current.legalDocuments, created],
          }
        })
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível criar o documento.')
      }
    },
    [handleConfigApiError, requireAccessTokenOrThrow],
  )

  const handleSaveLegalDocument = useCallback(
    async (value: ConfigLegalDocument) => {
      const token = requireAccessTokenOrThrow()

      try {
        const updated = await updateLegalDocument(token, value.id, {
          title: value.title,
          content: value.content,
          version: value.version,
          updatedAtLabel: value.updatedAtLabel,
          portals: value.portals,
        })
        setConfig((current) => ({
          ...current,
          legalDocuments: current.legalDocuments.map((row) =>
            row.id === value.id ? updated : row,
          ),
        }))
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível salvar o documento.')
      }
    },
    [handleConfigApiError, requireAccessTokenOrThrow],
  )

  const handlePublishLegalDocument = useCallback(
    async (id: string) => {
      const token = requireAccessTokenOrThrow()

      try {
        const updated = await setLegalDocumentPublished(token, id, true)
        setConfig((current) => ({
          ...current,
          legalDocuments: current.legalDocuments.map((row) =>
            row.id === id ? updated : row,
          ),
        }))
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível publicar o documento.')
      }
    },
    [handleConfigApiError, requireAccessTokenOrThrow],
  )

  const handleDeleteLegalDocument = useCallback(
    async (id: string) => {
      const token = requireAccessTokenOrThrow()

      try {
        await deleteLegalDocument(token, id)
        setConfig((current) => ({
          ...current,
          legalDocuments: current.legalDocuments.filter((row) => row.id !== id),
        }))
      } catch (error) {
        handleConfigApiError(error, 'Não foi possível excluir o documento.')
      }
    },
    [handleConfigApiError, requireAccessTokenOrThrow],
  )

  const patchLegalDocuments = useCallback(
    (legalDocuments: ConfigLegalDocument[]) => {
      patchConfig({ legalDocuments })
    },
    [patchConfig],
  )

  const showPanelSkeleton =
    isLoading ||
    (activeTab === 'clinico' && isLoadingClinico) ||
    (activeTab === 'contratos' && isLoadingContratos) ||
    (activeTab === 'consulta' && isLoadingConsulta) ||
    (activeTab === 'legal' && isLoadingLegal)

  return (
    <>
      <div className={dashboardPageShellClass} aria-label="Configurações" aria-busy={showPanelSkeleton}>
        <div className={dashboardPageHeaderWrapClass}>
          <AdminPageHeader
            sectionLabel="Governança"
            title="Configurações"
            description="Catálogos globais da plataforma: clínico, contratos, exames e documentos legais."
          />
        </div>

        <div
          className={[dashboardPageScrollPaddingClass, 'mt-4 flex min-h-0 flex-1 flex-col pb-5'].join(
            ' ',
          )}
        >
          <div className={[configPanelShellClass, 'min-h-0 flex-1'].join(' ')}>
            {showPanelSkeleton ? (
              <AdminConfiguracoesPageContentSkeleton activeTab={activeTab} />
            ) : (
              <>
                <AdminConfiguracoesTabs activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === 'clinico' ? (
                  <AdminConfigClinicoPanel
                    professions={config.professions}
                    specialties={config.specialties}
                    onCreateProfession={handleCreateProfession}
                    onUpdateProfession={handleUpdateProfession}
                    onDeleteProfession={handleDeleteProfession}
                    onSetProfessionStatus={handleSetProfessionStatus}
                    onCreateSpecialty={handleCreateSpecialty}
                    onUpdateSpecialty={handleUpdateSpecialty}
                    onDeleteSpecialty={handleDeleteSpecialty}
                    onSetSpecialtyStatus={handleSetSpecialtyStatus}
                    getAccessToken={getAccessToken}
                    onNotify={(message, variant = 'success') => setToast({ message, variant })}
                  />
                ) : null}

                {activeTab === 'contratos' ? (
                  <AdminConfigContratosPanel
                    contractTypes={config.contractTypes}
                    onCreateContractType={handleCreateContractType}
                    onUpdateContractType={handleUpdateContractType}
                    onDeleteContractType={handleDeleteContractType}
                    onSetContractTypeStatus={handleSetContractTypeStatus}
                    getAccessToken={getAccessToken}
                    onNotify={(message, variant = 'success') => setToast({ message, variant })}
                  />
                ) : null}

                {activeTab === 'consulta' ? (
                  <AdminConfigConsultaPanel
                    examCategories={config.examCategories}
                    examItems={config.examItems}
                    onCreateExamCategory={handleCreateExamCategory}
                    onUpdateExamCategory={handleUpdateExamCategory}
                    onDeleteExamCategory={handleDeleteExamCategory}
                    onSetExamCategoryStatus={handleSetExamCategoryStatus}
                    onCreateExamItem={handleCreateExamItem}
                    onUpdateExamItem={handleUpdateExamItem}
                    onDeleteExamItem={handleDeleteExamItem}
                    onSetExamItemStatus={handleSetExamItemStatus}
                    getAccessToken={getAccessToken}
                    onNotify={(message, variant = 'success') => setToast({ message, variant })}
                  />
                ) : null}

                {activeTab === 'legal' ? (
                  <AdminConfigLegalPanel
                    documents={config.legalDocuments}
                    onChange={patchLegalDocuments}
                    onCreateDocument={handleCreateLegalDocument}
                    onSaveDocument={handleSaveLegalDocument}
                    onPublishDocument={handlePublishLegalDocument}
                    onDeleteDocument={handleDeleteLegalDocument}
                    getAccessToken={getAccessToken}
                    onNotify={(message, variant = 'success') => setToast({ message, variant })}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <Toast
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'success'}
        visible={toast !== null}
        onClose={() => setToast(null)}
      />
    </>
  )
}
