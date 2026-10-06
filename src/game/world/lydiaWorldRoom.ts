import { INTERACTABLES } from '../../data/cases/silver-whistle/interactables';
import { SCENES } from '../../core/ids';
import { WorldProjection, type WorldPosition3D } from './WorldProjection';
import type { CharacterCollisionVolume, GroundFootprint, FurnitureGroup, SceneGraph3D, SceneEntity3D, WallMountedEntity, LocalOccupiedVolume3D, LocalClearanceVolume3D } from './sceneGraph3D';
import { worldOccupiedVolumes } from './sceneGraph3D';
export type { GroundFootprint } from './sceneGraph3D';

/** Optional ground polygons describe navigation/contact only; body blocking uses 3D volumes. */
export const LYDIA_WORLD_SIZE={width:10,depth:5.5,height:3.5} as const;

// Measured against the existing Bedroom floor plane: back edge follows the baseboard,
// front edge follows the inside of the south skirting. The slight taper matches the art.
export const LYDIA_PROJECTION=new WorldProjection(LYDIA_WORLD_SIZE,{
  northwest:{x:31,y:93},northeast:{x:449,y:93},
  southeast:{x:466,y:285},southwest:{x:14,y:285},
});

/** Camera contract shared by all Lydia Bedroom entity artwork. Yaw is baked into each image. */
export const LYDIA_SCENE_CAMERA={
  id:'lydia-bedroom-camera-v1',
  horizontalOrientation:'south-to-north',
  azimuthDegrees:0,
  elevationDegrees:37,
  rollDegrees:0,
  floorProjection:'bilinear-quadrilateral',
  floorQuad:LYDIA_PROJECTION.floor,
  verticalScale:LYDIA_PROJECTION.heightScale,
  perspectiveStrength:0.095,
  depthScale:{far:0.94,near:1.035},
  assetRule:'world X edges nearly horizontal; world Z recedes toward screen-up; vertical edges remain screen-vertical; object yaw is painted into the source image',
} as const;

export interface WorldRoomDefinition {
  id:'lydia-room'; size:typeof LYDIA_WORLD_SIZE; projection:WorldProjection;
  floorPlane:'xz'; northWall:{z:number}; southBoundary:{z:number}; westWall:{x:number}; eastWall:{x:number};
  footprints:GroundFootprint[];
  elevatedElements:{id:string;position:WorldPosition3D}[];
}

const wallFootprints:GroundFootprint[]=[
  {id:'north-wall',x:0,z:-.12,width:10,depth:.12},
  {id:'south-wall-west',x:0,z:5.42,width:.28,depth:.12},
  {id:'south-wall-east',x:.98,z:5.42,width:9.02,depth:.12},
  {id:'west-wall-north',x:-.12,z:0,width:.12,depth:3.36},
  {id:'west-wall-south',x:-.12,z:4.38,width:.12,depth:1.04},
  {id:'east-wall',x:9.9,z:0,width:.1,depth:5.5},
];
const bounds=(cx:number,cz:number,width:number,depth:number)=>({x:cx-width/2,z:cz-depth/2,width,depth});
const point=(x:number,z:number)=>({x,z});
const footprint=(id:string)=>LYDIA_GROUND_FOOTPRINTS.find(item=>item.id===id)!;
const volume=(id:string,minX:number,minY:number,minZ:number,maxX:number,maxY:number,maxZ:number):LocalOccupiedVolume3D=>({id,min:{x:minX,y:minY,z:minZ},max:{x:maxX,y:maxY,z:maxZ}});
const clearance=(id:string,minX:number,minY:number,minZ:number,maxX:number,maxY:number,maxZ:number):LocalClearanceVolume3D=>({id,min:{x:minX,y:minY,z:minZ},max:{x:maxX,y:maxY,z:maxZ},freeHeight:maxY-minY});

/** Functional groups keep related items connected by anchors when a group moves. */
export const LYDIA_FURNITURE_GROUPS:FurnitureGroup[]=[
  // Restore the earlier back-of-room sleeping composition. The whole group moves
  // north together, keeping bedside and rug offsets attached to the bed origin.
  {id:'sleeping',origin:{x:5.72,z:1.40},members:['bed','nightstand','rug'],offsets:{bed:{x:0,z:0},nightstand:{x:-1.115,z:-.99},rug:{x:0,z:.12}}},
  {id:'work',origin:{x:8.35,z:4.05},members:['desk','chair','safe'],offsets:{desk:{x:0,z:0},chair:{x:-1.60,z:.24},safe:{x:1.16,z:.52}}},
  {id:'dressing',origin:{x:8.95,z:1.02},members:['wardrobe','mirror'],offsets:{wardrobe:{x:0,z:0},mirror:{x:.83,z:1.22}}},
  {id:'wash',origin:{x:1.22,z:1.72},members:['washstand'],offsets:{washstand:{x:0,z:0}}},
];

