import { buildLiveShareDemoSession } from '../../../data/runWalkLiveSharePublicMock'
import type { LiveShareSessionPublicResult } from '../../../types/runWalkLiveSharePublic'

const MOCK_DELAY_MS = 500

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function mockFetchLiveShareSession(): Promise<LiveShareSessionPublicResult> {
  await delay(MOCK_DELAY_MS)
  return buildLiveShareDemoSession()
}
