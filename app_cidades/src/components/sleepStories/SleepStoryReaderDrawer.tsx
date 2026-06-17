import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { getSleepStoryCategoryById, getSleepStoryById } from '../../config/sleepStories'
import { getSleepStoryContent } from '../../config/sleepStoryContents'
import { colors } from '../../theme/colors'
import type { SleepStoryId } from '../../types/sleepStories'
import { estimateSleepStoryReadingMinutes } from '../../utils/sleepStoryReadingTime'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { SleepTimeStarfield } from '../sleepTime/SleepTimeStarfield'

type SleepStoryReaderDrawerProps = {
  visible: boolean
  storyId: SleepStoryId | null
  onClose: () => void
}

export function SleepStoryReaderDrawer({ visible, storyId, onClose }: SleepStoryReaderDrawerProps) {
  const story = storyId ? getSleepStoryById(storyId) : null
  const content = storyId ? getSleepStoryContent(storyId) : null
  const category = story ? getSleepStoryCategoryById(story.categoryId) : null
  const accent = category?.gradient[1] ?? '#6366f1'

  const subtitle = useMemo(() => {
    if (!content) return 'Em breve'
    const minutes = estimateSleepStoryReadingMinutes(content)
    return `${minutes} min de leitura · ${category?.label ?? 'História'}`
  }, [category?.label, content])

  function handleClose() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  if (!story) return null

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={story.title}
      subtitle={subtitle}
      onClose={handleClose}
      fullScreen
      scrollable
      dense
      sheetBackground={
        <>
          <LinearGradient
            colors={['#070812', '#0c0a1a', '#050508']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <SleepTimeStarfield active={visible} />
        </>
      }
      footer={
        <Pressable
          onPress={handleClose}
          style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Fechar história"
        >
          <Ionicons name="moon-outline" size={16} color="#e0e7ff" />
          <Text style={styles.footerButtonText}>Boa noite</Text>
        </Pressable>
      }
    >
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.heroGlow, { backgroundColor: `${accent}33` }]} />
          <View style={[styles.heroIconWrap, { borderColor: `${accent}55` }]}>
            <LinearGradient
              colors={category ? [...category.gradient] : ['#c7d2fe', '#6366f1', '#4338ca']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.heroIconGradient}
            >
              <MaterialCommunityIcons
                name={category?.icon ?? 'book-open-page-variant-outline'}
                size={34}
                color="#fff"
              />
            </LinearGradient>
          </View>
          <Text style={styles.heroEyebrow}>Hora de dormir</Text>
          <Text style={styles.heroTitle}>{story.title}</Text>
        </View>

        {content ? (
          <>
            <View style={styles.storyBody}>
              {content.paragraphs.map((paragraph, index) => (
                <Text
                  key={`${story.id}-p-${index}`}
                  style={[
                    styles.paragraph,
                    paragraph.variant === 'dialogue' && [
                      styles.paragraphDialogue,
                      { color: `${accent}ee` },
                    ],
                    paragraph.variant === 'thought' && styles.paragraphThought,
                  ]}
                >
                  {paragraph.text}
                </Text>
              ))}
            </View>

            {content.lesson ? (
              <View style={[styles.lessonCard, { borderColor: `${accent}44` }]}>
                <LinearGradient
                  colors={[`${accent}28`, `${accent}10`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.lessonHeader}>
                  <MaterialCommunityIcons name="star-four-points" size={16} color={accent} />
                  <Text style={[styles.lessonTitle, { color: accent }]}>
                    {content.lesson.title}
                  </Text>
                </View>
                <Text style={styles.lessonText}>{content.lesson.text}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.placeholderCard}>
            <MaterialCommunityIcons name="book-clock-outline" size={28} color={colors.textSubtle} />
            <Text style={styles.placeholderTitle}>Texto completo em breve</Text>
            <Text style={styles.placeholderText}>{story.summary}</Text>
          </View>
        )}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
    paddingBottom: 8,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  heroGlow: {
    position: 'absolute',
    top: 18,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  heroIconWrap: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  heroIconGradient: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 30,
    paddingHorizontal: 12,
  },
  storyBody: {
    gap: 18,
  },
  paragraph: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 28,
    letterSpacing: 0.15,
  },
  paragraphDialogue: {
    fontStyle: 'italic',
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(199, 210, 254, 0.35)',
  },
  paragraphThought: {
    color: '#ddd6fe',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  lessonCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 10,
    overflow: 'hidden',
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lessonTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  lessonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },
  placeholderCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  placeholderTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    textAlign: 'center',
  },
  footerButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(199, 210, 254, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  footerButtonText: {
    color: '#e0e7ff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.86,
  },
})
