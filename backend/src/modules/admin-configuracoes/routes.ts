import type { FastifyInstance } from 'fastify'
import { requireAdminAuth, requireAdminPagePermission } from '../admin-auth/middleware.js'
import {
  createContractType,
  deleteContractType,
  getContratosCatalog,
  saveCommercialRules,
  setContractTypeStatus,
  updateContractType,
} from './contratos.service.js'
import {
  createExamCategory,
  createExamCategoriesBulk,
  createExamItem,
  createExamItemsBulk,
  deleteExamCategory,
  deleteExamItem,
  deleteExamItemsBulk,
  getConsultaCatalog,
  setExamCategoryStatus,
  setExamItemStatus,
  updateExamCategory,
  updateExamItem,
} from './consulta.service.js'
import { getClinicoCatalog, saveClinicoCatalog } from './clinico.service.js'
import {
  createLegalDocument,
  deleteLegalDocument,
  getLegalCatalog,
  setLegalDocumentPublished,
  updateLegalDocument,
} from './legal.service.js'
import { mapConfiguracoesError } from './errors.js'
import {
  createContractTypeBodySchema,
  createExamCategoriesBulkBodySchema,
  createExamCategoryBodySchema,
  createExamItemsBulkBodySchema,
  createExamItemBodySchema,
  createLegalDocumentBodySchema,
  deleteExamItemsBulkBodySchema,
  listClinicoQuerySchema,
  listConsultaQuerySchema,
  listContratosQuerySchema,
  listLegalQuerySchema,
  saveClinicoCatalogBodySchema,
  saveCommercialRulesBodySchema,
  setContractTypeStatusBodySchema,
  setExamCategoryStatusBodySchema,
  setExamItemStatusBodySchema,
  setLegalDocumentPublishedBodySchema,
  updateContractTypeBodySchema,
  updateExamCategoryBodySchema,
  updateExamItemBodySchema,
  updateLegalDocumentBodySchema,
} from './schemas.js'

const PUBLIC_CACHE_MAX_AGE_SECONDS = 60
const PUBLIC_CACHE_STALE_SECONDS = 300

const canView = requireAdminPagePermission('configuracoes', 'visualizar')
const canEdit = requireAdminPagePermission('configuracoes', 'editar')

function setPublicCatalogCacheHeaders(reply: { header: (name: string, value: string) => void }) {
  reply.header(
    'Cache-Control',
    `public, max-age=${PUBLIC_CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${PUBLIC_CACHE_STALE_SECONDS}`,
  )
}

function setAdminCatalogNoCacheHeaders(reply: { header: (name: string, value: string) => void }) {
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate')
  reply.header('Pragma', 'no-cache')
}

export async function registerPublicConfiguracoesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/clinico', async (request, reply) => {
    const parsed = listClinicoQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const catalog = await getClinicoCatalog({ activeOnly: parsed.data.activeOnly })
      setPublicCatalogCacheHeaders(reply)
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapConfiguracoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/contratos', async (request, reply) => {
    const parsed = listContratosQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const catalog = await getContratosCatalog({ activeOnly: parsed.data.activeOnly })
      setPublicCatalogCacheHeaders(reply)
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapConfiguracoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/consulta', async (request, reply) => {
    const parsed = listConsultaQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const catalog = await getConsultaCatalog({ activeOnly: parsed.data.activeOnly })
      setPublicCatalogCacheHeaders(reply)
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapConfiguracoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/legal', async (request, reply) => {
    const parsed = listLegalQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const catalog = await getLegalCatalog({
        publishedOnly: true,
        portal: parsed.data.portal,
      })
      setPublicCatalogCacheHeaders(reply)
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapConfiguracoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

