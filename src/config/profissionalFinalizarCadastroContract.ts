import type {
  ProfissionalFinalizarCadastroEmpresaData,
  ProfissionalFinalizarCadastroProfissionalData,
} from '../types/profissionalFinalizarCadastro'

export type ProfissionalFinalizarCadastroContractSection = {
  heading: string
  body: string
}

export type ProfissionalFinalizarCadastroContractDocument = {
  title: string
  version: string
  sections: ProfissionalFinalizarCadastroContractSection[]
}

export const telefarmedContratante = {
  razaoSocial: 'Telefarmed Serviços Ltda',
  cnpj: '63.642.507/0001-69',
  logradouro: 'Rua Mariano Gardolinski',
  numero: '141',
  bairro: 'Santa Candida',
  cidade: 'Curitiba',
  uf: 'PR',
  cep: '82640-030',
} as const

export const profissionalFinalizarCadastroContractScrollThreshold_PX = 24

function formatEmpresaEndereco(empresa: ProfissionalFinalizarCadastroEmpresaData) {
  const complemento = empresa.complemento.trim()
  const base = `${empresa.logradouro}, ${empresa.numero}`
  const linha1 = complemento ? `${base}, ${complemento}` : base
  return `${linha1}, ${empresa.bairro}, ${empresa.cidade}/${empresa.uf}, CEP ${empresa.cep}`
}

function buildPartesSection(
  empresa: ProfissionalFinalizarCadastroEmpresaData,
  profissional: ProfissionalFinalizarCadastroProfissionalData,
): string {
  const contratante = `${telefarmedContratante.razaoSocial}, pessoa jurídica de direito privado, inscrita no CNPJ sob o n. ${telefarmedContratante.cnpj}, com sede na ${telefarmedContratante.logradouro}, ${telefarmedContratante.numero}, ${telefarmedContratante.bairro}, ${telefarmedContratante.cidade}/${telefarmedContratante.uf}, CEP ${telefarmedContratante.cep}.`

  const contratado = `${empresa.razaoSocial}, pessoa jurídica de direito privado, inscrita no CNPJ sob o n. ${empresa.cnpj}, com sede na ${formatEmpresaEndereco(empresa)}, neste ato representada por ${profissional.fullName}, inscrito(a) no CPF sob o n. ${profissional.cpf}, profissional de saúde contratado(a).`

  return `CONTRATANTE: ${contratante}

CONTRATADO(A): ${contratado}`
}

export function buildProfissionalFinalizarCadastroContract(
  empresa: ProfissionalFinalizarCadastroEmpresaData,
  profissional: ProfissionalFinalizarCadastroProfissionalData,
): ProfissionalFinalizarCadastroContractDocument {
  return {
    title: 'Contrato de prestação de serviços profissionais',
    version: '1.0 — Mai/2026',
    sections: [
      {
        heading: '1. Partes',
        body: buildPartesSection(empresa, profissional),
      },
      {
        heading: '2. Objeto',
        body: `O presente contrato tem por objeto a prestação de serviços profissionais de saúde por ${profissional.fullName}, em regime de plantões e atendimentos por telemedicina, realizados por meio da plataforma ${telefarmedContratante.razaoSocial}, conforme escala, filas e convocações disponibilizadas ao(à) CONTRATADO(A), em nome da pessoa jurídica ${empresa.razaoSocial}.`,
      },
      {
        heading: '3. Obrigações do profissional',
        body: `O(A) profissional ${profissional.fullName}, CPF ${profissional.cpf}, na qualidade de representante legal da CONTRATADA, compromete-se a:
• Manter registro ativo e regular no conselho profissional competente;
• Atender pacientes conforme protocolos clínicos, prazos de fila e normas da plataforma;
• Registrar prontuário, condutas e documentos exigidos para cada atendimento;
• Observar sigilo profissional, confidencialidade e a Lei Geral de Proteção de Dados (LGPD);
• Utilizar equipamento, conexão e ambiente adequados à teleconsulta;
• Comunicar indisponibilidades, impedimentos ou incidentes operacionais pelos canais oficiais.`,
      },
      {
        heading: '4. Remuneração e repasses',
        body: `Os valores dos plantões e critérios de remuneração seguem tabela e regras exibidas na plataforma no momento da assunção de cada escala. Os repasses serão efetuados na conta vinculada à chave PIX cadastrada em nome de ${empresa.razaoSocial}, CNPJ ${empresa.cnpj}, após validação de produção, emissão de nota fiscal quando aplicável e fechamento da competência financeira correspondente.`,
      },
      {
        heading: '5. Notas fiscais e dados fiscais',
        body: `Quando exigido, o CONTRATADO(A) deverá emitir documento fiscal em nome de ${empresa.razaoSocial}, CNPJ ${empresa.cnpj}, com endereço na ${formatEmpresaEndereco(empresa)}, dentro dos prazos indicados no módulo financeiro. A inconsistência entre CNPJ, PIX e documentos fiscais poderá suspender repasses até regularização.`,
      },
      {
        heading: '6. Propriedade intelectual e uso da plataforma',
        body: `A plataforma, marcas, fluxos operacionais e materiais institucionais são de titularidade da CONTRATANTE ou de seus licenciantes. É vedado compartilhar credenciais, reproduzir conteúdos restritos ou utilizar dados de pacientes fora das finalidades autorizadas.`,
      },
      {
        heading: '7. Vigência e rescisão',
        body: `Este contrato entra em vigor na data de aceite eletrônico por ${profissional.fullName}, CPF ${profissional.cpf}, e permanece válido enquanto houver vínculo operacional ativo entre as partes. Qualquer das partes poderá encerrar o vínculo mediante comunicação pelos canais formais, observadas pendências financeiras, documentais ou assistenciais em curso.`,
      },
      {
        heading: '8. Disposições finais',
        body: `${profissional.fullName}, CPF ${profissional.cpf}, na qualidade de representante de ${empresa.razaoSocial}, declara ter lido integralmente este instrumento, compreendido suas cláusulas e concordado com os termos para utilização da plataforma Telefarmed.

Foro: Comarca de ${telefarmedContratante.cidade}/${telefarmedContratante.uf}, sede da CONTRATANTE, salvo disposição legal em contrário.

Ao marcar a confirmação na plataforma, o CONTRATADO(A) manifesta ciência e concordância com todas as cláusulas acima.`,
      },
    ],
  }
}
