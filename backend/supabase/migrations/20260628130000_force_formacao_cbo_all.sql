-- Força CBO canônico por formação em MP, MT e catálogo SIGTAP.

INSERT INTO config_sigtap_formacao_cbo (formacao, ocupacao_codigo)
VALUES
  ('medicina', '225125'),
  ('psicologia', '251510'),
  ('nutricao', '223710'),
  ('fonoaudiologia', '223810')
ON CONFLICT (formacao) DO UPDATE
SET ocupacao_codigo = EXCLUDED.ocupacao_codigo;

UPDATE usuarios_profissionais
SET
  formacao = COALESCE(formacao, 'medicina'),
  cbo_codigo = CASE COALESCE(formacao, 'medicina')
    WHEN 'medicina' THEN '225125'
    WHEN 'psicologia' THEN '251510'
    WHEN 'nutricao' THEN '223710'
    WHEN 'fonoaudiologia' THEN '223810'
    ELSE '225125'
  END,
  cbo_descricao = CASE COALESCE(formacao, 'medicina')
    WHEN 'medicina' THEN 'Medico clinico'
    WHEN 'psicologia' THEN 'Psicologo clinico'
    WHEN 'nutricao' THEN 'Nutricionista'
    WHEN 'fonoaudiologia' THEN 'Fonoaudiologo'
    ELSE 'Medico clinico'
  END
WHERE formacao IS NULL
   OR formacao IN ('medicina', 'psicologia', 'nutricao', 'fonoaudiologia');

UPDATE profissionais_mt
SET
  formacao = CASE
    WHEN formacao IN ('medicina', 'psicologia', 'nutricao', 'fonoaudiologia') THEN formacao
    WHEN lower(especialidade) LIKE '%psicolog%' THEN 'psicologia'
    WHEN lower(especialidade) LIKE '%nutric%' OR lower(especialidade) LIKE '%nutrolog%' THEN 'nutricao'
    WHEN lower(especialidade) LIKE '%fonoaud%' THEN 'fonoaudiologia'
    ELSE COALESCE(formacao, 'medicina')
  END,
  cbo_codigo = CASE
    WHEN formacao = 'psicologia' OR lower(especialidade) LIKE '%psicolog%' THEN '251510'
    WHEN formacao = 'nutricao' OR lower(especialidade) LIKE '%nutric%' OR lower(especialidade) LIKE '%nutrolog%' THEN '223710'
    WHEN formacao = 'fonoaudiologia' OR lower(especialidade) LIKE '%fonoaud%' THEN '223810'
    ELSE '225125'
  END,
  cbo_descricao = CASE
    WHEN formacao = 'psicologia' OR lower(especialidade) LIKE '%psicolog%' THEN 'Psicologo clinico'
    WHEN formacao = 'nutricao' OR lower(especialidade) LIKE '%nutric%' OR lower(especialidade) LIKE '%nutrolog%' THEN 'Nutricionista'
    WHEN formacao = 'fonoaudiologia' OR lower(especialidade) LIKE '%fonoaud%' THEN 'Fonoaudiologo'
    ELSE 'Medico clinico'
  END;
