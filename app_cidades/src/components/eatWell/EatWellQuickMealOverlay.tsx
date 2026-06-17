import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppModal } from '../AppModal'
import type { EatWellFavorite } from '../../types/eatWell'
import { colors } from '../../theme/colors'
import { getMealSlotConfig } from '../../utils/eatWellMealSlots'
import { getModalFooterPadding } from '../../utils/modalSafeArea'

type EatWellQuickMealOverlayProps = {
  visible: boolean
  favorites: EatWellFavorite[]
  onClose: () => void
  onSelectFavorite: (favorite: EatWellFavorite) => void
  onAddWater: (ml: number) => void
}

export function EatWellQuickMealOverlay({
  visible,
  favorites,
  onClose,
  onSelectFavorite,
  onAddWater,
}: EatWellQuickMealOverlayProps) {
  const insets = useSafeAreaInsets()

  function handleFavoritePress(favorite: EatWellFavorite) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onSelectFavorite(favorite)
    onClose()
  }

  function handleWaterPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onAddWater(500)
    onClose()
  }

  return (
    <AppModal visible={visible} onRequestClose={onClose} animationType="fade">
      <Pressable
        style={[styles.backdrop, { paddingBottom: getModalFooterPadding(insets.bottom, 16) }]}
        onPress={onClose}
      >
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>Refeição rápida</Text>
          <Text style={styles.subtitle}>Registre em segundos · segure o + para abrir</Text>

          <View style={styles.favoritesRow}>
            {favorites.slice(0, 3).map((favorite) => {
              const slotConfig = getMealSlotConfig(favorite.slot)
              return (
                <Pressable
                  key={favorite.id}
                  onPress={() => handleFavoritePress(favorite)}
                  style={({ pressed }) => [styles.favoriteCard, pressed && styles.favoriteCardPressed]}
                >
                  <View style={[styles.favoriteIcon, { backgroundColor: `${slotConfig.color}22` }]}>
                    <MaterialCommunityIcons
                      name={slotConfig.icon}
                      size={20}
                      color={slotConfig.color}
                    />
                  </View>
                  <Text style={styles.favoriteLabel} numberOfLines={2}>
                    {favorite.label}
                  </Text>
                  <Text style={styles.favoriteMeta}>{favorite.entries.length} itens</Text>
                </Pressable>
              )
            })}
          </View>

          <Pressable
            onPress={handleWaterPress}
            style={({ pressed }) => [styles.waterBtn, pressed && styles.waterBtnPressed]}
          >
            <MaterialCommunityIcons name="cup-water" size={18} color="#67e8f9" />
            <Text style={styles.waterBtnText}>+500 ml de água</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Fechar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 22,
    padding: 18,
    gap: 14,
    backgroundColor: '#121218',
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.24)',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: -6,
  },
  favoritesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  favoriteCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 112,
  },
  favoriteCardPressed: {
    opacity: 0.9,
  },
  favoriteIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  favoriteMeta: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  waterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(103, 232, 249, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.22)',
  },
  waterBtnPressed: {
    opacity: 0.9,
  },
  waterBtnText: {
    color: '#a5f3fc',
    fontSize: 13,
    fontWeight: '800',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
})
