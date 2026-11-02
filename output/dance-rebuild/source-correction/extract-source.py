# [DANCE-SWAP] Single-performer source extraction; use tutorial normal-speed section / full BAD clip.
import argparse,json
import cv2,mediapipe as mp,numpy as np
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--output',required=True);p.add_argument('--model',required=True);p.add_argument('--start',type=float,default=0);p.add_argument('--frames',type=int,required=True);p.add_argument('--crop',type=int,nargs=4);a=p.parse_args();cap=cv2.VideoCapture(a.input);fps=cap.get(cv2.CAP_PROP_FPS);cap.set(cv2.CAP_PROP_POS_FRAMES,round(a.start*fps));frames=[]
options=vision.PoseLandmarkerOptions(base_options=python.BaseOptions(model_asset_path=a.model),running_mode=vision.RunningMode.VIDEO,num_poses=1,min_pose_detection_confidence=.35,min_pose_presence_confidence=.35,min_tracking_confidence=.4)
with vision.PoseLandmarker.create_from_options(options) as detector:
 for i in range(a.frames):
  ok,bgr=cap.read()
  if not ok:break
  if a.crop:
   x,y,w,h=a.crop;bgr=bgr[y:y+h,x:x+w]
  rgb=np.ascontiguousarray(cv2.cvtColor(bgr,cv2.COLOR_BGR2RGB));r=detector.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,data=rgb),round(i*1000/fps))
  frames.append({'image':[[p.x,p.y,p.z,p.visibility] for p in r.pose_landmarks[0]],'world':[[p.x,-p.y,-p.z,p.visibility] for p in r.pose_world_landmarks[0]]} if r.pose_landmarks else None)
with open(a.output,'w') as f:json.dump(frames,f)
