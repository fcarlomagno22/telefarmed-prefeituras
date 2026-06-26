import { useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import { colors } from '../../theme/colors'
import { PeriodSelection } from '../../types/metrics'
import {
  formatChartAxisLabel,
  formatChartDateLabel,
  formatChartHourLabel,
  formatDateKey,
  isHourlyPeriod,
  isTodayPeriod,
  parseDateKey,
} from '../../utils/metricsPeriod'
import { SkeletonBone } from '../SkeletonBone'

type ChartPoint = {
  date: string
  hour?: number
  value: number
  diastolic?: number
}

type RenderPoint = ChartPoint & {
  x: number
  y: number
}

type YRange = {
  paddedMin: number
  paddedRange: number
}

type LiveAnimMode = 'slide' | 'extend' | 'idle'

type MetricsAreaChartProps = {
  data: ChartPoint[]
  unit: string
  metricLabel: string
  accentColor: string
  width: number
  height?: number
  animateKey?: string | number
  scrollToken?: number
  period: PeriodSelection
  skeleton?: boolean
  forceDailyAxis?: boolean
  interactionPaused?: boolean
  emptyMessage?: string
}

const DAILY_VIEWPORT_SIZE = 7
const HOURLY_VIEWPORT_SIZE = 10
const PAN_ACTIVATION_PX = 6
const HIT_RADIUS_PX = 26
const X_LABEL_EDGE_INSET = 8
const TOOLTIP_ESTIMATED_WIDTH = 148

const PADDING_LEFT = 42
const PADDING_RIGHT = 12
const PADDING_TOP = 16
const PADDING_BOTTOM = 30
const LIVE_ANIM_MS = 2100
const REVEAL_MS = 920
const SCROLL_PHASE_RATIO = 0.45
const DRAW_X_PHASE_RATIO = 0.38
const DEFAULT_CHART_HEIGHT = 210
const DEFAULT_PLOT_HEIGHT = DEFAULT_CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

function getPointKey(point: ChartPoint) {
  return point.hour !== undefined ? `${point.date}T${String(point.hour).padStart(2, '0')}` : point.date
}

function getPlotWidth(chartWidth: number) {
  return chartWidth
}

function getPeriodTimestamp(point: ChartPoint, hourly: boolean, endOfSlot = false) {
  const date = parseDateKey(point.date)
  if (hourly && point.hour !== undefined) {
    date.setHours(point.hour, endOfSlot ? 59 : 0, endOfSlot ? 59 : 0, endOfSlot ? 999 : 0)
    return date.getTime()
  }
  if (endOfSlot) date.setHours(23, 59, 59, 999)
  return date.getTime()
}

function getPointTimeRatio(
  point: ChartPoint,
  viewportPeriod: PeriodSelection,
  hourly: boolean,
): number {
  if (hourly && point.hour !== undefined) {
    const start = getPeriodTimestamp(
      { date: formatDateKey(viewportPeriod.start), hour: viewportPeriod.start.getHours(), value: 0 },
      true,
    )
    const end = getPeriodTimestamp(
      { date: formatDateKey(viewportPeriod.end), hour: viewportPeriod.end.getHours(), value: 0 },
      true,
      true,
    )
    const range = Math.max(end - start, 1)
    const timestamp = getPeriodTimestamp(point, true)
    return Math.max(0, Math.min(1, (timestamp - start) / range))
  }

  const start = parseDateKey(formatDateKey(viewportPeriod.start)).getTime()
  const endDate = parseDateKey(formatDateKey(viewportPeriod.end))
  endDate.setHours(23, 59, 59, 999)
  const end = endDate.getTime()
  const range = Math.max(end - start, 1)
  const timestamp = getPeriodTimestamp(point, false)
  return Math.max(0, Math.min(1, (timestamp - start) / range))
}

function getPlotXByTime(
  point: ChartPoint,
  viewportPeriod: PeriodSelection,
  hourly: boolean,
  contentWidth: number,
) {
  return getPointTimeRatio(point, viewportPeriod, hourly) * contentWidth
}

function buildViewportPeriod(points: ChartPoint[], hourly: boolean): PeriodSelection {
  if (points.length === 0) {
    const now = new Date()
    return { preset: 'custom', start: now, end: now }
  }

  const first = points[0]
  const last = points[points.length - 1]

  if (hourly && first.hour !== undefined) {
    const start = parseDateKey(first.date)
    start.setHours(first.hour, 0, 0, 0)
    const end = parseDateKey(last.date)
    end.setHours(last.hour ?? 0, 59, 59, 999)
    return { preset: 'custom', start, end }
  }

  return {
    preset: 'custom',
    start: parseDateKey(first.date),
    end: parseDateKey(last.date),
  }
}

function getContentWidth(
  data: ChartPoint[],
  plotWidth: number,
  viewportSize: number,
  hourly: boolean,
) {
  if (data.length <= 1) return plotWidth
  if (data.length <= viewportSize) return plotWidth

  const fullPeriod = buildViewportPeriod(data, hourly)
  const viewportData = data.slice(data.length - viewportSize)
  const viewportPeriod = buildViewportPeriod(viewportData, hourly)

  const fullStart = getPeriodTimestamp(
    { date: formatDateKey(fullPeriod.start), hour: fullPeriod.start.getHours(), value: 0 },
    hourly,
  )
  const fullEnd = getPeriodTimestamp(
    { date: formatDateKey(fullPeriod.end), hour: fullPeriod.end.getHours(), value: 0 },
    hourly,
    true,
  )
  const viewportStart = getPeriodTimestamp(
    { date: formatDateKey(viewportPeriod.start), hour: viewportPeriod.start.getHours(), value: 0 },
    hourly,
  )
  const viewportEnd = getPeriodTimestamp(
    { date: formatDateKey(viewportPeriod.end), hour: viewportPeriod.end.getHours(), value: 0 },
    hourly,
    true,
  )

  const fullRange = Math.max(fullEnd - fullStart, 1)
  const viewportRange = Math.max(viewportEnd - viewportStart, 1)
  return plotWidth * (fullRange / viewportRange)
}

function clampScrollX(value: number, maxScroll: number) {
  return Math.max(0, Math.min(maxScroll, value))
}

function getYRange(points: ChartPoint[]): YRange {
  const values = points.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = Math.max(maxValue - minValue, 1.2)
  const paddedMin = minValue - valueRange * 0.15
  const paddedMax = maxValue + valueRange * 0.15
  return { paddedMin, paddedRange: paddedMax - paddedMin }
}

function getYPosition(value: number, range: YRange, chartHeight: number) {
  return PADDING_TOP + chartHeight - ((value - range.paddedMin) / range.paddedRange) * chartHeight
}

function getVisiblePoints(points: RenderPoint[], scrollX: number, plotWidth: number) {
  const minX = scrollX - 12
  const maxX = scrollX + plotWidth + 12
  return points.filter((point) => point.x >= minX && point.x <= maxX)
}

function getXLabelIndexes(
  data: ChartPoint[],
  viewportPeriod: PeriodSelection,
  hourly: boolean,
) {
  if (data.length <= 1) return [0]
  if (data.length <= 4) return Array.from({ length: data.length }, (_, index) => index)

  const targets = [0, 0.5, 1]
  const picked = targets.map((target) => {
    let bestIndex = 0
    let bestDistance = Number.POSITIVE_INFINITY

    data.forEach((point, index) => {
      const ratio = getPointTimeRatio(point, viewportPeriod, hourly)
      const distance = Math.abs(ratio - target)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })

    return bestIndex
  })

  return [...new Set(picked)].sort((left, right) => left - right)
}

function formatPointValueLabel(value: number, unit: string, diastolic?: number) {
  if (unit === 'mmHg' && diastolic !== undefined) {
    return `${Math.round(value)}/${Math.round(diastolic)} mmHg`
  }

  if (!unit && value >= 1000) {
    return Math.round(value).toLocaleString('pt-BR')
  }

  const core = formatAxisValue(value, unit)
  if (unit === 'km') return `${core} km`
  if (unit === 'kg') return `${core} kg`
  if (unit === 'L') return `${core} L`
  if (unit === 'kg/m²') return `${core} kg/m²`
  if (unit === 'cm') return `${core} cm`
  if (unit === 'mmHg') return `${core} mmHg`
  if (unit === 'mg/dL') return `${core} mg/dL`
  if (unit === 'bpm') return `${core} bpm`
  if (unit === '%') return core
  if (unit === 'índice') return core
  if (!unit) return core
  return `${core} ${unit}`
}

function formatPointWhenLabel(
  point: ChartPoint,
  period: PeriodSelection,
  forceDailyAxis: boolean,
) {
  if (!forceDailyAxis && isHourlyPeriod(period) && point.hour !== undefined) {
    const dateLabel = isTodayPeriod(period) ? 'Hoje' : formatChartDateLabel(point.date)
    return `${dateLabel} às ${formatChartHourLabel(point.hour)}`
  }

  const date = parseDateKey(point.date)
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

function getTooltipAnchor(point: RenderPoint, scrollX: number) {
  const anchorX = PADDING_LEFT + point.x - scrollX
  const showBelow = point.y < 58
  const top = showBelow ? point.y + 14 : point.y - 48

  return { anchorX, top, showBelow }
}

function formatAxisValue(value: number, unit: string) {
  if (unit === 'km') return value.toFixed(1).replace('.', ',')
  if (unit === 'kg') return value.toFixed(1).replace('.', ',')
  if (unit === 'L') return value.toFixed(1).replace('.', ',')
  if (unit === 'kg/m²') return value.toFixed(1).replace('.', ',')
  if (unit === 'cm') return String(Math.round(value))
  if (unit === 'mmHg' || unit === 'mg/dL' || unit === 'bpm') return String(Math.round(value))
  if (unit === '%') return `${Math.round(value)}%`
  if (unit === 'índice' || (value > 0 && value < 3)) {
    return value.toFixed(2).replace('.', ',')
  }
  if (value >= 1000) return `${Math.round(value / 1000)}k`
  if (Math.abs(value) >= 100) return String(Math.round(value))
  if (Math.abs(value - Math.round(value)) < 0.05) return String(Math.round(value))
  return value.toFixed(1).replace('.', ',')
}

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t
}

function clamp01(t: number) {
  return Math.max(0, Math.min(1, t))
}

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4)
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function isWindowSlide(prevData: ChartPoint[], nextData: ChartPoint[]) {
  if (prevData.length !== nextData.length || nextData.length < 2) return false
  return getPointKey(prevData[1]) === getPointKey(nextData[0])
}

