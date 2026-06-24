import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { StyleSheet, Text, View } from 'react-native'
import {
  CROSSWORDS_HOW_TO_PLAY_SECTIONS,
  CROSSWORDS_INTRO,
} from '../../../config/crosswordsHowToPlay'
import { colors } from '../../../theme/colors'
import { RunWalkSheetDrawer } from '../../runWalk/RunWalkSheetDrawer'

type CrosswordHowToPlayDrawerProps = {
  visible: boolean
  onClose: () => void
}

export function CrosswordHowToPlayDrawer({ visible, onClose }: CrosswordHowToPlayDrawerProps) {
  function handleClose() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Como jogar Palavras cruzadas"
      subtitle="Regras e orientações para a partida"
      onClose={handleClose}
      fullScreen
      scrollable
    >
      <View style={styles.introCard}>
        <LinearGradient
          colors={['rgba(244, 114, 182, 0.16)', 'rgba(219, 39, 119, 0.06)']}
          style={styles.introGradient}
        >
          <Text style={styles.introTitle}>{CROSSWORDS_INTRO.title}</Text>
          <Text style={styles.introText}>{CROSSWORDS_INTRO.summary}</Text>
        </LinearGradient>
      </View>

      {CROSSWORDS_HOW_TO_PLAY_SECTIONS.map((section) => (
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
    borderColor: 'rgba(244, 114, 182, 0.22)',
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
    lineHeight: 18,
  },
  section: {
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  paragraph: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
  },
  bulletDot: {
    color: colors.primaryLight,
    fontSize: 14,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
})
