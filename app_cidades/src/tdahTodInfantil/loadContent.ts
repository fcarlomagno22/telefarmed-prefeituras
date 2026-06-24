import ageRules from '../../assets/tests/tdah-tod-infantil/tdah_tod_age_rules.json'
import consentTerms from '../../assets/tests/tdah-tod-infantil/tdah_tod_consent_terms.json'
import cutoffs from '../../assets/tests/tdah-tod-infantil/tdah_tod_cutoffs.json'
import differentialScreening from '../../assets/tests/tdah-tod-infantil/tdah_tod_differential_screening.json'
import followupRules from '../../assets/tests/tdah-tod-infantil/tdah_tod_followup_rules.json'
import functionalImpairment from '../../assets/tests/tdah-tod-infantil/tdah_tod_functional_impairment.json'
import informants from '../../assets/tests/tdah-tod-infantil/tdah_tod_informants.json'
import questions from '../../assets/tests/tdah-tod-infantil/tdah_tod_questions.json'
import redFlags from '../../assets/tests/tdah-tod-infantil/tdah_tod_red_flags.json'
import referralRules from '../../assets/tests/tdah-tod-infantil/tdah_tod_referral_rules.json'
import reportTemplate from '../../assets/tests/tdah-tod-infantil/tdah_tod_report_template.json'
import resultMessages from '../../assets/tests/tdah-tod-infantil/tdah_tod_result_messages.json'
import scoringRules from '../../assets/tests/tdah-tod-infantil/tdah_tod_scoring_rules.json'

export const tdahTodContent = {
  questions,
  scoringRules,
  cutoffs,
  ageRules,
  informants,
  functionalImpairment,
  redFlags,
  differentialScreening,
  resultMessages,
  referralRules,
  followupRules,
  consentTerms,
  reportTemplate,
} as const

export type TdahTodContent = typeof tdahTodContent
