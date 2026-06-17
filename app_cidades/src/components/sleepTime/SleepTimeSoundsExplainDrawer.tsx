import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { SLEEP_SOUNDS } from '../../config/sleepSounds'
import { colors } from '../../theme/colors'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { SleepTimeStarfield } from './SleepTimeStarfield'

type SleepTimeSoundsExplainDrawerProps = {
  visible: boolean
  onClose: () => void
}

function SoundExplainBlock({
  title,
  explanation,
  icon,
}: {
  title: string
  explanation: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
}) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHeader}>
        <View style={styles.blockIconWrap}>
          <MaterialCommunityIcons name={icon} size={16} color="#a5b4fc" />
        </View>
        <Text style={styles.blockTitle}>{title}</Text>
      </View>
      <Text style={styles.blockText}>{explanation}</Text>
    </View>
  )
}

export function SleepTimeSoundsExplainDrawer({
  visible,
  onClose,
}: SleepTimeSoundsExplainDrawerProps) {
  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Como os sons ajudam a dormir"
      subtitle="Ruídos calmantes e frequências que favorecem o relaxamento"
      onClose={onClose}
      fullScreen
      sheetBackground={<SleepTimeStarfield active={visible} />}
    >
      <Text style={styles.intro}>
        Sons contínuos e previsíveis ajudam a mascarar distrações, reduzir a atividade mental e
        preparar o corpo para um descanso mais profundo.
      </Text>

      {SLEEP_SOUNDS.map((sound) => (
        <SoundExplainBlock
          key={sound.id}
          title={sound.title}
          explanation={sound.explanation}
          icon={sound.icon}
        />
      ))}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  intro: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: 4,
  },
  block: {
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
  },
  blockTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  blockText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
})
