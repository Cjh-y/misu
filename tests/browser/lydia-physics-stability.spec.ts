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
  await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房',{timeout:10000});await page.waitForTimeout(250);
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});
}
async function move(page:any,key:string,milliseconds=900){await page.keyboard.down(key);await page.waitForTimeout(milliseconds);await page.keyboard.up(key);await page.waitForTimeout(250);}
async function live(page:any){return page.evaluate(()=>((window as any).__livePosition??{}));}
async function walkUntil(page:any,key:string,condition:(p:any)=>boolean){
  for(let i=0;i<60;i++){if(condition(await live(page)))return;await page.keyboard.down(key);await page.waitForTimeout(120);await page.keyboard.up(key);await page.waitForTimeout(50);}
  throw new Error(`World target was not reached: ${JSON.stringify(await live(page))}`);
}

test('Lydia world projection: 1×1 floor grid, axes, controls and position mapping',async({page})=>{
  await page.setViewportSize({width:1440,height:810});
  await page.addInitScript(()=>window.addEventListener('misu:player-position',(event:any)=>((window as any).__livePosition={...event.detail})));
  await continueAt(page,2.1,2.6);
  await page.keyboard.press('F3');
  await expect.poll(()=>page.evaluate(()=>document.querySelector('#nearby')?.textContent)).toBeDefined();
  await page.screenshot({path:'screenshots/phase-1-14/01-world-space-floor-grid.png'});
  const position=await live(page);
  expect(position.worldPosition3D).toMatchObject({y:0});
  expect(position.x).toBeGreaterThan(0);expect(position.y).toBeGreaterThan(0);
});

test('Lydia ground footprints stop Holmes at the north wall and bed while allowing a route around it',async({page})=>{
  await page.addInitScript(()=>window.addEventListener('misu:player-position',(event:any)=>((window as any).__livePosition={...event.detail})));
  await continueAt(page,2.1,.9);
  await walkUntil(page,'w',p=>p.worldPosition3D?.z<=.30);
  const north=await live(page);
  expect(north.worldPosition3D.z).toBeGreaterThan(.10);
  expect(north.worldPosition3D.z).toBeLessThan(.30);
  expect(north.y).toBeGreaterThan(90); // The feet remain on the projected floor plane.
  await move(page,'w',700);
  const wallStop=await live(page);expect(wallStop.worldPosition3D.z).toBeGreaterThan(.10);expect(wallStop.worldPosition3D.z).toBeLessThan(.20);
  await move(page,'w',700);expect((await live(page)).worldPosition3D.z).toBeCloseTo(wallStop.worldPosition3D.z,1);

  await continueAt(page,4.8,2.2);
  await move(page,'d',1700);
  const bedEdge=await live(page);
  expect(bedEdge.worldPosition3D.x).toBeLessThan(5.52);
  await move(page,'a',300);
  await walkUntil(page,'s',p=>p.worldPosition3D?.z>=2.6);
  expect((await live(page)).worldPosition3D.z).toBeGreaterThan(2.5);
});

test('world footprints block the wardrobe and desk while preserving the floor route beside them',async({page})=>{
  await page.addInitScript(()=>window.addEventListener('misu:player-position',(event:any)=>((window as any).__livePosition={...event.detail})));
  await continueAt(page,8.0,.45);await move(page,'d',1400);
  expect((await live(page)).worldPosition3D.x).toBeLessThan(8.6);
  await continueAt(page,8.35,4.8);await move(page,'w',1100);
  const deskEdge=await live(page);expect(deskEdge.worldPosition3D.z).toBeGreaterThan(4.48);expect(deskEdge.lastMovementBlock?.id).toBe('desk');
  await continueAt(page,4.2,3.5);await walkUntil(page,'d',p=>p.worldPosition3D?.x>=7.0);
  expect((await live(page)).worldPosition3D.x).toBeGreaterThan(6.8);
});

test('perspective display scale changes with depth while the world foot collision stays fixed',async({page})=>{
  await page.addInitScript(()=>window.addEventListener('misu:player-position',(event:any)=>((window as any).__livePosition={...event.detail})));
  await continueAt(page,2.1,.45);const back=await live(page);
  await walkUntil(page,'s',p=>p.worldPosition3D?.z>=1.5);
  await expect.poll(async()=>((await live(page)).displayScale.y)).toBeGreaterThan(back.displayScale.y);
  const front=await live(page);
  expect(front.worldGroundFootprint).toEqual(back.worldGroundFootprint);
});

