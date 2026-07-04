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

for (const file of ['sw.js', 'manifest.webmanifest', 'icon-512.png']) {
  copyFileSync(join(webDir, file), join(distDir, file))
}

const indexPath = join(distDir, 'index.html')
let html = readFileSync(indexPath, 'utf8')

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

html = html.replace('<html lang="en">', '<html lang="pt-BR">')

if (!html.includes('background-color: #0a0a0c')) {
  html = html.replace(
    'html,\n      body {\n        height: 100%;\n      }',
    `html,
      body {
        height: 100%;
        min-height: 100dvh;
        background-color: #0a0a0c;
        color-scheme: dark;
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
}

writeFileSync(indexPath, html)
console.log('postExportWeb: PWA assets copiados e index.html atualizado.')
