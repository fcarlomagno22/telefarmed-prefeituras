import {
  patchRunWalkAtividadeCheckin,
  registerRunWalkAtividade,
} from '../lib/api/vd/runWalk'
import type { RunWalkActivityCheckIn } from '../types/runWalkActivityCheckIn'
import { mapSummaryToCreateInput, mergeSummaryWithDto } from '../utils/runWalkAtividadeMappers'
import {
  loadRunWalkActivitySummary,
  updateRunWalkActivitySummary,
  type RunWalkActivitySummary,
} from './runWalkActivitySummaryStorage'

export type SubmitRunWalkActivityCheckinInput =
  | {
      checkIn: RunWalkActivityCheckIn
      checkInSkipped: false
    }
  | {
      checkIn: null
      checkInSkipped: true
    }

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

function mapSummaryToRegisterInput(summary: RunWalkActivitySummary) {
  return {
    ...mapSummaryToCreateInput(summary),
    checkIn: null,
    checkInSkipped: false,
  }
}

/** Garante que a atividade exista no servidor antes do PATCH de check-in. */
export async function ensureRunWalkActivityRegistered(
  summary: RunWalkActivitySummary,
): Promise<RunWalkActivitySummary> {
  if (isGuestPatient(summary.patientCpf) || summary.serverId) {
    return summary
  }

  const result = await registerRunWalkAtividade(mapSummaryToRegisterInput(summary))
  return mergeSummaryWithDto(summary, result.activity)
}

/** Prepara resumo local para check-in (registra atividade em background quando possível). */
export async function prepareRunWalkActivityCheckin(
  summaryId: string,
): Promise<RunWalkActivitySummary | null> {
  const summary = await loadRunWalkActivitySummary(summaryId)
  if (!summary || isGuestPatient(summary.patientCpf) || summary.serverId) {
    return summary
  }

  try {
    const registered = await ensureRunWalkActivityRegistered(summary)
    return (
      (await updateRunWalkActivitySummary(summaryId, {
        serverId: registered.serverId,
      })) ?? registered
    )
  } catch {
    return summary
  }
}

/**
 * Persiste check-in no storage local (staging) e sincroniza via PATCH quando houver serverId.
 * Se a atividade ainda não existir no servidor, registra antes do PATCH.
 */
export async function submitRunWalkActivityCheckin(
  summaryId: string,
  input: SubmitRunWalkActivityCheckinInput,
): Promise<RunWalkActivitySummary | null> {
  const staged =
    (await updateRunWalkActivitySummary(summaryId, {
      checkIn: input.checkIn,
      checkInSkipped: input.checkInSkipped,
    })) ?? null

  if (!staged) return null
  if (isGuestPatient(staged.patientCpf)) return staged

  try {
    const registered = await ensureRunWalkActivityRegistered(staged)
    const withServerId =
      (await updateRunWalkActivitySummary(summaryId, {
        serverId: registered.serverId,
      })) ?? registered

    if (!withServerId.serverId) {
      return withServerId
    }

    const patchResult = await patchRunWalkAtividadeCheckin(
      withServerId.serverId,
      input.checkInSkipped ? { checkInSkipped: true } : { checkIn: input.checkIn },
    )

    const merged = mergeSummaryWithDto(withServerId, patchResult.activity)
    return (
      (await updateRunWalkActivitySummary(summaryId, {
        serverId: merged.serverId,
        checkIn: merged.checkIn,
        checkInSkipped: merged.checkInSkipped,
      })) ?? merged
    )
  } catch {
    return staged
  }
}
