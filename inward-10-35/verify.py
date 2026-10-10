"""Decode every frame and check delivery integrity / discontinuity candidates."""
from pathlib import Path
import subprocess,json,numpy as np
from PIL import Image,ImageDraw
out=Path(__file__).parent/'output';path=out/'INWARD_10-35.mp4'
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
v=next(s for s in meta['streams'] if s['codec_type']=='video')
a=next(s for s in meta['streams'] if s['codec_type']=='audio')
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-vf','scale=160:90','-pix_fmt','rgb24','-f','rawvideo','-'])
frames=np.frombuffer(raw,dtype=np.uint8).reshape(-1,90,160,3)
mean=frames.mean(axis=(1,2,3));delta=np.abs(np.diff(frames.astype('float32'),axis=0)).mean(axis=(1,2,3))
rank=np.argsort(delta)[-8:][::-1]
report={'duration_seconds':float(meta['format']['duration']),'width':v['width'],'height':v['height'],'fps':v['avg_frame_rate'],'frames_decoded':len(frames),'video_codec':v['codec_name'],'audio_codec':a['codec_name'],'audio_channels':a['channels'],'minimum_mean_luma':float(mean.min()),'median_frame_difference':float(np.median(delta)),'max_frame_difference':float(delta.max()),'largest_motion_changes':[{'time':round((int(i)+1)/30,3),'mean_absolute_difference':round(float(delta[i]),3)} for i in rank]}
assert len(frames)==1200 and (v['width'],v['height'])==(1280,720)
assert abs(report['duration_seconds']-40)<.1
assert mean.min()>3
(out/'verification.json').write_text(json.dumps(report,indent=2))
# Show neighboring frames around the largest change, plus all structure handovers.
times=sorted(set([3.65,7.3,10.95,14.6,18.25,21.9,25.55,29.2,32.85,36.5,round((int(rank[0])+1)/30,2)]))
sheet=Image.new('RGB',(160*5,112*len(times)),(10,13,15));d=ImageDraw.Draw(sheet)
for row,t in enumerate(times):
 for col,dt in enumerate([-.20,-.1,0,.1,.20]):
  idx=min(len(frames)-1,max(0,round((t+dt)*30)));sheet.paste(Image.fromarray(frames[idx]),(160*col,112*row));d.text((160*col+5,112*row+92),f'{idx/30:.2f}s',fill=(190,195,195))
sheet.save(out/'motion_check.jpg');print(json.dumps(report,indent=2))