const groupPosition=(groupId:FurnitureGroup['id'],member:string)=>{
  const group=LYDIA_FURNITURE_GROUPS.find(item=>item.id===groupId)!;const offset=group.offsets[member];
  return {x:group.origin.x+offset.x,z:group.origin.z+offset.z};
};
const bedPosition=groupPosition('sleeping','bed');
const deskPosition=groupPosition('work','desk');
const wardrobePosition=groupPosition('dressing','wardrobe');
const washstandPosition=groupPosition('wash','washstand');
const deskUsePoint={x:deskPosition.x-1.42/2-.18,z:deskPosition.z};
const layout={
  bed:{...bedPosition,width:1.55,depth:2.42,height:2.12,visualWidth:72.5,visualHeight:132},
  // Nightstand follows the bed's left/head anchor; the rug shares the bed center axis.
  nightstand:{...groupPosition('sleeping','nightstand'),width:.60,depth:.80,height:1.52,visualWidth:39,visualHeight:73},
  rug:{...groupPosition('sleeping','rug'),width:2.15,depth:2.25},
  desk:{...deskPosition,width:1.42,depth:.78,height:1.82,visualWidth:96,visualHeight:80},
  chair:({...groupPosition('work','chair'),width:.68,depth:.78,height:1.38,visualWidth:52,visualHeight:59}),
  safe:{...groupPosition('work','safe'),width:.55,depth:.62,height:1.20,visualWidth:42,visualHeight:59},
  wardrobe:{...wardrobePosition,width:1.25,depth:.70,height:2.55,visualWidth:61,visualHeight:104},
  washstand:{...washstandPosition,width:.92,depth:.69,height:1.72,visualWidth:62,visualHeight:90},
  mirror:groupPosition('dressing','mirror'),
} as const;
const entityFootprint=(id:string,item:{x:number;z:number;width:number;depth:number}):GroundFootprint=>({id,...bounds(item.x,item.z,item.width,item.depth)});
export const LYDIA_GROUND_FOOTPRINTS:GroundFootprint[]=[
  ...wallFootprints,
  entityFootprint('washstand',layout.washstand),entityFootprint('nightstand',layout.nightstand),entityFootprint('bed',layout.bed),
  entityFootprint('wardrobe',layout.wardrobe),entityFootprint('mirror-base',{x:layout.mirror.x,z:layout.mirror.z,width:.42,depth:.35}),
  entityFootprint('desk',layout.desk),entityFootprint('chair',layout.chair),entityFootprint('safe',layout.safe),
];
export const LYDIA_WORLD_ROOM:WorldRoomDefinition={
  id:'lydia-room',size:LYDIA_WORLD_SIZE,projection:LYDIA_PROJECTION,floorPlane:'xz',
  northWall:{z:0},southBoundary:{z:5.5},westWall:{x:0},eastWall:{x:10},footprints:LYDIA_GROUND_FOOTPRINTS,
  elevatedElements:[
    {id:'rain-window',position:{x:5.65,y:2.45,z:0}},
    {id:'vent-grille',position:{x:6.55,y:1.45,z:0}},
    {id:'north-wall-picture',position:{x:8.05,y:1.85,z:0}},
    {id:'wall-sconce',position:{x:4.5,y:1.25,z:0}},
  ],
};

