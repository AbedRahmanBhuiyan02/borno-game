#!/bin/sh
# run-tests.sh – runs all automatic tests with Chrome/Chromium (Linux, macOS,
# and the GitHub "tests" check on every push).
#
#   sh tests/run-tests.sh
#
# Prints the result of every test page and any FAIL lines.
# Exit code 0 = everything passed, 1 = something failed.
# Another browser: CHROME=/path/to/chromium sh tests/run-tests.sh

ROOT=$(cd "$(dirname "$0")/.." && pwd)
CHROME=${CHROME:-$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser)}
if [ -z "$CHROME" ]; then echo "Chrome/Chromium not found"; exit 1; fi

WORK=$(mktemp -d)
ALL_OK=0

run_page() {
  name=$1; page=$2; expect=$3
  out="$WORK/$name.html"
  timeout 300 "$CHROME" --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --no-first-run \
    --mute-audio --user-data-dir="$WORK/profile-$name" --allow-file-access-from-files \
    --virtual-time-budget=200000 --window-size=1300,1700 \
    --dump-dom "file://$ROOT/tests/$page" > "$out" 2>/dev/null
  title=$(grep -o '<title>[^<]*' "$out" | head -n 1 | sed 's/<title>//')
  [ -z "$title" ] && title='(no result)'
  echo "$name : $title"
  sed 's/<[^>]*>/\n/g' "$out" | grep '^FAIL' | sed 's/&gt;/>/g; s/&lt;/</g; s/&amp;/\&/g; s/^/   /'
  case "$title" in
    "$expect"*) return 0 ;;
    *) return 1 ;;
  esac
}

run_page unit unit.html 'UNIT PASS' || ALL_OK=1
run_page e2e-phone e2e.html 'E2E PASS' || ALL_OK=1
run_page e2e-desktop 'e2e.html?size=desktop' 'E2E PASS' || ALL_OK=1

rm -rf "$WORK"
if [ $ALL_OK -eq 0 ]; then echo 'ALL TESTS PASSED'; else echo 'SOME TESTS FAILED'; fi
exit $ALL_OK
