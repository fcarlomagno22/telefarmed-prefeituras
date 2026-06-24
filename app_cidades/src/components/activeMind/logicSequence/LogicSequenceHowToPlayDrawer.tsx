import { useThemedStyles } from '../../../hooks/useThemedStyles'
import type { ThemeColors } from '../../../theme/palettes'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { StyleSheet, Text, View } from 'react-native'
import {
  LOGIC_SEQUENCE_HOW_TO_PLAY_SECTIONS,
  LOGIC_SEQUENCE_INTRO,
} from '../../../config/logicSequenceHowToPlay'
import { RunWalkSheetDrawer } from '../../runWalk/RunWalkSheetDrawer'

type LogicSequenceHowToPlayDrawerProps = {
  visible: boolean
  onClose: () => void
}

export function LogicSequenceHowToPlayDrawer({ visible, onClose }: LogicSequenceHowToPlayDrawerProps) {
  const styles = useThemedStyles(createStyles)

  function handleClose() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Como jogar Sequência lógica"
      subtitle="Regras e orientações para a partida"
      onClose={handleClose}
      fullScreen
      scrollable
    >
      <View style={styles.introCard}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.16)', 'rgba(109, 40, 217, 0.06)']}
          style={styles.introGradient}
        >
          <Text style={styles.introTitle}>{LOGIC_SEQUENCE_INTRO.title}</Text>
          <Text style={styles.introText}>{LOGIC_SEQUENCE_INTRO.summary}</Text>
        </LinearGradient>
      </View>

      {LOGIC_SEQUENCE_HOW_TO_PLAY_SECTIONS.map((section) => (
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    introCard: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 8,
    },
    introGradient: {
      padding: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.22)',
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
}
