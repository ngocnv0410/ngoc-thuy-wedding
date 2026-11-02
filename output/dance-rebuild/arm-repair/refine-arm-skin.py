# [DANCE-SWAP] Correct arm pivots and isolate torso/head from arm skin; keep source geometry/UV/PBR.
import argparse,sys,json,math
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector
parser=argparse.ArgumentParser();parser.add_argument('--subject',choices=['groom','bride'],required=True);parser.add_argument('--input',required=True);parser.add_argument('--output',required=True)
a=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);bride=a.subject=='bride'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(Path(a.input).resolve()))
mesh=next(o for o in bpy.context.scene.objects if o.type=='MESH' and 'source-surface' in o.name);arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');bpy.context.view_layer.objects.active=arm
# [DANCE-SWAP] Calibrated to sleeve cap, elbow and cuff/palm on this unchanged source mesh (Blender Z-up).
S=np.array([.155,-.055,.85]) if bride else np.array([.178,-.042,.765]);E=np.array([.245,-.057,.705]) if bride else np.array([.25,-.035,.62]);W=np.array([.326,-.067,.604]) if bride else np.array([.334,-.052,.512]);H=np.array([.367,-.073,.535]) if bride else np.array([.365,-.055,.46])
bpy.ops.object.mode_set(mode='EDIT')
for side,sign in [('L',-1),('R',1)]:
 points=[Vector((v[0]*sign,v[1],v[2])) for v in [S,E,W,H]]
 for name,p,q in [('upperArm',points[0],points[1]),('forearm',points[1],points[2]),('hand',points[2],points[3])]:
  b=arm.data.edit_bones[name+side];b.use_connect=False;b.head=p;b.tail=q
 arm.data.edit_bones['clavicle'+side].tail=points[0]
bpy.ops.object.mode_set(mode='OBJECT')
names=[g.name for g in mesh.vertex_groups];indices={n:i for i,n in enumerate(names)};positions=np.array([tuple(mesh.matrix_world@v.co) for v in mesh.data.vertices]);weights=np.zeros((len(positions),len(names)))
for v in mesh.data.vertices:
 for g in v.groups:weights[v.index,g.group]=g.weight
family={}
for side in ['L','R']:
 root=arm.data.bones['upperArm'+side];family[side]=set([root.name]+[b.name for b in root.children_recursive]+['clavicle'+side])
armnames=family['L']|family['R'];cloth={'veil','skirtFront','skirtBack','skirtL','skirtR'}
# [DANCE-SWAP] Skin-color evidence distinguishes bride's bare arms from the overlapping white gown/veil.
skin=np.zeros(len(positions));seen=np.zeros(len(positions))
if bride:
 mat=mesh.data.materials[0];shader=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED');image=shader.inputs['Base Color'].links[0].from_node.image
 pixels=np.array(image.pixels[:]).reshape(image.size[1],image.size[0],4);uv=mesh.data.uv_layers.active
 for loop in mesh.data.loops:
  u,v=uv.data[loop.index].uv;rgb=pixels[min(int(v*image.size[1]),image.size[1]-1)%image.size[1],min(int(u*image.size[0]),image.size[0]-1)%image.size[0],:3];r,g,b=rgb;confidence=np.clip((r-g-.035)/.085,0,1)*np.clip((g-b+.015)/.06,0,1);skin[loop.vertex_index]+=confidence;seen[loop.vertex_index]+=1
 skin/=np.maximum(seen,1)
# [DANCE-SWAP] UV seams share a physical vertex: material sampling cannot split their skin classification.
weld={}
for i,p in enumerate(positions):weld.setdefault(tuple(np.round(p,5)),[]).append(i)
for ids in weld.values():skin[ids]=skin[ids].max()
def smooth(lo,hi,v):
 t=np.clip((v-lo)/(hi-lo),0,1);return t*t*(3-2*t)
