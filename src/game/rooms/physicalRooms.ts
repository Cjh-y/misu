import { SCENES } from '../../core/ids';
import type { SceneId } from '../../core/types';

export interface Footprint { id:string; x:number; y:number; width:number; height:number; depthY:number }
export type RoomSurface = 'WOOD'|'RUG';
export interface SurfaceRegion { id:string; surface:RoomSurface; x:number; y:number; width:number; height:number }
export interface RoomLight { id:string; kind:'warm'|'cool'; x:number; y:number; radius:number; intensity:number }
export interface DoorDefinition {
  id:string; x:number; y:number; width:number; height:number; depthY:number;
  interactionRange:number; leafAsset?:'lydiaDoorLeaf'|'tileDoor'|'bakerDoorLeaf';
  leaf?:{x:number;y:number;width:number;height:number;originX?:number;originY?:number;closedRotation:number;openRotation:number};
  initialState:'open'|'closed';
}
export interface OcclusionDefinition {
  id:string; x:number; y:number; width:number; height:number; depthY:number;
  asset:'bakerProps'|'bakerRoomProps'|'interiorTiles';
  source:{x:number;y:number;width:number;height:number};
  display?:{x:number;y:number;width:number;height:number};
  flipX?:boolean;
}
export interface PropVisual {
  id:string; asset:'bakerProps'|'bakerRoomProps'|'bakerWindow';
  source:{x:number;y:number;width:number;height:number};
  display:{x:number;y:number;width:number;height:number};
  depthY:number;
  flipX?:boolean;
}
export interface PhysicalRoomDefinition {
  scene:SceneId; width:number; height:number; walls:Footprint[]; props:Footprint[];
  walkableBounds?:{x:number;y:number;width:number;height:number};
  surfaces:SurfaceRegion[]; defaultSurface:RoomSurface; lights:RoomLight[];
  doors:DoorDefinition[]; exits:Footprint[]; occlusion:OcclusionDefinition[]; propVisuals:PropVisual[];
  interactionRanges:boolean; debugLabel:string;
}

const rect=(id:string,x:number,y:number,width:number,height:number,depthY=y+height/2):Footprint=>({id,x,y,width,height,depthY});

const lydia:PhysicalRoomDefinition={
  scene:SCENES.LYDIA_ROOM,width:480,height:320,debugLabel:'LYDIA BEDROOM',interactionRanges:true,defaultSurface:'WOOD',
  // Logical X/Z collision lives in game/world/lydiaWorldRoom.ts; no pixel rectangles are authoritative here.
  walls:[],props:[],
  surfaces:[{id:'bed-rug',surface:'RUG',x:214,y:113,width:118,height:72}],
  lights:[{id:'bedside-lamp',kind:'warm',x:228,y:70,radius:128,intensity:.88},{id:'window',kind:'cool',x:154,y:42,radius:150,intensity:.22}],
  doors:[{id:'bedroom-entry',x:39,y:216,width:12,height:68,depthY:250,interactionRange:48,leafAsset:'lydiaDoorLeaf',leaf:{x:106/3.2,y:548/3.2,width:105/3.2,height:280/3.2,originX:6/105,originY:8/280,closedRotation:0,openRotation:.92},initialState:'open'}],
  exits:[rect('manor-hall-exit',39,216,12,68,250)],
  // Lydia furniture is rendered exclusively from LYDIA_SCENE_GRAPH. No full-object
  // background props or per-furniture crop masks are registered in this room definition.
  occlusion:[],propVisuals:[],
};

