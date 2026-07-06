import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { appEnv } from '../../config/env'
import { useAuth } from '../../contexts/AuthContext'
import { colors } from '../../theme/colors'
import { maskCpf } from '../../utils/cpf'
import { maskPhone } from '../../utils/phone'
import { ProfileAvatar } from '../profile/ProfileAvatar'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import {
  MenuProfileContactEditDrawer,
  type MenuProfileContactField,
} from './MenuProfileContactEditDrawer'

type MenuProfileDrawerProps = {
  visible: boolean
  onClose: () => void
  userName?: string
  userEmail?: string
  userPhone?: string
  userCpf?: string
  selfieUri?: string | null
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  const displayValue = value?.trim() || 'Não informado'

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{displayValue}</Text>
    </View>
  )
}

function EditableProfileField({
  label,
  value,
  onPress,
}: {
  label: string
  value?: string | null
  onPress: () => void
}) {
  const displayValue = value?.trim() || 'Não informado'

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.editableField, pressed && styles.editableFieldPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Editar ${label.toLowerCase()}`}
    >
      <View style={styles.editableCopy}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{displayValue}</Text>
      </View>
      <Ionicons name="create-outline" size={18} color={colors.primaryLight} />
    </Pressable>
  )
}

export function MenuProfileDrawer({
  visible,
  onClose,
  userName,
  userEmail,
  userPhone,
  userCpf,
  selfieUri,
}: MenuProfileDrawerProps) {
  const { user, updateContact } = useAuth()
  const [editingField, setEditingField] = useState<MenuProfileContactField | null>(null)

  const resolvedName = userName ?? user?.name
  const resolvedEmail = userEmail ?? user?.email
  const resolvedPhone = userPhone ?? user?.phone
  const resolvedCpf = userCpf ?? user?.cpf
  const resolvedSelfie = selfieUri ?? user?.selfieUri
  const formattedCpf = resolvedCpf ? maskCpf(resolvedCpf) : undefined
  const formattedPhone = resolvedPhone ? maskPhone(resolvedPhone) : undefined

  async function handleSaveContact(value: string) {
    if (editingField === 'email') {
      await updateContact({ email: value })
      return
    }

    if (editingField === 'phone') {
      await updateContact({ phone: value })
    }
  }

  return (
    <>
      <RunWalkSheetDrawer
        visible={visible}
        title="Meu perfil"
        subtitle="Dados da sua conta"
        onClose={onClose}
      >
        <View style={styles.hero}>
          <ProfileAvatar selfieUri={resolvedSelfie} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroName}>{resolvedName?.trim() || 'Usuário'}</Text>
            <Text style={styles.heroSubtitle}>Telefarmed {appEnv.municipalityName}</Text>
          </View>
        </View>

        <ProfileField label="Nome completo" value={resolvedName} />
        <EditableProfileField
          label="E-mail"
          value={resolvedEmail}
          onPress={() => setEditingField('email')}
        />
        <EditableProfileField
          label="Telefone"
          value={formattedPhone}
          onPress={() => setEditingField('phone')}
        />
        <ProfileField label="CPF" value={formattedCpf} />
      </RunWalkSheetDrawer>

      <MenuProfileContactEditDrawer
        visible={editingField != null}
        field={editingField}
        initialValue={editingField === 'email' ? resolvedEmail : resolvedPhone}
        onClose={() => setEditingField(null)}
        onSave={handleSaveContact}
      />
    </>
  )
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  field: {
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  editableFieldPressed: {
    opacity: 0.88,
  },
  editableCopy: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  fieldValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
})
