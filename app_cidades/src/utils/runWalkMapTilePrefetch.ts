import { NEARBY_UNITS_TILE_URL } from '../components/nearbyUnits/nearbyUnitsMapShared'

const TILE_SUBDOMAINS = ['a', 'b', 'c', 'd']

function lngToTileX(lng: number, zoom: number) {
  return Math.floor(((lng + 180) / 360) * 2 ** zoom)
}

function latToTileY(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom,
  )
}

function buildTileUrl(zoom: number, x: number, y: number) {
  const subdomain = TILE_SUBDOMAINS[(x + y) % TILE_SUBDOMAINS.length]
  return NEARBY_UNITS_TILE_URL.replace('{s}', subdomain)
    .replace('{z}', String(zoom))
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{r}', '')
}

export function prefetchRunWalkMapTiles(latitude: number, longitude: number, zoom = 17) {
  const x = lngToTileX(longitude, zoom)
  const y = latToTileY(latitude, zoom)

  const urls: string[] = []
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      urls.push(buildTileUrl(zoom, x + dx, y + dy))
    }
  }

  urls.forEach((url) => {
    void fetch(url).catch(() => undefined)
  })
}
