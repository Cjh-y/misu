"""INWARD / 10^0 -> 10^-35. Deterministic nested-space procedural film.
No image assets. OpenGL geometry, depth, particles, postprocess, synthesized audio.
"""
from pathlib import Path
import numpy as np, moderngl as gl, math, argparse, subprocess, time
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).parent; OUT=ROOT/'output'; OUT.mkdir(exist_ok=True)
RNG=np.random.default_rng(1035)
BASE=.115; PERIOD=3.65; DURATION=40.; FPS=30
PALETTE=np.array([[.56,.29,.16],[.58,.34,.20],[.50,.37,.25],[.38,.46,.41],[.38,.49,.49],[.42,.51,.54],[.49,.57,.60],[.62,.48,.31],[.52,.55,.53],[.35,.49,.52],[.37,.44,.48],[.45,.47,.49],[.42,.46,.49]])
class Mesh:
 def __init__(self): self.v=[]
 def add(self,p,n,c,kind=0):
  p=np.asarray(p).reshape(-1,3); n=np.asarray(n).reshape(-1,3)
  col=np.broadcast_to(c,p.shape)
  self.v.append(np.concatenate([p,n,col,np.full((len(p),1),kind)],axis=1).astype('f4'))
 def grid(self,p,c,kind=0):
  dy,dx=np.gradient(p,axis=(0,1)); n=np.cross(dx,dy); n/=np.maximum(np.linalg.norm(n,axis=-1,keepdims=True),1e-8)
  a=np.arange(p.shape[0]*p.shape[1]).reshape(p.shape[:2]); ix=np.stack([a[:-1,:-1],a[:-1,1:],a[1:,1:],a[:-1,:-1],a[1:,1:],a[1:,:-1]],axis=-1).reshape(-1)
  self.add(p.reshape(-1,3)[ix],n.reshape(-1,3)[ix],c,kind)
 def tube(self,path,r,c,kind=0,sides=6):
  p=np.asarray(path); t=np.gradient(p,axis=0); t/=np.maximum(np.linalg.norm(t,axis=1,keepdims=True),1e-8)
  ref=np.tile([0.,0.,1.],(len(p),1)); ref[np.abs(t[:,2])>.9]=[0.,1.,0.]
  n=np.cross(t,ref); n/=np.linalg.norm(n,axis=1,keepdims=True); b=np.cross(t,n)
  theta=np.linspace(0,2*np.pi,sides+1); rad=np.broadcast_to(r,(len(p),))
  surf=p[:,None,:]+rad[:,None,None]*(n[:,None,:]*np.cos(theta)[None,:,None]+b[:,None,:]*np.sin(theta)[None,:,None])
  self.grid(surf,c,kind)
 def sphere(self,center,r,c,kind=0,res=12,stretch=(1,1,1),ripple=0):
  a=np.linspace(.001,np.pi-.001,res); b=np.linspace(0,2*np.pi,res*2+1); u,v=np.meshgrid(a,b,indexing='ij')
  rr=r*(1+ripple*np.sin(v*7+u*4)*np.sin(u*9))
  p=np.stack([rr*np.sin(u)*np.cos(v),rr*np.sin(u)*np.sin(v),rr*np.cos(u)],-1)*stretch+center
  self.grid(p,c,kind)
 def array(self): return np.concatenate(self.v) if self.v else np.zeros((0,10),'f4')

def path_ring(rad,z,phase=0,n=130,irreg=.1):
 a=np.linspace(0,2*np.pi,n); r=rad*(1+irreg*np.sin(a*5+phase)+irreg*.5*np.cos(a*9-phase))
 return np.stack([r*np.cos(a),r*np.sin(a),z+.08*np.sin(a*3+phase)],axis=-1)

