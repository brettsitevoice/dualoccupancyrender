"""
Parametric Blender build script — Dual Occupancy, 37 Osborne St Gerringong.

Units: Blender scene unit = 1 metre.
  X, Y  -> plan dimensions, sourced from build-spec.md / DA plan set (converted mm -> m).
  Z     -> AHD (metres), used directly as absolute height.

Run headless:
    blender --background --factory-startup --python blender/build_dual_occupancy.py

Produces:
    blender/dual_occupancy.blend
    test-frame.png   (1920x1080 still, camera from the north-west, all 16 stages visible)
"""

import math
import os

import bmesh
import bpy
from mathutils import Vector

# ---------------------------------------------------------------------------
# Parametric constants (build-spec.md + DA plan set)
# ---------------------------------------------------------------------------

MM = 1.0 / 1000.0  # mm -> m helper

# Site / lot
LOT_WIDTH = 15.240          # X, m  (street frontage)
LOT_DEPTH = 36.576          # Y, m  (front boundary -> rear boundary)
RL_FRONT = 18.00            # street boundary
RL_REAR = 26.50             # rear boundary

# Building envelope, derived from DA plans (A-200/201/202), centred on lot,
# set back from the front (street/north) boundary.
FRONT_SETBACK = 6.000
BUILDING_WIDTH = 13.330      # X, m  (A-201 ground floor overall width)
BUILDING_DEPTH = 18.870      # Y, m  (A-201 ground floor overall depth)

GARAGE_WIDTH = 6.400 * 1     # X, m  (A-200: 200+6000+200)
GARAGE_DEPTH = 8.400         # Y, m  (A-200: 200+3900+200+3900+200)

WALL_THK = 0.200
SLAB_THK = 0.200
CLAD_THK = 0.030
LINING_THK = 0.015

# Shell levels (RL, metres AHD)
RL_GARAGE_FFL = 18.730
RL_GROUND_FFL = 22.230       # suspended slab
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
RL_EAVE_LOW = RL_RIDGE - ROOF_DROP  # low eave, at the front (street) edge, y = by0

print(f"Roof: ridge RL {RL_RIDGE:.3f} at y={by1:.3f}, low eave RL {RL_EAVE_LOW:.3f} at y={by0:.3f}")

# ---------------------------------------------------------------------------
# Scene reset
# ---------------------------------------------------------------------------

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.length_unit = 'METERS'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_or_make_collection(name):
    if name in bpy.data.collections:
        return bpy.data.collections[name]
    col = bpy.data.collections.new(name)
    scene.collection.children.link(col)
    return col


def new_mesh_obj(name, collection, verts, faces, material=None):
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    for v in verts:
        bm.verts.new(v)
    bm.verts.ensure_lookup_table()
    for f in faces:
        bm.faces.new([bm.verts[i] for i in f])
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    if material is not None:
        obj.data.materials.append(material)
    return obj


def get_material(name, color, alpha=1.0):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = (*color, 1.0)
            if "Alpha" in bsdf.inputs:
                bsdf.inputs["Alpha"].default_value = alpha
        mat.diffuse_color = (*color, alpha)
        if alpha < 1.0:
            mat.blend_method = 'BLEND'
    return mat


