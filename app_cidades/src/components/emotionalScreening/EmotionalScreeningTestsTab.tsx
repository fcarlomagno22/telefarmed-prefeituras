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
  'early_childhood',
  'child_adolescent',
  'adult_adolescent',
]

type EmotionalScreeningTestsTabProps = {
  bottomPadding: number
  onSelectInstrument: (instrumentId: EmotionalScreeningInstrumentId) => void
}

function isInstrumentAvailable(instrument: EmotionalScreeningInstrument) {
  return instrument.available === true
}

function InstrumentCard({
  instrument,
  onPress,
}: {
  instrument: EmotionalScreeningInstrument
  onPress: () => void
}) {
  const available = isInstrumentAvailable(instrument)

  function handlePress() {
    if (!available) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !available }}
      accessibilityLabel={
        available
          ? instrument.title
          : `${instrument.title}. Em breve`
      }
      onPress={handlePress}
      disabled={!available}
      style={({ pressed }) => [
        styles.card,
        !available && styles.cardGhost,
        available && pressed && styles.cardPressed,
      ]}
    >
      {available ? (
        <LinearGradient colors={[...instrument.accent]} style={styles.cardIcon}>
          <MaterialCommunityIcons
            name={instrument.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={22}
            color="#fff"
          />
        </LinearGradient>
      ) : (
        <View style={[styles.cardIcon, styles.cardIconGhost]}>
          <MaterialCommunityIcons
            name={instrument.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={22}
            color={colors.textSubtle}
          />
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, !available && styles.cardTitleGhost]} numberOfLines={1}>
            {instrument.title}
          </Text>
          {!available ? (
            <View style={styles.soonBadge}>
              <Text style={styles.soonBadgeText}>Em breve</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[styles.cardSubtitle, !available && styles.cardSubtitleGhost]}
          numberOfLines={2}
        >
          {instrument.subtitle}
        </Text>
        {available ? (
          <View style={styles.cardMetaRow}>
            <Text style={styles.cardMeta}>{instrument.instrumentCode}</Text>
            <Text style={styles.cardMetaDot}>·</Text>
            <Text style={styles.cardMeta}>~{instrument.estimatedMinutes} min</Text>
          </View>
        ) : null}
      </View>

      {available ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSubtle} />
      ) : null}
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
  cardGhost: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.72,
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
  cardIconGhost: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardTitleGhost: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  cardSubtitleGhost: {
    color: colors.textSubtle,
  },
  soonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  soonBadgeText: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
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
