import { MaterialCommunityIcons } from '@expo/vector-icons'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { EatWellSavedMenu } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { EatWellMenuCard } from './EatWellMenuCard'

const EMPTY_ICON_SIZE = 56

type EatWellMenusTabProps = {
  menus: EatWellSavedMenu[]
  bottomPadding: number
  onOpenMenu: (menu: EatWellSavedMenu) => void
  onDeleteMenu: (menuId: string) => void
}

export function EatWellMenusTab({
  menus,
  bottomPadding,
  onOpenMenu,
  onDeleteMenu,
}: EatWellMenusTabProps) {
  const isEmpty = menus.length === 0
  const savedLabel =
    menus.length === 1 ? '1 cardápio salvo' : `${menus.length} cardápios salvos`

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[
        styles.content,
        isEmpty && styles.contentEmpty,
        { paddingBottom: bottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons
            name="food-apple-outline"
            size={EMPTY_ICON_SIZE}
            color="#a3e635"
          />
          <Text style={styles.emptyTitle}>Nenhum cardápio por aqui</Text>
          <Text style={styles.emptyText}>
            Toque no + e crie automaticamente cardápios personalizados.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerEyebrow}>Meus cardápios</Text>
            <Text style={styles.headerMeta}>{savedLabel}</Text>
          </View>

          <View style={styles.list}>
            {menus.map((menu) => (
              <EatWellMenuCard
                key={menu.id}
                menu={menu}
                onPress={() => onOpenMenu(menu)}
                onDelete={() => onDeleteMenu(menu.id)}
              />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingTop: 4,
  },
  contentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    gap: 2,
  },
  headerEyebrow: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  headerMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: 10,
    paddingHorizontal: 16,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 36,
    gap: 10,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 280,
  },
})
