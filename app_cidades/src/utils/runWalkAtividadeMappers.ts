import type { ActivityModality } from '../types/auth'
import type { RunWalkActivityCheckIn } from '../types/runWalkActivityCheckIn'
import type {
  CreateRunWalkAtividadeInput,
  RunWalkAtividadeDetailDto,
  RunWalkAtividadeDto,
  RunWalkAtividadeSummaryDto,
  RunWalkTrailPointDto,
} from '../lib/api/vd/runWalk'
import type { RunWalkActivitySummary } from '../data/runWalkActivitySummaryStorage'
import type { ActivityTrailPoint } from './runWalkActivityStats'

function mapTrailPoint(point: RunWalkTrailPointDto): ActivityTrailPoint {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    recordedAt: point.recordedAt,
  }
}

function mapCheckIn(
  checkIn: RunWalkAtividadeDto['checkIn'],
): RunWalkActivityCheckIn | null | undefined {
  if (checkIn == null) return checkIn
  return {
    intensity: checkIn.intensity as RunWalkActivityCheckIn['intensity'],
    wellbeing: checkIn.wellbeing as RunWalkActivityCheckIn['wellbeing'],
    discomfort: checkIn.discomfort as RunWalkActivityCheckIn['discomfort'],
    note: checkIn.note,
    answeredAt: checkIn.answeredAt,
  }
}

export function mapAtividadeDtoToSummary(
  dto: RunWalkAtividadeSummaryDto | RunWalkAtividadeDto,
  patientCpf: string,
  trailOverride?: ActivityTrailPoint[],
): RunWalkActivitySummary {
  const trailFromDto =
    'trail' in dto && Array.isArray(dto.trail)
      ? dto.trail.map(mapTrailPoint)
      : 'trailSimplified' in dto && Array.isArray(dto.trailSimplified)
        ? dto.trailSimplified.map(mapTrailPoint)
        : []

  return {
    id: dto.clientActivityId || dto.id,
    serverId: dto.id,
    patientCpf,
    modality: dto.modality as ActivityModality,
    activityName: dto.activityName,
    elapsedSeconds: dto.elapsedSeconds,
    distanceKm: dto.distanceKm,
    averageSpeedKmh: dto.averageSpeedKmh,
    paceMinPerKm: dto.paceMinPerKm,
    stepCount: dto.stepCount,
    heartRateBpm: dto.heartRateBpm,
    estimatedCalories: dto.estimatedCalories,
    activeMinutes: dto.activeMinutes,
    completedAt: dto.completedAt,
    trail: trailOverride && trailOverride.length > 0 ? trailOverride : trailFromDto,
    locationCity: dto.locationCity,
    locationState: dto.locationState,
    checkIn: mapCheckIn(dto.checkIn),
    checkInSkipped: dto.checkInSkipped,
  }
}

export function mapSummaryToCreateInput(
  summary: RunWalkActivitySummary,
): CreateRunWalkAtividadeInput {
  return {
    clientActivityId: summary.id,
    modality: summary.modality,
    activityName: summary.activityName,
    elapsedSeconds: summary.elapsedSeconds,
    distanceKm: summary.distanceKm,
    averageSpeedKmh: summary.averageSpeedKmh,
    paceMinPerKm: summary.paceMinPerKm,
    stepCount: summary.stepCount,
    heartRateBpm: summary.heartRateBpm,
    estimatedCalories: summary.estimatedCalories,
    activeMinutes: summary.activeMinutes,
    completedAt: summary.completedAt,
    trail: summary.trail.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
      recordedAt: point.recordedAt,
    })),
    trailPointCount: summary.trail.length,
    locationCity: summary.locationCity ?? null,
    locationState: summary.locationState ?? null,
    checkIn: summary.checkIn ?? null,
    checkInSkipped: summary.checkInSkipped,
  }
}

export function mergeSummaryWithDto(
  local: RunWalkActivitySummary,
  dto: RunWalkAtividadeDto,
): RunWalkActivitySummary {
  const merged = mapAtividadeDtoToSummary(dto, local.patientCpf, local.trail)
  return {
    ...merged,
    id: local.id,
    serverId: dto.id,
    trail: merged.trail.length > 0 ? merged.trail : local.trail,
    locationCity: merged.locationCity ?? local.locationCity,
    locationState: merged.locationState ?? local.locationState,
    checkIn: merged.checkIn ?? local.checkIn,
    checkInSkipped: merged.checkInSkipped ?? local.checkInSkipped,
  }
}

export function mapDetailDtoToSummary(
  dto: RunWalkAtividadeDetailDto,
  patientCpf: string,
): RunWalkActivitySummary {
  return mapAtividadeDtoToSummary(dto, patientCpf)
}
