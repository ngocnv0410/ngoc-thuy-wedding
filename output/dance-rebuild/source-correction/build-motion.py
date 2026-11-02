# [DANCE-SWAP] Native-time source-video poses, image-plane silhouettes with measured monocular depth.
import json,sys,numpy as np
from pathlib import Path
from scipy.ndimage import gaussian_filter1d
from scipy.spatial.transform import Rotation
base=Path(sys.argv[1]);repo=Path(sys.argv[2])
def unit(v):return v/np.maximum(np.linalg.norm(v,axis=-1,keepdims=True),1e-8)
def basis(x,y):
 x=unit(x);y=unit(y-x*np.sum(x*y,axis=-1,keepdims=True));return Rotation.from_matrix(np.stack([x,y,unit(np.cross(x,y))],axis=-1)).as_quat()
# Reuse only the established angular cleanup/loop closure, not its previous source-time remapping.
def arc(a,b,t,quaternion=False):
 dot=np.clip(np.dot(a,b),-1,1)
 if quaternion and dot<0:b=-b;dot=-dot
 if dot>.9995:return unit(a*(1-t)+b*t)
 if dot<-.9995:
  ortho=np.zeros_like(a);ortho[np.argmin(np.abs(a))]=1;ortho=unit(ortho-a*np.dot(a,ortho))
  return a*np.cos(np.pi*t)+ortho*np.sin(np.pi*t)
 angle=np.arccos(dot)
 return (a*np.sin((1-t)*angle)+b*np.sin(t*angle))/np.sin(angle)
def cap(frames,limits):
 for j,(off,size) in enumerate([(1,4),(5,4),(9,4)]+[(13+i*3,3) for i in range(8)]):
  for indices in [range(1,len(frames)),range(len(frames)-2,-1,-1)]:
   for i in indices:
    prev=i-1 if indices.step==1 else i+1
    a,b=frames[prev,off:off+size],frames[i,off:off+size]
    dot=abs(np.dot(a,b)) if size==4 else np.dot(a,b)
    angle=np.arccos(np.clip(dot,-1,1))*(2 if size==4 else 1)
    limit=np.deg2rad(limits[j])
    if angle>limit:frames[i,off:off+size]=arc(a,b,limit/angle,size==4)
limits=[8,10,12,18,22,18,22,12,12,12,12]
# [DANCE-SWAP] Root X=0; rig has no root-Z channel. Keep existing fixed lengths/sole grounding.
# Blend only the first/last .6 s to a shared boundary pose. Three held samples at each
# end also make the existing clamped cubic sampler meet exactly with zero velocity.
def close_loop(frames):
 frames[:,0]=0
 for off,size in [(1,4),(5,4),(9,4)]+[(13+i*3,3) for i in range(8)]:
  first=unit(frames[18,off:off+size]);last=unit(frames[-19,off:off+size]);seam=arc(last,first,.5,size==4)
  for i in range(19):
   t=np.clip((i-2)/16,0,1);t=t*t*(3-2*t)
   frames[i,off:off+size]=arc(seam,first,t,size==4);frames[-1-i,off:off+size]=arc(seam,last,t,size==4)
 return np.rint(frames*1000).astype(int).tolist()

scope={'cap':cap,'close_loop':close_loop}
for name,filename,duration,dimensions in [('bang','bangSourceMotion',28.444444,(576,674)),('bad','badInPlaceMotion',27.4,(720,1280))]:
 raw=json.loads((base/(name+'-landmarks.json')).read_text())[:854 if name=='bang' else 822];good=np.array([i for i,p in enumerate(raw) if p is not None]);template=raw[int(good[0])];world=np.zeros((len(raw),33,4));image=np.zeros_like(world)
 for i in range(len(raw)):
  if raw[i]:world[i]=raw[i]['world'];image[i]=raw[i]['image']
 missing=[]
 for j in range(33):
  valid=np.flatnonzero((world[:,j,3]>(.45 if name=='bang' else .15))&np.isin(np.arange(len(raw)),good))
  if len(valid)<2:valid=good
  missing.append(int(len(raw)-len(valid)))
  for k in range(3):
   world[:,j,k]=np.interp(np.arange(len(raw)),valid,world[valid,j,k]);image[:,j,k]=np.interp(np.arange(len(raw)),valid,image[valid,j,k])
 w=gaussian_filter1d(world[:,:,:3],.65,axis=0);im=gaussian_filter1d(image[:,:,:3],.65,axis=0);hip=(w[:,23]+w[:,24])/2;sh=(w[:,11]+w[:,12])/2
 q=[basis(w[:,23]-w[:,24],np.tile([0.,1.,0.],(len(w),1))),basis(w[:,11]-w[:,12],sh-hip),basis(w[:,7]-w[:,8],(w[:,7]+w[:,8])/2-sh)]
 # [DANCE-SWAP] Video-appropriate anatomical limits reject monocular axis flips, not beat changes.
 for index,track in enumerate(q):
  e=Rotation.from_quat(track).as_euler('YXZ');e[:,0]=np.clip(e[:,0],-(.8 if name=='bang' else 1.5),(.8 if name=='bang' else 1.5));e[:,1]=np.clip(e[:,1],-.55,.55);e[:,2]=np.clip(e[:,2],-.6,.6);q[index]=Rotation.from_euler('YXZ',e).as_quat()
 for track in q:
  for i in range(1,len(track)):
   if np.dot(track[i-1],track[i])<0:track[i]*=-1
 frames=np.zeros((len(raw),37))
 for offset,track in zip([1,5,9],q):frames[:,offset:offset+4]=track
 for i,(a,b) in enumerate([(12,14),(14,16),(11,13),(13,15),(24,26),(26,28),(23,25),(25,27)]):
  xy=np.c_[(im[:,b,0]-im[:,a,0])*dimensions[0],-(im[:,b,1]-im[:,a,1])*dimensions[1]];xy=unit(xy);depth=np.clip(unit(w[:,b]-w[:,a])[:,2],-.8,.8);frames[:,13+i*3:16+i*3]=np.c_[xy*np.sqrt(1-depth**2)[:,None],depth]
 scope['cap'](frames,[8,10,12,24,28,24,28,15,15,15,15]);data={'_comment':'// [DANCE-SWAP] User assignment: videos 1/2 BANG, video 3 BAD. Video 1 audio reference; video 2 normal-speed pose source, 43.8s offset.','boneMap':{'1:5':'pelvis','5:9':'spine','9:13':'head',**{f'{13+i*3}:{16+i*3}':n for i,n in enumerate(['upperArmL','forearmL','upperArmR','forearmR','thighL','shinL','thighR','shinR'])}},'rotationLimitsDegrees':[8,10,12,24,28,24,28,15,15,15,15],'fps':30,'duration':duration,'scale':1000,'source':'User video 2 normal-speed single performer, crop y350:1024, native timing aligned against video 1 audio' if name=='bang' else 'User video 3 BAD–ATEEZ, full frame, native timestamps','sourceOffset':43.8 if name=='bang' else 0,'sourceTimeScale':1,'playbackRate':1,'loopBlendSeconds':.6,'visibilityThreshold':.45 if name=='bang' else .15,'missingSourceFrames':len(raw)-len(good),'lowVisibilityOrMissingByLandmark':missing,'frames':scope['close_loop'](frames)}
 if name=='bang':data['bpm']=135
 (repo/'src/components/dance3d'/ (filename+'.json')).write_text(json.dumps(data,separators=(',',':'))+'\n')
 print(name,'frames',len(raw),'missing',data['missingSourceFrames'])
