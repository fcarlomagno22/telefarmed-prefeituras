import type { ProfissionalQueuePatient } from '../../types/profissionalAgenda'

/**
 * Une pacientes da agenda (check-in UBT) com consultas operacionais (sala de espera / atendimento).
 * A API operacional usa `consultas.id`; a agenda usa `agenda_consultas.id` — ligamos por `agendaConsultaId`.
 */
export function mergeOperationalFilaWithAgendaQueue(
  agendaPatients: ProfissionalQueuePatient[],
  operationalPatients: ProfissionalQueuePatient[],
): ProfissionalQueuePatient[] {
  const agendaById = new Map(agendaPatients.map((patient) => [patient.id, patient]))
  const consumedAgendaIds = new Set<string>()

  const fromOperational = operationalPatients.map((operational) => {
    const agendaMatch =
      operational.agendaConsultaId != null
        ? agendaById.get(operational.agendaConsultaId)
        : undefined

    if (agendaMatch) {
      consumedAgendaIds.add(agendaMatch.id)
    }

    return {
      ...(agendaMatch ?? {}),
      ...operational,
      id: operational.id,
      shiftId: operational.shiftId || agendaMatch?.shiftId || operational.shiftId,
      patientAge: operational.patientAge || agendaMatch?.patientAge || 0,
      patientCpf:
        operational.patientCpf && operational.patientCpf !== '—'
          ? operational.patientCpf
          : agendaMatch?.patientCpf ?? '—',
      ubtName:
        operational.ubtName && operational.ubtName !== '—'
          ? operational.ubtName
          : agendaMatch?.ubtName ?? '—',
      triageReason: operational.triageReason || agendaMatch?.triageReason || '',
      scheduledTime: agendaMatch?.scheduledTime ?? operational.scheduledTime,
      origin: agendaMatch?.origin ?? operational.origin,
      arrivedAt: operational.arrivedAt || agendaMatch?.arrivedAt || operational.arrivedAt,
    }
  })

  const agendaOnly = agendaPatients.filter(
    (patient) =>
      !consumedAgendaIds.has(patient.id) &&
      !operationalPatients.some((operational) => operational.id === patient.id) &&
      (patient.status === 'chamado' || patient.status === 'em_atendimento') &&
      !/-q\d+$/.test(patient.id),
  )

  return [...fromOperational, ...agendaOnly]
}
