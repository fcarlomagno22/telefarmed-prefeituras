import { StyleSheet, Text, TextInput, View } from 'react-native'
import { useEffect, useState } from 'react'
import type { MyRoutineDayClosure } from '../../types/myRoutine'
import { EatWellLevelSlider } from '../eatWell/menuWizard/EatWellLevelSlider'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { PrimaryButton } from '../PrimaryButton'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

const ACCENT = '#d946ef'

type MyRoutineDayClosureDrawerProps = {
  visible: boolean
  onClose: () => void
  onConfirm: (payload: Pick<MyRoutineDayClosure, 'energyLevel' | 'adherenceLevel' | 'tomorrowAdjustment'>) => void
}

export function MyRoutineDayClosureDrawer({
  visible,
  onClose,
  onConfirm,
}: MyRoutineDayClosureDrawerProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [adherenceLevel, setAdherenceLevel] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [tomorrowAdjustment, setTomorrowAdjustment] = useState('')

  useEffect(() => {
    if (!visible) {
      setEnergyLevel(3)
      setAdherenceLevel(3)
      setTomorrowAdjustment('')
    }
  }, [visible])

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Como foi seu dia?"
      subtitle="30 segundos para ajustar amanhã"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Encerrar dia"
          onPress={() => {
            onConfirm({ energyLevel, adherenceLevel, tomorrowAdjustment: tomorrowAdjustment.trim() })
            onClose()
          }}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>Energia hoje</Text>
          <EatWellLevelSlider
            value={energyLevel}
            min={1}
            max={5}
            minLabel="Esgotado"
            maxLabel="Pleno"
            accent={ACCENT}
            onChange={(value) => setEnergyLevel(value as 1 | 2 | 3 | 4 | 5)}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Consegui seguir a rotina?</Text>
          <EatWellLevelSlider
            value={adherenceLevel}
            min={1}
            max={5}
            minLabel="Quase nada"
            maxLabel="Muito bem"
            accent={ACCENT}
            onChange={(value) => setAdherenceLevel(value as 1 | 2 | 3 | 4 | 5)}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Ajuste para amanhã (opcional)</Text>
          <TextInput
            value={tomorrowAdjustment}
            onChangeText={setTomorrowAdjustment}
            placeholder="Ex.: acordar mais cedo, menos tarefas..."
            placeholderTextColor={colors.textSubtle}
            multiline
            textAlignVertical="top"
            style={styles.input}
            selectionColor={ACCENT}
          />
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 16 },
  field: { gap: 8 },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    minHeight: 88,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  footerBtn: { marginTop: 0 },
}
}

