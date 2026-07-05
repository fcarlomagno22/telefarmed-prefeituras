(function () {
  'use strict'

  var CHROME = '#0a0a0c'
  var root = document.documentElement
  var ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  var isAndroid = /Android/i.test(ua)

  root.style.colorScheme = 'dark only'
  root.style.backgroundColor = CHROME

  function upsertMeta(name, content) {
    var meta = document.querySelector('meta[name="' + name + '"]:not([media])')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = name
      document.head.appendChild(meta)
    }
    meta.content = content
  }

  document.querySelectorAll('meta[name="theme-color"][media]').forEach(function (node) {
    node.remove()
  })

  document.querySelectorAll('meta[name="color-scheme"][media]').forEach(function (node) {
    node.remove()
  })

  upsertMeta('theme-color', CHROME)
  upsertMeta('color-scheme', 'dark')

  if (document.body) {
    document.body.style.backgroundColor = CHROME
  }

  function isAlreadyFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement)
  }

  function requestImmersiveFullscreen() {
    if (isAlreadyFullscreen()) return Promise.resolve()

    var el = document.documentElement
    var req =
      el.requestFullscreen && el.requestFullscreen.bind(el)
        ? el.requestFullscreen.bind(el)
        : el.webkitRequestFullscreen && el.webkitRequestFullscreen.bind(el)
          ? el.webkitRequestFullscreen.bind(el)
          : null

    if (!req) return Promise.reject(new Error('fullscreen unavailable'))

    try {
      return req({ navigationUI: 'hide' })
    } catch (_err) {
      return req()
    }
  }

  function bindImmersiveOnGesture() {
    if (!isAndroid) return

    var enter = function () {
      void requestImmersiveFullscreen().catch(function () {})
    }

    document.addEventListener('pointerdown', enter, { capture: true, once: true })
    document.addEventListener('fullscreenchange', function onChange() {
      if (!isAlreadyFullscreen()) {
        document.addEventListener('pointerdown', enter, { capture: true, once: true })
      }
    })
    document.addEventListener('webkitfullscreenchange', function onWebkitChange() {
      if (!isAlreadyFullscreen()) {
        document.addEventListener('pointerdown', enter, { capture: true, once: true })
      }
    })
  }

  bindImmersiveOnGesture()
})()
