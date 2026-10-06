import { expect, test } from '@playwright/test';

const stateAt=(x:number,z:number)=>({
  currentScene:'lydia-room',playerPosition:{x:240,y:180},playerWorldPosition3D:{x,y:0,z},
  discoveredEvidence:[],investigatedObjects:[],dialogueFlags:{},
  storyFlags:{started:true,openingComplete:true,watsonSpoken:true},dialogueProgress:{opening:9},
  hypotheses:[],hypothesisState:{},unlockedLocations:['221b','hall','lydia-room'],
});
async function continueAt(page:any,x:number,z:number){
  await page.goto('/');
  await page.evaluate((state:any)=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state})),stateAt(x,z));
  await page.reload();await page.getByRole('button',{name:/继续案件/}).click();
  await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房');await page.waitForTimeout(250);
}

test('Lydia runtime has one architecture owner and every floor object is a 3D world entity',async({page})=>{
  await page.setViewportSize({width:1440,height:810});
  await page.addInitScript(()=>window.addEventListener('misu:scene-ready',(event:any)=>{
    if(event.detail.scene==='lydia-room')(window as any).__sceneGraph=event.detail.sceneGraphAudit;
  }));
  await continueAt(page,2.1,2.6);
  const graph=await page.evaluate(()=>((window as any).__sceneGraph));
  expect(graph.architecture).toMatchObject({owner:'architecture-only room base',texture:'lydia-world-room-base'});
  expect(graph.entities.map((entity:any)=>entity.id)).toEqual(['rug','bed','nightstand','wardrobe','washstand','desk','chair','safe']);
  expect(graph.wallMounted.map((entity:any)=>entity.id)).toEqual(['mirror','vent-grille']);
  for(const entity of graph.entities){
    expect(entity.position).toHaveProperty('x');expect(entity.position).toHaveProperty('y');expect(entity.position).toHaveProperty('z');
    expect(entity.dimensions.width).toBeGreaterThan(0);expect(entity.dimensions.height).toBeGreaterThan(0);expect(entity.dimensions.depth).toBeGreaterThan(0);
    expect(entity.volume.min.x).toBeLessThan(entity.volume.max.x);
  }
  expect(graph.entities.find((entity:any)=>entity.id==='bed').visualOwner).toBe('WorldEntity');
  expect(graph.furnitureAssetFallback).toBe(false);
  await page.screenshot({path:'screenshots/phase-1-16/03-bedroom-world-entities.png'});
  await page.keyboard.press('F7');await page.waitForTimeout(100);
  await page.screenshot({path:'screenshots/phase-1-16/04-bedroom-3d-debug-reconstruction.png'});
});

test('bed depth ordering follows its world volume through rear, sides, foot and front',async({page})=>{
  await page.setViewportSize({width:1440,height:810});
  await page.addInitScript(()=>window.addEventListener('misu:player-position',(event:any)=>((window as any).__position=event.detail)));
  const samples=[
    // The north wall blocks the bed's direct center-rear point after the group
    // is moved back. Use its accessible rear-left corner for the depth check.
    {name:'bed-behind',x:3.9,z:.35},
    {name:'bed-left',x:4.65,z:1.86},
    {name:'bed-right',x:6.79,z:1.86},
    {name:'bed-foot',x:5.72,z:3.30},
    {name:'bed-front',x:5.72,z:3.52},
  ];
  const depths=[];
  for(const sample of samples){
    await continueAt(page,sample.x,sample.z);
    const position=await page.evaluate(()=>((window as any).__position));
    expect(position.worldPosition3D).toMatchObject({x:sample.x,y:0,z:sample.z});
    expect(position.footAnchorScreen).toEqual(position.projectionScreen);
    expect(position.worldDepthKey).toBe(4000+sample.z*100);depths.push(position.worldDepthKey);
    await page.screenshot({path:`screenshots/phase-1-16/${sample.name}.png`});
  }
  expect(depths[0]).toBeLessThan(depths[1]);expect(depths[4]).toBeGreaterThan(depths[0]);
});