/** Lydia runtime render/collision graph. The room base is architecture only. */
export const LYDIA_RUG_FOOTPRINT:GroundFootprint=entityFootprint('rug',layout.rug);
const anchors=(x:number,z:number,width:number,depth:number,usePoint?:{x:number;z:number},leftHeadSide?:{x:number;z:number})=>({
  front:point(x,z+depth/2),back:point(x,z-depth/2),left:point(x-width/2,z),right:point(x+width/2,z),center:point(x,z),usePoint,leftHeadSide,
});
const floorEntity=(id:string,texture:string,position:{x:number;z:number},dimensions:{width:number;height:number;depth:number},visual:{width:number;height:number},occupiedVolumes:LocalOccupiedVolume3D[],category:SceneEntity3D['category']='furniture',clearanceVolumes:LocalClearanceVolume3D[]=[],usePoint?:{x:number;z:number},leftHeadSide?:{x:number;z:number}):SceneEntity3D=>{
  const ground=category==='floor-covering'?LYDIA_RUG_FOOTPRINT:entityFootprint(id,{...position,width:dimensions.width,depth:dimensions.depth});
  const yawDegrees=({bed:0,nightstand:0,rug:0,wardrobe:0,washstand:0,desk:0,chair:0,safe:0} as Record<string,number>)[id]??0;
  const cameraId=id==='rug'?'floor-plane-camera':LYDIA_SCENE_CAMERA.id;
  return {id,position:{x:position.x,y:0,z:position.z},dimensions,footprint:ground,occupiedVolumes,clearanceVolumes,anchors:anchors(position.x,position.z,dimensions.width,dimensions.depth,usePoint,leftHeadSide),
    visual:{texture,displayWidth:visual.width,displayHeight:visual.height,anchor:category==='floor-covering'?'ground-center':'ground-front-center',depthAnchor:category==='floor-covering'?'center':'front-edge',cameraId,yawDegrees},
    blocksMovement:category!=='floor-covering',castsOcclusion:category!=='floor-covering',category};
};
export const LYDIA_WORLD_ENTITIES:SceneEntity3D[]=[
  floorEntity('rug','lydia-world-rug',layout.rug,{width:layout.rug.width,height:.025,depth:layout.rug.depth},{width:126,height:76},[],'floor-covering'),
  floorEntity('bed','lydia-world-bed',layout.bed,{width:layout.bed.width,height:layout.bed.height,depth:layout.bed.depth},{width:layout.bed.visualWidth,height:layout.bed.visualHeight},[volume('bed-body',-.775,0,-1.21,.775,2.12,1.21)],'furniture',[],undefined,point(layout.bed.x-layout.bed.width/2-.03,layout.bed.z-layout.bed.depth/2+.22)),
  floorEntity('nightstand','lydia-world-nightstand',layout.nightstand,{width:layout.nightstand.width,height:layout.nightstand.height,depth:layout.nightstand.depth},{width:layout.nightstand.visualWidth,height:layout.nightstand.visualHeight},[volume('nightstand-body',-.30,0,-.40,.30,1.52,.40)]),
  floorEntity('wardrobe','lydia-world-wardrobe',layout.wardrobe,{width:layout.wardrobe.width,height:layout.wardrobe.height,depth:layout.wardrobe.depth},{width:layout.wardrobe.visualWidth,height:layout.wardrobe.visualHeight},[volume('wardrobe-body',-.625,0,-.35,.625,2.55,.35)]),
  floorEntity('washstand','lydia-world-washstand',layout.washstand,{width:layout.washstand.width,height:layout.washstand.height,depth:layout.washstand.depth},{width:layout.washstand.visualWidth,height:layout.washstand.visualHeight},[volume('washstand-body',-.46,0,-.345,.46,1.72,.345)]),
  floorEntity('desk','lydia-world-desk',layout.desk,{width:layout.desk.width,height:layout.desk.height,depth:layout.desk.depth},{width:layout.desk.visualWidth,height:layout.desk.visualHeight},[
    volume('desk-tabletop',-.71,.84,-.39,.71,1.00,.39),
    volume('desk-drawer-bank',-.56,.46,-.27,.56,.84,.34),
    volume('desk-left-support',-.68,0,-.34,-.54,.84,.34),
    volume('desk-right-support',.54,0,-.34,.68,.84,.34),
  ],'furniture',[clearance('desk-under-table',-.48,0,-.34,.48,.84,.34)],deskUsePoint),
  floorEntity('chair','lydia-world-chair',layout.chair,{width:layout.chair.width,height:layout.chair.height,depth:layout.chair.depth},{width:layout.chair.visualWidth,height:layout.chair.visualHeight},[volume('chair-seat-back',-.34,0,-.39,.34,1.38,.39)]),
  floorEntity('safe','lydia-world-safe',layout.safe,{width:layout.safe.width,height:layout.safe.height,depth:layout.safe.depth},{width:layout.safe.visualWidth,height:layout.safe.visualHeight},[volume('safe-body',-.275,0,-.31,.275,1.20,.31)],'container'),
];
export const LYDIA_WALL_MOUNTED:WallMountedEntity[]=[
  {id:'mirror',position:{x:layout.mirror.x,y:1.23,z:layout.mirror.z},dimensions:{width:.18,height:2.48,depth:.10},
    visual:{texture:'lydia-world-mirror',displayWidth:40,displayHeight:97,anchor:'wall-center',depthAnchor:'center',cameraId:LYDIA_SCENE_CAMERA.id,yawDegrees:0},wall:'east',groundFootprint:footprint('mirror-base')},
  {id:'vent-grille',position:{x:6.55,y:1.46,z:.04},dimensions:{width:.58,height:.52,depth:.08},
    visual:{texture:'lydia-world-vent',displayWidth:38,displayHeight:33,anchor:'wall-center',depthAnchor:'center',cameraId:LYDIA_SCENE_CAMERA.id,yawDegrees:180},wall:'north'},
];
export const LYDIA_ROOM_ARCHITECTURE={
  size:LYDIA_WORLD_SIZE,
  floor:{plane:'xz' as const,material:'dark-walnut' as const,quadId:'lydia-floor-quad'},
  walls:{north:{z:0},south:{z:5.5},west:{x:0},east:{x:10}},
  openings:[{id:'bedroom-entry',wall:'west' as const,from:3.2,to:4.1,bottom:0,top:2.25}],
  mountedEntityIds:LYDIA_WALL_MOUNTED.map(item=>item.id),
};
export const LYDIA_SCENE_GRAPH:SceneGraph3D={architecture:LYDIA_ROOM_ARCHITECTURE,entities:LYDIA_WORLD_ENTITIES,wallMounted:LYDIA_WALL_MOUNTED};

