import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  FileSignature,
  HeartPulse,
  Network,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { ReportCategoryId } from '../config/reportsCategories'
export type PrefeituraRelatorioCatalogItem = {
  id: string
  name: string
  description: string
}

export type PrefeituraRelatorioCategoryCard = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  iconClass: string
  categoryId: ReportCategoryId
  reports: PrefeituraRelatorioCatalogItem[]
}

export type PrefeituraRelatorioMostAccessed = {
  rank: number
  label: string
  count: number
  trend: 'up' | 'down' | 'flat'
}

export const PREFEITURA_RELATORIOS_DISPONIVEIS = 188

export const prefeituraRelatorioCategoryCards: PrefeituraRelatorioCategoryCard[] = [
  {
    id: 'operacao-rede',
    title: 'Operação da rede',
    description:
      'Indicadores de produção, fluxo de pacientes, agenda e desempenho comparativo das UBTs.',
    icon: Network,
    iconClass: 'bg-orange-50 text-orange-600',
    categoryId: 'posto',
    reports: [
      {
        id: 'producao-unidade',
        name: 'Produção por unidade',
        description:
          'Volume de consultas realizadas por UBT no período, com comparativo entre unidades e evolução diária ou mensal.',
      },
      {
        id: 'fila-espera-abandono',
        name: 'Fila, espera e abandono',
        description:
          'Tempo médio de espera, tamanho da fila e taxa de abandono antes ou durante o atendimento no terminal.',
      },
      {
        id: 'agenda-comparecimento',
        name: 'Agenda vs comparecimento',
        description:
          'Relação entre horários agendados e consultas efetivamente realizadas, incluindo faltas e remarcações.',
      },
      {
        id: 'ranking-ubts',
        name: 'Ranking de UBTs',
        description:
          'Classificação das unidades por produção, eficiência operacional e cumprimento de metas da rede municipal.',
      },
      {
        id: 'fluxo-terminal',
        name: 'Fluxo do terminal',
        description:
          'Jornada do paciente no terminal de autoatendimento: chegada, triagem, encaminhamento e conclusão da consulta.',
      },
    ],
  },
  {
    id: 'demanda-especialidades',
    title: 'Demanda e especialidades',
    description:
      'Análise da demanda clínica, ocupação da agenda e horários de maior pressão por especialidade.',
    icon: Stethoscope,
    iconClass: 'bg-sky-50 text-sky-600',
    categoryId: 'consultas',
    reports: [
      {
        id: 'demanda-especialidade',
        name: 'Demanda por especialidade',
        description:
          'Distribuição das consultas solicitadas e realizadas entre especialidades médicas e de apoio.',
      },
      {
        id: 'capacidade-ocupacao',
        name: 'Capacidade x ocupação',
        description:
          'Comparativo entre vagas disponíveis na agenda e taxa de utilização por especialidade ou unidade.',
      },
      {
        id: 'encaminhamentos-encaixes',
        name: 'Encaminhamentos e encaixes',
        description:
          'Volume de encaixes, encaminhamentos internos e consultas fora do fluxo regular da agenda.',
      },
      {
        id: 'horarios-pico',
        name: 'Horários de pico',
        description:
          'Faixas horárias e dias da semana com maior concentração de demanda e fila de espera.',
      },
      {
        id: 'medicos-plantao',
        name: 'Médicos em plantão',
        description:
          'Profissionais escalados, consultas realizadas por plantão e aderência à cobertura contratada.',
      },
    ],
  },
  {
    id: 'qualidade-assistencial',
    title: 'Qualidade assistencial',
    description:
      'Métricas de qualidade clínica, estabilidade das consultas e percepção do cidadão atendido.',
    icon: HeartPulse,
    iconClass: 'bg-violet-50 text-violet-600',
    categoryId: 'medicos',
    reports: [
      {
        id: 'duracao-media',
        name: 'Duração média das consultas',
        description:
          'Tempo médio de atendimento por especialidade, profissional ou unidade, com outliers e desvios.',
      },
      {
        id: 'interrupcoes-reconexoes',
        name: 'Interrupções e reconexões',
        description:
          'Ocorrências de queda de chamada, reconexões e impacto na conclusão das teleconsultas.',
      },
      {
        id: 'avaliacoes-atendimentos',
        name: 'Avaliações dos atendimentos',
        description:
          'Notas e comentários registrados pelos pacientes após a consulta, agregados por período e unidade.',
      },
      {
        id: 'satisfacao-cidadao',
        name: 'Satisfação do cidadão',
        description:
          'Indicadores consolidados de satisfação com o serviço, incluindo NPS e tendências de melhoria ou queda.',
      },
      {
        id: 'unidades-criticas',
        name: 'Unidades críticas',
        description:
          'UBTs ou especialidades abaixo dos parâmetros mínimos de qualidade e que exigem plano de ação.',
      },
    ],
  },
  {
    id: 'pacientes-cadastro',
    title: 'Pacientes e cadastro',
    description:
      'Panorama da base cadastral, cobertura territorial e engajamento dos pacientes da rede.',
    icon: Users,
    iconClass: 'bg-emerald-50 text-emerald-600',
    categoryId: 'usuarios',
    reports: [
      {
        id: 'novos-cadastros',
        name: 'Novos cadastros',
        description:
          'Entrada de novos pacientes no sistema por período, unidade de origem e canal de cadastramento.',
      },
      {
        id: 'cadastros-incompletos',
        name: 'Cadastros incompletos',
        description:
          'Registros com campos obrigatórios pendentes que podem impedir agendamento ou continuidade do cuidado.',
      },
      {
        id: 'pacientes-inativos',
        name: 'Pacientes inativos',
        description:
          'Usuários sem consulta ou interação há determinado tempo, útil para campanhas de reengajamento.',
      },
      {
        id: 'perfil-territorial',
        name: 'Perfil territorial',
        description:
          'Distribuição da base por região, bairro ou território de saúde vinculado à prefeitura.',
      },
      {
        id: 'retornos-pendentes',
        name: 'Retornos pendentes',
        description:
          'Pacientes com retorno programado ainda não agendados ou não realizados dentro do prazo clínico.',
      },
    ],
  },
  {
    id: 'contrato-indicadores',
    title: 'Contrato e indicadores',
    description:
      'Acompanhamento do pacote contratado, consumo financeiro e projeções para a gestão municipal.',
    icon: FileSignature,
    iconClass: 'bg-amber-50 text-amber-700',
    categoryId: 'gestao',
    reports: [
      {
        id: 'consumo-pacote',
        name: 'Consumo do pacote contratado',
        description:
          'Utilização do pacote mensal de consultas previsto em contrato, com saldo e percentual consumido.',
      },
      {
        id: 'consultas-avulsas',
        name: 'Consultas avulsas',
        description:
          'Atendimentos realizados além do pacote contratado e impacto financeiro no período.',
      },
      {
        id: 'projecao-estouro',
        name: 'Projeção de estouro',
        description:
          'Estimativa de consumo até o fim do ciclo e risco de ultrapassar o limite contratual.',
      },
      {
        id: 'cobertura-territorial',
        name: 'Cobertura territorial',
        description:
          'Relação entre população atendida, UBTs ativas e abrangência geográfica do contrato municipal.',
      },
      {
        id: 'resumo-impacto',
        name: 'Resumo de impacto',
        description:
          'Síntese executiva de consumo, custos adicionais e indicadores-chave para decisão da gestão.',
      },
    ],
  },
]

export const prefeituraRelatorioMostAccessed: PrefeituraRelatorioMostAccessed[] = [
  { rank: 1, label: 'Produção por unidade', count: 1250, trend: 'up' },
  { rank: 2, label: 'Demanda por especialidade', count: 980, trend: 'up' },
  { rank: 3, label: 'Consumo do pacote contratado', count: 860, trend: 'flat' },
  { rank: 4, label: 'Fila, espera e abandono', count: 720, trend: 'down' },
  { rank: 5, label: 'Satisfação do cidadão', count: 610, trend: 'up' },
]

export type PrefeituraRelatorioRegisteredEmail = {
  address: string
  role: string
}

export const prefeituraRelatorioRegisteredEmails: PrefeituraRelatorioRegisteredEmail[] = [
  { address: 'gestao@prefeitura.gov.br', role: 'Gestão municipal' },
  { address: 'controlador@prefeitura.gov.br', role: 'Controladoria' },
  { address: 'secretaria@saude.gov.br', role: 'Secretaria de Saúde' },
]

export const prefeituraRelatorioTrendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Activity,
} as const
