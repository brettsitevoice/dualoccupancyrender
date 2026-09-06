"""
Construction-sequence animation — Dual Occupancy, 37 Osborne St Gerringong.

Geometry from dual_occupancy_lib.py (shared with build_dual_occupancy.py).
Each of the 16 stage collections (build-spec.md sequence) appears over 12
frames (drops 1.5 m into position while fading in), then holds for the rest
of its 6-second block. 24 fps, 6 s/stage, 16 stages -> 96 s / 2304 frames.

Camera performs one slow orbit, north-west through north (at the animation's
midpoint) to north-east, always framing the full building envelope.

Blender renders CLEAN frames (no burn-in) — stage number / title / RL are
composited on afterwards, bottom-left, by ffmpeg drawtext (see
blender/gen_burnin.py + render_sequence.sh), since Blender's built-in render
stamp cannot be repositioned to the bottom-left corner.

Usage (run from repo root):
    blender --background --factory-startup --python blender/build_animation.py -- preview
        -> renders frames 1, 300, 900, 2300 as stills into blender/previews/
           (also saves blender/dual_occupancy_animation.blend)

    blender --background --factory-startup --python blender/build_animation.py -- full
        -> renders the full 2304-frame PNG sequence into blender/frames/
           (slow: run in the background)
"""

import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dual_occupancy_lib as lib  # noqa: E402
import stage_data as sd  # noqa: E402

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------

argv = sys.argv
args = argv[argv.index("--") + 1:] if "--" in argv else []
MODE = args[0] if args else "preview"
PREVIEW_FRAMES = [1, 300, 900, 2300]

# ---------------------------------------------------------------------------
# Build scene
# ---------------------------------------------------------------------------

scene = lib.reset_scene()
scene.render.fps = sd.FPS
scene.frame_start = 1
scene.frame_end = sd.TOTAL_FRAMES

stage_cols = lib.build_all_stages()
lib.add_world_and_sun(scene)

# ---------------------------------------------------------------------------
# Camera bounding box — the actual building (exclude the whole-lot terrain /
# site-strip pads from stages 1-2 so the orbit frames the BUILDING, not the site)
# ---------------------------------------------------------------------------

bbox_min, bbox_max = lib.compute_bbox(stage_cols, range(3, sd.N_STAGES + 1))
center = (bbox_min + bbox_max) / 2.0
extent = bbox_max - bbox_min
radius = extent.length / 2.0

cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 40
cam_obj = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

distance = radius * sd.DIST_RATIO
horiz = distance * math.cos(math.radians(sd.ELEV_DEG))
height = distance * math.sin(math.radians(sd.ELEV_DEG))


def camera_pose(frame):
    t = (frame - 1) / (sd.TOTAL_FRAMES - 1) if sd.TOTAL_FRAMES > 1 else 0.0
    az = math.radians(sd.AZ_START + (sd.AZ_END - sd.AZ_START) * t)
    # North = -Y (building's front/street elevation faces north), East = +X.
    pos = Vector((
        center.x + horiz * math.sin(az),
        center.y - horiz * math.cos(az),
        center.z + height,
    ))
    direction = center - pos
    rot = direction.to_track_quat('-Z', 'Y').to_euler()
    return pos, rot


print(f"Camera orbit: radius(bbox)={radius:.2f} m, distance={distance:.2f} m, "
      f"center={tuple(round(c, 2) for c in center)}")

for f in range(1, sd.TOTAL_FRAMES + 1):
    pos, rot = camera_pose(f)
    cam_obj.location = pos
    cam_obj.rotation_euler = rot
    cam_obj.keyframe_insert("location", frame=f)
    cam_obj.keyframe_insert("rotation_euler", frame=f)

if cam_obj.animation_data and cam_obj.animation_data.action:
    for fc in cam_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

# ---------------------------------------------------------------------------
# Per-stage animation: hide -> drop 1.5 m + fade in over 12 frames -> hold
# ---------------------------------------------------------------------------


def set_interp(fcurve, mode):
    for kp in fcurve.keyframe_points:
        kp.interpolation = mode


