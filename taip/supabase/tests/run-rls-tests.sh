#!/usr/bin/env bash
# Käivitab RLS-testid lokaalse Postgresi vastu ajutises andmebaasis.
# Kasutus: npm run test:rls   (vaikimisi PGHOST/PGUSER keskkonnast; root-kasutajana kasutatakse `su postgres`)
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB="taip_rls_test_$$"
run() { if [ "$(id -u)" = "0" ]; then su postgres -c "$*"; else bash -c "$*"; fi; }
run "createdb $DB"
trap 'run "dropdb --if-exists $DB" >/dev/null 2>&1 || true' EXIT
PSQL="psql -X -q -t -v ON_ERROR_STOP=1 -d $DB"
# Failid antakse stdin-i kaudu, et postgres-kasutaja ei vajaks repo lugemisõigust.
run "$PSQL" < "$DIR/tests/00_supabase_shim.sql" >/dev/null
run "$PSQL" < "$DIR/migrations/0001_init.sql" >/dev/null
run "$PSQL" < "$DIR/seed/seed.sql" >/dev/null
run "$PSQL" < "$DIR/tests/rls.test.sql" 2>&1 | grep -E "NOTICE|ERROR|FAIL|KÕIK|DETAIL|CONTEXT" | sed 's/^psql:[^:]*:[0-9]*: //; s/^NOTICE:  //'
test "${PIPESTATUS[0]}" -eq 0
