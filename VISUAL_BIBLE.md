# 《谜溯》Visual Bible

Phase 1.6 locks the visual rules for Lydia's Bedroom and the Holmes playable sprite. These rules are the reference for later art; they do not authorize expanding the current scene scope.

## Camera angle

- Use one orthographic 3/4 top-down RPG view, approximately 40° down toward the room.
- Show object tops and a restrained amount of front/side planes. Floor, walls, furniture and characters share the same viewing direction.
- Do not mix flat overhead floors, front-facing furniture, isometric maps or illustration perspective in one playable scene.

## Character scale

- World grid: 16 × 16 logical pixels per tile.
- Lydia-only Holmes display target: 29 × 43 logical pixels (a 1.2× visual increase from the first pass), approximately 1.8 × 2.7 tiles. His feet anchor the collision position visually.
- Keep the gameplay foot collider at 10 × 8 logical pixels. The enlarged body is visual only; it must not change movement or interaction distances.
- Holmes is the primary scale reference. His silhouette should be easy to read against furniture and floor.
- Do not apply this Phase 1.6 character display scale to the other rooms until Lydia's room is approved.

## Furniture scale

Use the 29 × 43 Holmes display as a reference, not a rigid sprite atlas measurement:

- Desk top: around waist height (roughly 20–24 logical pixels in its visible vertical dimension).
- Chair back: around 26–32 logical pixels high.
- Bed: around 58–70 logical pixels long, approximately 1.6–2 Holmes heights.
- Door: around 48–54 logical pixels high (approximately 1.3–1.5 Holmes heights).
- Wardrobe: around 52–68 logical pixels high; it may exceed Holmes, but should read as furniture rather than architecture.
- Furniture rests against a wall or floor plane. Keep walkable gaps credible for a person.

## Tile and pixel density

- Keep gameplay and collision coordinates on the existing 16-pixel logical grid.
- Render pixel art with nearest-neighbor sampling (`pixelArt: true`, `roundPixels: true`, CSS `image-rendering: pixelated`).
- The Lydia background source is 1536 × 1024 for a 480 × 320 world, giving a consistent 3× source density before nearest-neighbor display scaling.
- Match characters and future props to the environment's restrained pixel clusters. Prefer fewer, larger clusters over high-frequency fabric, wood or carpet textures.
- Avoid antialiased edges and tiny highlights that disappear at gameplay scale.

## Core palette

- Night: deep blue-black and muted slate blue.
- Wood: dark walnut and near-black brown.
- Secondary colors: dusty burgundy, faded olive and aged cream.
- Light accents: restrained warm amber and dull brass.
- Keep saturation low. No neon, bright gold UI ornament or horror red.

## Light direction

- Use a clear warm practical light near the bedside lamp, contrasted with cool night light at the window.
- Let corners and wall edges fall into readable blue-brown shadow; do not illuminate the full room evenly.
- Keep the light source legible. No bloom, soft-focus filter or modern cinematic gradient over the pixel clusters.

## Shadow rules

- Shadows fall consistently down and to the right of objects relative to the room view.
- Use compact hard-edged pixel clusters with a small warm bounce near the lamp.
- Darken corners enough to create quiet tension while preserving the walkable floor and interaction silhouettes.

## Material rules

- Reuse the same dark walnut value range and edge treatment across furniture in a room.
- Use a few broad wood grain clusters, not many thin lines.
- Metal is dull iron or aged brass; fabric is muted burgundy, olive or cream with low-contrast patterns.
- Keep wall panels, trim and furniture grounded on the same floor plane. Do not paste assets rendered from a different camera angle.

## Room composition rules

- Design the room as one inhabitable space, with a clear entrance, perimeter, furniture groupings and continuous walkable routes.
- Place furniture according to use: bed beside bedside table and lamp; chair facing desk; wardrobe and mirror against a wall.
- Lydia's bed, vent and bell rope form a meaningful visual group. The milk saucer and safe should read as plausible belongings, not display props.
- E06, E08 and E09 keep their IDs and evidence meaning. Their scene hotspots should sit beside the corresponding door/lock, vent mesh and false rope artwork.
- The room should suggest that someone lives there before any interaction marker appears. Avoid evenly spaced furniture and large featureless empty floor.
- Room art must preserve clear player movement and avoid hiding Holmes behind prominent furniture.

## Mobile camera rules

- Desktop and mobile use the same 480 × 320 world, map positions, collision and interaction rules.
- Fit the camera to the viewport while respecting world bounds; keep round-pixel rendering and smooth follow.
- In portrait, aim for Holmes to occupy 8–12% of the viewport height. At 390 × 844, the 36-pixel character and current fit zoom target about 11%.
- Frame Holmes with nearby furniture and an adjacent walkable route. Do not show excessive room area, crop outside the room, or enlarge controls to compete with the character.
- Do not change game UI layout as a substitute for camera tuning.

## Example rules

**Good:** one 3/4 room composition; bed and bedside table touch the room's use pattern; vent and bell rope sit by the sleeping area; Holmes is large enough to read; warm lamp light fades into cool corners; rug detail stays quieter than the character.

**Bad:** pure overhead floor with front-facing wardrobe; a foreshortened bed pasted onto unrelated floor art; a tiny Holmes beside highly detailed furniture; every prop separated and evenly spaced; the same brightness across the full room; a portrait camera that leaves Holmes as a small figure in empty space.
