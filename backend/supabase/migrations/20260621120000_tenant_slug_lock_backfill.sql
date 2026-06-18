-- Bloqueia slug de entidades/UBTs já publicadas antes do slug_locked_at em código.

UPDATE entidades_contratantes
SET slug_locked_at = COALESCE(atualizado_em, now())
WHERE status_cliente = 'ativa'
  AND slug_locked_at IS NULL;

UPDATE unidades_ubt
SET slug_locked_at = COALESCE(atualizado_em, now())
WHERE status = 'ativo'
  AND slug IS NOT NULL
  AND slug_locked_at IS NULL;
