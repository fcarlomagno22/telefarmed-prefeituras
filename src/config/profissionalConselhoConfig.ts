import type { ProfissionalConselhoClasse } from '../types/profissionalPerfil'

export type ProfissionalConselhoConfig = {
  classe: ProfissionalConselhoClasse
  profissaoLabel: string
  conselhoFederal: string
  conselhoRegionalSigla: string
  registroFieldLabel: string
  /** Portal oficial do conselho para certificado / serviços. */
  portalUrl: string
  /** Oferta de certificado em nuvem pelo conselho (ex.: CFM). */
  certificadoNuvemDisponivel: boolean
  certificadoNuvemTitulo: string
  certificadoNuvemDescricao: string
  /** Orientação quando não há emissão gratuita em nuvem pelo conselho. */
  certificadoOrientacao: string
}

export const profissionalConselhoByClasse: Record<
  ProfissionalConselhoClasse,
  ProfissionalConselhoConfig
> = {
  medico: {
    classe: 'medico',
    profissaoLabel: 'Médico(a)',
    conselhoFederal: 'CFM',
    conselhoRegionalSigla: 'CRM',
    registroFieldLabel: 'CRM',
    portalUrl: 'https://certificadodigital.cfm.org.br/',
    certificadoNuvemDisponivel: true,
    certificadoNuvemTitulo: 'Certificado Digital CFM',
    certificadoNuvemDescricao:
      'Emitido pelo CFM/CRM como Autoridade de Registro (AR), em parceria com AC credenciada na ICP-Brasil. Modelo A3 em nuvem, gratuito para médicos adimplentes.',
    certificadoOrientacao:
      'Solicite pelo CRM Virtual ou no CRM da sua jurisdição. É necessário registro ativo, CIM em policarbonato e biometria compatível.',
  },
  psicologo: {
    classe: 'psicologo',
    profissaoLabel: 'Psicólogo(a)',
    conselhoFederal: 'CFP',
    conselhoRegionalSigla: 'CRP',
    registroFieldLabel: 'CRP',
    portalUrl: 'https://site.cfp.org.br/',
    certificadoNuvemDisponivel: false,
    certificadoNuvemTitulo: 'Certificado vinculado ao CRP',
    certificadoNuvemDescricao:
      'O CFP/CRP não oferece emissão gratuita em nuvem como o CFM. Utilize certificado ICP-Brasil (e-CPF) emitido por Autoridade Certificadora credenciada, com registro ativo no CRP.',
    certificadoOrientacao:
      'Para documentos com assinatura qualificada, obtenha e-CPF A1 ou A3 em AC credenciada (Valid, Certisign, Soluti, etc.) e mantenha inscrição regular no CRP.',
  },
  fonoaudiologo: {
    classe: 'fonoaudiologo',
    profissaoLabel: 'Fonoaudiólogo(a)',
    conselhoFederal: 'CFOFa',
    conselhoRegionalSigla: 'CRFa',
    registroFieldLabel: 'CRFa',
    portalUrl: 'https://www.coffito.gov.br/',
    certificadoNuvemDisponivel: false,
    certificadoNuvemTitulo: 'Certificado vinculado ao CRFa',
    certificadoNuvemDescricao:
      'Utilize certificado digital padrão ICP-Brasil (e-CPF), emitido por Autoridade Certificadora credenciada, com registro ativo no CRFa.',
    certificadoOrientacao:
      'Consulte o conselho regional para requisitos de documentos e, se necessário, validação presencial na AR da AC escolhida.',
  },
  nutricionista: {
    classe: 'nutricionista',
    profissaoLabel: 'Nutricionista',
    conselhoFederal: 'CFN',
    conselhoRegionalSigla: 'CRN',
    registroFieldLabel: 'CRN',
    portalUrl: 'https://www.cfn.org.br/',
    certificadoNuvemDisponivel: false,
    certificadoNuvemTitulo: 'Certificado vinculado ao CRN',
    certificadoNuvemDescricao:
      'Utilize certificado digital padrão ICP-Brasil (e-CPF), emitido por Autoridade Certificadora credenciada, com registro ativo no CRN.',
    certificadoOrientacao:
      'O certificado deve estar no padrão ICP-Brasil para assinatura qualificada de laudos, planos alimentares e demais documentos clínicos.',
  },
}

export function getProfissionalConselhoConfig(
  classe: ProfissionalConselhoClasse,
): ProfissionalConselhoConfig {
  return profissionalConselhoByClasse[classe]
}

export function formatProfissionalConselhoRegistro(
  sigla: string,
  registro: string,
  uf: string,
): string {
  return `${sigla}-${uf} ${registro}`
}
