export type RemoteCareRequestPayload = {
  reason: string
  evidenceUri: string
  patientCpf?: string
  patientName?: string
  patientPhone?: string
}

export async function submitRemoteCareRequest(payload: RemoteCareRequestPayload): Promise<'sent'> {
  const { createRemoteCareRequest } = await import('../data/mockRemoteCareRequests')

  await new Promise((resolve) => setTimeout(resolve, 600))

  if (payload.patientCpf) {
    await createRemoteCareRequest(payload.patientCpf, payload.reason)
  }

  if (__DEV__) {
    console.log('[remoteCareRequest] submitted', {
      reason: payload.reason.trim(),
      evidenceUri: payload.evidenceUri,
      patientCpf: payload.patientCpf,
      patientName: payload.patientName,
    })
  }

  return 'sent'
}
