import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SUDOKU_HOW_TO_PLAY_SECTIONS, SUDOKU_INTRO } from '../../../config/sudokuHowToPlay'
import { colors } from '../../../theme/colors'
import { RunWalkSheetDrawer } from '../../runWalk/RunWalkSheetDrawer'

type SudokuHowToPlayDrawerProps = {
  visible: boolean
  onClose: () => void
}

export function SudokuHowToPlayDrawer({ visible, onClose }: SudokuHowToPlayDrawerProps) {
  function handleClose() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Como jogar Sudoku"
      subtitle="Regras e orientações para a partida"
      onClose={handleClose}
      fullScreen
      scrollable
    >
      <View style={styles.introCard}>
        <LinearGradient
          colors={['rgba(103, 232, 249, 0.16)', 'rgba(8, 145, 178, 0.06)']}
          style={styles.introGradient}
        >
          <Text style={styles.introTitle}>{SUDOKU_INTRO.title}</Text>
          <Text style={styles.introText}>{SUDOKU_INTRO.summary}</Text>
        </LinearGradient>
      </View>

      {SUDOKU_HOW_TO_PLAY_SECTIONS.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>

          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}

          {section.bullets?.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      ))}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  introCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  introGradient: {
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.22)',
    borderRadius: 16,
  },
  introTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  introText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    gap: 8,
    paddingTop: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  paragraph: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 2,
  },
  bulletDot: {
    color: '#67e8f9',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
})
