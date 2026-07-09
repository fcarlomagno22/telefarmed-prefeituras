import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../../theme/colors'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { AppLoadingState } from '../AppLoadingState'
import { filterActiveMindGames } from '../../config/activeMindGames'
import { useAuth } from '../../contexts/AuthContext'
import {
  emptyActiveMindWeeklyStats,
  loadActiveMindWeeklyStats,
  type ActiveMindWeeklyStats,
} from '../../data/activeMindWeeklyStats'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import type { ActiveMindGame, ActiveMindGameCategory } from '../../types/activeMind'
import { ActiveMindCategoryChips } from './ActiveMindCategoryChips'
import { ActiveMindGameCard } from './ActiveMindGameCard'
import { ActiveMindWeeklyStatsCard } from './ActiveMindWeeklyStatsCard'
import { ActiveMindHistoryDrawer } from './history/ActiveMindHistoryDrawer'
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
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ActiveMindGameCategory>('all')
  const [weeklyStats, setWeeklyStats] = useState<ActiveMindWeeklyStats | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [historyVisible, setHistoryVisible] = useState(false)
  const patientCpf = user?.cpf ?? 'guest'

  const filteredGames = useMemo(
    () => filterActiveMindGames(category, query),
    [category, query],
  )

  const refreshWeeklyStats = useCallback(async (options?: { initial?: boolean }) => {
    const isInitial = options?.initial === true
    if (isInitial) setInitialLoading(true)

    try {
      const stats = await loadActiveMindWeeklyStats(patientCpf)
      setWeeklyStats(stats)
    } catch {
      setWeeklyStats(emptyActiveMindWeeklyStats())
    } finally {
      if (isInitial) setInitialLoading(false)
    }
  }, [patientCpf])

  useEffect(() => {
    void refreshWeeklyStats({ initial: true })
  }, [refreshWeeklyStats])

  const handleSessionsChanged = useCallback(() => {
    void refreshWeeklyStats()
  }, [refreshWeeklyStats])

  if (initialLoading) {
    return (
      <View style={[styles.loadingWrap, { paddingBottom: bottomPadding }]}>
        <AppLoadingState message="Carregando Ativa Mente..." />
      </View>
    )
  }

  return (
    <>
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

      <ActiveMindWeeklyStatsCard stats={weeklyStats} />

      <Pressable
        onPress={() => setHistoryVisible(true)}
        style={({ pressed }) => [styles.historyLink, pressed && styles.historyLinkPressed]}
        accessibilityRole="button"
        accessibilityLabel="Abrir histórico de sessões"
      >
        <MaterialCommunityIcons name="history" size={18} color="#be185d" />
        <Text style={styles.historyLinkText}>Ver histórico de sessões</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
      </Pressable>

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

    <ActiveMindHistoryDrawer
      visible={historyVisible}
      patientCpf={patientCpf}
      onClose={() => setHistoryVisible(false)}
      onSessionsChanged={handleSessionsChanged}
    />
    </>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  scroll: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
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
  historyLink: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  historyLinkPressed: {
    opacity: 0.88,
  },
  historyLinkText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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

