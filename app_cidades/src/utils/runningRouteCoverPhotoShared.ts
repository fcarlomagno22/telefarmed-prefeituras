import type { AppImageInput } from '../adapters/imageSource'

export const RUNNING_ROUTE_COVER_MAX_EDGE = 1280
export const RUNNING_ROUTE_COVER_COMPRESS = 0.82

export type { AppImageInput }

export type PersistRunningRouteCoverPhoto = (sourceInput: AppImageInput) => Promise<string>