export interface LydiaInteractable { id:string; title:string; x:number; z:number; y:number; interactionRange:number }
// Player standing anchors and target heights now live beside the canonical evidence definitions.
export const LYDIA_WORLD_INTERACTABLES:LydiaInteractable[]=INTERACTABLES
  .filter(item=>item.scene===SCENES.LYDIA_ROOM)
  .map(item=>{
    const anchor=item.worldPosition??{x:0,y:0,z:0};
    return {id:item.id,title:item.title,x:anchor.x,y:anchor.y,z:anchor.z,interactionRange:item.worldInteractionRange??.76};
  });

export const LYDIA_EXIT_WORLD={x:0,z:3.65,width:.78,depth:1.50};
export const LYDIA_ENTRY_WORLD:WorldPosition3D={x:1.2,y:0,z:3.75};
export const LYDIA_DOOR_WORLD:WorldPosition3D={x:.42,y:0,z:3.55};
export const LYDIA_CLOSED_DOOR:GroundFootprint={id:'closed-entry-leaf',x:-.02,z:3.20,width:.28,depth:.9};
export const LYDIA_PLAYER_FOOTPRINT={width:.34,depth:.25};
export const LYDIA_PLAYER_COLLISION_VOLUME:CharacterCollisionVolume={width:.38,depth:.30,height:1.82};

export function isInsideLydiaWorld(position:{x:number;z:number}):boolean {
  return position.x>=.14&&position.x<=9.86&&position.z>=.04&&position.z<=5.38;
}
export function overlapsGround(a:{x:number;z:number;width:number;depth:number},b:GroundFootprint):boolean {
  if(!b.polygon||b.polygon.length<3)
    return a.x-a.width/2<b.x+b.width&&a.x+a.width/2>b.x&&a.z-a.depth/2<b.z+b.depth&&a.z+a.depth/2>b.z;
  const subject=[
    {x:a.x-a.width/2,z:a.z-a.depth/2},{x:a.x+a.width/2,z:a.z-a.depth/2},
    {x:a.x+a.width/2,z:a.z+a.depth/2},{x:a.x-a.width/2,z:a.z+a.depth/2},
  ];
  const obstacle=b.polygon.map(point=>({x:b.x+point.x,z:b.z+point.z}));
  const axes=[{x:1,z:0},{x:0,z:1}];
  for(let i=0;i<obstacle.length;i++){
    const from=obstacle[i],to=obstacle[(i+1)%obstacle.length],dx=to.x-from.x,dz=to.z-from.z;
    if(dx||dz)axes.push({x:-dz,z:dx});
  }
  return axes.every(axis=>{
    const project=(points:{x:number;z:number}[])=>{
      const values=points.map(point=>point.x*axis.x+point.z*axis.z);
      return {min:Math.min(...values),max:Math.max(...values)};
    };
    const left=project(subject),right=project(obstacle);
    return left.min<right.max&&left.max>right.min;
  });
}
export function isWithinGroundFootprint(position:{x:number;z:number},area:GroundFootprint):boolean {
  return position.x>=area.x&&position.x<=area.x+area.width&&position.z>=area.z&&position.z<=area.z+area.depth;
}
export function canCharacterPassClearance(characterHeight:number,freeHeight:number):boolean { return characterHeight<=freeHeight; }
export interface LydiaCollisionHit { id:string; volumeId:string; kind:'architecture'|'furniture'|'clearance'|'door' }
const intersectsXZ=(position:{x:number;z:number},width:number,depth:number,box:{min:{x:number;z:number};max:{x:number;z:number}})=>
  position.x+width/2>box.min.x&&position.x-width/2<box.max.x&&position.z+depth/2>box.min.z&&position.z-depth/2<box.max.z;
