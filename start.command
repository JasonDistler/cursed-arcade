#!/usr/bin/env bash
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node.js is not installed."
  echo "  Install it from https://nodejs.org/ and try again."
  echo
  read -r -p "Press enter to close..."
  exit 1
fi

node server.js
EXITCODE=$?
echo
echo "  Server stopped (exit code $EXITCODE)."
read -r -p "Press enter to close..."
exit $EXITCODE
