import { EXAM_REQUEST_CATALOG, EXAM_REQUEST_CATEGORIES } from './doctorExamRequestMock'
import { specialties } from './specialties'
import type {
  AdminConfiguracoesState,
  ConfigLegalDocument,
  ConfigProfession,
  ConfigTriageServiceType,
  PresetLegalDocumentId,
} from '../types/adminConfiguracoes'

const professionSeeds: ConfigProfession[] = [
  {
    id: 'prof-medicos',
    name: 'Médicos',
    councilLabel: 'Conselho Regional de Medicina',
    councilAcronym: 'CRM',
    active: true,
    sortOrder: 1,
    specialtyIds: [],
  },
  {
    id: 'prof-psicologos',
    name: 'Psicólogos',
    councilLabel: 'Conselho Regional de Psicologia',
    councilAcronym: 'CRP',
    active: true,
    sortOrder: 2,
    specialtyIds: [],
  },
  {
    id: 'prof-nutricionistas',
    name: 'Nutricionistas',
    councilLabel: 'Conselho Regional de Nutricionistas',
    councilAcronym: 'CRN',
    active: true,
    sortOrder: 3,
    specialtyIds: [],
  },
  {
    id: 'prof-fonoaudiologos',
    name: 'Fonoaudiólogos',
    councilLabel: 'Conselho Regional de Fonoaudiologia',
    councilAcronym: 'CRFa',
    active: true,
    sortOrder: 4,
    specialtyIds: [],
  },
]

function inferProfessionIds(specialtyName: string): string[] {
  if (/^psicologia$/i.test(specialtyName)) return ['prof-psicologos']
  if (/nutri|nutrologia/i.test(specialtyName)) return ['prof-nutricionistas']
  if (/fonoaudi/i.test(specialtyName)) return ['prof-fonoaudiologos']
  return ['prof-medicos']
}

const specialtySeeds = specialties.map((item, index) => ({
  id: item.id,
  name: item.name,
  active: item.available,
  professionIds: inferProfessionIds(item.name),
  sortOrder: index + 1,
}))

for (const profession of professionSeeds) {
  profession.specialtyIds = specialtySeeds
    .filter((s) => s.professionIds.includes(profession.id))
    .map((s) => s.id)
}

const triageServiceTypeSeeds: ConfigTriageServiceType[] = [
  { id: 'triage-clinico', label: 'Clínico geral', specialtyId: '4', active: true, sortOrder: 1 },
  { id: 'triage-pediatria', label: 'Pediatria', specialtyId: '3', active: true, sortOrder: 2 },
  { id: 'triage-cardio', label: 'Cardiologia', specialtyId: '7', active: true, sortOrder: 3 },
  { id: 'triage-gineco', label: 'Ginecologia', specialtyId: '19', active: true, sortOrder: 4 },
  { id: 'triage-psico', label: 'Psicologia', specialtyId: '33', active: true, sortOrder: 5 },
  { id: 'triage-dermato', label: 'Dermatologia', specialtyId: '14', active: true, sortOrder: 6 },
  { id: 'triage-geriatria', label: 'Geriatria', specialtyId: '18', active: true, sortOrder: 7 },
  {
    id: 'triage-ortopedia',
    label: 'Ortopedia e Traumatologia',
    specialtyId: '132',
    active: true,
    sortOrder: 8,
  },
]

const examCategorySeeds = EXAM_REQUEST_CATEGORIES.map((name, index) => ({
  id: `exam-cat-${index}`,
  name,
  active: true,
}))

function examCategoryIdForName(name: string) {
  const index = EXAM_REQUEST_CATEGORIES.indexOf(name as (typeof EXAM_REQUEST_CATEGORIES)[number])
  return index >= 0 ? `exam-cat-${index}` : 'exam-cat-3'
}

const examItemSeeds = EXAM_REQUEST_CATALOG.map((item) => ({
  id: item.id,
  name: item.name,
  categoryId: examCategoryIdForName(item.category),
  active: true,
}))

const legalDocumentTemplates: Record<
  PresetLegalDocumentId,
  Pick<ConfigLegalDocument, 'title' | 'content'>
> = {
  termos_uso: {
    title: 'Termos de uso',
    content:
      'Estes Termos de Uso regulam o acesso e a utilização da plataforma Telefarmed pelos operadores autorizados das prefeituras contratantes e unidades UBT.\n\nAo acessar o sistema, o usuário declara ter lido e concordado com as condições aqui descritas.',
  },
  faq: {
    title: 'Perguntas frequentes (FAQ)',
    content:
      '## Como acesso o painel?\nUtilize o e-mail e a senha fornecidos pelo gestor da sua unidade ou prefeitura.\n\n## Esqueci minha senha\nSolicite a redefinição ao responsável pela UBT ou abra um chamado em Suporte.',
  },
  privacidade: {
    title: 'Política de privacidade',
    content:
      'A Telefarmed trata dados pessoais em conformidade com a Lei nº 13.709/2018 (LGPD), utilizando informações de saúde e cadastro exclusivamente para prestação do serviço contratado, segurança e melhoria da plataforma.',
  },
  consentimento_informado: {
    title: 'Termo de consentimento informado',
    content:
      'Declaro estar ciente de que o atendimento por telemedicina possui limitações próprias do meio digital e autorizo o registro das informações clínicas necessárias à continuidade do cuidado, nos termos da regulamentação vigente.',
  },
  lgpd: {
    title: 'LGPD — direitos do titular',
    content:
      'O titular de dados pode solicitar confirmação de tratamento, acesso, correção, anonimização ou eliminação de dados, mediante canal indicado pelo controlador (prefeitura contratante) ou pela Telefarmed como operadora.',
  },
}

function buildLegalDocuments(): ConfigLegalDocument[] {
  const presetIds = Object.keys(legalDocumentTemplates) as PresetLegalDocumentId[]
  return presetIds.map((id) => ({
    id,
    ...legalDocumentTemplates[id],
    version: '1.0',
    updatedAtLabel: 'Mai/2026',
    published: true,
    portals:
      id === 'consentimento_informado' || id === 'lgpd'
        ? ['terminal', 'ubt', 'prefeitura']
        : ['admin', 'prefeitura', 'ubt', 'terminal'],
  }))
}

export const adminConfiguracoesInitial: AdminConfiguracoesState = {
  professions: professionSeeds,
  specialties: specialtySeeds,
  triageServiceTypes: triageServiceTypeSeeds,
  contractTypes: [
    {
      id: 'mensal',
      label: 'Mensal',
      description: 'Franquia mensal de consultas com renovação automática por período.',
      active: true,
    },
    {
      id: 'pacote_fechado',
      label: 'Pacote fechado',
      description: 'Volume total de consultas no período do contrato, com controle de utilização.',
      active: true,
    },
    {
      id: 'sob_demanda',
      label: 'Sob demanda',
      description: 'Cobrança por consulta realizada, sem pacote pré-contratado.',
      active: true,
    },
  ],
  commercialRules: {
    defaultAllowExceedPackage: true,
    defaultAvulsoUnitValueBrl: '47,90',
    minContractMonths: 12,
    defaultImplantationDays: 45,
    requireAuthorizedSpecialtiesOnContract: true,
    blockConsultWhenPackageExceeded: false,
  },
  examCategories: examCategorySeeds,
  examItems: examItemSeeds,
  legalDocuments: buildLegalDocuments(),
}
