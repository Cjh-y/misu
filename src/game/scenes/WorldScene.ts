import Phaser from 'phaser';
import type { SceneId } from '../../core/types';
import type { Point } from '../../core/types';
import { SCENES } from '../../core/ids';
import { SCENES_DATA } from '../../data/cases/silver-whistle/scenes';
import { ART_ASSETS, WORLD_SCALE } from '../../data/art/assetManifest';
import { INTERACTABLES } from '../../data/cases/silver-whistle/interactables';
import { WATSON_ACTOR } from '../../data/cases/silver-whistle/roomNarrative';
import { PHYSICAL_ROOMS, roomSurfaceAt, type PhysicalRoomDefinition, type RoomSurface, type DoorDefinition } from '../rooms/physicalRooms';
import { LYDIA_CLOSED_DOOR, LYDIA_DOOR_WORLD, LYDIA_ENTRY_WORLD, LYDIA_EXIT_WORLD, LYDIA_FURNITURE_GROUPS, LYDIA_GROUND_FOOTPRINTS, LYDIA_PLAYER_COLLISION_VOLUME, LYDIA_PLAYER_FOOTPRINT, LYDIA_PROJECTION, LYDIA_ROOM_ARCHITECTURE, LYDIA_RUG_FOOTPRINT, LYDIA_SCENE_CAMERA, LYDIA_SCENE_GRAPH, LYDIA_WORLD_ENTITIES, LYDIA_WALL_MOUNTED, LYDIA_WORLD_ROOM, LYDIA_WORLD_INTERACTABLES, findLydiaCollision, isWithinGroundFootprint, lydiaDistanceXZ, resolveLydiaSpawn, type GroundFootprint, type LydiaCollisionHit } from '../world/lydiaWorldRoom';
import type { WorldPosition3D } from '../world/WorldProjection';
import { entityDepthKey, entityOcclusionRelation, entityVolume } from '../world/sceneGraph3D';

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
  private heroDisplayHeight = 51.6;
  private facing: 'south'|'north'|'east' = 'south';
  private uiBlocked = false;
  private holmesContactOuter?: Phaser.GameObjects.Ellipse;
  private holmesContactInner?: Phaser.GameObjects.Ellipse;
  private holmesCastShadow?: Phaser.GameObjects.Ellipse;
  private watsonActor?: Phaser.GameObjects.Sprite;
  private watsonContactShadow?: Phaser.GameObjects.Ellipse;
  private watsonCastShadow?: Phaser.GameObjects.Ellipse;
  private debugGraphics?: Phaser.GameObjects.Graphics;
  private debugLabel?: Phaser.GameObjects.Text;
  private lydiaSchematicGraphics?:Phaser.GameObjects.Graphics;
  private lydiaSchematicLabel?:Phaser.GameObjects.Text;
  private lydiaDeskSectionLabel?:Phaser.GameObjects.Text;
  private lydiaSchematicVisible=false;
  private lydiaPerspectiveGraphics?:Phaser.GameObjects.Graphics;
  private lydiaPerspectiveLabel?:Phaser.GameObjects.Text;
  private lydiaPerspectiveVisible=false;
  private lydiaPerspectiveNames=new Map<string,Phaser.GameObjects.Text>();
  private lydiaEntitySprites=new Map<string,Phaser.GameObjects.Image>();
  private lydiaWallSprites=new Map<string,Phaser.GameObjects.Image>();
  private debugNames=new Map<string,Phaser.GameObjects.Text>();
  private readonly lydiaDebugLayers={projection:true,collision:true,interaction:true};
  private currentSurface?: RoomSurface;
  private playerWorldPosition?:WorldPosition3D;
  private lastLydiaMovementBlock?:LydiaCollisionHit;
  private physicalRoom?:PhysicalRoomDefinition;
  private roomBuildGeneration=0;
  private doorColliders=new Map<string,Phaser.GameObjects.Rectangle>();
  private doorLeaves=new Map<string,Phaser.GameObjects.Image>();
  private doorStates=new Map<string,'open'|'closed'|'opening'|'closing'>();
  private doorAnimating=new Set<string>();
  private readonly handleCameraResize = (size:Phaser.Structs.Size) => {
    this.cameras.main.setSize(size.width,size.height);
    this.applyCameraLayout(size.width,size.height);
  };
  constructor(){ super('world'); }
  private cameraZoom(width:number,height:number){
    const widthFit=width/this.worldBounds.width,heightFit=height/this.worldBounds.height;
    return this.current===SCENES.HALL&&width/height>=1.8?Math.min(widthFit,heightFit):Math.max(widthFit,heightFit);
  }
  private applyCameraLayout(width:number,height:number){
    const zoom=this.cameraZoom(width,height);this.cameras.main.setZoom(zoom);
    const verticalMargin=this.current===SCENES.HALL&&width/height>=1.8?Math.max(0,(height/zoom-this.worldBounds.height)/2):0;
    this.cameras.main.setBounds(0,-verticalMargin,this.worldBounds.width,this.worldBounds.height+verticalMargin*2);
  }
  preload(){
    // Shared non-Lydia scenes retain their existing resources; Lydia uses only its
    // architecture base and independent scene-graph entity visuals.
    this.load.image(ART_ASSETS.interiorTiles.key,ART_ASSETS.interiorTiles.path);
    this.load.image(ART_ASSETS.lydiaProps.key,ART_ASSETS.lydiaProps.path);
    this.load.image(ART_ASSETS.bakerProps.key,ART_ASSETS.bakerProps.path);
    this.load.image(ART_ASSETS.bakerWindow.key,ART_ASSETS.bakerWindow.path);
    this.load.image(ART_ASSETS.bakerRoomBase.key,ART_ASSETS.bakerRoomBase.path);
    this.load.image(ART_ASSETS.bakerRoomProps.key,ART_ASSETS.bakerRoomProps.path);
    this.load.image(ART_ASSETS.bakerDoorLeaf.key,ART_ASSETS.bakerDoorLeaf.path);
    this.load.image(ART_ASSETS.bakerEntryPatch.key,ART_ASSETS.bakerEntryPatch.path);
    this.load.image(ART_ASSETS.corridorDecor.key,ART_ASSETS.corridorDecor.path);
    this.load.image(ART_ASSETS.manorCorridorRoomBase.key,ART_ASSETS.manorCorridorRoomBase.path);
    this.load.image(ART_ASSETS.manorCorridorDoorLeaf.key,ART_ASSETS.manorCorridorDoorLeaf.path);
    this.load.image(ART_ASSETS.manorCorridorLydiaThreshold.key,ART_ASSETS.manorCorridorLydiaThreshold.path);
    this.load.image(ART_ASSETS.fakeBellRope.key,ART_ASSETS.fakeBellRope.path);
    this.load.image(ART_ASSETS.holmes.key,ART_ASSETS.holmes.path);
    this.load.image(ART_ASSETS.holmesPhase16.key,ART_ASSETS.holmesPhase16.path);
    for(const asset of [ART_ASSETS.lydiaWorldRoomBase,ART_ASSETS.lydiaWorldBed,ART_ASSETS.lydiaWorldNightstand,ART_ASSETS.lydiaWorldWardrobe,ART_ASSETS.lydiaWorldWashstand,ART_ASSETS.lydiaWorldDesk,ART_ASSETS.lydiaWorldChair,ART_ASSETS.lydiaWorldMirror,ART_ASSETS.lydiaWorldRug,ART_ASSETS.lydiaWorldSafe,ART_ASSETS.lydiaWorldVent])this.load.image(asset.key,asset.path);
    this.load.image(ART_ASSETS.lydiaDoorLeaf.key,ART_ASSETS.lydiaDoorLeaf.path);
    this.load.image(ART_ASSETS.lydiaDoorUnderlay.key,ART_ASSETS.lydiaDoorUnderlay.path);
    this.load.image(ART_ASSETS.watson.key,ART_ASSETS.watson.path);
  }
  create(initial?:{scene?:SceneId;position?:Point;worldPosition?:WorldPosition3D}){
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,E,J,K,ESC,F3,F4,F5,F6,F7,F8,O') as any;
    this.input.keyboard!.on('keydown',(event:KeyboardEvent)=>{if(['F3','F4','F5','F6','F7','F8'].includes(event.code))event.preventDefault();});
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
    this.events.on('set-scene', (id:SceneId, position?:Point, worldPosition?:WorldPosition3D) => this.build(id, position, worldPosition));
    this.events.on('toggle-door',(doorId?:string)=>this.toggleNearbyDoor(doorId));
    this.events.on('virtual-input', (v:{x:number;y:number}) => { if(!this.uiBlocked)this.virtual = v; });
    this.events.on('interact', () => this.interact());
    this.events.on('ui-blocked', (blocked:boolean) => {this.uiBlocked=blocked;if(blocked){this.virtual={x:0,y:0};this.input.keyboard?.resetKeys();if(this.player?.body)(this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0,0);}});
    this.events.on('open-notebook', () => window.dispatchEvent(new CustomEvent('misu:action', {detail:{action:'notebook'}})));
    this.build(initial?.scene??SCENES.BAKER_STREET,initial?.position??{x:160,y:176},initial?.worldPosition);
  }
  private build(id:SceneId, position?:Point, worldPosition?:WorldPosition3D){
    const buildGeneration=++this.roomBuildGeneration;
    this.tweens.killAll();
    this.physics.world.colliders.destroy();
    this.cameras.main.stopFollow();
    const previousChildren=new Set(this.children.list);
    for(const body of [...this.physics.world.bodies.entries,...this.physics.world.staticBodies.entries]){
      if(!body.gameObject||!previousChildren.has(body.gameObject))continue;
      body.enable=false;
      this.physics.world.remove(body);
    }
    this.input.keyboard?.resetKeys();
    this.virtual={x:0,y:0};
    this.current=id; this.children.removeAll(true);this.playerWorldPosition=undefined;
    this.holmesContactOuter=undefined; this.holmesContactInner=undefined; this.holmesCastShadow=undefined;
    this.watsonActor=undefined;this.watsonContactShadow=undefined;this.watsonCastShadow=undefined;
    this.debugGraphics=undefined; this.debugLabel=undefined;this.lydiaSchematicGraphics=undefined;this.lydiaSchematicLabel=undefined;this.lydiaSchematicVisible=false;this.lydiaPerspectiveGraphics=undefined;this.lydiaPerspectiveLabel=undefined;this.lydiaPerspectiveVisible=false;this.lydiaPerspectiveNames.clear();
    this.lydiaEntitySprites.clear();this.lydiaWallSprites.clear();this.debugNames.clear();this.currentSurface=undefined;
    this.physicalRoom=PHYSICAL_ROOMS[id];this.doorColliders.clear();this.doorLeaves.clear();this.doorStates.clear();this.doorAnimating.clear();
    const metadata=SCENES_DATA[id];
    this.worldBounds = {width:metadata.width,height:metadata.height};
    this.physics.world.setBounds(0,0,this.worldBounds.width,this.worldBounds.height);
    this.cameras.main.setSize(this.scale.gameSize.width,this.scale.gameSize.height);
    this.applyCameraLayout(this.scale.gameSize.width,this.scale.gameSize.height);
    this.add.rectangle(this.worldBounds.width/2,this.worldBounds.height/2,this.worldBounds.width,this.worldBounds.height,0x273039).setDepth(-20);
    this.ensurePhase16HolmesFrames();
    this.ensureWatsonFrames();
    this.drawRoom(id);
    this.drawOcclusionLayers();
    this.ensureHolmesFrames();
    const heroReady=this.textures.exists('holmes-sheet');
    const usePhase16=(id===SCENES.LYDIA_ROOM||id===SCENES.BAKER_STREET||id===SCENES.HALL)&&this.textures.exists('holmes-phase16');
    const texture=usePhase16?'holmes-phase16':heroReady?'holmes-sheet':'__DEFAULT';
    const frame=usePhase16?'holmes16-south-idle':heroReady?'holmes-south-0':undefined;
    // Keep Holmes at one uniform world height across the narrative rooms, including Lydia Bedroom.
    const heroHeight=(id===SCENES.LYDIA_ROOM||id===SCENES.BAKER_STREET||id===SCENES.HALL)?51.6:WORLD_SCALE.character.height;
    this.heroDisplayHeight=heroHeight;
    const requestedWorldPosition=id===SCENES.LYDIA_ROOM
      ?worldPosition??LYDIA_ENTRY_WORLD
      :undefined;
    const initialWorldPosition=requestedWorldPosition?resolveLydiaSpawn(requestedWorldPosition):undefined;
    this.playerWorldPosition=initialWorldPosition;
    const initialScreen=id===SCENES.LYDIA_ROOM&&initialWorldPosition?LYDIA_PROJECTION.project(initialWorldPosition):undefined;
    const initialRenderPoint=initialScreen??{x:position?.x??160,y:position?.y??176};
    this.player=this.add.sprite(initialRenderPoint.x,initialRenderPoint.y,texture,frame);
    if(id===SCENES.LYDIA_ROOM)this.player.setOrigin(.5,1);
    if(usePhase16)this.player.setScale(heroHeight/this.player.frame.height);
    else this.player.setDisplaySize(WORLD_SCALE.character.width,WORLD_SCALE.character.height);
    if(!heroReady)this.player.setTint(0xb9aa8c);
    this.actorFeetOffset=id===SCENES.LYDIA_ROOM?0:usePhase16?heroHeight/2:0;
    if(this.physicalRoom){
      const shadowScale=this.player.displayHeight/(id===SCENES.LYDIA_ROOM?64.8:51.6);
      this.holmesCastShadow=this.add.ellipse(this.player.x,this.player.y,25*shadowScale,5*shadowScale,0x111521,0.075);
      const bakerShadow=id===SCENES.BAKER_STREET;
      this.holmesContactOuter=this.add.ellipse(this.player.x,this.player.y,20*shadowScale,6*shadowScale,0x140f0b,bakerShadow?0.18:0.12);
      this.holmesContactInner=this.add.ellipse(this.player.x,this.player.y,11*shadowScale,3*shadowScale,0x0b0908,bakerShadow?0.27:0.20);
    }
    this.physics.add.existing(this.player);
    const body=this.player.body as Phaser.Physics.Arcade.Body;
    if(usePhase16){
      this.syncPhase16PlayerFootprint();
    } else body.setSize(WORLD_SCALE.collision.width,WORLD_SCALE.collision.height).setOffset(3,WORLD_SCALE.collision.footOffsetY);
    body.setCollideWorldBounds(id!==SCENES.LYDIA_ROOM);
    if(id===SCENES.LYDIA_ROOM){body.setVelocity(0,0);body.setSize(18,9,false);body.setOffset(this.player.frame.width/2-9,this.player.frame.height-9);}
    this.cameras.main.startFollow(this.player,true,0.08,0.08);
    this.cameras.main.centerOn(this.player.x,this.player.y);
    this.physics.world.setBoundsCollision(true,true,true,true);
    this.physics.world.colliders.destroy();
    // Lydia's screen-rectangle mirrors are retired; its logical X/Z footprints below
    // perform collision. Other rooms still use their existing Arcade rectangles.
    const roomRects=id===SCENES.LYDIA_ROOM?[]:this.physicalRoom?.walls.length?[...this.physicalRoom.walls,...this.physicalRoom.props]:this.wallRects(id).map((r,i)=>({id:`wall-${i}`,x:r.x,y:r.y,width:r.w,height:r.h,depthY:r.y+r.h/2}));
    for(const rect of roomRects) {
      const obstacle=this.add.rectangle(rect.x,rect.y,rect.width,rect.height,0x15191e).setName(`collider:${rect.id}`);
      this.physics.add.existing(obstacle,true);obstacle.setVisible(false);
      // Lydia ground-space footprints below are authoritative. These projected Arcade
      // bodies remain visible to legacy diagnostics only; they do not decide movement.
      if(id!==SCENES.LYDIA_ROOM)this.physics.add.collider(this.player,obstacle);
    }
    this.createWatsonActor(id);
    if(this.watsonActor)this.physics.add.collider(this.player,this.watsonActor);
    this.createRoomDoors();
    if(this.physicalRoom?.doors.length||this.current===SCENES.HALL){
      this.debugGraphics=this.add.graphics().setDepth(10000).setVisible(false);
      this.debugLabel=this.add.text(8,30,'',{fontFamily:'monospace',fontSize:'10px',color:'#f4e6c9',backgroundColor:'#121821dd',padding:{x:5,y:3}}).setScrollFactor(0).setDepth(10001).setVisible(false);
    }
    if(id===SCENES.LYDIA_ROOM){
      this.lydiaSchematicGraphics=this.add.graphics().setDepth(10003).setVisible(false).setName('debug:lydia-3d-schematic');
      this.lydiaSchematicLabel=this.add.text(8,72,'F7 3D WORLD SCHEMATIC',{fontFamily:'monospace',fontSize:'9px',color:'#f4e6c9',backgroundColor:'#121821dd',padding:{x:5,y:3}}).setDepth(10004).setVisible(false);
      this.lydiaDeskSectionLabel=this.add.text(18,218,'DESK SIDE SECTION\nHolmes body: 0 → 1.82\nDesk free height: 0.84\n1.82 > 0.84 · BLOCKED',{fontFamily:'monospace',fontSize:'7px',color:'#f4e6c9',backgroundColor:'#111820ee',padding:{x:4,y:3},lineSpacing:2}).setDepth(10004).setVisible(false);
      this.lydiaPerspectiveGraphics=this.add.graphics().setDepth(10005).setVisible(false).setName('debug:lydia-asset-perspective-axes');
      this.lydiaPerspectiveLabel=this.add.text(8,54,'F8 ASSET CAMERA AXES · X red / Z green / Y blue',{fontFamily:'monospace',fontSize:'8px',color:'#f4e6c9',backgroundColor:'#121821dd',padding:{x:5,y:3}}).setDepth(10006).setVisible(false);
    }
    this.time.delayedCall(50,()=>{
      if(buildGeneration!==this.roomBuildGeneration)return;
      const foreground=this.children.list.filter((child:any)=>String(child.name??'').startsWith('occlusion:')) as Phaser.GameObjects.Image[];
      const sceneGraphAudit=id===SCENES.LYDIA_ROOM?this.getLydiaSceneGraphAudit():undefined;
      if(sceneGraphAudit)window.dispatchEvent(new CustomEvent('misu:scene-graph-debug',{detail:sceneGraphAudit}));
      window.dispatchEvent(new CustomEvent('misu:scene-ready',{detail:{
        scene:id,position:{x:this.player.x,y:this.player.y},worldPosition3D:this.playerWorldPosition?{...this.playerWorldPosition}:undefined,
        worldBounds:{...this.worldBounds},walkableBounds:this.physicalRoom?.walkableBounds,cameraZoom:this.cameras.main.zoom,
        worldRoom:id===SCENES.LYDIA_ROOM?{camera:LYDIA_SCENE_CAMERA,size:{...LYDIA_WORLD_ROOM.size},floorPlane:LYDIA_WORLD_ROOM.floorPlane,floorQuad:LYDIA_PROJECTION.floor,controlPoints:{NW:{world:{x:0,z:0},screen:LYDIA_PROJECTION.floor.northwest},NE:{world:{x:LYDIA_PROJECTION.size.width,z:0},screen:LYDIA_PROJECTION.floor.northeast},SW:{world:{x:0,z:LYDIA_PROJECTION.size.depth},screen:LYDIA_PROJECTION.floor.southwest},SE:{world:{x:LYDIA_PROJECTION.size.width,z:LYDIA_PROJECTION.size.depth},screen:LYDIA_PROJECTION.floor.southeast}},roomScale:this.playerWorldPosition?LYDIA_PROJECTION.scaleAt(this.playerWorldPosition.z):undefined,playerProjection:this.playerWorldPosition?LYDIA_PROJECTION.project(this.playerWorldPosition):undefined,playerFootAnchor:this.playerWorldPosition?{x:this.player.x,y:this.player.y}:undefined}:undefined,
        doorStates:Object.fromEntries(this.doorStates),
        sceneChildren:this.children.list.length,dynamicBodyCount:this.physics.world.bodies.entries.length,staticBodyCount:this.physics.world.staticBodies.entries.length,
        foreground:foreground.map(image=>({name:image.name,x:image.x,y:image.y,originX:image.originX,originY:image.originY,scaleX:image.scaleX,scaleY:image.scaleY,width:image.displayWidth,height:image.displayHeight,frameWidth:image.frame.width,frameHeight:image.frame.height,bounds:image.getBounds()})),
        sceneGraphAudit,
      }}));
    });
  }
  private textureKey(asset:'bakerProps'|'bakerRoomProps'|'bakerWindow'|'interiorTiles'){
    return ({bakerProps:ART_ASSETS.bakerProps.key,bakerRoomProps:ART_ASSETS.bakerRoomProps.key,bakerWindow:ART_ASSETS.bakerWindow.key,interiorTiles:ART_ASSETS.interiorTiles.key})[asset];
  }
  private drawOcclusionLayers(){
    const room=this.physicalRoom;if(!room)return;
    for(const layer of room.occlusion){
      const key=this.textureKey(layer.asset);if(!this.textures.exists(key))continue;
      const texture=this.textures.get(key),frame=`physical-${room.scene}-${layer.id}`;
      if(!texture.has(frame))texture.add(frame,0,layer.source.x,layer.source.y,layer.source.width,layer.source.height);
      const x=layer.display?.x??layer.x+layer.width/2,y=layer.display?.y??layer.y+layer.height/2;
      const width=layer.display?.width??layer.width,height=layer.display?.height??layer.height,crop=texture.get(frame);
      const depth=layer.depthY;
      this.add.image(x,y,key,frame).setOrigin(0.5,0.5).setScale(width/crop.width,height/crop.height).setFlipX(layer.flipX??false).setDepth(depth).setName(`occlusion:${layer.id}`);
    }
  }
  private createRoomDoors(){
    const room=this.physicalRoom;if(!room)return;
    for(const definition of room.doors){
      this.doorStates.set(definition.id,definition.initialState);
      const collider=this.add.rectangle(definition.x,definition.y,definition.width,definition.height,0x15191e).setVisible(false).setName(`collider:${definition.id}`);
      this.physics.add.existing(collider,true);
      const body=collider.body as Phaser.Physics.Arcade.StaticBody;body.enable=definition.initialState==='closed';
      if(this.current!==SCENES.LYDIA_ROOM)this.physics.add.collider(this.player,collider);
      this.doorColliders.set(definition.id,collider);
      const leaf=this.createDoorLeaf(definition);
      if(leaf)this.doorLeaves.set(definition.id,leaf);
    }
  }
  private createDoorLeaf(definition:DoorDefinition){
    const config=definition.leaf;if(!config)return undefined;
    let textureKey:string|undefined;
    if(definition.leafAsset==='lydiaDoorLeaf'&&this.textures.exists(ART_ASSETS.lydiaDoorLeaf.key))textureKey=ART_ASSETS.lydiaDoorLeaf.key;
    if(definition.leafAsset==='bakerDoorLeaf'&&this.textures.exists(ART_ASSETS.bakerDoorLeaf.key))textureKey=ART_ASSETS.bakerDoorLeaf.key;
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
      .filter(d=>this.current===SCENES.LYDIA_ROOM&&this.playerWorldPosition
        ?lydiaDistanceXZ(this.playerWorldPosition,LYDIA_DOOR_WORLD)<=d.interactionRange/42
        :Math.hypot(this.player.x-d.x,this.player.y-d.y)<=d.interactionRange)
      .sort((a,b)=>this.current===SCENES.LYDIA_ROOM?0:
        Math.hypot(this.player.x-a.x,this.player.y-a.y)-Math.hypot(this.player.x-b.x,this.player.y-b.y))[0];
    if(door)this.toggleDoor(door);
  }
  private toggleDoor(door:DoorDefinition){
    const collider=this.doorColliders.get(door.id),leaf=this.doorLeaves.get(door.id),config=door.leaf;
    if(!collider?.body||!leaf||!config||this.doorAnimating.has(door.id))return;
    const current=this.doorStates.get(door.id)??door.initialState,closing=current==='open';
    this.doorStates.set(door.id,closing?'closing':'opening');this.doorAnimating.add(door.id);
    (collider.body as Phaser.Physics.Arcade.StaticBody).enable=closing;
    window.dispatchEvent(new CustomEvent('misu:door-state',{detail:{scene:this.current,doorId:door.id,state:closing?'closing':'opening'}}));
    this.tweens.add({targets:leaf,rotation:closing?config.closedRotation:config.openRotation,duration:260,ease:'Sine.easeInOut',onComplete:()=>{
      const state=closing?'closed':'open';this.doorStates.set(door.id,state);this.doorAnimating.delete(door.id);
      (collider.body as Phaser.Physics.Arcade.StaticBody).enable=closing;
      window.dispatchEvent(new CustomEvent('misu:door-state',{detail:{scene:this.current,doorId:door.id,state}}));
    }});
  }
  private drawRoom(id:SceneId){
    this.add.rectangle(this.worldBounds.width/2,this.worldBounds.height/2,this.worldBounds.width,this.worldBounds.height,0x332a25).setDepth(-20);
    if(id===SCENES.HALL&&this.textures.exists(ART_ASSETS.manorCorridorRoomBase.key)){
      this.add.image(this.worldBounds.width/2,this.worldBounds.height/2,ART_ASSETS.manorCorridorRoomBase.key).setDisplaySize(this.worldBounds.width,this.worldBounds.height).setDepth(-19).setName('manor-corridor-room-base');
      const texture=this.textures.get(ART_ASSETS.corridorDecor.key);
      const frame=(name:string,x:number,y:number,w:number,h:number)=>{if(!texture.has(name))texture.add(name,0,x,y,w,h);};
      const prop=(name:string,x:number,y:number,w:number,h:number,depth:number)=>this.add.image(x,y,ART_ASSETS.corridorDecor.key,name).setDisplaySize(w,h).setDepth(depth).setName(`hall:${name}`);
      frame('hall-sconce-a',84,78,256,238);frame('hall-sconce-b',370,78,230,276);
      frame('hall-runner',56,718,1140,253);frame('hall-console',100,416,662,266);frame('hall-vase',824,410,204,270);
      frame('hall-candlestick',1084,420,132,260);frame('hall-portrait-a',638,62,207,279);
      frame('hall-portrait-b',941,84,198,261);frame('hall-portrait-c',1222,84,244,280);
      prop('hall-sconce-a',111,38,30,32,38);prop('hall-sconce-b',279,38,30,32,38);
      prop('hall-sconce-b',515,38,28,33,38);
      prop('hall-portrait-a',145,52,23,30,53);prop('hall-portrait-b',354,48,23,30,50);prop('hall-portrait-c',629,58,25,30,62);
      if(this.textures.exists(ART_ASSETS.manorCorridorLydiaThreshold.key)){
        this.add.image(210,161.5,ART_ASSETS.manorCorridorLydiaThreshold.key).setDisplaySize(54,21).setDepth(161.5).setName('hall:lydia-threshold-rug');
      }
      prop('hall-console',650,130,74,34,148);
      prop('hall-vase',637,103,16,22,116);
      prop('hall-candlestick',663,104,13,23,117);
      this.add.image(405,69,ART_ASSETS.manorCorridorDoorLeaf.key).setDisplaySize(31,62).setDepth(101).setName('hall:secondary-door-a');
      this.add.image(565,69,ART_ASSETS.manorCorridorDoorLeaf.key).setDisplaySize(31,62).setFlipX(true).setDepth(101).setName('hall:secondary-door-b');
      return;
    }
    if(id===SCENES.BAKER_STREET&&this.textures.exists(ART_ASSETS.bakerRoomBase.key)){
      this.add.image(this.worldBounds.width/2,this.worldBounds.height/2,ART_ASSETS.bakerRoomBase.key)
        .setDisplaySize(this.worldBounds.width,this.worldBounds.height).setDepth(-19).setName('baker-room-base');
      if(this.textures.exists(ART_ASSETS.bakerEntryPatch.key)){
        // This generated architecture crop covers the misplaced draft opening and exposes the
        // existing x=428..470 south threshold without laying a large replacement rectangle over the floor.
        this.add.image(435.1,306.775,ART_ASSETS.bakerEntryPatch.key).setDisplaySize(98.35,51.25).setDepth(-18.8).setName('baker-entry-architecture');
      }
      for(const visual of this.physicalRoom?.propVisuals??[]){
        const key=this.textureKey(visual.asset),frame=`physical-${id}-${visual.id}`;
        if(!this.textures.exists(key))continue;
        const texture=this.textures.get(key);
        if(!texture.has(frame))texture.add(frame,0,visual.source.x,visual.source.y,visual.source.width,visual.source.height);
        this.add.image(visual.display.x,visual.display.y,key,frame).setDisplaySize(visual.display.width,visual.display.height).setFlipX(visual.flipX??false).setDepth(visual.depthY).setName(`prop:${visual.id}`);
      }
      return;
    }
    if(id===SCENES.LYDIA_ROOM){
      const required=[ART_ASSETS.lydiaWorldRoomBase,...LYDIA_WORLD_ENTITIES.map(entity=>({key:entity.visual.texture})),...LYDIA_WALL_MOUNTED.map(entity=>({key:entity.visual.texture}))];
      const missing=required.filter(asset=>!this.textures.exists(asset.key)).map(asset=>asset.key);
      if(missing.length)throw new Error(`Lydia Bedroom scene graph cannot render without required assets: ${missing.join(', ')}`);
      this.add.image(this.worldBounds.width/2,this.worldBounds.height/2,ART_ASSETS.lydiaWorldRoomBase.key)
        .setDisplaySize(this.worldBounds.width,this.worldBounds.height).setDepth(-19).setName('room-architecture:lydia-room');
      this.drawLydiaSceneGraph();
      return;
    }
      this.addTileFrame('floor-boards',10,8,160,160);
      this.addTileFrame('wall-panel',12,356,152,198);
      this.addTileFrame('doorway',704,574,143,210);
    if(this.textures.exists('interior-tiles') && this.textures.get('interior-tiles').has('floor-boards')){
      this.add.tileSprite(this.worldBounds.width/2,this.worldBounds.height/2,this.worldBounds.width,this.worldBounds.height,'interior-tiles','floor-boards').setTileScale(.1).setDepth(-19);
    }
    this.drawPerimeter(id);
    if(id===SCENES.HALL) {
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
  private drawLydiaSceneGraph(){
    for(const entity of LYDIA_SCENE_GRAPH.entities){
      const visual=entity.visual,texture=this.textures.get(visual.texture);
      if(!texture?.get('__BASE'))throw new Error(`Lydia world entity '${entity.id}' has no visual texture '${visual.texture}'`);
      const z=visual.anchor==='ground-front-center'?entity.footprint.z+entity.footprint.depth:entity.position.z;
      const point=LYDIA_PROJECTION.projectFloor({x:entity.position.x,z}),scale=LYDIA_PROJECTION.scaleAt(z);
      const image=this.add.image(point.x,point.y,visual.texture)
        .setOrigin(.5,visual.anchor==='ground-center'?.5:1)
        .setDisplaySize(visual.displayWidth*scale,visual.displayHeight*scale)
        .setDepth(entity.category==='floor-covering'?3890:entityDepthKey(entity.position,LYDIA_PROJECTION))
        .setName(`world-entity:${entity.id}`);
      this.lydiaEntitySprites.set(entity.id,image);
    }
    for(const entity of LYDIA_SCENE_GRAPH.wallMounted){
      const visual=entity.visual,point=LYDIA_PROJECTION.project(entity.position),scale=LYDIA_PROJECTION.scaleAt(entity.position.z);
      const image=this.add.image(point.x,point.y,visual.texture).setOrigin(.5,.5)
        .setDisplaySize(visual.displayWidth*scale,visual.displayHeight*scale)
        .setDepth(entityDepthKey(entity.position,LYDIA_PROJECTION)).setName(`wall-entity:${entity.id}`);
      this.lydiaWallSprites.set(entity.id,image);
    }
    this.syncLydiaEntityDepths();
  }
  private syncLydiaEntityDepths(){
    const player=this.playerWorldPosition;if(!player)return;
    const playerDepth=entityDepthKey(player,LYDIA_PROJECTION);
    for(const entity of LYDIA_SCENE_GRAPH.entities){
      const sprite=this.lydiaEntitySprites.get(entity.id);if(!sprite)continue;
      if(!entity.castsOcclusion){sprite.setDepth(3890);continue;}
      const relation=entityOcclusionRelation(player,entity,LYDIA_PROJECTION),base=entityDepthKey(entity.position,LYDIA_PROJECTION);
      sprite.setDepth(relation==='entity-over-player'?Math.max(base,playerDepth+.01):Math.min(base,playerDepth-.01));
    }
    for(const entity of LYDIA_SCENE_GRAPH.wallMounted){
      const sprite=this.lydiaWallSprites.get(entity.id);if(sprite)sprite.setDepth(entityDepthKey(entity.position,LYDIA_PROJECTION));
    }
  }
  private getLydiaSceneGraphAudit(){
    const architecture=this.children.list.find(child=>child.name==='room-architecture:lydia-room') as Phaser.GameObjects.Image|undefined;
    const player=this.playerWorldPosition;
    return {
      architecture:{owner:architecture?'architecture-only room base':'missing',texture:architecture?.texture.key,size:LYDIA_ROOM_ARCHITECTURE.size,planes:['floor','north-wall','south-wall','west-wall','east-wall'],openings:LYDIA_ROOM_ARCHITECTURE.openings},
      camera:LYDIA_SCENE_CAMERA,
      groups:LYDIA_FURNITURE_GROUPS,
      entities:LYDIA_SCENE_GRAPH.entities.map(entity=>({id:entity.id,position:{...entity.position},dimensions:{...entity.dimensions},volume:entityVolume(entity),occupiedVolumes:entity.occupiedVolumes,clearanceVolumes:entity.clearanceVolumes??[],anchors:entity.anchors,footprint:{...entity.footprint},visualOwner:'WorldEntity',texture:entity.visual.texture,cameraId:entity.visual.cameraId,authoredYawDegrees:entity.visual.yawDegrees,displaySize:{width:entity.visual.displayWidth,height:entity.visual.displayHeight},sourceSize:{width:this.lydiaEntitySprites.get(entity.id)?.frame.width,height:this.lydiaEntitySprites.get(entity.id)?.frame.height},screenPosition:{x:this.lydiaEntitySprites.get(entity.id)?.x,y:this.lydiaEntitySprites.get(entity.id)?.y},renderDepth:this.lydiaEntitySprites.get(entity.id)?.depth,occlusion:entity.castsOcclusion})),
      wallMounted:LYDIA_SCENE_GRAPH.wallMounted.map(entity=>({id:entity.id,position:{...entity.position},dimensions:{...entity.dimensions},visualOwner:'WallMountedEntity',texture:entity.visual.texture,cameraId:entity.visual.cameraId,authoredYawDegrees:entity.visual.yawDegrees,displaySize:{width:entity.visual.displayWidth,height:entity.visual.displayHeight},sourceSize:{width:this.lydiaWallSprites.get(entity.id)?.frame.width,height:this.lydiaWallSprites.get(entity.id)?.frame.height},renderDepth:this.lydiaWallSprites.get(entity.id)?.depth})),
      player:player?{position:{...player},footScreen:LYDIA_PROJECTION.project({x:player.x,y:0,z:player.z}),collisionVolume:LYDIA_PLAYER_COLLISION_VOLUME,renderDepth:this.player?.depth}:undefined,
      furnitureAssetFallback:false,
    };
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
  private ensureWatsonFrames(){
    if(!this.textures.exists(ART_ASSETS.watson.key))return;
    const texture=this.textures.get(ART_ASSETS.watson.key),source=texture.getSourceImage() as HTMLImageElement;
    const names=['south','south-walk','north','east'];
    for(let row=0;row<4;row++)for(let col=0;col<4;col++){
      const x=Math.round(col*source.width/4),x2=Math.round((col+1)*source.width/4);
      const y=Math.round(row*source.height/4),y2=Math.round((row+1)*source.height/4);
      const name=`watson-${names[row]}-${col}`;
      if(!texture.has(name)){
        const canvas=document.createElement('canvas');canvas.width=x2-x;canvas.height=y2-y;
        const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)continue;
        context.drawImage(source,x,y,x2-x,y2-y,0,0,x2-x,y2-y);
        const alpha=context.getImageData(0,0,canvas.width,canvas.height).data;
        let minX=canvas.width,minY=canvas.height,maxX=-1,maxY=-1;
        for(let py=0;py<canvas.height;py++)for(let px=0;px<canvas.width;px++)if(alpha[(py*canvas.width+px)*4+3]>8){
          minX=Math.min(minX,px);minY=Math.min(minY,py);maxX=Math.max(maxX,px);maxY=Math.max(maxY,py);
        }
        if(maxX>=minX&&maxY>=minY)texture.add(name,0,x+minX,y+minY,maxX-minX+1,maxY-minY+1);
      }
    }
  }
  private createWatsonActor(id:SceneId){
    if(id!==WATSON_ACTOR.scene||!this.textures.exists(WATSON_ACTOR.texture))return;
    const x=WATSON_ACTOR.x,feetY=WATSON_ACTOR.feetY;
    this.watsonCastShadow=this.add.ellipse(x+3,feetY+2,24,5,0x10131a,0.11).setDepth(feetY-0.3).setName('actor-shadow:watson-cast');
    this.watsonContactShadow=this.add.ellipse(x,feetY,15,4,0x0a0908,0.27).setDepth(feetY-0.1).setName('actor-shadow:watson-contact');
    this.watsonActor=this.add.sprite(x,feetY-WATSON_ACTOR.height/2,WATSON_ACTOR.texture,WATSON_ACTOR.idleFrame)
      .setScale(WATSON_ACTOR.height/this.textures.get(WATSON_ACTOR.texture).get(WATSON_ACTOR.idleFrame).height).setDepth(feetY).setName('actor:watson');
    this.physics.add.existing(this.watsonActor,true);
    const body=this.watsonActor.body as Phaser.Physics.Arcade.StaticBody,sx=this.watsonActor.scaleX,sy=this.watsonActor.scaleY;
    body.setSize(WATSON_ACTOR.collisionWidth/sx,WATSON_ACTOR.collisionHeight/sy);
    body.setOffset(this.watsonActor.frame.width/2-WATSON_ACTOR.collisionWidth/(2*sx),this.watsonActor.frame.height-WATSON_ACTOR.collisionHeight/sy);
    this.updateWatsonLighting();
    window.dispatchEvent(new CustomEvent('misu:world-actor-ready',{detail:{id:'watson',scene:id,x,feetY}}));
  }
  private updateWatsonLighting(){
    if(!this.physicalRoom||!this.watsonActor)return;
    const x=WATSON_ACTOR.x,y=WATSON_ACTOR.feetY;
    let warm=0,cool=0;
    for(const light of this.physicalRoom.lights){
      const distance=Math.hypot(x-light.x,y-light.y),weight=Math.max(0,1-distance/light.radius),value=weight*weight*light.intensity;
      if(light.kind==='warm')warm+=value;else cool+=value;
    }
    const ambient=this.current===SCENES.BAKER_STREET?[0.75,0.75,0.74]:[0.59,0.61,0.70];
    const channels=[ambient[0]+warm*0.27+cool*0.005,ambient[1]+warm*0.14+cool*0.025,ambient[2]-warm*0.12+cool*0.08]
      .map(value=>Math.max(0.25,Math.min(1,value))*255|0);
    this.watsonActor.setTint((channels[0]<<16)|(channels[1]<<8)|channels[2]);
    this.watsonActor.setDepth(WATSON_ACTOR.feetY);
    this.watsonContactShadow?.setPosition(x,y).setDepth(y-0.1);
    this.watsonCastShadow?.setPosition(x+4,y+2).setDepth(y-0.3);
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
    if(this.debugGraphics&&this.current===SCENES.LYDIA_ROOM){
      if(Phaser.Input.Keyboard.JustDown(this.keys.F7)){
        this.lydiaSchematicVisible=!this.lydiaSchematicVisible;
        this.lydiaSchematicGraphics?.setVisible(this.lydiaSchematicVisible);this.lydiaSchematicLabel?.setVisible(this.lydiaSchematicVisible);this.lydiaDeskSectionLabel?.setVisible(this.lydiaSchematicVisible);
        if(this.lydiaSchematicVisible)this.drawLydia3DSchematic();
        window.dispatchEvent(new CustomEvent('misu:world-schematic',{detail:{enabled:this.lydiaSchematicVisible,entities:LYDIA_WORLD_ENTITIES.length,wallMounted:LYDIA_WALL_MOUNTED.length}}));
      }
      if(Phaser.Input.Keyboard.JustDown(this.keys.F8)){
        this.lydiaPerspectiveVisible=!this.lydiaPerspectiveVisible;
        this.lydiaPerspectiveGraphics?.setVisible(this.lydiaPerspectiveVisible);this.lydiaPerspectiveLabel?.setVisible(this.lydiaPerspectiveVisible);
        for(const label of this.lydiaPerspectiveNames.values())label.setVisible(this.lydiaPerspectiveVisible);
        if(this.lydiaPerspectiveVisible)this.drawLydiaAssetPerspectiveAxes();
        window.dispatchEvent(new CustomEvent('misu:asset-perspective-debug',{detail:{enabled:this.lydiaPerspectiveVisible,camera:LYDIA_SCENE_CAMERA,entities:LYDIA_SCENE_GRAPH.entities.filter(entity=>entity.category!=='floor-covering').map(entity=>({id:entity.id,position:entity.position,dimensions:entity.dimensions,cameraId:entity.visual.cameraId,yawDegrees:entity.visual.yawDegrees,displaySize:{width:entity.visual.displayWidth,height:entity.visual.displayHeight},texture:entity.visual.texture})),wallMounted:LYDIA_SCENE_GRAPH.wallMounted.map(entity=>({id:entity.id,position:entity.position,dimensions:entity.dimensions,cameraId:entity.visual.cameraId,yawDegrees:entity.visual.yawDegrees,displaySize:{width:entity.visual.displayWidth,height:entity.visual.displayHeight},texture:entity.visual.texture}))}}));
      }
      let layerChanged=false;
      for(const [key,layer] of [['F4','projection'],['F5','collision'],['F6','interaction']] as const){
        if(Phaser.Input.Keyboard.JustDown(this.keys[key])){this.lydiaDebugLayers[layer]=!this.lydiaDebugLayers[layer];layerChanged=true;}
      }
      if(Phaser.Input.Keyboard.JustDown(this.keys.F3)){
        this.debugGraphics.setVisible(!this.debugGraphics.visible);this.debugLabel?.setVisible(this.debugGraphics.visible);
        for(const label of this.debugNames.values())label.setVisible(this.debugGraphics.visible);
        window.dispatchEvent(new CustomEvent('misu:physics-debug',{detail:{enabled:this.debugGraphics.visible,layers:{...this.lydiaDebugLayers}}}));
      }else if(layerChanged&&this.debugGraphics.visible){
        this.drawLydiaWorldDebug(this.debugGraphics);
        window.dispatchEvent(new CustomEvent('misu:physics-debug',{detail:{enabled:true,layers:{...this.lydiaDebugLayers}}}));
      }
    }else if(Phaser.Input.Keyboard.JustDown(this.keys.F3)&&this.debugGraphics){
      this.debugGraphics.setVisible(!this.debugGraphics.visible);this.debugLabel?.setVisible(this.debugGraphics.visible);
      for(const label of this.debugNames.values())label.setVisible(this.debugGraphics.visible);
      window.dispatchEvent(new CustomEvent('misu:physics-debug',{detail:{enabled:this.debugGraphics.visible}}));
    }
    if(Phaser.Input.Keyboard.JustDown(this.keys.O))this.toggleNearbyDoor();
    if(this.uiBlocked){(this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0,0);if(this.player.anims.isPlaying){this.player.anims.stop();this.setHolmesIdleFrame();}this.updateHolmesLighting();this.updateRoomFeedback();return;}
    let x=this.virtual.x,y=this.virtual.y;
    if(this.cursors.left.isDown||this.keys.A.isDown)x-=1;
    if(this.cursors.right.isDown||this.keys.D.isDown)x+=1;
    if(this.cursors.up.isDown||this.keys.W.isDown)y-=1;
    if(this.cursors.down.isDown||this.keys.S.isDown)y+=1;
    const magnitude=Math.hypot(x,y); const length=magnitude||1;
    const body=this.player.body as Phaser.Physics.Arcade.Body;
    if(this.current===SCENES.LYDIA_ROOM)this.moveLydiaWorld(x/length*magnitude,y/length*magnitude,delta);
    else body.setVelocity(x/length*92,y/length*92);
    if(magnitude>0){
      this.facing=Math.abs(x)>Math.abs(y)?'east':y<0?'north':'south';
      this.player.setFlipX(this.facing==='east'&&x<0);
      const phase16=(this.current===SCENES.LYDIA_ROOM||this.current===SCENES.BAKER_STREET||this.current===SCENES.HALL)&&this.textures.exists('holmes-phase16');
      const animation=`${phase16?'holmes16':'holmes'}-walk-${this.facing}`;
      if(this.anims.exists(animation)&&!this.player.anims.isPlaying) this.player.play(animation);
      else if(this.anims.exists(animation)&&this.player.anims.currentAnim?.key!==animation) this.player.play(animation);
    } else if(this.player.anims.isPlaying) {
      this.player.anims.stop();
      this.setHolmesIdleFrame();
    }
    if(this.current===SCENES.LYDIA_ROOM||this.current===SCENES.BAKER_STREET||this.current===SCENES.HALL){
      // Normalize each source crop by height with one scalar so frame aspect stays intact.
      const perspective=this.current===SCENES.LYDIA_ROOM&&this.playerWorldPosition?LYDIA_PROJECTION.scaleAt(this.playerWorldPosition.z):1;
      this.player.setScale(this.heroDisplayHeight/this.player.frame.height*perspective);
      if(this.current!==SCENES.LYDIA_ROOM)this.syncPhase16PlayerFootprint();
    }
    const feetY=this.getPlayerFeetY();
    this.player.setDepth(this.current===SCENES.LYDIA_ROOM&&this.playerWorldPosition?entityDepthKey(this.playerWorldPosition,LYDIA_PROJECTION):feetY);
    if(this.current===SCENES.LYDIA_ROOM){this.syncLydiaEntityDepths();if(this.lydiaSchematicVisible)this.drawLydia3DSchematic();}
    this.updateHolmesLighting();
    this.updateRoomFeedback();
    if(Phaser.Input.Keyboard.JustDown(this.keys.J)) window.dispatchEvent(new CustomEvent('misu:action',{detail:{action:'notebook'}}));
    if(Phaser.Input.Keyboard.JustDown(this.keys.K)) window.dispatchEvent(new CustomEvent('misu:action',{detail:{action:'reasoning'}}));
    this.positionClock+=delta;
    this.lightingClock+=delta;
    if(this.physicalRoom&&this.lightingClock>=150){this.lightingClock=0;const influences=this.physicalRoom.lights.reduce((acc,light)=>{const d=Math.hypot(this.player.x-light.x,this.player.y-light.y),t=Math.max(0,1-d/light.radius),value=t*t*light.intensity;acc[light.kind]+=value;return acc;},{warm:0,cool:0});window.dispatchEvent(new CustomEvent('misu:light-response',{detail:{scene:this.current,warm:influences.warm,cool:influences.cool,tint:this.player.tintTopLeft}}));}
    if(this.positionClock>=100){this.positionClock=0;const projectionScreen=this.playerWorldPosition?LYDIA_PROJECTION.project(this.playerWorldPosition):undefined;const collision=this.current===SCENES.LYDIA_ROOM&&this.playerWorldPosition?findLydiaCollision(this.playerWorldPosition,this.doorStates.get('bedroom-entry')!=='open'):undefined;window.dispatchEvent(new CustomEvent('misu:player-position',{detail:{scene:this.current,x:this.player.x,y:this.player.y,feetY:this.getPlayerFeetY(),footAnchorScreen:this.current===SCENES.LYDIA_ROOM?{x:this.player.x,y:this.player.y}:undefined,projectionScreen:this.current===SCENES.LYDIA_ROOM?projectionScreen:undefined,worldDepthKey:this.current===SCENES.LYDIA_ROOM&&this.playerWorldPosition?entityDepthKey(this.playerWorldPosition,LYDIA_PROJECTION):undefined,worldPosition3D:this.playerWorldPosition?{...this.playerWorldPosition}:undefined,worldGroundFootprint:this.current===SCENES.LYDIA_ROOM?{...LYDIA_PLAYER_FOOTPRINT}:undefined,characterCollisionVolume:this.current===SCENES.LYDIA_ROOM?{...LYDIA_PLAYER_COLLISION_VOLUME}:undefined,collisionAtPosition:collision,lastMovementBlock:this.current===SCENES.LYDIA_ROOM?this.lastLydiaMovementBlock:undefined,inputLocked:this.uiBlocked,displayScale:{x:this.player.scaleX,y:this.player.scaleY},doorOpen:this.doorStates.get('bedroom-entry')==='open',body:{x:body.x,y:body.y,width:body.width,height:body.height}}}));
      const nearest=this.physicalRoom?.doors.map(d=>({door:d,distance:this.current===SCENES.LYDIA_ROOM&&this.playerWorldPosition
        ?lydiaDistanceXZ(this.playerWorldPosition,LYDIA_DOOR_WORLD)
        :Math.hypot(this.player.x-d.x,this.player.y-d.y)})).filter(v=>v.distance<=(this.current===SCENES.LYDIA_ROOM?v.door.interactionRange/42:v.door.interactionRange)).sort((a,b)=>a.distance-b.distance)[0];
      window.dispatchEvent(new CustomEvent('misu:door-availability',{detail:{available:!!nearest,doorId:nearest?.door.id,state:nearest?this.doorStates.get(nearest.door.id):undefined}}));}
  }
  private moveLydiaWorld(inputX:number,inputZ:number,delta:number){
    const current=this.playerWorldPosition;if(!current)return;
    const speed=2.15,step=delta/1000;
    const doorClosed=this.doorStates.get('bedroom-entry')==='closed'||this.doorStates.get('bedroom-entry')==='closing';
    this.lastLydiaMovementBlock=undefined;
    const nextX={x:current.x+inputX*speed*step,z:current.z};
    const blockX=findLydiaCollision(nextX,doorClosed);if(blockX)this.lastLydiaMovementBlock=blockX;else current.x=nextX.x;
    const nextZ={x:current.x,z:current.z+inputZ*speed*step};
    const blockZ=findLydiaCollision(nextZ,doorClosed);if(blockZ)this.lastLydiaMovementBlock=blockZ;else current.z=nextZ.z;
    current.y=0;
    const projected=LYDIA_PROJECTION.project(current);
    this.player.setPosition(projected.x,projected.y);
    const body=this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0,0);body.updateFromGameObject();
  }
  private getPlayerFeetY(){return this.player.y+this.actorFeetOffset}
  private updateRoomFeedback(){
    if(!this.physicalRoom)return;
    const feetY=this.getPlayerFeetY();
    const surface=this.current===SCENES.LYDIA_ROOM&&this.playerWorldPosition
      ?isWithinGroundFootprint(this.playerWorldPosition,LYDIA_RUG_FOOTPRINT)?'RUG':'WOOD'
      :roomSurfaceAt(this.physicalRoom,this.player.x,feetY);
    if(surface!==this.currentSurface){
      this.currentSurface=surface;
      window.dispatchEvent(new CustomEvent('misu:surface',{detail:{surface,x:this.player.x,y:feetY,worldPosition3D:this.playerWorldPosition?{...this.playerWorldPosition}:undefined}}));
    }
    if(this.debugGraphics?.visible)this.drawPhysicsDebug(feetY);
  }
  private drawPhysicsDebug(feetY:number){
    const g=this.debugGraphics,room=this.physicalRoom;if(!g||!room)return;
    if(this.current===SCENES.LYDIA_ROOM){this.drawLydiaWorldDebug(g);return;}
    g.clear();g.lineStyle(1,0xf4cf74,0.85);g.strokeRect(0,0,this.worldBounds.width,this.worldBounds.height);
    const walkable=room.walkableBounds??{x:16,y:16,width:this.worldBounds.width-32,height:this.worldBounds.height-32};
    g.fillStyle(0x53b989,0.035);g.fillRect(walkable.x,walkable.y,walkable.width,walkable.height);
    g.lineStyle(2,0x53b989,0.95);g.strokeRect(walkable.x,walkable.y,walkable.width,walkable.height);
    for(const region of room.surfaces){g.fillStyle(region.surface==='RUG'?0x839bdf:0x82c9a0,0.11);g.fillRect(region.x,region.y,region.width,region.height);g.lineStyle(1,region.surface==='RUG'?0x9b9efa:0x75caa0,0.75);g.strokeRect(region.x,region.y,region.width,region.height);}
    for(const body of this.physics.world.staticBodies.entries){
      const name=body.gameObject?.name??'static body',isWall=room.walls.some(f=>`collider:${f.id}`===name);
      g.lineStyle(1,isWall?0x62c6a5:0xe4a45d,0.95);g.strokeRect(body.x,body.y,body.width,body.height);
      this.debugText(String(name).replace(/^collider:/,''),body.x+body.width/2,body.y+body.height+7);
    }
    for(const exit of room.exits){g.lineStyle(1,0x67d4e3,0.9);g.strokeRect(exit.x-exit.width/2,exit.y-exit.height/2,exit.width,exit.height);this.debugText(exit.id,exit.x-12,exit.y-exit.height/2-8);}
    for(const door of room.doors){const state=this.doorStates.get(door.id)??door.initialState,closed=state==='closed'||state==='closing';g.lineStyle(2,closed?0xff6978:0xd9c58a,0.95);g.strokeRect(door.x-door.width/2,door.y-door.height/2,door.width,door.height);g.lineStyle(1,0x8aa7db,0.8);g.strokeCircle(door.x,door.y,door.interactionRange);this.debugText(door.id,door.x+12,door.y-door.height/2-8);}
    for(const item of INTERACTABLES.filter(i=>i.scene===this.current)){g.lineStyle(1,0x78b9ee,0.68);g.strokeCircle(item.x,item.y,item.interactionRange);}
    const body=this.player.body as Phaser.Physics.Arcade.Body;g.lineStyle(2,0xff6978,1);g.strokeRect(body.x,body.y,body.width,body.height);
    g.lineStyle(1,0xf8df8c,0.9);g.lineBetween(this.player.x-10,feetY,this.player.x+10,feetY);
    const states=room.doors.map(d=>`${d.id}:${this.doorStates.get(d.id)}`).join(' ')||'no doors';
    this.debugLabel?.setText(`${room.debugLabel} · F3  O door  ${states}  ${this.currentSurface??room.defaultSurface}`);
  }
  private drawLydiaWorldDebug(g:Phaser.GameObjects.Graphics){
    const p=LYDIA_PROJECTION,player=this.playerWorldPosition;if(!player)return;
    this.debugLabel?.setY(48);
    g.clear();
    for(const label of this.debugNames.values())label.setVisible(false);
    if(this.lydiaDebugLayers.projection){
      // 1×1 logical floor grid projected onto the measured floor quadrilateral.
      g.lineStyle(1,0x6bc8d5,.42);
      for(let x=0;x<=p.size.width;x++){
        const a=p.projectFloor({x,z:0}),b=p.projectFloor({x,z:p.size.depth});g.lineBetween(a.x,a.y,b.x,b.y);
      }
      for(let z=0;z<=Math.ceil(p.size.depth);z++){
        const zz=Math.min(z,p.size.depth),a=p.projectFloor({x:0,z:zz}),b=p.projectFloor({x:p.size.width,z:zz});g.lineBetween(a.x,a.y,b.x,b.y);
      }
      const controls=[
        {name:'NW',world:{x:0,z:0},screen:p.floor.northwest,dx:24,dy:9},
        {name:'NE',world:{x:p.size.width,z:0},screen:p.floor.northeast,dx:-30,dy:9},
        {name:'SW',world:{x:0,z:p.size.depth},screen:p.floor.southwest,dx:24,dy:-9},
        {name:'SE',world:{x:p.size.width,z:p.size.depth},screen:p.floor.southeast,dx:-30,dy:-9},
      ];
      const quad=[p.floor.northwest,p.floor.northeast,p.floor.southeast,p.floor.southwest,p.floor.northwest];
      g.lineStyle(2,0xf3d279,.95);for(let i=1;i<quad.length;i++)g.lineBetween(quad[i-1].x,quad[i-1].y,quad[i].x,quad[i].y);
      for(const control of controls){
        g.fillStyle(0xffedaa,1);g.fillCircle(control.screen.x,control.screen.y,3);
        this.debugText(`${control.name} W(${control.world.x},${control.world.z}) S(${control.screen.x},${control.screen.y})`,control.screen.x+control.dx,control.screen.y+control.dy,'projection');
      }
      const projected=p.project(player);g.lineStyle(2,0xff6474,1);g.strokeCircle(projected.x,projected.y,5);g.lineBetween(projected.x-9,projected.y,projected.x+9,projected.y);
      const axis=p.projectFloor({x:0,z:0}),xEnd=p.projectFloor({x:1,z:0}),zEnd=p.projectFloor({x:0,z:1});
      g.lineStyle(2,0xff7777,.95);g.lineBetween(axis.x,axis.y,xEnd.x,xEnd.y);this.debugText('X +',xEnd.x+8,xEnd.y,'projection');
      g.lineStyle(2,0x91de91,.95);g.lineBetween(axis.x,axis.y,zEnd.x,zEnd.y);this.debugText('Z +',zEnd.x,zEnd.y+8,'projection');
    }
    if(this.lydiaDebugLayers.collision){
      const vertices=(footprint:GroundFootprint)=>footprint.polygon?.length&&footprint.polygon.length>=3
        ?footprint.polygon.map(v=>({x:footprint.x+v.x,z:footprint.z+v.z}))
        :[{x:footprint.x,z:footprint.z},{x:footprint.x+footprint.width,z:footprint.z},{x:footprint.x+footprint.width,z:footprint.z+footprint.depth},{x:footprint.x,z:footprint.z+footprint.depth}];
      for(const footprint of LYDIA_GROUND_FOOTPRINTS){
        const corners=vertices(footprint).map(v=>p.projectFloor(v));
        const wall=footprint.id.includes('wall');g.lineStyle(2,wall?0xff737e:0xf0a656,.9);
        for(let i=0;i<corners.length;i++){const a=corners[i],b=corners[(i+1)%corners.length];g.lineBetween(a.x,a.y,b.x,b.y);}
        this.debugText(footprint.id,corners[0].x,corners[0].y-5,'collision');
      }
      if(this.doorStates.get('bedroom-entry')!=='open'){
        const corners=vertices(LYDIA_CLOSED_DOOR).map(v=>p.projectFloor(v));g.lineStyle(2,0xff6978,1);
        for(let i=0;i<corners.length;i++){const a=corners[i],b=corners[(i+1)%corners.length];g.lineBetween(a.x,a.y,b.x,b.y);}
      }
      const playerCorners=[{x:player.x-LYDIA_PLAYER_FOOTPRINT.width/2,z:player.z-LYDIA_PLAYER_FOOTPRINT.depth/2},{x:player.x+LYDIA_PLAYER_FOOTPRINT.width/2,z:player.z-LYDIA_PLAYER_FOOTPRINT.depth/2},{x:player.x+LYDIA_PLAYER_FOOTPRINT.width/2,z:player.z+LYDIA_PLAYER_FOOTPRINT.depth/2},{x:player.x-LYDIA_PLAYER_FOOTPRINT.width/2,z:player.z+LYDIA_PLAYER_FOOTPRINT.depth/2}].map(v=>p.projectFloor(v));
      g.lineStyle(2,0xff6474,.85);for(let i=0;i<playerCorners.length;i++){const a=playerCorners[i],b=playerCorners[(i+1)%playerCorners.length];g.lineBetween(a.x,a.y,b.x,b.y);}
    }
    if(this.lydiaDebugLayers.interaction){
      for(const item of LYDIA_WORLD_INTERACTABLES){
        const anchor=p.projectFloor(item),target=p.project(item),color=0x79b8ff;
        g.lineStyle(1,color,.7);g.lineBetween(anchor.x,anchor.y,target.x,target.y);g.strokeCircle(target.x,target.y,3);
        // Interaction radius is drawn in world X/Z and projected as a faceted ellipse.
        g.lineStyle(1,color,.55);for(let i=0;i<32;i++){const a=i*Math.PI*2/32,b=(i+1)*Math.PI*2/32;
          const q=p.projectFloor({x:item.x+Math.cos(a)*item.interactionRange,z:item.z+Math.sin(a)*item.interactionRange});
          const r=p.projectFloor({x:item.x+Math.cos(b)*item.interactionRange,z:item.z+Math.sin(b)*item.interactionRange});g.lineBetween(q.x,q.y,r.x,r.y);}
        this.debugText(item.id,target.x,target.y-8,'interaction');
      }
      const roomDoor=this.physicalRoom?.doors[0],doorOpen=this.doorStates.get('bedroom-entry')==='open';
      if(roomDoor){
        g.lineStyle(1,0x90b7f0,.72);for(let i=0;i<32;i++){const a=i*Math.PI*2/32,b=(i+1)*Math.PI*2/32,radius=roomDoor.interactionRange/42;
          const q=p.projectFloor({x:LYDIA_DOOR_WORLD.x+Math.cos(a)*radius,z:LYDIA_DOOR_WORLD.z+Math.sin(a)*radius});
          const r=p.projectFloor({x:LYDIA_DOOR_WORLD.x+Math.cos(b)*radius,z:LYDIA_DOOR_WORLD.z+Math.sin(b)*radius});g.lineBetween(q.x,q.y,r.x,r.y);}
        this.debugText(`entry door ${doorOpen?'open':'closed'}`,p.projectFloor(LYDIA_DOOR_WORLD).x,p.projectFloor(LYDIA_DOOR_WORLD).y-11,'interaction');
      }
      const exitA=p.projectFloor({x:LYDIA_EXIT_WORLD.x-LYDIA_EXIT_WORLD.width/2,z:LYDIA_EXIT_WORLD.z-LYDIA_EXIT_WORLD.depth/2});
      const exitB=p.projectFloor({x:LYDIA_EXIT_WORLD.x+LYDIA_EXIT_WORLD.width/2,z:LYDIA_EXIT_WORLD.z+LYDIA_EXIT_WORLD.depth/2});
      g.lineStyle(2,0x65d4e3,.9);g.strokeRect(exitA.x,exitA.y,exitB.x-exitA.x,exitB.y-exitA.y);this.debugText('exit X/Z',exitA.x+12,exitA.y+8,'interaction');
    }
    const round=(n:number)=>n.toFixed(2);
    const projected=p.project(player),layers=this.lydiaDebugLayers;
    this.debugLabel?.setText(`WORLD x${round(player.x)} z${round(player.z)} y${round(player.y)} → S(${round(projected.x)},${round(projected.y)}) scale ${round(p.scaleAt(player.z))} · F3 all F4 Grid:${layers.projection?'ON':'OFF'} F5 Collision:${layers.collision?'ON':'OFF'} F6 Interaction:${layers.interaction?'ON':'OFF'}`);
  }
  private drawLydiaAssetPerspectiveAxes(){
    const g=this.lydiaPerspectiveGraphics;if(!g)return;g.clear();
    const p=LYDIA_PROJECTION;
    const drawAxes=(id:string,position:WorldPosition3D,dimensions:{width:number;height:number;depth:number},yawDegrees:number,wallMounted=false)=>{
      const yaw=yawDegrees*Math.PI/180,cos=Math.cos(yaw),sin=Math.sin(yaw),{width,height,depth}=dimensions;
      const projectLocal=(x:number,y:number,z:number)=>p.project({x:position.x+cos*x-sin*z,y:position.y+y,z:position.z+sin*x+cos*z});
      const originY=wallMounted?-height/2:.025,axisY=wallMounted?0:.025;
      const x0=projectLocal(-width/2,axisY,0),x1=projectLocal(width/2,axisY,0);
      const z0=projectLocal(0,axisY,-depth/2),z1=projectLocal(0,axisY,depth/2);
      const y0=projectLocal(0,originY,0),y1=projectLocal(0,wallMounted?height/2:height,0);
      g.lineStyle(2,0xff6b70,.95);g.lineBetween(x0.x,x0.y,x1.x,x1.y);
      g.lineStyle(2,0x71df93,.95);g.lineBetween(z0.x,z0.y,z1.x,z1.y);
      g.lineStyle(2,0x73b9ff,.95);g.lineBetween(y0.x,y0.y,y1.x,y1.y);
      const labelKey=id;
      let label=this.lydiaPerspectiveNames.get(labelKey);
      if(!label){label=this.add.text(0,0,`${id} yaw ${yawDegrees}°`,{fontFamily:'monospace',fontSize:'6px',color:'#fff0c8',backgroundColor:'#111820dd',padding:{x:2,y:1}}).setDepth(10006).setName(`debug:camera-asset:${id}`);this.lydiaPerspectiveNames.set(labelKey,label);}
      label.setPosition((x0.x+x1.x)/2+4,Math.min(x0.y,x1.y,y1.y)-8).setVisible(true);
    };
    for(const entity of LYDIA_SCENE_GRAPH.entities.filter(item=>item.category!=='floor-covering'))drawAxes(entity.id,entity.position,entity.dimensions,entity.visual.yawDegrees??0);
    for(const entity of LYDIA_SCENE_GRAPH.wallMounted)drawAxes(entity.id,entity.position,entity.dimensions,entity.visual.yawDegrees??0,true);
    this.lydiaPerspectiveLabel?.setText(`F8 CAMERA ${LYDIA_SCENE_CAMERA.id} · X red / Z green / Y blue\nFloor: NW(${p.floor.northwest.x},${p.floor.northwest.y}) NE(${p.floor.northeast.x},${p.floor.northeast.y}) SW(${p.floor.southwest.x},${p.floor.southwest.y}) SE(${p.floor.southeast.x},${p.floor.southeast.y})`);
  }
  private drawLydia3DSchematic(){
    const g=this.lydiaSchematicGraphics,player=this.playerWorldPosition;if(!g||!player)return;
    const p=LYDIA_PROJECTION;g.clear();
    const line=(a:WorldPosition3D,b:WorldPosition3D)=>{const pa=p.project(a),pb=p.project(b);g.lineBetween(pa.x,pa.y,pb.x,pb.y);};
    const floorEdge=(a:{x:number;z:number},b:{x:number;z:number})=>{const pa=p.projectFloor(a),pb=p.projectFloor(b);g.lineBetween(pa.x,pa.y,pb.x,pb.y);};
    const plane=(corners:WorldPosition3D[],color:number)=>{
      const points=corners.map(position=>p.project(position));g.fillStyle(color,.10);g.lineStyle(1,color,.8);
      g.beginPath();g.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)g.lineTo(points[i].x,points[i].y);g.closePath();g.fillPath();g.strokePath();
    };
    const box=(volume:{min:{x:number;y:number;z:number};max:{x:number;y:number;z:number}},color:number)=>{
      const {min,max}=volume;
      const c=[
        {x:min.x,y:min.y,z:min.z},{x:max.x,y:min.y,z:min.z},{x:max.x,y:min.y,z:max.z},{x:min.x,y:min.y,z:max.z},
        {x:min.x,y:max.y,z:min.z},{x:max.x,y:max.y,z:min.z},{x:max.x,y:max.y,z:max.z},{x:min.x,y:max.y,z:max.z},
      ];
      const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]] as const;
      g.lineStyle(1.5,color,.9);for(const [a,b] of edges)line(c[a],c[b]);
    };
    // Floor plane and 1×1 logical grid.
    g.lineStyle(1,0x65c8d8,.58);
    for(let x=0;x<=p.size.width;x++)floorEdge({x,z:0},{x,z:p.size.depth});
    for(let z=0;z<=Math.ceil(p.size.depth);z++){const depth=Math.min(z,p.size.depth);floorEdge({x:0,z:depth},{x:p.size.width,z:depth});}
    // Room boundary and translucent architectural planes. The west wall is split
    // around the actual door opening rather than drawn as one sealed rectangle.
    plane([{x:0,y:0,z:0},{x:p.size.width,y:0,z:0},{x:p.size.width,y:p.size.height,z:0},{x:0,y:p.size.height,z:0}],0x80bdd0);
    for(const side of ['west','east'] as const){
      const x=side==='west'?0:p.size.width;
      const opening=LYDIA_ROOM_ARCHITECTURE.openings.find(item=>item.wall===side);
      const spans=side==='west'&&opening?[[0,opening.from],[opening.to,p.size.depth]]:[[0,p.size.depth]];
      for(const [from,to] of spans)plane([{x,y:0,z:from},{x,y:0,z:to},{x,y:p.size.height,z:to},{x,y:p.size.height,z:from}],side==='west'?0xa4d3d4:0xd0ae83);
    }
    // Room boundary and south boundary edges.
    g.lineStyle(2,0xf0d17d,.95);
    for(const z of [0,p.size.depth])for(const x of [0,p.size.width])line({x,y:0,z},{x,y:p.size.height,z});
    line({x:0,y:0,z:0},{x:p.size.width,y:0,z:0});line({x:0,y:p.size.height,z:0},{x:p.size.width,y:p.size.height,z:0});
    line({x:0,y:0,z:p.size.depth},{x:p.size.width,y:0,z:p.size.depth});
    for(const x of [0,p.size.width]){line({x,y:0,z:0},{x,y:0,z:p.size.depth});line({x,y:p.size.height,z:0},{x,y:p.size.height,z:p.size.depth});}
    const colors=[0xffcc75,0xe89567,0x9dd28b,0x70b8e8,0xd18cc8,0x95a6ec,0xd6d987,0x9ae1d4];
    LYDIA_SCENE_GRAPH.entities.forEach((entity,index)=>{
      entity.occupiedVolumes.forEach(part=>box({min:{x:entity.position.x+part.min.x,y:part.min.y,z:entity.position.z+part.min.z},max:{x:entity.position.x+part.max.x,y:part.max.y,z:entity.position.z+part.max.z}},colors[index%colors.length]));
      (entity.clearanceVolumes??[]).forEach(part=>box({min:{x:entity.position.x+part.min.x,y:part.min.y,z:entity.position.z+part.min.z},max:{x:entity.position.x+part.max.x,y:part.max.y,z:entity.position.z+part.max.z}},0x57d7e5));
    });
    LYDIA_SCENE_GRAPH.wallMounted.forEach((entity,index)=>{
      const {width,height,depth}=entity.dimensions,position=entity.position;
      box({min:{x:position.x-width/2,y:position.y-height/2,z:position.z-depth/2},max:{x:position.x+width/2,y:position.y+height/2,z:position.z+depth/2}},colors[(LYDIA_SCENE_GRAPH.entities.length+index)%colors.length]);
    });
    // Holmes ground point, foot collider and vertical body projection.
    box({min:{x:player.x-LYDIA_PLAYER_COLLISION_VOLUME.width/2,y:0,z:player.z-LYDIA_PLAYER_COLLISION_VOLUME.depth/2},max:{x:player.x+LYDIA_PLAYER_COLLISION_VOLUME.width/2,y:LYDIA_PLAYER_COLLISION_VOLUME.height,z:player.z+LYDIA_PLAYER_COLLISION_VOLUME.depth/2}},0xff6576);
    const foot=p.project({x:player.x,y:0,z:player.z});
    const top=p.project({x:player.x,y:LYDIA_PLAYER_COLLISION_VOLUME.height,z:player.z});
    g.lineStyle(3,0xff6576,1);g.lineBetween(foot.x,foot.y,top.x,top.y);g.fillStyle(0xff6576,1);g.fillCircle(foot.x,foot.y,3);
    const halfX=LYDIA_PLAYER_COLLISION_VOLUME.width/2,halfZ=LYDIA_PLAYER_COLLISION_VOLUME.depth/2;
    const corners=[{x:player.x-halfX,z:player.z-halfZ},{x:player.x+halfX,z:player.z-halfZ},{x:player.x+halfX,z:player.z+halfZ},{x:player.x-halfX,z:player.z+halfZ}].map(v=>p.projectFloor(v));
    g.lineStyle(2,0xff6576,.95);for(let i=0;i<corners.length;i++){const a=corners[i],b=corners[(i+1)%corners.length];g.lineBetween(a.x,a.y,b.x,b.y);}
    const projected=p.project(player),round=(n:number)=>n.toFixed(2);
    this.lydiaSchematicLabel?.setText(`F7 3D SCHEMATIC · occupied volumes\nHolmes W(${round(player.x)},0,${round(player.z)}) → S(${round(projected.x)},${round(projected.y)})\nBody ${LYDIA_PLAYER_COLLISION_VOLUME.width}×${LYDIA_PLAYER_COLLISION_VOLUME.depth}×${LYDIA_PLAYER_COLLISION_VOLUME.height}`);
    // A compact side section makes the vertical-clearance rule immediately legible.
    const sx=10,sy=220,sw=116,sh=90,floorY=sy+sh-7,tableTop=floorY-(1/1.82)*(sh-24),tableBottom=floorY-(.84/1.82)*(sh-24);
    g.fillStyle(0x111820,.98);g.fillRect(sx,sy,sw,sh);g.lineStyle(1,0xd9c68e,.95);g.strokeRect(sx,sy,sw,sh);
    g.lineStyle(1,0xb99c6c,.8);g.lineBetween(sx+6,floorY,sx+sw-6,floorY);
    g.fillStyle(0x9a6b45,.98);g.fillRect(sx+66,tableTop,40,tableBottom-tableTop);g.fillRect(sx+70,tableBottom,6,floorY-tableBottom);g.fillRect(sx+97,tableBottom,6,floorY-tableBottom);
    g.fillStyle(0x77c6e0,.28);g.fillRect(sx+66,tableBottom,40,floorY-tableBottom);g.lineStyle(1,0x65d7ed,.98);g.strokeRect(sx+66,tableBottom,40,floorY-tableBottom);
    const holmesHeight=(LYDIA_PLAYER_COLLISION_VOLUME.height/1.82)*(sh-24);g.fillStyle(0xe66c73,.98);g.fillRect(sx+35,floorY-holmesHeight,16,holmesHeight);
  }
  private debugText(text:string,x:number,y:number,group:'projection'|'collision'|'interaction'='collision'){
    if(!this.debugGraphics?.visible)return;
    if(this.current===SCENES.LYDIA_ROOM&&!this.lydiaDebugLayers[group])return;
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
      const ambient=this.current===SCENES.BAKER_STREET?[0.75,0.75,0.74]:this.current===SCENES.HALL?[0.68,0.63,0.56]:[0.59,0.61,0.70];
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
    if((this.current===SCENES.LYDIA_ROOM||this.current===SCENES.BAKER_STREET||this.current===SCENES.HALL)&&this.textures.exists('holmes-phase16')){
      this.player.setTexture('holmes-phase16',`holmes16-${this.facing}-idle`);
      this.player.setScale(this.heroDisplayHeight/this.player.frame.height);
      if(this.player.body&&this.current!==SCENES.LYDIA_ROOM)this.syncPhase16PlayerFootprint();
    }
    else if(this.textures.exists('holmes-sheet'))this.player.setTexture('holmes-sheet',`holmes-${this.facing}-0`);
  }
  private syncPhase16PlayerFootprint(){
    const body=this.player.body as Phaser.Physics.Arcade.Body;
    const sx=this.player.scaleX,sy=this.player.scaleY;
    body.setSize(18/sx,10/sy,false);
    // setSize uses the body's cached scale; refresh it after animation frames change height.
    body.updateBounds();
    body.setOffset(this.player.frame.width/2-9/sx,this.player.frame.height-10/sy);
  }
  private interact(){ window.dispatchEvent(new CustomEvent('misu:action',{detail:{action:'interact',scene:this.current,x:this.player?.x,y:this.player?.y,worldPosition3D:this.playerWorldPosition?{...this.playerWorldPosition}:undefined,doorOpen:this.doorStates.get('bedroom-entry')==='open'}})); }
}
