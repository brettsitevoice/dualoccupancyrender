"""
Pure-Python (no bpy) parametric data for the dual-occupancy build.

This is the single source of truth for all dimensions/levels/timing so that
both the Blender build scripts and the plain-Python ffmpeg burn-in generator
agree on stage numbers, titles, RLs and frame ranges without needing Blender.
"""

import math

MM = 1.0 / 1000.0

# ---------------------------------------------------------------------------
# Site / lot (build-spec.md)
# ---------------------------------------------------------------------------

LOT_WIDTH = 15.240
LOT_DEPTH = 36.576
RL_FRONT = 18.00
RL_REAR = 26.50

# ---------------------------------------------------------------------------
# Building envelope (DA plan set: A-200/201/202/250)
# ---------------------------------------------------------------------------

FRONT_SETBACK = 6.000
BUILDING_WIDTH = 13.330
BUILDING_DEPTH = 18.870

GARAGE_WIDTH = 6.400
GARAGE_DEPTH = 8.400

WALL_THK = 0.200
SLAB_THK = 0.200
CLAD_THK = 0.030
LINING_THK = 0.015
FOOTING_DEPTH = 0.600
ROOF_OVERHANG = 0.450

RL_GARAGE_FFL = 18.730
RL_GROUND_FFL = 22.230
RL_FIRST_FFL = 25.600
RL_RIDGE = 29.520
ROOF_PITCH_DEG = 11.5

# ---------------------------------------------------------------------------
# Derived geometry
# ---------------------------------------------------------------------------

bx0 = (LOT_WIDTH - BUILDING_WIDTH) / 2.0
bx1 = bx0 + BUILDING_WIDTH
by0 = FRONT_SETBACK
by1 = by0 + BUILDING_DEPTH

gx0 = bx0 + (BUILDING_WIDTH - GARAGE_WIDTH) / 2.0
gx1 = gx0 + GARAGE_WIDTH
gy0 = by0
gy1 = gy0 + GARAGE_DEPTH

ROOF_DROP = BUILDING_DEPTH * math.tan(math.radians(ROOF_PITCH_DEG))
RL_EAVE_LOW = RL_RIDGE - ROOF_DROP
RL_FOOTING_LOW = RL_GARAGE_FFL - FOOTING_DEPTH

# ---------------------------------------------------------------------------
# Animation timing (build-spec.md sequence)
# ---------------------------------------------------------------------------

FPS = 24
SECONDS_PER_STAGE = 6
FRAMES_PER_STAGE = SECONDS_PER_STAGE * FPS   # 144
APPEAR_FRAMES = 12
DROP_HEIGHT = 1.5
N_STAGES = 16
TOTAL_FRAMES = FRAMES_PER_STAGE * N_STAGES   # 2304

# Camera orbit: north-west -> north (midpoint) -> north-east
AZ_START = 315.0
AZ_END = 405.0
DIST_RATIO = 3.2
ELEV_DEG = 9.0


def stage_start_frame(index):
    """1-indexed Blender frame on which stage `index` begins appearing."""
    return (index - 1) * FRAMES_PER_STAGE + 1


def stage_for_frame(frame):
    idx = (frame - 1) // FRAMES_PER_STAGE + 1
    return max(1, min(N_STAGES, idx))


# ---------------------------------------------------------------------------
# Stage sequence (build-spec.md) — collection key, title, burn-in RL text
# ---------------------------------------------------------------------------

STAGE_INFO = [
    dict(index=1, key="stage_01_site_strip", title="Site strip / earthworks",
         rl_text=f"Existing grade RL {RL_FRONT:.2f}-{RL_REAR:.2f}"),
    dict(index=2, key="stage_02_terrain", title="Site terrain / cut-fill to finished levels",
         rl_text=f"RL {RL_FRONT:.2f} (front) - RL {RL_REAR:.2f} (rear)"),
    dict(index=3, key="stage_03_footings", title="Footings / foundations",
         rl_text=f"U/S footing RL {RL_FOOTING_LOW:.3f}"),
    dict(index=4, key="stage_04_garage_slab", title="Garage box slab",
         rl_text=f"FFL RL {RL_GARAGE_FFL:.3f}"),
    dict(index=5, key="stage_05_garage_walls", title="Garage box walls",
         rl_text=f"RL {RL_GARAGE_FFL:.3f} - {RL_GROUND_FFL:.3f}"),
    dict(index=6, key="stage_06_suspended_slab", title="Suspended slab formwork / pour",
         rl_text=f"RL {RL_GROUND_FFL:.3f}"),
    dict(index=7, key="stage_07_ground_walls", title="Ground floor walls",
         rl_text=f"RL {RL_GROUND_FFL:.3f} - {RL_FIRST_FFL:.3f}"),
    dict(index=8, key="stage_08_first_floor_framing", title="First floor framing",
         rl_text=f"RL {RL_FIRST_FFL:.3f}"),
    dict(index=9, key="stage_09_first_floor_walls", title="First floor walls",
         rl_text=f"RL {RL_FIRST_FFL:.3f} - {RL_EAVE_LOW:.3f}"),
    dict(index=10, key="stage_10_roof_framing", title="Roof framing (skillion, 11.5 deg)",
         rl_text=f"Ridge RL {RL_RIDGE:.3f}"),
    dict(index=11, key="stage_11_roof_cladding", title="Roof cladding",
         rl_text=f"Ridge RL {RL_RIDGE:.3f}"),
    dict(index=12, key="stage_12_external_cladding", title="External wall cladding",
         rl_text=f"RL {RL_GARAGE_FFL:.3f} - {RL_RIDGE:.3f}"),
    dict(index=13, key="stage_13_windows_doors", title="Windows / doors",
         rl_text="-"),
    dict(index=14, key="stage_14_internal_linings", title="Internal linings",
         rl_text="-"),
    dict(index=15, key="stage_15_services", title="Services rough-in (placeholder)",
         rl_text="-"),
    dict(index=16, key="stage_16_finishes", title="Finishes / completed shell",
         rl_text=f"Ridge RL {RL_RIDGE:.3f}"),
]
STAGE_BY_INDEX = {s["index"]: s for s in STAGE_INFO}

STAGE_COLORS = {
    1: (0.45, 0.35, 0.20),
    2: (0.55, 0.45, 0.28),
    3: (0.60, 0.60, 0.60),
    4: (0.75, 0.75, 0.75),
    5: (0.80, 0.78, 0.72),
    6: (0.70, 0.70, 0.75),
    7: (0.85, 0.82, 0.75),
    8: (0.65, 0.65, 0.70),
    9: (0.88, 0.85, 0.78),
    10: (0.50, 0.35, 0.20),
    11: (0.30, 0.30, 0.33),
    12: (0.92, 0.90, 0.85),
    13: (0.20, 0.45, 0.65),
    14: (0.95, 0.93, 0.88),
    15: (0.85, 0.55, 0.20),
    16: (0.93, 0.91, 0.87),
}


def burn_in_text(index):
    info = STAGE_BY_INDEX[index]
    return f"Stage {index:02d}/{N_STAGES}  {info['title']}   |   {info['rl_text']}"
