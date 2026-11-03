#!/usr/bin/env bash
set -euo pipefail

# Only run in isolated Vercel homologation project: never deploy to GitHub Pages/main.
if [[ "${VERCEL_PROJECT_ID:-}" == "prj_c37k4bVAXfOPRmAuHDJdYuHBCfnb" ]]; then
  echo "T88 isolated test project verified"
fi
echo "T88 verify original user artwork and prepare four preview backgrounds"
python3 --version
python3 -m venv /tmp/t88-kanto-images
/tmp/t88-kanto-images/bin/python -m pip install --disable-pip-version-check --quiet \
  Pillow==11.3.0 numpy==2.2.6 opencv-python-headless==4.11.0.86
/tmp/t88-kanto-images/bin/python tools/pokearena/produce-opening-user-webps.py
echo "T88 run focused navigation and sprite checks"
node --test tests/t86-opening-npc-overlays.test.mjs tests/t87-user-opening-navigation.test.mjs tests/t89-native-phaser-overworld.test.mjs
echo "T88 capture native client and build Phaser preview"
node tools/pokearena/capture-client.mjs
PREVIEW_ROOT=_site node tools/pokearena/build-preview.mjs
node tools/dev/homologation-preview-index.mjs
echo "T88 isolated Phaser opening packaged successfully"
