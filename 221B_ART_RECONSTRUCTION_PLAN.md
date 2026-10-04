# Phase 1.9 — 221B Art Reconstruction Plan

Status: Phase 1.9 art integration complete. The coordinate tables below record the layout at that milestone. Phase 1.9.1's current composition and revised movable-object footprints are documented in [221B_COMPOSITION_PLAN.md](221B_COMPOSITION_PLAN.md).

## Scope and source of truth

At the beginning of Phase 1.9, the room was 480 × 320 world pixels and `src/game/rooms/physicalRooms.ts` was the sole authority for wall, furniture, surface, light, door, and exit coordinates. All rectangle coordinates below record that pre-1.9.1 layout as bounds derived from the configured center and size, unless identified as a surface region or sprite display bounds.

The supplied brief says not to redesign the room. That is followed here. The three reference images are now available and have been reviewed. References 2 and 3 appear visually identical, so they provide one repeated example rather than two distinct compositions. Their imagery is used only to assess perspective, material rendering, architectural depth and layering; none of their furniture positions are adopted as 221B coordinates.

Original-state notes (before Phase 1.9 integration):

- `WorldScene` currently builds 221B from the shared tiled floor/wall atlas and cropped prop-atlas frames. Props are individual Phaser images with configured depth values.
- Lydia uses a room-sized composite image plus independent foreground crops. This is the requested visual-completeness and physical-embedding benchmark, not a layout template for 221B.
- 221B already uses the shared movement, footprint collision, depth sorting, door, surface, actor tint/shadow, and debug systems. Its `occlusion` list is currently empty.
- No 221B entries are present in the current `INTERACTABLES` data. The configured 221B door is the room's current toggleable object; this phase must not add or change investigation logic.
- The 221B configuration currently sets `width: 480` and `height: 320`; `scenes.ts` also reports 480 × 320. Preserve the physical-room dimensions.

## Implementation record

The room now renders a generated 1536 × 1024 architectural base at the existing 480 × 320 world size, plus separately layered furniture and selective foreground crops. A localized generated threshold patch aligns the illustrated southeast opening with the existing x=428–470 passage; it is purely visual. Fireplace masonry and rainy window are part of the room base, while the configured light emitters remain runtime-driven. The door leaf uses a new transparent asset and retains its existing pivot, dimensions, rotations, ID, and initial state.

Generated files:

- `public/assets/art/environments/rooms/221b-room-base.png` — room shell, continuous floor, fixed window, fireplace architecture, baked broad light response.
- `public/assets/art/environments/rooms/layers/221b-southeast-entry-patch.png` — localized architecture repair/threshold surround matching the configured entrance.
- `public/assets/art/props/221b-final-furniture.png` — transparent furniture atlas for chairs, desk, desk chair, bookcase, chemistry table, lamp table, violin case, and rug.
- `public/assets/art/environments/rooms/layers/221b-door-leaf.png` — transparent Victorian door leaf used by existing open/closed state animation.

The existing central-rug region remains x=204–338, y=146–222. Its rendered rug has been visually aligned to that same rectangle (center 271,184; 134 × 76), without changing surface detection. Desk-chair art was added over its existing `(122,284)` footprint. Foreground crops now cover the two armchairs, desk, bookcase, and lamp table so Holmes can sort behind their upper/front portions.

Verification: production build passed. Browser physical-room suite passed all 7 checks, including 221B collision/movement, threshold state, armchair depth order, light response, mobile controls, and Lydia evidence regression. A separate Lydia bed-edge test still fails at y=143.2 against its `>150` assertion; no Lydia physical geometry was changed in this phase.

## A. Scene Structure

### Existing structure

