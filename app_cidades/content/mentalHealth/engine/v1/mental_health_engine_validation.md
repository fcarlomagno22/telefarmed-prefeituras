# Validação cruzada

- Sintomas principais: **120**
- Métricas derivadas: **40**
- Regras: **120**
- Regras com instrumento: **20**
- Regras de check-in: **6**
- Regras protetivas redutoras: **6**
- Red flags com prioridade ≥900: **8**
- Tracks cobertos: **14/14**

## Integridade de referências

- Tokens da anamnese/instrumentos sem entrada no dictionary: **0**
- Regras com sintomas ou métricas inexistentes: **0**
- Regras com tracks inexistentes: **0**
- Regras com instrumentos inexistentes: **0**
- Tracks sem regra de pontuação: **0**
- Regras exatamente duplicadas: **0**

## Gaps detectados

Tokens previstos para evolução futura, ainda sem pergunta direta ou fonte estruturada suficiente:
- `caffeine_excess`
- `compulsive_rituals`
- `financial_stress`
- `recent_loss`
- `violence_risk`

Mapeamentos canônicos preservados para evitar sinônimos duplicados:
- `body_image_distortion` → `body_image_disturbance`
- `craving_substance` → `craving`
- `decreased_sleep_need` → `decreased_need_for_sleep`
- `severe_disorganization` → `disorganized_thinking`
- `family_history_bipolar` → `family_history_bipolar_signals`
- `family_history_psychosis` → `family_history_psychotic_signals`
- `perceptual_abnormalities` → `hallucinations`
- `chronic_medical_condition` → `medical_condition_present`
- `prescription_misuse` → `medication_misuse`
- `abuse_current` → `ongoing_abuse_or_violence`
- `drug_use_risk` → `other_substance_use`
- `unexplained_somatic_pain, physical_pain_chronic` → `persistent_physical_symptoms`
- `psychotic_symptoms_acute` → `psychotic_symptoms`
- `recent_self_harm` → `self_harm_recent`
- `alcohol_use_risk` → `substance_use_frequency`
- `trauma_intrusions` → `trauma_reexperiencing`

## Tokens do dictionary ainda não usados diretamente em scoring_rules

Total: **51**

- `caffeine_excess`
- `check_in_low_energy_today`
- `check_in_negative_influence_day`
- `coping_meaning`
- `coping_movement`
- `current_medication_use`
- `emotional_symptoms_preceded_physical_change`
- `family_history_anxiety`
- `family_history_bipolar_signals`
- `family_history_depression`
- `family_history_eating_problems`
- `family_history_mental_health`
- `family_history_psychotic_signals`
- `family_history_severe_impairment`
- `family_history_substance_use`
- `financial_stress`
- `free_text_note`
- `functional_impairment`
- `functional_impairment_leisure`
- `help_seeking_barrier`
- `help_seeking_readiness`
- `leisure_impairment`
- `limited_coping_resources`
- `medical_condition_present`
- `medication_misuse_uncertain`
- `medication_related_energy_change`
- `medication_related_mood_change`
- `medication_related_perceptual_change`
- `medication_related_sleep_change`
- `no_previous_helpful_strategy`
- `physical_symptoms_preceded_mood_change`
- `previous_meaning_helpful`
- `previous_mental_health_medication`
- `previous_movement_helpful`
- `previous_routine_helpful`
- `previous_support_helpful`
- `previous_therapy`
- `previous_therapy_neutral`
- `previous_therapy_partly_helpful`
- `previous_therapy_unhelpful`
- `recent_loss`
- `recent_medical_change`
- `recent_stressful_event`
- `response_consistency_index`
- `safety_status_unknown`
- `self_care_impairment`
- `suicidal_ideation`
- `symptom_duration_prolonged`
- `symptom_improving_7d`
- `symptom_intensity_level`
- `work_stress`

## Possíveis conflitos de acumulação

- mood_screen_v1 possui regra por banda e por score; ambas podem disparar no mesmo ciclo.
- anxiety_screen_v1 possui regra por banda e por score; ambas podem disparar no mesmo ciclo.
- Regras de instrumento e regras sintomáticas do mesmo domínio podem se acumular; recomenda-se teto por família de evidência.
- Red flags de psicose e ativação podem coexistir com pontuação dimensional; a flag deve prevalecer no roteamento.
- Regras protetivas nunca devem reduzir uma red flag nem baixar um track abaixo de zero.

## Top evidências por track

