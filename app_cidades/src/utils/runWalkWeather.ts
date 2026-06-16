export type WeatherSnapshot = {
  temperatureC: number
  apparentTemperatureC: number
  description: string
  weatherCode: number
}

function weatherCodeToLabel(code: number): string {
  if (code === 0) return 'Céu limpo'
  if (code <= 3) return 'Parcialmente nublado'
  if (code <= 48) return 'Neblina'
  if (code <= 57) return 'Garoa'
  if (code <= 67) return 'Chuva'
  if (code <= 77) return 'Neve'
  if (code <= 82) return 'Pancadas de chuva'
  if (code <= 86) return 'Pancadas de neve'
  if (code <= 99) return 'Tempestade'
  return 'Condição variável'
}

export async function fetchWeatherAtCoordinates(
  latitude: number,
  longitude: number,
): Promise<WeatherSnapshot> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}` +
    '&current=temperature_2m,apparent_temperature,weather_code' +
    '&timezone=auto'

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Não foi possível obter o clima.')
  }

  const data = (await response.json()) as {
    current: {
      temperature_2m: number
      apparent_temperature: number
      weather_code: number
    }
  }

  const weatherCode = data.current.weather_code

  return {
    temperatureC: Math.round(data.current.temperature_2m),
    apparentTemperatureC: Math.round(data.current.apparent_temperature),
    weatherCode,
    description: weatherCodeToLabel(weatherCode),
  }
}

export function formatTemperature(value: number): string {
  return `${value}°C`
}

export function formatWeatherLine(snapshot: WeatherSnapshot): string {
  return `${formatTemperature(snapshot.temperatureC)} e ${snapshot.description.toLowerCase()}`
}
