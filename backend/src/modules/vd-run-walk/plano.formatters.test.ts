import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyActivityMenuActionToActivity,
  buildEmptyPlanoHojeDto,
  buildPlanoHojeDto,
  buildUpsertPlanoFromMenuAction,
  buildUpsertPlanoFromPutInput,
  findTodayActivityPresetById,
  listTodayActivityPresets,
  parseSelectedActivitySnapshot,
  resolveTodayActivityFromPlanoRow,
  type RunWalkPlanoDiarioRow,
} from './plano.formatters.js'

function mockPlanoRow(overrides: Partial<RunWalkPlanoDiarioRow> = {}): RunWalkPlanoDiarioRow {
  return {
    id: 'row-1',
    paciente_id: 'pac-1',
    entidade_contratante_id: 'ent-1',
    plano_date: '2026-07-08',
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

describe('plano.formatters', () => {
  it('expõe 6 presets estáticos migrados do app', () => {
    const presets = listTodayActivityPresets()
    assert.equal(presets.length, 6)
    assert.equal(presets[0]?.id, 'quick-activity')
    assert.equal(presets[5]?.id, 'easy-run')
    assert.equal(findTodayActivityPresetById('beginner-run-walk')?.activity.id, 'today-beginner-run-walk')
  })

  it('retorna plano vazio sem registro do dia', () => {
    const empty = buildEmptyPlanoHojeDto()
    assert.equal(empty.hasTodayActivity, false)
    assert.equal(empty.activity, null)
    assert.equal(empty.selectedActivityId, null)
    assert.equal(empty.presets.length, 6)
  })

  it('resolve atividade a partir de preset_id', () => {
    const activity = resolveTodayActivityFromPlanoRow(
      mockPlanoRow({ preset_id: 'active-walk' }),
    )

    assert.equal(activity?.id, 'today-walk')
    assert.equal(activity?.title, 'Caminhada ativa')
  })

  it('prioriza snapshot selected_activity sobre preset_id', () => {
    const snapshot = findTodayActivityPresetById('quick-activity')?.activity
    assert.ok(snapshot)

    const customized = {
      ...snapshot,
      durationMinutes: 8,
      title: 'Atividade rápida personalizada',
    }

    const activity = resolveTodayActivityFromPlanoRow(
      mockPlanoRow({
        preset_id: 'quick-activity',
        selected_activity: customized,
      }),
    )

    assert.equal(activity?.durationMinutes, 8)
    assert.equal(activity?.title, 'Atividade rápida personalizada')
  })

  it('marca hasTodayActivity false quando skipped', () => {
    const result = buildPlanoHojeDto(
      mockPlanoRow({ preset_id: 'active-walk', skipped: true }),
    )

    assert.equal(result.hasTodayActivity, false)
    assert.equal(result.activity, null)
    assert.equal(result.selectedPresetId, 'active-walk')
  })

  it('rejeita snapshot inválido em selected_activity', () => {
    assert.equal(parseSelectedActivitySnapshot({ id: 'x' }), null)
    assert.equal(
      parseSelectedActivitySnapshot(findTodayActivityPresetById('quick-activity')?.activity)?.id,
      'today-quick-activity',
    )
  })

  it('monta upsert a partir de presetId', () => {
    const payload = buildUpsertPlanoFromPutInput(null, { presetId: 'beginner-run-walk' })
    assert.equal(payload.preset_id, 'beginner-run-walk')
    assert.equal(payload.skipped, false)
    assert.equal(payload.selected_activity?.id, 'today-beginner-run-walk')
  })

  it('aplica reduce-duration como no mock do app', () => {
    const base = findTodayActivityPresetById('easy-run')!.activity
    const next = applyActivityMenuActionToActivity(base, 'reduce-duration')
    assert.equal(next.durationMinutes, 25)
    assert.equal(next.intensity, 'comfortable')
  })

  it('aplica swap-walk mantendo id da atividade atual', () => {
    const base = findTodayActivityPresetById('easy-run')!.activity
    const next = applyActivityMenuActionToActivity(base, 'swap-walk')
    assert.equal(next.id, base.id)
    assert.equal(next.type, 'walk')
    assert.equal(next.title, 'Caminhada ativa')
  })

  it('persiste skip e remove-today no plano diário', () => {
    const existing = mockPlanoRow({
      preset_id: 'active-walk',
      selected_activity: findTodayActivityPresetById('active-walk')?.activity ?? null,
      activity_type: 'walk',
    })

    const skipped = buildUpsertPlanoFromMenuAction(existing, 'skip', '2026-07-08T10:00:00.000-03:00')
    assert.equal(skipped.skipped, true)

    const removed = buildUpsertPlanoFromMenuAction(
      existing,
      'remove-today',
      '2026-07-08T10:00:00.000-03:00',
    )
    assert.equal(removed.skipped, false)
    assert.equal(removed.preset_id, null)
    assert.equal(removed.selected_activity, null)
  })
})
