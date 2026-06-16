import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  deleteTrustedContact,
  loadSelectedTrustedContactIds,
  loadTrustedContacts,
  setSelectedTrustedContactIds,
  upsertTrustedContact,
  type TrustedContact,
} from '../../data/runWalkSafetyStorage'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { colors } from '../../theme/colors'
import { isValidPhone, maskPhone } from '../../utils/phone'
import { RunWalkSheetDrawer } from './RunWalkSheetDrawer'

type DrawerMode = 'list' | 'form'

type RunWalkTrustedContactsDrawerProps = {
  visible: boolean
  onClose: () => void
  onContactsChange?: () => void
}

function createEmptyForm() {
  return {
    id: null as string | null,
    name: '',
    phone: '',
    liveShareEnabled: true,
  }
}

export function RunWalkTrustedContactsDrawer({
  visible,
  onClose,
  onContactsChange,
}: RunWalkTrustedContactsDrawerProps) {
  const [mode, setMode] = useState<DrawerMode>('list')
  const [contacts, setContacts] = useState<TrustedContact[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [form, setForm] = useState(createEmptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [savedContacts, selectedContactIds] = await Promise.all([
      loadTrustedContacts(),
      loadSelectedTrustedContactIds(),
    ])
    setContacts(savedContacts)
    setSelectedIds(selectedContactIds)
  }, [])

  useEffect(() => {
    if (!visible) {
      setMode('list')
      setForm(createEmptyForm())
      setError(null)
      return
    }
    void loadData()
  }, [loadData, visible])

  function resetFormMode() {
    setMode('list')
    setForm(createEmptyForm())
    setError(null)
  }

  function handleDrawerClose() {
    if (mode === 'form') {
      resetFormMode()
      return
    }
    onClose()
  }

  useAndroidBackHandler(() => {
    if (!visible) return false
    handleDrawerClose()
    return true
  })

  function openCreateForm() {
    setForm(createEmptyForm())
    setError(null)
    setMode('form')
  }

  function openEditForm(contact: TrustedContact) {
    setForm({
      id: contact.id,
      name: contact.name,
      phone: maskPhone(contact.phone),
      liveShareEnabled: contact.liveShareEnabled,
    })
    setError(null)
    setMode('form')
  }

  async function handleToggleContactSelection(contact: TrustedContact) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const nextIds = selectedIds.includes(contact.id)
      ? selectedIds.filter((id) => id !== contact.id)
      : [...selectedIds, contact.id]

    setSelectedIds(nextIds)
    await setSelectedTrustedContactIds(nextIds)
    onContactsChange?.()
  }

  async function handleSelectSingleContact(contact: TrustedContact) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const nextIds = [contact.id]
    setSelectedIds(nextIds)
    await setSelectedTrustedContactIds(nextIds)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onContactsChange?.()
    onClose()
  }

  function handleDeleteContact(contact: TrustedContact) {
    Alert.alert(
      'Excluir contato',
      `Deseja remover ${contact.name} da sua lista de confiança?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const nextContacts = await deleteTrustedContact(contact.id)
              setContacts(nextContacts)
              const nextSelectedIds = await loadSelectedTrustedContactIds()
              setSelectedIds(nextSelectedIds)
              onContactsChange?.()
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            })()
          },
        },
      ],
    )
  }

  async function handleSaveForm() {
    const trimmedName = form.name.trim()
    const trimmedPhone = form.phone.trim()

    if (!trimmedName || !isValidPhone(trimmedPhone)) {
      setError('Informe nome e telefone válidos do contato de confiança.')
      return
    }

    const formattedPhone = maskPhone(trimmedPhone)

    setIsSaving(true)
    setError(null)

    try {
      const contact: TrustedContact = {
        id: form.id ?? `contact-${Date.now()}`,
        name: trimmedName,
        phone: formattedPhone,
        liveShareEnabled: form.liveShareEnabled,
      }

      const nextContacts = await upsertTrustedContact(contact)
      const nextSelectedIds = form.id ? selectedIds : [...selectedIds, contact.id]
      await setSelectedTrustedContactIds(nextSelectedIds)
      setContacts(nextContacts)
      setSelectedIds(nextSelectedIds)
      onContactsChange?.()
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      resetFormMode()
    } catch {
      setError('Não foi possível salvar o contato. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const isEditing = Boolean(form.id)
  const drawerTitle = mode === 'list' ? 'Segurança' : isEditing ? 'Editar contato' : 'Novo contato'
  const drawerSubtitle =
    mode === 'list'
      ? 'Contatos de confiança para compartilhar localização'
      : 'Preencha os dados do contato de confiança'

  const hasMultipleContacts = contacts.length > 1
  const selectedCount = selectedIds.length

  const listFooter = (
    <Pressable
      onPress={openCreateForm}
      style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel="Adicionar contato"
    >
      <LinearGradient
        colors={['#86efac', '#22c55e', '#16a34a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.addGradient}
      >
        <Ionicons name="person-add-outline" size={18} color="#052e16" />
        <Text style={styles.addLabel}>Adicionar contato</Text>
      </LinearGradient>
    </Pressable>
  )

  const formFooter = (
    <Pressable
      onPress={() => void handleSaveForm()}
      disabled={isSaving}
      style={({ pressed }) => [
        styles.saveBtn,
        pressed && !isSaving && styles.saveBtnPressed,
        isSaving && styles.saveBtnDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={isEditing ? 'Salvar alterações' : 'Salvar contato'}
    >
      <LinearGradient
        colors={['#86efac', '#22c55e', '#16a34a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.saveGradient}
      >
        <Text style={styles.saveLabel}>
          {isSaving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar contato'}
        </Text>
      </LinearGradient>
    </Pressable>
  )

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={drawerTitle}
      subtitle={drawerSubtitle}
      onClose={handleDrawerClose}
      minHeight={mode === 'form' ? '66%' : '52%'}
      footer={mode === 'list' ? listFooter : formFooter}
    >
      {mode === 'form' ? (
        <Pressable
          onPress={resetFormMode}
          style={({ pressed }) => [styles.backRow, pressed && styles.backRowPressed]}
          accessibilityRole="button"
          accessibilityLabel="Voltar para lista de contatos"
        >
          <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
          <Text style={styles.backLabel}>Voltar</Text>
        </Pressable>
      ) : null}

      {mode === 'list' ? (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Seus contatos</Text>
            <Text style={styles.sectionCount}>
              {hasMultipleContacts && selectedCount > 0
                ? `${selectedCount} selecionado(s)`
                : contacts.length}
            </Text>
          </View>

          {contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={28} color={colors.textSubtle} />
              <Text style={styles.emptyTitle}>Nenhum contato salvo</Text>
              <Text style={styles.emptyText}>
                Adicione alguém de confiança para compartilhar sua localização ao vivo.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {contacts.map((contact) => {
                const isSelected = selectedIds.includes(contact.id)
                return (
                  <View key={contact.id} style={styles.contactCard}>
                    <View style={styles.cardActions}>
                      <Pressable
                        onPress={() => openEditForm(contact)}
                        style={({ pressed }) => [
                          styles.cardActionBtn,
                          pressed && styles.cardActionBtnPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Editar ${contact.name}`}
                      >
                        <Ionicons name="create-outline" size={16} color={colors.textMuted} />
                      </Pressable>

                      <Pressable
                        onPress={() => handleDeleteContact(contact)}
                        style={({ pressed }) => [
                          styles.cardActionBtn,
                          styles.cardActionBtnDanger,
                          pressed && styles.cardActionBtnPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Excluir ${contact.name}`}
                      >
                        <Ionicons name="trash-outline" size={16} color="#fca5a5" />
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() =>
                        void (hasMultipleContacts
                          ? handleToggleContactSelection(contact)
                          : handleSelectSingleContact(contact))
                      }
                      style={({ pressed }) => [
                        styles.contactMain,
                        isSelected && hasMultipleContacts && styles.contactMainSelected,
                        pressed && styles.contactMainPressed,
                      ]}
                      accessibilityRole={hasMultipleContacts ? 'checkbox' : 'button'}
                      accessibilityState={hasMultipleContacts ? { checked: isSelected } : undefined}
                      accessibilityLabel={
                        hasMultipleContacts
                          ? `${isSelected ? 'Desmarcar' : 'Selecionar'} ${contact.name}`
                          : `Selecionar ${contact.name}`
                      }
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {contact.name.trim().charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.contactTextCol}>
                        <View style={styles.contactTitleRow}>
                          <Text style={styles.contactName}>{contact.name}</Text>
                          {!hasMultipleContacts && isSelected ? (
                            <View style={styles.activeBadge}>
                              <Text style={styles.activeBadgeText}>Ativo</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.contactPhone}>{maskPhone(contact.phone)}</Text>
                      </View>

                      {hasMultipleContacts ? (
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected ? (
                            <Ionicons name="checkmark" size={14} color="#052e16" />
                          ) : null}
                        </View>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
                      )}
                    </Pressable>
                  </View>
                )
              })}
            </View>
          )}
        </>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Nome do contato</Text>
          <TextInput
            value={form.name}
            onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
            placeholder="Ex.: Maria"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
            textContentType="name"
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            value={form.phone}
            onChangeText={(value) => setForm((prev) => ({ ...prev, phone: maskPhone(value) }))}
            placeholder="(00) 00000-0000"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            keyboardType="phone-pad"
            returnKeyType="done"
            textContentType="telephoneNumber"
          />

          <Pressable
            onPress={() =>
              setForm((prev) => ({ ...prev, liveShareEnabled: !prev.liveShareEnabled }))
            }
            style={styles.toggleRow}
            accessibilityRole="switch"
            accessibilityState={{ checked: form.liveShareEnabled }}
          >
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>Localização ao vivo</Text>
              <Text style={styles.toggleHint}>
                Enviar posição em tempo real durante a atividade
              </Text>
            </View>
            <View style={[styles.toggle, form.liveShareEnabled && styles.toggleOn]}>
              <View style={[styles.toggleKnob, form.liveShareEnabled && styles.toggleKnobOn]} />
            </View>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      )}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingRight: 8,
  },
  backRowPressed: {
    opacity: 0.75,
  },
  backLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  contactCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 2,
  },
  cardActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardActionBtnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  cardActionBtnPressed: {
    opacity: 0.82,
  },
  contactMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingTop: 40,
    paddingRight: 12,
  },
  contactMainPressed: {
    opacity: 0.88,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  contactMainSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  avatarText: {
    color: '#86efac',
    fontSize: 16,
    fontWeight: '800',
  },
  contactTextCol: {
    flex: 1,
    gap: 2,
    paddingRight: 64,
  },
  contactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  contactName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  activeBadgeText: {
    color: '#86efac',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  contactPhone: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  checkboxSelected: {
    borderColor: '#86efac',
    backgroundColor: '#86efac',
  },
  addBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  addBtnPressed: {
    opacity: 0.92,
  },
  addGradient: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  addLabel: {
    color: '#052e16',
    fontSize: 15,
    fontWeight: '800',
  },
  form: {
    gap: 10,
    paddingBottom: 8,
  },
  label: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginTop: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 6,
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleHint: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: 'rgba(34, 197, 94, 0.35)',
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  toggleKnobOn: {
    transform: [{ translateX: 18 }],
  },
  error: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnPressed: {
    opacity: 0.92,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveGradient: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  saveLabel: {
    color: '#052e16',
    fontSize: 15,
    fontWeight: '800',
  },
})