test('Holmes walks behind and around the bed without furniture copies or sudden layer loss',async({page})=>{
  await page.addInitScript(()=>{
    (window as any).__samples=[];
    window.addEventListener('misu:player-position',(event:any)=>{if(event.detail.scene==='lydia-room')(window as any).__samples.push(event.detail);});
  });
  await continueAt(page,4.0,.2);
  await page.keyboard.down('s');
  await page.waitForFunction(()=>((window as any).__samples.at(-1)?.worldPosition3D?.z??0)>3.4,null,{timeout:15000});
  await page.keyboard.up('s');await page.waitForTimeout(250);
  await page.keyboard.down('d');
  await page.waitForFunction(()=>((window as any).__samples.at(-1)?.worldPosition3D?.x??0)>5.4,null,{timeout:15000});
  await page.keyboard.up('d');await page.waitForTimeout(250);
  const samples=await page.evaluate(()=>((window as any).__samples));
  expect(samples.length).toBeGreaterThan(5);
  expect(samples[0].worldDepthKey).toBeLessThan(4195);
  expect(samples.at(-1).worldDepthKey).toBeGreaterThan(4195);
  expect(samples.at(-1).worldPosition3D.x).toBeGreaterThan(5.4);
  for(let i=1;i<samples.length;i++)expect(samples[i].worldDepthKey).toBeGreaterThanOrEqual(samples[i-1].worldDepthKey);
  await page.screenshot({path:'screenshots/phase-1-16/bed-route-behind-to-front.png'});
});

test('wardrobe, desk-chair and washstand have stable volumes at their approach spaces',async({page})=>{
  test.setTimeout(90_000);
  await page.setViewportSize({width:1440,height:810});
  const routes=[
    {name:'wardrobe-front',x:9.1,z:1.06},
    {name:'wardrobe-side',x:8.37,z:.52},
    {name:'desk-side-and-chair',x:8.4,z:4.92},
    {name:'desk-front',x:9.25,z:4.18},
    {name:'chair-back',x:7.5,z:3.9},
    {name:'desk-chair-walk-gap',x:8.5,z:4.6},
    {name:'chair-front',x:7.5,z:5.08},
    {name:'washstand-front',x:1.2,z:2.06},
    {name:'washstand-side-corner',x:1.86,z:1.55},
  ];
  for(const route of routes){
    await continueAt(page,route.x,route.z);
    await page.screenshot({path:`screenshots/phase-1-16/${route.name}.png`});
  }
});

test('3D furniture groups and vertical collision acceptance views',async({page})=>{
  test.setTimeout(180_000);
  await page.setViewportSize({width:1440,height:810});
  await page.addInitScript(()=>{
    window.addEventListener('misu:scene-ready',(event:any)=>{if(event.detail.scene==='lydia-room')(window as any).__audit=event.detail.sceneGraphAudit;});
    window.addEventListener('misu:player-position',(event:any)=>{if(event.detail.scene==='lydia-room'){(window as any).__position=event.detail;(window as any).__samples??=[];(window as any).__samples.push(event.detail);}});
    window.addEventListener('misu:world-schematic',(event:any)=>{(window as any).__schematic=event.detail;});
  });
  const views=[
    {name:'01-bedroom-functional-groups',x:2.1,z:2.6,debug:false},
    {name:'02-sleeping-group-bed-nightstand-rug',x:4.35,z:2.35,debug:false},
    {name:'03-work-group-desk-chair',x:7.0,z:3.15,debug:false},
    {name:'04-dressing-group-wardrobe-mirror',x:7.7,z:2.3,debug:false},
    {name:'05-holmes-at-desk-face',x:8.35,z:4.62,debug:false},
    {name:'06-holmes-desk-body-clearance-f7',x:8.35,z:4.62,debug:true},
    {name:'07-holmes-diagonal-desk-corner',x:7.83,z:4.62,debug:true},
    {name:'08-bedroom-all-3d-volumes-f7',x:5.1,z:4.9,debug:true},
  ];
  for(const view of views){
    await continueAt(page,view.x,view.z);
    const audit=await page.evaluate(()=>((window as any).__audit));
    expect(audit.player.collisionVolume).toMatchObject({width:.38,depth:.3,height:1.82});
    const desk=audit.entities.find((entity:any)=>entity.id==='desk');
    expect(desk.occupiedVolumes.map((volume:any)=>volume.id)).toEqual(['desk-tabletop','desk-drawer-bank','desk-left-support','desk-right-support']);
    expect(desk.clearanceVolumes[0].freeHeight).toBeLessThan(audit.player.collisionVolume.height);
    if(view.debug){await page.keyboard.down('F7');await page.waitForTimeout(120);await page.keyboard.up('F7');await expect.poll(()=>page.evaluate(()=>((window as any).__schematic?.enabled))).toBe(true);await page.waitForTimeout(100);}
    await page.screenshot({path:`screenshots/phase-1-16/${view.name}.png`});
  }
  await continueAt(page,8.35,4.62);
  await page.keyboard.down('w');await page.waitForFunction(()=>((window as any).__position?.lastMovementBlock?.id==='desk'),null,{timeout:15000});await page.keyboard.up('w');await page.waitForTimeout(250);
  const blocked=await page.evaluate(()=>((window as any).__position));
  expect(blocked.lastMovementBlock).toMatchObject({id:'desk',kind:'furniture'});expect(blocked.worldPosition3D.z).toBeGreaterThan(4.48);expect(blocked.worldPosition3D.z).toBeLessThan(4.7);
  let samples=await page.evaluate(()=>((window as any).__samples));expect(samples.every((sample:any)=>!sample.collisionAtPosition)).toBe(true);
  await page.screenshot({path:'screenshots/phase-1-16/09-holmes-stops-at-desk-front.png'});
  await continueAt(page,7.0,4.8);await page.evaluate(()=>((window as any).__samples=[]));
  await page.keyboard.down('d');await page.keyboard.down('w');await page.waitForFunction(()=>((window as any).__position?.lastMovementBlock?.id==='desk'),null,{timeout:15000});await page.keyboard.up('d');await page.keyboard.up('w');await page.waitForTimeout(250);
  samples=await page.evaluate(()=>((window as any).__samples));expect(samples.length).toBeGreaterThan(0);expect(samples.every((sample:any)=>!sample.collisionAtPosition)).toBe(true);
  const corner=await page.evaluate(()=>((window as any).__position));expect(corner.worldPosition3D.x).toBeLessThan(8);expect(corner.worldPosition3D.z).toBeGreaterThan(4.3);
  await page.keyboard.down('F7');await page.waitForTimeout(120);await page.keyboard.up('F7');await expect.poll(()=>page.evaluate(()=>((window as any).__schematic?.enabled))).toBe(true);await page.waitForTimeout(100);await page.screenshot({path:'screenshots/phase-1-16/07-holmes-diagonal-desk-corner.png'});
});

