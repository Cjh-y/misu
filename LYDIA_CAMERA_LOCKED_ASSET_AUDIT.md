# Lydia Bedroom Camera-Locked Asset Pass

## Scene camera contract

`lydia-bedroom-camera-v1` is the only camera contract for Lydia Bedroom assets. It looks from the south side toward the north wall, uses a 37° elevated view with no roll, projects the ground by the measured bilinear floor quadrilateral, and raises each world Y unit by 26 screen units. Far-to-near artwork scale follows 0.94–1.035. In this projection, floor X edges are almost horizontal, floor Z recedes nearly vertically toward screen-up, and architectural verticals remain screen-vertical.

Furniture yaw is authored into the source art. Runtime does not rotate or non-uniformly squeeze sprites to correct perspective.

## Asset review

| Asset | Camera review | Source-art action |
|---|---|---|
| Bed | Head-to-foot axis and footboard face now match the room's north/south depth axis. | Rebuilt for the locked view. |
| Desk | Tabletop long edge follows world X; tabletop depth follows the room's projected Z direction. | Rebuilt for the locked view. |
| Chair | Backrest width follows X, depth faces the desk along north/south; no diagonal yaw is baked in. | Rebuilt for the locked view. |
| Washstand | Built for its west-wall position, with the top plane and visible cabinet faces following the room camera. | Rebuilt for the locked view. |
| Nightstand | Front and top follow the same south-facing room view; lamp glow is confined to its local fixture. | Rebuilt for the locked view. |
| Wardrobe | Door plane faces the room, vertical stiles remain vertical, with a restrained visible top plane. | Rebuilt for the locked view. |
| Safe | Front dial faces the room; top plane follows the floor camera basis. | Rebuilt for the locked view. |
| Mirror | Freestanding frame follows the room's vertical axis and keeps a modest visible side. | Rebuilt for the locked view. |
| Rug | Lies on the floor plane; its separate source has not been replaced because it already follows the bed-group floor composition. | Retained as floor-covering artwork. |

## Sleeping Group placement

The bed, rug, and nightstand remain attached to the `sleeping` group. Its origin moved north from `(5.72, 1.86)` to `(5.72, 1.40)`; offsets remain attached to that shared origin. The bed head is consequently back toward the north wall and its foot stays north of the room center.

## Validation

Press F8 in Lydia Bedroom to draw projected world X, Z, and Y axes at each floor furniture entity. Red is X, green is Z, and blue is Y. Object labels report authored yaw. F3–F7 controls retain their existing behavior. The clean gameplay screenshot and axis view are in `screenshots/phase-1-16/`.