def make_box(name, collection, x0, x1, y0, y1, z0, z1, material=None):
    """Axis-aligned box, flat top & bottom."""
    verts = [
        (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
        (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
    ]
    faces = [
        (0, 1, 2, 3),  # bottom
        (4, 5, 6, 7),  # top
        (0, 1, 5, 4),
        (1, 2, 6, 5),
        (2, 3, 7, 6),
        (3, 0, 4, 7),
    ]
    return new_mesh_obj(name, collection, verts, faces, material)


def z_on_slope(y, y_low, y_high, z_low, z_high):
    t = (y - y_low) / (y_high - y_low)
    return z_low + t * (z_high - z_low)


def make_skillion_slab(name, collection, x0, x1, y0, y1, z_top_low, z_top_high, thickness, material=None):
    """Sloped slab: top face rises linearly from y0 (z_top_low) to y1 (z_top_high).
    Thickness is measured vertically (simplification, fine for shell massing)."""
    zt0 = z_top_low
    zt1 = z_top_high
    zb0 = zt0 - thickness
    zb1 = zt1 - thickness
    verts = [
        (x0, y0, zb0), (x1, y0, zb0), (x1, y1, zb1), (x0, y1, zb1),  # bottom
        (x0, y0, zt0), (x1, y0, zt0), (x1, y1, zt1), (x0, y1, zt1),  # top
    ]
    faces = [
        (0, 1, 2, 3),
        (4, 5, 6, 7),
        (0, 1, 5, 4),
        (1, 2, 6, 5),
        (2, 3, 7, 6),
        (3, 0, 4, 7),
    ]
    return new_mesh_obj(name, collection, verts, faces, material)


def make_terrain(name, collection, x0, x1, y0, y1, z_y0, z_y1, material=None, segments=24):
    """Subdivided ground plane, falling linearly along Y from z_y0 (at y0) to z_y1 (at y1)."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    grid = []
    for j in range(segments + 1):
        y = y0 + (y1 - y0) * j / segments
        z = z_on_slope(y, y0, y1, z_y0, z_y1)
        row = []
        for i in range(segments + 1):
            x = x0 + (x1 - x0) * i / segments
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    bm.verts.ensure_lookup_table()
    for j in range(segments):
        for i in range(segments):
            bm.faces.new((grid[j][i], grid[j + 1][i], grid[j + 1][i + 1], grid[j][i + 1]))
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    if material is not None:
        obj.data.materials.append(material)
    return obj


def hollow_wall_box(name, collection, x0, x1, y0, y1, z0, z1, thk, material=None):
    """Perimeter wall loop (four wall panels) rather than a solid box, so the shell reads as walls."""
    objs = []
    objs.append(make_box(f"{name}_S", collection, x0, x1, y0, y0 + thk, z0, z1, material))
    objs.append(make_box(f"{name}_N", collection, x0, x1, y1 - thk, y1, z0, z1, material))
    objs.append(make_box(f"{name}_W", collection, x0, x0 + thk, y0 + thk, y1 - thk, z0, z1, material))
    objs.append(make_box(f"{name}_E", collection, x1 - thk, x1, y0 + thk, y1 - thk, z0, z1, material))
    return objs


def offset_wall_loop(name, collection, x0, x1, y0, y1, z0, z1, thk, offset, material=None):
    """A thin skin offset outward (positive) or inward (negative) from a wall envelope."""
    return hollow_wall_box(
        name, collection,
        x0 - offset, x1 + offset, y0 - offset, y1 + offset,
        z0, z1, thk, material,
    )


# ---------------------------------------------------------------------------
# Stage colours (visual read of the sequence in the combined still)
# ---------------------------------------------------------------------------

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


def mat_for_stage(n, name, alpha=1.0):
    return get_material(f"stage_{n:02d}_{name}", STAGE_COLORS[n], alpha)


# ---------------------------------------------------------------------------
# Stage 01 — Site strip / earthworks
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_01_site_strip")
strip_pad_z = RL_FRONT - 0.30  # stripped topsoil pad, flat reference below finished front RL
make_box("stripped_pad", col, 0, LOT_WIDTH, 0, LOT_DEPTH, strip_pad_z - 0.15, strip_pad_z,
          mat_for_stage(1, "strip"))

# ---------------------------------------------------------------------------
# Stage 02 — Site terrain / cut-fill to finished levels
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_02_terrain")
terrain = make_terrain("terrain_finished", col, 0, LOT_WIDTH, 0, LOT_DEPTH,
                        RL_FRONT, RL_REAR, mat_for_stage(2, "terrain"))

# ---------------------------------------------------------------------------
# Stage 03 — Footings / foundations
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_03_footings")
FOOTING_DEPTH = 0.600
hollow_wall_box("footing_garage", col, gx0 - 0.15, gx1 + 0.15, gy0 - 0.15, gy1 + 0.15,
                 RL_GARAGE_FFL - FOOTING_DEPTH, RL_GARAGE_FFL, 0.30, mat_for_stage(3, "footing"))
hollow_wall_box("footing_building", col, bx0 - 0.15, bx1 + 0.15, by0 - 0.15, by1 + 0.15,
                 RL_GARAGE_FFL - FOOTING_DEPTH, RL_GARAGE_FFL, 0.30, mat_for_stage(3, "footing"))

# ---------------------------------------------------------------------------
# Stage 04 — Garage box slab (FFL 18.730)
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_04_garage_slab")
make_box("garage_slab", col, gx0, gx1, gy0, gy1, RL_GARAGE_FFL - SLAB_THK, RL_GARAGE_FFL,
          mat_for_stage(4, "slab"))

# ---------------------------------------------------------------------------
# Stage 05 — Garage box walls
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_05_garage_walls")
hollow_wall_box("garage_walls", col, gx0, gx1, gy0, gy1, RL_GARAGE_FFL, RL_GROUND_FFL,
                 WALL_THK, mat_for_stage(5, "wall"))

# ---------------------------------------------------------------------------
# Stage 06 — Suspended slab formwork / pour (RL 22.230)
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_06_suspended_slab")
make_box("suspended_slab", col, bx0, bx1, by0, by1, RL_GROUND_FFL - SLAB_THK, RL_GROUND_FFL,
          mat_for_stage(6, "slab"))

# ---------------------------------------------------------------------------
# Stage 07 — Ground floor walls
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_07_ground_walls")
hollow_wall_box("ground_walls", col, bx0, bx1, by0, by1, RL_GROUND_FFL, RL_FIRST_FFL,
                 WALL_THK, mat_for_stage(7, "wall"))

# ---------------------------------------------------------------------------
# Stage 08 — First floor framing (RL 25.600)
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_08_first_floor_framing")
make_box("first_floor_slab", col, bx0, bx1, by0, by1, RL_FIRST_FFL - SLAB_THK, RL_FIRST_FFL,
          mat_for_stage(8, "floor"))

# ---------------------------------------------------------------------------
# Stage 09 — First floor walls
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_09_first_floor_walls")
hollow_wall_box("first_floor_walls", col, bx0, bx1, by0, by1, RL_FIRST_FFL, RL_EAVE_LOW,
                 WALL_THK, mat_for_stage(9, "wall"))

# ---------------------------------------------------------------------------
# Stage 10 — Roof framing (skillion, 11.5 deg, ridge RL 29.520)
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_10_roof_framing")
RAFTER_W = 0.070
RAFTER_D = 0.240
n_rafters = 9
for i in range(n_rafters):
    x = bx0 + (BUILDING_WIDTH) * i / (n_rafters - 1)
    x0r = max(bx0, x - RAFTER_W / 2)
    x1r = min(bx1, x + RAFTER_W / 2)
    make_skillion_slab(f"rafter_{i:02d}", col, x0r, x1r, by0, by1,
                        RL_EAVE_LOW - RAFTER_D, RL_RIDGE - RAFTER_D, RAFTER_D,
                        mat_for_stage(10, "rafter"))
# ridge beam
make_box("ridge_beam", col, bx0, bx1, by1 - 0.30, by1, RL_RIDGE - 0.30, RL_RIDGE,
          mat_for_stage(10, "rafter"))

# ---------------------------------------------------------------------------
# Stage 11 — Roof cladding
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_11_roof_cladding")
ROOF_OVERHANG = 0.450
make_skillion_slab("roof_cladding", col,
                    bx0 - ROOF_OVERHANG, bx1 + ROOF_OVERHANG,
                    by0 - ROOF_OVERHANG, by1 + ROOF_OVERHANG,
                    RL_EAVE_LOW, RL_RIDGE, 0.060, mat_for_stage(11, "clad", alpha=0.45))

# ---------------------------------------------------------------------------
# Stage 12 — External wall cladding
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_12_external_cladding")
mat_clad = mat_for_stage(12, "clad", alpha=0.45)
offset_wall_loop("clad_garage", col, gx0, gx1, gy0, gy1, RL_GARAGE_FFL, RL_GROUND_FFL,
                  CLAD_THK, CLAD_THK, mat_clad)
offset_wall_loop("clad_ground", col, bx0, bx1, by0, by1, RL_GROUND_FFL, RL_FIRST_FFL,
                  CLAD_THK, CLAD_THK, mat_clad)
offset_wall_loop("clad_first", col, bx0, bx1, by0, by1, RL_FIRST_FFL, RL_EAVE_LOW,
                  CLAD_THK, CLAD_THK, mat_clad)

# ---------------------------------------------------------------------------
# Stage 13 — Windows / doors (placeholder openings on the north / street facade)
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_13_windows_doors")
mat_glaze = mat_for_stage(13, "glazing", alpha=0.4)
# garage roller doors
door_w = 2.700
gap = (GARAGE_WIDTH - 2 * door_w) / 3
for k in range(2):
    dx0 = gx0 + gap * (k + 1) + door_w * k
    dx1 = dx0 + door_w
    make_box(f"garage_door_{k}", col, dx0, dx1, gy0 - 0.02, gy0 + 0.02,
              RL_GARAGE_FFL, RL_GARAGE_FFL + 2.400, mat_glaze)
# ground floor front glazing band
make_box("ground_glazing_north", col, bx0 + 1.0, bx1 - 1.0, by0 - 0.02, by0 + 0.02,
          RL_GROUND_FFL + 0.900, RL_FIRST_FFL - 0.300, mat_glaze)
# first floor front windows
make_box("first_glazing_north", col, bx0 + 1.5, bx1 - 1.5, by0 - 0.02, by0 + 0.02,
          RL_FIRST_FFL + 0.900, RL_FIRST_FFL + 2.100, mat_glaze)

# ---------------------------------------------------------------------------
# Stage 14 — Internal linings
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_14_internal_linings")
offset_wall_loop("lining_garage", col, gx0, gx1, gy0, gy1, RL_GARAGE_FFL, RL_GROUND_FFL,
                  LINING_THK, -LINING_THK, mat_for_stage(14, "lining"))
offset_wall_loop("lining_ground", col, bx0, bx1, by0, by1, RL_GROUND_FFL, RL_FIRST_FFL,
                  LINING_THK, -LINING_THK, mat_for_stage(14, "lining"))
offset_wall_loop("lining_first", col, bx0, bx1, by0, by1, RL_FIRST_FFL, RL_EAVE_LOW,
                  LINING_THK, -LINING_THK, mat_for_stage(14, "lining"))

# ---------------------------------------------------------------------------
# Stage 15 — Services rough-in (placeholder massing)
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_15_services")
mat_services = mat_for_stage(15, "services")
riser_positions = [
    (bx0 + 2.0, by0 + 2.0),
    (bx0 + BUILDING_WIDTH - 2.0, by0 + 2.0),
    (bx0 + BUILDING_WIDTH / 2.0, by0 + BUILDING_DEPTH - 2.0),
]
for idx, (rx, ry) in enumerate(riser_positions):
    make_box(f"service_riser_{idx}", col, rx - 0.15, rx + 0.15, ry - 0.15, ry + 0.15,
              RL_GARAGE_FFL, RL_EAVE_LOW, mat_services)

# ---------------------------------------------------------------------------
# Stage 16 — Finishes / completed shell
# ---------------------------------------------------------------------------

col = get_or_make_collection("stage_16_finishes")
mat_finish = mat_for_stage(16, "finish", alpha=0.35)
make_box("finished_garage", col, gx0 - CLAD_THK, gx1 + CLAD_THK, gy0 - CLAD_THK, gy1 + CLAD_THK,
          RL_GARAGE_FFL - SLAB_THK, RL_GROUND_FFL, mat_finish)
make_box("finished_ground", col, bx0 - CLAD_THK, bx1 + CLAD_THK, by0 - CLAD_THK, by1 + CLAD_THK,
          RL_GROUND_FFL - SLAB_THK, RL_FIRST_FFL, mat_finish)
make_box("finished_first", col, bx0 - CLAD_THK, bx1 + CLAD_THK, by0 - CLAD_THK, by1 + CLAD_THK,
          RL_FIRST_FFL - SLAB_THK, RL_EAVE_LOW, mat_finish)
make_skillion_slab("finished_roof", col,
                    bx0 - ROOF_OVERHANG, bx1 + ROOF_OVERHANG,
                    by0 - ROOF_OVERHANG, by1 + ROOF_OVERHANG,
                    RL_EAVE_LOW + 0.05, RL_RIDGE + 0.05, 0.060, mat_finish)

# ---------------------------------------------------------------------------
# Lighting / world
# ---------------------------------------------------------------------------

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.62, 0.72, 0.85, 1.0)
    bg.inputs[1].default_value = 1.1

sun_data = bpy.data.lights.new("Sun", type='SUN')
sun_data.energy = 3.5
sun_data.angle = math.radians(2.0)
sun_obj = bpy.data.objects.new("Sun", sun_data)
scene.collection.objects.link(sun_obj)
sun_obj.location = (bx0 - 10, by0 - 10, RL_RIDGE + 15)
sun_obj.rotation_euler = (math.radians(55), 0, math.radians(-40))

# ---------------------------------------------------------------------------
# Camera — north-west, elevated, matching DA cover-sheet render angle
# ---------------------------------------------------------------------------

target = Vector((
    (bx0 + bx1) / 2.0,
    (by0 + by1) / 2.0 - 1.0,
    (RL_GROUND_FFL + RL_RIDGE) / 2.0,
))

cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 40
cam_obj = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam_obj)

cam_pos = Vector((bx0 - 22.0, by0 - 24.0, RL_FRONT + 10.0))
cam_obj.location = cam_pos

direction = target - cam_pos
cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

scene.camera = cam_obj

# ---------------------------------------------------------------------------
# Render settings
# ---------------------------------------------------------------------------

scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = os.path.join(os.path.dirname(bpy.data.filepath) or os.getcwd(), "..", "test-frame.png")
scene.render.filepath = os.path.normpath(scene.render.filepath)

scene.frame_start = 1
scene.frame_end = 1
scene.frame_set(1)

# ---------------------------------------------------------------------------
# Save .blend and render
# ---------------------------------------------------------------------------

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
blend_path = os.path.join(repo_root, "blender", "dual_occupancy.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)

scene.render.filepath = os.path.join(repo_root, "test-frame.png")
bpy.ops.render.render(write_still=True)

print("Saved:", blend_path)
print("Rendered:", scene.render.filepath)
