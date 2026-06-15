import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type FunctionalEmptyStateProps = {
  tab: 'all' | 'favorites'
}

export function FunctionalEmptyState({ tab }: FunctionalEmptyStateProps) {
  const isFavorites = tab === 'favorites'

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={isFavorites ? 'heart-outline' : 'search-outline'}
          size={28}
          color={colors.textMuted}
        />
      </View>
      <Text style={styles.title}>
        {isFavorites ? 'Nenhum favorito ainda' : 'Nenhum exercício encontrado'}
      </Text>
      <Text style={styles.subtitle}>
        {isFavorites
          ? 'Toque no coração de um exercício para salvá-lo aqui.'
          : 'Tente outro termo de busca ou remova alguns filtros.'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    gap: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
})
