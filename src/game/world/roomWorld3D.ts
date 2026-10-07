import type { PhysicalRoomDefinition, Footprint } from '../rooms/physicalRooms';
import type { SceneEntity3D } from './sceneGraph3D';
import { WorldProjection, type WorldPosition3D } from './WorldProjection';

/** Calibrated orthographic rooms retain their painted floor while physics uses metres. */
export class RoomWorld3D {
  readonly projection:WorldProjection;
  readonly volumes:{id:string;min:WorldPosition3D;max:WorldPosition3D;door:boolean}[];
  readonly entities:SceneEntity3D[];
  readonly character={width:.45,depth:.25,height:1.82};
  constructor(readonly room:PhysicalRoomDefinition){
    this.projection=new WorldProjection({width:room.width/40,depth:room.height/40,height:3.5},{northwest:{x:0,y:0},northeast:{x:room.width,y:0},southwest:{x:0,y:room.height},southeast:{x:room.width,y:room.height}},26);
    const volume=(r:Footprint,door=false,height=1.4)=>({id:r.id,min:{x:(r.x-r.width/2)/40,y:0,z:(r.y-r.height/2)/40},max:{x:(r.x+r.width/2)/40,y:height,z:(r.y+r.height/2)/40},door});
    this.entities=[...room.props.map(r=>({id:r.id,position:{x:r.x/40,y:0,z:r.y/40},dimensions:{width:r.width/40,depth:r.height/40,height:1.4},footprint:{id:r.id,x:r.x/40,z:r.y/40,width:r.width/40,depth:r.height/40},occupiedVolumes:[{id:r.id+'-body',min:{x:-r.width/80,y:0,z:-r.height/80},max:{x:r.width/80,y:1.4,z:r.height/80}}],anchors:{front:{x:r.x/40,z:(r.y+r.height/2)/40},back:{x:r.x/40,z:(r.y-r.height/2)/40},left:{x:(r.x-r.width/2)/40,z:r.y/40},right:{x:(r.x+r.width/2)/40,z:r.y/40}},visual:{texture:r.id,displayWidth:r.width,displayHeight:r.height,anchor:'ground-center' as const,depthAnchor:'front-edge' as const},blocksMovement:true,castsOcclusion:true,category:'furniture' as const})),...room.surfaces.map(r=>({id:r.id,position:{x:(r.x+r.width/2)/40,y:0,z:(r.y+r.height/2)/40},dimensions:{width:r.width/40,depth:r.height/40,height:.01},footprint:{id:r.id,x:(r.x+r.width/2)/40,z:(r.y+r.height/2)/40,width:r.width/40,depth:r.height/40},occupiedVolumes:[],anchors:{front:{x:(r.x+r.width/2)/40,z:(r.y+r.height)/40},back:{x:(r.x+r.width/2)/40,z:r.y/40},left:{x:r.x/40,z:(r.y+r.height/2)/40},right:{x:(r.x+r.width)/40,z:(r.y+r.height/2)/40}},visual:{texture:r.id,displayWidth:r.width,displayHeight:r.height,anchor:'ground-center' as const,depthAnchor:'center' as const},blocksMovement:false,castsOcclusion:false,category:'floor-covering' as const}))];
    this.volumes=[...room.walls.map(r=>volume(r,false,3.5)),...room.props.map(r=>volume(r)),...room.doors.map(r=>volume(r,true,2.4))];
  }
  collision(p:WorldPosition3D,closed:ReadonlySet<string>){
    const c=this.character,s=this.projection.size;
    if(![p.x,p.y,p.z].every(Number.isFinite)||p.x<c.width/2||p.x>s.width-c.width/2||p.z<c.depth||p.z>s.depth)return 'room-boundary';
    return this.volumes.find(v=>(!v.door||closed.has(v.id))&&p.x+c.width/2>v.min.x+1e-9&&p.x-c.width/2<v.max.x-1e-9&&p.z>v.min.z+1e-9&&p.z-c.depth<v.max.z-1e-9&&p.y+c.height>v.min.y&&p.y<v.max.y)?.id;
  }
  groundedPosition(position:WorldPosition3D):WorldPosition3D|undefined {
    const grounded={...position,y:0};
    const closed=new Set(this.room.doors.filter(d=>d.initialState==='closed').map(d=>d.id));
    return this.collision(grounded,closed)?undefined:grounded;
  }
  depthAt(position:WorldPosition3D){return this.projection.projectFloor({x:position.x,z:position.z}).y;}
  visualPlacement(id:string,fallback:{x:number;y:number;depth:number}){
    const entity=this.entities.find(e=>e.id===id);if(!entity)return fallback;
    const ground=this.projection.project(entity.position);
    return {x:ground.x,y:entity.category==='floor-covering'?ground.y:fallback.y,depth:entity.category==='floor-covering'?-17:this.depthAt({x:entity.position.x,y:0,z:entity.anchors.front.z})};
  }
  fromScreen(x:number,feetY:number):WorldPosition3D {const p=this.projection.unprojectFloor({x,y:feetY});return {x:p.x,y:0,z:p.z};}
}
