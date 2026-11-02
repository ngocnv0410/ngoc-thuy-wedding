"""// [DANCE-SWAP] Render source-colored GLBs' working files at the four reference angles.
blender -b character-working.blend --python scripts/render-wedding-colors.py --
  --subject bride --output-dir output/dance-rebuild/drive-rig/colors
Review cameras are separate from the invitation's unchanged production camera.
"""
import argparse
import math
from pathlib import Path
import sys
import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--subject', choices=['bride', 'groom'], required=True)
parser.add_argument('--output-dir', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
out = Path(args.output_dir).resolve(); out.mkdir(parents=True, exist_ok=True)
bride = args.subject == 'bride'
scene = bpy.context.scene
scene.render.engine = 'CYCLES'; scene.cycles.samples = 16; scene.cycles.use_denoising = False
scene.render.resolution_x = 320; scene.render.resolution_y = 511; scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'; scene.view_settings.look = 'None'; scene.view_settings.exposure = 0; scene.view_settings.gamma = 1
scene.world = bpy.data.worlds.new('White color review background'); scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (1, 1, 1, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = 1
scale = (454 if bride else 469) / 1.6
height = ((478 if bride else 480) - 255.5) / scale
centers = [173, 174, 148, 128] if bride else [183, 168, 132, 132]
data = bpy.data.cameras.new('Four-view review camera'); data.type = 'ORTHO'; data.ortho_scale = 511 / scale
camera = bpy.data.objects.new('Four-view review camera', data); scene.collection.objects.link(camera); scene.camera = camera
for index, (view, degrees) in enumerate([('front', 0), ('quarter', 30), ('side', 90), ('back', 180)]):
    angle = math.radians(degrees)
    target = Vector((0, 0, height)) + Vector((math.cos(angle), math.sin(angle), 0)) * ((160 - centers[index]) / scale)
    camera.location = target + Vector((3 * math.sin(angle), -3 * math.cos(angle), 0))
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(out / (args.subject + '-' + view + '.png'))
    bpy.ops.render.render(write_still=True)
