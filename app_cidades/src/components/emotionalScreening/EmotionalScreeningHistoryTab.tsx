import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { loadEmotionalScreeningRecord } from '../../data/emotionalScreeningStorage'
import { loadTdahTodSessions } from '../../data/tdahTodInfantilStorage'
import { loadScaredSessions } from '../../data/scaredInfantilStorage'
import { EMOTIONAL_SCREENING_DISCLAIMER } from '../../types/emotionalScreening'
import { getSeverityColor } from '../../utils/emotionalScreeningScoring'
import { colors } from '../../theme/colors'
import {
  type EmotionalScreeningHistoryItem,
  getScreeningClassificationColor,
} from './emotionalScreeningHistoryTypes'

type EmotionalScreeningHistoryTabProps = {
  bottomPadding: number
  patientCpf: string
  refreshKey: number
  onOpenSession: (item: EmotionalScreeningHistoryItem) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mergeHistoryItems(
  emotionalSessions: Awaited<ReturnType<typeof loadEmotionalScreeningRecord>>['sessions'],
  tdahSessions: Awaited<ReturnType<typeof loadTdahTodSessions>>,
  scaredSessions: Awaited<ReturnType<typeof loadScaredSessions>>,
): EmotionalScreeningHistoryItem[] {
  const items: EmotionalScreeningHistoryItem[] = [
    ...emotionalSessions.map((session) => ({
      kind: 'emotional' as const,
      completedAt: session.completedAt,
      session,
    })),
    ...tdahSessions.map((session) => ({
      kind: 'tdah-tod' as const,
      completedAt: session.completedAt,
      session,
    })),
    ...scaredSessions.map((session) => ({
      kind: 'scared' as const,
      completedAt: session.completedAt,
      session,
    })),
  ]

  return items.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  )
}

export function EmotionalScreeningHistoryTab({
  bottomPadding,
  patientCpf,
  refreshKey,
  onOpenSession,
}: EmotionalScreeningHistoryTabProps) {
  const [items, setItems] = useState<EmotionalScreeningHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function load() {
    const [record, tdahSessions, scaredSessions] = await Promise.all([
      loadEmotionalScreeningRecord(patientCpf),
      loadTdahTodSessions(patientCpf),
      loadScaredSessions(patientCpf),
    ])
    setItems(mergeHistoryItems(record.sessions, tdahSessions, scaredSessions))
    setIsLoading(false)
  }

  useEffect(() => {
    void load()
  }, [patientCpf, refreshKey])

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          tintColor={colors.textMuted}
          onRefresh={() => {
            setIsRefreshing(true)
            void load().finally(() => setIsRefreshing(false))
          }}
        />
      }
    >
      {isLoading ? (
        <Text style={styles.emptyText}>Carregando histórico...</Text>
      ) : items.length === 0 ? (
        <View style={styles.emptyBox}>
          <MaterialCommunityIcons name="clipboard-text-clock-outline" size={34} color={colors.textSubtle} />
          <Text style={styles.emptyTitle}>Nenhuma triagem ainda</Text>
          <Text style={styles.emptyText}>
            Quando você concluir uma triagem, o relatório ficará salvo aqui para consulta.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            if (item.kind === 'emotional') {
              const { session } = item
              const toneColor = getSeverityColor(session.result.band.tone)
              return (
                <Pressable
                  key={session.id}
                  accessibilityRole="button"
                  onPress={() => onOpenSession(item)}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{session.instrumentTitle}</Text>
                    <Text style={[styles.band, { color: toneColor }]}>{session.result.band.label}</Text>
                  </View>
                  <Text style={styles.cardDate}>{formatDate(session.completedAt)}</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {session.result.band.description}
                  </Text>
                  <Text style={styles.cardAction}>Ver relatório</Text>
                </Pressable>
              )
            }

            if (item.kind === 'tdah-tod') {
              const { session } = item
              const toneColor = getScreeningClassificationColor(session.result.classificationId)
              const title = session.childName
                ? `Atenção e comportamento — ${session.childName}`
                : 'Atenção e comportamento'

              return (
                <Pressable
                  key={session.id}
                  accessibilityRole="button"
                  onPress={() => onOpenSession(item)}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={[styles.band, { color: toneColor }]}>
                      {session.result.classificationLabel}
                    </Text>
                  </View>
                  <Text style={styles.cardDate}>{formatDate(session.completedAt)}</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {session.result.headline}
                  </Text>
                  <Text style={styles.cardAction}>Ver relatório</Text>
                </Pressable>
              )
            }

            const { session } = item
            const toneColor = getScreeningClassificationColor(session.result.classificationId)
            const title = session.childName
              ? `Ansiedade infantil — ${session.childName}`
              : 'Ansiedade infantil'

            return (
              <Pressable
                key={session.id}
                accessibilityRole="button"
                onPress={() => onOpenSession(item)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{title}</Text>
                  <Text style={[styles.band, { color: toneColor }]}>
                    {session.result.classificationLabel}
                  </Text>
                </View>
                <Text style={styles.cardDate}>{formatDate(session.completedAt)}</Text>
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {session.result.headline}
                </Text>
                <Text style={styles.cardAction}>Ver relatório</Text>
              </Pressable>
            )
          })}
        </View>
      )}

      <Text style={styles.disclaimer}>{EMOTIONAL_SCREENING_DISCLAIMER}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: 'rgba(16, 16, 20, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  band: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardDate: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  cardAction: {
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
  },
  disclaimer: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
  },
})
