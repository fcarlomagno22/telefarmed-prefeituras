import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import type { PatientProviderFilter, PatientProviderOption } from '../../types/myDocuments'
import { filterProviderOptionsByQuery } from '../../utils/myDocuments'
import { WaveTitle } from '../WaveTitle'

const SHEET_OFFSET = 620

type DocumentsProviderFilterDrawerProps = {
  visible: boolean
  options: PatientProviderOption[]
  selectedProvider: PatientProviderFilter | null
  onClose: () => void
  onSelect: (provider: PatientProviderFilter | null) => void
}

export function DocumentsProviderFilterDrawer({
  visible,
  options,
  selectedProvider,
  onClose,
  onSelect,
}: DocumentsProviderFilterDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [query, setQuery] = useState('')
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const filteredOptions = useMemo(
    () => filterProviderOptionsByQuery(options, query),
    [options, query],
  )

  useEffect(() => {
    if (visible) {
      setQuery('')
      setIsMounted(true)
      sheetTranslateY.setValue(SHEET_OFFSET)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible])

  function closeSheet(done?: () => void) {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_OFFSET,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false)
      done?.()
    })
  }

  function handleDismiss() {
    if (!visible) return
    closeSheet(onClose)
  }

  function handleSelect(provider: PatientProviderFilter | null) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSelect(provider)
    handleDismiss()
  }

  if (!isMounted) return null

  return (
    <AppModal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(36, 36, 46, 0.98)', 'rgba(14, 14, 20, 0.99)']}
            style={StyleSheet.absoluteFillObject}
          />

          <LinearGradient
            colors={['#9333ea', '#a855f7', '#c084fc']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topAccent}
          />

          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <WaveTitle text="Médico ou especialidade" />
            </View>
            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Filtre documentos pelo profissional que realizou a consulta
          </Text>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.textSubtle} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar médico ou especialidade"
              placeholderTextColor={colors.textSubtle}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={8}
                style={({ pressed }) => [pressed && styles.clearQueryPressed]}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
              >
                <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!query.trim() ? (
              <Pressable
                onPress={() => handleSelect(null)}
                style={({ pressed }) => [
                  styles.optionRow,
                  !selectedProvider && styles.optionRowActive,
                  pressed && styles.optionRowPressed,
                ]}
              >
                <View style={styles.allIcon}>
                  <Ionicons name="people-outline" size={18} color="#e9d5ff" />
                </View>
                <View style={styles.optionTextCol}>
                  <Text style={styles.optionTitle}>Todos os médicos</Text>
                  <Text style={styles.optionMeta}>Exibir documentos de todas as consultas</Text>
                </View>
                {!selectedProvider ? (
                  <Ionicons name="checkmark-circle" size={18} color="#c4b5fd" />
                ) : null}
              </Pressable>
            ) : null}

            {filteredOptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nenhum médico encontrado</Text>
                <Text style={styles.emptyText}>Tente outro nome ou especialidade.</Text>
              </View>
            ) : (
              filteredOptions.map((option) => {
                const active = selectedProvider?.doctorId === option.doctorId

                return (
                  <Pressable
                    key={option.doctorId}
                    onPress={() => handleSelect(option)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      active && styles.optionRowActive,
                      pressed && styles.optionRowPressed,
                    ]}
                  >
                    {option.avatarUrl ? (
                      <Image source={{ uri: option.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Ionicons name="person-outline" size={18} color="#e9d5ff" />
                      </View>
                    )}

                    <View style={styles.optionTextCol}>
                      <Text style={styles.optionTitle}>{option.doctorName}</Text>
                      <Text style={styles.optionMeta}>{option.specialtyName}</Text>
                      <Text style={styles.optionCount}>
                        {option.consultationCount} consulta
                        {option.consultationCount > 1 ? 's' : ''} · {option.documentCount} documento
                        {option.documentCount > 1 ? 's' : ''}
                      </Text>
                    </View>

                    {active ? (
                      <Ionicons name="checkmark-circle" size={18} color="#c4b5fd" />
                    ) : null}
                  </Pressable>
                )
              })
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    paddingHorizontal: 16,
    gap: 12,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
  },
  titleWrap: {
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearQueryPressed: {
    opacity: 0.7,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  optionRowActive: {
    borderColor: 'rgba(196, 181, 253, 0.35)',
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  optionRowPressed: {
    opacity: 0.9,
  },
  allIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.22)',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.22)',
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  optionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  optionCount: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
})
