import { describe, expect, it } from 'vitest';
import { PHYSICAL_ROOMS, isRoomGroundBlocked, resolveRoomSpawn } from '../../src/game/rooms/physicalRooms';

describe('feet anchored planar collision', () => {
  const baker = PHYSICAL_ROOMS['221b'];
  it('blocks the entire back wall, including the rain window', () => {
    for (let x = 38; x <= 442; x += 4) {
      for (let feet = 10; feet < 122; feet += 4) expect(isRoomGroundBlocked(baker, x, feet)).toBe(true);
    }
    expect(isRoomGroundBlocked(baker, 263, 122)).toBe(false);
    expect(isRoomGroundBlocked(baker, 263, 185.8)).toBe(false);
  });
  it('recovers saves on walls or inside furniture to legal ground', () => {
    for (const position of [{x:263,y:45},{x:66,y:145},{x:430,y:105},{x:-20,y:150},{x:NaN,y:Infinity}]) {
      const safe = resolveRoomSpawn(baker, position);
      expect(isRoomGroundBlocked(baker, safe.x, safe.y + 25.8)).toBe(false);
    }
    expect(resolveRoomSpawn(baker, {x:263,y:160})).toEqual({x:263,y:160});
  });
  it('keeps side walls and closed door solid while the open threshold is usable', () => {
    expect(isRoomGroundBlocked(baker, 30, 180)).toBe(true);
    expect(isRoomGroundBlocked(baker, 450, 180)).toBe(true);
    expect(isRoomGroundBlocked(baker, 449, 310)).toBe(false);
    expect(isRoomGroundBlocked(baker, 449, 310, new Set(['221b-entry']))).toBe(true);
  });
});
