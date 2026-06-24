import type {
  MyRoutineOnboardingRecord,
  MyRoutineTask,
  MyRoutineTemplateId,
  MyRoutineTimeBlock,
} from '../types/myRoutine'

export type MyRoutineTemplateDefinition = {
  id: MyRoutineTemplateId
  label: string
  description: string
  baseTasks: Omit<MyRoutineTask, 'id' | 'status'>[]
}

function taskSeed(
  partial: Omit<MyRoutineTask, 'id' | 'status'>,
): Omit<MyRoutineTask, 'id' | 'status'> {
  return partial
}

export const MY_ROUTINE_TEMPLATES: Record<MyRoutineTemplateId, MyRoutineTemplateDefinition> = {
  'day-busy': {
    id: 'day-busy',
    label: 'Dia corrido',
    description: 'Pouco tempo, foco no essencial entre compromissos.',
    baseTasks: [
      taskSeed({
        title: 'Tomar remédios',
        category: 'medicine',
        scheduleType: 'fixed',
        time: '08:00',
        priority: 'essential',
        block: 'morning',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
      }),
      taskSeed({
        title: 'Caminhada curta',
        category: 'exercise',
        scheduleType: 'window',
        windowStart: '12:00',
        windowEnd: '14:00',
        priority: 'desirable',
        block: 'afternoon',
        linkedModule: 'run-walk',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5] },
      }),
      taskSeed({
        title: 'Preparar para dormir',
        category: 'sleep',
        scheduleType: 'trigger',
        triggerLabel: '1h antes de deitar',
        priority: 'essential',
        block: 'evening',
        linkedModule: 'sleep-time',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
      }),
    ],
  },
  'with-children': {
    id: 'with-children',
    label: 'Com filhos',
    description: 'Rotina em torno da família e autocuido em janelas curtas.',
    baseTasks: [
      taskSeed({
        title: 'Check-in emocional',
        category: 'self-care',
        scheduleType: 'window',
        windowStart: '07:00',
        windowEnd: '09:00',
        priority: 'essential',
        block: 'morning',
        linkedModule: 'mental-health-checkin',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
      }),
      taskSeed({
        title: 'Registrar almoço',
        category: 'meal',
        scheduleType: 'window',
        windowStart: '11:30',
        windowEnd: '14:00',
        priority: 'desirable',
        block: 'afternoon',
        linkedModule: 'eat-well-log',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
      }),
      taskSeed({
        title: 'Pausa de 10 minutos',
        category: 'self-care',
        scheduleType: 'trigger',
        triggerLabel: 'Quando os filhos dormirem',
        priority: 'desirable',
        block: 'evening',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
      }),
    ],
  },
  'health-focus': {
    id: 'health-focus',
    label: 'Foco em saúde',
    description: 'Hábitos de saúde física e mental distribuídos no dia.',
    baseTasks: [
      taskSeed({
        title: 'Check-in de saúde mental',
        category: 'health',
        scheduleType: 'window',
        windowStart: '07:00',
        windowEnd: '10:00',
        priority: 'essential',
        block: 'morning',
        linkedModule: 'mental-health-checkin',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
      }),
      taskSeed({
        title: 'Movimento leve',
        category: 'exercise',
        scheduleType: 'window',
        windowStart: '17:00',
        windowEnd: '19:00',
        priority: 'essential',
        block: 'afternoon',
        linkedModule: 'run-walk',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5] },
      }),
      taskSeed({
        title: 'Registrar refeição principal',
        category: 'meal',
        scheduleType: 'trigger',
        triggerLabel: 'Depois do almoço',
        priority: 'desirable',
        block: 'afternoon',
        linkedModule: 'eat-well-log',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
      }),
    ],
  },
  'post-consultation': {
    id: 'post-consultation',
    label: 'Pós-consulta',
    description: 'Seguir orientações médicas e check-ins de acompanhamento.',
    baseTasks: [
      taskSeed({
        title: 'Tomar medicação prescrita',
        category: 'medicine',
        scheduleType: 'fixed',
        time: '08:00',
        priority: 'essential',
        block: 'morning',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
      }),
      taskSeed({
        title: 'Check-in pós-consulta',
        category: 'health',
        scheduleType: 'window',
        windowStart: '18:00',
        windowEnd: '21:00',
        priority: 'essential',
        block: 'evening',
        linkedModule: 'my-appointments',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
      }),
      taskSeed({
        title: 'Anotar sintomas do dia',
        category: 'health',
        scheduleType: 'trigger',
        triggerLabel: 'Antes de dormir',
        priority: 'desirable',
        block: 'evening',
        recurrence: { daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
      }),
    ],
  },
}

export function resolveMyRoutineTemplate(
  record: Pick<MyRoutineOnboardingRecord, 'selectedTemplateId'>,
): MyRoutineTemplateDefinition {
  const id = record.selectedTemplateId ?? 'day-busy'
  return MY_ROUTINE_TEMPLATES[id] ?? MY_ROUTINE_TEMPLATES['day-busy']
}

export function tasksFromIdealLabels(
  labels: string[],
  priority: MyRoutineTask['priority'],
  block: MyRoutineTimeBlock,
): Omit<MyRoutineTask, 'id' | 'status'>[] {
  return labels.map((title) =>
    taskSeed({
      title,
      category: 'other',
      scheduleType: 'window',
      windowStart: '09:00',
      windowEnd: '12:00',
      priority,
      block,
      recurrence: { daysOfWeek: [1, 2, 3, 4, 5] },
    }),
  )
}
