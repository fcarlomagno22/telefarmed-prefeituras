export type ResolvedImageSource = {
  /** URI usable by Image, canvas and fetch (local path on native; blob/data/http on web). */
  uri: string
  width?: number
  height?: number
  /** Present when the web resolver materialized bytes from File/Blob. */
  blob?: Blob
  /** Revoke only when this resolver created a temporary object URL. */
  revoke?: () => void
}

export type AppImageInput = string | Blob | File
