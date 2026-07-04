export const EncodingType = {
  UTF8: 'utf8',
  Base64: 'base64',
} as const

export type EncodingTypeValue = (typeof EncodingType)[keyof typeof EncodingType]

export type ReadAsStringOptions = {
  encoding?: EncodingTypeValue
}

export type FileInfo = {
  exists: boolean
  uri?: string
  size?: number
  isDirectory?: boolean
}

export type MakeDirectoryOptions = {
  intermediates?: boolean
}

export type DeleteOptions = {
  idempotent?: boolean
}

export type CopyOptions = {
  from: string
  to: string
}
