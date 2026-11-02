# [DANCE-SWAP] Preserve original Hunyuan UV/PBR geometry; transfer actual SkinTokens weights.
# QtMeshEditor GLB export changes texture UV/bind transforms, so rebuild binding in Blender.
import os,bpy,json,sys
import numpy as np
from pathlib import Path
from mathutils import Vector,kdtree
name=sys.argv[-1];base=Path(os.environ['WEDDING_AI_WORKDIR']);data=json.loads((base/(name+'-unirig-skeleton.json')).read_text());joints=data['joints']
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(base/(name+'-ai-rigged.glb')))
raw=next(o for o in bpy.context.scene.objects if o.type=='MESH');tree=kdtree.KDTree(len(raw.data.vertices));rawweights=[]
for v in raw.data.vertices:
 tree.insert(raw.matrix_world@v.co,v.index);rawweights.append([(raw.vertex_groups[g.group].name,g.weight) for g in v.groups if g.weight>1e-7])
tree.balance();bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(base/(name+'-ai-textured.glb')));mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH');bpy.context.view_layer.objects.active=mesh;bpy.ops.object.select_all(action='DESELECT');mesh.select_set(True);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
arm=bpy.data.armatures.new('UniRig actual predicted joints');obj=bpy.data.objects.new('AI rig',arm);bpy.context.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj;mesh.select_set(False);obj.select_set(True);bpy.ops.object.mode_set(mode='EDIT');positions=[Vector((j['position'][0],-j['position'][2],j['position'][1])) for j in joints]
for j in joints:
 i=j['index'];b=arm.edit_bones.new('AI_joint_'+str(i));b.head=positions[i];children=[k['index'] for k in joints if k['parent']==i];b.tail=positions[children[0]] if children else positions[i]+Vector((0,0,.035))
 if (b.tail-b.head).length<.001:b.tail=b.head+Vector((0,0,.035))
 if j['parent']>=0:b.parent=arm.edit_bones['AI_joint_'+str(j['parent'])]
bpy.ops.object.mode_set(mode='OBJECT');mesh.parent=obj;mesh.modifiers.new('Actual SkinTokens weights','ARMATURE').object=obj;groups={b.name:mesh.vertex_groups.new(name=b.name) for b in arm.bones};maxdist=0;fallback=0;removedroot=0
for v in mesh.data.vertices:
 _,idx,dist=tree.find(mesh.matrix_world@v.co);maxdist=max(maxdist,dist);weights=[(n,w) for n,w in rawweights[idx] if n in groups];removedroot+=sum(w for n,w in rawweights[idx] if n not in groups);total=sum(w for n,w in weights)
 if total<1e-7:raise ValueError('AI vertex has no predicted-joint weight '+str(v.index))
 for n,w in weights:groups[n].add([v.index],w/total,'REPLACE')
assert maxdist<.0001,maxdist

for pb in obj.pose.bones:pb.custom_shape=None
for ob in list(bpy.data.objects):
 if ob.type=='MESH' and ob!=mesh:bpy.data.objects.remove(ob,do_unlink=True)
mesh.select_set(True);bpy.ops.export_scene.gltf(filepath=str(base/(name+'-ai-ready.glb')),export_format='GLB',use_selection=True,export_animations=False,export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(base/(name+'-ai-ready.blend')))
report={'sourceGeometry':'Hunyuan textured mesh, unchanged','skeleton':'actual UniRig prediction','weights':'actual SkinTokens, nearest source vertex transfer','nearestVertexMaxDistance':maxdist,'discardedNonPredictedRootWeightTotal':removedroot,'vertices':len(mesh.data.vertices),'joints':len(joints),'animations':0}
(base/(name+'-ai-rebuild.json')).write_text(json.dumps(report,indent=2));print('REBUILT',report,flush=True)
