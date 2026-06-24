import type { MacroNutrients } from '../types/eatWell'

export function scaleMacrosFrom100g(
  macrosPer100g: MacroNutrients,
  grams: number,
): MacroNutrients {
  const factor = grams / 100
  return {
    calories: Math.round(macrosPer100g.calories * factor),
    proteinG: Math.round(macrosPer100g.proteinG * factor * 10) / 10,
    carbsG: Math.round(macrosPer100g.carbsG * factor * 10) / 10,
    fatG: Math.round(macrosPer100g.fatG * factor * 10) / 10,
    fiberG: Math.round(macrosPer100g.fiberG * factor * 10) / 10,
    sugarsG: Math.round(macrosPer100g.sugarsG * factor * 10) / 10,
    saturatedFatG: Math.round(macrosPer100g.saturatedFatG * factor * 10) / 10,
  }
}

export function scaleMacros(macros: MacroNutrients, factor: number): MacroNutrients {
  return {
    calories: Math.round(macros.calories * factor),
    proteinG: Math.round(macros.proteinG * factor * 10) / 10,
    carbsG: Math.round(macros.carbsG * factor * 10) / 10,
    fatG: Math.round(macros.fatG * factor * 10) / 10,
    fiberG: Math.round(macros.fiberG * factor * 10) / 10,
    sugarsG: Math.round(macros.sugarsG * factor * 10) / 10,
    saturatedFatG: Math.round(macros.saturatedFatG * factor * 10) / 10,
  }
}