| Element | Current authority/configuration | Reconstruction treatment |
|---|---|---|
| Room bounds | 480 × 320 | Keep exact bounds and camera/world mapping. |
| North wall | Center (240, 8), size 480 × 16; bounds x 0–480, y 0–16 | Static background: wall thickness, wallpaper, trim and skirting. |
| West wall | Center (8, 160), size 16 × 320; bounds x 0–16, y 0–320 | Static background with believable wall thickness and a visible inside edge. |
| East wall | Center (472, 160), size 16 × 320; bounds x 464–480, y 0–320 | Static background. Integrate the bookcase against this wall without changing its current sprite/footprint mapping. |
| South wall west run | Center (214, 312), size 428 × 16; bounds x 0–428, y 304–320 | Static background. |
| South wall east run | Center (475, 312), size 10 × 16; bounds x 470–480, y 304–320 | Static background. Preserve the 42-pixel opening between x 428 and x 470. |
| Floor | Currently tiled across the 480 × 320 world using `floor-boards` | Static background with one continuous wood perspective, grain scale and baked base lighting. Do not put floor art outside the world bounds. |
| Entrance | Door and exit center (449, 310), size 42 × 12; bounds x 428–470, y 304–316; east/southeast opening | Keep at its current position. Put the architectural frame and jamb in the background; use an independent door leaf for the runtime open/closed rotation. Keep the threshold visually registered to this footprint. |
| Rain window | Fixed architecture; cool emitter `(263,58)` | None configured | Integrated into `221b-room-base.png`; no independent window sprite | No | No collision is configured for the window; cool-light anchor is unchanged. |
| Fireplace | Footprint `(104,104)` | x 67–141, y 95–113; depthY 113 | Fixed architecture in `221b-room-base.png`; warm emitter `(104,88)`; no separate prop frame | No; baked architectural feature | Hearth lip remains part of the background | Fixed fireplace architecture and broad warm response are in the base. Existing configured emitter still drives Holmes response. |
| Circulation | Existing open floor plus footprints and the south/east entrance | Keep clear routes under current collision. New trim, table details, and loose objects must not visually imply blocked floor where movement is allowed. Check the path from the entrance west of the eastern bookcase/chair footprints toward the center. |
| Furniture | Individual collision footprints and prop-frame placements are mapped in section 11 | Independent sprites for each gameplay-relevant furniture item. Keep their base/contact edges registered to the configured footprint and depth anchor. |
| Light sources | Fireplace `(104, 88)`, warm, radius 128, intensity .62; table lamp `(224, 158)`, warm, radius 112, intensity .68; rainy window `(263, 58)`, cool, radius 146, intensity .20 | Treat these as lighting-only anchors for art direction and the existing Holmes light response. Bake a coherent room-wide light pass into background and sprites; preserve the current runtime light definitions. |

## Current Code Layout Visual Interpretation

This section replaces all earlier prose-based interpretations of the room's functional zones. The coordinates below come only from the current 221B `PhysicalRoomDefinition`; the origin is the room's top-left, x increases east, and y increases south. They describe the present spatial distribution, not proposed furniture moves.

| Code-based area | Current contents and coordinates | Visual reading to carry into the reconstruction |
|---|---|---|
| Northwest hearth anchor | Fireplace footprint center `(104,104)`, bounds x 67–141/y 95–113. Fireplace architecture is part of the room base; warm emitter remains `(104,88)`. | Fixed fireplace feature on the northwest side. The emitter and geometry are unchanged. |
| North-wall rain window | Fixed window architecture is part of the room base; cool-light emitter `(263,58)`. | Upper-wall feature near room north-center. Emitter and absence of window collision are unchanged. |
| Central rug and lamp-table patch | Rug surface region and visual bounds x 204–338/y 146–222. Lamp-table footprint center `(224,169)`, bounds x 213–235/y 160–178; visual center `(224,159)`, size 36 × 38. Lamp emitter `(224,158)`. | Rug art aligns to the coded surface region. Lamp/table is a separately layered sprite inside that region. |
| East-side chair and storage cluster | `armchair-left` footprint center `(360,111)`, bounds x 340–380/y 94–128; `armchair-right` center `(428,151)`, bounds x 409–447/y 134–168; bookcase center `(430,126)`, bounds x 408.5–451.5/y 116–136. | A concentration of two chairs and the bookcase along the east/northeast side. The two chairs are not arranged around the northwest fireplace in the current coordinates. The second chair and bookcase are nearly contiguous and need careful overlapping silhouette/depth treatment. |
| Upper-central loose object | Violin-case footprint center `(284,116)`, bounds x 261–307/y 108–124; sprite bounds x 257–311/y 97–125. | A low personal object north of the rug, between the fireplace/window side and the central floor. Keep its silhouette low so it does not read as a new barrier. |
| Southwest desk workstation | Desk footprint center `(122,253)`, bounds x 85–159/y 238–268; desk-chair footprint center `(122,284)`, bounds x 107–137/y 273–295. Desk visual bounds x 74–170/y 193–269; chair bounds x 106–138/y 253–295. | Desk and independently rendered chair occupy the southwest/south edge. Their separate footprints and artwork positions are preserved. |
| South-central chemistry station | Chemistry footprint center `(291,249)`, bounds x 272–310/y 242–256; visual bounds x 265–317/y 213–255. | A separate investigation/science station below the rug and east of the southwest desk. It is not physically grouped with the desk footprint, so preserve this spatial separation in the art. |
| South-edge entrance and approach | Door/exit center `(449,310)`, bounds x 428–470/y 304–316. Bookcase and east chair footprints occupy x 408.5–451.5/y 116–136 and x 409–447/y 134–168. | Entry is at the southeast/south edge. Keep it visibly readable and leave the existing approach around the west side of the eastern furniture footprints into the center. Do not add floor clutter that visually closes the route. |