function detectLiveMode(prevData: ChartPoint[], nextData: ChartPoint[]): LiveAnimMode {
  if (prevData.length === 0 || nextData.length === 0) return 'idle'
  if (isWindowSlide(prevData, nextData)) return 'slide'

  const prevLast = prevData[prevData.length - 1]
  const nextLast = nextData[nextData.length - 1]
  if (prevLast && nextLast && getPointKey(prevLast) === getPointKey(nextLast)) {
    return 'extend'
  }

  return 'slide'
}

function getAnimPhases(progress: number, mode: LiveAnimMode) {
  if (mode === 'idle') return { scroll: 1, drawX: 1, drawY: 1 }

  const p = clamp01(progress)

  if (mode === 'extend') {
    return { scroll: 1, drawX: 1, drawY: easeOutQuart(p) }
  }

  const scrollRaw = Math.min(1, p / SCROLL_PHASE_RATIO)
  const drawRaw =
    p <= SCROLL_PHASE_RATIO ? 0 : (p - SCROLL_PHASE_RATIO) / (1 - SCROLL_PHASE_RATIO)

  const drawXRaw = Math.min(1, drawRaw / DRAW_X_PHASE_RATIO)
  const drawYRaw =
    drawRaw <= DRAW_X_PHASE_RATIO
      ? 0
      : (drawRaw - DRAW_X_PHASE_RATIO) / (1 - DRAW_X_PHASE_RATIO)

  return {
    scroll: easeInOutCubic(scrollRaw),
    drawX: easeInOutCubic(drawXRaw),
    drawY: easeOutQuart(drawYRaw),
  }
}

