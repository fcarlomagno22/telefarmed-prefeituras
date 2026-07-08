import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { findTodayActivityPresetById } from './plano.formatters.js'
import {
  getRunWalkPlanoHoje,
  postRunWalkPlanoHojeAcao,
  putRunWalkPlanoHoje,
  type PlanoServiceDeps,
} from './plano.service.js'
import type { RunWalkPlanoDiarioRow } from './plano.formatters.js'
import type { VdRunWalkPacienteScope } from './types.js'

const TODAY = '2026-07-08'
const NOW = new Date('2026-07-08T15:00:00.000-03:00')

const scope: VdRunWalkPacienteScope = {
  pacienteId: 'pac-1',
  entidadeContratanteId: 'ent-1',
  cpf: '12345678901',
}

function mockPlanoRow(overrides: Partial<RunWalkPlanoDiarioRow> = {}): RunWalkPlanoDiarioRow {
  return {
    id: 'row-1',
    paciente_id: scope.pacienteId,
    entidade_contratante_id: scope.entidadeContratanteId,
    plano_date: TODAY,
    preset_id: null,
    activity_type: null,
    title: null,
    duration_minutes: null,
    intensity: null,
    intensity_label: null,
    audio_guidance: false,
    selected_activity: null,
    menu_state: {},
    skipped: false,
    ...overrides,
  }
}

function createDeps(overrides?: Partial<PlanoServiceDeps>): PlanoServiceDeps {
  let stored: RunWalkPlanoDiarioRow | null = null

  return {
    resolveTodayDateKey: () => TODAY,
    findPlanoByDate: async () => stored,
    upsertPlano: async (_scope, _date, payload) => {
      stored = mockPlanoRow({
        preset_id: payload.preset_id,
        activity_type: payload.activity_type,
        title: payload.title,
        duration_minutes: payload.duration_minutes,
        intensity: payload.intensity,
        intensity_label: payload.intensity_label,
        audio_guidance: payload.audio_guidance,
        selected_activity: payload.selected_activity,
        menu_state: payload.menu_state,
        skipped: payload.skipped,
      })
      return stored
    },
    ...overrides,
  }
}

describe('getRunWalkPlanoHoje', () => {
  it('retorna presets e plano vazio sem registro', async () => {
    const result = await getRunWalkPlanoHoje(scope, NOW, createDeps())

    assert.equal(result.hasTodayActivity, false)
    assert.equal(result.activity, null)
    assert.equal(result.selectedActivityId, null)
    assert.equal(result.presets.length, 6)
  })

  it('retorna atividade selecionada do dia', async () => {
    const deps = createDeps()
    await deps.upsertPlano!(scope, TODAY, {
      preset_id: 'beginner-run-walk',
      skipped: false,
      menu_state: {},
      ...(() => {
        const activity = findTodayActivityPresetById('beginner-run-walk')!.activity
        return {
          activity_type: activity.type,
          title: activity.title,
          duration_minutes: activity.durationMinutes,
          intensity: activity.intensity,
          intensity_label: activity.intensityLabel,
          audio_guidance: activity.audioGuidance,
          selected_activity: activity,
        }
      })(),
    })

    const result = await getRunWalkPlanoHoje(scope, NOW, deps)

    assert.equal(result.hasTodayActivity, true)
    assert.equal(result.selectedPresetId, 'beginner-run-walk')
    assert.equal(result.selectedActivityId, 'today-beginner-run-walk')
    assert.equal(result.activity?.type, 'run-walk')
  })
})

describe('putRunWalkPlanoHoje', () => {
  it('seleciona preset e persiste snapshot', async () => {
    const deps = createDeps()
    const result = await putRunWalkPlanoHoje(
      scope,
      { presetId: 'light-walk' },
      NOW,
      deps,
    )

    assert.equal(result.hasTodayActivity, true)
    assert.equal(result.selectedPresetId, 'light-walk')
    assert.equal(result.activity?.id, 'today-light-walk')
  })

  it('customiza campos sobre preset existente', async () => {
    const deps = createDeps()
    await putRunWalkPlanoHoje(scope, { presetId: 'quick-activity' }, NOW, deps)

    const result = await putRunWalkPlanoHoje(
      scope,
      { activity: { durationMinutes: 12, title: 'Rápida ajustada' } },
      NOW,
      deps,
    )

    assert.equal(result.activity?.durationMinutes, 12)
    assert.equal(result.activity?.title, 'Rápida ajustada')
  })
})

describe('postRunWalkPlanoHojeAcao', () => {
  it('aplica ação do menu e retorna notice', async () => {
    const deps = createDeps()
    await putRunWalkPlanoHoje(scope, { presetId: 'easy-run' }, NOW, deps)

    const result = await postRunWalkPlanoHojeAcao(scope, 'reduce-duration', NOW, deps)

    assert.equal(result.activity?.durationMinutes, 25)
    assert.match(result.notice ?? '', /Duração reduzida/)
  })

  it('falha quando não há plano do dia', async () => {
    await assert.rejects(
      () => postRunWalkPlanoHojeAcao(scope, 'skip', NOW, createDeps()),
      (error: Error) => error.message.includes('Nenhum plano de hoje'),
    )
  })
})
