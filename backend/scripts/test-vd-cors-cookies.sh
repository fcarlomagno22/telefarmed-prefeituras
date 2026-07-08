#!/usr/bin/env bash
set -euo pipefail

API_BASE="${VD_CORS_TEST_API:-http://localhost:3001/api/v1}"
ORIGIN="${VD_CORS_TEST_ORIGIN:-http://vd-minha-cidade.localhost:8081}"

echo "==> CORS preflight (OPTIONS) login VD"
curl -sS -D - -o /dev/null -X OPTIONS "${API_BASE}/vd/auth/login" \
  -H "Origin: ${ORIGIN}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  | grep -iE '^(HTTP/|access-control-)'

echo
echo "==> CORS preflight (OPTIONS) cadastro registrar"
curl -sS -D - -o /dev/null -X OPTIONS "${API_BASE}/vd/cadastro/registrar" \
  -H "Origin: ${ORIGIN}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  | grep -iE '^(HTTP/|access-control-)'

echo
echo "Nota: login/cadastro reais exigem credenciais válidas; este script valida apenas CORS + headers."
echo "Para cookie refresh cross-origin, confira Set-Cookie com Path=/api/v1/vd/auth e SameSite=None em dev."
