/** Dados seed para modo mock — tipos em `types/adminClientes`. */
export type {
  AdminClienteContact,
  AdminClienteContrato,
  AdminClienteContratoDetalhes,
  AdminClienteContratoStatus,
  AdminClienteContratoTipo,
  AdminClientePrecoEspecialidade,
  AdminClientePrecoProfissao,
  AdminClienteRow,
  AdminClienteStatus,
  AdminClientesTab,
} from '../types/adminClientes'

export {
  adminClienteContratoTipoLabels,
  adminClientesStatusFilterOptions,
} from '../types/adminClientes'

import type { AdminClienteContrato, AdminClienteRow, AdminClientesTab } from '../types/adminClientes'

export const adminClientesSummary = {
  ativas: 128,
  ativasTrend: '+12 desde o mês passado',
  implantacao: 24,
  implantacaoTrend: '8 com go-live esta semana',
  prospects: 42,
  prospectsTrend: '15 em contato comercial',
  suspensas: 10,
  suspensasTrend: '3 aguardando regularização',
  totalCadastrados: 204,
  ultimaAtualizacaoMunicipio: 'Brasília/DF',
  ultimaAtualizacaoAgo: 'há 35 min',
  porStatus: {
    ativas: 128,
    implantacao: 24,
    prospects: 42,
    suspensas: 10,
    semContrato: 0,
  },
} as const

const contratosBsb: AdminClienteContrato[] = [
  {
    id: 'ctr-bsb-1',
    numero: 'CTR-BSB-001/2024',
    dataAssinatura: '15/03/2024',
    dataEncerramento: null,
    tipo: 'pacote_fechado',
    status: 'ativo',
    percentualUtilizado: 72,
    consultasRealizadas: null,
    detalhes: {
      consultasContratadas: 5000,
      valorConsultaPacote: null,
      permiteUltrapassar: true,
      aceitaPacientesOutrosMunicipios: false,
      precosPorProfissao: [
        { professionId: 'prof-medicos', valorConsulta: 95_0 },
        { professionId: 'prof-psicologos', valorConsulta: 110_0 },
      ],
      precosPorEspecialidade: [
        { specialtyId: '4', valorConsulta: 95_0 },
        { specialtyId: '7', valorConsulta: 130_0 },
        { specialtyId: '33', valorConsulta: 110_0 },
      ],
      excedentePrecosPorProfissao: [
        { professionId: 'prof-medicos', valorConsulta: 115_0 },
        { professionId: 'prof-psicologos', valorConsulta: 130_0 },
      ],
      excedentePrecosPorEspecialidade: [
        { specialtyId: '4', valorConsulta: 115_0 },
        { specialtyId: '7', valorConsulta: 150_0 },
        { specialtyId: '33', valorConsulta: 130_0 },
      ],
      especialidadesAutorizadas: ['4', '7', '33'],
    },
  },
  {
    id: 'ctr-bsb-2',
    numero: 'CTR-BSB-002/2026',
    dataAssinatura: '02/01/2026',
    dataEncerramento: null,
    tipo: 'mensal',
    status: 'ativo',
    percentualUtilizado: 48,
    consultasRealizadas: null,
  },
]

const contratosAnapolis: AdminClienteContrato[] = [
  {
    id: 'ctr-ana-1',
    dataAssinatura: '10/11/2025',
    tipo: 'mensal',
    status: 'implantacao',
    percentualUtilizado: 12,
    consultasRealizadas: null,
  },
]

const contratosUberlandia: AdminClienteContrato[] = [
  {
    id: 'ctr-uber-1',
    dataAssinatura: '20/06/2023',
    tipo: 'pacote_fechado',
    status: 'ativo',
    percentualUtilizado: 68,
    consultasRealizadas: null,
  },
]

const contratosCampinas: AdminClienteContrato[] = [
  {
    id: 'ctr-camp-1',
    numero: 'CTR-CAMP-001/2024',
    dataAssinatura: '05/09/2024',
    tipo: 'mensal',
    status: 'ativo',
    percentualUtilizado: 88,
    consultasRealizadas: null,
  },
  {
    id: 'ctr-camp-2',
    numero: 'CTR-CAMP-002/2025',
    dataAssinatura: '18/02/2025',
    tipo: 'sob_demanda',
    status: 'ativo',
    percentualUtilizado: null,
    consultasRealizadas: 1240,
  },
]

const contratosBetim: AdminClienteContrato[] = [
  {
    id: 'ctr-betim-1',
    dataAssinatura: '14/04/2022',
    tipo: 'pacote_fechado',
    status: 'suspenso',
    percentualUtilizado: 102,
    consultasRealizadas: null,
  },
]

