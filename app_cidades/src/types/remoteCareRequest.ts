export type RemoteCareRequestStatus = 'under_review' | 'approved' | 'rejected'

export type RemoteCareRequest = {
  id: string
  patientCpf: string
  protocol: string
  reason: string
  status: RemoteCareRequestStatus
  createdAt: string
  reviewedAt?: string
  teleconsultationLink?: string
  teleconsultationLabel?: string
}
