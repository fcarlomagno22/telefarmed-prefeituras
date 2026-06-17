import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { getSleepStoryCategoryById } from '../../config/sleepStories'
import { colors } from '../../theme/colors'
import type { SleepStory } from '../../types/sleepStories'

type SleepStoryListItemProps = {
  story: SleepStory
  isRead: boolean
  onPress: (story: SleepStory) => void
  onToggleRead: (story: SleepStory) => void
}

export function SleepStoryListItem({
  story,
  isRead,
  onPress,
  onToggleRead,
}: SleepStoryListItemProps) {
  const category = getSleepStoryCategoryById(story.categoryId)
  const accent = category?.gradient[1] ?? '#6366f1'

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onPress(story)}
        style={({ pressed }) => [styles.mainPressable, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={story.title}
        accessibilityState={{ selected: isRead }}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${accent}18` }]}>
          <MaterialCommunityIcons
            name={category?.icon ?? 'book-open-page-variant-outline'}
            size={18}
            color={accent}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isRead && styles.titleRead]} numberOfLines={1}>
              {story.title}
            </Text>
            {story.isNew && !isRead ? (
              <Text style={[styles.newLabel, { color: accent }]}>Nova</Text>
            ) : null}
          </View>
          <Text style={[styles.summary, isRead && styles.summaryRead]} numberOfLines={2}>
            {story.summary}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => onToggleRead(story)}
        style={({ pressed }) => [styles.readToggle, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={isRead ? 'Marcar como não lida' : 'Marcar como lida'}
        accessibilityState={{ checked: isRead }}
        hitSlop={8}
      >
        <Ionicons
          name={isRead ? 'checkmark-circle' : 'ellipse-outline'}
          size={20}
          color={isRead ? accent : 'rgba(255,255,255,0.22)'}
        />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  mainPressable: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.82,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.15,
  },
  titleRead: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  newLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  summary: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  summaryRead: {
    color: colors.textSubtle,
  },
  readToggle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