**Functional interpretation:** the code describes a northwest hearth feature; a north-center rainy window; a central rug/lamp-table area; east-side seating and book storage; a southwest desk/chair workstation; a separate south-central chemistry station; and a violin case north of the central rug. These are the only functional-area labels used in this plan. In particular, earlier prose describing all sitting furniture as a northwest cluster and the desk/work area as east/southeast is superseded by this coordinate-based interpretation.

### Layer classification

| Layer class | 221B contents |
|---|---|
| Static background | Wood floor; all wall runs, wallpaper, paneling, skirting and fixed trim; fixed window frame and wall opening; fireplace masonry/body and fixed mantel; fixed wall decoration; doorway frame/jamb and threshold treatment. Bake the ambient and broad warm/cool base contribution here. Leave the physical entrance opening open. |
| Independent sprite | Both armchairs; desk; desk chair; bookcase; chemistry stand; violin case; central rug; lamp table/lamp; dynamic door leaf. Keep desk-top papers, books and small tools either as part of the desk art or separate decorative sprites that have no new collision. Keep the rain/window glass independent only if a distinct rain overlay is needed. |
| Foreground occlusion | Cutout overlays for the actual front-facing silhouettes of both armchairs, desk front, bookcase lower/front edge, lamp table if the player can pass behind it, fireplace/hearth lip if its front plane crosses a walkable route, and the doorway jamb/leaf where needed. These are transparent art layers; their crop placement and depth anchors must be derived from the unchanged sprite placement. Do not create crops mechanically where the actor can never pass behind the object. |
| Interactive object | The current configured 221B door only. Preserve its ID and door-state behavior. No new `INTERACTABLES` entries are part of this phase. Furniture art remains non-interactive unless separately authorized in a future gameplay task. |
| Lighting-only element | Three existing emitter definitions: fireplace glow, table-lamp glow and rainy-window cool light. They inform baked room light and the existing Holmes tint/shadow response; they are not extra collision objects or reasons to move sprites. |

## B. Asset Classification and visual direction

### Room base

Proposed asset: `public/assets/art/environments/rooms/221b-room-base.png`.

It should contain the continuous floor, room shell, readable wall thickness, wallpaper and paneling, baseboards, fixed window architecture, fireplace masonry/body, permanent trim/decor and baked ambient illumination. Keep the entrance cutout at the current south-edge opening. Do not bake movable furniture, the rug, the dynamic door leaf, or foreground furniture faces into this image.

`ART_ASSET_REQUESTS.md` currently suggests 1280 × 720 for the 221B kit. That aspect ratio (16:9) does not match the 480 × 320 room (3:2). Lydia's approved room source is 1536 × 1024 (3× the logical room dimensions). Use 1536 × 1024, or another agreed 3:2 multiple, as the working room-base target so it maps cleanly to the current world. This is an asset-specification correction, not a room-size change.

### Independent furniture and prop assets

Keep source assets transparent and at a consistent logical pixel density, viewing angle, light direction and palette. Each asset should expose a clear floor-contact edge so its rendered position/depth can match the configured footprint.