### `anxiety_disorders`
- **+18** `persistent_worry_with_impairment` — `rule_anxiety_persistent_worry_01`
- **+17** `anxiety_instrument_elevated` — `rule_anxiety_instrument_band_02`
- **+16** `panic_attacks_with_impairment` — `rule_panic_attack_impairment_01`
- **+15** `panic_instrument_elevated` — `rule_panic_instrument_band_02`
- **+14** `worry_irritability_insomnia_cluster` — `rule_anxiety_worry_sleep_irritability_04`
- **+13** `anxiety_instrument_score_threshold` — `rule_anxiety_instrument_score_03`
- **+13** `panic_sensations_with_avoidance` — `rule_panic_sensations_avoidance_03`
- **+12** `worry_driven_avoidance` — `rule_anxiety_avoidance_05`
- **+12** `sustained_checkin_anxiety` — `rule_checkin_anxiety_02`
- **+12** `recurrent_panic_pattern` — `rule_panic_recurrent_pattern_05`

### `bipolar_disorders`
- **+24** `activation_sleep_baseline_cluster` — `rule_bipolar_activation_cluster_01`
- **+21** `bipolar_instrument_elevated` — `rule_bipolar_instrument_band_02`
- **+18** `increased_energy_reduced_sleep_need` — `rule_bipolar_energy_sleep_03`
- **+17** `elevated_mood_racing_thoughts` — `rule_bipolar_elevated_racing_04`
- **+16** `grandiosity_with_impulsivity` — `rule_bipolar_grandiosity_impulsivity_05`
- **+14** `episodic_activation_pattern` — `rule_bipolar_episodic_change_06`
- **+9** `episodic_baseline_change_amplifies_bipolar` — `rule_temporal_baseline_bipolar_06`
- **+8** `bipolar_substance_cooccurrence` — `rule_comorbidity_bipolar_substance_03`

### `depressive_disorders`
- **+18** `persistent_low_mood_with_impairment` — `rule_depression_persistent_low_mood_01`
- **+17** `mood_instrument_elevated` — `rule_depression_instrument_band_03`
- **+16** `hopelessness_with_low_mood` — `rule_depression_hopelessness_05`
- **+14** `anhedonia_with_fatigue` — `rule_depression_anhedonia_fatigue_02`
- **+13** `mood_instrument_score_threshold` — `rule_depression_instrument_score_04`
- **+12** `sustained_checkin_low_mood` — `rule_checkin_low_mood_01`
- **+12** `appetite_change_low_mood_selfcare` — `rule_depression_appetite_selfcare_07`
- **+10** `low_mood_with_sleep_change` — `rule_depression_sleep_mood_06`
- **+9** `baseline_emotional_decline` — `rule_depression_baseline_change_08`
- **+8** `severe_functioning_amplifies_depression` — `rule_functioning_global_depression_01`

### `disruptive_impulse_control_disorders`
- **+17** `impulse_control_difficulty_with_impairment` — `rule_impulse_control_impairment_01`
- **+16** `impulse_instrument_elevated` — `rule_impulse_instrument_band_02`
- **+14** `impulsivity_with_hazardous_behavior` — `rule_impulse_hazardous_impulsivity_04`
- **+13** `irritability_impulsivity_cluster` — `rule_impulse_irritability_impulsivity_03`
- **+11** `impulse_difficulty_relationship_impact` — `rule_impulse_relationship_impact_05`

### `dissociative_disorders`
- **+17** `dissociation_with_impairment` — `rule_dissociation_core_01`
- **+17** `dissociation_instrument_elevated` — `rule_dissociation_instrument_band_04`
- **+15** `recurrent_depersonalization` — `rule_dissociation_depersonalization_02`
- **+15** `recurrent_derealization` — `rule_dissociation_derealization_03`
- **+14** `dissociation_linked_to_trauma` — `rule_dissociation_trauma_link_05`
- **+7** `trauma_dissociation_cooccurrence` — `rule_comorbidity_trauma_dissociation_05`

### `eating_disorders`
- **+20** `compensation_weight_shape_overvaluation` — `rule_eating_compensation_weight_03`
- **+19** `restriction_with_body_image_disturbance` — `rule_eating_restriction_body_image_01`
- **+18** `binge_eating_loss_of_control` — `rule_eating_binge_loss_control_02`
- **+17** `eating_instrument_elevated` — `rule_eating_instrument_band_04`
- **+12** `appetite_change_with_selfcare_impact` — `rule_eating_appetite_selfcare_05`
- **+6** `eating_ocd_cooccurrence` — `rule_comorbidity_eating_ocd_04`

### `neurodevelopmental_disorders`
- **+16** `attention_execution_impairment` — `rule_neurodev_attention_execution_01`
- **+15** `attention_instrument_elevated` — `rule_neurodev_instrument_band_02`
- **+13** `hyperactivity_impulsivity_cluster` — `rule_neurodev_hyperactivity_impulsivity_03`
- **+13** `persistent_social_communication_impact` — `rule_neurodev_social_communication_04`
- **+8** `neurodevelopmental_signals_family_history` — `rule_neurodev_family_history_05`
- **+7** `social_impairment_amplifies_neurodevelopmental` — `rule_functioning_social_neurodev_05`