const baker:PhysicalRoomDefinition={
  scene:SCENES.BAKER_STREET,width:480,height:320,debugLabel:'221B BAKER STREET',interactionRanges:true,defaultSurface:'WOOD',
  walls:[rect('north-wall',240,8,480,16,16),rect('south-wall-west',214,312,428,16,320),rect('south-wall-east',475,312,10,16,320),rect('west-wall',8,160,16,320,320),rect('east-wall',472,160,16,320,320)],
  props:[
    rect('fireplace',104,104,74,18,113),rect('armchair-left',66,171,42,38,190),rect('armchair-right',178,171,42,38,190),
    rect('desk',122,253,74,30,268),rect('desk-chair',122,284,30,22,295),rect('bookcase',430,126,43,20,136),
    rect('chemistry-stand',353,246,42,16,254),rect('violin-case',211,132,38,14,139),rect('lamp-table',122,189,22,18,198),
  ],
  surfaces:[{id:'central-rug',surface:'RUG',x:30,y:120,width:215,height:112}],
  lights:[{id:'fireplace-glow',kind:'warm',x:104,y:88,radius:128,intensity:.62},{id:'table-lamp',kind:'warm',x:122,y:174,radius:112,intensity:.68},{id:'rain-window',kind:'cool',x:263,y:58,radius:146,intensity:.2}],
  // Formal 221B leaf art replaces the temporary shared atlas frame. Geometry and motion stay fixed.
  doors:[{id:'221b-entry',x:449,y:310,width:42,height:12,depthY:314,interactionRange:50,leafAsset:'bakerDoorLeaf',leaf:{x:428,y:310,width:26,height:48,originX:.1,originY:.92,closedRotation:Math.PI/2,openRotation:-Math.PI/2},initialState:'open'}],
  exits:[rect('baker-street-exit',449,310,42,12,314)],
  occlusion:[
    {id:'armchair-left-front',asset:'bakerRoomProps',source:{x:130,y:220,width:294,height:143},x:37,y:155,width:58,height:32,depthY:190,display:{x:66,y:169,width:58,height:32}},
    {id:'armchair-right-front',asset:'bakerRoomProps',source:{x:645,y:220,width:286,height:148},x:152,y:152,width:52,height:31,depthY:190,display:{x:178,y:168,width:52,height:31},flipX:true},
    {id:'desk-front',asset:'bakerRoomProps',source:{x:54,y:580,width:454,height:158},x:74,y:235,width:96,height:34,depthY:268,display:{x:122,y:252,width:96,height:34}},
    {id:'bookcase-front',asset:'bakerRoomProps',source:{x:1149,y:250,width:252,height:130},x:402,y:118,width:56,height:26,depthY:136,display:{x:430,y:125,width:56,height:26}},
    {id:'lamp-table-front',asset:'bakerRoomProps',source:{x:650,y:880,width:300,height:138},x:104,y:182,width:36,height:16,depthY:198,display:{x:122,y:190,width:36,height:16}},
  ],
  propVisuals:[
    {id:'rug',asset:'bakerRoomProps',source:{x:980,y:710,width:550,height:314},display:{x:137.5,y:176,width:215,height:112},depthY:-17.5},
    {id:'armchair-left',asset:'bakerRoomProps',source:{x:130,y:58,width:294,height:310},display:{x:66,y:151,width:58,height:70},depthY:190},
    {id:'armchair-right',asset:'bakerRoomProps',source:{x:645,y:58,width:286,height:310},display:{x:178,y:151,width:52,height:64},depthY:190,flipX:true},
    {id:'desk',asset:'bakerRoomProps',source:{x:54,y:384,width:454,height:354},display:{x:122,y:231,width:96,height:76},depthY:250},
    {id:'desk-chair',asset:'bakerRoomProps',source:{x:672,y:396,width:220,height:342},display:{x:122,y:274,width:32,height:42},depthY:295},
    {id:'chemistry',asset:'bakerRoomProps',source:{x:1090,y:370,width:390,height:382},display:{x:353,y:231,width:58,height:42},depthY:254},
    {id:'bookcase',asset:'bakerRoomProps',source:{x:1149,y:0,width:252,height:386},display:{x:430,y:100,width:56,height:76},depthY:119},
    {id:'violin-case',asset:'bakerRoomProps',source:{x:80,y:795,width:410,height:190},display:{x:211,y:127,width:50,height:24},depthY:139},
    {id:'table-lamp',asset:'bakerRoomProps',source:{x:650,y:680,width:300,height:344},display:{x:122,y:179,width:36,height:38},depthY:193},
  ],
};

const hall:PhysicalRoomDefinition={
  scene:SCENES.HALL,width:720,height:320,debugLabel:'MANOR CORRIDOR',interactionRanges:false,defaultSurface:'WOOD',
  walls:[
    rect('north-boundary',360,8,720,16,16),rect('south-boundary',360,312,720,16,320),rect('east-boundary',712,160,16,320,320),
    rect('west-wall-upper',8,68,16,120,128),rect('west-wall-lower',8,252,16,136,320),
    // Interior wall band and the thick side walls of Lydia's existing recessed approach.
    rect('north-wall-west',96,57,160,80,97),rect('north-wall-center',314,57,136,80,97),
    rect('north-wall-east-a',484,57,112,80,97),rect('north-wall-east-b',644,57,120,80,97),
    rect('lydia-recess-west-jamb',178,130,14,68,164),rect('lydia-recess-east-jamb',250,130,14,68,164),
  ],
  props:[
    rect('static-door-a',405,91,38,12,100),rect('static-door-b',565,91,38,12,100),
    rect('gallery-console',650,133,42,16,145),
  ],
  surfaces:[
    {id:'lydia-threshold-rug',surface:'RUG',x:183,y:151,width:54,height:21},
  ],
  lights:[
    {id:'west-sconce',kind:'warm',x:111,y:76,radius:132,intensity:.42},
    {id:'lydia-approach-sconce',kind:'warm',x:279,y:92,radius:126,intensity:.50},
    {id:'gallery-sconce',kind:'warm',x:515,y:76,radius:122,intensity:.38},
  ],
  doors:[],exits:[],occlusion:[],propVisuals:[],
};

export const PHYSICAL_ROOMS:Record<SceneId,PhysicalRoomDefinition>={
  [SCENES.BAKER_STREET]:baker,
  [SCENES.HALL]:hall,
  [SCENES.LYDIA_ROOM]:lydia,
};

export function roomSurfaceAt(room:PhysicalRoomDefinition,x:number,y:number):RoomSurface {
  return room.surfaces.find(r=>x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height)?.surface??room.defaultSurface;
}