| Proposed asset | Current configured object(s) represented | Notes |
|---|---|---|
| `221b_armchair_a.png` | `armchair-left` | Independent chair sprite; add a matching foreground crop for the front upholstery/legs only where Holmes can pass behind it. |
| `221b_armchair_b.png` | `armchair-right` | Independent chair sprite with its own front crop; preserve its current eastern position. |
| `221b_desk.png` | `desk` | Independent desk body. Papers, books and investigative tools may be painted onto its tabletop or supplied as small no-collision overlays. Keep table body registered to the desk footprint. |
| `221b_desk_chair.png` | `desk-chair` | Separate sprite required to honor the separate existing chair footprint. Current `propVisuals` has no separate desk-chair entry; resolve this as a visual asset/integration gap without changing the footprint. |
| `221b_bookshelf.png` | `bookcase` | Independent tall sprite against the east wall, with enough visible side/front planes to establish volume. Include a front/lower occlusion crop where the player path can pass behind it. |
| `221b_chemistry_stand.png` | `chemistry` / `chemistry-stand` | Independent object; keep the apparatus visually within its current small collision area. Small contents should not expand its collision. |
| `221b_violin_case.png` | `violin-case` | Independent floor object; keep it low and aligned with its current floor contact edge. |
| `221b_lamp_table.png` | `table-lamp` sprite / `lamp-table` footprint | Keep the table/lamp base registered to the current `(224, 169)` footprint and lamp emitter `(224, 158)`. Lamp shade may be a separate overlay only if required by the lighting style. |
| `221b_rug.png` | `rug` | Independent floor-level sprite. Align its artwork with the unchanged `central-rug` surface region; see the offset in section 12. |

The fireplace body, fixed window architecture and general wall decor are part of the room base under this plan. A small fire sprite or rain-glass overlay remains optional and must not introduce code-driven fake lighting or procedural shapes.

### Door assets

Proposed transparent asset(s): `221b_door_leaf.png` plus the jamb/frame in the room base. Draw the leaf at the configured pivot and ensure its art still fits the existing `26 × 48` sprite display, origin `(0.1, 0.92)`, anchor `(428, 310)`, closed rotation `π/2`, and open rotation `-π/2`. The leaf must visually cover the existing 42 × 12 threshold in its closed pose and clear that threshold in its open pose. Do not move the door or modify its collision/rotation configuration. Exact artwork bounds and pivot should be validated against both poses before integration.

### Foreground occlusion assets

Make transparent crops only for visible planes that actually cross Holmes's walkable path:

- `221b_armchair_a_fg.png` and `221b_armchair_b_fg.png`: front upholstery/legs or lower frame, anchored at the matching chair depth edge.
- `221b_desk_fg.png`: front apron/drawer face and any lower silhouette Holmes can pass behind; do not repeat the entire desk image.
- `221b_bookshelf_fg.png`: only the lower/front edge needed for the established pass-behind relationship. The tall shelf's upper body can remain an ordinary depth-sorted sprite if the render ordering is sufficient.
- `221b_lamp_table_fg.png`: table edge only if playtesting shows Holmes can cross behind its top/front plane.
- `221b_fireplace_fg.png`: hearth lip only if the current walkable side permits Holmes to pass behind the lip.
- Door-frame crops may be part of the room base if the player never walks behind them; use a separate crop only if the existing door opening/leaf movement needs it.

Exact crop rectangles should be authored from the final transparent art and its registered world display box. They are not assigned speculative new collision rectangles in this plan.

## C. Lighting, materials, and character embedding

Follow `VISUAL_BIBLE.md`: one 3/4 top-down perspective, 16 × 16 logical grid, restrained low-saturation palette, deep walnut, muted green, burgundy, aged paper, dull brass, hard-edged pixel clusters and consistent shadow direction. Match the approved Lydia scene's readable room completion and believable object-to-floor contact, while making 221B more lived-in through contained evidence of work: worn papers, books, instruments, small tools, chair wear, soot and restrained clutter.

The existing `RoomLight` settings affect Holmes's tint/shadow response. They do not draw three separate light circles into the scene. The art pass should instead compose one continuous environment:

- Firelight: amber values on fireplace stone/metal, nearby floor and facing upholstery, fading naturally into the room's ambient base.
- Desk lamp: a smaller pool across the work surface, papers and nearby floor, centered on the existing lamp/table area.
- Rain window: cool blue in the window and upper wall, with subdued floor reflection near the existing window placement.
- Combined pass: preserve shadow detail and readable walking space; avoid bloom, isolated circular gradients, uniform brightness or hard seams between independently lit assets.

Holmes should retain the current room-appropriate scale and gameplay body. Use the configured foot anchor as the composition reference; artwork should provide a contact shadow, matching local tint, and correct depth relative to each independent sprite. Avoid a haloed cutout appearance by matching nearby floor value, edge contrast and light direction. No actor scale or collision change is proposed.

