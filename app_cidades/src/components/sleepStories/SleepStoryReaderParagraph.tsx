import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import type { SleepStoryParagraph } from '../../types/sleepStories'

type SleepStoryReaderParagraphProps = {
  paragraph: SleepStoryParagraph
  accent: string
  fontSize: number
  lineHeight: number
  isFirst?: boolean
}

export function SleepStoryReaderParagraph({
  paragraph,
  accent,
  fontSize,
  lineHeight,
  isFirst = false,
}: SleepStoryReaderParagraphProps) {
  const { text, variant } = paragraph

  if (variant === 'dialogue') {
    return (
      <View style={[styles.dialogueWrap, { borderColor: `${accent}44` }]}>
        <LinearGradient
          colors={[`${accent}22`, `${accent}08`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.dialogueAccent, { backgroundColor: accent }]} />
        <MaterialCommunityIcons
          name="format-quote-open"
          size={Math.round(fontSize * 0.85)}
          color={`${accent}bb`}
          style={styles.dialogueIcon}
        />
        <Text
          style={[
            styles.dialogueText,
            {
              fontSize,
              lineHeight,
              color: `${accent}f2`,
            },
          ]}
        >
          {text}
        </Text>
      </View>
    )
  }

  if (variant === 'thought') {
    return (
      <View style={[styles.thoughtWrap, { borderColor: `${accent}33` }]}>
        <Text
          style={[
            styles.thoughtText,
            {
              fontSize: fontSize * 0.96,
              lineHeight: lineHeight * 0.98,
            },
          ]}
        >
          {text}
        </Text>
      </View>
    )
  }

  if (isFirst && text.length > 1) {
    const firstChar = text[0]
    const rest = text.slice(1)

    return (
      <Text
        style={[
          styles.bodyText,
          {
            fontSize,
            lineHeight,
          },
        ]}
      >
        <Text
          style={[
            styles.dropCap,
            {
              fontSize: fontSize * 2.05,
              lineHeight: fontSize * 2.05,
              color: accent,
            },
          ]}
        >
          {firstChar}
        </Text>
        {rest}
      </Text>
    )
  }

  return (
    <Text
      style={[
        styles.bodyText,
        {
          fontSize,
          lineHeight,
        },
      ]}
    >
      {text}
    </Text>
  )
}

const styles = StyleSheet.create({
  bodyText: {
    color: 'rgba(255, 255, 255, 0.94)',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  dropCap: {
    fontWeight: '800',
    marginRight: 2,
  },
  dialogueWrap: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingRight: 16,
    paddingLeft: 18,
    overflow: 'hidden',
    marginVertical: 2,
  },
  dialogueAccent: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  dialogueIcon: {
    marginBottom: 6,
    opacity: 0.85,
  },
  dialogueText: {
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: 0.15,
  },
  thoughtWrap: {
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(221, 214, 254, 0.06)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginVertical: 4,
  },
  thoughtText: {
    color: '#e9d5ff',
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.15,
  },
})
