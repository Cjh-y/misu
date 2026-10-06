export interface ArtAsset {
  key: string;
  path: string;
  kind: 'tileset'|'sprite-sheet'|'portrait-sheet'|'prop-sheet'|'evidence-sheet'|'background';
  pixelArt: true;
  frame?: { columns: number; rows: number; logicalCharacter: [number, number] };
}

/** One inventory for case-independent visual resources. Missing files are documented in ART_ASSET_REQUESTS.md. */
export const ART_ASSETS = {
  interiorTiles: {key:'interior-tiles',path:'/assets/art/tilesets/victorian-interior-tiles.png',kind:'tileset',pixelArt:true},
  // Legacy transparent source atlas is retained for Manor Hall's fallback runner sprites only.
  lydiaProps: {key:'lydia-props',path:'/assets/art/props/lydia-bedroom-props.png',kind:'prop-sheet',pixelArt:true},
  fakeBellRope: {key:'bell-rope',path:'/assets/art/props/fake-bell-rope.png',kind:'prop-sheet',pixelArt:true},
  bakerProps: {key:'baker-props',path:'/assets/art/props/baker221b-props.png',kind:'prop-sheet',pixelArt:true},
  bakerWindow: {key:'baker-rain-window',path:'/assets/art/props/baker-rain-window.png',kind:'prop-sheet',pixelArt:true},
  bakerRoomBase: {key:'baker-room-base',path:'/assets/art/environments/rooms/221b-room-base.png',kind:'background',pixelArt:true},
  bakerRoomProps: {key:'baker-room-props',path:'/assets/art/props/221b-final-furniture.png',kind:'prop-sheet',pixelArt:true},
  bakerDoorLeaf: {key:'baker-door-leaf',path:'/assets/art/environments/rooms/layers/221b-door-leaf.png',kind:'prop-sheet',pixelArt:true},
  bakerEntryPatch: {key:'baker-entry-patch',path:'/assets/art/environments/rooms/layers/221b-southeast-entry-patch.png',kind:'background',pixelArt:true},
  corridorDecor: {key:'corridor-decor',path:'/assets/art/props/manor-corridor-decor.png',kind:'prop-sheet',pixelArt:true},
  manorCorridorRoomBase: {key:'manor-corridor-room-base',path:'/assets/art/environments/rooms/manor-corridor-room-base.png',kind:'background',pixelArt:true},
  manorCorridorDoorLeaf: {key:'manor-corridor-door-leaf',path:'/assets/art/environments/rooms/layers/manor-corridor-door-leaf.png',kind:'prop-sheet',pixelArt:true},
  manorCorridorLydiaThreshold: {key:'manor-corridor-lydia-threshold',path:'/assets/art/environments/rooms/layers/manor-corridor-lydia-threshold.png',kind:'prop-sheet',pixelArt:true},
  holmes: {key:'holmes-sheet',path:'/assets/art/characters/sprites/holmes.png',kind:'sprite-sheet',pixelArt:true,frame:{columns:3,rows:4,logicalCharacter:[16,24]}},
  holmesPhase16: {key:'holmes-phase16',path:'/assets/art/characters/sprites/holmes-phase16.png',kind:'sprite-sheet',pixelArt:true,frame:{columns:4,rows:4,logicalCharacter:[29,43]}},
  lydiaWorldRoomBase: {key:'lydia-world-room-base',path:'/assets/art/environments/rooms/lydia-bedroom-room-base.png',kind:'background',pixelArt:true},
  lydiaWorldBed: {key:'lydia-world-bed',path:'/assets/art/props/lydia-world/camera-locked/bed.png',kind:'prop-sheet',pixelArt:true},
  lydiaWorldNightstand: {key:'lydia-world-nightstand',path:'/assets/art/props/lydia-world/camera-locked/nightstand.png',kind:'prop-sheet',pixelArt:true},
  lydiaWorldWardrobe: {key:'lydia-world-wardrobe',path:'/assets/art/props/lydia-world/camera-locked/wardrobe.png',kind:'prop-sheet',pixelArt:true},
  lydiaWorldWashstand: {key:'lydia-world-washstand',path:'/assets/art/props/lydia-world/camera-locked/washstand.png',kind:'prop-sheet',pixelArt:true},
  lydiaWorldDesk: {key:'lydia-world-desk',path:'/assets/art/props/lydia-world/camera-locked/desk.png',kind:'prop-sheet',pixelArt:true},
  lydiaWorldChair: {key:'lydia-world-chair',path:'/assets/art/props/lydia-world/camera-locked/chair.png',kind:'prop-sheet',pixelArt:true},
  lydiaWorldMirror: {key:'lydia-world-mirror',path:'/assets/art/props/lydia-world/camera-locked/mirror.png',kind:'prop-sheet',pixelArt:true},
  lydiaWorldRug: {key:'lydia-world-rug',path:'/assets/art/props/lydia-world/rug.png',kind:'prop-sheet',pixelArt:true},
  lydiaWorldSafe: {key:'lydia-world-safe',path:'/assets/art/props/lydia-world/camera-locked/safe.png',kind:'prop-sheet',pixelArt:true},
  lydiaWorldVent: {key:'lydia-world-vent',path:'/assets/art/props/lydia-world/vent.png',kind:'prop-sheet',pixelArt:true},
  lydiaDoorLeaf: {key:'lydia-bedroom-door-leaf',path:'/assets/art/environments/rooms/layers/lydia-bedroom-door-leaf.png',kind:'prop-sheet',pixelArt:true},
  lydiaDoorUnderlay: {key:'lydia-bedroom-door-underlay',path:'/assets/art/environments/rooms/layers/lydia-bedroom-door-underlay.png',kind:'prop-sheet',pixelArt:true},
  watson: {key:'watson-sheet',path:'/assets/art/characters/sprites/watson.png',kind:'sprite-sheet',pixelArt:true,frame:{columns:4,rows:4,logicalCharacter:[16,24]}},
  portraits: {key:'cast-portraits',path:'/assets/art/characters/portraits/cast-contact-sheet.png',kind:'portrait-sheet',pixelArt:true},
  evidence: {key:'evidence-triptych',path:'/assets/art/evidence/evidence-triptych.png',kind:'evidence-sheet',pixelArt:true},
  title: {key:'title-london-rain',path:'/assets/art/title/london-rain.png',kind:'background',pixelArt:true},
} satisfies Record<string,ArtAsset>;

