# [DANCE-SWAP] Keep the application's existing bone interface; preserve AI body rig/weights.
# Supplement bride cloth with existing dress/veil helper weights (not AI cloth simulation).
import os,bpy,json,sys,hashlib
from pathlib import Path
from mathutils import kdtree
name=sys.argv[-1];base=Path(os.environ['WEDDING_AI_WORKDIR']);cloth=['skirtFront','skirtBack','skirtL','skirtR','veil'];oldbones={};clothweights=[];tree=None
if name=='bride':
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(base/'rollback/bride-rigged.glb'))
 oldmesh=next(o for o in bpy.context.scene.objects if o.type=='MESH');oldarm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');tree=kdtree.KDTree(len(oldmesh.data.vertices))
 for v in oldmesh.data.vertices:
  tree.insert(oldmesh.matrix_world@v.co,v.index);clothweights.append({oldmesh.vertex_groups[g.group].name:g.weight for g in v.groups if oldmesh.vertex_groups[g.group].name in cloth})
 tree.balance()
 for n in cloth:
  b=oldarm.data.bones[n];oldbones[n]=(oldarm.matrix_world@b.head_local,oldarm.matrix_world@b.tail_local,b.parent.name)
bpy.ops.wm.open_mainfile(filepath=str(base/(name+'-ai-ready.blend')));mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH');arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
mapidx=({0:'pelvis',1:'spine',4:'neck',5:'head',22:'clavicleL',23:'upperArmL',24:'forearmL',25:'handL',6:'clavicleR',7:'upperArmR',8:'forearmR',9:'handR',42:'thighL',43:'shinL',44:'ankleL',38:'thighR',39:'shinR',40:'ankleR'} if name=='groom' else {0:'pelvis',1:'spine',3:'neck',4:'head',9:'clavicleL',10:'upperArmL',11:'forearmL',12:'handL',5:'clavicleR',6:'upperArmR',7:'forearmR',8:'handR',16:'thighL',17:'shinL',18:'ankleL',13:'thighR',14:'shinR',15:'ankleR'})
for idx,n in mapidx.items():arm.data.bones['AI_joint_'+str(idx)].name=n
# Blender propagates bone renaming to matching vertex groups.
clothvertices=0;maxdist=0
if name=='bride':
 bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT')
 for n,(head,tail,parent) in oldbones.items():
  b=arm.data.edit_bones.new(n);b.head=head;b.tail=tail;b.parent=arm.data.edit_bones[parent]
 bpy.ops.object.mode_set(mode='OBJECT')
 for n in cloth:mesh.vertex_groups.new(name=n)
 for v in mesh.data.vertices:
  _,idx,dist=tree.find(mesh.matrix_world@v.co);maxdist=max(maxdist,dist);cw=clothweights[idx];total=sum(cw.values())
  if total<1e-6:continue
  clothvertices+=1;weights={mesh.vertex_groups[g.group].name:g.weight*(1-total) for g in v.groups};weights.update(cw);weights=sorted(weights.items(),key=lambda x:x[1],reverse=True)[:4];s=sum(w for n,w in weights)
  for g in list(v.groups):mesh.vertex_groups[g.group].remove([v.index])
  for n,w in weights:
   if w>1e-7:mesh.vertex_groups[n].add([v.index],w/s,'REPLACE')
 assert maxdist<.0001,maxdist
source=Path(os.environ['WEDDING_AI_SOURCE_DIR'])/('bride.glb' if name=='bride' else 'gloom.glb');mesh.name=name+'-source-surface';mesh['source_sha256']=hashlib.sha256(source.read_bytes()).hexdigest();mesh['danceSwapNote']='// [DANCE-SWAP] Free Hunyuan PBR, UniRig joints, SkinTokens body; retain cloth helpers.';mesh['rig_method']='UniRig skeleton + SkinTokens body weights; existing cloth helpers retained';mesh['texture_method']='Hunyuan3D-Paint 2.1 PBR'

for pb in arm.pose.bones:pb.custom_shape=None
for ob in list(bpy.data.objects):
 if ob.type=='MESH' and ob!=mesh:bpy.data.objects.remove(ob,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);mesh.select_set(True);bpy.ops.export_scene.gltf(filepath=str(base/(name+'-retarget.glb')),export_format='GLB',use_selection=True,export_animations=False,export_extras=True)
record={'boneMap':{'AI_joint_'+str(k):v for k,v in mapidx.items()},'sideConvention':'Existing actor interface: L = negative model X, R = positive model X','cloth':{'helpers':cloth if name=='bride' else [],'method':'existing cloth controls/weights transferred by source positions; body remains SkinTokens','verticesAdjusted':clothvertices,'nearestDistanceMax':maxdist},'unmatchedBodyBones':[]}
(base/(name+'-bone-map.json')).write_text(json.dumps(record,indent=2));print('RETARGET_INTERFACE_READY',record,flush=True)
