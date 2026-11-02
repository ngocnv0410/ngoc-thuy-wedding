"""Create an untextured UV draft; preserve source and measure surface deviation."""
import json
from pathlib import Path
import random

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

base=Path('D:/IdeaProjects/ngoc-thuy-wedding/output/dance-rebuild/bride-provided')
source=base/'bride-original.glb'
out=base/'geometry-draft'
out.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=mesh
mesh.select_set(True)
mesh.data.calc_loop_triangles()
initial=len(mesh.data.loop_triangles)
original_positions=[v.co.copy() for v in mesh.data.vertices]
print('DECIMATE_START',initial,flush=True)
decimate=mesh.modifiers.new('Technical draft 48000 triangles','DECIMATE')
decimate.ratio=48000/initial
decimate.use_collapse_triangulate=True
bpy.ops.object.modifier_apply(modifier=decimate.name)
for polygon in mesh.data.polygons:
    polygon.use_smooth=True
mesh.data.update()
mesh.data.calc_loop_triangles()
triangles=len(mesh.data.loop_triangles)
print('DECIMATE_COMPLETE',triangles,flush=True)
tree=BVHTree.FromPolygons([v.co for v in mesh.data.vertices],[tuple(t.vertices) for t in mesh.data.loop_triangles],all_triangles=True)
sample_count=min(20000,len(original_positions))
sample=random.Random(0).sample(original_positions,sample_count)
distances=sorted(tree.find_nearest(point)[3] for point in sample)
span=max(v.y for v in original_positions)-min(v.y for v in original_positions)
if span<=0:span=max(max(v[i] for v in original_positions)-min(v[i] for v in original_positions) for i in range(3))
del original_positions,tree
print('UV_START',flush=True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.1519173,island_margin=.004)
bpy.ops.object.mode_set(mode='OBJECT')
print('UV_COMPLETE',flush=True)
target=out/'bride-48000-uv-untextured.glb'
bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,export_animations=False)
report={
 'source':str(source),'output':str(target),'status':'technical geometry draft; not accepted for design or rigging',
 'originalTrianglesAfterImport':initial,'draftTriangles':triangles,'vertices':len(mesh.data.vertices),'uvLayers':len(mesh.data.uv_layers),'bytes':target.stat().st_size,
 'surfaceCheck':{'method':'20000 deterministic sampled source vertices to nearest reduced surface; object coordinates; not a full Hausdorff bound','samples':sample_count,'mean':sum(distances)/len(distances),'p95':distances[int(.95*(len(distances)-1))],'maxSampled':distances[-1],'normalizationSpan':span},
 'textureAdded':False,'skinAdded':False,'sourceChanged':False,'designAcceptance':False,'smoothNormals':True,
}
(out/'preparation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report),flush=True)
