# Phase 1.9.1 — 221B Composition & Character Readability Plan

Status: implemented and browser-verified. This pass reuses the Phase 1.9 room base and furniture atlas. It changes only 221B gameplay furniture footprints, the rug/material region, existing 221B light placement, 221B visual transforms, and Baker Street protagonist presentation. Room bounds, fixed fireplace and window architecture, southeast entrance, shared room runtime, Lydia, and story logic remain unchanged.

## Screenshot diagnosis

The Phase 1.9 overview shows the east-side chair/bookcase cluster compressing the two chairs together, while the rug and central lamp table sit apart from the fireplace. The southwest desk and south-central chemistry stand read as isolated props. Holmes uses a small, low-value silhouette that blends into the dark wood. The review therefore moves the gathering into the northwest/left-center floor area directly below the fixed fireplace and improves the character's scale/value separation.

## Proposed composition (world coordinates)

Coordinate origin is the upper-left of the unchanged 480 × 320 world. Positions below are centers. Furniture visual bounds remain separately configured where transparent padding differs from collision bounds.

| Element | Current center / region | Proposed center / region | Footprint and treatment |
|---|---:|---:|---|
| Fireplace architecture | fixed at `(104,77)` visual; `(104,104)` footprint | unchanged | Keep baked into room base; fireplace emitter stays `(104,88)`. |
| Sitting rug | `(271,184)`; surface `x204–338, y146–222` | center `(137.5,176)`, bounds `x30–245, y120–232` | Expanded the existing rug and matching material region as the shared base for both chairs, table, and violin case. |
| Armchair A | `(360,111)` | `(66,171)` | Footprint 42 × 38; face its seat toward the center table. Keep just east of the west circulation strip and below the hearth. |
| Armchair B | `(428,151)` | `(178,171)` | Footprint 42 × 38; horizontally mirror the existing chair image and its foreground crop so it faces Armchair A/table. Clear the east-wall bookcase. |
| Lamp table | `(224,169)` | `(122,189)` | Keep the 22 × 18 collision footprint. Re-anchor its sprite and existing crop to the center between the chairs. Move its warm emitter to `(122,174)`. |
| Violin case | `(284,116)` | `(211,132)` | Keep it low-profile beside the rug's northeast edge, tying the music object to the sitting zone. Use a 38 × 14 footprint. |
| Desk and chair | `(122,253)` / `(122,284)` | unchanged | Retain the southwest work corner and existing sizes/relationship; its visual front edge already aligns with the chair. |
| Chemistry table | `(291,249)` | `(355,246)` | Keep in the south/east experiment zone; use a 40 × 16 footprint and retain open approach space from the west. |
| Bookshelf | `(430,126)` | unchanged | Keep attached to the east wall; no chair footprint or image overlaps it after moving Armchair B. |
| Entrance | `(449,310)` | unchanged | Preserve door, exit, jamb and threshold geometry. Keep the approach clear. |

## Walkability and depth

- The rug ends at x=245, leaving a broad east/central wood route to the chemistry station, bookcase and south-east entrance.
- Both chair footprints leave a player-width route around the west side of the gathering. Their inward-facing silhouettes frame the table; the player can approach the hearth from the central route.
- Keep the table footprint between, but not overlapping, chair footprints. The rug remains a surface region only, without collision.
- Armchair B flips its parent and its foreground crop together. Collision boxes remain axis-aligned and cover each chair's floor-contact area.
- Keep the desk, chemistry table, chair and bookcase depth anchors aligned to their new/current footprint contact edges.

## Holmes readability

Use the existing Phase 16 Holmes sprite sheet for 221B at 34.8 × 51.6 display pixels (1.2× its 29 × 43 logical size), retaining an 18 × 10 foot-contact body. This makes the brown coat, face and burgundy scarf readable beside the furniture without changing movement speed. Keep per-position warm/cool tint. Raise Baker-only ambient tint and the two contact-shadow alphas modestly; do not add a bright outline or glow. Lydia's actor scale/tint/shadow remains unchanged.

## Acceptance captures and checks

Save a clean room overview, F3 physics debug view, Holmes on open wood, Holmes on the rug, and Holmes walking behind an armchair under `screenshots/phase-1-9/`. Run the existing `tests/browser/physical-room-system.spec.ts`, updating its chair-depth fixture coordinates to match the new chair. Verify rug surface reporting, fireplace and desk blocking, movement through open space, door threshold state, furniture occlusion, light response, mobile door control, and Lydia evidence regression.
