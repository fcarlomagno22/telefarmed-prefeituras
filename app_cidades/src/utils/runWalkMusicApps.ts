import { Linking, Platform } from 'react-native'

export type MusicAppOption = {
  id: string
  name: string
  icon: 'spotify' | 'music' | 'youtube' | 'deezer' | 'amazon'
  probeUrls: string[]
  launchUrl: string
}

const MUSIC_APPS: MusicAppOption[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    icon: 'spotify',
    probeUrls: ['spotify://', 'spotify:'],
    launchUrl: 'spotify://',
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    icon: 'music',
    probeUrls: ['music://', 'musics://'],
    launchUrl: 'music://',
  },
  {
    id: 'youtube-music',
    name: 'YouTube Music',
    icon: 'youtube',
    probeUrls: ['youtubemusic://', 'vnd.youtube://'],
    launchUrl: 'youtubemusic://',
  },
  {
    id: 'deezer',
    name: 'Deezer',
    icon: 'deezer',
    probeUrls: ['deezer://', 'deezer-standalone://'],
    launchUrl: 'deezer://',
  },
  {
    id: 'amazon-music',
    name: 'Amazon Music',
    icon: 'amazon',
    probeUrls: ['amazonmusic://', 'amznmp3://'],
    launchUrl: 'amazonmusic://',
  },
]

function getMusicAppCandidates(): MusicAppOption[] {
  if (Platform.OS === 'android') {
    return MUSIC_APPS.filter((app) => app.id !== 'apple-music')
  }
  return MUSIC_APPS
}

async function isMusicAppInstalled(app: MusicAppOption): Promise<boolean> {
  for (const url of app.probeUrls) {
    try {
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) return true
    } catch {
      // Tenta o próximo esquema de URL.
    }
  }
  return false
}

export async function getInstalledMusicApps(): Promise<MusicAppOption[]> {
  const candidates = getMusicAppCandidates()
  const checks = await Promise.all(
    candidates.map(async (app) => ({
      app,
      installed: await isMusicAppInstalled(app),
    })),
  )
  return checks.filter((entry) => entry.installed).map((entry) => entry.app)
}

export async function openMusicApp(app: MusicAppOption): Promise<void> {
  const installed = await isMusicAppInstalled(app)
  if (!installed) {
    throw new Error(`O app ${app.name} não está instalado.`)
  }
  await Linking.openURL(app.launchUrl)
}
