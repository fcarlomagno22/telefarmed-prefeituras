import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import type { NearbyUbt } from '../../types/nearbyUnits'
import { NearbyUnitDetailPanel } from './NearbyUnitDetailPanel'
import { NearbyUnitListRow } from './NearbyUnitListRow'
import { NearbyUnitsCollapsedPeek } from './NearbyUnitsCollapsedPeek'

export type NearbySheetSnap = 'collapsed' | 'mid' | 'expanded'

type NearbyUnitsBottomSheetProps = {
  ubts: NearbyUbt[]
  selectedId: string | null
  sheetSnap: NearbySheetSnap
  tabBarHeight: number
  onSelectUbt: (id: string) => void
  onSheetSnapChange: (snap: NearbySheetSnap) => void
  onDirections: (ubt: NearbyUbt) => void
  onCall: (ubt: NearbyUbt) => void
  onSchedule: (ubt: NearbyUbt) => void
  onCloseDetail: () => void
}

const HANDLE_HEIGHT = 36
const COLLAPSED_PEEK_HEIGHT = 118
const MID_RATIO = 0.52
const EXPANDED_RATIO = 0.82

function getSnapOffsets(screenHeight: number, bottomInset: number, tabBarHeight: number) {
  const collapsed =
    HANDLE_HEIGHT + COLLAPSED_PEEK_HEIGHT + tabBarHeight + Math.max(bottomInset, 8)
  const mid = screenHeight * MID_RATIO
  const expanded = screenHeight * EXPANDED_RATIO

  return {
    collapsed: screenHeight - collapsed,
    mid: screenHeight - mid,
    expanded: screenHeight - expanded,
  }
}

function resolveSnap(
  projected: number,
  velocityY: number,
  dragDy: number,
  offsets: { collapsed: number; mid: number; expanded: number },
  hasSelection: boolean,
  fromSnap: NearbySheetSnap,
): NearbySheetSnap {
  if (velocityY < -0.2 || dragDy < -40) {
    if (hasSelection) return 'expanded'
    if (fromSnap === 'collapsed') return 'expanded'
    if (projected <= offsets.expanded + 40) return 'expanded'
    return 'mid'
  }

  if (velocityY > 0.2 || dragDy > 40) {
    if (hasSelection && projected > offsets.mid + 30) return 'mid'
    if (fromSnap === 'expanded' && !hasSelection && projected > offsets.mid + 30) {
      return 'mid'
    }
    return 'collapsed'
  }

  if (fromSnap === 'collapsed' && dragDy < -12) return 'expanded'

  const thresholdCollapsedMid = (offsets.collapsed + offsets.mid) / 2
  const thresholdMidExpanded = (offsets.mid + offsets.expanded) / 2

  if (fromSnap === 'collapsed' && projected < thresholdCollapsedMid) return 'expanded'
  if (projected <= thresholdMidExpanded) return 'expanded'
  if (projected <= thresholdCollapsedMid) return 'mid'
  return 'collapsed'
}

