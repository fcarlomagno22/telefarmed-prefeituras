import type { WaitingQueueEntry } from '../types/waitingQueue'
import { nextConsultations } from './dashboardMock'

const todayIso = new Date().toISOString()

/** Fila inicial de demonstração (derivada de nextConsultations + espontâneos). */
export const waitingQueueInitialEntries: WaitingQueueEntry[] = [
  ...nextConsultations.map((item, index) => ({
    id: `fila-mock-${item.id}`,
    pacienteId: `pac-mock-${item.id}`,
    appointmentId: `agenda-mock-${item.id}`,
    patientName: item.patient,
    patientCpf: `${String(100 + index).padStart(3, '0')}.${String(200 + index).padStart(3, '0')}.${String(300 + index).padStart(3, '0')}-${String(10 + index).padStart(2, '0')}`,
    patientPhone: `(12) 9${String(8000 + index).padStart(4, '0')}-${String(1000 + index).padStart(4, '0')}`,
    serviceType: item.specialty,
    specialtyId: item.specialty.toLowerCase().replace(/\s+/g, '-'),
    scheduledTime: item.time,
    origin: 'agendado' as const,
    arrivedAt: todayIso,
    status: (index === 0 ? 'chamado' : 'aguardando') as WaitingQueueEntry['status'],
  })),
  {
    id: 'fila-mock-walkin-1',
    pacienteId: 'pac-mock-walkin-1',
    patientName: 'Roberto Almeida',
    patientCpf: '321.654.987-00',
    patientPhone: '(12) 99123-4567',
    serviceType: 'Clínico Geral',
    specialtyId: 'clinico-geral',
    origin: 'espontaneo',
    arrivedAt: todayIso,
    status: 'aguardando',
  },
]