def make_layer(k):
 rng=np.random.default_rng(500+k); m=Mesh(); col=PALETTE[min(k,12)]; particles=[]
 # The surface becomes a cellular membrane; the same aperture is inherited below.
 if k<=2:
  a=np.linspace(0,2*np.pi,340); rr=np.geomspace(.18,8,105); r,t=np.meshgrid(rr,a,indexing='ij')
  warp=1+.095*np.sin(7*t+np.log(r)*1.2)+.04*np.sin(t*19-r*3)
  x=r*warp*np.cos(t); y=r*warp*np.sin(t)
  z=.05+.10*np.sin(x*3+y*1.7)*np.cos(y*3.9-x)+.008*np.sin(x*16+y*11)*np.sin(y*17)+.16*np.exp(-r*3)
  if k==2: z+=.09*np.cos(x*9+np.sin(y*8))*np.sin(y*7)
  m.grid(np.stack([x,y,z],-1),col,0)
  # Fine radial connective fibers and ridged pore lip, physically raised.
  for j in range(110 if k<2 else 65):
   ang=j*2*np.pi/(110 if k<2 else 65); radii=np.geomspace(.20,5,90)
   aa=ang+.035*np.sin(np.log(radii)*3+j)
   xx=radii*np.cos(aa); yy=radii*np.sin(aa)
   zz=.05+.1*np.sin(xx*3+yy*1.7)*np.cos(yy*3.9-xx)+.008*np.sin(xx*16+yy*11)*np.sin(yy*17)+.16*np.exp(-radii*3)+.016
   m.tube(np.stack([xx,yy,zz],-1),.004+(.003 if k==1 else 0),col*1.12,0,5)
  m.tube(path_ring(.19,.17,k,170,.04),.012,col*1.15,0,8)
 if k in [2,3]:
  # Cell membranes: rounded bodies, nuclei and connected polygonal walls.
  for j in range(95):
   a=rng.uniform(0,6.283); r=rng.uniform(.37,3.8); p=np.array([r*np.cos(a),r*np.sin(a),rng.uniform(-.45,.40)])
   sz=rng.uniform(.09,.28)
   m.sphere(p,sz,col*rng.uniform(.7,1.12),1,res=13,stretch=(1,1,.6),ripple=.035)
   m.sphere(p+[0,0,sz*.5],sz*.30,col*.58,1,res=9,stretch=(1,1,.45))
   for q in range(2):
    ring=path_ring(sz*(.80+q*.2),0,j+q,70,.055)*np.array([1,1,.15])+p+[0,0,sz*.35]
    m.tube(ring,.009,col*1.35,1,5)
  # Shared membrane surrounding the deeper molecular aperture.
  for j in range(8):
   path=path_ring(.20+j*.032,-.09+j*.025,j*.23,150,.11)
   m.tube(path,.011,col*(1+j*.025),1,7)
 if k in [3,4,5]:
  # Double helices have true paired strands and transverse base-pair bridges.
  count=8 if k==4 else 4
  for j in range(count):
   ang=j*6.283/count+.7; r=.62 if j<4 else 1.65
   center=np.array([r*np.cos(ang),r*np.sin(ang),0])
   zz=np.linspace(-1.9,2.0,220); theta=zz*6.5+j*1.4
   strands=[]
   for side in range(2):
    p=np.stack([.19*np.cos(theta+side*np.pi),.19*np.sin(theta+side*np.pi),zz],-1)+center
    p[:,0]+=.11*np.sin(zz*1.3+j); p[:,1]+=.10*np.cos(zz*1.1+j)
    strands.append(p); m.tube(p,.019,col*(1.12 if side==0 else .8),2,7)
   for q in range(5,215,7):
    line=np.linspace(strands[0][q],strands[1][q],5); m.tube(line,.010,col*.8,2,5)
    if k>=4:
     for p in [strands[0][q],strands[1][q]]: m.sphere(p,.032,col*1.25,2,res=6)
 if k in [5,6]:
  # Correlated molecular rings, never random graph edges.
  for j in range(32):
   a=rng.uniform(0,6.283); rr=rng.uniform(.37,3.0); center=np.array([rr*np.cos(a),rr*np.sin(a),rng.uniform(-1,1)])
   phi=rng.uniform(0,6.283); rad=rng.uniform(.10,.23); pts=[]
   for q in range(6):
    th=phi+q*np.pi/3; pts.append(center+[rad*np.cos(th),rad*np.sin(th),.08*np.sin(th*2+phi)])
   for q in range(6):
    m.sphere(pts[q],.032 if k==5 else .047,col*(.75+q*.065),2,res=8)
    m.tube(np.linspace(pts[q],pts[(q+1)%6],4),.009,col*.75,2,6)
 if k in [6,7]:
  # Probability clouds: a volumetric distribution, not drawn planetary orbits.
  for j in range(9500):
   v=rng.normal(size=3); v/=np.linalg.norm(v); radius=np.clip(rng.normal(.87,.18),.30,1.7)
   v*=radius; v[2]*=1.05
   particles.append([*v,*col,rng.uniform(.4,1.2),rng.uniform(0,6.283)])
  for j in range(48 if k==7 else 22):
   v=rng.normal(size=3); v/=np.linalg.norm(v); v*=rng.uniform(.23,.65)
   # Keep the falling path open through a real interstitial gap.
   if np.linalg.norm(v[:2])<.17: v[0]+=.24
   m.sphere(v,rng.uniform(.065,.13),col*(.7+rng.random()*.5),3,res=15,ripple=.022)
 if k>=8:
  # Particle trajectories continuously deform into correlated space-time sheets.
  for j in range(40 if k<10 else 65):
   phase=j*2.39996; z=np.linspace(-4,3,220); radius=.26+(j%13)*.12
   aa=phase+z*(.25+.025*j)+.15*np.sin(z*1.6+phase)
   rad=radius*(1+.18*np.sin(z*2+phase)+.08*np.cos(z*4.1-phase))
   p=np.stack([rad*np.cos(aa),rad*np.sin(aa),z],-1)
   m.tube(p,.0025+(j%3)*.0018,col*(.6+(j%7)*.12),4,5)
   if k==8:
    for idx in range(j%20+20,200,43): m.sphere(p[idx],.020,col*1.6,4,res=7)
  if k>=9:
   for j in range(12):
    z=np.linspace(-3,3,130); a=np.linspace(0,1,13); zz,aa=np.meshgrid(z,a,indexing='ij'); phase=j*2.39996
    angle=phase+zz*.42+aa*.28+.09*np.sin(zz*2.7+j)
    rad=.30+(j%6)*.24+.10*np.sin(zz*1.4+j)+aa*.12
    p=np.stack([rad*np.cos(angle),rad*np.sin(angle),zz],-1)
    m.grid(p,col*(.65+(j%4)*.10),5)
 # Correlated dust exists throughout the entire space, anchoring depth continuity.
 for j in range(1100 if k<8 else 2500):
  p=rng.uniform([-3,-3,-2.5],[3,3,2.5]);
  if np.linalg.norm(p[:2])<.13: continue
  particles.append([*p,*(col*.8+.12),rng.uniform(.3,1.4),rng.uniform(0,6.283)])
 return m.array(),np.array(particles,dtype='f4')

