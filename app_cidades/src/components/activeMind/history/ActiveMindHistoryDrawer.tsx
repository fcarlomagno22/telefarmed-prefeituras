import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import {
  deleteSession,
  loadSessions,
  syncSessionsFromRemote,
} from '../../../data/activeMindSessionStorage'
import type { ActiveMindSession } from '../../../types/activeMindSession'
import { colors } from '../../../theme/colors'
import { AppLoadingState } from '../../AppLoadingState'
import { DeleteConfirmSheet } from '../../DeleteConfirmSheet'
import { RunWalkSheetDrawer } from '../../runWalk/RunWalkSheetDrawer'
import { ActiveMindHistoryList } from './ActiveMindHistoryList'

type ActiveMindHistoryDrawerProps = {
  visible: boolean
  patientCpf: string
  onClose: () => void
  onSessionsChanged?: () => void
}

export function ActiveMindHistoryDrawer({
  visible,
  patientCpf,
  onClose,
  onSessionsChanged,
}: ActiveMindHistoryDrawerProps) {
  const [sessions, setSessions] = useState<ActiveMindSession[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ActiveMindSession | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadLocal = useCallback(async () => {
    const next = await loadSessions(patientCpf)
    setSessions(next)
  }, [patientCpf])

  const refreshFromRemote = useCallback(
    async (options?: { initial?: boolean }) => {
      const isInitial = options?.initial === true
      if (isInitial) {
        setInitialLoading(true)
      } else {
        setRefreshing(true)
      }

      try {
        const next = await syncSessionsFromRemote(patientCpf)
        setSessions(next)
        if (!isInitial) {
          onSessionsChanged?.()
        }
      } catch {
        await loadLocal()
      } finally {
        if (isInitial) {
          setInitialLoading(false)
        } else {
          setRefreshing(false)
        }
      }
    },
    [loadLocal, onSessionsChanged, patientCpf],
  )

  useEffect(() => {
    if (!visible) return

    setInitialLoading(true)
    setSessions([])
    void refreshFromRemote({ initial: true })
    // Só recarrega ao abrir o drawer (evita loop com callbacks do pai).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, patientCpf])

  async function handleConfirmDelete() {
    if (!pendingDelete) return

    setDeleting(true)
    try {
      await deleteSession(patientCpf, pendingDelete)
      setSessions((current) => current.filter((item) => item.id !== pendingDelete.id))
      setPendingDelete(null)
      onSessionsChanged?.()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <RunWalkSheetDrawer
        visible={visible}
        title="Histórico"
        subtitle="Sessões concluídas no Ativa Mente"
        onClose={onClose}
        fullScreen
        scrollable={false}
        keyboardAware={false}
      >
        <View style={styles.body}>
          {initialLoading ? (
            <AppLoadingState
              message="Carregando histórico..."
              style={styles.loadingState}
            />
          ) : (
            <ActiveMindHistoryList
              sessions={sessions}
              refreshing={refreshing}
              onRefresh={() => {
                void refreshFromRemote()
              }}
              onDeletePress={setPendingDelete}
              ListHeaderComponent={
                sessions.length > 0 ? (
                  <Text style={styles.countLabel}>
                    {sessions.length === 1
                      ? '1 sessão'
                      : `${sessions.length} sessões`}
                  </Text>
                ) : null
              }
            />
          )}
        </View>
      </RunWalkSheetDrawer>

      <DeleteConfirmSheet
        visible={pendingDelete !== null}
        title="Excluir sessão?"
        message="Esta sessão será removida do histórico. A exclusão não pode ser desfeita."
        confirmLabel="Excluir sessão"
        loading={deleting}
        onConfirm={() => {
          void handleConfirmDelete()
        }}
        onClose={() => {
          if (!deleting) setPendingDelete(null)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    minHeight: 0,
  },
  loadingState: {
    flex: 1,
    minHeight: 280,
  },
  countLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
})
