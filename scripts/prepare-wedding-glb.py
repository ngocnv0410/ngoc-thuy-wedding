"""// [DANCE-SWAP] Build colored, skinned GLBs from the owner's unmodified Drive meshes.
Run with Blender: blender -b -t 4 --python scripts/prepare-wedding-glb.py --
  --source-dir /path/to/downloads --output-dir public/models/wedding
Optional --prepared-dir reuses normalized/reduced .blend intermediates.
Offline texture build requires scipy in Blender and numpy/xatlas in DANCE_UNWRAP_PYTHON
(default: python). These tools do not become application/browser dependencies.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', required=True)
parser.add_argument('--output-dir', required=True)
parser.add_argument('--prepared-dir')
parser.add_argument('--subject', choices=['groom', 'bride'], required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
repo = Path(__file__).resolve().parent.parent
out = Path(args.output_dir).resolve()
out.mkdir(parents=True, exist_ok=True)
bride = args.subject == 'bride'
source = Path(args.source_dir) / ('bride.glb' if bride else 'gloom.glb')

# [DANCE-SWAP] Normalize a working copy, preserve proportions, reduce the actual supplied surface.
if args.prepared_dir:
    bpy.ops.wm.open_mainfile(filepath=str(Path(args.prepared_dir) / ('bride-reduced.blend' if bride else 'gloom-reduced.blend')))
else:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
obj = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
if not args.prepared_dir:
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    low = Vector([min(v.co[i] for v in obj.data.vertices) for i in range(3)])
    high = Vector([max(v.co[i] for v in obj.data.vertices) for i in range(3)])
    offset = Vector(((low.x + high.x) / 2, (low.y + high.y) / 2, low.z))
    for v in obj.data.vertices:
        v.co = (v.co - offset) * (1.6 / (high.z - low.z))
    decimate = obj.modifiers.new('Preserve source silhouette, 36000 triangles', 'DECIMATE')
    decimate.ratio = min(1, 36000 / len(obj.data.polygons))
    decimate.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=decimate.name)
obj.name = args.subject + '-source-surface'
for p in obj.data.polygons:
    p.use_smooth = True
obj.data.update()

# [DANCE-SWAP] Anatomical landmark placement is fitted to each supplied mesh's rest A-pose.
# Coordinates below are Blender X/-Y/Z; export converts them to glTF X/Y/Z.
hip_z = .69 if bride else .43
body_y = .015 if bride else -.065
shoulder_z = .89 if bride else .765
arm_x = .155 if bride else .17
elbow = (.255, -.04, .72) if bride else (.267, -.075, .59)
wrist = (.353, -.10, .565) if bride else (.353, -.09, .445)
head_z = .95 if bride else .845
bpy.ops.object.select_all(action='DESELECT')
arm_data = bpy.data.armatures.new(args.subject + '-humanoid')
arm = bpy.data.objects.new(args.subject + '-rig', arm_data)
bpy.context.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
rest = {}
def bone(name, a, b, parent=None):
    edit = arm_data.edit_bones.new(name)
    edit.head, edit.tail = a, b
    if parent:
        edit.parent = arm_data.edit_bones[parent]
    rest[name] = (Vector(a), Vector(b))
    return edit
bone('pelvis', (0, body_y, hip_z), (0, body_y, hip_z + .08))
bone('spine', (0, body_y, hip_z), (0, body_y, shoulder_z), 'pelvis')
bone('neck', (0, body_y, shoulder_z), (0, body_y, head_z), 'spine')
bone('head', (0, body_y, head_z), (0, body_y, 1.35), 'neck')
for side, sign in [('L', -1), ('R', 1)]:
    shoulder = (sign * arm_x, body_y, shoulder_z)
    e = (sign * elbow[0], elbow[1], elbow[2])
    w = (sign * wrist[0], wrist[1], wrist[2])
    bone('clavicle' + side, (0, body_y, shoulder_z), shoulder, 'spine')
    bone('upperArm' + side, shoulder, e, 'clavicle' + side)
    bone('forearm' + side, e, w, 'upperArm' + side)
    bone('hand' + side, w, (sign * (wrist[0] + .025), wrist[1], wrist[2] - .06), 'forearm' + side)
    hip = (sign * .10, body_y, hip_z)
    knee = (sign * .12, body_y, hip_z * .53)
    ankle = (sign * .13, body_y, .075)
    bone('thigh' + side, hip, knee, 'pelvis')
    bone('shin' + side, knee, ankle, 'thigh' + side)
    bone('ankle' + side, ankle, (sign * .13, body_y - .10, .04), 'shin' + side)
if bride:
    for name in ['skirtFront', 'skirtBack', 'skirtL', 'skirtR']:
        bone(name, (0, body_y, hip_z), (0, body_y, .05), 'pelvis')
    bone('veil', (0, .14, 1.02), (0, .14, .25), 'head')
bpy.ops.object.mode_set(mode='OBJECT')

# [DANCE-SWAP] Spatial segmentation keeps the face rigid, blends arm joints by segment
# distance and gives the gown/veil independent controls. Every vertex gets <=4 normalized weights.
groups = {name: obj.vertex_groups.new(name=name) for name in rest}
def smooth(a, b, x):
    t = max(0, min(1, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
def distance(p, a, b):
    d = b - a
    return (p - (a + d * max(0, min(1, (p - a).dot(d) / d.length_squared)))).length

def weights(p):
    x, y, z = p
    if z > head_z + .005:
        if bride and y > .17 and z < 1.10:
            return {'veil': 1}
        return {'head': 1}
    if z > shoulder_z + .015 and abs(x) < .17:
        t = smooth(shoulder_z, head_z + .02, z)
        return {'spine': 1 - t, 'head': t}
    side = 'L' if x < 0 else 'R'
    arm_names = ['upperArm' + side, 'forearm' + side, 'hand' + side]
    distances = {n: distance(p, *rest[n]) for n in arm_names}
    near_arm = min(distances.values())
    arm_region = abs(x) > (arm_x - .025) and z > (wrist[2] - .09) and z < shoulder_z + .045
    if bride:
        arm_region = arm_region and y < .075 and near_arm < .083
    if arm_region:
        raw = {n: math.exp(-(d / .055) ** 2) for n, d in distances.items()}
        attach = 1 - smooth(arm_x - .02, arm_x + .035, abs(x))
        raw['spine'] = attach * max(sum(raw.values()), .01)
        return raw
    if bride:
        if y > .15 and z > .10:
            t = smooth(.12, .25, y)
            return {'veil': t, 'skirtBack': 1 - t}
        if z < hip_z + .015:
            angle = math.atan2(x, -(y - body_y))
            raw = {name: max(0, math.cos(angle - a)) ** 4 for name, a in [('skirtFront', 0), ('skirtR', math.pi / 2), ('skirtBack', math.pi), ('skirtL', -math.pi / 2)]}
            if not sum(raw.values()):
                raw['skirtFront'] = 1
            return raw
    elif z < hip_z + .035:
        if z < .10:
            return {'ankle' + side: 1}
        names = ['thigh' + side, 'shin' + side, 'ankle' + side]
        return {n: math.exp(-(distance(p, *rest[n]) / .075) ** 2) for n in names}
    t = smooth(hip_z - .02, hip_z + .15, z)
    return {'pelvis': 1 - t, 'spine': t}

for v in obj.data.vertices:
    raw = sorted(((n, w) for n, w in weights(v.co).items() if w > 1e-8), key=lambda a: -a[1])[:4]
    total = sum(w for _, w in raw)
    if total <= 0:
        raise RuntimeError('Unweighted vertex ' + str(v.index))
    for n, w in raw:
        groups[n].add([v.index], w / total, 'REPLACE')
# [DANCE-SWAP] Repaint from all four owner views; preserve the source mesh and skin weights.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from wedding_multiview_texture import paint_four_views
texture_report = paint_four_views(obj, repo / 'output/dance-rebuild/drive-rig' / ('reference-' + args.subject + '.jpg'), args.subject, out)

mod = obj.modifiers.new('Wedding humanoid deformation', 'ARMATURE')
mod.object = arm
obj.parent = arm
obj['source_sha256'] = hashlib.sha256(source.read_bytes()).hexdigest()
obj['source_file'] = source.name
obj['dance_swap'] = 'Actual Drive geometry; normalized, reduced, colored, UV mapped and skinned'
arm['dance_swap'] = '37-channel media-clock motion adapter; no baked root travel'

# [DANCE-SWAP] Export only the rigged source mesh and skeleton. No new runtime dependency.
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = obj
output = out / (args.subject + '-rigged.glb')
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB', use_selection=True, export_animations=False, export_extras=True, export_image_format='JPEG', export_jpeg_quality=95, export_yup=True)
report = {'_comment': '// [DANCE-SWAP]', 'source': source.name, 'sourceSHA256': obj['source_sha256'], 'vertices': len(obj.data.vertices), 'triangles': len(obj.data.polygons), 'bones': list(rest), 'unweightedVertices': sum(not v.groups for v in obj.data.vertices), 'maxInfluences': max(len(v.groups) for v in obj.data.vertices), 'bytes': output.stat().st_size, 'normalizedHeight': 1.6, 'portraitSource': 'Owner four-view reference photographs', 'textureRegistration': texture_report, 'limitations': ['Side/back detail projected from owner-provided four-view reference; projection is approximate', 'No finger tracking or cloth simulation', 'Bride source contains gown but no visible leg/foot geometry; skeleton legs are retained for retargeting'] if bride else ['Side/back detail projected from owner-provided four-view reference; projection is approximate', 'No individual finger tracking']}
(out / (args.subject + '-rig-report.json')).write_text(json.dumps(report, indent=2) + '\n')
bpy.ops.wm.save_as_mainfile(filepath=str(out / (args.subject + '-working.blend')))
print('DANCE_SWAP_REPORT', json.dumps(report), flush=True)
