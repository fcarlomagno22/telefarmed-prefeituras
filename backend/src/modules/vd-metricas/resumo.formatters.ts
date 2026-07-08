import type { MetricasPerfilDto, MetricasResumoDto, MetricasResumoLatestDto } from './types.js'

export function buildMetricasResumoLatestDto(input: {
  profile: MetricasPerfilDto
  pesoKg: number | null
  glicemiaMgDl: number | null
  pressaoSistolica: number | null
  pressaoDiastolica: number | null
  hidratacaoMlHoje: number | null
  circunferenciaAbdomenCm: number | null
  frequenciaBpm: number | null
  passosHoje: number | null
  distanciaKmHoje: number | null
}): MetricasResumoLatestDto {
  return {
    pesoKg: input.pesoKg,
    imc: input.profile.imc,
    imcZone: input.profile.imcZone,
    glicemiaMgDl: input.glicemiaMgDl,
    pressaoSistolica: input.pressaoSistolica,
    pressaoDiastolica: input.pressaoDiastolica,
    hidratacaoMlHoje: input.hidratacaoMlHoje,
    circunferenciaAbdomenCm: input.circunferenciaAbdomenCm,
    frequenciaBpm: input.frequenciaBpm,
    passosHoje: input.passosHoje,
    distanciaKmHoje: input.distanciaKmHoje,
  }
}

export function buildMetricasResumoDto(input: {
  profile: MetricasPerfilDto
  profileComplete: boolean
  latest: MetricasResumoLatestDto
}): MetricasResumoDto {
  return {
    profile: input.profile,
    profileComplete: input.profileComplete,
    latest: input.latest,
  }
}
