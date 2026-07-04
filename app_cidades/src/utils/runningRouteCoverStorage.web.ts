/**
 * Web cover photo persistence without a local filesystem.
 * Resized JPEGs are stored as data: URIs for preview and submission in the same session.
 */

import { resizeImageToFit } from '../adapters/imageManipulation'
import { releaseImageSource, resolveImageSource, type AppImageInput } from '../adapters/imageSource'
import {
  RUNNING_ROUTE_COVER_COMPRESS,
  RUNNING_ROUTE_COVER_MAX_EDGE,
} from './runningRouteCoverPhotoShared'

function revokeBlobUri(uri: string) {
  if (uri.startsWith('blob:')) {
    URL.revokeObjectURL(uri)
  }
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Failed to encode cover photo'))
    }
    reader.onerror = () => reject(new Error('Failed to read cover photo blob'))
    reader.readAsDataURL(blob)
  })
}

async function uriToDataUri(uri: string): Promise<string> {
  const trimmed = uri.trim()
  if (!trimmed) {
    throw new Error('Cover photo URI is empty')
  }
  if (trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('file:')) {
    throw new Error('file:// URIs are not supported for cover photos on web.')
  }

  const response = await fetch(trimmed)
  if (!response.ok) {
    throw new Error('Cover photo not found')
  }

  return blobToDataUri(await response.blob())
}

export async function persistRunningRouteCoverPhoto(sourceInput: AppImageInput) {
  const source = await resolveImageSource(sourceInput)

  try {
    const resized = await resizeImageToFit(source, {
      maxLongEdge: RUNNING_ROUTE_COVER_MAX_EDGE,
      compress: RUNNING_ROUTE_COVER_COMPRESS,
    })

    try {
      return await uriToDataUri(resized.uri)
    } finally {
      revokeBlobUri(resized.uri)
      resized.revoke?.()
    }
  } finally {
    releaseImageSource(source)
  }
}