const contratosGuarulhos: AdminClienteContrato[] = [
  {
    id: 'ctr-gru-1',
    dataAssinatura: '08/07/2024',
    tipo: 'mensal',
    status: 'ativo',
    percentualUtilizado: 61,
    consultasRealizadas: null,
  },
]

const contratosLuziania: AdminClienteContrato[] = [
  {
    id: 'ctr-luz-1',
    dataAssinatura: '22/10/2025',
    tipo: 'mensal',
    status: 'implantacao',
    percentualUtilizado: 5,
    consultasRealizadas: null,
  },
]

const contratosTaguatinga: AdminClienteContrato[] = [
  {
    id: 'ctr-tag-1',
    dataAssinatura: '30/01/2026',
    tipo: 'pacote_fechado',
    status: 'implantacao',
    percentualUtilizado: 18,
    consultasRealizadas: null,
  },
]

const contratosContagem: AdminClienteContrato[] = []

const contratosOsasco: AdminClienteContrato[] = [
  {
    id: 'ctr-osa-1',
    dataAssinatura: '11/08/2020',
    tipo: 'pacote_fechado',
    status: 'encerrado',
    percentualUtilizado: 100,
    consultasRealizadas: null,
  },
]

export const adminClientesRows: AdminClienteRow[] = [
  {
    id: 'cli-bsb',
    prefeitura: 'Brasília',
    subtitle: 'Prefeitura Municipal',
    razaoSocial: 'Prefeitura do Distrito Federal',
    cnpj: '00.394.460/0001-41',
    municipio: 'Brasília',
    uf: 'DF',
    gestor: { name: 'Ana Paula Ribeiro', email: 'ana.ribeiro@pmdf.df.gov.br' },
    contatoTi: { name: 'Carlos Mendes', email: 'ti.saude@pmdf.df.gov.br' },
    contatoSaude: { name: 'Dra. Fernanda Lima', email: 'fernanda.lima@pmdf.df.gov.br' },
    status: 'ativa',
    logoHue: 24,
    contratos: contratosBsb,
  },
  {
    id: 'cli-anapolis',
    prefeitura: 'Anápolis',
    subtitle: 'Prefeitura Municipal',
    razaoSocial: 'Prefeitura Municipal de Anápolis',
    cnpj: '01.234.567/0001-89',
    municipio: 'Anápolis',
    uf: 'GO',
    gestor: { name: 'João Victor Alves', email: 'joao.alves@anapolis.go.gov.br' },
    contatoTi: { name: 'Marina Costa', email: 'marina.costa@anapolis.go.gov.br' },
    contatoSaude: { name: 'Dr. Ricardo Souza', email: 'ricardo.souza@anapolis.go.gov.br' },
    status: 'implantacao',
    logoHue: 210,
    contratos: contratosAnapolis,
  },
  {
    id: 'cli-uberlandia',
    prefeitura: 'Uberlândia',
    subtitle: 'Prefeitura Municipal',
    razaoSocial: 'Prefeitura Municipal de Uberlândia',
    cnpj: '12.345.678/0001-90',
    municipio: 'Uberlândia',
    uf: 'MG',
    gestor: { name: 'Patrícia Nunes', email: 'patricia.nunes@uberlandia.mg.gov.br' },
    contatoTi: { name: 'Lucas Ferreira', email: 'lucas.ferreira@uberlandia.mg.gov.br' },
    contatoSaude: { name: 'Dra. Helena Martins', email: 'helena.martins@uberlandia.mg.gov.br' },
    status: 'ativa',
    logoHue: 160,
    contratos: contratosUberlandia,
  },
  {
    id: 'cli-campinas',
    prefeitura: 'Campinas',
    subtitle: 'Prefeitura Municipal',
    razaoSocial: 'Prefeitura Municipal de Campinas',
    cnpj: '45.678.901/0001-23',
    municipio: 'Campinas',
    uf: 'SP',
    gestor: { name: 'Roberto Campos', email: 'roberto.campos@campinas.sp.gov.br' },
    contatoTi: { name: 'Juliana Prado', email: 'juliana.prado@campinas.sp.gov.br' },
    contatoSaude: { name: 'Dr. André Mello', email: 'andre.mello@campinas.sp.gov.br' },
    status: 'ativa',
    logoHue: 200,
    contratos: contratosCampinas,
  },
  {
    id: 'cli-betim',
    prefeitura: 'Betim',
    subtitle: 'Prefeitura Municipal',
    razaoSocial: 'Prefeitura Municipal de Betim',
    cnpj: '78.901.234/0001-56',
    municipio: 'Betim',
    uf: 'MG',
    gestor: { name: 'Sandra Oliveira', email: 'sandra.oliveira@betim.mg.gov.br' },
    contatoTi: { name: 'Paulo Henrique', email: 'paulo.henrique@betim.mg.gov.br' },
    contatoSaude: { name: 'Dra. Camila Rocha', email: 'camila.rocha@betim.mg.gov.br' },
    status: 'suspensa',
    logoHue: 0,
    contratos: contratosBetim,
  },
  {
    id: 'cli-guarulhos',
    prefeitura: 'Guarulhos',
    subtitle: 'Prefeitura Municipal',
    razaoSocial: 'Prefeitura Municipal de Guarulhos',
    cnpj: '34.567.890/0001-12',
    municipio: 'Guarulhos',
    uf: 'SP',
    gestor: { name: 'Marcos Teixeira', email: 'marcos.teixeira@guarulhos.sp.gov.br' },
    contatoTi: { name: 'Beatriz Araújo', email: 'beatriz.araujo@guarulhos.sp.gov.br' },
    contatoSaude: { name: 'Dr. Felipe Gomes', email: 'felipe.gomes@guarulhos.sp.gov.br' },
    status: 'ativa',
    logoHue: 280,
    contratos: contratosGuarulhos,
  },
  {
    id: 'cli-luziania',
    prefeitura: 'Luziânia',
    subtitle: 'Prefeitura Municipal',
    razaoSocial: 'Prefeitura Municipal de Luziânia',
    cnpj: '56.789.012/0001-34',
    municipio: 'Luziânia',
    uf: 'GO',
    gestor: { name: 'Eduardo Pires', email: 'eduardo.pires@luziania.go.gov.br' },
    contatoTi: { name: 'Amanda Dias', email: 'amanda.dias@luziania.go.gov.br' },
    contatoSaude: { name: 'Dra. Luiza Cardoso', email: 'luiza.cardoso@luziania.go.gov.br' },
    status: 'prospect',
    logoHue: 270,
    contratos: contratosLuziania,
  },
  {
    id: 'cli-taguatinga',
    prefeitura: 'Taguatinga',
    subtitle: 'Administração Regional',
    razaoSocial: 'Administração Regional de Taguatinga',
    cnpj: '00.394.460/0002-22',
    municipio: 'Brasília',
    uf: 'DF',
    gestor: { name: 'Cláudio Menezes', email: 'claudio.menezes@pmdf.df.gov.br' },
    contatoTi: { name: 'Renata Freitas', email: 'renata.freitas@pmdf.df.gov.br' },
    contatoSaude: { name: 'Dra. Viviane Torres', email: 'viviane.torres@pmdf.df.gov.br' },
    status: 'implantacao',
    logoHue: 30,
    contratos: contratosTaguatinga,
  },
  {
    id: 'cli-contagem',
    prefeitura: 'Contagem',
    subtitle: 'Prefeitura Municipal',
    razaoSocial: 'Prefeitura Municipal de Contagem',
    cnpj: '90.123.456/0001-78',
    municipio: 'Contagem',
    uf: 'MG',
    gestor: { name: 'Helena Borges', email: 'helena.borges@contagem.mg.gov.br' },
    contatoTi: { name: 'Thiago Nascimento', email: 'thiago.nascimento@contagem.mg.gov.br' },
    contatoSaude: { name: 'Dr. Gustavo Pinto', email: 'gustavo.pinto@contagem.mg.gov.br' },
    status: 'sem_contrato',
    logoHue: 120,
    contratos: contratosContagem,
  },
  {
    id: 'cli-osasco',
    prefeitura: 'Osasco',
    subtitle: 'Prefeitura Municipal',
    razaoSocial: 'Prefeitura Municipal de Osasco',
    cnpj: '11.222.333/0001-44',
    municipio: 'Osasco',
    uf: 'SP',
    gestor: { name: 'Isabela Moura', email: 'isabela.moura@osasco.sp.gov.br' },
    contatoTi: { name: 'Diego Santana', email: 'diego.santana@osasco.sp.gov.br' },
    contatoSaude: { name: 'Dra. Priscila Almeida', email: 'priscila.almeida@osasco.sp.gov.br' },
    status: 'sem_contrato',
    logoHue: 340,
    contratos: contratosOsasco,
  },
]

export function filterAdminClientesByTab(
  rows: AdminClienteRow[],
  tab: AdminClientesTab,
): AdminClienteRow[] {
  if (tab === 'implantacao') {
    return rows.filter((row) => row.status === 'implantacao')
  }
  if (tab === 'prospect') {
    return rows.filter((row) => row.status === 'prospect')
  }
  return rows.filter(
    (row) =>
      row.status === 'ativa' ||
      row.status === 'suspensa' ||
      row.status === 'sem_contrato',
  )
}