## 11. Coordinate mapping

In this table, `Footprint` is the unchanged collision rectangle calculated from its center and size. `Visual bounds` are the current `propVisuals.display` rectangle calculated from its center and size; they include transparent padding and are not a promise about opaque artwork bounds. `Visual source` records the current atlas crop for identification. The final art may have different transparent padding, but its floor-contact point must remain mapped to the same footprint/depth anchor.

| Object | Current position / sprite center | Collision footprint | Current visual bounds / depth | Proposed independent sprite? | Occlusion needed? | Notes |
|---|---:|---:|---|---|---|---|
| Fireplace | Footprint `(104,104)` | x 67–141, y 95–113; depthY 113 | Fixed architecture in `221b-room-base.png`; warm emitter `(104,88)`; no separate prop frame | No; baked architectural feature | Hearth lip remains part of the background | Fixed fireplace architecture and broad warm response are in the base. Existing configured emitter still drives Holmes response. |
| Rain window | Fixed architecture; cool emitter `(263,58)` | None configured | Integrated into `221b-room-base.png`; no independent window sprite | No | No collision is configured for the window; cool-light anchor is unchanged. |
| Central rug | Sprite `(271,184)` | None; surface `central-rug`: x 204–338, y 146–222 | x 204–338, y 146–222; depth -17.5. Source `bakerRoomProps` `(980,710,550,314)` | Yes, floor-level sprite | No | Visual rug now aligns exactly to the unchanged surface region. |
| Armchair left | Footprint `(360,111)`; sprite `(360,91)` | x 340–380, y 94–128; depthY 129 | x 331–389, y 56–126; depth 129. Source `bakerRoomProps` `(130,58,294,310)` | Yes | Yes, front crop `(130,220,294,143)` | Configured on the east/northeast side. Parent and crop share scale and source alignment. |
| Armchair right | Footprint `(428,151)`; sprite `(428,132)` | x 409–447, y 134–168; depthY 168 | x 402–454, y 100–164; depth 168. Source `bakerRoomProps` `(645,58,286,310)` | Yes | Yes, front crop `(645,220,286,148)` | Near the east wall/bookcase and above the southeast entrance route. Preserve a clear route west of its footprint. |
| Desk | Footprint `(122,253)`; sprite `(122,231)` | x 85–159, y 238–268; depthY 268 | x 74–170, y 193–269; depth 250. Source `bakerRoomProps` `(54,384,454,354)` | Yes | Yes, front crop `(54,580,454,158)` | Configured in the southwest. Keep the apron/front edge aligned with the existing footprint and depth anchor. |
| Desk chair | Footprint `(122,284)`; sprite `(122,274)` | x 107–137, y 273–295; depthY 295 | x 106–138, y 253–295; depth 295. Source `bakerRoomProps` `(672,396,220,342)` | Yes | Chair back and front edge use its independent parent sprite/depth | A separate visual now fills the existing chair footprint; no footprint change. |
| Chemistry stand | Footprint `(291,249)`; sprite `(291,234)` | x 272–310, y 242–256; depthY 256 | x 265–317, y 213–255; depth 248. Source `bakerRoomProps` `(1090,370,390,382)` | Yes | No dedicated foreground crop | Keep apparatus visually within the current stand footprint; clutter must not imply a broader blocked area. It is separated from the configured desk. |
| Bookcase | Footprint `(430,126)`; sprite `(430,100)` | x 408.5–451.5, y 116–136; depthY 136 | x 402–458, y 62–138; depth 119. Source `bakerRoomProps` `(1149,0,252,386)` | Yes | Yes, lower/front crop `(1149,250,252,130)` | East wall adjacency remains represented by the base wall return/shadow; visual crop preserves the existing position. |
| Violin case | Footprint `(284,116)`; sprite `(284,111)` | x 261–307, y 108–124; depthY 124 | x 257–311, y 97–125; depth 124. Source `bakerRoomProps` `(80,795,410,190)` | Yes | No; low profile | The case remains near the center/north, at its configured placement. |
| Lamp table / lamp | Footprint `(224,169)`; sprite `(224,159)` | x 213–235, y 160–178; depthY 178 | x 206–242, y 140–178; depth 172. Source `bakerRoomProps` `(650,680,300,344)` | Yes | Yes, front crop `(650,880,300,138)` | Preserve emitter `(224,158)`. |
| Door leaf | Pivot/anchor `(428,310)` | Door/exit bounds x 428–470, y 304–316; depthY 314 | Configured display 26 × 48 at origin `(0.1,0.92)`; depth 314; rotates `π/2` closed and `-π/2` open | Yes, dynamic transparent leaf | Entry architecture patch is static; leaf remains independently sorted | Uses `221b-door-leaf.png`; pivot, size, rotations and state are unchanged. |

