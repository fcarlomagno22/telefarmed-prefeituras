import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  deletePacienteNotification,
  listPacienteNotifications,
  markAllPacienteNotificationsRead,
  markPacienteNotificationRead,
} from '../../data/pacienteNotificationsService'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../theme/colors'
import type { PacienteNotification } from '../../types/pacienteNotification'
import { cpfDigits } from '../../utils/cpf'
import { DeleteConfirmSheet } from '../DeleteConfirmSheet'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MenuNotificationsDrawerProps = {
  visible: boolean
  onClose: () => void
}

type DrawerStep = 'list' | 'detail'

function formatNotificationDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (sameDay) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

export function MenuNotificationsDrawer({ visible, onClose }: MenuNotificationsDrawerProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<DrawerStep>('list')
  const [items, setItems] = useState<PacienteNotification[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const patientCpf = cpfDigits(user?.cpf ?? '')
  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )
  const unreadCount = useMemo(() => items.filter((item) => !item.readAt).length, [items])

  const loadNotifications = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!patientCpf) {
        setItems([])
        return
      }

      if (mode === 'initial') setIsLoading(true)
      if (mode === 'refresh') setIsRefreshing(true)

      try {
        const next = await listPacienteNotifications(patientCpf)
        setItems(next)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [patientCpf],
  )

  useEffect(() => {
    if (!visible) return

    setStep('list')
    setSelectedId(null)
    void loadNotifications('initial')
  }, [loadNotifications, visible])

  function handleClose() {
    setStep('list')
    setSelectedId(null)
    setDeleteTargetId(null)
    onClose()
  }

  async function openNotification(notification: PacienteNotification) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedId(notification.id)
    setStep('detail')

    if (!notification.readAt && patientCpf) {
      await markPacienteNotificationRead(patientCpf, notification.id)
      setItems((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      )
    }
  }

  async function handleMarkAllRead() {
    if (!patientCpf || unreadCount === 0 || isMutating) return

    setIsMutating(true)
    try {
      await markAllPacienteNotificationsRead(patientCpf)
      const readAt = new Date().toISOString()
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })))
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } finally {
      setIsMutating(false)
    }
  }

  function requestDelete(notificationId: string) {
    if (!patientCpf || isMutating) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setDeleteTargetId(notificationId)
  }

  async function confirmDelete() {
    if (!patientCpf || !deleteTargetId || isMutating) return

    const notificationId = deleteTargetId
    setIsMutating(true)
    try {
      await deletePacienteNotification(patientCpf, notificationId)
      setItems((current) => current.filter((item) => item.id !== notificationId))
      setStep('list')
      setSelectedId(null)
      setDeleteTargetId(null)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } finally {
      setIsMutating(false)
    }
  }

  return (
    <>
    <RunWalkSheetDrawer
      visible={visible}
      title={step === 'detail' ? 'Aviso' : 'Notificações'}
      subtitle={
        step === 'detail'
          ? selected?.senderLabel ?? 'Telefarmed'
          : unreadCount > 0
            ? `${unreadCount} não lida${unreadCount === 1 ? '' : 's'}`
            : 'Seus avisos e comunicados'
      }
      onClose={step === 'detail' ? () => setStep('list') : handleClose}
      fullScreen
      scrollable
      dense
      footer={
        step === 'detail' && selected ? (
          <View style={styles.detailActions}>
            <Pressable
              onPress={() => requestDelete(selected.id)}
              style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Excluir notificação"
            >
              <Ionicons name="trash-outline" size={18} color="#fca5a5" />
              <Text style={styles.deleteBtnText}>Excluir</Text>
            </Pressable>
          </View>
        ) : unreadCount > 0 ? (
          <Pressable
            onPress={() => void handleMarkAllRead()}
            disabled={isMutating}
            style={({ pressed }) => [styles.markAllBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Marcar todas como lidas"
          >
            <Ionicons name="checkmark-done-outline" size={18} color={colors.primaryLight} />
            <Text style={styles.markAllText}>Marcar todas como lidas</Text>
          </Pressable>
        ) : null
      }
    >
      {!patientCpf ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="person-circle-outline" size={42} color={colors.textSubtle} />
          <Text style={styles.emptyTitle}>Entre na sua conta</Text>
          <Text style={styles.emptyText}>
            As notificações da plataforma aparecem aqui quando você estiver logado.
          </Text>
        </View>
      ) : step === 'detail' && selected ? (
        <View style={styles.detailWrap}>
          {selected.priority === 'important' ? (
            <View style={styles.importantBadge}>
              <Ionicons name="alert-circle" size={14} color="#fbbf24" />
              <Text style={styles.importantBadgeText}>Importante</Text>
            </View>
          ) : null}

          <Text style={styles.detailTitle}>{selected.title}</Text>
          <Text style={styles.detailMeta}>
            {selected.senderLabel} · {formatNotificationDate(selected.sentAt)}
          </Text>
          <Text style={styles.detailBody}>{selected.body}</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primaryLight} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="notifications-off-outline" size={42} color={colors.textSubtle} />
          <Text style={styles.emptyTitle}>Nenhum aviso por aqui</Text>
          <Text style={styles.emptyText}>
            Quando a Telefarmed ou sua prefeitura enviar comunicados pelo app, eles vão aparecer
            nesta caixa de entrada.
          </Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          <Pressable
            onPress={() => void loadNotifications('refresh')}
            disabled={isRefreshing}
            style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Atualizar notificações"
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={colors.primaryLight} />
            ) : (
              <Ionicons name="refresh-outline" size={16} color={colors.primaryLight} />
            )}
            <Text style={styles.refreshText}>Atualizar</Text>
          </Pressable>

          {items.map((item) => {
            const unread = !item.readAt

            return (
              <Pressable
                key={item.id}
                onPress={() => void openNotification(item)}
                style={({ pressed }) => [
                  styles.row,
                  unread && styles.rowUnread,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View style={[styles.rowIconWrap, unread && styles.rowIconWrapUnread]}>
                  <Ionicons
                    name={unread ? 'mail-unread-outline' : 'mail-open-outline'}
                    size={18}
                    color={unread ? colors.primaryLight : colors.textMuted}
                  />
                </View>

                <View style={styles.rowCopy}>
                  <View style={styles.rowTitleLine}>
                    <Text style={[styles.rowTitle, unread && styles.rowTitleUnread]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.priority === 'important' ? (
                      <View style={styles.rowImportantDot} />
                    ) : null}
                  </View>
                  <Text style={styles.rowPreview} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {item.senderLabel} · {formatNotificationDate(item.sentAt)}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
              </Pressable>
            )
          })}
        </View>
      )}
    </RunWalkSheetDrawer>

    <DeleteConfirmSheet
      visible={deleteTargetId !== null}
      title="Excluir notificação?"
      message="Deseja remover este aviso da sua caixa de entrada? Essa ação não pode ser desfeita."
      confirmLabel="Excluir notificação"
      loading={isMutating}
      onConfirm={() => void confirmDelete()}
      onClose={() => {
        if (isMutating) return
        setDeleteTargetId(null)
      }}
    />
    </>
  )
}

const styles = StyleSheet.create({
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  listWrap: {
    gap: 8,
  },
  refreshBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.25)',
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
    marginBottom: 4,
  },
  refreshText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  rowUnread: {
    borderColor: 'rgba(255, 133, 51, 0.22)',
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  rowIconWrapUnread: {
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowTitle: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rowTitleUnread: {
    color: colors.text,
  },
  rowImportantDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
  rowPreview: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  rowMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 12,
    gap: 10,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  detailWrap: {
    gap: 12,
    paddingBottom: 8,
  },
  importantBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.28)',
  },
  importantBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  detailTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  detailMeta: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  detailBody: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 23,
  },
  detailActions: {
    width: '100%',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.28)',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  deleteBtnText: {
    color: '#fca5a5',
    fontSize: 15,
    fontWeight: '700',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.28)',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  markAllText: {
    color: colors.primaryLight,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
})
