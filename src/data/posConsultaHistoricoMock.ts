import { brand } from '../config/brand'
import type { ProfissionalConsultaHistoricoItem } from '../types/posConsultaHistorico'
import { PROFISSIONAL_HISTORICO_DEMO_PACIENTE_ID } from '../config/profissionalHistoricoDemo'

const TRIAGE_IVAS = `Motivo: Tosse seca e dor de garganta
Início: Há 2 dias
Intensidade: Moderado (6/10)
Sintomas: Tosse, dor de garganta, mal-estar
Detalhes: Sem febre aferida na UBT
Crônicas: nenhuma informada
Pressão arterial: 118/76 mmHg
Temperatura: 36.8 °C
Medicamentos contínuos: não usa
Alergias: nega`

const TRIAGE_HAS = `Motivo: Pressão elevada na aferição da UBT
Início: Hoje
Intensidade: Leve (3/10)
Sintomas: Cefaleia leve, tontura ocasional
Crônicas: Hipertensão arterial
Medicação para pressão: sim
Pressão arterial: 158/98 mmHg
Glicemia: 102 mg/dL
Medicamentos:
1. Losartana 50 mg — 1x ao dia
2. Hidroclorotiazida 25 mg — 1x ao dia
Alergias: nega`

const TRIAGE_ABDOMINAL = `Motivo: Dor abdominal difusa
Início: Ontem
Intensidade: Moderado (5/10)
Sintomas: Dor abdominal, náusea
Detalhes: Sem vômitos, sem diarreia
Crônicas: nenhuma informada
Pressão arterial: 122/80 mmHg
Temperatura: 36.5 °C
Medicamentos contínuos: não usa`

export const mockProfissionalHistoricoByPaciente: Record<
  string,
  { patientName: string; specialty: string; consultas: ProfissionalConsultaHistoricoItem[] }
