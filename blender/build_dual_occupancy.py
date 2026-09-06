"""
Parametric Blender build script — Dual Occupancy, 37 Osborne St Gerringong.

Single static test render, all 16 stages visible at once (no animation).
Geometry is built by dual_occupancy_lib.py, shared with build_animation.py.

Run headless:
    blender --background --factory-startup --python blender/build_dual_occupancy.py

Produces:
    blender/dual_occupancy.blend
    test-frame.png   (1920x1080 still, camera from the north-west, all 16 stages visible)
"""

import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dual_occupancy_lib as lib  # noqa: E402

scene = lib.reset_scene()
stage_cols = lib.build_all_stages()
lib.add_world_and_sun(scene)

# ---------------------------------------------------------------------------
# Camera — north-west, elevated, matching DA cover-sheet render angle
# ---------------------------------------------------------------------------

target = Vector((
    (lib.bx0 + lib.bx1) / 2.0,
    (lib.by0 + lib.by1) / 2.0 - 1.0,
    (lib.RL_GROUND_FFL + lib.RL_RIDGE) / 2.0,
))

cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 40
cam_obj = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam_obj)

cam_pos = Vector((lib.bx0 - 22.0, lib.by0 - 24.0, lib.RL_FRONT + 10.0))
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