/** Scene and evidence references let new cases reuse the renderer without copying its scene code. */
export const VISUAL_SLICE_ASSETS = {
  scenes: {
    baker221b: { tiles: ART_ASSETS.interiorTiles, props: ART_ASSETS.bakerProps },
    manorHall: { tiles: ART_ASSETS.interiorTiles, props: ART_ASSETS.corridorDecor },
    lydiaRoom: { architecture:ART_ASSETS.lydiaWorldRoomBase, entities:[ART_ASSETS.lydiaWorldBed,ART_ASSETS.lydiaWorldNightstand,ART_ASSETS.lydiaWorldWardrobe,ART_ASSETS.lydiaWorldWashstand,ART_ASSETS.lydiaWorldDesk,ART_ASSETS.lydiaWorldChair,ART_ASSETS.lydiaWorldMirror,ART_ASSETS.lydiaWorldRug,ART_ASSETS.lydiaWorldSafe,ART_ASSETS.lydiaWorldVent] },
  },
  characters: {
    holmes: { sprite: ART_ASSETS.holmes, portrait: ART_ASSETS.portraits },
    watson: { sprite: ART_ASSETS.watson, portrait: ART_ASSETS.portraits },
    lydia: { portrait: ART_ASSETS.portraits },
    ireneVale: { portrait: ART_ASSETS.portraits },
    drGrayson: { portrait: ART_ASSETS.portraits },
    marthaReed: { portrait: ART_ASSETS.portraits },
    lestrade: { portrait: ART_ASSETS.portraits },
  },
  evidence: {
    E06: { sheet: ART_ASSETS.evidence, panel: 0 },
    E08: { sheet: ART_ASSETS.evidence, panel: 1 },
    E09: { sheet: ART_ASSETS.evidence, panel: 2 },
  },
  title: ART_ASSETS.title,
} as const;

export const WORLD_SCALE = {
  tile: 16,
  character: {width:16,height:24},
  collision: {width:10,height:8,footOffsetY:15},
  cameraZoom: 'fit viewport height to room; integer rounded zoom; round pixels',
  filtering: 'nearest-neighbor',
} as const;