> = {
  [PROFISSIONAL_HISTORICO_DEMO_PACIENTE_ID]: {
    patientName: 'Maria Souza Lima',
    specialty: 'Clínica Médica',
    consultas: [
      {
        consultaId: 'consulta-hist-001',
        attendanceId: 'ATD-20260515-021',
        dateTimeIso: '2026-05-15T10:20:00',
        dateTimeLabel: '15/05/2026 · 10:20',
        doctorName: 'Dra. Ana Paula Ferreira',
        specialty: 'Clínica Médica',
        status: 'concluido',
        triageSummary: TRIAGE_IVAS,
        issuedDocuments: [
          {
            id: 'hist-d1',
            kind: 'receita',
            title: 'Receita médica',
            signedAtLabel: '10:38',
          },
          {
            id: 'hist-d2',
            kind: 'orientacao',
            title: 'Orientações pós-consulta',
            signedAtLabel: '10:39',
          },
        ],
        posConsultaCheckins: [
          {
            id: 'chk-h1-1',
            checkinNumber: 1,
            planDayNumber: 3,
            respondedAtLabel: '18/05/2026 · 08:40',
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 4,
            medicacaoAdesao: 'sim',
            summary: 'Tosse reduziu · tomou medicação · intensidade 4/10',
          },
          {
            id: 'chk-h1-2',
            checkinNumber: 2,
            planDayNumber: 6,
            respondedAtLabel: '21/05/2026 · 09:12',
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 2,
            medicacaoAdesao: 'sim',
            summary: 'Quase assintomática · medicação em dia',
          },
          {
            id: 'chk-h1-3',
            checkinNumber: 3,
            planDayNumber: 9,
            respondedAtLabel: '24/05/2026 · 07:55',
            evolucaoComparacao: 'igual',
            intensidadeSintoma: 2,
            medicacaoAdesao: 'parcial',
            summary: 'Estável · esqueceu dose em 1 dia',
          },
        ],
      },
      {
        consultaId: 'consulta-hist-002',
        attendanceId: 'ATD-20260428-004',
        dateTimeIso: '2026-04-28T14:05:00',
        dateTimeLabel: '28/04/2026 · 14:05',
        doctorName: brand.profissionalOperatorName,
        specialty: 'Clínica Médica',
        status: 'concluido',
        triageSummary: TRIAGE_HAS,
        issuedDocuments: [
          {
            id: 'hist-d3',
            kind: 'receita',
            title: 'Receita médica',
            signedAtLabel: '14:28',
          },
          {
            id: 'hist-d4',
            kind: 'pedido_exame',
            title: 'Pedido de exames',
            signedAtLabel: '14:29',
          },
        ],
        posConsultaCheckins: [
          {
            id: 'chk-h2-1',
            checkinNumber: 1,
            planDayNumber: 3,
            respondedAtLabel: '01/05/2026 · 10:00',
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 2,
            medicacaoAdesao: 'sim',
            summary: 'PA 138/88 · melhorou · medicação ok',
          },
          {
            id: 'chk-h2-2',
            checkinNumber: 2,
            planDayNumber: 6,
            respondedAtLabel: '04/05/2026 · 09:30',
            evolucaoComparacao: 'igual',
            intensidadeSintoma: 2,
            medicacaoAdesao: 'sim',
            summary: 'Estável · PA 132/84',
          },
          {
            id: 'chk-h2-3',
            checkinNumber: 3,
            planDayNumber: 9,
            respondedAtLabel: '07/05/2026 · 08:15',
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 1,
            medicacaoAdesao: 'sim',
            summary: 'Sem cefaleia · medicação em dia',
          },
          {
            id: 'chk-h2-4',
            checkinNumber: 4,
            planDayNumber: 12,
            respondedAtLabel: '10/05/2026 · 11:02',
            evolucaoComparacao: 'igual',
            intensidadeSintoma: 1,
            medicacaoAdesao: 'sim',
            summary: 'Manteve estabilidade',
          },
        ],
      },
      {
        consultaId: 'consulta-hist-003',
        attendanceId: 'ATD-20260410-011',
        dateTimeIso: '2026-04-10T09:40:00',
        dateTimeLabel: '10/04/2026 · 09:40',
        doctorName: 'Dr. Carlos Eduardo Moraes',
        specialty: 'Clínica Médica',
        status: 'concluido',
        triageSummary: TRIAGE_ABDOMINAL,
        issuedDocuments: [
          {
            id: 'hist-d5',
            kind: 'receita',
            title: 'Receita médica',
            signedAtLabel: '09:58',
          },
          {
            id: 'hist-d6',
            kind: 'atestado',
            title: 'Atestado médico',
            signedAtLabel: '09:59',
          },
        ],
        posConsultaCheckins: [
          {
            id: 'chk-h3-1',
            checkinNumber: 1,
            planDayNumber: 3,
            respondedAtLabel: '13/04/2026 · 08:20',
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 3,
            medicacaoAdesao: 'sim',
            summary: 'Dor abdominal em melhora',
          },
          {
            id: 'chk-h3-2',
            checkinNumber: 2,
            planDayNumber: 6,
            respondedAtLabel: '16/04/2026 · 09:05',
            evolucaoComparacao: 'melhorou',
            intensidadeSintoma: 0,
            medicacaoAdesao: 'sim',
            summary: 'Assintomática · medicação concluída',
          },
        ],
      },
    ],
  },
}

/** Mapeia nomes usados em sessões mock para o paciente demo. */
export const mockProfissionalHistoricoPatientNameAliases: Record<string, string> = {
  'Patricia Souza Lima': PROFISSIONAL_HISTORICO_DEMO_PACIENTE_ID,
  'Maria Souza Lima': PROFISSIONAL_HISTORICO_DEMO_PACIENTE_ID,
}

export function getMockProfissionalHistoricoCheckinsForConsulta(consultaId: string) {
  for (const entry of Object.values(mockProfissionalHistoricoByPaciente)) {
    const consulta = entry.consultas.find((item) => item.consultaId === consultaId)
    if (consulta) return consulta.posConsultaCheckins
  }
  return []
}

export function getMockProfissionalHistoricoConsulta(consultaId: string) {
  for (const entry of Object.values(mockProfissionalHistoricoByPaciente)) {
    const consulta = entry.consultas.find((item) => item.consultaId === consultaId)
    if (consulta) return consulta
  }
  return null
}
