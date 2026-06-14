import { brand } from '../config/brand'
import { PROFISSIONAL_LOGGED_DOCTOR_ID } from '../config/profissionalConfig'
import {
  formatProfissionalConselhoRegistro,
  getProfissionalConselhoConfig,
} from '../config/profissionalConselhoConfig'
import { profissionalPrestadorEmpresa } from './profissionalFinanceiroMock'
import type { ProfissionalPerfil } from '../types/profissionalPerfil'

const professionalDescription =
  'Médica Clínica Geral com foco em saúde preventiva e telemedicina. Atuo há mais de 10 anos em atendimento ambulatorial e triagem clínica remota.'

const conselhoClasse = 'medico' as const
const conselhoConfig = getProfissionalConselhoConfig(conselhoClasse)

/** Perfil centralizado do profissional logado (mock). */
export const profissionalLoggedProfile: ProfissionalPerfil = {
  id: PROFISSIONAL_LOGGED_DOCTOR_ID,
  fullName: brand.profissionalOperatorName,
  professionalTitle: brand.profissionalOperatorRole.split('·')[0]?.trim() ?? 'Médica',
  cpf: '226.522.048-58',
  rg: '42.918.765-3',
  conselhoClasse,
  conselhoRegistro: '123456',
  conselhoUf: 'SP',
  rqe: '654321',
  birthDate: '1985-08-15T12:00:00',
  specialty: 'Clínica Médica',
  profession: 'Médicos',
  professionalDescription,
  professionalAddress: 'Av. Paulista, 1000, Bela Vista, São Paulo - SP, 01310-100',
  phone: '(11) 99876-5432',
  email: 'ana.martins@fcmtelmedicina.com.br',
  avatarUrl: 'https://i.pravatar.cc/240?img=47',
  empresa: profissionalPrestadorEmpresa,
  pixKeyType: 'cpf',
  bankAccount: {
    bankName: 'Banco Itaú S.A.',
    bankCode: '341',
    agency: '1234',
    account: '56789-0',
    accountType: 'corrente',
  },
  documents: [
    {
      id: 'doc-crm',
      kind: 'crm',
      label: `${conselhoConfig.conselhoRegionalSigla} / Conselho`,
      fileName: 'crm-sp-ana-martins.pdf',
      uploadedAt: '2024-04-12T10:00:00',
      status: 'aprovado',
      iconTone: 'orange',
    },
    {
      id: 'doc-rg',
      kind: 'identidade',
      label: 'Documento de identidade',
      fileName: 'rg-ana-martins.pdf',
      uploadedAt: '2024-04-12T10:05:00',
      status: 'aprovado',
      iconTone: 'blue',
    },
    {
      id: 'doc-prof',
      kind: 'outro',
      label: 'Comprovante profissional',
      fileName: 'diploma-medicina.pdf',
      uploadedAt: '2024-04-12T10:10:00',
      status: 'aprovado',
      iconTone: 'green',
    },
    {
      id: 'doc-endereco',
      kind: 'comprovante',
      label: 'Comprovante de endereço',
      fileName: 'comprovante-residencia.pdf',
      uploadedAt: '2024-04-10T14:20:00',
      status: 'pendente',
      iconTone: 'violet',
    },
  ],
  certificadoDigital: {
    modo: 'conselho_nuvem',
    status: 'ativo',
    updatedAt: '2024-04-12T09:30:00',
    expiresAt: '2026-04-12T23:59:59',
    emissorDescricao: 'Certificado CFM em nuvem · ICP-Brasil · VALID',
    arquivoNome: null,
    titularNome: 'Ana Martins',
  },
  publicSummary: {
    isOnline: true,
    onlineLabel: 'Disponível',
    averageRating: 5,
    reviewCount: 128,
    totalAttendances: 1248,
  },
  profileCompletenessPercent: 92,
}

/** Registro formatado para exibição (ex.: CRM-SP 123456). */
export const profissionalLoggedConselhoRegistroLabel = formatProfissionalConselhoRegistro(
  conselhoConfig.conselhoRegionalSigla,
  profissionalLoggedProfile.conselhoRegistro,
  profissionalLoggedProfile.conselhoUf,
)