### Architectural measurements

| Structure | Current bounds | Collision or visual role |
|---|---|---|
| North wall | x 0–480, y 0–16 | Collision wall; static room base. |
| West wall | x 0–16, y 0–320 | Collision wall; static room base. |
| East wall | x 464–480, y 0–320 | Collision wall; static room base. |
| South wall left | x 0–428, y 304–320 | Collision wall; static room base. |
| South wall right | x 470–480, y 304–320 | Collision wall; static room base. |
| Entry opening | x 428–470 at south edge | Keep clear for the configured door/exit. |
| Central rug surface | x 204–338, y 146–222 | Floor-type region only; not a collision footprint. |

## 12. Room Composition Review — risks and unresolved mismatches

This is a visual/physics audit only. No suggested correction is applied to configuration.

### Code-defined grouping and earlier prose

The current coordinate-based interpretation in `Current Code Layout Visual Interpretation` is authoritative and supersedes earlier text that described a northwest sitting group and an east/southeast work area. That earlier description is not used to position, group, or paint furniture. No coordinate change is proposed.

The current coordinates place the fireplace northwest; two chairs and the bookcase along the east; the rug and lamp table near the center; the desk/chair southwest; the chemistry stand south-central; and the violin case above the rug. Preserve those separate groupings faithfully. Do not move sprites inside the base painting to make them appear to occupy different locations.

### Other risks to review against final assets

1. **Rug and surface-region registration — resolved visually:** rug bounds now match the unchanged surface rectangle x 204–338, y 146–222. Browser surface/material test passed.
2. **Desk and desk-chair visual coverage — addressed:** the chair has its own atlas crop and visual bounds centered at `(122,274)` over its unchanged footprint. Desk and chair remain independently layered.
3. **Depth anchors:** fireplace and desk visual depth values (98, 250) are earlier than their footprint contact depths (113, 268). The other furniture anchors mostly match their footprint `depthY`. Check Holmes passing behind/in front of each final image and anchor the visible base edge, not the top of a transparent image box.
4. **Chair/bookcase adjacency — preserved layout risk:** their collision footprints overlap 2 pixels vertically and substantially in x. The screenshot shows the lower chair in front of the bookcase; retain that depth relationship and do not alter configured bounds.
5. **Bookcase-to-wall seam — addressed by architecture:** the base has a deep east wall return and adjacent shadow, bridging the gap without shifting the bookcase.
6. **Central circulation — browser checked:** open-floor movement and passage through the opened southeast threshold passed. Do not add floor clutter or move obstacles.
7. **Door pivot and opening — browser checked:** open/closed threshold collision and passage passed with the existing leaf origin, size and rotations.
8. **Room-base aspect ratio — resolved:** the integrated base is 1536 × 1024, matching the 480 × 320 world at 3× density.
9. **Current sprite-box bounds are not opaque bounds:** several prop source frames include transparent margins and are scaled non-uniformly by the current display dimensions. Compare opaque pixel contact edges in the current screenshot/art files before assigning final crops; never infer a new physical position from a sprite's transparent rectangle.

### Composition decision gate

Use the coordinate interpretation above as the accepted layout basis for plan review. The references inform rendering and spatial readability only; they do not authorize moving furniture or borrowing their floor plan. If final art exposes a serious collision/visual mismatch, record the exact object, footprint and impact for review instead of compensating in the art or editing coordinates.

## 13. Asset production and integration record

1. Reviewed the references as visual guidance only and kept the 480 × 320 composition with a 1536 × 1024 base.
2. Generated the room base, independent transparent furniture atlas, dynamic door leaf, and localized southeast entry patch.
3. Added asset-manifest entries, room-specific sprite frames, and foreground crops. Phaser uses the base for architecture while furniture and the existing dynamic door remain separately sorted.
4. During Phase 1.9, preserved the then-current room dimensions, wall/furniture footprints, door/exit geometry, rug region, emitters, and gameplay logic. Phase 1.9.1 later reorganized movable furniture and the rug only; fixed architecture and gameplay systems remain unchanged.
5. Captured final room, physics-debug, chair-depth, and warm/cool-light screenshots in `screenshots/phase-1-9/`.
6. `npm run build` passed. All 7 tests in `tests/browser/physical-room-system.spec.ts` passed. A separate Lydia bed-edge assertion still fails at y=143.2 vs expected `>150`; this phase made no Lydia collision changes.

