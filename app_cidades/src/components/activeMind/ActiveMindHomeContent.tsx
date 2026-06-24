import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useMemo, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { filterActiveMindGames } from '../../config/activeMindGames'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import type { ActiveMindGame, ActiveMindGameCategory } from '../../types/activeMind'
import { ActiveMindCategoryChips } from './ActiveMindCategoryChips'
import { ActiveMindGameCard } from './ActiveMindGameCard'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

type ActiveMindHomeContentProps = {
  bottomPadding: number
  onGamePress: (game: ActiveMindGame) => void
}

export function ActiveMindHomeContent({ bottomPadding, onGamePress }: ActiveMindHomeContentProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ActiveMindGameCategory>('all')

  const filteredGames = useMemo(
    () => filterActiveMindGames(category, query),
    [category, query],
  )

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient
        colors={['rgba(244, 114, 182, 0.18)', 'rgba(244, 114, 182, 0.04)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroIconWrap}>
          <LinearGradient
            colors={[...ACTION_ICON_PALETTES.activeMind.iconGradient]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.heroIcon}
          >
            <MaterialCommunityIcons name="puzzle" size={26} color="#fff" />
          </LinearGradient>
        </View>

        <View style={styles.heroTextCol}>
          <Text style={styles.heroTitle}>Treine sua mente todos os dias</Text>
          <Text style={styles.heroSubtitle}>
            Jogos inteligentes para memória, foco, lógica e linguagem — no seu ritmo, em poucos
            minutos.
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar jogo..."
          placeholderTextColor={colors.textSubtle}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <ActiveMindCategoryChips selectedCategory={category} onCategoryChange={setCategory} />

      <Text style={styles.sectionTitle}>
        {filteredGames.length === 1
          ? '1 jogo disponível'
          : `${filteredGames.length} jogos disponíveis`}
      </Text>

      <View style={styles.list}>
        {filteredGames.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="brain" size={28} color={colors.textSubtle} />
            <Text style={styles.emptyTitle}>Nenhum jogo encontrado</Text>
            <Text style={styles.emptySubtitle}>Tente outro termo ou categoria.</Text>
          </View>
        ) : (
          filteredGames.map((game) => (
            <ActiveMindGameCard key={game.id} game={game} onPress={() => onGamePress(game)} />
          ))
        )}
      </View>
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  scroll: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingTop: 4,
  },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.22)',
  },
  heroIconWrap: {
    shadowColor: ACTION_ICON_PALETTES.activeMind.shadowColor,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextCol: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: -4,
  },
  list: {
    gap: 10,
  },
  emptyState: {
    marginHorizontal: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
}
}

