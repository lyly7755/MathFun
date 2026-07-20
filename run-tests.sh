#!/usr/bin/env bash
# Every suite. reverify is the slow one (exhaustive, ~3 min) - run it with: ./run-tests.sh --all
set -u
cd "$(dirname "$0")"
FAST=(e24 g24 nav menu order daily stars deadtimer feedback loosecheck conserve verify hint)
SLOW=(reverify)
fail=0
for t in "${FAST[@]}"; do
  printf '%-12s ' "$t"
  out=$(node "tests/$t.js" 2>&1 | grep -E 'OK$|FAILURES|LEVELS SOLVABLE|DEAD TIMERS' | tail -1)
  echo "${out:-NO OUTPUT}"
  echo "$out" | grep -q 'FAILURES\|NO OUTPUT' && fail=1
done
printf '%-12s ' integrity; python3 tools/data_integrity.py | tail -1
printf '%-12s ' layout;    python3 tools/layout.py    | tail -1
if [ "${1:-}" = "--all" ]; then
  for t in "${SLOW[@]}"; do printf '%-12s ' "$t"; node "tests/$t.js" 2>&1 | tail -1; done
fi
exit $fail
