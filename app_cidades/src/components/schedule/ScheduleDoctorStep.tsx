import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  fetchDoctorSlots,
  fetchDoctorsAvailableOnDay,
  fetchDoctorTotalUpcoming,
  searchScheduleDoctors,
} from '../../data/mockScheduleCatalog'
import { ScheduleDoctor, ScheduleViewMode } from '../../types/scheduleAppointment'
import {
  formatScheduleDayLabel,
  getScheduleStartDate,
  SCHEDULE_DAY_COUNT,
  toDateKey,
} from '../../utils/scheduleDate'
import { colors } from '../../theme/colors'
import { ScheduleSelectableCard } from './ScheduleSelectableCard'
import { ScheduleDoctorListSkeleton } from './ScheduleStepSkeletons'
import { ScheduleStepTitle } from './ScheduleStepTitle'

type ScheduleDoctorStepProps = {
  specialtyId: string
  specialtyName: string
  mode: ScheduleViewMode
  selectedDate?: Date
  selectedDoctorId: string
  onSelectDoctor: (id: string, name: string) => void
  onBack?: () => void
}

export function ScheduleDoctorStep({
  specialtyId,
  specialtyName,
  mode,
  selectedDate,
  selectedDoctorId,
  onSelectDoctor,
  onBack,
}: ScheduleDoctorStepProps) {
  const [doctorSearch, setDoctorSearch] = useState('')
  const [doctors, setDoctors] = useState<ScheduleDoctor[]>([])
  const [slotCounts, setSlotCounts] = useState<Map<string, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  const scheduleStart = useMemo(() => getScheduleStartDate(), [])
  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : ''

  useEffect(() => {
    if (!specialtyId) {
      setIsLoading(false)
      return
    }

    let active = true
    setIsLoading(true)

    if (mode === 'by_day' && selectedDate) {
      void fetchDoctorsAvailableOnDay(specialtyId, selectedDate)
        .then(async (list) => {
          if (!active) return
          setDoctors(list)
          const entries = await Promise.all(
            list.map(async (doctor) => {
              const slots = await fetchDoctorSlots(doctor.id, selectedDate)
              return [doctor.id, slots.filter((s) => s.available).length] as const
            }),
          )
          if (active) setSlotCounts(new Map(entries))
        })
        .catch(() => {
          if (active) {
            setDoctors([])
            setSlotCounts(new Map())
          }
        })
        .finally(() => {
          if (active) setIsLoading(false)
        })
    } else if (mode === 'by_doctor') {
      const list = searchScheduleDoctors(doctorSearch, specialtyId)
      setDoctors(list)
      void Promise.all(
        list.map(async (doctor) => {
          const total = await fetchDoctorTotalUpcoming(
            doctor.id,
            scheduleStart,
            SCHEDULE_DAY_COUNT,
          )
          return [doctor.id, total] as const
        }),
      )
        .then((entries) => {
          if (active) setSlotCounts(new Map(entries))
        })
        .catch(() => {
          if (active) setSlotCounts(new Map())
        })
        .finally(() => {
          if (active) setIsLoading(false)
        })
    } else {
      setDoctors([])
      setSlotCounts(new Map())
      setIsLoading(false)
    }

    return () => {
      active = false
    }
  }, [specialtyId, mode, selectedDateKey, doctorSearch, scheduleStart])

  const title = mode === 'by_day' ? 'Escolha o médico' : 'Escolha o profissional'
  const description =
    mode === 'by_day' && selectedDate
      ? `Profissionais com horário livre em ${formatScheduleDayLabel(selectedDate)}.`
      : `Busque o médico de ${specialtyName} para ver a agenda.`

  function renderSlotsBadge(count: number, selected: boolean) {
    return (
      <View style={[styles.slotsBadge, selected && styles.slotsBadgeSelected]}>
        <Text style={[styles.slotsBadgeText, selected && styles.slotsBadgeTextSelected]}>
          {count > 0 ? `${count} ${count === 1 ? 'vaga' : 'vagas'}` : 'Sem vagas'}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <ScheduleStepTitle title={title} onBack={onBack} />
      <Text style={styles.description}>{description}</Text>

      {mode === 'by_doctor' ? (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textSubtle} />
          <TextInput
            value={doctorSearch}
            onChangeText={setDoctorSearch}
            placeholder="Nome, CRM ou especialidade..."
            placeholderTextColor={colors.textSubtle}
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>
      ) : null}

      {isLoading ? (
        <ScheduleDoctorListSkeleton withSearch={mode === 'by_doctor'} />
      ) : doctors.length === 0 ? (
        <Text style={styles.emptyHint}>
          {mode === 'by_day'
            ? 'Nenhum médico com horário nesta data. Volte e escolha outro dia.'
            : 'Nenhum médico encontrado para esta especialidade.'}
        </Text>
      ) : (
        <View style={styles.list}>
          {doctors.map((doctor) => {
            const isSelected = doctor.id === selectedDoctorId
            const count = slotCounts.get(doctor.id) ?? 0
            const largeAvatar = mode === 'by_doctor'

            return (
              <ScheduleSelectableCard
                key={doctor.id}
                selected={isSelected}
                onPress={() => onSelectDoctor(doctor.id, doctor.name)}
              >
                <Image
                  source={{ uri: doctor.avatarUrl }}
                  style={largeAvatar ? styles.avatarLg : styles.avatar}
                />
                <View style={styles.info}>
                  <Text style={[styles.name, isSelected && styles.nameSelected]}>
                    {doctor.name}
                  </Text>
                  <Text style={[styles.crm, isSelected && styles.crmSelected]}>
                    {doctor.crm}
                  </Text>
                  {mode === 'by_doctor' ? (
                    <View style={styles.ratingRow}>
                      <Ionicons
                        name="star"
                        size={12}
                        color={isSelected ? '#fde68a' : '#fbbf24'}
                      />
                      <Text style={[styles.rating, isSelected && styles.ratingSelected]}>
                        {doctor.rating.toFixed(1)} ({doctor.reviewCount})
                      </Text>
                    </View>
                  ) : null}
                </View>
                {renderSlotsBadge(count, isSelected)}
              </ScheduleSelectableCard>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
    paddingVertical: 24,
  },
  list: {
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarLg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  nameSelected: {
    color: '#fff',
  },
  crm: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  crmSelected: {
    color: 'rgba(255, 255, 255, 0.82)',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rating: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
  ratingSelected: {
    color: 'rgba(255, 255, 255, 0.82)',
  },
  slotsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  slotsBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  slotsBadgeText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
  },
  slotsBadgeTextSelected: {
    color: '#fff',
  },
})
