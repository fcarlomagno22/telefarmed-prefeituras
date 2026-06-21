-- CBO padrão por formação profissional + backfill de profissionais existentes.

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
  cbo_codigo = CASE formacao
    WHEN 'medicina' THEN '225125'
    WHEN 'psicologia' THEN '251510'
    WHEN 'nutricao' THEN '223710'
    WHEN 'fonoaudiologia' THEN '223810'
  END,
  cbo_descricao = CASE formacao
    WHEN 'medicina' THEN 'Medico clinico'
    WHEN 'psicologia' THEN 'Psicologo clinico'
    WHEN 'nutricao' THEN 'Nutricionista'
    WHEN 'fonoaudiologia' THEN 'Fonoaudiologo'
  END
WHERE formacao IN ('medicina', 'psicologia', 'nutricao', 'fonoaudiologia')
  AND (cbo_codigo IS NULL OR btrim(cbo_codigo) = '');

UPDATE profissionais_mt
SET
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
WHERE cbo_codigo IS NULL OR btrim(cbo_codigo) = '';
