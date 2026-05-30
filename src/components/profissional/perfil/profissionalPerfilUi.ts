import type {
  ProfissionalPerfilCertificadoStatus,
  ProfissionalPerfilDocumentIconTone,
  ProfissionalPerfilDocumentStatus,
} from '../../../types/profissionalPerfil'

export const profissionalPerfilCardClass =
  'flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'

export const profissionalPerfilCardHeaderClass =
  'flex shrink-0 items-center gap-2 px-5 pb-0 pt-4'

export const profissionalPerfilCardBodyClass = 'flex flex-col px-5 pb-4 pt-2.5'

/** Primeira linha do grid (Informações + Assinatura): mesma altura, conteúdo alinhado ao topo. */
export const profissionalPerfilTopRowCardClass =
  '@min-[920px]:row-start-1 @min-[920px]:h-full @min-[920px]:min-h-0'

export const profissionalPerfilTopRowHeaderClass = '!pb-0 !pt-4'

export const profissionalPerfilTopRowBodyClass =
  'flex min-h-0 flex-1 flex-col justify-start gap-2.5 !pb-3.5 !pt-2'

export const profissionalPerfilLabelClass = 'mb-1 block text-[13px] font-medium text-gray-600'

export const profissionalPerfilInputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

export const profissionalPerfilInfoBoxClass =
  'flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-900'

export const PROFISSIONAL_DESCRIPTION_MAX = 500

export const ACCEPT_CERTIFICADO_A1 = '.pfx,.p12,application/x-pkcs12'

export const profissionalPerfilCertificadoStatusConfig: Record<
  ProfissionalPerfilCertificadoStatus,
  { label: string; className: string }
> = {
  ativo: {
    label: 'Ativo',
    className: 'bg-emerald-50 text-emerald-700',
  },
  pendente: {
    label: 'Em validação',
    className: 'bg-amber-50 text-amber-700',
  },
  nao_cadastrado: {
    label: 'Não cadastrado',
    className: 'bg-gray-100 text-gray-600',
  },
  vencido: {
    label: 'Vencido',
    className: 'bg-red-50 text-red-700',
  },
}

export const profissionalPerfilDocumentStatusConfig: Record<
  ProfissionalPerfilDocumentStatus,
  { label: string; className: string }
> = {
  aprovado: {
    label: 'Aprovado',
    className: 'bg-emerald-50 text-emerald-700',
  },
  pendente: {
    label: 'Pendente',
    className: 'bg-orange-50 text-orange-600',
  },
  vencido: {
    label: 'Vencido',
    className: 'bg-red-50 text-red-700',
  },
}

export const profissionalPerfilDocumentIconToneClass: Record<
  ProfissionalPerfilDocumentIconTone,
  string
> = {
  orange: 'bg-orange-50 text-orange-500',
  blue: 'bg-sky-50 text-sky-500',
  green: 'bg-emerald-50 text-emerald-500',
  violet: 'bg-violet-50 text-violet-500',
}

export const profissionalPerfilPixKeyTypeLabels: Record<
  'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria',
  string
> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  telefone: 'Telefone',
  email: 'E-mail',
  aleatoria: 'Chave aleatória',
}

export const profissionalPerfilBankOptions = [
  { value: '341', label: 'Banco Itaú S.A. (341)' },
  { value: '001', label: 'Banco do Brasil S.A. (001)' },
  { value: '237', label: 'Banco Bradesco S.A. (237)' },
  { value: '104', label: 'Caixa Econômica Federal (104)' },
]

export const profissionalPerfilSpecialtyOptions = [
  { value: 'Clínica Médica', label: 'Clínica Médica' },
  { value: 'Pediatria', label: 'Pediatria' },
  { value: 'Cardiologia', label: 'Cardiologia' },
  { value: 'Dermatologia', label: 'Dermatologia' },
]