const intersectsVertical=(height:number,minY:number,maxY:number)=>height>minY&&0<maxY;
const wallVolume=(foot:GroundFootprint)=>({min:{x:foot.x,y:0,z:foot.z},max:{x:foot.x+foot.width,y:LYDIA_WORLD_SIZE.height,z:foot.z+foot.depth}});

/** Returns the first physical 3D overlap. Ground footprints remain navigation/foot-contact data. */
export function findLydiaCollision(position:{x:number;z:number},doorClosed=false,character:CharacterCollisionVolume=LYDIA_PLAYER_COLLISION_VOLUME):LydiaCollisionHit|undefined {
  if(!isInsideLydiaWorld(position))return {id:'room-boundary',volumeId:'walkable-floor-boundary',kind:'architecture'};
  for(const wall of wallFootprints){const box=wallVolume(wall);if(intersectsXZ(position,character.width,character.depth,box)&&intersectsVertical(character.height,box.min.y,box.max.y))return {id:wall.id,volumeId:wall.id,kind:'architecture'};}
  for(const entity of LYDIA_SCENE_GRAPH.entities.filter(item=>item.blocksMovement)){
    for(const box of worldOccupiedVolumes(entity)){
      if(intersectsXZ(position,character.width,character.depth,box)&&intersectsVertical(character.height,box.min.y,box.max.y))
        return {id:entity.id,volumeId:entity.occupiedVolumes.find(v=>entity.position.x+v.min.x===box.min.x&&entity.position.y+v.min.y===box.min.y&&entity.position.z+v.min.z===box.min.z)?.id??entity.id,kind:'furniture'};
    }
    for(const box of entity.clearanceVolumes??[]){
      const world={min:{x:entity.position.x+box.min.x,y:entity.position.y+box.min.y,z:entity.position.z+box.min.z},max:{x:entity.position.x+box.max.x,y:entity.position.y+box.max.y,z:entity.position.z+box.max.z}};
      if(!canCharacterPassClearance(character.height,box.freeHeight)&&intersectsXZ(position,character.width,character.depth,world))return {id:entity.id,volumeId:box.id,kind:'clearance'};
    }
  }
  for(const entity of LYDIA_SCENE_GRAPH.wallMounted){
    const base=entity.groundFootprint;if(!base)continue;
    const box={min:{x:base.x,y:0,z:base.z},max:{x:base.x+base.width,y:entity.dimensions.height,z:base.z+base.depth}};
    if(intersectsXZ(position,character.width,character.depth,box)&&intersectsVertical(character.height,box.min.y,box.max.y))
      return {id:entity.id,volumeId:`${entity.id}-base-volume`,kind:'furniture'};
  }
  if(doorClosed&&overlapsGround({...position,width:character.width,depth:character.depth},LYDIA_CLOSED_DOOR))return {id:'bedroom-entry',volumeId:LYDIA_CLOSED_DOOR.id,kind:'door'};
  return undefined;
}
export function isLydiaGroundBlocked(position:{x:number;z:number},doorClosed=false):boolean { return !!findLydiaCollision(position,doorClosed); }
export function resolveLydiaSpawn(position:WorldPosition3D):WorldPosition3D {
  if(!isLydiaGroundBlocked(position))return {x:position.x,y:0,z:position.z};
  for(let radius=.08;radius<=2.4;radius+=.08){
    for(let i=0;i<64;i++){
      const angle=i*Math.PI*2/64,candidate={x:position.x+Math.cos(angle)*radius,z:position.z+Math.sin(angle)*radius};
      if(!isLydiaGroundBlocked(candidate))return {x:candidate.x,y:0,z:candidate.z};
    }
  }
  return {x:.8,y:0,z:3.55};
}
export function lydiaDistanceXZ(a:Pick<WorldPosition3D,'x'|'z'>,b:Pick<WorldPosition3D,'x'|'z'>):number { return Math.hypot(a.x-b.x,a.z-b.z); }
export function isLydiaExitPosition(position:Pick<WorldPosition3D,'x'|'z'>):boolean {
  const e=LYDIA_EXIT_WORLD;return position.x>=e.x-e.width/2&&position.x<=e.x+e.width/2&&position.z>=e.z-e.depth/2&&position.z<=e.z+e.depth/2;
}
