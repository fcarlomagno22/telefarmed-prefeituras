import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native'
import {
  getBibleHighlightColor,
  getBibleHighlightNeonContainerStyle,
  getBibleHighlightNeonGlowStyle,
  type BibleHighlightColor,
  type BibleHighlightColorId,
} from '../../types/bibleHighlights'

type BibleNeonHighlightProps = {
  text: string
  colorId: BibleHighlightColorId
  fontSize: number
  lineHeight: number
  onPress?: () => void
  containerStyle?: ViewStyle
  textStyle?: TextStyle
}

export function BibleNeonHighlight({
  text,
  colorId,
  fontSize,
  lineHeight,
  onPress,
  containerStyle,
  textStyle,
}: BibleNeonHighlightProps) {
  const color = getBibleHighlightColor(colorId)

  const chip = (
    <View style={[styles.glowShell, getBibleHighlightNeonGlowStyle(color), containerStyle]}>
      <View style={[styles.chip, getBibleHighlightNeonContainerStyle(color)]}>
        <Text style={[styles.label, { fontSize, lineHeight }, textStyle]}>{text}</Text>
      </View>
    </View>
  )

  if (!onPress) return chip

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      {chip}
    </Pressable>
  )
}

export function BibleNeonHighlightPreview({
  text,
  color,
  textStyle,
}: {
  text: string
  color: BibleHighlightColor
  textStyle?: TextStyle
}) {
  return (
    <View style={[styles.glowShell, styles.previewGlow, getBibleHighlightNeonGlowStyle(color)]}>
      <View style={[styles.chip, styles.previewChip, getBibleHighlightNeonContainerStyle(color)]}>
        <Text style={[styles.label, styles.previewLabel, textStyle]}>{text}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
  },
  glowShell: {
    alignSelf: 'flex-start',
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginVertical: 1,
  },
  previewChip: {
    marginVertical: 0,
  },
  previewGlow: {
    alignSelf: 'stretch',
  },
  label: {
    color: '#FFFFFF',
  },
  previewLabel: {
    fontSize: 15,
    lineHeight: 23,
  },
  pressed: {
    opacity: 0.88,
  },
})
