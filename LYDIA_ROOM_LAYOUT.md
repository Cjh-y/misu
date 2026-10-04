# Lydia Bedroom — Phase 1.6 room blockout

Logical room: 480 × 320 world pixels; 16-pixel grid. This is the spatial plan for the replacement room map, not a finished art layer.

## Plan coordinates

Coordinates are room world coordinates measured from the top-left.

| Element | Approximate footprint / line | Spatial rule |
|---|---:|---|
| Interior bounds | x 20–460, y 16–304 | Four continuous walls with visible thickness and skirting. |
| Main door | West wall, y 170–252 | Door is cut into the west wall. Holmes enters eastward from the hall into a clear landing. |
| Main window | North wall, x 105–207 | Window occupies the wall plane; curtains hang on its sides; no large furniture below it. |
| Vent mesh (E08) | North wall, x 298–320 | Wall opening near the bed head, separate from the window. |
| Bed | x 240–301, y 52–162 | Headboard against the north wall; the single bed is offset from the wardrobe to preserve a wide east aisle. |
| Bedside table / lamp | x 219–239, y 58–108 | Tucked beside the bed head, clear of both window and the west walking lane. |
| False bell rope (E09) | x 306–312, y 40–80 | Attached beside the bed head; the player can approach from the open east aisle. |
| Wardrobe | x 379–434, y 22–113 | Against the east wall. Keep its western edge clear of the through route. |
| Mirror | x 426–449, y 104–181 | Against the east wall below the wardrobe, not in the passage. |
| Desk | x 383–438, y 195–269 | Against the southeast wall, with the chair facing it from the west. |
| Chair | x 354–382, y 214–263 | Pull-out space is part of the desk alcove; keep the south/east approach open. |
| Safe | x 442–460, y 244–282 | Discreetly beside the desk zone, not in the middle of a route. |
| Washstand | x 51–81, y 83–142 | Secondary use area against the west wall, above the door opening. |
| Rug | x 217–315, y 120–184 | Under the bed foot and bedside area; it does not fill the walkable floor. |

## Schematic

```text
NORTH WALL
┌────────────────────────────────────────────────┐
│  window + curtains          vent               │
│  [   ]             table  ┌── bed ──┐           │
│                           │ headwall│   wardrobe│
│ washstand                 │         │           │
│                           └── foot ─┘     mirror│
│      clear west lane       rug       clear east │
│ door → landing → central route → desk + chair   │
│                                    safe         │
└────────────────────────────────────────────────┘
SOUTH WALL
```

## Route check

- Door landing begins around (50, 224), then opens into the central floor.
- A west lane from the entry to the bed is open; the bed-to-wardrobe aisle at x 301–379 is 78 world pixels wide (more than twice the 28.8-pixel Holmes visual width).
- The bed's foot has open floor below it. The player can route around either side and approach the desk from its chair side.
- Window, vent and door are attached to wall runs. The bed headboard also touches the north wall; the wardrobe and desk are wall-aligned.
- E06 is attached to the door/lock, E08 to the vent mesh, E09 to the rope beside the bed. IDs, evidence definitions and relations remain unchanged.
