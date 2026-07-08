import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  aggregatePesoLeituras,
  formatDateKeyInAppTz,
  formatPesoValue,
  resolvePesoPeriodBounds,
  shouldIncludeHourInPesoSeries,
} from './peso.formatters.js'

describe('peso.formatters', () => {
  it('formata valor de peso com uma casa decimal', () => {
    assert.equal(formatPesoValue(78), 78)
    assert.equal(formatPesoValue(78.44), 78.4)
  })

  it('extrai date key no fuso America/Sao_Paulo', () => {
    assert.equal(formatDateKeyInAppTz('2026-07-08T02:30:00.000Z'), '2026-07-07')
    assert.equal(formatDateKeyInAppTz('2026-07-08T12:00:00.000-03:00'), '2026-07-08')
  })

  it('resolve período padrão de 90 dias quando start/end ausentes', () => {
    const bounds = resolvePesoPeriodBounds({
      end: '2026-07-08T23:59:59.999-03:00',
    })

    const start = new Date(bounds.startIso)
    const end = new Date(bounds.endIso)
    const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))

    assert.ok(diffDays >= 89 && diffDays <= 90)
  })

  it('detecta período horário quando start e end caem no mesmo dia', () => {
    assert.equal(
      shouldIncludeHourInPesoSeries(
        '2026-07-08T08:00:00.000-03:00',
        '2026-07-08T20:00:00.000-03:00',
      ),
      true,
    )
    assert.equal(
      shouldIncludeHourInPesoSeries(
        '2026-07-07T08:00:00.000-03:00',
        '2026-07-08T20:00:00.000-03:00',
      ),
      false,
    )
  })

  it('agrega leituras mantendo a última do dia', () => {
    const points = aggregatePesoLeituras(
      [
        { registrado_em: '2026-07-08T08:00:00.000-03:00', valor: 79.2 },
        { registrado_em: '2026-07-08T18:00:00.000-03:00', valor: 78.4 },
        { registrado_em: '2026-07-09T09:00:00.000-03:00', valor: 78 },
      ],
      false,
    )

    assert.deepEqual(points, [
      { date: '2026-07-08', value: 78.4 },
      { date: '2026-07-09', value: 78 },
    ])
  })

  it('inclui hora nas leituras de período de um único dia', () => {
    const points = aggregatePesoLeituras(
      [
        { registrado_em: '2026-07-08T08:00:00.000-03:00', valor: 79.2 },
        { registrado_em: '2026-07-08T18:00:00.000-03:00', valor: 78.4 },
      ],
      true,
    )

    assert.equal(points.length, 2)
    assert.equal(points[0]?.hour, 8)
    assert.equal(points[1]?.hour, 18)
  })
})
