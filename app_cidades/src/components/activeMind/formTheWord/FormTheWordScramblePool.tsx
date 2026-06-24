import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'

const ACCENTED_LETTER = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/

type FormTheWordScramblePoolProps = {
  scrambled: string[]
  usedPoolIndexes: Set<number>
  disabled?: boolean
  onPickChunk: (poolIndex: number) => void
}

export function FormTheWordScramblePool({
  scrambled,
  usedPoolIndexes,
  disabled = false,
  onPickChunk,
}: FormTheWordScramblePoolProps) {
  function handlePick(poolIndex: number) {
    if (disabled || usedPoolIndexes.has(poolIndex)) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPickChunk(poolIndex)
  }

  return (
    <View style={styles.wrapper}>
      {scrambled.map((chunk, index) => {
        const used = usedPoolIndexes.has(index)
        const isAccented = ACCENTED_LETTER.test(chunk)

        return (
          <Pressable
            key={`scramble-${index}-${chunk}`}
            onPress={() => handlePick(index)}
            disabled={disabled || used}
            style={({ pressed }) => [
              styles.chunkButton,
              isAccented && styles.chunkButtonAccented,
              used && styles.chunkButtonUsed,
              disabled && styles.chunkButtonDisabled,
              pressed && !disabled && !used && styles.chunkButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Letra ${chunk}`}
          >
            <Text
              style={[
                styles.chunkLabel,
                isAccented && styles.chunkLabelAccented,
                used && styles.chunkLabelUsed,
              ]}
            >
              {chunk}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  chunkButton: {
    minWidth: 44,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chunkButtonAccented: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 14,
  },
  chunkButtonUsed: {
    opacity: 0.28,
  },
  chunkButtonDisabled: {
    opacity: 0.45,
  },
  chunkButtonPressed: {
    opacity: 0.85,
  },
  chunkLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  chunkLabelAccented: {
    color: '#fde68a',
    fontWeight: '700',
  },
  chunkLabelUsed: {
    color: colors.textSubtle,
  },
})
