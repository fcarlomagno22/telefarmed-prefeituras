import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  loadSleepStoryFontSize,
  saveSleepStoryFontSize,
  SLEEP_STORY_FONT_DEFAULT,
  SLEEP_STORY_FONT_MAX,
  SLEEP_STORY_FONT_MIN,
  SLEEP_STORY_FONT_STEP,
} from '../../data/sleepStoryReaderPreferencesStorage'
import { getSleepStoryCategoryById, getSleepStoryById } from '../../config/sleepStories'
import { getSleepStoryContent } from '../../config/sleepStoryContents'
import { colors } from '../../theme/colors'
import type { SleepStoryId } from '../../types/sleepStories'
import { estimateSleepStoryReadingMinutes } from '../../utils/sleepStoryReadingTime'
import { BibleVerseFontControls } from '../bible/BibleVerseFontControls'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { SleepTimeStarfield } from '../sleepTime/SleepTimeStarfield'
import { SleepStoryReaderParagraph } from './SleepStoryReaderParagraph'

type SleepStoryReaderDrawerProps = {
  visible: boolean
  storyId: SleepStoryId | null
  onClose: () => void
}

function StorySceneDivider({ accent }: { accent: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, { backgroundColor: `${accent}33` }]} />
      <MaterialCommunityIcons name="star-four-points" size={10} color={`${accent}88`} />
      <View style={[styles.dividerLine, { backgroundColor: `${accent}33` }]} />
    </View>
  )
}

export function SleepStoryReaderDrawer({ visible, storyId, onClose }: SleepStoryReaderDrawerProps) {
  const story = storyId ? getSleepStoryById(storyId) : null
  const content = storyId ? getSleepStoryContent(storyId) : null
  const category = story ? getSleepStoryCategoryById(story.categoryId) : null
  const accent = category?.gradient[1] ?? '#6366f1'

  const [fontSize, setFontSize] = useState(SLEEP_STORY_FONT_DEFAULT)

  useEffect(() => {
    if (!visible) return
    void loadSleepStoryFontSize().then(setFontSize)
  }, [visible])

  const lineHeight = useMemo(() => Math.round(fontSize * 1.68), [fontSize])
  const lessonFontSize = useMemo(() => Math.round(fontSize * 0.84), [fontSize])
  const lessonLineHeight = useMemo(() => Math.round(lessonFontSize * 1.55), [lessonFontSize])

  const subtitle = useMemo(() => {
    if (!content) return 'Em breve'
    const minutes = estimateSleepStoryReadingMinutes(content)
    return `${minutes} min de leitura · ${category?.label ?? 'História'}`
  }, [category?.label, content])

  const handleDecreaseFont = useCallback(() => {
    setFontSize((current) => {
      const next = Math.max(SLEEP_STORY_FONT_MIN, current - SLEEP_STORY_FONT_STEP)
      void saveSleepStoryFontSize(next)
      return next
    })
  }, [])

  const handleIncreaseFont = useCallback(() => {
    setFontSize((current) => {
      const next = Math.min(SLEEP_STORY_FONT_MAX, current + SLEEP_STORY_FONT_STEP)
      void saveSleepStoryFontSize(next)
      return next
    })
  }, [])

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
            <View style={[styles.readerToolbar, { borderColor: `${accent}33` }]}>
              <View style={styles.readerToolbarCopy}>
                <MaterialCommunityIcons name="book-open-variant" size={16} color={accent} />
                <Text style={styles.readerToolbarLabel}>Leitura confortável</Text>
              </View>
              <View style={styles.readerToolbarControls}>
                <Text style={styles.fontSizeBadge}>{fontSize}</Text>
                <BibleVerseFontControls
                  fontSize={fontSize}
                  minSize={SLEEP_STORY_FONT_MIN}
                  maxSize={SLEEP_STORY_FONT_MAX}
                  onDecrease={handleDecreaseFont}
                  onIncrease={handleIncreaseFont}
                />
              </View>
            </View>

            <View style={[styles.pageCard, { borderColor: `${accent}28` }]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={styles.pageInner}>
                <View style={styles.storyBody}>
                  {content.paragraphs.map((paragraph, index) => {
                    const previous = content.paragraphs[index - 1]
                    const showDivider =
                      index > 0 &&
                      previous &&
                      paragraph.variant === 'normal' &&
                      previous.variant === 'normal' &&
                      index % 4 === 0

                    return (
                      <View key={`${story.id}-p-${index}`} style={styles.paragraphSlot}>
                        {showDivider ? <StorySceneDivider accent={accent} /> : null}
                        <SleepStoryReaderParagraph
                          paragraph={paragraph}
                          accent={accent}
                          fontSize={fontSize}
                          lineHeight={lineHeight}
                          isFirst={index === 0}
                        />
                      </View>
                    )
                  })}
                </View>
              </View>
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
                  <Text style={[styles.lessonTitle, { color: accent, fontSize: lessonFontSize * 0.86 }]}>
                    {content.lesson.title}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.lessonText,
                    {
                      fontSize: lessonFontSize,
                      lineHeight: lessonLineHeight,
                    },
                  ]}
                >
                  {content.lesson.text}
                </Text>
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
    gap: 18,
    paddingBottom: 8,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
    paddingBottom: 2,
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
  readerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  readerToolbarCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  readerToolbarLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  readerToolbarControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontSizeBadge: {
    minWidth: 28,
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pageCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  pageInner: {
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  storyBody: {
    gap: 20,
  },
  paragraphSlot: {
    gap: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
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
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  lessonText: {
    color: colors.textMuted,
    fontWeight: '500',
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