function getLiveSlotOffset(drawX: number, columnStep: number) {
  return columnStep * (1 - drawX)
}

function getColumnStep(
  points: ChartPoint[],
  period: PeriodSelection,
  hourly: boolean,
  contentWidth: number,
  plotWidth: number,
  viewportSize: number,
) {
  if (points.length >= 2) {
    const x0 = getPlotXByTime(points[0], period, hourly, contentWidth)
    const x1 = getPlotXByTime(points[1], period, hourly, contentWidth)
    if (x1 > x0) return x1 - x0
  }

  return plotWidth / Math.max(viewportSize - 1, 1)
}

function buildRenderPoints(
  prevData: ChartPoint[],
  nextData: ChartPoint[],
  progress: number,
  contentWidth: number,
  prevContentWidth: number,
  chartHeight: number,
  yRange: YRange,
  fullPeriod: PeriodSelection,
  prevPeriod: PeriodSelection,
  hourly: boolean,
  columnStep: number,
): { points: RenderPoint[]; mode: LiveAnimMode; isAnimating: boolean } {
  const length = nextData.length
  const mode = progress >= 1 || prevData.length === 0 ? 'idle' : detectLiveMode(prevData, nextData)
  const { drawX, drawY } = getAnimPhases(progress, mode)
  const isAnimating = mode !== 'idle' && progress < 1

  if (mode === 'idle') {
    const points = nextData.map((point) => ({
      ...point,
      x: getPlotXByTime(point, fullPeriod, hourly, contentWidth),
      y: getYPosition(point.value, yRange, chartHeight),
    }))
    return { points, mode, isAnimating: false }
  }

  const prevLast = prevData[prevData.length - 1]
  const nextLast = nextData[length - 1]

  if (mode === 'extend') {
    const fromY = getYPosition(prevLast.value, yRange, chartHeight)
    const toY = getYPosition(nextLast.value, yRange, chartHeight)

    const points = nextData.map((point, index) => {
      const isLast = index === length - 1
      return {
        ...point,
        x: getPlotXByTime(point, fullPeriod, hourly, contentWidth),
        y: isLast ? lerp(fromY, toY, drawY) : getYPosition(point.value, yRange, chartHeight),
        value: isLast ? lerp(prevLast.value, nextLast.value, drawY) : point.value,
      }
    })

    return { points, mode, isAnimating: true }
  }

  const slotOffset = getLiveSlotOffset(drawX, columnStep)
  const points: RenderPoint[] = []

  for (let index = 0; index < length - 1; index += 1) {
    const nextPoint = nextData[index]
    const prevPoint = prevData[index + 1] ?? nextPoint
    const fromX = getPlotXByTime(prevPoint, prevPeriod, hourly, prevContentWidth)
    const toX = getPlotXByTime(nextPoint, fullPeriod, hourly, contentWidth) - slotOffset
    const fromY = getYPosition(prevPoint.value, yRange, chartHeight)
    const toY = getYPosition(nextPoint.value, yRange, chartHeight)

    points.push({
      ...nextPoint,
      x: lerp(fromX, toX, drawX),
      y: lerp(fromY, toY, drawY),
    })
  }

  const fromX = getPlotXByTime(prevLast, prevPeriod, hourly, prevContentWidth)
  const toX = getPlotXByTime(nextLast, fullPeriod, hourly, contentWidth)
  const fromY = getYPosition(prevLast.value, yRange, chartHeight)
  const toY = getYPosition(nextLast.value, yRange, chartHeight)

  points.push({
    ...nextLast,
    x: lerp(fromX, toX, drawX),
    y: lerp(fromY, toY, drawY),
    value: lerp(prevLast.value, nextLast.value, drawY),
  })

  return { points, mode, isAnimating: true }
}

