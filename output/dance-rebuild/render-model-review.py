"""Render inspection views from a GLB without changing the source model."""
import argparse
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--input', required=True)
parser.add_argument('--output', required=True)
parser.add_argument('--clay', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(Path(args.input).resolve()))
scene = bpy.context.scene
imported = list(scene.objects)
meshes = [o for o in imported if o.type == 'MESH']
if not meshes:
    raise RuntimeError('No mesh objects in the GLB')
corners = [o.matrix_world @ Vector(corner) for o in meshes for corner in o.bound_box]
low = Vector(tuple(min(v[i] for v in corners) for i in range(3)))
high = Vector(tuple(max(v[i] for v in corners) for i in range(3)))
scale = 1.8 / (high.z - low.z)
root = bpy.data.objects.new('Inspection normalization only', None)
scene.collection.objects.link(root)
for obj in imported:
    if obj.parent is None:
        obj.parent = root
root.scale = (scale, scale, scale)
root.location = (-(low.x + high.x) / 2 * scale, -(low.y + high.y) / 2 * scale, -low.z * scale)

report = {
    'input': str(Path(args.input).resolve()),
    'originalBounds': {'min': list(low), 'max': list(high)},
    'normalizationForPreviewOnly': {'height': 1.8, 'scale': scale},
    'meshes': [{'name': o.name, 'vertices': len(o.data.vertices), 'polygons': len(o.data.polygons), 'uvLayers': len(o.data.uv_layers)} for o in meshes],
    'armatures': [{'name': o.name, 'bones': len(o.data.bones)} for o in imported if o.type == 'ARMATURE'],
    'actions': len(bpy.data.actions),
    'acceptedForProduction': False,
}
(out / 'blender-inspection.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.resolution_x = 600
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
scene.view_settings.view_transform = 'AgX'
world = bpy.data.worlds.new('Neutral studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.82, .82, .82, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .18
scene.world = world

def area(name, location, energy, size):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = 'DISK'
    data.size = size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector((0, 0, 1)) - obj.location).to_track_quat('-Z', 'Y').to_euler()

area('Key', (-3, -4, 5), 240, 3)
area('Fill', (3, -2, 3), 70, 3)
area('Rim', (0, 3, 4), 120, 3)
if args.clay:
    inspection_mat = bpy.data.materials.new('Gray clay for shape inspection only')
    inspection_mat.use_nodes = True
    bsdf = inspection_mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (.28, .28, .28, 1)
    bsdf.inputs['Metallic'].default_value = 0
    bsdf.inputs['Roughness'].default_value = .8
    scene.view_layers[0].material_override = inspection_mat
    report['renderMode'] = 'gray clay override for inspection; source GLB unchanged'
    (out / 'blender-inspection.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.005))
floor = bpy.context.object
floor.name = 'Inspection floor'
mat = bpy.data.materials.new('Warm white floor')
mat.diffuse_color = (.86, .84, .81, 1)
mat.use_nodes = True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.86, .84, .81, 1)
mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 1
floor.data.materials.append(mat)

camera_data = bpy.data.cameras.new('Inspection camera')
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 2.15
camera = bpy.data.objects.new('Inspection camera', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
target = Vector((0, 0, .94))
for name, angle in [('front', 0), ('three-quarter', 45), ('side', 90), ('back', 180), ('left', 270)]:
    rad = math.radians(angle)
    camera.location = (3.8 * math.sin(rad), -3.8 * math.cos(rad), 1.05)
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(out / (name + '.png'))
    print('RENDER ' + name, flush=True)
    bpy.ops.render.render(write_still=True)
print('REVIEW_RENDERS_COMPLETE', flush=True)