export async function registerAdminConfiguracoesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/clinico', { preHandler: [requireAdminAuth, canView] }, async (request, reply) => {
    const parsed = listClinicoQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const catalog = await getClinicoCatalog({ activeOnly: parsed.data.activeOnly })
      setAdminCatalogNoCacheHeaders(reply)
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapConfiguracoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/clinico', { preHandler: [requireAdminAuth, canEdit] }, async (request, reply) => {
    const parsed = saveClinicoCatalogBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const catalog = await saveClinicoCatalog(parsed.data)
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapConfiguracoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/contratos', { preHandler: [requireAdminAuth, canView] }, async (request, reply) => {
    const parsed = listContratosQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const catalog = await getContratosCatalog({ activeOnly: parsed.data.activeOnly })
      setAdminCatalogNoCacheHeaders(reply)
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapConfiguracoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/contratos/tipos', { preHandler: [requireAdminAuth, canEdit] }, async (request, reply) => {
    const parsed = createContractTypeBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const contractType = await createContractType(parsed.data)
      return reply.status(201).send(contractType)
    } catch (error) {
      const mapped = mapConfiguracoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/contratos/tipos/:id', { preHandler: [requireAdminAuth, canEdit] }, async (request, reply) => {
    const id = String((request.params as { id: string }).id ?? '').trim()
    if (!id) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    const parsed = updateContractTypeBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const contractType = await updateContractType(id, parsed.data)
      return reply.send(contractType)
    } catch (error) {
      const mapped = mapConfiguracoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch(
    '/contratos/tipos/:id/status',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const id = String((request.params as { id: string }).id ?? '').trim()
      if (!id) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      const parsed = setContractTypeStatusBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const contractType = await setContractTypeStatus(id, parsed.data.active)
        return reply.send(contractType)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.delete(
    '/contratos/tipos/:id',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const id = String((request.params as { id: string }).id ?? '').trim()
      if (!id) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      try {
        await deleteContractType(id)
        return reply.status(204).send()
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.put(
    '/contratos/regras-comerciais',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const parsed = saveCommercialRulesBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const commercialRules = await saveCommercialRules(parsed.data)
        return reply.send(commercialRules)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.get('/consulta', { preHandler: [requireAdminAuth, canView] }, async (request, reply) => {
    const parsed = listConsultaQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const catalog = await getConsultaCatalog({ activeOnly: parsed.data.activeOnly })
      setAdminCatalogNoCacheHeaders(reply)
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapConfiguracoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/consulta/categorias/bulk',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const parsed = createExamCategoriesBulkBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const categories = await createExamCategoriesBulk(parsed.data.items)
        return reply.status(201).send(categories)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post(
    '/consulta/exames/bulk',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const parsed = createExamItemsBulkBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const items = await createExamItemsBulk(parsed.data.items)
        return reply.status(201).send(items)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post(
    '/consulta/exames/bulk-delete',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const parsed = deleteExamItemsBulkBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const result = await deleteExamItemsBulk(parsed.data)
        return reply.send(result)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post(
    '/consulta/categorias',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const parsed = createExamCategoryBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const category = await createExamCategory(parsed.data)
        return reply.status(201).send(category)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.put(
    '/consulta/categorias/:id',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const id = String((request.params as { id: string }).id ?? '').trim()
      if (!id) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      const parsed = updateExamCategoryBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const category = await updateExamCategory(id, parsed.data)
        return reply.send(category)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.patch(
    '/consulta/categorias/:id/status',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const id = String((request.params as { id: string }).id ?? '').trim()
      if (!id) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      const parsed = setExamCategoryStatusBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const category = await setExamCategoryStatus(id, parsed.data.active)
        return reply.send(category)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.delete(
    '/consulta/categorias/:id',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const id = String((request.params as { id: string }).id ?? '').trim()
      if (!id) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      try {
        await deleteExamCategory(id)
        return reply.status(204).send()
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post(
    '/consulta/exames',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const parsed = createExamItemBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const item = await createExamItem(parsed.data)
        return reply.status(201).send(item)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.put(
    '/consulta/exames/:id',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const id = String((request.params as { id: string }).id ?? '').trim()
      if (!id) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      const parsed = updateExamItemBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const item = await updateExamItem(id, parsed.data)
        return reply.send(item)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.patch(
    '/consulta/exames/:id/status',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const id = String((request.params as { id: string }).id ?? '').trim()
      if (!id) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      const parsed = setExamItemStatusBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const item = await setExamItemStatus(id, parsed.data.active)
        return reply.send(item)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.delete(
    '/consulta/exames/:id',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const id = String((request.params as { id: string }).id ?? '').trim()
      if (!id) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      try {
        await deleteExamItem(id)
        return reply.status(204).send()
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.get('/legal', { preHandler: [requireAdminAuth, canView] }, async (request, reply) => {
    const parsed = listLegalQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const catalog = await getLegalCatalog({
        publishedOnly: parsed.data.publishedOnly,
        portal: parsed.data.portal,
      })
      setAdminCatalogNoCacheHeaders(reply)
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapConfiguracoesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/legal/documentos',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const parsed = createLegalDocumentBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const document = await createLegalDocument(parsed.data)
        return reply.status(201).send(document)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.put(
    '/legal/documentos/:id',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const id = String((request.params as { id: string }).id ?? '').trim()
      if (!id) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      const parsed = updateLegalDocumentBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const document = await updateLegalDocument(id, parsed.data)
        return reply.send(document)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.patch(
    '/legal/documentos/:id/publicacao',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const id = String((request.params as { id: string }).id ?? '').trim()
      if (!id) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      const parsed = setLegalDocumentPublishedBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const document = await setLegalDocumentPublished(id, parsed.data.published)
        return reply.send(document)
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.delete(
    '/legal/documentos/:id',
    { preHandler: [requireAdminAuth, canEdit] },
    async (request, reply) => {
      const id = String((request.params as { id: string }).id ?? '').trim()
      if (!id) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      try {
        await deleteLegalDocument(id)
        return reply.status(204).send()
      } catch (error) {
        const mapped = mapConfiguracoesError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )
}