test('world coordinates survive ten room re-entries without camera, scale or foreground drift',async({page})=>{
  test.setTimeout(120_000); // Twenty transitions now include their visible fade and location cue.
  await page.setViewportSize({width:1440,height:810});
  await page.addInitScript(()=>{
    (window as any).__roomSamples=[];
    window.addEventListener('misu:scene-ready',(event:any)=>{if(event.detail.scene==='lydia-room')(window as any).__roomSamples.push(event.detail);});
  });
  await continueAt(page,2.0,3.55);
  const initial=await page.evaluate(()=>((window as any).__roomSamples as any[])[0]);
  // The doorway is a scene boundary; each pass uses the same existing Hall transition.
  for(let i=0;i<10;i++){
    await page.keyboard.down('a');await expect(page.locator('#scene-label')).toContainText('庄园走廊',{timeout:8000});await page.keyboard.up('a');
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});
    await page.keyboard.down('d');await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房',{timeout:8000});await page.keyboard.up('d');
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});
  }
  const samples=await page.evaluate(()=>((window as any).__roomSamples as any[]));
  expect(samples).toHaveLength(11);
  for(const sample of samples){
    expect(sample.cameraZoom).toBe(initial.cameraZoom);
    expect(sample.sceneChildren).toBe(initial.sceneChildren);
    expect(sample.dynamicBodyCount).toBe(initial.dynamicBodyCount);
    expect(sample.foreground).toEqual([]);
  }
});

test('projection control points and Holmes foot anchor share exact world projection',async({page})=>{
  await page.setViewportSize({width:1440,height:810});
  await page.addInitScript(()=>{
    window.addEventListener('misu:player-position',(event:any)=>((window as any).__livePosition={...event.detail}));
    window.addEventListener('misu:scene-ready',(event:any)=>{if(event.detail.scene==='lydia-room')(window as any).__lydiaReady=event.detail;});
    window.addEventListener('misu:physics-debug',(event:any)=>((window as any).__debugState=event.detail));
  });
  await continueAt(page,2.1,2.6);
  await page.keyboard.press('F3');await page.waitForTimeout(100);
  await page.keyboard.press('F5');await page.waitForTimeout(100);
  await page.keyboard.press('F6');await page.waitForTimeout(200);
  const ready=await page.evaluate(()=>((window as any).__lydiaReady));
  expect(ready.worldRoom.controlPoints).toEqual({
    NW:{world:{x:0,z:0},screen:{x:31,y:93}},
    NE:{world:{x:10,z:0},screen:{x:449,y:93}},
    SW:{world:{x:0,z:5.5},screen:{x:14,y:285}},
    SE:{world:{x:10,z:5.5},screen:{x:466,y:285}},
  });
  const position=await live(page);
  expect(position.footAnchorScreen).toEqual(position.projectionScreen);
  expect(await page.evaluate(()=>((window as any).__debugState).layers)).toEqual({projection:true,collision:false,interaction:false});
  await page.screenshot({path:'screenshots/phase-1-14-1/01-floor-projection-corners.png'});
});

test('six Z samples keep Holmes at one world X with projected feet and monotonic perspective scale',async({page})=>{
  await page.setViewportSize({width:1440,height:810});
  await page.addInitScript(()=>window.addEventListener('misu:player-position',(event:any)=>((window as any).__livePosition={...event.detail})));
  const depths=[.4,1.3,2.2,3.1,4.0,5.0],samples=[] as any[];
  for(const z of depths){
    await continueAt(page,2.1,z);
    await page.keyboard.press('F3');await page.waitForTimeout(100);
    await page.keyboard.press('F5');await page.waitForTimeout(100);
    await page.keyboard.press('F6');await page.waitForTimeout(180);
    const position=await live(page);samples.push(position);
    expect(position.worldPosition3D.x).toBeCloseTo(2.1,4);
    expect(position.worldPosition3D.z).toBeCloseTo(z,4);
    expect(position.footAnchorScreen).toEqual(position.projectionScreen);
    expect(position.worldGroundFootprint).toEqual({width:.34,depth:.25});
    await page.screenshot({path:`screenshots/phase-1-14-1/holmes-z-${String(z).replace('.','-')}.png`});
  }
  for(let i=1;i<samples.length;i++)expect(samples[i].displayScale.y).toBeGreaterThan(samples[i-1].displayScale.y);
});

test('bed depth comparison keeps collision clear and foreground ordering continuous',async({page})=>{
  await page.setViewportSize({width:1440,height:810});
  await page.addInitScript(()=>window.addEventListener('misu:player-position',(event:any)=>((window as any).__livePosition={...event.detail})));
  const cases=[
    {name:'behind',x:3.9,z:.35},
    {name:'side',x:4.65,z:1.95},
    {name:'front',x:5.3,z:3.75},
  ];
  const positions=[] as any[];
  for(const sample of cases){
    await continueAt(page,sample.x,sample.z);
    const position=await live(page);positions.push(position);
    expect(position.worldPosition3D).toMatchObject({x:sample.x,y:0,z:sample.z});
    expect(position.footAnchorScreen).toEqual(position.projectionScreen);
    expect(position.worldDepthKey).toBe(4000+sample.z*100);
    await page.screenshot({path:`screenshots/phase-1-14-1/bed-${sample.name}.png`});
  }
  expect(positions[0].worldDepthKey).toBeLessThan(4316);
  expect(positions[1].worldDepthKey).toBeLessThan(4316);
  expect(positions[2].worldDepthKey).toBeGreaterThan(4316);
});