## 14. Reference-image analysis

Reference images 2 and 3 appear to be the same image. Their repeated view reinforces the gameplay-readable pixel-art example but does not add a second distinct layout. The analysis below extracts visual construction principles only; furniture arrangement, rug shape and entrance placement from the references are not copied.

### Reference 1 — atmosphere and architectural richness

- **3/4 composition:** a strongly oblique, cutaway room view exposes furniture tops, front faces and side thickness together. It gives a convincing room volume, though its dramatic perspective is more painterly and distorted than the game's locked orthographic 3/4 camera. Use its depth cues, not its camera distortion.
- **Furniture and walls:** large objects visibly touch or align with walls, while the fireplace, window, shelving and work surfaces feel built into the room's architecture. Wall returns, cornices, paneling and deep jambs make the room shell thick. Extract this attachment/contact quality without adopting the reference's object positions.
- **Scale:** large chairs, worktops, fireplace and bookcases maintain a shared scale and readable silhouette despite dense surface detail. In 221B, derive each game's scale from the existing 480 × 320 composition and current object footprints/display sizes, not from reference pixel counts.
- **Circulation:** a large open floor route remains legible between dense furniture groups. Local rugs organize occupied areas while exposed boards show where the player can walk. Apply this negative-space principle to the current coded route; do not move obstacles to match the pictured path.
- **Occlusion:** chair arms/backs, desk fronts, shelves, doorway edges and foreground wall returns overlap naturally. This supports the planned independent sprites and selective foreground masks rather than a single baked room illustration.
- **Lighting:** concentrated amber sources from the fire and practical lamps reflect on wood and leather, while the window creates a large cool-blue area. The transition is continuous across surfaces, with soft value falloff and contact shadows rather than separate visible circles.
- **Material/lived-in detail:** walnut grain, aged wallpaper, leather, fabric, brass, glass and clutter have distinct but restrained responses. Books, papers and instruments make the space feel used. Keep such detail around the already configured furniture; do not use it to disguise changed sprite bases.

### References 2/3 — gameplay framing and pixel-art room construction

- **3/4 perspective:** the repeated image has a more orthographic, game-readable 3/4 view than Reference 1. Furniture tops and front planes use a consistent direction, which is closer to `VISUAL_BIBLE.md` and should guide the 221B asset perspective.
- **Room boundaries:** thick perimeter walls, visible interior faces, paneling, baseboard and cutaway foreground edges establish a clear contained room. The rear wall reads as architecture, not a row of disconnected props.
- **Furniture scale and attachment:** chairs, desk, bookshelf, fireplace and window share a consistent pixel density. Tall items have enough side/front volume to read as furniture; wall-attached items meet the wall plane, and floor objects have a visible base/contact shadow.
- **Walkability:** the image separates denser occupied/rug areas from a broad readable floor path. Decorative density is concentrated on desks and shelves rather than spread uniformly across the walkable boards. Use the same hierarchy while leaving current collision routes unobstructed.
- **Depth and foreground:** rugs sit under chairs, chair legs and front rails create layering, and the doorway is framed by wall thickness. The visual supports selective cropping for foreground occlusion. The 221B implementation should split only surfaces Holmes can actually pass behind.
- **Cold/warm light:** the blue rainy window contrasts with amber lamps/fire, and both affect nearby wood and objects. Use one coherent baked lighting pass keyed to the existing 221B emitters.
- **Integrated room feel:** plank direction, furniture feet, rug edges, wall paneling, shadows and object scale agree, so the room reads as one constructed environment rather than unrelated atlas sprites. This is the central quality to transfer.

### What the references do not authorize

Their sitting area, desk position, bookshelf side, rug placement, room proportions and entrance arrangement are examples only. None override the current code coordinates in section 11 or the code-derived zone interpretation above. Translate the perspective, scale, contact, occlusion, architectural thickness, material response and unified lighting into the existing 221B layout.