### `obsessive_compulsive_disorder`
- **+20** `intrusions_with_compulsive_rituals` — `rule_ocd_intrusions_rituals_01`
- **+16** `ocd_instrument_elevated` — `rule_ocd_instrument_band_02`
- **+15** `persistent_intrusions_with_impairment` — `rule_ocd_intrusions_impairment_03`
- **+12** `obsessional_avoidance_pattern` — `rule_ocd_avoidance_rituals_04`
- **+11** `frequent_prolonged_intrusions` — `rule_ocd_duration_frequency_05`
- **+7** `ocd_duration_one_month` — `rule_temporal_ocd_duration_03`

### `personality_disorders`
- **+15** `persistent_interpersonal_impulsivity` — `rule_personality_interpersonal_impulsivity_01`
- **+14** `impulse_index_with_relationship_impact` — `rule_personality_impulse_instrument_03`
- **+12** `irritability_relationship_impairment` — `rule_personality_irritability_relationships_02`
- **+10** `persistent_social_avoidance_pattern` — `rule_personality_social_avoidance_04`
- **+9** `distress_help_ambivalence_interpersonal` — `rule_personality_distress_ambivalence_05`
- **+8** `recurrent_checkin_overload_interpersonal` — `rule_checkin_overload_personality_03`
- **+8** `relationship_impairment_amplifies_personality_track` — `rule_functioning_relationships_personality_03`

### `psychotic_disorders`
- **+25** `psychotic_signals_with_impairment` — `rule_psychosis_acute_cluster_01`
- **+23** `psychosis_instrument_elevated` — `rule_psychosis_instrument_band_02`
- **+22** `hallucinations_with_impaired_reality_testing` — `rule_psychosis_hallucination_reality_03`
- **+21** `fixed_beliefs_with_impairment` — `rule_psychosis_delusional_beliefs_04`
- **+20** `disorganized_thinking_functional_decline` — `rule_psychosis_disorganization_05`
- **+9** `checkin_social_withdrawal_psychosis_context` — `rule_checkin_withdrawal_psychosis_06`
- **+9** `selfcare_impairment_amplifies_psychosis` — `rule_functioning_selfcare_psychosis_04`

### `sleep_disorders`
- **+18** `sleep_instrument_elevated` — `rule_sleep_instrument_band_01`
- **+16** `insomnia_with_daytime_impact` — `rule_sleep_insomnia_daytime_02`
- **+15** `sleep_physiological_warning_signals` — `rule_sleep_physiological_signals_05`
- **+14** `hypersomnia_with_impairment` — `rule_sleep_hypersomnia_03`
- **+12** `persistent_circadian_misalignment` — `rule_sleep_circadian_04`
- **+11** `sustained_checkin_sleep_stress` — `rule_checkin_sleep_stress_05`
- **+7** `sleep_worsening_seven_days` — `rule_temporal_worsening_sleep_05`

### `somatic_symptom_disorders`
- **+17** `persistent_physical_symptoms_health_worry` — `rule_somatic_physical_health_worry_01`
- **+16** `somatic_instrument_elevated` — `rule_somatic_instrument_band_02`
- **+13** `pain_preoccupation_with_impairment` — `rule_somatic_pain_preoccupation_03`
- **+10** `physical_emotional_temporal_association` — `rule_somatic_temporal_link_04`
- **+7** `functioning_amplifies_somatic_track` — `rule_functioning_global_somatic_06`

### `substance_use_disorders`
- **+20** `substance_instrument_elevated` — `rule_substance_instrument_band_01`
- **+19** `withdrawal_symptoms_present` — `rule_substance_withdrawal_04`
- **+18** `substance_loss_control_with_role_impact` — `rule_substance_loss_control_02`
- **+17** `continued_use_despite_harm_present` — `rule_substance_continued_harm_05`
- **+15** `hazardous_or_nonprescribed_use` — `rule_substance_misuse_hazard_06`
- **+14** `craving_with_frequent_use` — `rule_substance_craving_03`
- **+7** `trauma_substance_cooccurrence` — `rule_comorbidity_trauma_substance_02`

### `trauma_related_disorders`
- **+20** `trauma_exposure_reexperiencing_impairment` — `rule_trauma_exposure_intrusions_01`
- **+18** `trauma_instrument_elevated` — `rule_trauma_instrument_band_02`
- **+14** `trauma_hyperarousal_cluster` — `rule_trauma_hyperarousal_03`
- **+13** `persistent_trauma_avoidance` — `rule_trauma_avoidance_04`
- **+13** `trauma_numbing_negative_beliefs` — `rule_trauma_numbing_beliefs_06`
- **+11** `trauma_nightmares_with_sleep_impact` — `rule_trauma_nightmares_sleep_05`
- **+10** `checkin_avoidance_after_trauma` — `rule_checkin_avoidance_trauma_04`
- **+8** `trauma_persistence_one_month` — `rule_temporal_trauma_duration_04`
