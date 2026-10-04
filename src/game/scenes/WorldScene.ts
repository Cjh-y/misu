import Phaser from 'phaser';
import type { SceneId } from '../../core/types';
import type { Point } from '../../core/types';
import { SCENES } from '../../core/ids';
import { SCENES_DATA } from '../../data/cases/silver-whistle/scenes';
import { ART_ASSETS, WORLD_SCALE } from '../../data/art/assetManifest';
import { INTERACTABLES } from '../../data/cases/silver-whistle/interactables';
import { PHYSICAL_ROOMS, roomSurfaceAt, type Footprint, type PhysicalRoomDefinition, type RoomSurface, type DoorDefinition } from '../rooms/physicalRooms';

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: any;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private worldBounds = { width:640, height:384 };
  private virtual = { x:0, y:0 };
  private current: SceneId = SCENES.BAKER_STREET;
  private positionClock = 0;
  private lightingClock = 0;
  private actorFeetOffset = 0;
  private facing: 'south'|'north'|'east' = 'south';
  private uiBlocked = false;
  private holmesContactOuter?: Phaser.GameObjects.Ellipse;
  private holmesContactInner?: Phaser.GameObjects.Ellipse;
  private holmesCastShadow?: Phaser.GameObjects.Ellipse;
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private debugLabel?: Phaser.GameObjects.Text;
  private debugNames=new Map<string,Phaser.GameObjects.Text>();
  private physicalFootprints: Footprint[] = [];
  private currentSurface?: RoomSurface;
  private physicalRoom?:PhysicalRoomDefinition;
  private doorColliders=new Map<string,Phaser.GameObjects.Rectangle>();
  private doorLeaves=new Map<string,Phaser.GameObjects.Image>();
  private doorStates=new Map<string,'open'|'closed'|'opening'|'closing'>();
  private doorAnimating=new Set<string>();
  private readonly handleCameraResize = (size:Phaser.Structs.Size) => {
    this.cameras.main.setSize(size.width,size.height);
    this.cameras.main.setZoom(Math.max(size.width/this.worldBounds.width,size.height/this.worldBounds.height));
  };
  constructor(){ super('world'); }
  preload(){
    // All game art lives in the asset tree. Missing images keep the readable Phase 1 fallback.
    this.load.image(ART_ASSETS.interiorTiles.key,ART_ASSETS.interiorTiles.path);
    this.load.image(ART_ASSETS.lydiaProps.key,ART_ASSETS.lydiaProps.path);
    this.load.image(ART_ASSETS.bakerProps.key,ART_ASSETS.bakerProps.path);
    this.load.image(ART_ASSETS.bakerWindow.key,ART_ASSETS.bakerWindow.path);
    this.load.image(ART_ASSETS.corridorDecor.key,ART_ASSETS.corridorDecor.path);
    this.load.image(ART_ASSETS.fakeBellRope.key,ART_ASSETS.fakeBellRope.path);
    this.load.image(ART_ASSETS.holmes.key,ART_ASSETS.holmes.path);
    this.load.image(ART_ASSETS.holmesPhase16.key,ART_ASSETS.holmesPhase16.path);
    this.load.image(ART_ASSETS.lydiaPhase16.key,ART_ASSETS.lydiaPhase16.path);
    this.load.image(ART_ASSETS.lydiaBedFront.key,ART_ASSETS.lydiaBedFront.path);
    this.load.image(ART_ASSETS.lydiaDoorLeaf.key,ART_ASSETS.lydiaDoorLeaf.path);
    this.load.image(ART_ASSETS.lydiaDoorUnderlay.key,ART_ASSETS.lydiaDoorUnderlay.path);
    this.load.image(ART_ASSETS.watson.key,ART_ASSETS.watson.path);
  }
  create(){
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,J,K,ESC,F3,O') as any;
    this.input.keyboard!.on('keydown-E',()=>{if(!this.uiBlocked)this.interact();});
    this.input.on('keydown-ESC', () => window.dispatchEvent(new CustomEvent('misu:action', {detail:{action:'escape'}})));
    this.cameras.main.setRoundPixels(true);
    this.scale.off('resize',this.handleCameraResize);
    this.scale.on('resize',this.handleCameraResize);
    this.events.off('virtual-input');
    this.events.off('interact');
    this.events.off('ui-blocked');
    this.events.off('set-scene');
    this.events.off('toggle-door');
    this.events.on('set-scene', (id:SceneId, position?:Point) => this.build(id, position));
    this.events.on('toggle-door',(doorId?:string)=>this.toggleNearbyDoor(doorId));
    this.events.on('virtual-input', (v:{x:number;y:number}) => { if(!this.uiBlocked)this.virtual = v; });
    this.events.on('interact', () => this.interact());
    this.events.on('ui-blocked', (blocked:boolean) => {this.uiBlocked=blocked;if(blocked){this.virtual={x:0,y:0};this.input.keyboard?.resetKeys();if(this.player?.body)(this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0,0);}});
    this.events.on('open-notebook', () => window.dispatchEvent(new CustomEvent('misu:action', {detail:{action:'notebook'}})));
    this.build(SCENES.BAKER_STREET, {x:160,y:176});
  }
  private build(id:SceneId, position?:Point){
    this.input.keyboard?.resetKeys();
    this.virtual={x:0,y:0};
    this.current=id; this.children.removeAll();
    this.holmesContactOuter=undefined; this.holmesContactInner=undefined; this.holmesCastShadow=undefined;
    this.debugGraphics=undefined; this.debugLabel=undefined;this.debugNames.clear(); this.physicalFootprints=[]; this.currentSurface=undefined;
    this.physicalRoom=PHYSICAL_ROOMS[id];this.doorColliders.clear();this.doorLeaves.clear();this.doorStates.clear();this.doorAnimating.clear();
    const metadata=SCENES_DATA[id];
    this.worldBounds = {width:metadata.width,height:metadata.height};
    this.physics.world.setBounds(0,0,this.worldBounds.width,this.worldBounds.height);
    this.cameras.main.setSize(this.scale.gameSize.width,this.scale.gameSize.height);
    this.cameras.main.setZoom(Math.max(this.scale.gameSize.width/this.worldBounds.width,this.scale.gameSize.height/this.worldBounds.height));
    this.add.rectangle(this.worldBounds.width/2,this.worldBounds.height/2,this.worldBounds.width,this.worldBounds.height,0x273039).setDepth(-20);
    this.ensurePhase16HolmesFrames();
    this.drawRoom(id);
    this.drawOcclusionLayers();
    this.ensureHolmesFrames();
    const heroReady=this.textures.exists('holmes-sheet');
    const usePhase16=id===SCENES.LYDIA_ROOM&&this.textures.exists('holmes-phase16');
    const texture=usePhase16?'holmes-phase16':heroReady?'holmes-sheet':'__DEFAULT';
    const frame=usePhase16?'holmes16-south-idle':heroReady?'holmes-south-0':undefined;
    // Keep the world/collision scale fixed; the Lydia protagonist art is a presentation-only 1.5x pass.
    this.player=this.add.sprite(position?.x ?? 160,position?.y ?? 176,texture,frame).setDisplaySize(usePhase16?43.2:WORLD_SCALE.character.width,usePhase16?64.8:WORLD_SCALE.character.height);
    if(!heroReady)this.player.setTint(0xb9aa8c);
    this.actorFeetOffset=usePhase16?this.player.displayHeight/2:0;
    if(this.physicalRoom){
      const shadowScale=this.player.displayWidth/43.2;
      this.holmesCastShadow=this.add.ellipse(this.player.x,this.player.y,25*shadowScale,5*shadowScale,0x111521,0.075);
      this.holmesContactOuter=this.add.ellipse(this.player.x,this.player.y,20*shadowScale,6*shadowScale,0x140f0b,0.12);
      this.holmesContactInner=this.add.ellipse(this.player.x,this.player.y,11*shadowScale,3*shadowScale,0x0b0908,0.20);
    }
    this.physics.add.existing(this.player);
    const body=this.player.body as Phaser.Physics.Arcade.Body;
    if(usePhase16){
      // Arcade body dimensions are source-frame units; convert back to world pixels so the
      // enlarged illustration still has a compact 18x10 floor contact footprint.
      const sx=this.player.scaleX,sy=this.player.scaleY,sourceW=18/sx,sourceH=10/sy;
      body.setSize(sourceW,sourceH,false);
      body.setOffset(this.player.displayOriginX-sourceW/2,this.player.displayOriginY+(27-5)/sy);
    } else body.setSize(WORLD_SCALE.collision.width,WORLD_SCALE.collision.height).setOffset(3,WORLD_SCALE.collision.footOffsetY);
    body.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player,true,0.08,0.08); this.cameras.main.setBounds(0,0,this.worldBounds.width,this.worldBounds.height);
    this.cameras.main.centerOn(this.player.x,this.player.y);
    this.physics.world.setBoundsCollision(true,true,true,true);
    this.physics.world.colliders.destroy();
    const walls = this.physics.add.staticGroup();
    const roomRects=this.physicalRoom?.walls.length?[...this.physicalRoom.walls,...this.physicalRoom.props]:this.wallRects(id).map((r,i)=>({id:`wall-${i}`,x:r.x,y:r.y,width:r.w,height:r.h,depthY:r.y+r.h/2}));
    this.physicalFootprints=roomRects;
    for(const rect of roomRects) { const obstacle=this.add.rectangle(rect.x,rect.y,rect.width,rect.height,0x15191e); this.physics.add.existing(obstacle,true); if(!this.physicalRoom)walls.add(obstacle); obstacle.setVisible(false); }
    // Physical-room movement resolves these footprints one axis at a time. Arcade's
    // overlap resolver would compete with that sweep and could cancel natural edge sliding.
    if(!this.physicalRoom)this.physics.add.collider(this.player,walls);
    this.createRoomDoors();
    if(this.physicalRoom?.doors.length){
      this.debugGraphics=this.add.graphics().setDepth(10000).setVisible(false);
      this.debugLabel=this.add.text(8,30,'',{fontFamily:'monospace',fontSize:'10px',color:'#f4e6c9',backgroundColor:'#121821dd',padding:{x:5,y:3}}).setScrollFactor(0).setDepth(10001).setVisible(false);
    }
    window.dispatchEvent(new CustomEvent('misu:scene-ready',{detail:{scene:id,position:{x:this.player.x,y:this.player.y}}}));
  }
  private textureKey(asset:'bakerProps'|'bakerWindow'|'lydiaProps'|'lydiaPhase16'|'lydiaBedFront'|'interiorTiles'){
    return ({bakerProps:ART_ASSETS.bakerProps.key,bakerWindow:ART_ASSETS.bakerWindow.key,lydiaProps:ART_ASSETS.lydiaProps.key,lydiaPhase16:ART_ASSETS.lydiaPhase16.key,lydiaBedFront:ART_ASSETS.lydiaBedFront.key,interiorTiles:ART_ASSETS.interiorTiles.key})[asset];
  }
  private drawOcclusionLayers(){
    const room=this.physicalRoom;if(!room)return;
    for(const layer of room.occlusion){
      if(layer.alphaMaskAsset==='lydiaBedFront'&&this.textures.exists(ART_ASSETS.lydiaBedFront.key)){
        this.add.image(layer.x+layer.width/2,layer.y+layer.height/2,ART_ASSETS.lydiaBedFront.key)
          .setDisplaySize(layer.width,layer.height).setDepth(layer.depthY).setName(`occlusion:${layer.id}`);
        continue;
      }
      const key=this.textureKey(layer.asset);if(!this.textures.exists(key))continue;
      const texture=this.textures.get(key),frame=`physical-${room.scene}-${layer.id}`;
      if(!texture.has(frame))texture.add(frame,0,layer.source.x,layer.source.y,layer.source.width,layer.source.height);
      const x=layer.display?.x??layer.x+layer.width/2,y=layer.display?.y??layer.y+layer.height/2;
      const width=layer.display?.width??layer.width,height=layer.display?.height??layer.height;
      this.add.image(x,y,key,frame).setDisplaySize(width,height).setDepth(layer.depthY).setName(`occlusion:${layer.id}`);
    }
  }
  private createRoomDoors(){
    const room=this.physicalRoom;if(!room)return;
    for(const definition of room.doors){
      this.doorStates.set(definition.id,definition.initialState);
      const collider=this.add.rectangle(definition.x,definition.y,definition.width,definition.height,0x15191e).setVisible(false).setName(`collider:${definition.id}`);
      this.physics.add.existing(collider);
      const body=collider.body as Phaser.Physics.Arcade.Body;body.setAllowGravity(false);body.enable=definition.initialState==='closed';
      // Physical rooms resolve movement against the shared footprint config by axis.
      // Avoid registering a second Arcade resolver for the same door rectangle.
      this.doorColliders.set(definition.id,collider);
      const leaf=this.createDoorLeaf(definition);
      if(leaf)this.doorLeaves.set(definition.id,leaf);
    }
  }
  private createDoorLeaf(definition:DoorDefinition){
    const config=definition.leaf;if(!config)return undefined;
    let textureKey:string|undefined;
    if(definition.leafAsset==='lydiaDoorLeaf'&&this.textures.exists(ART_ASSETS.lydiaDoorLeaf.key))textureKey=ART_ASSETS.lydiaDoorLeaf.key;
    if(definition.leafAsset==='tileDoor'&&this.textures.exists(ART_ASSETS.interiorTiles.key)){
      textureKey=ART_ASSETS.interiorTiles.key;const texture=this.textures.get(textureKey);
      if(!texture.has('physical-door-leaf'))texture.add('physical-door-leaf',0,736,636,80,148);
    }
    if(!textureKey)return undefined;
    const leaf=this.add.image(config.x,config.y,textureKey,definition.leafAsset==='tileDoor'?'physical-door-leaf':undefined)
      .setDisplaySize(config.width,config.height).setOrigin(config.originX??.5,config.originY??.5)
      .setRotation(this.doorStates.get(definition.id)==='closed'?config.closedRotation:config.openRotation)
      .setDepth(definition.depthY).setName(`dynamic:${definition.id}`);
    return leaf;
  }
  private toggleNearbyDoor(requestedId?:string){
    const room=this.physicalRoom;if(!room)return;
    const door=requestedId?room.doors.find(d=>d.id===requestedId):room.doors
      .filter(d=>Math.hypot(this.player.x-d.x,this.player.y-d.y)<=d.interactionRange)
      .sort((a,b)=>Math.hypot(this.player.x-a.x,this.player.y-a.y)-Math.hypot(this.player.x-b.x,this.player.y-b.y))[0];
    if(door)this.toggleDoor(door);
  }
  private toggleDoor(door:DoorDefinition){
    const collider=this.doorColliders.get(door.id),leaf=this.doorLeaves.get(door.id),config=door.leaf;
    if(!collider?.body||!leaf||!config||this.doorAnimating.has(door.id))return;
    const current=this.doorStates.get(door.id)??door.initialState,closing=current==='open';
    this.doorStates.set(door.id,closing?'closing':'opening');this.doorAnimating.add(door.id);
    (collider.body as Phaser.Physics.Arcade.Body).enable=closing;
    window.dispatchEvent(new CustomEvent('misu:door-state',{detail:{scene:this.current,doorId:door.id,state:closing?'closing':'opening'}}));
    this.tweens.add({targets:leaf,rotation:closing?config.closedRotation:config.openRotation,duration:260,ease:'Sine.easeInOut',onComplete:()=>{
      const state=closing?'closed':'open';this.doorStates.set(door.id,state);this.doorAnimating.delete(door.id);
      (collider.body as Phaser.Physics.Arcade.Body).enable=closing;
      window.dispatchEvent(new CustomEvent('misu:door-state',{detail:{scene:this.current,doorId:door.id,state}}));
    }});
  }
  private drawRoom(id:SceneId){
    this.add.rectangle(this.worldBounds.width/2,this.worldBounds.height/2,this.worldBounds.width,this.worldBounds.height,0x332a25).setDepth(-20);
    if(id===SCENES.LYDIA_ROOM&&this.textures.exists('lydia-bedroom-phase16')){
      this.add.image(this.worldBounds.width/2,this.worldBounds.height/2,'lydia-bedroom-phase16').setDisplaySize(this.worldBounds.width,this.worldBounds.height).setDepth(-19);
      if(this.textures.exists(ART_ASSETS.lydiaDoorUnderlay.key))this.add.image((100+105/2)/3.2,(540+280/2)/3.2,ART_ASSETS.lydiaDoorUnderlay.key).setDisplaySize(105/3.2,280/3.2).setDepth(-18.8);
      return;
    }
      this.addTileFrame('floor-boards',10,8,160,160);
      this.addTileFrame('wall-panel',12,356,152,198);
      this.addTileFrame('doorway',704,574,143,210);
    if(this.textures.exists('interior-tiles') && this.textures.get('interior-tiles').has('floor-boards')){
      this.add.tileSprite(this.worldBounds.width/2,this.worldBounds.height/2,this.worldBounds.width,this.worldBounds.height,'interior-tiles','floor-boards').setTileScale(.1).setDepth(-19);
    }
    this.drawPerimeter(id);
    if(id===SCENES.LYDIA_ROOM){
      this.addPropFrame('lydia-props','bed',18,18,372,493,220,215,78,104);
      this.addPropFrame('lydia-props','nightstand',390,104,158,375,83,178,34,66);
      this.addPropFrame('lydia-props','wardrobe',552,12,270,444,389,119,64,96);
      this.addPropFrame('lydia-props','desk',836,214,354,281,385,239,82,64);
      this.addPropFrame('lydia-props','chair',1195,213,168,282,324,241,36,52);
      this.addPropFrame('lydia-props','window',17,528,406,376,272,48,94,70);
      this.addPropFrame('lydia-props','rug',449,525,578,294,320,174,116,58);
      this.addPropFrame('lydia-props','vent',1308,598,198,154,272,81,32,25);
      this.addPropFrame('lydia-props','safe',1076,557,211,215,455,231,36,40);
      this.addPropFrame('lydia-props','mirror',1352,14,166,475,448,139,30,87);
      this.addPropFrame('lydia-props','milk-saucer',540,891,141,96,83,180,13,9);
      if(this.textures.exists('bell-rope')) this.add.image(260,224,'bell-rope').setDisplaySize(11,45).setDepth(225);
      // The Lydia background already contains its open door and jamb. A second doorway tile here
      // sits halfway up the left wall and visibly separates the door leaf from its frame.
    } else if(id===SCENES.HALL) {
      for(const x of [120,300,480,650]) this.addPropFrame('lydia-props',`runner-${x}`,449,525,578,294,x,160,128,34);
      this.addPropFrame('corridor-decor','sconce-left',84,78,256,238,102,43,26,30);
      this.addPropFrame('corridor-decor','sconce-right',370,78,230,276,598,43,24,30);
      this.addPropFrame('corridor-decor','portrait-lady',638,62,207,279,240,50,24,36);
      this.addPropFrame('corridor-decor','portrait-gentleman',941,84,198,261,296,50,24,36);
      this.addPropFrame('corridor-decor','portrait-lady-2',1222,84,244,280,352,50,24,36);
      this.addPropFrame('corridor-decor','side-table',100,416,662,266,438,66,72,29);
      this.addPropFrame('corridor-decor','vase',824,410,204,270,444,49,15,21);
      this.addPropFrame('corridor-decor','candlestick',1084,420,132,260,493,51,12,22);
      this.addFrameImage('interior-tiles','doorway',28,160,34,48,160,Math.PI/2);
      this.addFrameImage('interior-tiles','doorway',210,160,38,54,160);
      this.addFrameImage('interior-tiles','doorway',405,100,38,54,100);
      this.addFrameImage('interior-tiles','doorway',565,100,38,54,100);
    } else for(const visual of this.physicalRoom?.propVisuals??[]){
      const key=this.textureKey(visual.asset),frame=`physical-${id}-${visual.id}`;
      if(!this.textures.exists(key))continue;
      const texture=this.textures.get(key);
      if(!texture.has(frame))texture.add(frame,0,visual.source.x,visual.source.y,visual.source.width,visual.source.height);
      this.add.image(visual.display.x,visual.display.y,key,frame).setDisplaySize(visual.display.width,visual.display.height).setDepth(visual.depthY).setName(`prop:${visual.id}`);
    }
  }
  private addTileFrame(name:string,x:number,y:number,w:number,h:number){
    if(this.textures.exists('interior-tiles')&&!this.textures.get('interior-tiles').has(name)) this.textures.get('interior-tiles').add(name,0,x,y,w,h);
  }
  private ensureHolmesFrames(){
    if(!this.textures.exists('holmes-sheet')) return;
    const texture=this.textures.get('holmes-sheet');
    const rows=[
      [{x:205,y:53,w:135,h:298},{x:115,y:53,w:134,h:298},{x:21,y:52,w:131,h:299}],
      [{x:203,y:37,w:137,h:304},{x:112,y:37,w:138,h:304},{x:20,y:37,w:137,h:304}],
      [{x:202,y:19,w:135,h:312},{x:112,y:19,w:137,h:312},{x:21,y:19,w:135,h:312}],
      [{x:203,y:11,w:154,h:295},{x:108,y:11,w:161,h:295},{x:21,y:14,w:160,h:292}],
    ];
    const names=['south','south-walk','north','east'];
    rows.forEach((row,r)=>row.forEach((b,c)=>{
      const name=`holmes-${names[r]}-${c}`;
      if(!texture.has(name)) texture.add(name,0,c*362+b.x,r*362+b.y,b.w,b.h);
    }));
    if(!this.anims.exists('holmes-walk-south')) this.anims.create({key:'holmes-walk-south',frames:[1,2,1,0].map(i=>({key:'holmes-sheet',frame:`holmes-south-walk-${i}`})),frameRate:7,repeat:-1});
    if(!this.anims.exists('holmes-walk-north')) this.anims.create({key:'holmes-walk-north',frames:[0,1,2,1].map(i=>({key:'holmes-sheet',frame:`holmes-north-${i}`})),frameRate:7,repeat:-1});
    if(!this.anims.exists('holmes-walk-east')) this.anims.create({key:'holmes-walk-east',frames:[0,1,2,1].map(i=>({key:'holmes-sheet',frame:`holmes-east-${i}`})),frameRate:7,repeat:-1});
  }
  private ensurePhase16HolmesFrames(){
    if(!this.textures.exists('holmes-phase16')) return;
    const texture=this.textures.get('holmes-phase16');
    // Tight crops from the generated 4x4 sheet. Rows are idle, then three walk frames.
    const crops=[
      [[110,39,162,276],[83,40,166,275],[90,40,132,275],[56,39,125,276]],
      [[106,0,166,315],[81,0,166,315],[63,0,162,315],[42,0,166,315]],
      [[104,0,166,316],[82,0,162,316],[59,0,178,316],[37,0,175,316]],
      [[108,0,164,264],[78,0,165,267],[59,0,179,264],[49,0,175,261]],
    ];
    crops.forEach((row,r)=>row.forEach((b,c)=>{
      const x=Math.round(c*1247/4)+b[0],y=Math.round(r*1261/4)+b[1];
      const name=`holmes16-${['north','south','west','east'][c]}-${r===0?'idle':`walk-${r-1}`}`;
      if(!texture.has(name))texture.add(name,0,x,y,b[2],b[3]);
    }));
    for(const direction of ['north','south','east','west']){
      const frames=[0,1,2].map(i=>({key:'holmes-phase16',frame:`holmes16-${direction}-walk-${i}`}));
      const key=`holmes16-walk-${direction}`;
      if(!this.anims.exists(key))this.anims.create({key,frames,frameRate:7,repeat:-1});
    }
  }
  private addPropFrame(key:string,name:string,sx:number,sy:number,sw:number,sh:number,x:number,y:number,w:number,h:number){
    if(!this.textures.exists(key)) return;
    const texture=this.textures.get(key);
    if(!texture.has(name)) texture.add(name,0,sx,sy,sw,sh);
    this.add.image(x,y,key,name).setDisplaySize(w,h).setDepth(y);
  }
  private addFrameImage(key:string,frame:string,x:number,y:number,w:number,h:number,depth:number,rotation=0){
    if(!this.textures.exists(key)||!this.textures.get(key).has(frame)) return;
    this.add.image(x,y,key,frame).setDisplaySize(w,h).setRotation(rotation).setDepth(depth);
  }
  private drawPerimeter(id:SceneId){
    if(!this.textures.exists('interior-tiles')||!this.textures.get('interior-tiles').has('wall-panel')) return;
    const W=this.worldBounds.width,H=this.worldBounds.height;
    const strip=(x:number,y:number,w:number,h:number)=>this.add.tileSprite(x,y,w,h,'interior-tiles','wall-panel').setTileScale(.1).setDepth(-18);
    strip(W/2,8,W,16);
    if(id===SCENES.BAKER_STREET){strip((8+428)/2,H-8,420,16);strip((470+W-8)/2,H-8,W-478,16);}
    else strip(W/2,H-8,W,16);
    if(id===SCENES.LYDIA_ROOM){ strip(8,54,16,76); strip(8,234,16,172); }
    else if(id===SCENES.HALL){ strip(8,66,16,116); strip(8,252,16,136); }
    else strip(8,H/2,16,H);
    strip(W-8,H/2,16,H);
  }
  private wallRects(id:SceneId){
    const W=this.worldBounds.width,H=this.worldBounds.height;
    const common=[{x:W/2,y:8,w:W,h:16},{x:W/2,y:H-8,w:W,h:16},{x:W-8,y:H/2,w:16,h:H}];
    if(id===SCENES.LYDIA_ROOM) return [...common,{x:8,y:85,w:16,h:154},{x:8,y:282,w:16,h:56},{x:272,y:107,w:62,h:108},{x:229,y:85,w:20,h:28},{x:405,y:67,w:50,h:90},{x:438,y:142,w:18,h:70},{x:411,y:232,w:54,h:72},{x:368,y:235,w:28,h:50},{x:451,y:280,w:18,h:36},{x:65,y:110,w:28,h:56}];
    if(id===SCENES.HALL) return [...common,{x:8,y:68,w:16,h:120},{x:8,y:252,w:16,h:136}];
    return [...common,{x:8,y:H/2,w:16,h:H},{x:104,y:77,w:92,h:62},{x:360,y:91,w:52,h:62},{x:428,y:132,w:46,h:56},{x:122,y:231,w:90,h:67},{x:291,y:234,w:48,h:35},{x:430,y:100,w:50,h:68}];
  }
  update(_time:number, delta:number){
    if(!this.player?.body) return;
    if(Phaser.Input.Keyboard.JustDown(this.keys.F3)&&this.debugGraphics){this.debugGraphics.setVisible(!this.debugGraphics.visible);this.debugLabel?.setVisible(this.debugGraphics.visible);for(const label of this.debugNames.values())label.setVisible(this.debugGraphics.visible);window.dispatchEvent(new CustomEvent('misu:physics-debug',{detail:{enabled:this.debugGraphics.visible}}));}
    if(Phaser.Input.Keyboard.JustDown(this.keys.O))this.toggleNearbyDoor();
    if(this.uiBlocked){(this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0,0);if(this.player.anims.isPlaying){this.player.anims.stop();this.setHolmesIdleFrame();}this.updateHolmesLighting();this.updateRoomFeedback();return;}
    let x=this.virtual.x,y=this.virtual.y;
    if(this.cursors.left.isDown||this.keys.A.isDown)x-=1;
    if(this.cursors.right.isDown||this.keys.D.isDown)x+=1;
    if(this.cursors.up.isDown||this.keys.W.isDown)y-=1;
    if(this.cursors.down.isDown||this.keys.S.isDown)y+=1;
    const magnitude=Math.hypot(x,y); const length=magnitude||1;
    const body=this.player.body as Phaser.Physics.Arcade.Body;
    if(this.physicalRoom){
      body.setVelocity(0,0);
      // Resolve the axes separately. If one axis meets a footprint, the other can still
      // advance, giving the actor a natural slide along the furniture edge.
      const dx=x/length*92*delta/1000,dy=y/length*92*delta/1000;
      this.tryPhysicalAxisMove(dx,0);
      this.tryPhysicalAxisMove(0,dy);
    } else body.setVelocity(x/length*92,y/length*92);
    if(magnitude>0){
      this.facing=Math.abs(x)>Math.abs(y)?'east':y<0?'north':'south';
      this.player.setFlipX(this.facing==='east'&&x<0);
      const phase16=this.current===SCENES.LYDIA_ROOM&&this.textures.exists('holmes-phase16');
      const animation=`${phase16?'holmes16':'holmes'}-walk-${this.facing}`;
      if(this.anims.exists(animation)&&!this.player.anims.isPlaying) this.player.play(animation);
      else if(this.anims.exists(animation)&&this.player.anims.currentAnim?.key!==animation) this.player.play(animation);
    } else if(this.player.anims.isPlaying) {
      this.player.anims.stop();
      this.setHolmesIdleFrame();
    }
    const feetY=this.getPlayerFeetY();
    this.player.setDepth(feetY);
    this.updateHolmesLighting();
    this.updateRoomFeedback();
    if(Phaser.Input.Keyboard.JustDown(this.keys.J)) window.dispatchEvent(new CustomEvent('misu:action',{detail:{action:'notebook'}}));
    if(Phaser.Input.Keyboard.JustDown(this.keys.K)) window.dispatchEvent(new CustomEvent('misu:action',{detail:{action:'reasoning'}}));
    this.positionClock+=delta;
    this.lightingClock+=delta;
    if(this.physicalRoom&&this.lightingClock>=150){this.lightingClock=0;const influences=this.physicalRoom.lights.reduce((acc,light)=>{const d=Math.hypot(this.player.x-light.x,this.player.y-light.y),t=Math.max(0,1-d/light.radius),value=t*t*light.intensity;acc[light.kind]+=value;return acc;},{warm:0,cool:0});window.dispatchEvent(new CustomEvent('misu:light-response',{detail:{scene:this.current,warm:influences.warm,cool:influences.cool,tint:this.player.tintTopLeft}}));}
    if(this.positionClock>=100){this.positionClock=0;window.dispatchEvent(new CustomEvent('misu:player-position',{detail:{scene:this.current,x:this.player.x,y:this.player.y}}));
      const nearest=this.physicalRoom?.doors.map(d=>({door:d,distance:Math.hypot(this.player.x-d.x,this.player.y-d.y)})).filter(v=>v.distance<=v.door.interactionRange).sort((a,b)=>a.distance-b.distance)[0];
      window.dispatchEvent(new CustomEvent('misu:door-availability',{detail:{available:!!nearest,doorId:nearest?.door.id,state:nearest?this.doorStates.get(nearest.door.id):undefined}}));}
  }
  private getPlayerFeetY(){return this.player.y+this.actorFeetOffset}
  private tryPhysicalAxisMove(dx:number,dy:number){
    if(dx===0&&dy===0)return;
    const body=this.player.body as Phaser.Physics.Arcade.Body;
    const oldX=this.player.x,oldY=this.player.y;
    this.player.setPosition(oldX+dx,oldY+dy);body.updateFromGameObject();
    const intersects=(r:Footprint)=>body.right>r.x-r.width/2&&body.x<r.x+r.width/2&&body.bottom>r.y-r.height/2&&body.y<r.y+r.height/2;
    const closedDoor=this.physicalRoom?.doors.some(d=>{
      const collider=this.doorColliders.get(d.id),state=this.doorStates.get(d.id);
      return (state==='closed'||state==='closing')&&!!(collider?.body as Phaser.Physics.Arcade.Body|undefined)?.enable&&intersects(d);
    })??false;
    const blocked=this.physicalFootprints.some(intersects)||closedDoor;
    if(blocked){this.player.setPosition(oldX,oldY);body.updateFromGameObject();}
  }
  private updateRoomFeedback(){
    if(!this.physicalRoom)return;
    const feetY=this.getPlayerFeetY();
    const surface=roomSurfaceAt(this.physicalRoom,this.player.x,feetY);
    if(surface!==this.currentSurface){
      this.currentSurface=surface;
      window.dispatchEvent(new CustomEvent('misu:surface',{detail:{surface,x:this.player.x,y:feetY}}));
    }
    if(this.debugGraphics?.visible)this.drawPhysicsDebug(feetY);
  }
  private drawPhysicsDebug(feetY:number){
    const g=this.debugGraphics,room=this.physicalRoom;if(!g||!room)return;
    g.clear();g.lineStyle(1,0xf4cf74,0.85);g.strokeRect(0,0,this.worldBounds.width,this.worldBounds.height);
    g.fillStyle(0x53b989,0.035);g.fillRect(16,16,this.worldBounds.width-32,this.worldBounds.height-32);
    for(const region of room.surfaces){g.fillStyle(region.surface==='RUG'?0x839bdf:0x82c9a0,0.11);g.fillRect(region.x,region.y,region.width,region.height);g.lineStyle(1,region.surface==='RUG'?0x9b9efa:0x75caa0,0.75);g.strokeRect(region.x,region.y,region.width,region.height);}
    for(const f of room.walls){g.lineStyle(1,0x62c6a5,0.9);g.strokeRect(f.x-f.width/2,f.y-f.height/2,f.width,f.height);g.lineStyle(1,0xdacb81,0.72);g.lineBetween(f.x-f.width/2,f.depthY,f.x+f.width/2,f.depthY);this.debugText(f.id,f.x,f.y+f.height/2+7);}
    for(const f of room.props){g.lineStyle(1,0xe4a45d,0.9);g.strokeRect(f.x-f.width/2,f.y-f.height/2,f.width,f.height);g.lineStyle(1,0xdacb81,0.72);g.lineBetween(f.x-f.width/2,f.depthY,f.x+f.width/2,f.depthY);this.debugText(f.id,f.x,f.y+f.height/2+7);}
    for(const exit of room.exits){g.lineStyle(1,0x67d4e3,0.9);g.strokeRect(exit.x-exit.width/2,exit.y-exit.height/2,exit.width,exit.height);this.debugText(exit.id,exit.x-12,exit.y-exit.height/2-8);}
    for(const door of room.doors){const state=this.doorStates.get(door.id)??door.initialState,closed=state==='closed'||state==='closing';g.lineStyle(2,closed?0xff6978:0xd9c58a,0.95);g.strokeRect(door.x-door.width/2,door.y-door.height/2,door.width,door.height);g.lineStyle(1,0x8aa7db,0.8);g.strokeCircle(door.x,door.y,door.interactionRange);this.debugText(door.id,door.x+12,door.y-door.height/2-8);}
    for(const item of INTERACTABLES.filter(i=>i.scene===this.current)){g.lineStyle(1,0x78b9ee,0.68);g.strokeCircle(item.x,item.y,item.interactionRange);}
    const body=this.player.body as Phaser.Physics.Arcade.Body;g.lineStyle(2,0xff6978,1);g.strokeRect(body.x,body.y,body.width,body.height);
    g.lineStyle(1,0xf8df8c,0.9);g.lineBetween(this.player.x-10,feetY,this.player.x+10,feetY);
    const states=room.doors.map(d=>`${d.id}:${this.doorStates.get(d.id)}`).join(' ')||'no doors';
    this.debugLabel?.setText(`${room.debugLabel} · F3  O door  ${states}  ${this.currentSurface??room.defaultSurface}`);
  }
  private debugText(text:string,x:number,y:number){
    if(!this.debugGraphics?.visible)return;
    const shown=({
      'north-wall':'N wall','south-wall-west':'S wall L','south-wall-east':'S wall R','east-wall':'E wall','west-wall':'W wall',
      'baker-street-exit':'exit','manor-hall-exit':'exit','bedroom-entry':'entry','221b-entry':'entry','armchair-left':'chair L','armchair-right':'chair R',
      'chemistry-stand':'chemistry','lamp-table':'lamp table','bedside-table':'nightstand','mirror-base':'mirror',
    } as Record<string,string>)[text]??text;
    let label=this.debugNames.get(text);
    const safeX=Phaser.Math.Clamp(x,42,this.worldBounds.width-42),safeY=Phaser.Math.Clamp(y,24,this.worldBounds.height-24);
    if(!label){label=this.add.text(safeX,safeY,shown,{fontFamily:'monospace',fontSize:'6px',color:'#f2e4c3',backgroundColor:'#10151bcc',padding:{x:2,y:1}}).setOrigin(.5,.5).setDepth(10002).setName(`debug:${text}`);this.debugNames.set(text,label);}
    label.setPosition(safeX,safeY).setVisible(true);
  }
  /** Position dependent light response and layered foot shadows for the Lydia room sprite. */
  private updateHolmesLighting(){
    if(!this.physicalRoom||!this.player||!this.holmesContactOuter||!this.holmesContactInner||!this.holmesCastShadow)return;
    const px=this.player.x,py=this.player.y;
    const colorAt=(x:number,y:number)=>{
      let warm=0,cool=0;
      for(const light of this.physicalRoom!.lights){const d=Math.hypot(x-light.x,y-light.y),t=Math.max(0,1-d/light.radius),amount=t*t*light.intensity;if(light.kind==='warm')warm+=amount;else cool+=amount;}
      const ambient=[0.59,0.61,0.70];
      const channels=[
        ambient[0]+warm*0.27+cool*0.005,
        ambient[1]+warm*0.14+cool*0.025,
        ambient[2]-warm*0.12+cool*0.08,
      ].map(v=>Math.max(0.25,Math.min(1,v))*255|0);
      return ((channels[0]<<16)|(channels[1]<<8)|channels[2])>>>0;
    };
    const hw=this.player.displayWidth/2,hh=this.player.displayHeight/2;
    this.player.setTint(colorAt(px-hw,py-hh),colorAt(px+hw,py-hh),colorAt(px-hw,py+hh),colorAt(px+hw,py+hh));
    const feetY=this.getPlayerFeetY()-2;
    const warmSource=this.physicalRoom.lights.filter(light=>light.kind==='warm').sort((a,b)=>Math.hypot(px-a.x,py-a.y)-Math.hypot(px-b.x,py-b.y))[0]??{x:px,y:py};
    const dx=px-warmSource.x,dy=py-warmSource.y,length=Math.max(1,Math.hypot(dx,dy));
    const away=Math.max(0,1-length/Math.max(1,warmSource.radius));
    this.holmesCastShadow.setPosition(px+dx/length*(4+away*5),feetY+dy/length*(3+away*4));
    const depth=py+hh;
    this.holmesCastShadow.setAlpha(0.035+away*0.055).setDepth(depth-0.3);
    this.holmesContactOuter.setPosition(px,feetY).setDepth(depth-0.2);
    this.holmesContactInner.setPosition(px,feetY).setDepth(depth-0.1);
  }
  private setHolmesIdleFrame(){
    if(this.current===SCENES.LYDIA_ROOM&&this.textures.exists('holmes-phase16'))this.player.setTexture('holmes-phase16',`holmes16-${this.facing}-idle`);
    else if(this.textures.exists('holmes-sheet'))this.player.setTexture('holmes-sheet',`holmes-${this.facing}-0`);
  }
  private interact(){ window.dispatchEvent(new CustomEvent('misu:action',{detail:{action:'interact',scene:this.current,x:this.player?.x,y:this.player?.y}})); }
}
