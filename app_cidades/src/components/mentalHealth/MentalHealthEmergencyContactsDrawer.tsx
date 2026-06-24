import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Keyboard, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  deleteTrustedContact,
  loadTrustedContacts,
  upsertTrustedContact,
  type TrustedContact,
} from '../../data/runWalkSafetyStorage'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { colors } from '../../theme/colors'
import { isValidPhone, maskPhone } from '../../utils/phone'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type DrawerMode = 'list' | 'form'

type MentalHealthEmergencyContactsDrawerProps = {
  visible: boolean
  onClose: () => void
}

function dialPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return
  void Linking.openURL(`tel:${digits}`)
}

function createEmptyForm() {
  return {
    id: null as string | null,
    name: '',
    phone: '',
  }
}

export function MentalHealthEmergencyContactsDrawer({
  visible,
  onClose,
}: MentalHealthEmergencyContactsDrawerProps) {
  const [mode, setMode] = useState<DrawerMode>('list')
  const [contacts, setContacts] = useState<TrustedContact[]>([])
  const [form, setForm] = useState(createEmptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const savedContacts = await loadTrustedContacts()
    setContacts(savedContacts)
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
    Keyboard.dismiss()
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

  function handleCallContact(contact: TrustedContact) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    dialPhone(contact.phone)
  }

  function handleDeleteContact(contact: TrustedContact) {
    Alert.alert(
      'Excluir contato',
      `Deseja remover ${contact.name} da sua lista de emergência?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const nextContacts = await deleteTrustedContact(contact.id)
              setContacts(nextContacts)
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
      setError('Informe nome e telefone válidos.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const contact: TrustedContact = {
        id: form.id ?? `contact-${Date.now()}`,
        name: trimmedName,
        phone: maskPhone(trimmedPhone),
        liveShareEnabled: true,
      }

      const nextContacts = await upsertTrustedContact(contact)
      setContacts(nextContacts)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      resetFormMode()
      Keyboard.dismiss()
    } catch {
      setError('Não foi possível salvar o contato. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const listFooter = (
    <Pressable
      onPress={openCreateForm}
      style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Adicionar contato de emergência"
    >
      <LinearGradient
        colors={['#93c5fd', '#3b82f6', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.addGradient}
      >
        <Ionicons name="person-add-outline" size={18} color="#eff6ff" />
        <Text style={styles.addLabel}>Adicionar contato de emergência</Text>
      </LinearGradient>
    </Pressable>
  )

  const formFooter = (
    <Pressable
      onPress={() => void handleSaveForm()}
      disabled={isSaving}
      style={({ pressed }) => [
        styles.saveBtn,
        pressed && !isSaving && styles.pressed,
        isSaving && styles.saveBtnDisabled,
      ]}
    >
      <LinearGradient
        colors={['#93c5fd', '#3b82f6', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.saveGradient}
      >
        <Text style={styles.saveLabel}>{isSaving ? 'Salvando...' : 'Salvar contato'}</Text>
      </LinearGradient>
    </Pressable>
  )

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={mode === 'list' ? 'Contatos de emergência' : 'Novo contato'}
      subtitle={
        mode === 'list'
          ? 'Ligue para alguém de confiança agora'
          : 'Quem você gostaria de poder ligar em um momento difícil?'
      }
      onClose={handleDrawerClose}
      minHeight={mode === 'form' ? '58%' : '52%'}
      footer={mode === 'list' ? listFooter : formFooter}
    >
      {mode === 'form' ? (
        <Pressable
          onPress={resetFormMode}
          style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
          <Text style={styles.backLabel}>Voltar</Text>
        </Pressable>
      ) : null}

      {mode === 'list' ? (
        contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={28} color={colors.textSubtle} />
            <Text style={styles.emptyTitle}>Nenhum contato cadastrado</Text>
            <Text style={styles.emptyText}>
              Adicione alguém de confiança para ligar quando precisar de apoio.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {contacts.map((contact) => (
              <View key={contact.id} style={styles.contactCard}>
                <Pressable
                  onPress={() => handleCallContact(contact)}
                  style={({ pressed }) => [styles.contactMain, pressed && styles.pressed]}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {contact.name.trim().charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactTextCol}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{maskPhone(contact.phone)}</Text>
                  </View>
                  <Ionicons name="call-outline" size={20} color="#93c5fd" />
                </Pressable>

                <Pressable
                  onPress={() => handleDeleteContact(contact)}
                  style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                  accessibilityLabel={`Excluir ${contact.name}`}
                >
                  <Ionicons name="trash-outline" size={16} color="#fca5a5" />
                </Pressable>
              </View>
            ))}
          </View>
        )
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            value={form.name}
            onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
            placeholder="Ex.: Maria"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
            autoCapitalize="words"
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
            textContentType="telephoneNumber"
          />

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
  backLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  contactCard: {
    position: 'relative',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  contactMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingRight: 44,
  },
  deleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.28)',
  },
  avatarText: {
    color: '#93c5fd',
    fontSize: 16,
    fontWeight: '800',
  },
  contactTextCol: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  contactPhone: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    borderRadius: 14,
    overflow: 'hidden',
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
    color: '#eff6ff',
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
  error: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
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
    color: '#eff6ff',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.88,
  },
})
