import type { AppImageInput } from '../adapters/imageSource'

export const PROFILE_PHOTO_MAX_SOURCE_EDGE = 1024
export const PROFILE_PHOTO_OUTPUT_SIZE = 256

export type ProfilePhotoPrepared = {
  uri: string
  width: number
  height: number
}

export type ProfilePhotoPersisted = {
  uri: string
}

export type ProfilePhotoStorage = {
  persistProfilePhoto: (tempUri: string, previousUri?: string | null) => Promise<string>
  profilePhotoToDataUri: (uri: string) => Promise<string | null>
}

export type { AppImageInput }
