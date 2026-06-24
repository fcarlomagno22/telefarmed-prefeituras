import { StyleSheet, Text, View } from 'react-native'
import { appEnv } from '../../config/env'
import { colors } from '../../theme/colors'
import { maskCpf } from '../../utils/cpf'
import { ProfileAvatar } from '../profile/ProfileAvatar'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

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

export function MenuProfileDrawer({
  visible,
  onClose,
  userName,
  userEmail,
  userPhone,
  userCpf,
  selfieUri,
}: MenuProfileDrawerProps) {
  const formattedCpf = userCpf ? maskCpf(userCpf) : undefined

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Meu perfil"
      subtitle="Dados da sua conta"
      onClose={onClose}
    >
      <View style={styles.hero}>
        <ProfileAvatar selfieUri={selfieUri} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroName}>{userName?.trim() || 'Usuário'}</Text>
          <Text style={styles.heroSubtitle}>Telefarmed {appEnv.municipalityName}</Text>
        </View>
      </View>

      <ProfileField label="Nome completo" value={userName} />
      <ProfileField label="E-mail" value={userEmail} />
      <ProfileField label="Telefone" value={userPhone} />
      <ProfileField label="CPF" value={formattedCpf} />
    </RunWalkSheetDrawer>
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
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
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
