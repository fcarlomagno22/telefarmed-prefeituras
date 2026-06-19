import { PublicPlantaoAceiteError } from './errors.js'
import { resolveConviteByToken } from './convite.service.js'
import { assertSlotInDigest, resolveDigestByToken } from './digest.service.js'

export async function resolveAceiteSlotId(input: {
  token: string
  slotId?: string
}): Promise<string> {
  const slotId = input.slotId?.trim()

  if (slotId) {
    const digest = await resolveDigestByToken(input.token)
    await assertSlotInDigest(digest, slotId)
    return slotId
  }

  try {
    const convite = await resolveConviteByToken(input.token)
    return convite.slot_id
  } catch (error) {
    if (error instanceof PublicPlantaoAceiteError && error.code === 'NOT_FOUND') {
      throw new PublicPlantaoAceiteError(
        'Informe a vaga que deseja aceitar.',
        'INVALID_DATA',
        400,
      )
    }
    throw error
  }
}
