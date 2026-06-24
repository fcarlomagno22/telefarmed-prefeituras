export type RemoteCareRequestStatus = 'under_review' | 'approved' | 'rejected'

export type RemoteCareUrgencyLevel = 'routine' | 'moderate' | 'high'

export type RemoteCareRequest = {
  id: string
  patientCpf: string
  protocol: string
  specialtyId: string
  specialtyName: string
  urgencyLevel: RemoteCareUrgencyLevel
  reason: string
  status: RemoteCareRequestStatus
  createdAt: string
  reviewedAt?: string
  teleconsultationLink?: string
  teleconsultationLabel?: string
}
