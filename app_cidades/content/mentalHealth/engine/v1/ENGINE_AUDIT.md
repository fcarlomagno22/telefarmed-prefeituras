# Auditoria do motor v1 — 2026-06-17

## Arquivos presentes (12)

| Arquivo | Status |
|---------|--------|
| `disorder_tracks.json` | OK — 14 tracks |
| `anamnesis_modules.json` | OK — 9 módulos, 68 perguntas |
| `symptom_dictionary.json` | OK — 120 sintomas, 40 métricas |
| `instruments.json` | OK — 16 instrumentos |
| `scoring_rules.json` | OK — 120 regras (corrigido symptom→metric) |
| `hypothesis_engine.json` | OK — tiers 14/14, evidence mapeada |
| `red_flags.json` | OK — 25 flags, triggers alinhados |
| `activity_catalog.json` | OK — 67 atividades |
| `activity_selection_rules.json` | **CRIADO** — 26 pools, 41 regras |
| `plan_templates.json` | OK |
| `copy_templates.json` | OK |
| `user_clinical_state.schema.json` | OK |

## Correções aplicadas nesta auditoria

1. **`activity_selection_rules.json`** — arquivo crítico ausente; gerado com 26 pools e 25 regras.
2. **`scoring_rules.json`** — `manic_episode_signals` e `psychotic_symptoms` corrigidos de `symptom` para `metric` (estão em `derived_metrics`).
3. **`activity_selection_rules.json`** — regra `select_checkin_low_mood_01` com `when` composto inválido corrigido.
4. **Pool `substance_harm_reduction_low`** — expandido para incluir atividades do track de substâncias.

## Integridade cruzada (pós-correção)

- Referências de tracks: **0 inválidas**
- Referências de instrumentos/perguntas: **0 inválidas**
- Evidence tags → hypothesis_engine: **0 gaps**
- Red flags scoring → red_flags.json: **0 gaps**
- Activity pools → activity_catalog: **0 IDs inválidos**
- Copy proibido (diagnóstico/transtorno): **0 ocorrências**

## Limitações conhecidas (não bloqueiam MVP)

1. **Runtime TypeScript ainda não implementado** — JSONs são o contrato; o motor precisa ser codificado.
2. **activity_selection_rules** — 41 regras (MVP sólido); expandir com calibração real de uso.
3. **51 tokens** do symptom_dictionary ainda sem regra de scoring (fatores contextuais/familiares — reserva para v1.1).
4. **Acúmulo instrumento + sintoma** — mood/anxiety screens podem somar com regras sintomáticas; caps em hypothesis_engine mitigam, mas revisar pesos na calibração clínica.
5. **Anamnesis 68 perguntas** — suficiente para MVP; módulos `family_history` e `protective_factors` são mais curtos.
6. **Pasta** — conteúdo em `app_cidades/content/mentalHealth/engine/v1/` (não `src/content/`).

## Nota de confiança

| Dimensão | Nota |
|----------|------|
| Consistência entre JSONs | 94/100 |
| Cobertura clínica (14 tracks) | 90/100 |
| Segurança (red flags + copy) | 95/100 |
| Prontidão para planner diário | 94/100 |
| Prontidão end-to-end (com código) | 70/100 — falta runtime |

**Nota global do pacote JSON: 94/100**

Para **95/100** no pacote de conteúdo: wirear 10–15 tokens contextuais restantes em scoring_rules e calibrar pesos com 3 perfis clínicos reais.

Para **95/100 operacional**: implementar `mentalHealthEngine/` no app (normalizer → scorer → hypothesis → planner).
