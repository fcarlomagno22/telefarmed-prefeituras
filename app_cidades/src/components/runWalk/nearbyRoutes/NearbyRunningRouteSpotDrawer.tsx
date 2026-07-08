import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  commentRunningRouteSpot,
  loadRunningRouteSpotEngagement,
  voteRunningRouteSpot,
} from '../../../data/runningRouteSpotsService'
import type {
  RunningRouteSpot,
  RunningRouteSpotComment,
  RunningRouteVote,
} from '../../../types/nearbyRunningRoutes'
import {
  formatRunningRouteSpotMeta,
  formatRunningRouteSpotAddress,
  getRunningRouteSpotTypeLabel,
} from '../../../utils/nearbyRunningRoutes'
import { colors } from '../../../theme/colors'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'

type NearbyRunningRouteSpotDrawerProps = {
  visible: boolean
  spot: RunningRouteSpot | null
  userName: string
  onClose: () => void
  onEngagementChange?: (
    spotId: string,
    engagement: { recommendCount: number; notRecommendCount: number },
  ) => void
}

function formatCommentDate(iso: string) {
  const date = new Date(iso)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function CommentItem({ comment }: { comment: RunningRouteSpotComment }) {
  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{comment.authorName}</Text>
        <Text style={styles.commentDate}>{formatCommentDate(comment.createdAt)}</Text>
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
  )
}

