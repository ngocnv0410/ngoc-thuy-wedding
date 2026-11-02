# [DANCE-SWAP] Offline, symmetric quaternion filtering of the real rig solver, retaining source timing.
import json,sys
from pathlib import Path
import numpy as np
from scipy.ndimage import gaussian_filter1d, median_filter
def slerp(a,b,t):
    dot=np.sum(a*b,axis=-1,keepdims=True)
    b=np.where(dot<0,-b,b); angle=np.arccos(np.clip(np.abs(dot),0,1))
    sine=np.sin(angle)
    value=np.where(sine>1e-7,(np.sin((1-t)*angle)*a+np.sin(t*angle)*b)/np.maximum(sine,1e-9),(1-t)*a+t*b)
    return value/np.maximum(np.linalg.norm(value,axis=-1,keepdims=True),1e-9)

def limit_speed(q):
    # Symmetric adjacent-pair projection caps estimator flips without depending on render FPS.
    limit=np.deg2rad(9)
    for iteration in range(80):
        for parity in [iteration%2,1-iteration%2]:
            ids=np.arange(parity,len(q)-1,2);a=q[ids].copy();b=q[ids+1].copy()
            angles=2*np.arccos(np.clip(np.abs(np.sum(a*b,axis=1)),0,1))
            blend=np.maximum(0,(1-limit/np.maximum(angles,1e-9))/2)[:,None]
            q[ids]=slerp(a,b,blend);q[ids+1]=slerp(b,a,blend)
    # Further diffusion softens changes in angular speed, using only short geodesic arcs.
    for _ in range(8):
        mid=slerp(q[:-2],q[2:],.5);q[1:-1]=slerp(q[1:-1],mid,.30)
    return q

source=Path(sys.argv[1]); repo=Path(sys.argv[2] if len(sys.argv)>2 else '.')
for dance,file in [('bad','badInPlaceMotion'),('bang','bangSourceMotion')]:
    target=repo/'src/components/dance3d'/f'{file}.json'
    clip=json.loads(target.read_text()); tracks={'version':1}
    for sex in ['groom','bride']:
        raw=json.loads((source/f'{dance}-{sex}-raw.json').read_text())
        assert raw['fps']==clip['fps'] and len(raw['frames'])==len(clip['frames']), 'Bake at the clip source FPS before filtering'
        frames=np.array(raw['frames']).reshape(len(raw['frames']),-1,5)
        result=frames.copy()
        rest=np.array(raw['rest']).reshape(-1,5)
        for b,name in enumerate(raw['bones']):
            q=frames[:,b,:4].copy()
            for f in range(1,len(q)):
                if np.dot(q[f],q[f-1])<0:q[f]*=-1
            # Resting loop anchors already exist in the source; signed padding avoids antipodal averages.
            pad=30; before=q[-pad:].copy(); after=q[:pad].copy()
            if np.dot(before[-1],q[0])<0:before*=-1
            if np.dot(after[0],q[-1])<0:after*=-1
            extended=np.concatenate([before,q,after])
            filtered=median_filter(extended,size=(5,1),mode='nearest')
            filtered/=np.maximum(np.linalg.norm(filtered,axis=1,keepdims=True),1e-9)
            sigma=float(sys.argv[3]) if len(sys.argv)>3 else 2.6 if any(s in name.lower() for s in ['arm','hand','clavicle']) else 1.5
            # Sign-invariant quaternion mean avoids cancellation when noisy IK rolls wind around 360 degrees.
            covariance=filtered[:,:,None]*filtered[:,None,:]
            covariance=gaussian_filter1d(covariance,sigma,axis=0,mode='nearest')[pad:-pad]
            _,vectors=np.linalg.eigh(covariance);filtered=vectors[:,:,-1]
            filtered=limit_speed(filtered)
            # Exact still anchors prevent the sampler's closed-loop last-frame guard producing a step.
            end=filtered[-1] if np.dot(filtered[0],filtered[-1])>=0 else -filtered[-1]
            anchor=filtered[0]+end;anchor/=np.linalg.norm(anchor)
            for edge in range(9):
                weight=(1-edge/9)**2
                for f in [edge,len(q)-1-edge]:
                    signed=anchor if np.dot(anchor,filtered[f])>=0 else -anchor
                    filtered[f]=(1-weight)*filtered[f]+weight*signed;filtered[f]/=np.linalg.norm(filtered[f])
            filtered[:3]=anchor;filtered[-3:]=anchor
            result[:,b,:4]=filtered
            s=gaussian_filter1d(frames[:,b,4],1.5,mode='wrap')
            s[:3]=s[-3:]=(s[0]+s[-1])/2
            result[:,b,4]=s
        # Keep dynamic tracks only; all omitted local transforms are reset to rest each sample.
        rotation_error=np.minimum(np.linalg.norm(result[:,:,:4]-rest[None,:,:4],axis=2),np.linalg.norm(result[:,:,:4]+rest[None,:,:4],axis=2))
        dynamic=(np.max(rotation_error,axis=0)>1e-7)|(np.max(np.abs(result[:,:,4]-rest[None,:,4]),axis=0)>1e-7)
        tracks[sex]={'signature':raw['signature'],'bones':[n for n,keep in zip(raw['bones'],dynamic) if keep],
            'scale':100000,'frames':np.rint(result[:,dynamic].reshape(len(result),-1)*100000).astype(int).tolist()}
    clip['retargeted']=tracks
    clip['_comment']=clip.get('_comment','').split(' // [DANCE-SWAP] Chibi compact')[0]+' // [DANCE-SWAP] Chibi compact gestures; symmetric filtered rig curves; original source frames retained.'
    target.write_text(json.dumps(clip,separators=(',',':'))+'\n')
    print(dance,'written',target.stat().st_size)
