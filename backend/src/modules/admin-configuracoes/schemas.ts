import { z } from 'zod'

const catalogIdSchema = z
  .string()
  .trim()
  .min(1, 'ID obrigatório.')
  .max(64, 'ID muito longo.')
  .regex(/^[a-zA-Z0-9_-]+$/, 'ID contém caracteres inválidos.')

const professionBodySchema = z.object({
  id: catalogIdSchema,
  name: z.string().trim().min(1, 'Nome obrigatório.').max(200),
  councilLabel: z.string().trim().min(1, 'Conselho obrigatório.').max(200),
  councilAcronym: z.string().trim().min(1, 'Sigla obrigatória.').max(20),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(32_767),
  specialtyIds: z.array(catalogIdSchema).optional(),
})

const specialtyBodySchema = z.object({
  id: catalogIdSchema,
  name: z.string().trim().min(1, 'Nome obrigatório.').max(200),
  active: z.boolean(),
  professionIds: z.array(catalogIdSchema).max(20),
  sortOrder: z.number().int().min(0).max(32_767),
})

export const saveClinicoCatalogBodySchema = z
  .object({
    professions: z.array(professionBodySchema.omit({ specialtyIds: true })).max(100),
    specialties: z.array(specialtyBodySchema).max(500),
  })
  .superRefine((data, ctx) => {
    const professionIds = new Set(data.professions.map((row) => row.id))
    const specialtyIds = new Set(data.specialties.map((row) => row.id))

    if (professionIds.size !== data.professions.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'IDs de profissão duplicados.',
        path: ['professions'],
      })
    }

    if (specialtyIds.size !== data.specialties.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'IDs de especialidade duplicados.',
        path: ['specialties'],
      })
    }

    for (const [index, specialty] of data.specialties.entries()) {
      for (const professionId of specialty.professionIds) {
        if (!professionIds.has(professionId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Profissão "${professionId}" não existe no payload.`,
            path: ['specialties', index, 'professionIds'],
          })
        }
      }
    }
  })

export type SaveClinicoCatalogBody = z.infer<typeof saveClinicoCatalogBodySchema>

export const listClinicoQuerySchema = z.object({
  activeOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
})

const contractTypeBodySchema = z.object({
  id: catalogIdSchema,
  label: z.string().trim().min(1, 'Nome obrigatório.').max(200),
  description: z.string().trim().min(1, 'Descrição obrigatória.').max(2000),
  active: z.boolean().optional(),
})

export const createContractTypeBodySchema = contractTypeBodySchema

export const updateContractTypeBodySchema = contractTypeBodySchema.pick({
  label: true,
  description: true,
})

export const setContractTypeStatusBodySchema = z.object({
  active: z.boolean(),
})

export const saveCommercialRulesBodySchema = z.object({
  defaultAllowExceedPackage: z.boolean(),
  defaultAvulsoUnitValueBrl: z
    .string()
    .trim()
    .min(1, 'Valor avulso obrigatório.')
    .max(20)
    .regex(/^\d{1,3}(\.\d{3})*,\d{2}$|^\d+,\d{2}$/, 'Valor avulso inválido.'),
  minContractMonths: z.number().int().min(1).max(120),
  defaultImplantationDays: z.number().int().min(1).max(365),
  requireAuthorizedSpecialtiesOnContract: z.boolean(),
  blockConsultWhenPackageExceeded: z.boolean(),
})

export const listContratosQuerySchema = z.object({
  activeOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
})

const examCategoryBodySchema = z.object({
  id: catalogIdSchema,
  name: z.string().trim().min(1, 'Nome obrigatório.').max(200),
  active: z.boolean().optional(),
})

const examItemBodySchema = z.object({
  id: catalogIdSchema,
  name: z.string().trim().min(1, 'Nome obrigatório.').max(200),
  categoryId: catalogIdSchema,
  active: z.boolean().optional(),
})

export const createExamCategoryBodySchema = examCategoryBodySchema

export const updateExamCategoryBodySchema = examCategoryBodySchema.pick({
  name: true,
})

export const setExamCategoryStatusBodySchema = z.object({
  active: z.boolean(),
})

export const createExamItemBodySchema = examItemBodySchema

export const updateExamItemBodySchema = examItemBodySchema.pick({
  name: true,
  categoryId: true,
})

export const setExamItemStatusBodySchema = z.object({
  active: z.boolean(),
})

export const listConsultaQuerySchema = z.object({
  activeOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
})

export type CreateContractTypeBody = z.infer<typeof createContractTypeBodySchema>
export type UpdateContractTypeBody = z.infer<typeof updateContractTypeBodySchema>
export type SaveCommercialRulesBody = z.infer<typeof saveCommercialRulesBodySchema>
export type CreateExamCategoryBody = z.infer<typeof createExamCategoryBodySchema>
export type UpdateExamCategoryBody = z.infer<typeof updateExamCategoryBodySchema>
export type CreateExamItemBody = z.infer<typeof createExamItemBodySchema>
export type UpdateExamItemBody = z.infer<typeof updateExamItemBodySchema>

const legalDocumentPortalSchema = z.enum(['admin', 'prefeitura', 'ubt', 'terminal'])

const legalDocumentBodySchema = z.object({
  id: catalogIdSchema,
  title: z.string().trim().min(1, 'Título obrigatório.').max(200),
  content: z.string().max(100_000).optional(),
  version: z.string().trim().min(1, 'Versão obrigatória.').max(20),
  updatedAtLabel: z.string().trim().min(1, 'Rótulo de atualização obrigatório.').max(40),
  published: z.boolean().optional(),
  portals: z.array(legalDocumentPortalSchema).max(4),
})

export const createLegalDocumentBodySchema = legalDocumentBodySchema

export const updateLegalDocumentBodySchema = legalDocumentBodySchema.pick({
  title: true,
  content: true,
  version: true,
  updatedAtLabel: true,
  portals: true,
}).extend({
  content: z.string().max(100_000),
})

export const setLegalDocumentPublishedBodySchema = z.object({
  published: z.boolean(),
})

export const listLegalQuerySchema = z.object({
  publishedOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  portal: legalDocumentPortalSchema.optional(),
})

export type CreateLegalDocumentBody = z.infer<typeof createLegalDocumentBodySchema>
export type UpdateLegalDocumentBody = z.infer<typeof updateLegalDocumentBodySchema>
