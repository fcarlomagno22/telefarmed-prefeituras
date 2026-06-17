import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { EatWellDailyRecord, MealLog, MealSlot } from '../../types/eatWell'
import { colors } from '../../theme/colors'
import { formatCalories, sumMealMacros } from '../../utils/eatWellNutritionStats'
import { formatMealTime, getMealSlotConfig } from '../../utils/eatWellMealSlots'

type EatWellMealPhotoGalleryProps = {
  record: EatWellDailyRecord
  filterSlot: MealSlot | null
  onSelectMeal: (meal: MealLog) => void
}

function sortMealsByTime(meals: MealLog[]) {
  return [...meals].sort(
    (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
  )
}

export function EatWellMealPhotoGallery({
  record,
  filterSlot,
  onSelectMeal,
}: EatWellMealPhotoGalleryProps) {
  const mealsWithPhotos = sortMealsByTime(
    record.meals.filter(
      (meal) =>
        Boolean(meal.photoUri) && (!filterSlot || meal.slot === filterSlot),
    ),
  )

  function handlePress(meal: MealLog) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSelectMeal(meal)
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Fotos das refeições</Text>
        {filterSlot ? (
          <Text style={styles.filter}>{getMealSlotConfig(filterSlot).label}</Text>
        ) : null}
      </View>

      {mealsWithPhotos.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="camera-outline" size={22} color="#a3e635" />
          </View>
          <Text style={styles.emptyTitle}>Nenhuma foto registrada hoje</Text>
          <Text style={styles.emptyText}>
            Registre refeições com foto para vê-las aqui em destaque.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
        >
          {mealsWithPhotos.map((meal) => {
            const config = getMealSlotConfig(meal.slot)
            const macros = sumMealMacros(meal)

            return (
              <Pressable
                key={meal.id}
                onPress={() => handlePress(meal)}
                style={({ pressed }) => [styles.photoCard, pressed && styles.photoCardPressed]}
              >
                <Image
                  source={{ uri: meal.photoUri! }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={180}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(3,3,8,0.88)']}
                  style={styles.photoGradient}
                />
                <View style={styles.photoOverlay}>
                  <View style={[styles.slotBadge, { backgroundColor: `${config.color}33` }]}>
                    <MaterialCommunityIcons name={config.icon} size={12} color={config.color} />
                    <Text style={[styles.slotBadgeText, { color: config.color }]}>
                      {config.shortLabel}
                    </Text>
                  </View>
                  <Text style={styles.photoCalories}>{formatCalories(macros.calories)}</Text>
                  <Text style={styles.photoTime}>
                    {formatMealTime(meal.loggedAt, config.suggestedTime)}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

const CARD_WIDTH = 132
const CARD_HEIGHT = 168

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    gap: 10,
  },
  header: {
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  filter: {
    color: '#a3e635',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    gap: 10,
    paddingRight: 4,
  },
  photoCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  photoCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  photoOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    gap: 4,
  },
  slotBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  slotBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  photoCalories: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  photoTime: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.22)',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
  },
})
