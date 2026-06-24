import { Ionicons } from '@expo/vector-icons'
import LottieView from 'lottie-react-native'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { WordSearchEntry } from '../../../types/wordSearch'

const brainLottie = require('../../../../assets/brain1.json')

type WordSearchHintListProps = {
  entries: WordSearchEntry[]
  foundEntryIds: Set<string>
  feedbackMessage?: string | null
  layoutWidth: number
}

export function WordSearchHintList({
  entries,
  foundEntryIds,
  feedbackMessage,
  layoutWidth,
}: WordSearchHintListProps) {
  const sorted = [...entries].sort((left, right) => left.number - right.number)

  return (
    <View style={[styles.wrapper, { width: layoutWidth, alignSelf: 'center' }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Dicas</Text>
        <View style={styles.brainWrap} pointerEvents="none">
          <LottieView
            source={brainLottie}
            autoPlay
            loop
            resizeMode="contain"
            style={styles.brainLottie}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {sorted.map((entry) => {
          const found = foundEntryIds.has(entry.id)

          return (
            <View
              key={entry.id}
              style={[styles.hintRow, found && styles.hintRowFound]}
              accessibilityRole="text"
              accessibilityLabel={`Dica ${entry.number}. ${entry.hint}${found ? '. Encontrada' : ''}`}
            >
              <Text style={[styles.hintNumber, found && styles.hintNumberFound]}>{entry.number}.</Text>
              <Text style={[styles.hintText, found && styles.hintTextFound]}>{entry.hint}</Text>
              {found ? (
                <Ionicons name="checkmark-circle" size={16} color="#4ade80" style={styles.checkIcon} />
              ) : null}
            </View>
          )
        })}
      </ScrollView>

      {feedbackMessage ? (
        <Text style={styles.feedbackHint}>{feedbackMessage}</Text>
      ) : (
        <View style={styles.feedbackPlaceholder} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minHeight: 0,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.18)',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 6,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingRight: 2,
  },
  title: {
    color: '#86efac',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  brainWrap: {
    width: 72,
    height: 52,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginTop: -4,
    marginRight: -4,
  },
  brainLottie: {
    width: 72,
    height: 52,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    gap: 6,
    paddingBottom: 4,
    paddingRight: 4,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  hintRowFound: {
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
  },
  hintNumber: {
    color: '#86efac',
    fontSize: 13,
    fontWeight: '700',
    minWidth: 20,
  },
  hintNumberFound: {
    color: '#4ade80',
  },
  hintText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  hintTextFound: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  checkIcon: {
    marginTop: 1,
  },
  feedbackHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 2,
    minHeight: 28,
  },
  feedbackPlaceholder: {
    minHeight: 28,
  },
})
