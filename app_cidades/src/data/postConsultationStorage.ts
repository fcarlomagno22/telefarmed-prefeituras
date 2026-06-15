import AsyncStorage from '@react-native-async-storage/async-storage'
import type { PosConsultaCheckinRespostas } from '../types/posConsulta'

const STORAGE_KEY = '@telefarmed/pos-consulta-responses'

export type StoredPosConsultaResponse = {
  checkinId: string
  appointmentProtocol: string
  patientCpf: string
  respostas: PosConsultaCheckinRespostas
  respondedAtIso: string
}

export async function loadPosConsultaResponses(
  patientCpf: string,
): Promise<StoredPosConsultaResponse[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as StoredPosConsultaResponse[]
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item) => item.patientCpf === patientCpf)
  } catch {
    return []
  }
}

export async function savePosConsultaResponse(entry: StoredPosConsultaResponse) {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  let all: StoredPosConsultaResponse[] = []

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StoredPosConsultaResponse[]
      if (Array.isArray(parsed)) {
        all = parsed.filter(
          (item) =>
            !(
              item.patientCpf === entry.patientCpf &&
              item.checkinId === entry.checkinId
            ),
        )
      }
    } catch {
      all = []
    }
  }

  all.push(entry)
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}
