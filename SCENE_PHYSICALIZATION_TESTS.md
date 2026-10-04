# Scene Physicalization · Lydia Bedroom

## Controls

- `WASD` / arrow keys: move
- `E`: inspect the existing evidence and objects
- `F3`: show/hide collision footprints, interaction ranges, and depth anchors
- `O` near the entrance: swing the extracted door leaf open/closed and update its threshold collision

The debug overlay uses green for walls, amber for prop footprints, blue for interaction ranges, and red for Holmes's foot collision body. `misu:surface` reports `WOOD` or `RUG` when the actor crosses the surface boundary.

## Automated checks

Run `npm run test:browser -- tests/browser/lydia-physicalization.spec.ts`.

The browser checks verify that the bed footprint stops northward movement, the debug overlay reports the current door state, a closed door blocks outward movement, and the rug reports a distinct surface type.

## Manual route

1. Load the Lydia room at the door, turn on `F3`, and inspect the player footprint against the west wall, door opening, and door panel.
2. Toggle `O` closed and try to leave through the entrance. Confirm the body stops at the threshold. Toggle it open and repeat.
3. Walk from the entrance around both sides and the foot of the bed. Confirm the bed footprint blocks entry while allowing edge sliding.
4. Approach the bed from its north side and inspect the footboard crop layer: the bed's front edge should sort in front of an actor whose feet are behind its depth anchor.
5. Walk between the chair and desk, then around the safe. Use `F3` to confirm their footprints are separate and leave a passable route.
6. Walk into and out of the rug region. Observe `WOOD` / `RUG` change in debug mode and through the `misu:surface` browser event.
7. Stand by the oil lamp, cross to the lower-left dark area, and then stand by the window. Compare Holmes's warm and cool corner tints and the small foot shadow.
8. Move diagonally into a wall and along a furniture edge. Confirm the blocked axis does not prevent sliding along the free axis.

## Current layer map

- Floor and baked room lighting remain the original environment image.
- Walls and each major prop use separate floor-contact collision footprints.
- Foreground depth layers are crops from the same room image; bed/table/chair use front-edge crops so they do not hide the complete actor.
- The door leaf is extracted from the existing room image into a transparent layer. Its pivot animates between open and closed; the threshold collider activates after closing and disables as opening begins.
