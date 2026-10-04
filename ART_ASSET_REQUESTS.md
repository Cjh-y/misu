# ART_ASSET_REQUESTS

Phase 1.5 visual asset backlog. Existing files under `public/assets/art/` are source artwork; the generated originals are preserved under `generated_images/`.

## ART-001

Type: Environment

Name: Lydia Bedroom playable room kit

Required By: `src/game/scenes/WorldScene.ts`

Status: Partial — furniture, floor/wall atlas and the disconnected bell-rope prop are available; room-specific wall and doorway pieces remain incomplete

Priority: P0

Expected Files:

- `public/assets/art/environments/rooms/lydia-bedroom.png`

Recommended Size: 1280 × 720 for the room layout reference; isolated prop PNG at 4× logical resolution with alpha

Description: Orthographic top-down room construction kit and exact disconnected bell rope art. Compose the playable room from tiles and separate sprites, with walkable paths around the existing evidence hotspots. Do not deliver a front-facing interior illustration as a map.

Prompt:

> A cohesive playable Victorian bedroom kit for a top-down detective adventure game, late 19th century English manor, made as separate orthographic floor and wall tile pieces and isolated props rather than a perspective room illustration. Include carved single bed, bedside table and oil lamp, wardrobe, writing desk, vanity and mirror, patterned rug, heavy curtain and window, old door, wall ventilation opening, exact decorative disconnected bell pull rope near the pillow, small side table and porcelain milk saucer. Leave clear paths for a 16×24 pixel character and access to door, vent and bed. Warm amber lamp, dark brown wood, dusty burgundy and muted olive wallpaper, elegant but unsettling in a quiet way. Sharp handcrafted pixel art, consistent 4× logical pixel density, no antialiasing, no text, no characters, no UI, no 3D, no photorealism.

## ART-002

Type: Environment

Name: Manor Corridor

Required By: `src/game/scenes/WorldScene.ts`

Status: Partial — Victorian shared floor/wall tiles and a corridor decor atlas are available; connected corridor wall/door assembly remains missing

Priority: P1

Expected File: `public/assets/art/environments/rooms/manor-corridor.png`

Recommended Size: 1280 × 720 equivalent tileset and prop sheet

Description: Reusable top-down corridor tiles and props, with clear doors and uninterrupted player path.

Prompt:

> A Victorian manor corridor tile set for a playable top-down pixel art detective game. Long hallway components with dark polished wooden floor tiles, deep burgundy and brown patterned wallpaper, carved wooden wainscoting, readable closed-door sprites, framed portrait props, antique wall lamps, runner rug segments, narrow side table, small vase and brass candle holders. Provide orthographic tile pieces and isolated props that can be assembled in a tile map, not a room illustration. Clear continuous walkable path. Nighttime warm pools of amber light, elegant and slightly oppressive, not horror. Crisp handcrafted 16-bit pixel clusters, muted historical palette, consistent scale, transparent background for props, no text, no UI, no characters, no 3D, no photorealism.

## ART-003

Type: Environment

Name: 221B Baker Street sitting room kit

Required By: `src/game/scenes/WorldScene.ts`

Status: Partial — detective-room prop atlas and rainy window are available; room-specific wall tiles and room assembly remain missing

Priority: P1

Expected File: `public/assets/art/environments/rooms/baker-221b.png`

Recommended Size: 1280 × 720 equivalent tileset and prop sheet

Description: Top-down Victorian sitting room kit supporting the existing 221B opening and its free movement space.

Prompt:

> A cohesive 2D top-down pixel art tile and prop kit for 221B Baker Street, a compact late Victorian London detective sitting room. Include dark wooden floor tiles, warm brown patterned wall and fireplace pieces, antique armchairs, writing desk with papers, bookshelves, small chemistry apparatus, a closed violin case and a warm table lamp. A rainy night window is a separate wall prop. Keep furniture silhouettes readable from above and leave a clear central movement path. Warm amber interior against cool rainy window light, cozy, intellectual and quietly mysterious. Handcrafted crisp 16-bit / 32-bit pixel clusters, restrained muted palette, consistent pixel density. Separate orthographic components, no characters, no text, no UI, no perspective illustration, no 3D, no photorealism.

## ART-004

Type: Evidence

Name: E06, E08, E09 individual evidence images

Required By: `src/main.ts`

Status: Partial — one three-panel sheet is used for notebook thumbnails; individual icon files are missing

Priority: P1

Expected Files:

- `public/assets/art/evidence/E06-door-window-lock.png`
- `public/assets/art/evidence/E08-vent-mesh.png`
- `public/assets/art/evidence/E09-false-bell-rope.png`

Recommended Size: 256 × 256 each, transparent or very dark neutral background

Description: Separate centered close-up assets matching the existing E06 door/window lock, E08 vent mesh and E09 false bell rope meanings. The combined sheet is ordered E06, E08, E09. Keep IDs and logic unchanged.

Prompt:

> A close-up evidence illustration for a Victorian detective pixel-art game, centered readable single object, crisp sharp pixels, muted palette, warm lamplight, restrained dark background. Subject: [E06: old bedroom door and window latch secured from inside / E08: brass ventilation grate with intact fine mesh embedded in old patterned wallpaper / E09: newly braided dark-red decorative bell rope beside a bed, visibly disconnected from a working bell system]. No text, no UI, no characters, no 3D, no photorealism.

