#!/bin/sh
# Joins src/*.js in name order into one file and minifies it into dist/ for HACS.
# The parts are plain script pieces (no imports), so joining them is the whole build.
set -e
cd "$(dirname "$0")"
mkdir -p dist build
cat src/*.js > build/meal-planner-card.js
node --check build/meal-planner-card.js
npx --yes terser@5 build/meal-planner-card.js -c -m --module -f ascii_only=true,max_line_len=1800 -o dist/meal-planner-card.js
echo "dist/meal-planner-card.js: $(wc -c < dist/meal-planner-card.js) bytes"
