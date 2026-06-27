import ageRules from '../../assets/tests/scared/scared_infantil_age_rules.json'
import consentTerms from '../../assets/tests/scared/scared_infantil_consent_terms.json'
import cutoffs from '../../assets/tests/scared/scared_infantil_cutoffs.json'
import differentialScreening from '../../assets/tests/scared/scared_infantil_differential_screening.json'
import followupRules from '../../assets/tests/scared/scared_infantil_followup_rules.json'
import functionalImpairment from '../../assets/tests/scared/scared_infantil_functional_impairment.json'
import informants from '../../assets/tests/scared/scared_infantil_informants.json'
import questions from '../../assets/tests/scared/scared_infantil_questions.json'
import redFlags from '../../assets/tests/scared/scared_infantil_red_flags.json'
import referralRules from '../../assets/tests/scared/scared_infantil_referral_rules.json'
import reportTemplate from '../../assets/tests/scared/scared_infantil_report_template.json'
import resultMessages from '../../assets/tests/scared/scared_infantil_result_messages.json'

export const scaredContent = {
  questions,
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

export type ScaredContent = typeof scaredContent
