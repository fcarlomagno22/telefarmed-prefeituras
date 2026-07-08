(function () {
  'use strict'

  var CHROME = '#f5f5f7'
  var root = document.documentElement

  root.style.colorScheme = 'light'
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
  upsertMeta('color-scheme', 'light')

  if (document.body) {
    document.body.style.backgroundColor = CHROME
  }

  function syncViewportHeight() {
    var height = Math.round(window.innerHeight || 0)
    if (height > 0) {
      root.style.setProperty('--app-vh', height + 'px')
    }
  }

  syncViewportHeight()
  window.addEventListener('resize', syncViewportHeight)
})()
