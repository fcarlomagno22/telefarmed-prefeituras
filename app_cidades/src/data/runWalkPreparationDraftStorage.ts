import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ActivityModality } from '../types/auth'
import {
  deleteRunWalkPreparacaoRascunho,
  getRunWalkPreparacaoRascunho,
  putRunWalkPreparacaoRascunho,
} from '../lib/api/vd/runWalk'

const DRAFT_KEY = '@telefarmed/run-walk/preparation-draft'
const REMOTE_SYNC_DEBOUNCE_MS = 800

export type PreparationDraft = {
  modality: ActivityModality
  activityName: string
  intensity: string
  durationMinutes: number
  audioConfigured: boolean
}

let remoteSaveTimer: ReturnType<typeof setTimeout> | null = null

function isGuestPatient(patientCpf?: string) {
  return !patientCpf || patientCpf === 'guest'
}

function mapRemoteDraftToLocal(
  draft: NonNullable<Awaited<ReturnType<typeof getRunWalkPreparacaoRascunho>>['draft']>,
): PreparationDraft {
  return {
    modality: draft.modality,
    activityName: draft.activityName,
    intensity: draft.intensity,
    durationMinutes: draft.durationMinutes,
    audioConfigured: draft.audioConfigured,
  }
}

async function writeLocalDraft(draft: PreparationDraft) {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

async function readLocalDraft(): Promise<PreparationDraft | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PreparationDraft
  } catch {
    return null
  }
}

function scheduleRemoteSave(draft: PreparationDraft) {
  if (remoteSaveTimer) clearTimeout(remoteSaveTimer)
  remoteSaveTimer = setTimeout(() => {
    void putRunWalkPreparacaoRascunho(draft).catch(() => {
      // Mantém cache local se o servidor estiver indisponível.
    })
  }, REMOTE_SYNC_DEBOUNCE_MS)
}

export async function savePreparationDraft(
  draft: PreparationDraft,
  patientCpf?: string,
): Promise<void> {
  await writeLocalDraft(draft)

  if (isGuestPatient(patientCpf)) return
  scheduleRemoteSave(draft)
}

export async function loadPreparationDraft(
  patientCpf?: string,
): Promise<PreparationDraft | null> {
  const localDraft = await readLocalDraft()

  if (isGuestPatient(patientCpf)) {
    return localDraft
  }

  try {
    const remote = await getRunWalkPreparacaoRascunho()
    if (remote.draft) {
      const mapped = mapRemoteDraftToLocal(remote.draft)
      await writeLocalDraft(mapped)
      return mapped
    }
  } catch {
    // Fallback para rascunho local offline.
  }

  return localDraft
}

export async function clearPreparationDraft(patientCpf?: string): Promise<void> {
  if (remoteSaveTimer) {
    clearTimeout(remoteSaveTimer)
    remoteSaveTimer = null
  }

  await AsyncStorage.removeItem(DRAFT_KEY)

  if (isGuestPatient(patientCpf)) return

  try {
    await deleteRunWalkPreparacaoRascunho()
  } catch {
    // Ignora falha remota; rascunho local já foi removido.
  }
}