def segment(p,x,y):
 d=y-x;t=np.clip(np.dot(p-x,d)/np.dot(d,d),0,1);return np.linalg.norm(p-x-t*d)
changed=0;headlocked=0;armmask=np.zeros(len(positions));new=weights.copy()
for i,p in enumerate(positions):
 x,y,z=p;old=weights[i];oldcloth=sum(old[indices[n]] for n in cloth if n in indices)
 # [DANCE-SWAP] The bodice/jacket center must be completely independent of arm-only motion.
 if abs(x)<(.11 if bride else .135) and .55<z<(.83 if bride else .78):
  keep={n:old[k] for k,n in enumerate(names) if n not in armnames and old[k]>1e-7}
  if not keep:keep={'spine':1.0}
  total=sum(keep.values());new[i]=0
  for n,w in keep.items():new[i,indices[n]]=w/total
  continue
 # [DANCE-SWAP] Lower cheek/chin are part of the head too; the previous top-only audit missed them.
 if z>(.935 if bride else .85) and oldcloth<.05:
  new[i]=0;new[i,indices['head']]=1;headlocked+=1;continue
 if not (.40<z<(.91 if bride else .835)) or abs(x)<.075:continue
 side='L' if x<0 else 'R';sign=-1 if x<0 else 1;pp=p.copy();pp[0]*=sign
 oldarm=sum(old[indices[n]] for n in armnames if n in indices);distance=min(segment(pp,S,E),segment(pp,E,W),segment(pp,W,H))
 if oldarm<.005 and distance>.08:continue
 distal_skin=bride and abs(x)>.23 and y<.025 and distance<.10
 if bride and oldcloth>.8 and skin[i]<.5 and not distal_skin:continue
 lateral=smooth(.105 if bride else .13,.16 if bride else .19,abs(x))
 tube=max(1-smooth(.055 if bride else .065,.085 if bride else .095,distance),smooth(.03,.3,oldarm))
 if distal_skin:tube=1
 gate=lateral*tube
 upperaxis=(E-S)/np.linalg.norm(E-S);loweraxis=(W-E)/np.linalg.norm(W-E)
 elbow=smooth(-.035,.035,np.dot(pp-E,upperaxis));wrist=smooth(-.018,.025,np.dot(pp-W,loweraxis))
 # Keep clothing on the torso and blend the sleeve cap into the clavicle, rather than pulling a chest flap.
 cap=smooth(-.035,.035,np.dot(pp-S,upperaxis));gate*=cap
 body={n:old[k] for k,n in enumerate(names) if n not in armnames and n not in cloth and n!='head' and old[k]>1e-7}
 if not body:body={'clavicle'+side:1.0}
 total=sum(body.values());result={n:w/total*(1-gate) for n,w in body.items()}
 result['upperArm'+side]=gate*(1-elbow);result['forearm'+side]=gate*elbow*(1-wrist)
 handnames=set(b.name for b in arm.data.bones['hand'+side].children_recursive)|{'hand'+side};hw={n:old[indices[n]] for n in handnames if n in indices and old[indices[n]]>1e-7}
 if bride or not hw:hw={'hand'+side:1.0}
 hs=sum(hw.values())
 for n,w in hw.items():result[n]=result.get(n,0)+gate*elbow*wrist*w/hs
 items=sorted(result.items(),key=lambda v:v[1],reverse=True)[:4];den=sum(w for n,w in items);new[i]=0
 for n,w in items:
  if w>1e-7:new[i,indices[n]]=w/den
 changed+=int(np.max(abs(new[i]-old))>.001);armmask[i]=gate
# [DANCE-SWAP] Identical-position UV/normal splits must deform identically or the elbow/palm tears open.
for ids in weld.values():
 row=new[ids].mean(0);keep=np.argsort(row)[-4:];mean=np.zeros(len(names));mean[keep]=row[keep];mean/=mean.sum();new[ids]=mean