export function NearbyRunningRouteSpotDrawer({
  visible,
  spot,
  userName,
  onClose,
  onEngagementChange,
}: NearbyRunningRouteSpotDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingVote, setIsSavingVote] = useState(false)
  const [isPostingComment, setIsPostingComment] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [recommendCount, setRecommendCount] = useState(0)
  const [notRecommendCount, setNotRecommendCount] = useState(0)
  const [userVote, setUserVote] = useState<RunningRouteVote | null>(null)
  const [comments, setComments] = useState<RunningRouteSpotComment[]>([])

  useEffect(() => {
    if (!visible || !spot) return

    const activeSpot = spot
    let cancelled = false

    async function loadEngagement() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const engagement = await loadRunningRouteSpotEngagement(activeSpot.id, {
          recommendCount: activeSpot.recommendCount,
          notRecommendCount: activeSpot.notRecommendCount,
        })
        if (cancelled) return

        setRecommendCount(engagement.recommendCount)
        setNotRecommendCount(engagement.notRecommendCount)
        setUserVote(engagement.userVote)
        setComments(engagement.comments)
        setCommentDraft('')
        onEngagementChange?.(activeSpot.id, {
          recommendCount: engagement.recommendCount,
          notRecommendCount: engagement.notRecommendCount,
        })
      } catch {
        if (cancelled) return
        setLoadError('Não foi possível carregar comentários e votos deste local.')
        setRecommendCount(activeSpot.recommendCount)
        setNotRecommendCount(activeSpot.notRecommendCount)
        setUserVote(null)
        setComments([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadEngagement()

    return () => {
      cancelled = true
    }
  }, [visible, spot?.id, onEngagementChange])

  if (!spot) return null

  const activeSpot = spot

  function publishEngagementCounts(nextRecommend: number, nextNotRecommend: number) {
    onEngagementChange?.(activeSpot.id, {
      recommendCount: nextRecommend,
      notRecommendCount: nextNotRecommend,
    })
  }

  async function handleVote(nextVote: RunningRouteVote) {
    if (isSavingVote) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsSavingVote(true)

    try {
      const toggledVote = userVote === nextVote ? null : nextVote
      const engagement = await voteRunningRouteSpot(activeSpot.id, toggledVote, {
        recommendCount: activeSpot.recommendCount,
        notRecommendCount: activeSpot.notRecommendCount,
      })
      setRecommendCount(engagement.recommendCount)
      setNotRecommendCount(engagement.notRecommendCount)
      setUserVote(engagement.userVote)
      setComments(engagement.comments)
      publishEngagementCounts(engagement.recommendCount, engagement.notRecommendCount)
    } catch {
      setLoadError('Não foi possível registrar seu voto. Tente novamente.')
    } finally {
      setIsSavingVote(false)
    }
  }

  async function handlePostComment() {
    if (isPostingComment || !commentDraft.trim()) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsPostingComment(true)

    try {
      const engagement = await commentRunningRouteSpot(
        activeSpot.id,
        userName,
        commentDraft,
        {
          recommendCount: recommendCount,
          notRecommendCount: notRecommendCount,
        },
      )
      setRecommendCount(engagement.recommendCount)
      setNotRecommendCount(engagement.notRecommendCount)
      setUserVote(engagement.userVote)
      setComments(engagement.comments)
      setCommentDraft('')
      publishEngagementCounts(engagement.recommendCount, engagement.notRecommendCount)
    } catch {
      setLoadError('Não foi possível publicar seu comentário. Tente novamente.')
    } finally {
      setIsPostingComment(false)
    }
  }

  const footer = (
    <View style={styles.commentComposer} pointerEvents="box-none">
      <TextInput
        value={commentDraft}
        onChangeText={setCommentDraft}
        placeholder="Compartilhe sua experiência neste local..."
        placeholderTextColor={colors.textSubtle}
        style={[styles.commentInput, Platform.OS === 'web' && styles.commentInputWeb]}
        multiline
        maxLength={280}
        editable={!isPostingComment}
        textAlignVertical="top"
        returnKeyType="default"
        blurOnSubmit={false}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Publicar comentário"
        onPress={() => void handlePostComment()}
        disabled={isPostingComment || !commentDraft.trim()}
        style={[
          styles.postButton,
          (!commentDraft.trim() || isPostingComment) && styles.postButtonDisabled,
        ]}
      >
        {isPostingComment ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="paper-plane" size={18} color="#fff" />
        )}
      </Pressable>
    </View>
  )

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={activeSpot.name}
      subtitle={`${getRunningRouteSpotTypeLabel(activeSpot.type)} · ${formatRunningRouteSpotMeta(activeSpot)}`}
      onClose={onClose}
      fullScreen
      keyboardAware
      footer={footer}
    >
      {activeSpot.coverPhotoUri ? (
        <Image
          source={{ uri: activeSpot.coverPhotoUri }}
          style={styles.heroImage}
          contentFit="cover"
        />
      ) : (
        <LinearGradient
          colors={['rgba(255, 107, 0, 0.22)', colors.surface]}
          style={styles.heroFallback}
        />
      )}

      {activeSpot.description?.trim() ? (
        <Text style={styles.description}>{activeSpot.description}</Text>
      ) : null}

      <View style={styles.addressCard}>
        <Ionicons name="location-outline" size={16} color="#ff8533" />
        <Text style={styles.addressText}>{formatRunningRouteSpotAddress(activeSpot)}</Text>
      </View>

      {activeSpot.submittedByName ? (
        <Text style={styles.submittedBy}>
          Cadastrado por {activeSpot.submittedByName}
        </Text>
      ) : null}

      {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}

      <View style={styles.voteSection}>
        <Text style={styles.sectionTitle}>Você recomenda este local?</Text>
        <View style={styles.voteRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recomendar local"
            onPress={() => void handleVote('recommend')}
            disabled={isSavingVote}
            style={[
              styles.voteButton,
              styles.voteRecommend,
              userVote === 'recommend' && styles.voteRecommendActive,
            ]}
          >
            <Ionicons
              name={userVote === 'recommend' ? 'thumbs-up' : 'thumbs-up-outline'}
              size={18}
              color={userVote === 'recommend' ? '#166534' : '#4ade80'}
            />
            <Text
              style={[
                styles.voteLabel,
                userVote === 'recommend' && styles.voteRecommendLabelActive,
              ]}
            >
              Recomendo
            </Text>
            <Text
              style={[
                styles.voteCount,
                userVote === 'recommend' && styles.voteRecommendCountActive,
              ]}
            >
              {recommendCount}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Não recomendar local"
            onPress={() => void handleVote('not-recommend')}
            disabled={isSavingVote}
            style={[
              styles.voteButton,
              styles.voteNotRecommend,
              userVote === 'not-recommend' && styles.voteNotRecommendActive,
            ]}
          >
            <Ionicons
              name={userVote === 'not-recommend' ? 'thumbs-down' : 'thumbs-down-outline'}
              size={18}
              color={userVote === 'not-recommend' ? '#991b1b' : '#f87171'}
            />
            <Text
              style={[
                styles.voteLabel,
                userVote === 'not-recommend' && styles.voteNotRecommendLabelActive,
              ]}
            >
              Não recomendo
            </Text>
            <Text
              style={[
                styles.voteCount,
                userVote === 'not-recommend' && styles.voteNotRecommendCountActive,
              ]}
            >
              {notRecommendCount}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.commentsSection}>
        <Text style={styles.sectionTitle}>Comentários da comunidade</Text>
        {isLoading ? (
          <ActivityIndicator color="#ff8533" style={styles.loading} />
        ) : comments.length === 0 ? (
          <Text style={styles.emptyComments}>
            Ainda não há comentários. Seja o primeiro a compartilhar sua experiência.
          </Text>
        ) : (
          comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
        )}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    marginBottom: 14,
  },
  heroFallback: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    marginBottom: 14,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    marginBottom: 10,
  },
  addressText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  submittedBy: {
    color: colors.textSubtle,
    fontSize: 11,
    marginBottom: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  voteSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  voteRow: {
    flexDirection: 'row',
    gap: 10,
  },
  voteButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  voteRecommend: {
    borderColor: 'rgba(74, 222, 128, 0.35)',
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
  },
  voteRecommendActive: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.22)',
  },
  voteNotRecommend: {
    borderColor: 'rgba(248, 113, 113, 0.35)',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  voteNotRecommendActive: {
    borderColor: '#f87171',
    backgroundColor: 'rgba(248, 113, 113, 0.22)',
  },
  voteLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  voteRecommendLabelActive: {
    color: '#166534',
  },
  voteNotRecommendLabelActive: {
    color: '#991b1b',
  },
  voteCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  voteRecommendCountActive: {
    color: '#166534',
  },
  voteNotRecommendCountActive: {
    color: '#991b1b',
  },
  commentsSection: {
    gap: 10,
    paddingBottom: 12,
  },
  loading: {
    marginVertical: 16,
  },
  emptyComments: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  commentCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    gap: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthor: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  commentDate: {
    color: colors.textMuted,
    fontSize: 11,
  },
  commentText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: -20,
    marginTop: -8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    zIndex: 5,
    elevation: 5,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: '#ffffff',
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  commentInputWeb: {
    outlineStyle: 'none',
    cursor: 'text',
  } as object,
  postButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  postButtonDisabled: {
    opacity: 0.45,
  },
})
