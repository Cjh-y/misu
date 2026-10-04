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
  asset:'lydiaPhase16'|'bakerProps'|'bakerRoomProps'|'lydiaProps'|'interiorTiles';
  source:{x:number;y:number;width:number;height:number};
  display?:{x:number;y:number;width:number;height:number};
  flipX?:boolean;
  alphaMaskAsset?:'lydiaBedFront';
}
export interface PropVisual {
  id:string; asset:'bakerProps'|'bakerRoomProps'|'bakerWindow'|'lydiaProps';
  source:{x:number;y:number;width:number;height:number};
  display:{x:number;y:number;width:number;height:number};
  depthY:number;
  flipX?:boolean;
}
export interface PhysicalRoomDefinition {
  scene:SceneId; width:number; height:number; walls:Footprint[]; props:Footprint[];
  surfaces:SurfaceRegion[]; defaultSurface:RoomSurface; lights:RoomLight[];
  doors:DoorDefinition[]; exits:Footprint[]; occlusion:OcclusionDefinition[]; propVisuals:PropVisual[];
  interactionRanges:boolean; debugLabel:string;
}

const rect=(id:string,x:number,y:number,width:number,height:number,depthY=y+height/2):Footprint=>({id,x,y,width,height,depthY});

const lydia:PhysicalRoomDefinition={
  scene:SCENES.LYDIA_ROOM,width:480,height:320,debugLabel:'LYDIA BEDROOM',interactionRanges:true,defaultSurface:'WOOD',
  walls:[
    rect('north-wall',240,8,480,16,16),rect('south-wall',240,312,480,16,320),rect('east-wall',472,160,16,320,320),
    rect('west-wall-north',8,91,16,150,166),rect('west-wall-south',8,287,16,50,312),
  ],
  props:[
    rect('washstand',69,134,42,24,151),rect('bedside-table',230,99,26,28,113),rect('bed',278,118,66,83,171),
    rect('wardrobe',408,91,48,24,112),rect('mirror-base',451,184,16,12,192),rect('desk',406,257,46,28,273),
    rect('chair',365,248,24,28,265),rect('safe',445,274,26,22,286),
  ],
  surfaces:[{id:'bed-rug',surface:'RUG',x:214,y:113,width:118,height:72}],
  lights:[{id:'bedside-lamp',kind:'warm',x:228,y:70,radius:128,intensity:.88},{id:'window',kind:'cool',x:154,y:42,radius:150,intensity:.22}],
  doors:[{id:'bedroom-entry',x:39,y:216,width:12,height:68,depthY:250,interactionRange:48,leafAsset:'lydiaDoorLeaf',leaf:{x:106/3.2,y:548/3.2,width:105/3.2,height:280/3.2,originX:6/105,originY:8/280,closedRotation:0,openRotation:.92},initialState:'open'}],
  exits:[rect('manor-hall-exit',39,216,12,68,250)],
  occlusion:[
    {id:'washstand-front',asset:'lydiaPhase16',source:{x:105,y:365,width:205,height:115},x:105/3.2,y:365/3.2,width:205/3.2,height:115/3.2,depthY:151},
    {id:'bedside-front',asset:'lydiaPhase16',source:{x:660,y:285,width:125,height:125},x:660/3.2,y:285/3.2,width:125/3.2,height:125/3.2,depthY:120},
    {id:'bed-front',asset:'lydiaPhase16',source:{x:750,y:425,width:230,height:150},x:750/3.2,y:425/3.2,width:230/3.2,height:150/3.2,depthY:174,alphaMaskAsset:'lydiaBedFront'},
    {id:'wardrobe-front',asset:'lydiaPhase16',source:{x:1170,y:265,width:270,height:125},x:1170/3.2,y:265/3.2,width:270/3.2,height:125/3.2,depthY:116},
    {id:'mirror-front',asset:'lydiaPhase16',source:{x:1350,y:505,width:145,height:135},x:1350/3.2,y:505/3.2,width:145/3.2,height:135/3.2,depthY:197},
    {id:'chair-front',asset:'lydiaPhase16',source:{x:1095,y:650,width:205,height:155},x:1095/3.2,y:650/3.2,width:205/3.2,height:155/3.2,depthY:270},
    {id:'desk-front',asset:'lydiaPhase16',source:{x:1175,y:800,width:350,height:135},x:1175/3.2,y:800/3.2,width:350/3.2,height:135/3.2,depthY:284},
    {id:'safe-front',asset:'lydiaPhase16',source:{x:1350,y:810,width:175,height:140},x:1350/3.2,y:810/3.2,width:175/3.2,height:140/3.2,depthY:291},
  ],propVisuals:[],
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

export const PHYSICAL_ROOMS:Record<SceneId,PhysicalRoomDefinition>={
  [SCENES.BAKER_STREET]:baker,
  [SCENES.HALL]:{scene:SCENES.HALL,width:720,height:320,debugLabel:'MANOR CORRIDOR',walls:[],props:[],surfaces:[],defaultSurface:'WOOD',lights:[],doors:[],exits:[],occlusion:[],propVisuals:[],interactionRanges:false},
  [SCENES.LYDIA_ROOM]:lydia,
};

export function roomSurfaceAt(room:PhysicalRoomDefinition,x:number,y:number):RoomSurface {
  return room.surfaces.find(r=>x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height)?.surface??room.defaultSurface;
}
