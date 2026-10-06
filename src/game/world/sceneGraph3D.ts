import type { GroundPoint, WorldPosition3D, WorldProjection, WorldSize3D } from './WorldProjection';

export interface GroundFootprint {
  id:string;
  x:number;
  z:number;
  width:number;
  depth:number;
  polygon?:GroundPoint[];
}

export interface EntityDimensions3D { width:number; height:number; depth:number }
export interface EntityVolume3D {
  min:{x:number;y:number;z:number};
  max:{x:number;y:number;z:number};
}

/** Component bounds are local to the entity ground anchor; y is measured up from the floor. */
export interface LocalOccupiedVolume3D {
  id:string;
  min:{x:number;y:number;z:number};
  max:{x:number;y:number;z:number};
}
export interface LocalClearanceVolume3D extends LocalOccupiedVolume3D {
  freeHeight:number;
}
export interface CharacterCollisionVolume {
  width:number;
  depth:number;
  height:number;
}
export interface FurnitureAnchors {
  front:{x:number;z:number}; back:{x:number;z:number}; left:{x:number;z:number}; right:{x:number;z:number};
  usePoint?:{x:number;z:number};
  leftHeadSide?:{x:number;z:number};
  center?:{x:number;z:number};
}
export interface FurnitureGroup {
  id:'sleeping'|'work'|'dressing'|'wash';
  origin:{x:number;z:number};
  members:string[];
  offsets:Record<string,{x:number;z:number}>;
}

/** Render metadata is deliberately separate from gameplay dimensions and position. */
export interface EntityVisualDefinition {
  texture:string;
  displayWidth:number;
  displayHeight:number;
  anchor:'ground-center'|'ground-front-center'|'wall-center';
  /** Wall mounted assets project their authored center; floor entities project ground contact. */
  depthAnchor:'center'|'front-edge';
  /** Visuals are painted for one room camera; yaw is baked into the source art, never corrected by sprite rotation. */
  cameraId?:string;
  yawDegrees?:number;
}

export interface SceneEntity3D {
  id:string;
  position:WorldPosition3D;
  dimensions:EntityDimensions3D;
  footprint:GroundFootprint;
  occupiedVolumes:LocalOccupiedVolume3D[];
  clearanceVolumes?:LocalClearanceVolume3D[];
  anchors:FurnitureAnchors;
  visual:EntityVisualDefinition;
  blocksMovement:boolean;
  castsOcclusion:boolean;
  category:'furniture'|'floor-covering'|'container';
}

export interface WallMountedEntity {
  id:string;
  position:WorldPosition3D;
  dimensions:EntityDimensions3D;
  visual:EntityVisualDefinition;
  wall:'north'|'east'|'south'|'west';
  groundFootprint?:GroundFootprint;
}

export interface RoomArchitecture {
  size:WorldSize3D;
  floor:{plane:'xz';material:'dark-walnut';quadId:string};
  walls:{north:{z:number};south:{z:number};west:{x:number};east:{x:number}};
  openings:{id:string;wall:'west'|'south'|'east'|'north';from:number;to:number;bottom:number;top:number}[];
  mountedEntityIds:string[];
}

export interface SceneGraph3D {
  architecture:RoomArchitecture;
  entities:SceneEntity3D[];
  wallMounted:WallMountedEntity[];
}

export function entityVolume(entity:SceneEntity3D):EntityVolume3D {
  const halfWidth=entity.dimensions.width/2,halfDepth=entity.dimensions.depth/2;
  return {
    min:{x:entity.position.x-halfWidth,y:entity.position.y,z:entity.position.z-halfDepth},
    max:{x:entity.position.x+halfWidth,y:entity.position.y+entity.dimensions.height,z:entity.position.z+halfDepth},
  };
}

export function worldOccupiedVolumes(entity:SceneEntity3D):EntityVolume3D[] {
  return entity.occupiedVolumes.map(part=>({
    min:{x:entity.position.x+part.min.x,y:entity.position.y+part.min.y,z:entity.position.z+part.min.z},
    max:{x:entity.position.x+part.max.x,y:entity.position.y+part.max.y,z:entity.position.z+part.max.z},
  }));
}

export function worldClearanceVolumes(entity:SceneEntity3D):LocalClearanceVolume3D[] {
  return (entity.clearanceVolumes??[]).map(part=>({
    ...part,
    min:{x:entity.position.x+part.min.x,y:entity.position.y+part.min.y,z:entity.position.z+part.min.z},
    max:{x:entity.position.x+part.max.x,y:entity.position.y+part.max.y,z:entity.position.z+part.max.z},
  }));
}

export type OcclusionRelation='entity-over-player'|'player-over-entity';

/** Resolve whole-sprite painter order from the logical 3D volume and player X/Z. */
export function entityOcclusionRelation(player:Pick<WorldPosition3D,'x'|'z'>,entity:SceneEntity3D,projection:WorldProjection):OcclusionRelation {
  const volume=entityVolume(entity);
  const playerDepth=projection.projectFloor(player).y;
  const entityDepth=projection.projectFloor({x:entity.position.x,z:entity.position.z}).y;
  const extent=[
    {x:volume.min.x,z:volume.min.z},{x:volume.max.x,z:volume.min.z},
    {x:volume.max.x,z:volume.max.z},{x:volume.min.x,z:volume.max.z},
  ].map(point=>projection.projectFloor(point).y);
  const minDepth=Math.min(...extent),maxDepth=Math.max(...extent);
  if(playerDepth<minDepth)return 'entity-over-player';
  if(playerDepth>maxDepth)return 'player-over-entity';
  return playerDepth<entityDepth?'entity-over-player':'player-over-entity';
}

/** A monotonic painter key derived from projected world floor depth, never sprite bounds. */
export function entityDepthKey(position:Pick<WorldPosition3D,'x'|'z'>,projection:WorldProjection):number {
  const north=(projection.floor.northwest.y+projection.floor.northeast.y)/2;
  const south=(projection.floor.southwest.y+projection.floor.southeast.y)/2;
  const unitsPerScreenY=100*projection.size.depth/(south-north);
  return 4000+(projection.projectFloor(position).y-north)*unitsPerScreenY;
}