## ART-005

Type: UI

Name: Dialogue / Case Notebook / Deduction board texture set

Required By: `src/main.ts`, `src/styles.css`

Status: Missing — current DOM layout has a restrained CSS parchment skin, but no authored pixel-art panel textures

Priority: P1

Expected Files:

- `public/assets/art/ui/dialogue-panel.png`
- `public/assets/art/ui/case-notebook-frame.png`
- `public/assets/art/ui/deduction-paper.png`

Recommended Size: 9-slice panels, 512 × 256 or larger, transparent outside the frame

Description: Reusable original panel skins that do not bake any text or game content into the art.

Prompt:

> Victorian detective game interface texture kit in crisp pixel art: a wide cream parchment dialogue panel with a small portrait opening, a dark navy-charcoal frame and tiny restrained brass details; an open investigative notebook frame with aged cream paper, dark navy leather-like binding and simple tabs; and a plain aged paper deduction sheet for evidence cards and notes. Practical readable empty areas, minimal ornament, consistent sharp pixel scale, transparent outside each shape. No text, letters, icons, logos, gears, photos, glow or gradients.

## ART-006

Type: Transition

Name: Rainy Baker Street and manor arrival

Required By: scene transition layer (future Phase 1.5 polish)

Status: Partial — London title background is available; arrival-at-manor art is missing

Priority: P2

Expected Files:

- `public/assets/art/transitions/trans-01-baker-street-rain.png`
- `public/assets/art/transitions/trans-02-manor-arrival.png`

Recommended Size: 16:9, at least 1280 × 720

Description: Quiet cinematic transition plates; keep transition text composited by the game, not baked into images.

Prompt:

> Wide cinematic handcrafted pixel art of an old English Victorian manor at night in light rain. Large manor house behind dark trees, a few warm windows, wet stone drive, iron gate, subtle mist and distant carriage silhouette. Elegant detective mystery mood, not horror. Crisp pixel clusters, muted blue-grey night, dark brown and restrained amber light, 16:9 center composition. No text, no UI, no close characters, no photorealism, no 3D.

## Phase 1.6 visual review assets

### ART-007

Type: Environment

Name: Lydia Bedroom cohesive room map

Required By: `src/game/scenes/WorldScene.ts`

Status: Replanned and generated for visual review; current map places the entry in the west wall and preserves a wide bed-to-wardrobe passage

Priority: P0

Expected File: `public/assets/art/environments/rooms/lydia-bedroom-phase16.png`

Recommended Size: 1536 × 1024 for a 480 × 320 logical room

Description: Complete enclosed Victorian bedroom composition based on `LYDIA_ROOM_LAYOUT.md`. The west-wall door is part of a continuous wall run; the north wall has the window and separate vent; the bed head touches that wall; the wardrobe and desk align with the east/southeast walls. A wide clear route passes between bed and wardrobe. The map uses one 3/4 top-down RPG camera and shared pixel density.

Prompt: A playable enclosed Victorian bedroom in one consistent 3/4 top-down RPG perspective, 3:2 map for a 480×320 world. Continuous four walls, baseboards, corners and floor. A real doorway cut into the lower west wall, wall continuing above and below; clear landing inside. North-wall rainy window on the left, separate vent near the bed head. Single bed upper center-right, headboard touching north wall; bedside lamp and bell rope by the head. Wardrobe flush east wall; mirror below it; compact southeast desk with pull-out chair and nearby safe; washstand against west wall. Keep a wide clear route from door around both sides of bed to clues and desk. Dark walnut, blue-black night, muted burgundy/olive, aged cream and warm local amber light. Asymmetric inhabited arrangement, spare walkable floor, restrained crisp pixel clusters. No mixed perspective, pasted props, text, UI, characters, horror, photorealism or 3D.

### ART-008

Type: Character

Name: Holmes playable 3/4 sprite sheet

Required By: `src/game/scenes/WorldScene.ts`

Status: Revised for visual review; broader shoulders and coat volume, currently enabled in Lydia's Bedroom only

Priority: P0

Expected File: `public/assets/art/characters/sprites/holmes-phase16.png`

Recommended Size: 4 × 4 grid; transparent background; 29 × 43 logical display target

Description: Idle and walking poses facing north, south, east and west. Holmes is slim, readable and scaled as the primary player reference. Use the same muted palette, 3/4 top-down angle and light direction as ART-007.

Prompt: Playable Victorian detective protagonist sprite sheet for a serious 2D detective adventure game, matching the supplied Lydia bedroom style. Tall and lean but physically substantial: slightly broader shoulders, structured long charcoal coat with visible tails, clear arms and separated legs, leather shoes planted on ground, muted cravat and restrained deerstalker cap. 29 × 43 logical display target. Use the same 3/4 top-down camera, pixel density, restrained light clusters and upper-left amber lamp light as the room. Include idle north/south/west/east and three walk frames per direction in a 4 × 4 grid, with consistent anatomy and baseline. Transparent background. No environment, text, chibi scale, photorealism or 3D.
