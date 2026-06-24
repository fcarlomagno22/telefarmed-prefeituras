export type ScheduleCareMode = 'in_person' | 'remote'

export type ScheduleAppointmentStep =
  | 'care_mode'
  | 'remote_request'
  | 'remote_success'
  | 'specialty'
  | 'ubt'
  | 'schedule_mode'
  | 'schedule_date'
  | 'schedule_doctor'
  | 'schedule_time'
  | 'confirm'
  | 'success'

export type ScheduleViewMode = 'by_day' | 'by_doctor'

export type ScheduleSpecialty = {
  id: string
  name: string
  availableSlots: number
}

export type ScheduleDoctor = {
  id: string
  name: string
  specialtyId: string
  specialtyName: string
  avatarUrl: string
  crm: string
  rating: number
  reviewCount: number
}

export type ScheduleTimeSlot = {
  time: string
  available: boolean
  bookedReason?: string
}

export type ScheduleAppointmentDraft = {
  specialtyId: string
  specialtyName: string
  selectedUbtId: string
  selectedUbtName: string
  selectedUbtAddress: string
  selectedDate: Date
  selectedDoctorId: string
  selectedDoctorName: string
  selectedTime: string
}
