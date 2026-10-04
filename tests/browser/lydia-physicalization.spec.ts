import { expect, test } from '@playwright/test';

const savedState=(x:number,y:number)=>({
  currentScene:'lydia-room',playerPosition:{x,y},discoveredEvidence:[],investigatedObjects:[],
  dialogueFlags:{},storyFlags:{started:true,openingComplete:true},dialogueProgress:{opening:9},
  hypotheses:[],hypothesisState:{},unlockedLocations:['221b','hall','lydia-room'],
});

async function continueAt(page:any,x:number,y:number){
  await page.goto('/');
  await page.evaluate((state:ReturnType<typeof savedState>)=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state})),savedState(x,y));
  await page.reload();
  await page.getByRole('button',{name:/继续案件/}).click();
  await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房');
  await page.waitForTimeout(300);
}

test('Lydia physical space: bed footprint blocks and debug overlay shows independent zones',async({page})=>{
  await continueAt(page,240,180);
  await page.evaluate(()=>window.addEventListener('misu:physics-debug',(e:any)=>(window as any).__debugState=e.detail.enabled));
  await page.keyboard.press('F3');
  await expect.poll(()=>page.evaluate(()=>(window as any).__debugState)).toBe(true);
  await page.keyboard.press('F3');
  await page.keyboard.down('w');
  await page.waitForTimeout(1400);
  await page.keyboard.up('w');
  await expect.poll(async()=>JSON.parse((await page.evaluate(()=>localStorage.getItem('misu.save.v1')))??'{}').state.playerPosition.y).toBeGreaterThan(150);
  await expect.poll(async()=>JSON.parse((await page.evaluate(()=>localStorage.getItem('misu.save.v1')))??'{}').state.playerPosition.y).toBeLessThan(175);
});

test('Lydia door can close physically and prevents crossing the doorway',async({page})=>{
  await continueAt(page,48,224);
  await page.evaluate(()=>window.addEventListener('misu:door-state',(e:any)=>(window as any).__doorState=e.detail.state));
  await page.keyboard.press('o');
  await expect.poll(()=>page.evaluate(()=>(window as any).__doorState)).toBe('closed');
  await page.keyboard.down('a');
  await page.waitForTimeout(1200);
  await page.keyboard.up('a');
  const x=await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.playerPosition.x);
  expect(x).toBeGreaterThan(38);
});

test('Lydia movement slides along the bed edge when one axis is blocked',async({page})=>{
  await continueAt(page,220,140);
  await page.evaluate(()=>{(window as any).__positions=[];window.addEventListener('misu:player-position',(e:any)=>(window as any).__positions.push({x:e.detail.x,y:e.detail.y}));});
  await page.keyboard.down('a');
  await page.keyboard.down('w');
  await page.waitForTimeout(1100);
  await page.keyboard.up('a');
  await page.keyboard.up('w');
  await expect.poll(()=>page.evaluate(()=>((window as any).__positions as {x:number;y:number}[]).at(-1))).not.toBeUndefined();
  const point=await page.evaluate(()=>((window as any).__positions as {x:number;y:number}[]).at(-1));
  expect(point).toBeDefined();
  expect(point!.x).toBeLessThan(210);
  expect(point!.y).toBeLessThan(135);
});

test('rug surface is reported separately from wood floor',async({page})=>{
  await page.goto('/');
  await page.evaluate((state:ReturnType<typeof savedState>)=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state})),savedState(260,145));
  await page.reload();
  await page.evaluate(()=>{(window as any).__surfaceLog=[];window.addEventListener('misu:surface',(e:any)=>(window as any).__surfaceLog.push(e.detail.surface));});
  await page.getByRole('button',{name:/继续案件/}).click();
  await page.waitForTimeout(300);
  const surfaces=await page.evaluate(()=>((window as any).__surfaceLog as string[]));
  expect(surfaces).toContain('RUG');
});

test('mobile doorway exposes a touch door control near the threshold',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await continueAt(page,75,224);
  const door=page.locator('.touch-door');
  await expect(door).toBeVisible();
  await expect(door).toHaveText('关门');
  await door.click();
  await expect(door).toHaveText('开门');
});
