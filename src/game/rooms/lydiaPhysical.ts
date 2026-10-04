/** Backwards-compatible exports for tests and older room tooling. Runtime room
 * behavior is configured through PhysicalRoomDefinition in physicalRooms.ts. */
import { PHYSICAL_ROOMS, roomSurfaceAt } from './physicalRooms';
import { SCENES } from '../../core/ids';
export type { Footprint, RoomSurface } from './physicalRooms';
export const LYDIA_WALLS=PHYSICAL_ROOMS[SCENES.LYDIA_ROOM].walls;
export const LYDIA_PROPS=PHYSICAL_ROOMS[SCENES.LYDIA_ROOM].props;
export const LYDIA_OCCLUSION_CROPS=PHYSICAL_ROOMS[SCENES.LYDIA_ROOM].occlusion;
export function lydiaSurfaceAt(x:number,y:number){return roomSurfaceAt(PHYSICAL_ROOMS[SCENES.LYDIA_ROOM],x,y)}
