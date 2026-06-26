import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  addSpotComment,
  loadSpotEngagement,
  setSpotVote,
} from '../../../data/nearbyRunningRoutesStorage'
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
  patientCpf: string
  userName: string
  onClose: () => void
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
  patientCpf,
  userName,
  onClose,
}: NearbyRunningRouteSpotDrawerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingVote, setIsSavingVote] = useState(false)
  const [isPostingComment, setIsPostingComment] = useState(false)
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
      try {
        const engagement = await loadSpotEngagement(
          patientCpf,
          activeSpot.id,
          activeSpot.recommendCount,
          activeSpot.notRecommendCount,
        )
        if (cancelled) return

        setRecommendCount(engagement.recommendCount)
        setNotRecommendCount(engagement.notRecommendCount)
        setUserVote(engagement.userVote)
        setComments(engagement.comments)
        setCommentDraft('')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadEngagement()

    return () => {
      cancelled = true
    }
  }, [visible, spot, patientCpf])

  if (!spot) return null

  const activeSpot = spot

  async function handleVote(nextVote: RunningRouteVote) {
    if (isSavingVote) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsSavingVote(true)

    try {
      const toggledVote = userVote === nextVote ? null : nextVote
      const engagement = await setSpotVote(
        patientCpf,
        activeSpot.id,
        activeSpot.recommendCount,
        activeSpot.notRecommendCount,
        toggledVote,
      )
      setRecommendCount(engagement.recommendCount)
      setNotRecommendCount(engagement.notRecommendCount)
      setUserVote(engagement.userVote)
    } finally {
      setIsSavingVote(false)
    }
  }

  async function handlePostComment() {
    if (isPostingComment || !commentDraft.trim()) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsPostingComment(true)

    try {
      const engagement = await addSpotComment(
        patientCpf,
        activeSpot.id,
        activeSpot.recommendCount,
        activeSpot.notRecommendCount,
        userName,
        commentDraft,
      )
      setRecommendCount(engagement.recommendCount)
      setNotRecommendCount(engagement.notRecommendCount)
      setUserVote(engagement.userVote)
      setComments(engagement.comments)
      setCommentDraft('')
    } finally {
      setIsPostingComment(false)
    }
  }

  const footer = (
    <View style={styles.commentComposer}>
      <TextInput
        value={commentDraft}
        onChangeText={setCommentDraft}
        placeholder="Compartilhe sua experiência neste local..."
        placeholderTextColor="rgba(245,245,247,0.45)"
        style={styles.commentInput}
        multiline
        maxLength={280}
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
          <Ionicons name="send" size={18} color="#fff" />
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
          colors={['rgba(255, 107, 0, 0.22)', 'rgba(14, 14, 20, 0.6)']}
          style={styles.heroFallback}
        />
      )}

      <Text style={styles.description}>{activeSpot.description}</Text>

      <View style={styles.addressCard}>
        <Ionicons name="location-outline" size={16} color="#ff8533" />
        <Text style={styles.addressText}>{formatRunningRouteSpotAddress(activeSpot)}</Text>
      </View>

      {activeSpot.submittedByName ? (
        <Text style={styles.submittedBy}>
          Cadastrado por {activeSpot.submittedByName}
        </Text>
      ) : null}

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
              color={userVote === 'recommend' ? '#fff' : '#4ade80'}
            />
            <Text
              style={[
                styles.voteLabel,
                userVote === 'recommend' && styles.voteLabelActive,
              ]}
            >
              Recomendo
            </Text>
            <Text
              style={[
                styles.voteCount,
                userVote === 'recommend' && styles.voteCountActive,
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
              color={userVote === 'not-recommend' ? '#fff' : '#f87171'}
            />
            <Text
              style={[
                styles.voteLabel,
                userVote === 'not-recommend' && styles.voteLabelActive,
              ]}
            >
              Não recomendo
            </Text>
            <Text
              style={[
                styles.voteCount,
                userVote === 'not-recommend' && styles.voteCountActive,
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
    backgroundColor: 'rgba(74, 222, 128, 0.28)',
  },
  voteNotRecommend: {
    borderColor: 'rgba(248, 113, 113, 0.35)',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  voteNotRecommendActive: {
    borderColor: '#f87171',
    backgroundColor: 'rgba(248, 113, 113, 0.28)',
  },
  voteLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  voteLabelActive: {
    color: '#fff',
  },
  voteCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  voteCountActive: {
    color: '#fff',
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
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0e0e14',
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  postButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b00',
  },
  postButtonDisabled: {
    opacity: 0.45,
  },
})
