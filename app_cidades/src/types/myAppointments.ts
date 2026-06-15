export type AppointmentStatus =
  | 'confirmed'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type StoredAppointment = {
  id: string
  protocol: string
  patientCpf: string
  status: AppointmentStatus
  specialtyId: string
  specialtyName: string
  selectedUbtId: string
  selectedUbtName: string
  selectedUbtAddress: string
  selectedDate: string
  selectedDoctorId: string
  selectedDoctorName: string
  selectedTime: string
  createdAt: string
  durationMinutes?: number
  cancelledAt?: string
  cancelReason?: string
}

export type MyAppointmentsTab = 'upcoming' | 'history'

export type CreateAppointmentPayload = {
  specialtyId: string
  specialtyName: string
  selectedUbtId: string
  selectedUbtName: string
  selectedUbtAddress: string
  selectedDate: string
  selectedDoctorId: string
  selectedDoctorName: string
  selectedTime: string
}
