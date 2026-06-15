import { Ionicons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { fetchScheduleSpecialties } from '../../data/mockScheduleCatalog'
import { ScheduleSpecialty } from '../../types/scheduleAppointment'
import { colors } from '../../theme/colors'
import {
  ScheduleCardCheck,
  ScheduleCardIcon,
  ScheduleSelectableCard,
} from './ScheduleSelectableCard'
import { ScheduleSpecialtyListSkeleton } from './ScheduleStepSkeletons'

type ScheduleSpecialtyStepProps = {
  selectedId: string
  onSelect: (id: string, name: string) => void
}

export function ScheduleSpecialtyStep({ selectedId, onSelect }: ScheduleSpecialtyStepProps) {
  const [search, setSearch] = useState('')
  const [specialties, setSpecialties] = useState<ScheduleSpecialty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setLoadError(null)

    void fetchScheduleSpecialties()
      .then((result) => {
        if (!active) return
        setSpecialties(result)
      })
      .catch(() => {
        if (!active) return
        setLoadError('Não foi possível carregar as especialidades.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return specialties
    return specialties.filter((item) => item.name.toLowerCase().includes(query))
  }, [search, specialties])

  function handleRetry() {
    setIsLoading(true)
    setLoadError(null)
    void fetchScheduleSpecialties()
      .then(setSpecialties)
      .catch(() => setLoadError('Não foi possível carregar as especialidades.'))
      .finally(() => setIsLoading(false))
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Escolha a especialidade</Text>
      <Text style={styles.description}>
        Selecione a área médica do seu contrato. Depois você define data, profissional e horário.
      </Text>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textSubtle} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar especialidade..."
          placeholderTextColor={colors.textSubtle}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {isLoading ? (
        <ScheduleSpecialtyListSkeleton />
      ) : loadError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable onPress={handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma especialidade encontrada.</Text>
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => {
            const isSelected = item.id === selectedId
            const hasSlots = item.availableSlots > 0

            return (
              <ScheduleSelectableCard
                key={item.id}
                selected={isSelected}
                onPress={() => onSelect(item.id, item.name)}
              >
                <ScheduleCardIcon selected={isSelected} icon="stethoscope" />
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.cardMeta, isSelected && styles.cardMetaSelected]}>
                    {hasSlots
                      ? `${item.availableSlots} vagas nos próximos 30 dias`
                      : 'Sem vagas no período'}
                  </Text>
                </View>
                <ScheduleCardCheck selected={isSelected} />
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
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
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
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 10,
  },
  errorWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.35)',
  },
  retryText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 32,
  },
  list: {
    gap: 8,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  cardTitleSelected: {
    color: '#fff',
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  cardMetaSelected: {
    color: 'rgba(255, 255, 255, 0.82)',
  },
})