VERT='''#version 330
in vec3 in_pos; in vec3 in_normal; in vec3 in_color; in float in_kind;
uniform float scale; uniform float clock; uniform mat4 view; uniform mat4 projection;
out vec3 N; out vec3 P; out vec3 C; out vec3 local; out float kind;
void main(){
 vec3 p=in_pos; float amp=in_kind<1.5?0.004:0.002;
 p+=in_normal*amp*sin(p.x*9.0+p.y*8.0+p.z*6.0+clock*.5);
 vec4 vp=view*vec4(p*scale,1.0); P=vp.xyz; N=mat3(view)*in_normal; C=in_color; local=p;kind=in_kind;
 gl_Position=projection*vp;
}'''
FRAG='''#version 330
in vec3 N; in vec3 P; in vec3 C; in vec3 local; in float kind;
out vec4 frag;
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return .55*noise(p)+.25*noise(p*2.03)+.13*noise(p*4.07)+.07*noise(p*8.11);}
void main(){
 vec3 n=normalize(N); if(!gl_FrontFacing)n=-n;
 vec3 v=normalize(-P); vec3 light=normalize(vec3(-.65,.8,1.0));
 float diff=max(dot(n,light),0.); float rim=pow(1.-abs(dot(n,v)),3.);
 float spec=pow(max(dot(n,normalize(light+v)),0.),kind<2.?26.:65.);
 float tex=fbm(local*39.);
 float grain=hash(floor(local*280.));
 float texture=mix(.94,1.02,grain)*(.72+.48*tex);
 vec3 warm=vec3(1.0,.77,.51); vec3 cool=vec3(.43,.66,.77);
 vec3 color=C*texture*(.12+diff*.78)+warm*spec*.50+cool*rim*.28;
 if(kind>3.5)color+=C*(.20+rim*.65);
 if(kind>4.5)color=color*.6+cool*rim*.18;
 float fog=exp(-length(P)*.13); color=mix(vec3(.012,.021,.026),color,fog);
 frag=vec4(color,1.);
}'''
PVERT='''#version 330
in vec3 in_pos; in vec3 in_color; in float in_size; in float in_phase;
uniform float scale;uniform float clock;uniform mat4 view;uniform mat4 projection;uniform float height;
out vec3 C;out float alpha;
void main(){
 vec3 p=in_pos; p+=.008*vec3(sin(clock*.3+in_phase),cos(clock*.2+in_phase),0);
 vec4 pos=view*vec4(p*scale,1.); gl_Position=projection*pos;
 float sz=height*.0028*scale/max(.01,-pos.z)*in_size;
 gl_PointSize=clamp(sz,1.,26.); C=in_color;
 alpha=.30*exp(-length(pos.xyz)*.16)*min(1.,sz*.8);
}'''
PFRAG='''#version 330
in vec3 C;in float alpha;out vec4 frag;
void main(){float d=length(gl_PointCoord-.5)*2.;float a=exp(-d*d*5.)*smoothstep(1.,.65,d);frag=vec4(C*a*alpha,a*alpha);}'''
QUAD='''#version 330
in vec2 pos;out vec2 uv;void main(){uv=pos*.5+.5;gl_Position=vec4(pos,0,1);}'''
POST='''#version 330
uniform sampler2D scene;uniform sampler2D depth;uniform sampler2D labels;uniform vec2 resolution;uniform float clock;
in vec2 uv;out vec4 frag;
float rand(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
 vec2 px=1./resolution; vec2 q=uv-.5;
 vec3 c=texture(scene,uv).rgb;
 float d=texture(depth,uv).r;float z=2.*.015*70./(70.+.015-(2.*d-1.)*(70.-.015));
 float blur=clamp(abs(z-.85)/max(z,.03)*2.1,0.,11.);
 vec3 glow=vec3(0.);vec3 soft=vec3(0.);
 for(int i=0;i<12;i++){
 float a=float(i)*2.39996;vec2 off=vec2(cos(a),sin(a));
 vec3 s=texture(scene,uv+off*px*(3.+float(i)*1.3)).rgb;
 glow+=max(s-.38,0.);soft+=texture(scene,uv+off*px*max(1.,blur)).rgb;
 }
 float peripheral=smoothstep(.24,.68,length(q*vec2(1.4,1.)));
 c=mix(c,soft/12.,clamp(blur*.14+peripheral*.15,0.,.92))+glow/12.*.28;
 float haze=exp(-length(q-vec2(-.05,.07))*3.5);
 c+=vec3(.022,.035,.040)*haze*(.3+smoothstep(.1,1.,z)*.7);
 float vig=1.-.55*pow(length(q*vec2(1.05,1.)),1.6);c*=vig;
 c=vec3(1.)-exp(-c*1.65); c=pow(c,vec3(.91));
 c+=(rand(gl_FragCoord.xy+clock*vec2(137.,59.))-.5)*.012;
 vec4 text=texture(labels,uv); c=mix(c,text.rgb,text.a);
 frag=vec4(clamp(c,0.,1.),1.);
}'''

