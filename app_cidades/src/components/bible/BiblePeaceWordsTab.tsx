import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useState } from 'react'
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { PEACE_WORDS_CATEGORIES } from '../../data/peaceWordsCatalog'
import { useAuth } from '../../contexts/AuthContext'
import { getBibleRouteParams } from '../../types/auth'
import type { PeaceWordsCategory } from '../../types/bible'
import { colors } from '../../theme/colors'

type BiblePeaceWordsTabProps = {
  bottomPadding: number
  onSelectTopic: (topicId: string) => void
}

function normalizePeaceWordsSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function filterCategories(search: string): PeaceWordsCategory[] {
  const query = normalizePeaceWordsSearch(search)
  if (!query) return PEACE_WORDS_CATEGORIES

  return PEACE_WORDS_CATEGORIES.map((category) => ({
    ...category,
    topics: category.topics.filter((topic) => {
      const haystack = normalizePeaceWordsSearch(`${category.title} ${topic.label}`)
      return haystack.includes(query)
    }),
  })).filter((category) => category.topics.length > 0)
}

export function BiblePeaceWordsTab({ bottomPadding, onSelectTopic }: BiblePeaceWordsTabProps) {
  const { routeParams, navigateTo } = useAuth()
  const { peaceWordsExpandedCategoryId } = getBibleRouteParams(routeParams)
  const [search, setSearch] = useState('')
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    peaceWordsExpandedCategoryId ?? null,
  )
  const categories = useMemo(() => filterCategories(search), [search])

  const totalTopics = useMemo(
    () => categories.reduce((sum, category) => sum + category.topics.length, 0),
    [categories],
  )

  useEffect(() => {
    setExpandedCategoryId(peaceWordsExpandedCategoryId ?? null)
  }, [peaceWordsExpandedCategoryId])

  function handleToggleCategory(categoryId: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setExpandedCategoryId((current) => {
      const next = current === categoryId ? null : categoryId
      navigateTo('bible', {
        segmentTab: 'peace-words',
        peaceWordsExpandedCategoryId: next ?? undefined,
      })
      return next
    })
  }

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Palavras de Paz</Text>
        <Text style={styles.heroTitle}>Encontre conforto na Palavra</Text>
        <Text style={styles.heroSubtitle}>
          Versículos para o que você está sentindo agora.
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textSubtle} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar sentimento ou tema..."
          placeholderTextColor={colors.textSubtle}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
          returnKeyType="search"
        />
        {search.length > 0 && Platform.OS !== 'ios' ? (
          <Pressable
            onPress={() => setSearch('')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Limpar busca"
          >
            <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
          </Pressable>
        ) : null}
      </View>

      {categories.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Nenhum tema encontrado.</Text>
        </View>
      ) : (
        <View style={styles.categoryList}>
          {categories.map((category) => {
            const expanded = expandedCategoryId === category.id

            return (
              <View key={category.id} style={styles.categoryBlock}>
                <Pressable
                  onPress={() => handleToggleCategory(category.id)}
                  style={({ pressed }) => [
                    styles.categoryLine,
                    expanded && styles.categoryLineExpanded,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={`Categoria ${category.title}`}
                >
                  <View
                    style={[styles.categoryAccent, { backgroundColor: category.accent }]}
                  />
                  <Text style={[styles.categoryTitle, expanded && styles.categoryTitleExpanded]}>
                    {category.title}
                  </Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={expanded ? category.accent : colors.textSubtle}
                  />
                </Pressable>

                {expanded ? (
                  <View style={styles.optionsList}>
                    {category.topics.map((topic) => (
                      <Pressable
                        key={topic.id}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                          onSelectTopic(topic.id)
                        }}
                        style={({ pressed }) => [styles.optionItem, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver versículos sobre ${topic.label}`}
                      >
                        <View
                          style={[styles.optionDot, { backgroundColor: category.accent }]}
                        />
                        <Text style={styles.optionText}>{topic.label}</Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            )
          })}
        </View>
      )}

      {search.length === 0 ? (
        <Text style={styles.footerHint}>
          {PEACE_WORDS_CATEGORIES.length} categorias ·{' '}
          {PEACE_WORDS_CATEGORIES.reduce((sum, category) => sum + category.topics.length, 0)} temas
        </Text>
      ) : (
        <Text style={styles.footerHint}>
          {totalTopics} {totalTopics === 1 ? 'tema encontrado' : 'temas encontrados'}
        </Text>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  hero: {
    gap: 6,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  eyebrow: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    padding: 0,
  },
  categoryList: {
    gap: 0,
  },
  categoryBlock: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  categoryLineExpanded: {
    paddingBottom: 10,
  },
  categoryAccent: {
    width: 3,
    height: 20,
    borderRadius: 999,
  },
  categoryTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  categoryTitleExpanded: {
    fontWeight: '700',
  },
  optionsList: {
    paddingLeft: 15,
    paddingBottom: 8,
    gap: 0,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingRight: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  optionText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  emptyWrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  footerHint: {
    color: colors.textSubtle,
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 4,
  },
  pressed: {
    opacity: 0.82,
  },
})
