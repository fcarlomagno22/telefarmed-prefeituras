import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const webDir = join(root, 'web')

if (!existsSync(distDir)) {
  console.error('postExportWeb: dist/ não encontrado — rode expo export primeiro.')
  process.exit(1)
}

for (const file of ['sw.js', 'manifest.webmanifest', 'icon-512.png', 'pwa-chrome-boot.js']) {
  copyFileSync(join(webDir, file), join(distDir, file))
}

const bootScript = readFileSync(join(webDir, 'pwa-chrome-boot.js'), 'utf8')
const indexPath = join(distDir, 'index.html')
let html = readFileSync(indexPath, 'utf8')

html = html.replace('<html lang="en">', '<html lang="pt-BR">')

if (!html.includes('pwa-chrome-boot.js')) {
  const inlineBoot = `<script>${bootScript}</script>`
  html = html.replace('<head>', `<head>\n    ${inlineBoot}`)
}

if (!html.includes('manifest.webmanifest')) {
  html = html.replace(
    '</head>',
    `    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="color-scheme" content="dark" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  </head>`,
  )
}

html = html.replace(
  /<meta name="theme-color"[^>]*media="[^"]*"[^>]*>\s*/g,
  '',
)

if (!html.includes('name="theme-color"')) {
  html = html.replace(
    '<meta charset="utf-8" />',
    '<meta charset="utf-8" />\n    <meta name="theme-color" content="#0a0a0c" />',
  )
}

if (!html.includes('background-color: #0a0a0c')) {
  html = html.replace(
    'html,\n      body {\n        height: 100%;\n      }',
    `html,
      body {
        height: 100%;
        min-height: 100dvh;
        background-color: #0a0a0c;
        color-scheme: dark only;
      }`,
  )
  html = html.replace(
    '#root {\n        display: flex;\n        height: 100%;\n        flex: 1;\n      }',
    `#root {
        display: flex;
        height: 100%;
        min-height: 100dvh;
        flex: 1;
        background-color: #0a0a0c;
      }`,
  )
} else {
  html = html.replace(/color-scheme:\s*dark;/g, 'color-scheme: dark only;')
}

if (!html.includes('#root input,')) {
  html = html.replace(
    '</style>',
    `      #root input,
      #root textarea {
        outline: none !important;
        outline-width: 0 !important;
        box-shadow: none !important;
        border: none !important;
        background-color: transparent !important;
        -webkit-appearance: none;
        appearance: none;
      }
      #root input:focus,
      #root input:focus-visible,
      #root textarea:focus,
      #root textarea:focus-visible {
        outline: none !important;
        box-shadow: none !important;
        border: none !important;
      }
    </style>`,
  )
}

writeFileSync(indexPath, html)
console.log('postExportWeb: PWA assets copiados e index.html atualizado.')