def look_at(eye,target,roll):
 f=target-eye; f/=np.linalg.norm(f); up=np.array([np.sin(roll),np.cos(roll),0.]); s=np.cross(f,up);s/=np.linalg.norm(s);u=np.cross(s,f)
 mat=np.eye(4);mat[:3,:3]=[s,u,-f];mat[:3,3]=-mat[:3,:3]@eye;return mat.astype('f4')
def projection(aspect):
 f=1/np.tan(np.radians(47)/2); near=.015;far=70.;return np.array([[f/aspect,0,0,0],[0,f,0,0],[0,0,(far+near)/(near-far),2*far*near/(near-far)],[0,0,-1,0]],dtype='f4')

class Renderer:
 def __init__(self,w,h):
  self.w=w;self.h=h;self.ctx=gl.create_standalone_context(backend='egl');c=self.ctx
  self.prog=c.program(vertex_shader=VERT,fragment_shader=FRAG);self.pp=c.program(vertex_shader=PVERT,fragment_shader=PFRAG)
  self.meshes=[];self.particles=[]
  for k in range(14):
   m,p=make_layer(k); vbo=c.buffer(m.tobytes());pbo=c.buffer(p.tobytes());
   self.meshes.append(c.vertex_array(self.prog,[(vbo,'3f 3f 3f 1f','in_pos','in_normal','in_color','in_kind')]))
   self.particles.append(c.vertex_array(self.pp,[(pbo,'3f 3f 1f 1f','in_pos','in_color','in_size','in_phase')]))
  self.color=c.texture((w,h),4,dtype='f2');self.dep=c.depth_texture((w,h));self.fbo=c.framebuffer(self.color,self.dep)
  self.target=c.texture((w,h),3);self.final=c.framebuffer(self.target);self.text=c.texture((w,h),4)
  self.post=c.program(vertex_shader=QUAD,fragment_shader=POST)
  self.quad=c.vertex_array(self.post,[(c.buffer(np.array([-1,-1,1,-1,-1,1,1,1],dtype='f4').tobytes()),'2f','pos')])
  self.post['scene']=0;self.post['labels']=2;self.post['resolution']=(w,h)
  self.color.filter=(gl.LINEAR,gl.LINEAR)
  self.dep.compare_func='';self.post['depth']=1
  self.font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
 def label(self,t):
  im=Image.new('RGBA',(self.w,self.h));d=ImageDraw.Draw(im)
  for start,exponent in [(0.1,'0'),(10.5,'−6'),(17.7,'−10'),(24.8,'−15'),(37.0,'−35')]:
   age=t-start
   if 0<age<2.65:
    opacity=min(1,age/.65,(2.65-age)/.75)*185
    fs=int(self.h*.026);f=ImageFont.truetype(self.font,fs);sup=ImageFont.truetype(self.font,int(fs*.63))
    x=int(self.w*.073);y=int(self.h*.864)
    d.line((x,y+fs+14,x+int(self.w*.032),y+fs+14),fill=(194,195,185,int(opacity*.4)),width=1)
    d.text((x,y),'10',font=f,fill=(220,225,216,int(opacity)))
    d.text((x+d.textlength('10',font=f)+2,y-3),exponent,font=sup,fill=(220,225,216,int(opacity)))
  return im.transpose(Image.Transpose.FLIP_TOP_BOTTOM).tobytes()
 def frame(self,t):
  c=self.ctx
  # Exponential camera dolly. Relative normalization avoids float precision loss.
  u=t/PERIOD+.018*np.sin(t*.52); camz=5*BASE**u
  eye=np.array([camz*.024*np.sin(t*.25),camz*.018*np.cos(t*.21),camz])/camz
  target=np.array([0.,0.,0.]);view=look_at(eye,target,.045*np.sin(t*.13)+t*.009)
  self.fbo.use();self.fbo.clear(.008,.012,.016,1,depth=1);c.enable(gl.DEPTH_TEST);c.disable(gl.BLEND);c.enable(gl.PROGRAM_POINT_SIZE)
  for prog in [self.prog,self.pp]:
   prog['view'].write(view.T.tobytes());prog['projection'].write(projection(self.w/self.h).T.tobytes());prog['clock']=t
  self.pp['height']=float(self.h)
  active=[]
  for k in range(14):
   scale=BASE**k/camz
   if .0007<scale<65:
    active.append((k,scale));self.prog['scale']=scale;self.meshes[k].render()
  c.enable(gl.BLEND);c.blend_func=(gl.ONE,gl.ONE);c.depth_mask=False
  for k,scale in active:
   self.pp['scale']=scale;self.particles[k].render(gl.POINTS)
  c.depth_mask=True;c.disable(gl.BLEND);c.disable(gl.DEPTH_TEST)
  self.text.write(self.label(t));self.final.use();self.color.use(0);self.dep.use(1);self.text.use(2);self.post['clock']=t
  self.quad.render(gl.TRIANGLE_STRIP)
  return np.frombuffer(self.final.read(components=3,alignment=1),dtype=np.uint8).reshape(self.h,self.w,3)[::-1].copy()