export function NearbyUnitsBottomSheet({
  ubts,
  selectedId,
  sheetSnap,
  tabBarHeight,
  onSelectUbt,
  onSheetSnapChange,
  onDirections,
  onCall,
  onSchedule,
  onCloseDetail,
}: NearbyUnitsBottomSheetProps) {
  const insets = useSafeAreaInsets()
  const screenHeight = Dimensions.get('window').height
  const offsets = useMemo(
    () => getSnapOffsets(screenHeight, insets.bottom, tabBarHeight),
    [screenHeight, insets.bottom, tabBarHeight],
  )

  const translateY = useRef(new Animated.Value(offsets.collapsed)).current
  const dragStartY = useRef(offsets.collapsed)
  const dragStartSnap = useRef<NearbySheetSnap>('collapsed')
  const isDragging = useRef(false)
  const selectedIdRef = useRef(selectedId)
  const sheetSnapRef = useRef(sheetSnap)
  const onSheetSnapChangeRef = useRef(onSheetSnapChange)

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    sheetSnapRef.current = sheetSnap
  }, [sheetSnap])

  useEffect(() => {
    onSheetSnapChangeRef.current = onSheetSnapChange
  }, [onSheetSnapChange])

  const animateToSnap = useCallback(
    (snap: NearbySheetSnap, notifyParent = true) => {
      sheetSnapRef.current = snap
      Animated.spring(translateY, {
        toValue: offsets[snap],
        damping: 28,
        stiffness: 280,
        mass: 0.85,
        useNativeDriver: true,
      }).start()
      if (notifyParent) {
        onSheetSnapChangeRef.current(snap)
      }
    },
    [offsets, translateY],
  )

  useEffect(() => {
    if (isDragging.current) return
    if (sheetSnapRef.current === sheetSnap) return
    animateToSnap(sheetSnap, false)
  }, [animateToSnap, sheetSnap])

  useEffect(() => {
    if (selectedId) {
      animateToSnap('expanded')
    }
  }, [animateToSnap, selectedId])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > Math.abs(gesture.dx) && Math.abs(gesture.dy) > 4,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          isDragging.current = true
          dragStartSnap.current = sheetSnapRef.current
          translateY.stopAnimation((value) => {
            dragStartY.current = value
          })
        },
        onPanResponderMove: (_, gesture) => {
          const next = Math.min(
            offsets.collapsed,
            Math.max(offsets.expanded, dragStartY.current + gesture.dy),
          )
          translateY.setValue(next)
        },
        onPanResponderRelease: (_, gesture) => {
          isDragging.current = false
          const projected = dragStartY.current + gesture.dy + gesture.vy * 55
          const snap = resolveSnap(
            projected,
            gesture.vy,
            gesture.dy,
            offsets,
            Boolean(selectedIdRef.current),
            dragStartSnap.current,
          )
          animateToSnap(snap)
        },
        onPanResponderTerminate: () => {
          isDragging.current = false
          animateToSnap(sheetSnapRef.current)
        },
      }),
    [animateToSnap, offsets, translateY],
  )

  const selectedUbt = ubts.find((ubt) => ubt.id === selectedId) ?? null
  const nearestUbt = ubts[0] ?? null

  const showDetail = Boolean(selectedUbt && sheetSnap === 'expanded')
  const showCollapsed = sheetSnap === 'collapsed'
  const showList = !showDetail && !showCollapsed

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          paddingBottom: tabBarHeight + Math.max(insets.bottom, 8),
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[styles.dragSurface, showCollapsed && styles.dragSurfaceCollapsed]}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragZone}>
          <View style={styles.handle} />
          <Text style={styles.dragHint}>
            {showCollapsed ? 'Arraste para ver as unidades' : 'Arraste para ver mais'}
          </Text>
        </View>

        {showCollapsed && nearestUbt ? (
          <NearbyUnitsCollapsedPeek
            ubt={nearestUbt}
            totalCount={ubts.length}
            onPress={() => onSelectUbt(nearestUbt.id)}
            onExpandList={() => animateToSnap('expanded')}
          />
        ) : null}
      </View>

      <View style={styles.contentArea}>
        {showDetail && selectedUbt ? (
          <ScrollView
            style={styles.detailScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailScroll}
            bounces={false}
          >
            <NearbyUnitDetailPanel
              ubt={selectedUbt}
              onDirections={() => onDirections(selectedUbt)}
              onCall={() => onCall(selectedUbt)}
              onSchedule={() => onSchedule(selectedUbt)}
              onClose={onCloseDetail}
            />
          </ScrollView>
        ) : null}

        {showList ? (
          <ScrollView
            style={styles.listScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <Text style={styles.listTitle}>
              {ubts.length} unidade{ubts.length === 1 ? '' : 's'} encontrada
              {ubts.length === 1 ? '' : 's'}
            </Text>

            {ubts.map((ubt) => (
              <NearbyUnitListRow
                key={ubt.id}
                ubt={ubt}
                selected={ubt.id === selectedId}
                onPress={() => onSelectUbt(ubt.id)}
              />
            ))}
          </ScrollView>
        ) : null}

        {ubts.length === 0 && !showList ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhuma unidade encontrada</Text>
            <Text style={styles.emptySubtitle}>Tente outro filtro ou termo de busca.</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: Dimensions.get('window').height,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#14141a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 12,
  },
  dragZone: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 16,
    gap: 6,
  },
  dragSurface: {
    zIndex: 2,
  },
  dragSurfaceCollapsed: {
    paddingBottom: 4,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  dragHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
  },
  listScrollView: {
    flex: 1,
  },
  detailScrollView: {
    flex: 1,
  },
  listScroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 16,
  },
  listTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailScroll: {
    paddingBottom: 24,
  },
  empty: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
})
