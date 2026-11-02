"""// [DANCE-SWAP] Build colored, skinned GLBs from the owner's unmodified Drive meshes.
Run with Blender: blender -b -t 4 --python scripts/prepare-wedding-glb.py --
  --source-dir /path/to/downloads --output-dir public/models/wedding
Optional --prepared-dir reuses normalized/reduced .blend intermediates.
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

# [DANCE-SWAP] PBR palette follows the supplied image; portrait detail is projected onto the
# actual head geometry, with its own UVs. No replacement head mesh, billboard or camera change.
def linear(v):
    return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4

def material(name, hex_color, roughness=.8, metallic=0):
    rgb = tuple(linear(int(hex_color[i:i + 2], 16) / 255) for i in (0, 2, 4))
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    m.diffuse_color = (*rgb, 1)
    obj.data.materials.append(m)
    return len(obj.data.materials) - 1
obj.data.materials.clear()
skin = material('Reference fair peach skin', 'f5d2bc', .9)
hair = material('Reference chestnut hair', '614537', .8)
white = material('Reference ivory white fabric', 'f6f2eb', .9)
suit = material('Reference taupe wedding suit', '927968', .93)
shoe = material('Reference brown leather', '594337', .55)
flower = material('Reference ivory blossoms', 'ffedd5', .75)
leaf = material('Reference boutonniere stems', '8a8b56', .95)
face = material('Reference portrait projected on supplied 3D head', 'ffffff', .9)
head_image = bpy.data.images.load(str(repo / 'src/assets/chibi/approved' / (args.subject + '-head.webp')))
head_image.pack()
face_mat = obj.data.materials[face]
texture = face_mat.node_tree.nodes.new('ShaderNodeTexImage')
texture.image = head_image
texture.extension = 'EXTEND'
face_mat.node_tree.links.new(texture.outputs['Color'], face_mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
uv = obj.data.uv_layers.new(name='SourcePortraitProjection')
head_bottom = .94 if bride else .84
for loop in obj.data.loops:
    x, y, z = obj.data.vertices[loop.vertex_index].co
    width = (.77 if bride else .88) if z < (1.25 if bride else 1.2) else (.70 if bride else .73)
    uv.data[loop.index].uv = (.5 + x / width, (z - head_bottom) / (1.6 - head_bottom))

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
for polygon in obj.data.polygons:
    p = sum((obj.data.vertices[i].co for i in polygon.vertices), Vector()) / len(polygon.vertices)
    x, y, z = p
    if z >= head_bottom:
        if y < (-.135 if bride else -.15):
            index = face
        elif z < (1.16 if bride else 1.12) and y < -.015:
            index = skin
        else:
            index = hair
        if bride and y > .23 + .5 * (z - .94) and z < 1.18:
            index = white
    elif bride:
        near_arm = min(distance(p, *rest[n]) for n in ['upperArmL', 'forearmL', 'handL', 'upperArmR', 'forearmR', 'handR'])
        index = skin if y < .075 and abs(x) > .15 and near_arm < .078 and z > .48 else white
        if .885 < z < .95 and abs(x) < .16 and y < .05:
            index = skin
    else:
        index = suit
        if z < .09:
            index = shoe
        elif abs(x) > .30 and z < .49:
            index = skin
        elif y < -.12 and .68 < z < .84 and abs(x) < .065:
            index = white
        elif y < -.16 and .70 < z < .79 and .065 < x < .15:
            index = flower
        elif y < -.16 and .66 < z < .71 and .085 < x < .12:
            index = leaf
    polygon.material_index = index
# [DANCE-SWAP] Bake smooth material transitions and portrait projection to a packed UV atlas.
# Fill transparent reference pixels from their nearest opaque neighbor so the silhouette
# cannot introduce black/white wedges on the model's cheeks, ears or chin.
from collections import deque
import numpy as np
pixels = np.array(head_image.pixels[:], dtype=np.float32).reshape(head_image.size[1], head_image.size[0], 4)
opaque = pixels[:, :, 3] > .95
visited = opaque.copy()
queue = deque()
for yy, xx in zip(*np.where(opaque)):
    if (yy and not opaque[yy - 1, xx]) or (yy + 1 < len(opaque) and not opaque[yy + 1, xx]) or (xx and not opaque[yy, xx - 1]) or (xx + 1 < opaque.shape[1] and not opaque[yy, xx + 1]):
        queue.append((yy, xx))
while queue:
    yy, xx = queue.popleft()
    for ny, nx in [(yy - 1, xx), (yy + 1, xx), (yy, xx - 1), (yy, xx + 1)]:
        if 0 <= ny < pixels.shape[0] and 0 <= nx < pixels.shape[1] and not visited[ny, nx]:
            visited[ny, nx] = True
            pixels[ny, nx, :3] = pixels[yy, xx, :3]
            queue.append((ny, nx))
pixels[:, :, 3] = 1
head_image.pixels.foreach_set(pixels.ravel())
head_image.update()
palette = obj.data.color_attributes.new(name='ReferencePalette', type='FLOAT_COLOR', domain='CORNER')
mask = obj.data.color_attributes.new(name='PortraitMask', type='FLOAT_COLOR', domain='CORNER')
palette = obj.data.color_attributes['ReferencePalette']
mask = obj.data.color_attributes['PortraitMask']
# Average neighboring polygon palette colors at each vertex to soften material borders.
vertex_colors = np.zeros((len(obj.data.vertices), 3))
counts = np.zeros(len(obj.data.vertices))
for polygon in obj.data.polygons:
    color = obj.data.materials[polygon.material_index].diffuse_color[:3]
    for index in polygon.vertices:
        vertex_colors[index] += color
        counts[index] += 1
vertex_colors /= np.maximum(counts[:, None], 1)
for loop in obj.data.loops:
    x, y, z = obj.data.vertices[loop.vertex_index].co
    color = vertex_colors[loop.vertex_index]
    if z > head_bottom - .025 and not (bride and y > .23 + .5 * (z - .94) and z < 1.18):
        skin_side = (1 - smooth(1.11 if bride else 1.08, 1.22 if bride else 1.19, z)) * (1 - smooth(-.02, .06, y))
        c_hair = obj.data.materials[hair].diffuse_color[:3]
        c_skin = obj.data.materials[skin].diffuse_color[:3]
        color = [a * (1 - skin_side) + b * skin_side for a, b in zip(c_hair, c_skin)]
    palette.data[loop.index].color = (*color, 1)
    front = smooth(.10, .23, -y) * smooth(head_bottom - .015, head_bottom + .025, z)
    if bride and y > .12:
        front = 0
    mask.data[loop.index].color = (front, front, front, 1)
blend_material = bpy.data.materials.new('Reference palette with smooth portrait boundary')
blend_material.use_nodes = True
nodes = blend_material.node_tree.nodes
links = blend_material.node_tree.links
base = nodes['Principled BSDF']
base.inputs['Roughness'].default_value = .88
colors = nodes.new('ShaderNodeVertexColor'); colors.layer_name = 'ReferencePalette'
blend = nodes.new('ShaderNodeVertexColor'); blend.layer_name = 'PortraitMask'
photo_uv = nodes.new('ShaderNodeUVMap'); photo_uv.uv_map = 'SourcePortraitProjection'
photo = nodes.new('ShaderNodeTexImage'); photo.image = head_image; photo.extension = 'EXTEND'
links.new(photo_uv.outputs['UV'], photo.inputs['Vector'])
mix = nodes.new('ShaderNodeMixRGB')
links.new(blend.outputs['Color'], mix.inputs[0]); links.new(colors.outputs['Color'], mix.inputs[1]); links.new(photo.outputs['Color'], mix.inputs[2]); links.new(mix.outputs[0], base.inputs['Base Color'])
# [DANCE-SWAP] New owner-provided four-view reference supplies the side/back hair
# detail and front tailoring. Projection is baked onto the same original mesh surface.
reference = bpy.data.images.load(str(repo / 'output/dance-rebuild/drive-rig' / ('reference-' + args.subject + '.jpg')))
reference.alpha_mode = 'STRAIGHT'
ref_pixels = np.array(reference.pixels[:], dtype=np.float32).reshape(reference.size[1], reference.size[0], 4)
ref_pixels[:, :, 3] = np.clip((.98 - ref_pixels[:, :, :3].min(axis=2)) / .16, 0, 1)
reference.pixels.foreach_set(ref_pixels.ravel()); reference.update(); reference.pack()
previous_color = mix.outputs[0]
for view in ['Side', 'Back', 'Tailoring']:
    layer_name = 'Reference' + view
    layer = obj.data.uv_layers.new(name=layer_name)
    blend_attr = obj.data.color_attributes.new(name=layer_name + 'Mask', type='FLOAT_COLOR', domain='CORNER')
    layer = obj.data.uv_layers[layer_name]
    scale = (454 if bride else 469) / 1.6
    center = {'Side': 148 if bride else 139, 'Back': 128 if bride else 132, 'Tailoring': 173 if bride else 183}[view]
    panel = {'Side': 2, 'Back': 3, 'Tailoring': 0}[view]
    for loop in obj.data.loops:
        x, y, z = obj.data.vertices[loop.vertex_index].co
        horizontal = y - body_y if view == 'Side' else (-x if view == 'Back' else x)
        layer.data[loop.index].uv = ((panel * 320 + center + horizontal * scale) / 1280, ((511 - (478 if bride else 480)) + z * scale) / 511)
        is_veil = bride and y > .23 + .5 * (z - .94) and z < 1.18
        if view == 'Side':
            weight = smooth(.19, .30, abs(x)) * smooth(-.20, -.08, y) * (1 - smooth(.04, .18, y)) * smooth(head_bottom + .04, head_bottom + .14, z)
        elif view == 'Back':
            weight = smooth(.06, .20, y) * smooth(head_bottom + .015, head_bottom + .10, z)
        else:
            weight = (1 - smooth(-.17, -.10, y)) * smooth(.42, .49, z) * (1 - smooth(.80, .845, z)) * (1 - smooth(.16, .205, abs(x))) if not bride else 0
        if is_veil:
            weight = 0
        blend_attr.data[loop.index].color = (weight, weight, weight, 1)
    texture_uv = nodes.new('ShaderNodeUVMap'); texture_uv.uv_map = layer_name
    view_texture = nodes.new('ShaderNodeTexImage'); view_texture.image = reference; view_texture.extension = 'EXTEND'
    links.new(texture_uv.outputs['UV'], view_texture.inputs['Vector'])
    view_blend = nodes.new('ShaderNodeVertexColor'); view_blend.layer_name = layer_name + 'Mask'
    multiply = nodes.new('ShaderNodeMath'); multiply.operation = 'MULTIPLY'
    links.new(view_blend.outputs['Color'], multiply.inputs[0]); links.new(view_texture.outputs['Alpha'], multiply.inputs[1])
    view_mix = nodes.new('ShaderNodeMixRGB')
    links.new(multiply.outputs[0], view_mix.inputs[0]); links.new(previous_color, view_mix.inputs[1]); links.new(view_texture.outputs['Color'], view_mix.inputs[2])
    previous_color = view_mix.outputs[0]
links.new(previous_color, base.inputs['Base Color'])

obj.data.materials.clear(); obj.data.materials.append(blend_material)
for polygon in obj.data.polygons:
    polygon.material_index = 0
# [DANCE-SWAP] Adding CustomData layers can invalidate RNA handles; check source UVs before baking.
for loop_index in range(0, len(obj.data.loops), 113):
    loop = obj.data.loops[loop_index]
    x, y, z = obj.data.vertices[loop.vertex_index].co
    width = (.77 if bride else .88) if z < (1.25 if bride else 1.2) else (.70 if bride else .73)
    expected = Vector((.5 + x / width, (z - head_bottom) / (1.6 - head_bottom)))
    actual = obj.data.uv_layers['SourcePortraitProjection'].data[loop_index].uv
    if (actual - expected).length > 1e-4:
        raise RuntimeError('Source portrait UV corruption at loop ' + str(loop_index))

atlas_uv = obj.data.uv_layers.new(name='WeddingAtlas')
obj.data.uv_layers.active = atlas_uv
atlas_uv.active_render = True
bpy.context.view_layer.objects.active = obj
bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=.006)
bpy.ops.object.mode_set(mode='OBJECT')
atlas = bpy.data.images.new(args.subject + '-reference-atlas', width=2048, height=2048, alpha=False)
target = nodes.new('ShaderNodeTexImage'); target.image = atlas; nodes.active = target
scene = bpy.context.scene; scene.render.engine = 'CYCLES'; scene.cycles.samples = 1; scene.cycles.use_denoising = False
scene.render.bake.use_pass_direct = False; scene.render.bake.use_pass_indirect = False; scene.render.bake.use_pass_color = True; scene.render.bake.margin = 8
bpy.ops.object.bake(type='DIFFUSE')
atlas.filepath_raw = str(out / (args.subject + '-atlas.png')); atlas.file_format = 'PNG'; atlas.save(); atlas.pack()
links.new(target.outputs['Color'], base.inputs['Base Color'])
for node in list(nodes):
    if node not in [target, base, nodes.get('Material Output')]:
        nodes.remove(node)
# Only the packed atlas is needed by glTF; don't multiply it by intermediate colors.
for attr_name in [attr.name for attr in obj.data.color_attributes]:
    obj.data.color_attributes.remove(obj.data.color_attributes[attr_name])
for uv_name in [layer.name for layer in obj.data.uv_layers if layer.name != 'WeddingAtlas']:
    obj.data.uv_layers.remove(obj.data.uv_layers[uv_name])
obj.data.uv_layers.active = obj.data.uv_layers['WeddingAtlas']

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
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB', use_selection=True, export_animations=False, export_extras=True, export_image_format='AUTO', export_yup=True)
report = {'_comment': '// [DANCE-SWAP]', 'source': source.name, 'sourceSHA256': obj['source_sha256'], 'vertices': len(obj.data.vertices), 'triangles': len(obj.data.polygons), 'bones': list(rest), 'unweightedVertices': sum(not v.groups for v in obj.data.vertices), 'maxInfluences': max(len(v.groups) for v in obj.data.vertices), 'bytes': output.stat().st_size, 'normalizedHeight': 1.6, 'portraitSource': 'Existing approved artwork matching supplied reference; front projection onto actual source head', 'limitations': ['Side/back detail projected from owner-provided four-view reference; projection is approximate', 'No finger tracking or cloth simulation', 'Bride source contains gown but no visible leg/foot geometry; skeleton legs are retained for retargeting'] if bride else ['Side/back detail projected from owner-provided four-view reference; projection is approximate', 'No individual finger tracking']}
(out / (args.subject + '-rig-report.json')).write_text(json.dumps(report, indent=2) + '\n')
bpy.ops.wm.save_as_mainfile(filepath=str(out / (args.subject + '-working.blend')))
print('DANCE_SWAP_REPORT', json.dumps(report), flush=True)