for v in mesh.data.vertices:
 for g in list(v.groups):mesh.vertex_groups[g.group].remove([v.index])
 for k in np.flatnonzero(new[v.index]>1e-7):mesh.vertex_groups[int(k)].add([v.index],float(new[v.index,k]),'REPLACE')
# [DANCE-SWAP] Recompute arm normals across duplicated UV vertices; retain face/clothing normals elsewhere.
mesh.data.update();normal=np.array([tuple(n.vector) for n in mesh.data.corner_normals]);acc={}
for poly in mesh.data.polygons:
 for li in poly.loop_indices:
  vi=mesh.data.loops[li].vertex_index;key=tuple(np.round(positions[vi],6));acc[key]=acc.get(key,np.zeros(3))+np.array(poly.normal)*poly.area
for loop in mesh.data.loops:
 vi=loop.vertex_index
 if armmask[vi]>.2:
  n=acc[tuple(np.round(positions[vi],6))];length=np.linalg.norm(n)
  if length>1e-9:normal[loop.index]=n/length
# [DANCE-SWAP] Unpainted black triangles on the bride's palms/elbows are an albedo defect, not a hole.
# Keep both original texture images untouched; give only those defective skin faces a matching PBR swatch.
patched_faces=[]
if bride:
 healthy=[];colors={}
 for poly in mesh.data.polygons:
  if np.mean([armmask[v] for v in poly.vertices])<.65:continue
  us=np.array([tuple(mesh.data.uv_layers.active.data[li].uv) for li in poly.loop_indices]);mid=us.mean(0);samples=[]
  for u,v in [mid,*[mid*.6+x*.4 for x in us]]:
   samples.append(pixels[min(int(v*image.size[1]),image.size[1]-1)%image.size[1],min(int(u*image.size[0]),image.size[0]-1)%image.size[0],:3])
  rgb=np.median(samples,axis=0);colors[poly.index]=rgb
  if rgb[0]>.35 and rgb[0]>rgb[1]*1.1 and rgb[1]>rgb[2]*1.05:healthy.append(rgb)
 if healthy:
  tone=np.median(healthy,axis=0);tone=np.where(tone<=.04045,tone/12.92,((tone+.055)/1.055)**2.4);patch=mesh.data.materials[0].copy();patch.name='Palm skin repair [DANCE-SWAP]';bsdf=next(n for n in patch.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
  for link in list(bsdf.inputs['Base Color'].links):patch.node_tree.links.remove(link)
  bsdf.inputs['Base Color'].default_value=(*tone,1);bsdf.inputs['Metallic'].default_value=0
  for link in list(bsdf.inputs['Metallic'].links):patch.node_tree.links.remove(link)
  mesh.data.materials.append(patch)
  for idx,rgb in colors.items():
   if max(rgb)<.32:mesh.data.polygons[idx].material_index=len(mesh.data.materials)-1;patched_faces.append(idx)
mesh.data.normals_split_custom_set(normal.tolist());mesh['armRepair']='// [DANCE-SWAP] Mesh-calibrated pivots, isolated torso/head weights, continuous arm skin.'
for pb in arm.pose.bones:pb.custom_shape=None
for ob in list(bpy.data.objects):
 if ob.type=='MESH' and ob!=mesh:bpy.data.objects.remove(ob,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);mesh.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(Path(a.output).resolve()),export_format='GLB',use_selection=True,export_animations=False,export_extras=True)
Path(a.output).with_suffix('.repair.json').write_text(json.dumps({'_comment':'// [DANCE-SWAP]','subject':a.subject,'changedArmWeights':changed,'headVerticesLocked':headlocked,'vertexPositionsTopologyUVChanged':False,'armNormalsRefined':True,'brideBlackSkinFacesPatched':len(patched_faces),'originalTextureImagesChanged':False,'armPivotsZUp':{'shoulder':S.tolist(),'elbow':E.tolist(),'wrist':W.tolist()},'maxInfluences':int((new>1e-7).sum(1).max()),'maxWeightSumError':float(abs(new.sum(1)-1).max())},indent=2))
