import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import cityAnimation from '../../../assets/city.json'
import sadAnimation from '../../../assets/sad.json'
import { formStyles } from '../AppShell'
import { RegisterTimeline } from './RegisterTimeline'
import { LottiePlayer } from '../LottiePlayer'
import { PrimaryButton } from '../PrimaryButton'
import { checkMunicipalityClientByCep } from '../../services/mockMunicipalityClient'
import { RegistrationAddress } from '../../types/auth'
import { playFailSound } from '../../utils/appSounds'
import { cepDigits, isValidCep, maskCep } from '../../utils/cep'
import { fetchAddressByCep } from '../../utils/viacep'

type CepStepMode = 'cep' | 'not_client' | 'address'

type RegisterStepCepProps = {
  value: RegistrationAddress
  onChange: (value: RegistrationAddress) => void
  onContinue: () => void
  onBackToLogin: () => void
}

export function RegisterStepCep({
  value,
  onChange,
  onContinue,
  onBackToLogin,
}: RegisterStepCepProps) {
  const [mode, setMode] = useState<CepStepMode>('cep')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notClientCity, setNotClientCity] = useState<string | null>(null)
  const lastFetchedCepRef = useRef('')

  function patch(patch: Partial<RegistrationAddress>) {
    onChange({ ...value, ...patch })
  }

  async function handleSearchCep(cep: string, isCancelled?: () => boolean) {
    setError(null)

    if (!isValidCep(cep)) {
      setError('Informe um CEP válido com 8 dígitos.')
      lastFetchedCepRef.current = ''
      return
    }

    setIsLoading(true)

    try {
      const address = await fetchAddressByCep(cep)
      if (isCancelled?.()) return

      if (!address) {
        setError('CEP não encontrado. Verifique e tente novamente.')
        lastFetchedCepRef.current = ''
        return
      }

      const clientStatus = await checkMunicipalityClientByCep(
        cep,
        address.city,
        address.state,
      )
      if (isCancelled?.()) return

      if (!clientStatus.isClient) {
        const cityLabel = clientStatus.municipality
          ? `${clientStatus.municipality}/${clientStatus.uf}`
          : 'esta região'
        setNotClientCity(cityLabel)
        setMode('not_client')
        void playFailSound()
        return
      }

      onChange({
        ...value,
        cep,
        street: address.street,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        complement: address.complement || value.complement,
      })
      setMode('address')
    } catch {
      if (isCancelled?.()) return
      setError('Não foi possível validar o CEP. Tente novamente.')
      lastFetchedCepRef.current = ''
    } finally {
      if (!isCancelled?.()) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    if (mode !== 'cep') return

    const digits = cepDigits(value.cep)
    if (digits.length !== 8) {
      if (digits.length < 8) lastFetchedCepRef.current = ''
      return
    }

    if (lastFetchedCepRef.current === digits) return

    let cancelled = false
    lastFetchedCepRef.current = digits

    void handleSearchCep(value.cep, () => cancelled)

    return () => {
      cancelled = true
    }
  }, [mode, value.cep])

  function handleContinueAddress() {
    if (!value.number.trim()) {
      setError('Informe o número do endereço.')
      return
    }

    setError(null)
    onContinue()
  }

  function handleTryAnotherCep() {
    lastFetchedCepRef.current = ''
    setMode('cep')
    setError(null)
    setNotClientCity(null)
    patch({
      cep: '',
      street: '',
      neighborhood: '',
      city: '',
      state: '',
      number: '',
      complement: '',
    })
  }

  if (mode === 'not_client') {
    return (
      <>
        <RegisterTimeline currentStep={1} />
        <LottiePlayer source={sadAnimation} />
        <Text style={formStyles.stepTitle}>Município não atendido</Text>
        <Text style={styles.notClientText}>
          O app Telefarmed Sua Cidade é exclusivo para moradores de municípios que possuem
          contrato ativo com a Telefarmed.
          {notClientCity ? `\n\nO CEP informado pertence a ${notClientCity}, que ainda não faz parte da nossa rede.` : ''}
          {'\n\nSe você acredita que sua cidade já é cliente, verifique o CEP ou entre em contato com a prefeitura local.'}
        </Text>

        <PrimaryButton label="Tentar outro CEP" onPress={handleTryAnotherCep} />
        <Pressable onPress={onBackToLogin} style={formStyles.secondaryButton}>
          <Text style={formStyles.secondaryButtonText}>Voltar para o login</Text>
        </Pressable>
      </>
    )
  }

  if (mode === 'address') {
    return (
      <>
        <RegisterTimeline currentStep={1} />
        <LottiePlayer source={cityAnimation} />
        <Text style={formStyles.stepTitle}>Confirme seu endereço</Text>
        <Text style={formStyles.stepSubtitle}>
          Encontramos seu município na rede Telefarmed. Complete os dados da residência.
        </Text>

        {error ? (
          <View style={formStyles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
            <Text style={formStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        <ReadOnlyField label="CEP" value={value.cep} />
        <ReadOnlyField label="Rua" value={value.street} />
        <ReadOnlyField label="Bairro" value={value.neighborhood} />
        <ReadOnlyField label="Cidade" value={`${value.city} / ${value.state}`} />

        <View style={formStyles.fieldGroup}>
          <Text style={formStyles.label}>Número</Text>
          <View style={formStyles.inputWrapper}>
            <Ionicons name="home-outline" size={20} color="#ff6b00" style={formStyles.inputIcon} />
            <TextInput
              value={value.number}
              onChangeText={(number) => patch({ number })}
              placeholder="Ex.: 123"
              placeholderTextColor="rgba(245, 245, 247, 0.35)"
              keyboardType="number-pad"
              style={formStyles.input}
            />
          </View>
        </View>

        <View style={formStyles.fieldGroup}>
          <Text style={formStyles.label}>Complemento</Text>
          <View style={formStyles.inputWrapper}>
            <Ionicons
              name="business-outline"
              size={20}
              color="#ff6b00"
              style={formStyles.inputIcon}
            />
            <TextInput
              value={value.complement}
              onChangeText={(complement) => patch({ complement })}
              placeholder="Apto, bloco, casa..."
              placeholderTextColor="rgba(245, 245, 247, 0.35)"
              style={formStyles.input}
            />
          </View>
        </View>

        <PrimaryButton label="Continuar" onPress={handleContinueAddress} />
        <Pressable onPress={handleTryAnotherCep} style={formStyles.secondaryButton}>
          <Text style={formStyles.secondaryButtonText}>Alterar CEP</Text>
        </Pressable>
      </>
    )
  }

  return (
    <>
      <RegisterTimeline currentStep={1} />
      <LottiePlayer source={cityAnimation} />
      <Text style={formStyles.stepTitle}>Onde você mora?</Text>
      <Text style={formStyles.stepSubtitle}>
        Informe o CEP da sua residência para verificar se seu município faz parte da Telefarmed.
      </Text>

      {error ? (
        <View style={formStyles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#ff6b6b" />
          <Text style={formStyles.errorText}>{error}</Text>
        </View>
      ) : null}

        <View style={formStyles.fieldGroup}>
        <Text style={formStyles.label}>CEP</Text>
        <View style={formStyles.inputWrapper}>
          <Ionicons name="location-outline" size={20} color="#ff6b00" style={formStyles.inputIcon} />
          <TextInput
            value={value.cep}
            onChangeText={(cep) => patch({ cep: maskCep(cep) })}
            placeholder="00000-000"
            placeholderTextColor="rgba(245, 245, 247, 0.35)"
            keyboardType="number-pad"
            maxLength={9}
            editable={!isLoading}
            style={formStyles.input}
          />
          {isLoading ? <ActivityIndicator color="#ff6b00" size="small" /> : null}
        </View>
        {isLoading ? (
          <Text style={styles.loadingHint}>Buscando endereço e validando município...</Text>
        ) : null}
      </View>

      <Pressable onPress={onBackToLogin} style={formStyles.secondaryButton}>
        <Text style={formStyles.secondaryButtonText}>Já tenho conta</Text>
      </Pressable>
    </>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <View style={formStyles.fieldGroup}>
      <Text style={formStyles.label}>{label}</Text>
      <View style={[formStyles.inputWrapper, formStyles.inputWrapperReadOnly]}>
        <Text style={[formStyles.input, formStyles.inputReadOnly]}>{value || '—'}</Text>
      </View>
    </View>
  )
}

const styles = {
  notClientText: {
    color: 'rgba(245, 245, 247, 0.72)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  loadingHint: {
    color: 'rgba(245, 245, 247, 0.55)',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
}
