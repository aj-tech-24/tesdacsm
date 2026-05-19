#!/usr/bin/env bash
# Small helper to install Chromium on Debian/Ubuntu (run as root)
set -euo pipefail

if command -v apt-get >/dev/null 2>&1; then
  apt-get update
  apt-get install -y chromium-browser chromium
  echo "Chromium installed. Common executable paths: /usr/bin/chromium-browser or /usr/bin/chromium"
  echo "Set CHROME_EXECUTABLE_PATH to the chromium binary before starting the server, e.g.:"
  echo "export CHROME_EXECUTABLE_PATH=/usr/bin/chromium"
else
  echo "This script supports Debian/Ubuntu (apt-get). Install Chromium manually for your distro."
fi
