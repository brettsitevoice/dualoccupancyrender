#!/usr/bin/env bash
# Full pipeline: render the 2304-frame EEVEE sequence, then mux + burn-in to
# build-sequence.mp4 with ffmpeg. Slow (EEVEE on CPU/software GL) — run this
# in the background.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[1/3] Rendering full PNG sequence with Blender EEVEE..."
blender --background --factory-startup --python blender/build_animation.py -- full

echo "[2/3] Generating burn-in filter..."
FILTER="$(python3 blender/gen_burnin.py filter)"

echo "[3/3] Muxing to build-sequence.mp4..."
ffmpeg -y -framerate 24 -i blender/frames/frame_%04d.png \
  -vf "$FILTER" \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium \
  build-sequence.mp4

echo "Done: build-sequence.mp4"
