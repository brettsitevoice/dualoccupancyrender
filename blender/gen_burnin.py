"""
ffmpeg drawtext burn-in generator (bottom-left): stage number, title, RL.

Pure Python, no bpy — shares blender/stage_data.py with the Blender build
scripts so the text always matches the geometry/timing exactly.

CLI:
    python3 blender/gen_burnin.py burn-preview <src.png> <dst.png> <frame_number>
        Burn the correct stage's text onto a single still (used for the
        1/300/900/2300 preview frames).

    python3 blender/gen_burnin.py filter
        Print the ffmpeg -vf drawtext filter chain (one gated filter per
        stage, `enable='between(n,...)'`) for muxing the full PNG sequence.
"""

import subprocess
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import stage_data as sd  # noqa: E402

FONT_FILE = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
FONT_SIZE = 28
MARGIN = 36


def escape_drawtext(text):
    text = text.replace("\\", "\\\\\\\\")
    text = text.replace(":", "\\:")
    text = text.replace("'", "\\'")
    text = text.replace("%", "\\%")
    return text


def drawtext_filter(text, enable_expr=None):
    escaped = escape_drawtext(text)
    parts = [
        f"fontfile={FONT_FILE}",
        f"text='{escaped}'",
        f"fontsize={FONT_SIZE}",
        "fontcolor=white",
        "box=1",
        "boxcolor=black@0.55",
        "boxborderw=12",
        f"x={MARGIN}",
        f"y=h-th-{MARGIN}",
    ]
    if enable_expr:
        parts.append(f"enable='{enable_expr}'")
    return "drawtext=" + ":".join(parts)


def full_sequence_filter():
    """One drawtext per stage, each active only over its own 0-indexed frame range."""
    filters = []
    for info in sd.STAGE_INFO:
        idx = info["index"]
        start0 = sd.stage_start_frame(idx) - 1  # ffmpeg's `n` is 0-indexed
        end0 = start0 + sd.FRAMES_PER_STAGE - 1
        text = sd.burn_in_text(idx)
        filters.append(drawtext_filter(text, enable_expr=f"between(n,{start0},{end0})"))
    return ",".join(filters)


def burn_preview(src, dst, frame_number):
    idx = sd.stage_for_frame(frame_number)
    text = sd.burn_in_text(idx)
    vf = drawtext_filter(text)
    cmd = ["ffmpeg", "-y", "-i", src, "-vf", vf, "-frames:v", "1", "-update", "1", dst]
    subprocess.run(cmd, check=True)
    print("Burned:", dst)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "burn-preview":
        _, _, src, dst, frame_number = sys.argv
        burn_preview(src, dst, int(frame_number))
    elif cmd == "filter":
        print(full_sequence_filter())
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