test('standing volume clears the chair gap and stays out of bed, wardrobe, desk and washstand',async({page})=>{
  test.setTimeout(180_000);await page.setViewportSize({width:1440,height:810});
  await page.addInitScript(()=>window.addEventListener('misu:player-position',(event:any)=>{if(event.detail.scene==='lydia-room'){(window as any).__position=event.detail;(window as any).__samples??=[];(window as any).__samples.push(event.detail);}}));
  const moveUntil=async(keys:string[],axis:'x'|'z',direction:-1|1,target:number)=>{await page.evaluate(()=>((window as any).__samples=[]));for(const key of keys)await page.keyboard.down(key);await page.waitForFunction(({axis,direction,target}:any)=>{const value=(window as any).__position?.worldPosition3D?.[axis];return typeof value==='number'&&(direction>0?value>target:value<target);},{axis,direction,target},{timeout:15000});for(const key of keys)await page.keyboard.up(key);await page.waitForTimeout(220);};
  const result=async()=>page.evaluate(()=>({position:(window as any).__position,samples:(window as any).__samples}));
  const clear=async()=>{const run=await result();expect(run.samples.every((sample:any)=>!sample.collisionAtPosition)).toBe(true);return run.position.worldPosition3D;};

  await continueAt(page,7.35,4.8);await moveUntil(['w'],'z',-1,3.5);let at=await clear();expect(at.z).toBeLessThan(3.5); // Walk north through desk/chair gap.
  await continueAt(page,4.65,1.5);await moveUntil(['s'],'z',1,3.0);at=await clear();expect(at.z).toBeGreaterThan(3.0); // Track the bed's west edge.
  await continueAt(page,4.65,2.1);await page.keyboard.down('d');await page.waitForFunction(()=>((window as any).__position?.lastMovementBlock?.id==='bed'),null,{timeout:15000});await page.keyboard.up('d');await page.waitForTimeout(220);at=await clear();expect(at.x).toBeLessThan(4.8); // Body stops before entering the bed.
  await continueAt(page,8.0,1.55);await moveUntil(['d'],'x',1,9.0);at=await clear();expect(at.x).toBeGreaterThan(9.0); // Close pass along the wardrobe.
  await continueAt(page,1.88,2.1);await moveUntil(['s'],'z',1,3.5);at=await clear();expect(at.z).toBeGreaterThan(3.5); // Close pass beside the washstand.

  await continueAt(page,1.9,4.95);await moveUntil(['d'],'x',1,7.2);at=await clear();expect(at.x).toBeLessThan(7.5);
  await moveUntil(['w'],'z',-1,3.0);at=await clear();expect(at.z).toBeLessThan(3.0);
  await moveUntil(['d'],'x',1,8.0);at=await clear();expect(at.x).toBeGreaterThan(8.0); // Continuous lower-left to upper-right route.
});
