import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import LottieView from 'lottie-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SLEEP_STORY_CATEGORIES, SLEEP_STORIES } from '../../config/sleepStories'
import type { SleepStoryCategoryId } from '../../types/sleepStories'
import { filterSleepStories } from '../../utils/sleepStoriesFilter'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { SleepTimeStarfield } from '../sleepTime/SleepTimeStarfield'
import { sleepTimeDrawerTheme } from '../sleepTime/sleepTimeDrawerTheme'

const sleeptimeAnimation = require('../../../assets/Sleeptime.json')

type SleepStoriesFilterDrawerProps = {
  visible: boolean
  query: string
  selectedCategoryId: SleepStoryCategoryId | null
  onQueryChange: (value: string) => void
  onCategoryChange: (categoryId: SleepStoryCategoryId | null) => void
  onClose: () => void
}

export function SleepStoriesFilterDrawer({
  visible,
  query,
  selectedCategoryId,
  onQueryChange,
  onCategoryChange,
  onClose,
}: SleepStoriesFilterDrawerProps) {
  const [draftQuery, setDraftQuery] = useState(query)

  useEffect(() => {
    if (!visible) return
    setDraftQuery(query)
  }, [visible, query])

  const previewCount = useMemo(
    () => filterSleepStories(SLEEP_STORIES, draftQuery, selectedCategoryId).length,
    [draftQuery, selectedCategoryId],
  )

  function handleDismiss() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  function handleQueryChange(value: string) {
    setDraftQuery(value)
    onQueryChange(value)
  }

  function handleSelectCategory(nextCategoryId: SleepStoryCategoryId | null) {
    void Haptics.selectionAsync()
    onCategoryChange(nextCategoryId)
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Filtrar"
      subtitle={`${previewCount} resultado${previewCount === 1 ? '' : 's'}`}
      onClose={handleDismiss}
      fullScreen
      scrollable={false}
      dense
      tone="sleep"
      sheetBackground={
        <>
          <LinearGradient
            colors={[...sleepTimeDrawerTheme.gradient]}
            style={StyleSheet.absoluteFillObject}
          />
          <SleepTimeStarfield active={visible} />
        </>
      }
    >
      <View style={styles.content}>
        <View style={styles.hero}>
          <LottieView
            source={sleeptimeAnimation}
            autoPlay
            loop
            resizeMode="contain"
            style={styles.lottie}
          />
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={sleepTimeDrawerTheme.textSubtle} />
          <TextInput
            value={draftQuery}
            onChangeText={handleQueryChange}
            placeholder="Buscar história..."
            placeholderTextColor={sleepTimeDrawerTheme.textSubtle}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => handleSelectCategory(null)}
            style={({ pressed }) => [
              styles.categoryRow,
              selectedCategoryId == null && styles.categoryRowActive,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedCategoryId == null }}
          >
            <Text
              style={[
                styles.categoryLabel,
                selectedCategoryId == null && styles.categoryLabelActive,
              ]}
            >
              Todas
            </Text>
            {selectedCategoryId == null ? (
              <Ionicons name="checkmark" size={16} color="#c7d2fe" />
            ) : null}
          </Pressable>

          {SLEEP_STORY_CATEGORIES.map((category) => {
            const active = selectedCategoryId === category.id

            return (
              <Pressable
                key={category.id}
                onPress={() => handleSelectCategory(category.id)}
                style={({ pressed }) => [
                  styles.categoryRow,
                  active && styles.categoryRowActive,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <View style={[styles.categoryDot, { backgroundColor: category.gradient[1] }]} />
                <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                  {category.label}
                </Text>
                {active ? <Ionicons name="checkmark" size={16} color={category.gradient[1]} /> : null}
              </Pressable>
            )
          })}
        </ScrollView>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 18,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  lottie: {
    width: 140,
    height: 110,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchInput: {
    flex: 1,
    color: sleepTimeDrawerTheme.text,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  categoryScroll: {
    flex: 1,
  },
  categoryList: {
    gap: 0,
    paddingBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: sleepTimeDrawerTheme.chipBorder,
  },
  categoryRowActive: {
    backgroundColor: sleepTimeDrawerTheme.chipBackground,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryLabel: {
    flex: 1,
    color: sleepTimeDrawerTheme.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  categoryLabelActive: {
    color: sleepTimeDrawerTheme.text,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
})
