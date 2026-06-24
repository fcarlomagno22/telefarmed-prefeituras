import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  EMOTIONAL_SCREENING_AUDIENCE_LABELS,
  EMOTIONAL_SCREENING_DISCLAIMER,
  type EmotionalScreeningAudience,
  type EmotionalScreeningInstrument,
  type EmotionalScreeningInstrumentId,
} from '../../types/emotionalScreening'
import { EMOTIONAL_SCREENING_INSTRUMENTS } from '../../config/emotionalScreening/instruments'
import { colors } from '../../theme/colors'

const AUDIENCE_ORDER: EmotionalScreeningAudience[] = [
  'adult_adolescent',
  'child_adolescent',
  'early_childhood',
]

type EmotionalScreeningTestsTabProps = {
  bottomPadding: number
  onSelectInstrument: (instrumentId: EmotionalScreeningInstrumentId) => void
}

function InstrumentCard({
  instrument,
  onPress,
}: {
  instrument: EmotionalScreeningInstrument
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={instrument.title}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <LinearGradient colors={[...instrument.accent]} style={styles.cardIcon}>
        <MaterialCommunityIcons
          name={instrument.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={22}
          color="#fff"
        />
      </LinearGradient>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{instrument.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {instrument.subtitle}
        </Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMeta}>{instrument.instrumentCode}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMeta}>~{instrument.estimatedMinutes} min</Text>
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSubtle} />
    </Pressable>
  )
}

export function EmotionalScreeningTestsTab({
  bottomPadding,
  onSelectInstrument,
}: EmotionalScreeningTestsTabProps) {
  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        Escolha um instrumento. O resultado não fecha diagnóstico.
      </Text>

      {AUDIENCE_ORDER.map((audience) => {
        const items = EMOTIONAL_SCREENING_INSTRUMENTS.filter(
          (instrument) => instrument.audience === audience,
        )
        if (items.length === 0) return null

        return (
          <View key={audience} style={styles.section}>
            <Text style={styles.sectionTitle}>{EMOTIONAL_SCREENING_AUDIENCE_LABELS[audience]}</Text>
            <View style={styles.cardList}>
              {items.map((instrument) => (
                <InstrumentCard
                  key={instrument.id}
                  instrument={instrument}
                  onPress={() => onSelectInstrument(instrument.id)}
                />
              ))}
            </View>
          </View>
        )
      })}

      <Text style={styles.disclaimer}>{EMOTIONAL_SCREENING_DISCLAIMER}</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 16,
  },
  intro: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    paddingHorizontal: 2,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 2,
  },
  cardList: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 16, 20, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  cardMetaDot: {
    color: colors.textSubtle,
    fontSize: 11,
  },
  disclaimer: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
  },
})