def find_fcurve(action, data_path, index=-1):
    if action is None:
        return None
    return action.fcurves.find(data_path, index=index)


for info in sd.STAGE_INFO:
    idx = info["index"]
    col = stage_cols[idx]
    start = sd.stage_start_frame(idx)
    end_appear = start + sd.APPEAR_FRAMES - 1
    pre = max(start - 1, 1)

    materials_in_stage = set()

    for obj in col.objects:
        # Visibility: hidden right up until the stage starts, then stays visible.
        obj.hide_render = True
        obj.hide_viewport = True
        obj.keyframe_insert("hide_render", frame=pre)
        obj.keyframe_insert("hide_viewport", frame=pre)
        obj.hide_render = False
        obj.hide_viewport = False
        obj.keyframe_insert("hide_render", frame=start)
        obj.keyframe_insert("hide_viewport", frame=start)

        act = obj.animation_data.action if obj.animation_data else None
        for path in ("hide_render", "hide_viewport"):
            fc = find_fcurve(act, path)
            if fc:
                set_interp(fc, 'CONSTANT')

        # Z drop: falls 1.5 m into its final resting position while it fades in.
        base_z = obj.location.z
        obj.location.z = base_z + sd.DROP_HEIGHT
        obj.keyframe_insert("location", index=2, frame=start)
        obj.location.z = base_z
        obj.keyframe_insert("location", index=2, frame=end_appear)

        fc = find_fcurve(obj.animation_data.action if obj.animation_data else None,
                          "location", index=2)
        if fc:
            set_interp(fc, 'SINE')
            for kp in fc.keyframe_points:
                kp.easing = 'EASE_OUT'

        for slot in obj.material_slots:
            if slot.material:
                materials_in_stage.add(slot.material)

    # Fade in: animate the shared Principled BSDF Alpha for every material
    # used by this stage, 0 -> its resting alpha, over the same 12 frames.
    for mat in materials_in_stage:
        if not mat.use_nodes:
            continue
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if not bsdf or "Alpha" not in bsdf.inputs:
            continue
        target_alpha = mat.diffuse_color[3]
        alpha_input = bsdf.inputs["Alpha"]
        alpha_input.default_value = 0.0
        alpha_input.keyframe_insert("default_value", frame=start)
        alpha_input.default_value = target_alpha
        alpha_input.keyframe_insert("default_value", frame=end_appear)

        node_action = mat.node_tree.animation_data.action if mat.node_tree.animation_data else None
        data_path = alpha_input.path_from_id("default_value")
        fc = find_fcurve(node_action, data_path)
        if fc:
            set_interp(fc, 'SINE')
            for kp in fc.keyframe_points:
                kp.easing = 'EASE_OUT'

# ---------------------------------------------------------------------------
# Render settings — EEVEE (not Cycles), 1920x1080, clean frames
# (burn-in text is composited afterwards by ffmpeg; see gen_burnin.py)
# ---------------------------------------------------------------------------

scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.use_stamp = False

scene.eevee.taa_render_samples = 24
scene.eevee.use_gtao = False
scene.eevee.use_bloom = False
scene.eevee.use_ssr = False

blend_path = os.path.join(repo_root, "blender", "dual_occupancy_animation.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("Saved:", blend_path)

if MODE == "preview":
    out_dir = os.path.join(repo_root, "blender", "previews")
    os.makedirs(out_dir, exist_ok=True)
    for f in PREVIEW_FRAMES:
        scene.frame_set(f)
        scene.render.filepath = os.path.join(out_dir, f"preview_{f:04d}")
        bpy.ops.render.render(write_still=True)
        print("Rendered preview:", scene.render.filepath)

elif MODE == "full":
    frames_dir = os.path.join(repo_root, "blender", "frames")
    os.makedirs(frames_dir, exist_ok=True)
    scene.render.filepath = os.path.join(frames_dir, "frame_####")
    scene.frame_start = 1
    scene.frame_end = sd.TOTAL_FRAMES
    bpy.ops.render.render(animation=True)
    print("Rendered full sequence to:", frames_dir)

else:
    raise ValueError(f"Unknown mode: {MODE!r} (expected 'preview' or 'full')")
