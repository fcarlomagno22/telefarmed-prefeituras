const LIVE_MAP_INJECT_MIN_INTERVAL_MS = 16

type FrameHandle = number

const scheduleFrame: (callback: FrameRequestCallback) => FrameHandle =
  typeof globalThis.requestAnimationFrame === 'function'
    ? globalThis.requestAnimationFrame.bind(globalThis)
    : (callback) => setTimeout(() => callback(Date.now()), 16) as unknown as FrameHandle

const cancelFrame: (handle: FrameHandle) => void =
  typeof globalThis.cancelAnimationFrame === 'function'
    ? globalThis.cancelAnimationFrame.bind(globalThis)
    : (handle) => {
        clearTimeout(handle)
      }

type WebViewInjectorTarget = {
  injectJavaScript: (script: string) => void
} | null

/**
 * Coalesces WebView injectJavaScript calls to at most one per animation frame,
 * keeping only the latest script when multiple updates arrive synchronously.
 */
export class RunWalkLiveMapWebViewInjector {
  private pendingScript: string | null = null
  private frameId: number | null = null
  private lastInjectAt = 0

  constructor(private getTarget: () => WebViewInjectorTarget) {}

  schedule(script: string, options?: { force?: boolean }) {
    this.pendingScript = script

    if (options?.force) {
      this.flush(true)
      return
    }

    if (this.frameId != null) return

    this.frameId = scheduleFrame(() => {
      this.frameId = null
      this.flush(false)
    })
  }

  reset() {
    if (this.frameId != null) {
      cancelFrame(this.frameId)
      this.frameId = null
    }
    this.pendingScript = null
    this.lastInjectAt = 0
  }

  private flush(force: boolean) {
    const script = this.pendingScript
    if (!script) return

    const target = this.getTarget()
    if (!target) return

    const now = Date.now()
    if (!force && now - this.lastInjectAt < LIVE_MAP_INJECT_MIN_INTERVAL_MS) {
      if (this.frameId == null) {
        this.frameId = scheduleFrame(() => {
          this.frameId = null
          this.flush(false)
        })
      }
      return
    }

    this.pendingScript = null
    this.lastInjectAt = now
    target.injectJavaScript(script)

    if (this.pendingScript) {
      if (this.frameId == null) {
        this.frameId = scheduleFrame(() => {
          this.frameId = null
          this.flush(false)
        })
      }
    }
  }
}
