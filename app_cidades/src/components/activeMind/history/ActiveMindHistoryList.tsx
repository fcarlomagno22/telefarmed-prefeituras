import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { ActiveMindSession } from '../../../types/activeMindSession'
import { colors } from '../../../theme/colors'
import { ActiveMindHistorySessionRow } from './ActiveMindHistorySessionRow'

const PAGE_SIZE = 20

type ActiveMindHistoryListProps = {
  sessions: ActiveMindSession[]
  refreshing: boolean
  onRefresh: () => void
  onDeletePress: (session: ActiveMindSession) => void
  ListHeaderComponent?: ReactElement | null
}

export function ActiveMindHistoryList({
  sessions,
  refreshing,
  onRefresh,
  onDeletePress,
  ListHeaderComponent,
}: ActiveMindHistoryListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [sessions])

  const visibleSessions = useMemo(
    () => sessions.slice(0, visibleCount),
    [sessions, visibleCount],
  )

  const hasMore = visibleCount < sessions.length

  const handleEndReached = useCallback(() => {
    if (!hasMore) return
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, sessions.length))
  }, [hasMore, sessions.length])

  return (
    <FlatList
      data={visibleSessions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#f472b6"
          colors={['#f472b6']}
        />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.35}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="brain" size={28} color={colors.textSubtle} />
          <Text style={styles.emptyTitle}>Nenhuma sessão ainda</Text>
          <Text style={styles.emptyText}>
            Conclua um jogo para ver seu histórico aqui.
          </Text>
        </View>
      }
      ListFooterComponent={
        hasMore ? (
          <View style={styles.footer}>
            <ActivityIndicator color="#f472b6" />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <ActiveMindHistorySessionRow session={item} onDeletePress={onDeletePress} />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  separator: {
    height: 10,
  },
  emptyCard: {
    marginTop: 12,
    borderRadius: 18,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
})