function buildPaths(points: RenderPoint[], bottomY: number) {
  if (points.length === 0) {
    return { linePath: '', areaPath: '' }
  }

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`
  return { linePath, areaPath }
}

function getGridXPositions(contentWidth: number, scrollX: number, plotWidth: number) {
  const visibleStart = scrollX
  const visibleEnd = scrollX + plotWidth
  const positions: number[] = []
  const step = plotWidth / 3

  for (let index = 0; index <= 3; index += 1) {
    const x = visibleStart + (step * index)
    if (x >= visibleStart - 1 && x <= visibleEnd + 1) {
      positions.push(x)
    }
  }

  if (positions.length === 0) {
    return Array.from({ length: 4 }, (_, index) => (index / 3) * contentWidth)
  }

  return positions
}

function getXLabelLayout(
  point: RenderPoint,
  labelPosition: number,
  labelIndexes: number[],
  contentWidth: number,
) {
  const isFirst = labelPosition === 0
  const isLast = labelPosition === labelIndexes.length - 1
  const textAnchor: 'start' | 'middle' | 'end' = isFirst ? 'start' : isLast ? 'end' : 'middle'

  let plotX = point.x
  if (textAnchor === 'start') plotX = Math.max(plotX, X_LABEL_EDGE_INSET)
  if (textAnchor === 'end') plotX = Math.min(plotX, contentWidth - X_LABEL_EDGE_INSET)

  return { x: plotX, textAnchor }
}

function getViewportHint(
  points: RenderPoint[],
  scrollX: number,
  plotWidth: number,
  hourly: boolean,
) {
  const visible = getVisiblePoints(points, scrollX, plotWidth)
  if (visible.length === 0) return ''

  const first = visible[0]
  const last = visible[visible.length - 1]

  if (hourly && first.hour !== undefined) {
    return `${formatChartDateLabel(first.date)} · ${formatChartHourLabel(first.hour)} – ${formatChartHourLabel(last.hour ?? first.hour)}`
  }

  if (first.date === last.date) {
    return formatChartDateLabel(first.date)
  }

  return `${formatChartDateLabel(first.date)} – ${formatChartDateLabel(last.date)}`
}

export const MetricsAreaChart = memo(MetricsAreaChartComponent)

function MetricsAreaChartComponent({
  data,
  unit,
  metricLabel,
  accentColor,
  width,
  height = 210,
  animateKey,
  scrollToken = 0,
  period,
  skeleton = false,
  forceDailyAxis = false,
  interactionPaused = false,
  emptyMessage = 'Sem dados para o período selecionado',
}: MetricsAreaChartProps) {
  const revealWidth = useRef(new Animated.Value(width)).current
  const liveProgress = useRef(new Animated.Value(1)).current
  const pulseScale = useRef(new Animated.Value(1)).current
  const prevDataRef = useRef<ChartPoint[]>(data)
  const prevScrollToken = useRef(0)
  const prevAnimateKey = useRef(animateKey)
  const didInitialReveal = useRef(false)

  const [frameProgress, setFrameProgress] = useState(1)
  const [animFromData, setAnimFromData] = useState<ChartPoint[] | null>(null)
  const [lockedYRange, setLockedYRange] = useState<YRange | null>(null)
  const [selectedPointKey, setSelectedPointKey] = useState<string | null>(null)
  const [scrollX, setScrollX] = useState(0)
  const [tooltipMeasuredWidth, setTooltipMeasuredWidth] = useState(TOOLTIP_ESTIMATED_WIDTH)

  const panSessionRef = useRef({
    startScrollX: 0,
  })
  const scrollXRef = useRef(0)
  const maxScrollRef = useRef(0)
  const liveAnimStartScrollRef = useRef(0)
  const liveAnimActiveRef = useRef(false)
  const pointsRef = useRef<RenderPoint[]>([])
  const isAnimatingRef = useRef(false)

  const chartWidth = width - PADDING_LEFT - PADDING_RIGHT
  const chartHeight = height - PADDING_TOP - PADDING_BOTTOM
  const plotWidth = getPlotWidth(chartWidth)
  const hourly = !forceDailyAxis && isHourlyPeriod(period)
  const viewportSize = hourly ? HOURLY_VIEWPORT_SIZE : DAILY_VIEWPORT_SIZE
  const fullPeriod = useMemo(() => buildViewportPeriod(data, hourly), [data, hourly])
  const contentWidth = useMemo(
    () => getContentWidth(data, plotWidth, viewportSize, hourly),
    [data, plotWidth, viewportSize, hourly],
  )
  const maxScrollX = Math.max(0, contentWidth - plotWidth)
  const canPan = maxScrollX > 0

  scrollXRef.current = scrollX
  maxScrollRef.current = maxScrollX

  function runRevealAnimation() {
    liveProgress.stopAnimation()
    liveProgress.setValue(1)
    setFrameProgress(1)
    setAnimFromData(null)
    setLockedYRange(null)
    revealWidth.stopAnimation()
    revealWidth.setValue(0)
    Animated.timing(revealWidth, {
      toValue: width,
      duration: REVEAL_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }

  function runLiveAnimation(fromData: ChartPoint[]) {
    revealWidth.stopAnimation()
    revealWidth.setValue(width)
    liveProgress.stopAnimation()
    liveProgress.setValue(0)
    liveAnimStartScrollRef.current = scrollXRef.current
    liveAnimActiveRef.current = true
    setAnimFromData(fromData)
    setLockedYRange(getYRange(fromData))
    setFrameProgress(0)

    Animated.timing(liveProgress, {
      toValue: 1,
      duration: LIVE_ANIM_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        prevDataRef.current = data
        liveAnimActiveRef.current = false
        setAnimFromData(null)
        setLockedYRange(null)
        setFrameProgress(1)
        setScrollX(maxScrollRef.current)
      }
    })
  }

  useEffect(() => {
    const listenerId = liveProgress.addListener(({ value }) => {
      setFrameProgress(value)
    })
    return () => liveProgress.removeListener(listenerId)
  }, [liveProgress])

  useEffect(() => {
    if (interactionPaused) {
      pulseScale.stopAnimation()
      pulseScale.setValue(1)
      return undefined
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.55,
          duration: 950,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [interactionPaused, pulseScale])

  useEffect(() => {
    if (skeleton) return

    const animateKeyChanged = animateKey !== prevAnimateKey.current
    prevAnimateKey.current = animateKey

    if (!didInitialReveal.current) {
      didInitialReveal.current = true
      revealWidth.setValue(width)
      prevDataRef.current = data
      setAnimFromData(null)
      setLockedYRange(null)
      liveAnimActiveRef.current = false
      prevScrollToken.current = scrollToken
      return
    }

    if (animateKeyChanged) {
      prevDataRef.current = data
      setAnimFromData(null)
      setLockedYRange(null)
      liveAnimActiveRef.current = false
      prevScrollToken.current = scrollToken
      runRevealAnimation()
    }
  }, [width, accentColor, animateKey, scrollToken, data, skeleton, revealWidth])

  useLayoutEffect(() => {
    if (skeleton || !didInitialReveal.current) return
    if (scrollToken <= 0 || scrollToken === prevScrollToken.current || data.length === 0) return

    prevScrollToken.current = scrollToken
    runLiveAnimation([...prevDataRef.current])
  }, [scrollToken, data, skeleton, width])

  useEffect(() => {
    if (liveAnimActiveRef.current) return
    setScrollX(maxScrollX)
    setSelectedPointKey(null)
  }, [animateKey, maxScrollX])

  useEffect(() => {
    if (!skeleton && didInitialReveal.current) {
      revealWidth.setValue(width)
    }
  }, [width, skeleton, revealWidth])

  const holdPreviousFrame =
    scrollToken > 0 &&
    scrollToken !== prevScrollToken.current &&
    animFromData === null &&
    prevDataRef.current.length > 0
  const snapshotData = prevDataRef.current
  const isLiveFrame = !holdPreviousFrame && frameProgress < 1 && animFromData !== null
  const toData = holdPreviousFrame ? snapshotData : data
  const fromData =
    animFromData ??
    (holdPreviousFrame || liveAnimActiveRef.current ? snapshotData : data)
  const snapshotPeriod = useMemo(
    () => buildViewportPeriod(snapshotData, hourly),
    [snapshotData, hourly],
  )
  const snapshotContentWidth = useMemo(
    () => getContentWidth(snapshotData, plotWidth, viewportSize, hourly),
    [snapshotData, plotWidth, viewportSize, hourly],
  )
  const endYRange = useMemo(() => getYRange(toData), [toData])
  const prevContentWidth = useMemo(
    () =>
      animFromData || holdPreviousFrame || liveAnimActiveRef.current
        ? snapshotContentWidth
        : contentWidth,
    [animFromData, holdPreviousFrame, snapshotContentWidth, contentWidth],
  )
  const prevPeriod = useMemo(
    () =>
      animFromData || holdPreviousFrame || liveAnimActiveRef.current
        ? snapshotPeriod
        : fullPeriod,
    [animFromData, holdPreviousFrame, snapshotPeriod, fullPeriod],
  )
  const liveMode = useMemo((): LiveAnimMode => {
    if (!isLiveFrame || !animFromData) return 'idle'
    return detectLiveMode(animFromData, data)
  }, [isLiveFrame, animFromData, data])
  const { scroll: scrollPhase, drawX: drawXPhase, drawY: drawYPhase } = getAnimPhases(
    frameProgress,
    isLiveFrame ? liveMode : 'idle',
  )
  const yRange = useMemo(() => {
    if (!lockedYRange) return endYRange

    if (!isLiveFrame) return lockedYRange

    return {
      paddedMin: lerp(lockedYRange.paddedMin, endYRange.paddedMin, drawYPhase),
      paddedRange: lerp(lockedYRange.paddedRange, endYRange.paddedRange, drawYPhase),
    }
  }, [lockedYRange, endYRange, isLiveFrame, drawYPhase])
  const liveColumnStep = useMemo(() => {
    const basis = animFromData ?? snapshotData
    if (basis.length === 0) return plotWidth / Math.max(viewportSize - 1, 1)
    return getColumnStep(
      basis,
      prevPeriod,
      hourly,
      prevContentWidth,
      plotWidth,
      viewportSize,
    )
  }, [animFromData, snapshotData, prevPeriod, hourly, prevContentWidth, plotWidth, viewportSize])
  const liveSlotOffset = useMemo(() => {
    if (!isLiveFrame) return 0
    return getLiveSlotOffset(drawXPhase, liveColumnStep)
  }, [isLiveFrame, drawXPhase, liveColumnStep])
  const contentScrollX = useMemo(() => {
    if (holdPreviousFrame || !isLiveFrame) return scrollX

    const startScroll = liveAnimStartScrollRef.current
    return lerp(startScroll, maxScrollX, scrollPhase)
  }, [holdPreviousFrame, isLiveFrame, scrollX, maxScrollX, scrollPhase])
  const renderProgress = holdPreviousFrame ? 1 : frameProgress
  const plotContentWidth = useMemo(() => {
    if (holdPreviousFrame) return snapshotContentWidth
    if (!isLiveFrame) return contentWidth
    return lerp(prevContentWidth, contentWidth, scrollPhase)
  }, [
    holdPreviousFrame,
    snapshotContentWidth,
    isLiveFrame,
    scrollPhase,
    prevContentWidth,
    contentWidth,
  ])

  const { points, isAnimating } = useMemo(
    () =>
      buildRenderPoints(
        fromData,
        toData,
        renderProgress,
        holdPreviousFrame || isLiveFrame ? prevContentWidth : contentWidth,
        prevContentWidth,
        chartHeight,
        yRange,
        holdPreviousFrame || isLiveFrame ? prevPeriod : fullPeriod,
        prevPeriod,
        hourly,
        liveColumnStep,
      ),
    [
      fromData,
      toData,
      renderProgress,
      holdPreviousFrame,
      isLiveFrame,
      contentWidth,
      prevContentWidth,
      chartHeight,
      yRange,
      fullPeriod,
      prevPeriod,
      hourly,
      liveColumnStep,
    ],
  )

  isAnimatingRef.current = isAnimating
  pointsRef.current = points

  const visiblePlotPoints = useMemo(
    () => getVisiblePoints(points, contentScrollX, plotWidth),
    [points, contentScrollX, plotWidth],
  )

  const visiblePeriod = useMemo(
    () => buildViewportPeriod(visiblePlotPoints, hourly),
    [visiblePlotPoints, hourly],
  )
  const xLabelIndexes = getXLabelIndexes(visiblePlotPoints, visiblePeriod, hourly)
  const viewportHint = getViewportHint(points, contentScrollX, plotWidth, hourly)

  function selectPoint(point: RenderPoint) {
    if (isAnimatingRef.current || interactionPaused) return

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const key = getPointKey(point)
    setSelectedPointKey((current) => (current === key ? null : key))
  }

  function applyScrollDelta(startScrollX: number, deltaX: number) {
    const maxScroll = maxScrollRef.current
    const raw = startScrollX - deltaX

    if (raw < 0) {
      setScrollX(raw * 0.28)
      return
    }

    if (raw > maxScroll) {
      setScrollX(maxScroll + (raw - maxScroll) * 0.28)
      return
    }

    setScrollX(raw)
  }

  function settleScroll(startScrollX: number, deltaX: number) {
    const maxScroll = maxScrollRef.current
    setScrollX(clampScrollX(startScrollX - deltaX, maxScroll))
  }

  const applyScrollDeltaRef = useRef(applyScrollDelta)
  applyScrollDeltaRef.current = applyScrollDelta
  const settleScrollRef = useRef(settleScroll)
  settleScrollRef.current = settleScroll

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .enabled(canPan && !interactionPaused && !isAnimating)
        .activeOffsetX([-PAN_ACTIVATION_PX, PAN_ACTIVATION_PX])
        .failOffsetY([-PAN_ACTIVATION_PX * 2, PAN_ACTIVATION_PX * 2])
        .onBegin(() => {
          panSessionRef.current.startScrollX = scrollXRef.current
        })
        .onUpdate((event) => {
          if (Math.abs(event.translationX) >= PAN_ACTIVATION_PX) {
            setSelectedPointKey(null)
          }
          applyScrollDeltaRef.current(panSessionRef.current.startScrollX, event.translationX)
        })
        .onEnd((event) => {
          settleScrollRef.current(panSessionRef.current.startScrollX, event.translationX)
        }),
    [canPan, interactionPaused, isAnimating],
  )

  if (skeleton) {
    return (
      <View style={{ width, height }}>
        <View style={styles.skeletonYAxis}>
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBone key={index} width={28} height={9} borderRadius={4} />
          ))}
        </View>
        <View
          style={[
            styles.skeletonPlot,
            {
              left: PADDING_LEFT,
              top: PADDING_TOP,
              width: chartWidth,
              height: chartHeight,
            },
          ]}
        >
          <SkeletonBone width={chartWidth} height={chartHeight} borderRadius={12} />
        </View>
        <View style={[styles.skeletonXAxis, { left: PADDING_LEFT, width: chartWidth }]}>
          {[0, 1, 2].map((index) => (
            <SkeletonBone key={index} width={42} height={9} borderRadius={4} />
          ))}
        </View>
      </View>
    )
  }

  if (data.length === 0) {
    return (
      <View style={[styles.emptyWrap, { width, height }]}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    )
  }

  const bottomY = PADDING_TOP + chartHeight
  const { linePath, areaPath } = buildPaths(points, bottomY)
  const liveHead = points.length > 0 ? points[points.length - 1] : null
  const staticPoints = liveHead ? points.slice(0, -1) : points

  const yTicks = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3
    const value = yRange.paddedMin + (1 - ratio) * yRange.paddedRange
    const y = PADDING_TOP + ratio * chartHeight
    return { value, y }
  })

  const gradientId = `areaFill-${accentColor.replace('#', '')}`
  const strokeId = `lineStroke-${accentColor.replace('#', '')}`
  const selectedPoint = points.find((point) => getPointKey(point) === selectedPointKey) ?? null
  const tooltipAnchor = selectedPoint ? getTooltipAnchor(selectedPoint, contentScrollX) : null
  const tooltipWidth = tooltipMeasuredWidth || TOOLTIP_ESTIMATED_WIDTH
  const tooltipLeft = tooltipAnchor
    ? Math.min(
        Math.max(tooltipAnchor.anchorX - tooltipWidth / 2, 6),
        width - tooltipWidth - 6,
      )
    : 0
  const gridXPositions = getGridXPositions(plotContentWidth, contentScrollX, plotWidth)
  const visiblePointKeys = new Set(visiblePlotPoints.map((point) => getPointKey(point)))
  const pointHitTargets = [...visiblePlotPoints]
  if (liveHead && !visiblePointKeys.has(getPointKey(liveHead))) {
    pointHitTargets.push(liveHead)
  }

  return (
    <View style={[styles.chartRoot, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={accentColor} stopOpacity="0.42" />
            <Stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {yTicks.map((tick) => (
          <SvgText
            key={`ylabel-${tick.y}`}
            x={PADDING_LEFT - 8}
            y={tick.y + 4}
            fontSize={9}
            fill={colors.textSubtle}
            textAnchor="end"
          >
            {formatAxisValue(tick.value, unit)}
          </SvgText>
        ))}
      </Svg>

      <Animated.View
        style={[
          styles.revealMask,
          {
            width: revealWidth,
            height,
          },
        ]}
        pointerEvents="none"
      >
        <View
          style={[
            styles.plotClip,
            {
              left: PADDING_LEFT,
              top: 0,
              width: plotWidth,
              height,
            },
          ]}
        >
          <View
            style={{
              width: plotContentWidth,
              height,
              transform: [{ translateX: -contentScrollX }],
            }}
          >
            <Svg width={plotContentWidth} height={height}>
              <Defs>
                <LinearGradient id={`${gradientId}-animated`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={accentColor} stopOpacity="0.48" />
                  <Stop offset="100%" stopColor={accentColor} stopOpacity="0.03" />
                </LinearGradient>
                <LinearGradient id={`${strokeId}-animated`} x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0%" stopColor={accentColor} stopOpacity="0.85" />
                  <Stop offset="100%" stopColor={accentColor} stopOpacity="1" />
                </LinearGradient>
              </Defs>

              {xLabelIndexes.map((index, labelPosition) => {
                const point = visiblePlotPoints[index]
                if (!point) return null
                const labelLayout = getXLabelLayout(
                  point,
                  labelPosition,
                  xLabelIndexes,
                  plotContentWidth,
                )
                return (
                  <SvgText
                    key={`xlabel-${point.date}-${point.hour ?? ''}`}
                    x={labelLayout.x}
                    y={height - 8}
                    fontSize={9}
                    fill={colors.textSubtle}
                    textAnchor={labelLayout.textAnchor}
                  >
                    {formatChartAxisLabel(point, period, forceDailyAxis)}
                  </SvgText>
                )
              })}

              {yTicks.slice(1, -1).map((tick) => (
                <Line
                  key={`grid-h-${tick.y}`}
                  x1={Math.max(0, contentScrollX)}
                  y1={tick.y}
                  x2={Math.min(plotContentWidth, contentScrollX + plotWidth)}
                  y2={tick.y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth={1}
                />
              ))}

              {gridXPositions.map((x) => (
                <Line
                  key={`grid-v-${x}`}
                  x1={x - liveSlotOffset}
                  y1={PADDING_TOP}
                  x2={x - liveSlotOffset}
                  y2={PADDING_TOP + chartHeight}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth={1}
                />
              ))}

              {areaPath ? <Path d={areaPath} fill={`url(#${gradientId}-animated)`} /> : null}

              {linePath ? (
                <Path
                  d={linePath}
                  fill="none"
                  stroke={`url(#${strokeId}-animated)`}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {staticPoints.map((point) => {
                const key = getPointKey(point)
                const isSelected = selectedPointKey === key
                return (
                  <Circle
                    key={key}
                    cx={point.x}
                    cy={point.y}
                    r={isSelected ? 6 : 4}
                    fill={accentColor}
                    stroke={isSelected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)'}
                    strokeWidth={isSelected ? 2 : 1.2}
                  />
                )
              })}

              {selectedPoint ? (
                <Line
                  x1={selectedPoint.x}
                  y1={PADDING_TOP}
                  x2={selectedPoint.x}
                  y2={PADDING_TOP + chartHeight}
                  stroke={accentColor}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.45}
                />
              ) : null}

              {liveHead ? (
                <>
                  <AnimatedCircle
                    cx={liveHead.x}
                    cy={liveHead.y}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth={2}
                    r={pulseScale.interpolate({
                      inputRange: [1, 1.55],
                      outputRange: [7, 15],
                    })}
                    opacity={pulseScale.interpolate({
                      inputRange: [1, 1.55],
                      outputRange: [0.75, 0],
                    })}
                  />
                  <AnimatedCircle
                    cx={liveHead.x}
                    cy={liveHead.y}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.95)"
                    strokeWidth={1.8}
                    r={pulseScale.interpolate({
                      inputRange: [1, 1.55],
                      outputRange: [5.5, 10],
                    })}
                    opacity={pulseScale.interpolate({
                      inputRange: [1, 1.55],
                      outputRange: [0.9, 0.12],
                    })}
                  />
                  <AnimatedCircle
                    cx={liveHead.x}
                    cy={liveHead.y}
                    r={selectedPointKey === getPointKey(liveHead) ? 6 : 5}
                    fill={accentColor}
                    stroke="rgba(255, 255, 255, 0.95)"
                    strokeWidth={pulseScale.interpolate({
                      inputRange: [1, 1.55],
                      outputRange: [2, 3.8],
                    })}
                  />
                </>
              ) : null}
            </Svg>
          </View>
        </View>
      </Animated.View>

      {pointHitTargets.map((point) => {
        const key = getPointKey(point)
        return (
          <Pressable
            key={`hit-${key}`}
            onPress={() => selectPoint(point)}
            disabled={interactionPaused || isAnimating}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalhes de ${formatPointWhenLabel(point, period, forceDailyAxis)}`}
            style={[
              styles.pointHitTarget,
              {
                left: PADDING_LEFT + point.x - contentScrollX - HIT_RADIUS_PX,
                top: point.y - HIT_RADIUS_PX,
                width: HIT_RADIUS_PX * 2,
                height: HIT_RADIUS_PX * 2,
              },
            ]}
          />
        )
      })}

      {canPan ? (
        <GestureDetector gesture={panGesture}>
          <View
            style={[
              styles.plotGestureLayer,
              {
                left: PADDING_LEFT,
                top: PADDING_TOP,
                width: plotWidth,
                height: chartHeight,
              },
            ]}
            pointerEvents={interactionPaused ? 'none' : 'box-none'}
            accessibilityRole="adjustable"
            accessibilityLabel={
              hourly
                ? 'Arraste para ver horas anteriores ou posteriores. Toque nos pontos para detalhes.'
                : 'Arraste para ver dias anteriores ou posteriores. Toque nos pontos para detalhes.'
            }
          />
        </GestureDetector>
      ) : null}

      {canPan ? (
        <View style={styles.scrubMetaRow} pointerEvents="none">
          <Text style={styles.scrubHint}>{hourly ? 'Arraste ↔ horas' : 'Arraste ↔ dias'}</Text>
          <Text style={styles.scrubRange}>{viewportHint}</Text>
        </View>
      ) : null}

      {selectedPoint && tooltipAnchor ? (
        <View
          pointerEvents="none"
          onLayout={(event) => {
            const nextWidth = Math.ceil(event.nativeEvent.layout.width)
            if (nextWidth !== tooltipMeasuredWidth) {
              setTooltipMeasuredWidth(nextWidth)
            }
          }}
          style={[
            styles.tooltip,
            {
              left: tooltipLeft,
              top: tooltipAnchor.top,
              maxWidth: width - 12,
              borderColor: `${accentColor}66`,
            },
          ]}
        >
          <Text style={styles.tooltipWhen}>
            {formatPointWhenLabel(selectedPoint, period, forceDailyAxis)}
          </Text>
          <Text style={styles.tooltipValue}>
            {metricLabel}{' '}
            <Text style={[styles.tooltipValueAccent, { color: accentColor }]}>
              {formatPointValueLabel(selectedPoint.value, unit, selectedPoint.diastolic)}
            </Text>
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  chartRoot: {
    borderRadius: 12,
    overflow: 'visible',
  },
  plotGestureLayer: {
    position: 'absolute',
    zIndex: 4,
  },
  pointHitTarget: {
    position: 'absolute',
    zIndex: 8,
  },
  scrubMetaRow: {
    position: 'absolute',
    left: PADDING_LEFT,
    right: PADDING_RIGHT,
    top: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    zIndex: 1,
  },
  scrubHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  scrubRange: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  tooltip: {
    position: 'absolute',
    zIndex: 20,
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(18, 18, 24, 0.82)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  tooltipWhen: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  tooltipValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    flexShrink: 0,
  },
  tooltipValueAccent: {
    fontWeight: '800',
  },
  revealMask: {
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  plotClip: {
    overflow: 'hidden',
    position: 'absolute',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  skeletonYAxis: {
    position: 'absolute',
    left: 4,
    top: PADDING_TOP,
    height: DEFAULT_PLOT_HEIGHT,
    justifyContent: 'space-between',
  },
  skeletonPlot: {
    position: 'absolute',
    overflow: 'hidden',
  },
  skeletonXAxis: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