def audio():
 from scipy.io.wavfile import write
 from scipy.signal import butter,sosfilt
 sr=48000;t=np.arange(int(sr*DURATION))/sr;rng=np.random.default_rng(1035)
 noise=rng.normal(size=len(t));sos=butter(2,[90,950],btype='bandpass',fs=sr,output='sos');air=sosfilt(sos,noise)
 # A continuous falling bed; no per-scene stings or edit cues.
 bed=.13*np.sin(2*np.pi*(44*t-7*t*t/(2*DURATION)))+.07*np.sin(2*np.pi*(66*t-10*t*t/(2*DURATION)))
 bed+=.045*np.sin(2*np.pi*(110*t+.16*np.sin(t*.33)))
 air*=.085*(.45+.55*t/DURATION)
 shimmer=np.zeros_like(t)
 for j in range(6):
  freq=180*2**(j/2);shimmer+=.009*np.sin(2*np.pi*(freq*t+5*np.sin(t*.08+j)))*(1+np.sin(t*.31+j))
 env=np.minimum(1,t/2.0)*np.minimum(1,(DURATION-t)/2.0)
 left=(bed+air+shimmer)*env;right=(bed+np.roll(air,423)+np.roll(shimmer,1001))*env
 stereo=np.stack([left,right],axis=-1);write(OUT/'sound.wav',sr,(np.tanh(stereo)*28000).astype('int16'))

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--preview',action='store_true');parser.add_argument('--width',type=int,default=1280);parser.add_argument('--height',type=int,default=720);parser.add_argument('--fps',type=int,default=30);parser.add_argument('--sample',type=float);args=parser.parse_args()
 start=time.time();r=Renderer(args.width,args.height);print('Geometry ready',round(time.time()-start,1),flush=True)
 if args.sample is not None:
  Image.fromarray(r.frame(args.sample)).save(OUT/f'frame_{args.sample:04.1f}.png');return
 if args.preview:
  times=[0,3,7,11,15,19,23,27,31,35,39]
  images=[]
  for t in times:
   im=Image.fromarray(r.frame(t));im.save(OUT/f'preview_{t:02d}.jpg');im.thumbnail((480,270));images.append(im)
  contact=Image.new('RGB',(480*3,302*4),(12,15,17));d=ImageDraw.Draw(contact)
  for i,im in enumerate(images):x=(i%3)*480;y=(i//3)*302;contact.paste(im,(x,y));d.text((x+12,y+275),f'{times[i]:02d} s',fill=(190,190,190))
  contact.save(OUT/'contact.jpg');return
 audio();fps=args.fps
 cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{args.width}x{args.height}','-r',str(fps),'-i','-','-i',str(OUT/'sound.wav'),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-t','40',str(OUT/'INWARD_10-35.mp4')]
 proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 for i in range(int(DURATION*fps)):
  proc.stdin.write(r.frame(i/fps).tobytes())
  if i%(fps*2)==0:print(f'{i/fps:.0f}/40 seconds | elapsed {time.time()-start:.1f}s',flush=True)
 proc.stdin.close();proc.wait();assert proc.returncode==0
 print('Done',time.time()-start,flush=True)
if __name__=='__main__':main()
