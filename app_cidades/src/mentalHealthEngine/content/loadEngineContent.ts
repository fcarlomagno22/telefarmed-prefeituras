import activityCatalog from '../../../content/mentalHealth/engine/v1/activity_catalog.json'
import activitySelectionRules from '../../../content/mentalHealth/engine/v1/activity_selection_rules.json'
import anamnesisModules from '../../../content/mentalHealth/engine/v1/anamnesis_modules.json'
import copyTemplates from '../../../content/mentalHealth/engine/v1/copy_templates.json'
import disorderTracks from '../../../content/mentalHealth/engine/v1/disorder_tracks.json'
import hypothesisEngine from '../../../content/mentalHealth/engine/v1/hypothesis_engine.json'
import instruments from '../../../content/mentalHealth/engine/v1/instruments.json'
import planTemplates from '../../../content/mentalHealth/engine/v1/plan_templates.json'
import redFlags from '../../../content/mentalHealth/engine/v1/red_flags.json'
import scoringRules from '../../../content/mentalHealth/engine/v1/scoring_rules.json'
import symptomDictionary from '../../../content/mentalHealth/engine/v1/symptom_dictionary.json'

export const ENGINE_CONTENT_VERSION = '1.0.0'

export const engineContent = {
  disorderTracks,
  anamnesisModules,
  symptomDictionary,
  instruments,
  scoringRules,
  hypothesisEngine,
  redFlags,
  activityCatalog,
  activitySelectionRules,
  planTemplates,
  copyTemplates,
} as const

export type EngineContent = typeof engineContent
