# Scene Physicalization System

Room physicalization is configured in `src/game/rooms/physicalRooms.ts`.
`PhysicalRoomDefinition` provides the data the shared `WorldScene` needs:

- world bounds and wall/furniture foot footprints
- foreground crops and optional prop visuals
- floor material regions
- warm/cool local lights
- one or more door instances, their pivot, collider, range, and initial state
- interaction visibility and debug label

Lydia and 221B use the same actor movement, axis sliding, collision checks, depth sorting,
door animation/state, floor detection, lighting tint, foot shadows, and F3 debug renderer.
Lydia uses its composite bedroom background plus extracted foreground crops. 221B uses a
room-sized architectural base, an independent furniture atlas, selective configured foreground
crops, a generated door leaf, and a localized southeast threshold patch. These presentation assets
do not replace or modify the room's collision, surface, light, or door-state configuration.

## Add a room

1. Add a `PhysicalRoomDefinition` with wall and object floor footprints. Keep each chair,
   desk, and other piece as a separate footprint.
2. Define floor material rectangles and lights in world coordinates.
3. Add door definitions as needed. Door state is stored by ID, so a room can have multiple doors.
4. Add foreground crops for artwork that needs to pass in front of the actor. Configure the
   depth anchor at the object's floor contact edge.
5. Add any room-specific prop atlas frames to `propVisuals`; keep large furniture that needs
   depth sorting as independent sprites and put only architecture/fixed lighting in the room base.

`WorldScene` retains two presentation-specific choices: Lydia uses the established 1.5x Holmes
visual sprite and composite room background; the corridor keeps its existing fallback collision
geometry because it is outside this phase. These do not affect how physical room definitions run.

## Browser verification

Run `npm run test:browser -- tests/browser/physical-room-system.spec.ts` for 221B movement,
door state, surface, depth, lighting, and evidence regression checks. Use `F3` to inspect
footprints, material regions, interaction radii, doors, and depth anchors in either physical room.

Manual 221B route: start on the central rug, cross each rug edge, walk against the fireplace and
desk footprints, circle both armchairs and the bookcase, then visit the south-east entry. Toggle
`O` closed and confirm the threshold blocks movement; toggle it open and walk into the threshold.
Compare Holmes near the fireplace, near the rainy window, and in the lower-left dim area. F3
shows the exact collision and material regions for each step.
