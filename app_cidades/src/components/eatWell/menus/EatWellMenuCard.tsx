import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { EatWellSavedMenu } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { formatEatWellMenuSubtitle } from '../../../utils/eatWellMenuGeneration'

type EatWellMenuCardProps = {
  menu: EatWellSavedMenu
  onPress: () => void
  onDeletePress: () => void
}

export function EatWellMenuCard({ menu, onPress, onDeletePress }: EatWellMenuCardProps) {
  function handleDeletePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onDeletePress()
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onPress()
        }}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <Text style={styles.title} numberOfLines={2}>
          {menu.name}
          <Text style={styles.titleMuted}>
            {' '}
            · ~{Math.round(menu.approximateCalories).toLocaleString('pt-BR')} kcal
          </Text>
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.meta} numberOfLines={2}>
            {formatEatWellMenuSubtitle(menu)}
          </Text>

          <View style={styles.chevronWrap}>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={handleDeletePress}
        hitSlop={10}
        style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Excluir cardápio ${menu.name}`}
      >
        <Ionicons name="trash-outline" size={15} color="rgba(248, 113, 113, 0.88)" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  card: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 28,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.18)',
  },
  cardPressed: {
    opacity: 0.92,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 20,
    paddingRight: 8,
  },
  titleMuted: {
    color: '#a3e635',
    fontWeight: 700,
  },
  deleteBtn: {
    position: 'absolute',
    top: 12,
    right: 10,
    zIndex: 2,
    padding: 2,
  },
  deleteBtnPressed: {
    opacity: 0.65,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meta: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  chevronWrap: {
    alignSelf: 'center',
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
