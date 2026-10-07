# Scene Physicalization System

Room physicalization is configured in `src/game/rooms/physicalRooms.ts`.
`PhysicalRoomDefinition` provides the data the shared `WorldScene` needs:

- world bounds and wall/furniture foot footprints
- foreground crops and optional prop visuals
- floor material regions
- warm/cool local lights
- one or more door instances, their pivot, collider, range, and initial state
- interaction visibility and debug label

## Current collision authority (2026-10-07)

221B and Manor Corridor use feet-anchored planar collision against `PhysicalRoomDefinition`.
`isRoomGroundBlocked` checks an 18 × 10 footprint ending at the actor's feet, independently
of animation frame dimensions. Movement slides on each axis in steps no larger than two
logical pixels; frame delta is bounded to 150 ms. `resolveRoomSpawn` repairs illegal legacy
save positions before rendering the actor. Arcade bodies remain available for inspection,
but Arcade velocity does not drive player movement.

221B's north wall covers the architectural wall band, including the window, rather than only
the outer 16 pixels. The east wall leaves the southeast door opening clear. Closed doors
participate in movement collision; closing a door through the actor is rejected. The upright
221B door scales around its hinge when opened. Whole furniture sprites sort by floor contact;
duplicated foreground crop overlays have been removed.

Lydia uses `lydiaWorldRoom.ts` and its 3D scene graph as collision authority. Actor world X/Z,
occupied volumes, clearance and logical depth are projected into the room view; pixel
rectangles in `physicalRooms.ts` are not authoritative for this room. Movement subdivides
world displacement into steps no larger than 0.06 units, and diagonal speed is normalized.

All rooms share input locking, door state, surface feedback, lighting and contact shadows.
Linear texture sampling and fractional camera coordinates avoid hard pixel snapping during
movement. F3 inspects room collision; F4–F8 inspect Lydia's world projection and entities.

## Add a room

1. Add a `PhysicalRoomDefinition` with wall and object floor footprints. Keep each chair,
   desk, and other piece as a separate footprint.
2. Define floor material rectangles and lights in world coordinates.
3. Add door definitions as needed. Door state is stored by ID, so a room can have multiple doors.
4. Add foreground crops for artwork that needs to pass in front of the actor. Configure the
   depth anchor at the object's floor contact edge.
5. Add any room-specific prop atlas frames to `propVisuals`; keep large furniture that needs
   depth sorting as independent sprites and put only architecture/fixed lighting in the room base.

## Browser verification

Run `npm run test:browser -- tests/browser/physical-room-system.spec.ts` for 221B movement,
door state, surface, depth, lighting, and evidence regression checks. Use `F3` to inspect
footprints, material regions, interaction radii, doors, and depth anchors in either physical room.

Manual 221B route: start on the central rug, cross each rug edge, walk against the fireplace and
desk footprints, circle both armchairs and the bookcase, then visit the south-east entry. Toggle
`O` closed and confirm the threshold blocks movement; toggle it open and walk into the threshold.
Compare Holmes near the fireplace, near the rainy window, and in the lower-left dim area. F3
shows the exact collision and material regions for each step.
