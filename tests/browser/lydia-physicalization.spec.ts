import { expect, test } from '@playwright/test';

const savedState=(x:number,z:number)=>({
  currentScene:'lydia-room',playerPosition:{x:240,y:180},playerWorldPosition3D:{x,y:0,z},
  discoveredEvidence:[],investigatedObjects:[],dialogueFlags:{},storyFlags:{started:true,openingComplete:true},
  dialogueProgress:{opening:9},hypotheses:[],hypothesisState:{},unlockedLocations:['221b','hall','lydia-room'],
});
async function continueAt(page:any,x:number,z:number){
  await page.goto('/');await page.evaluate((state:any)=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state})),savedState(x,z));
  await page.reload();await page.getByRole('button',{name:/继续案件/}).click();await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房');await page.waitForTimeout(250);
}
async function world(page:any){return page.evaluate(()=>((window as any).__liveWorldPosition??{}));}

test('world-space bed footprint blocks Holmes and F3 shows separate ground geometry',async({page})=>{
  await page.addInitScript(()=>{window.addEventListener('misu:player-position',(event:any)=>((window as any).__liveWorldPosition=event.detail.worldPosition3D));window.addEventListener('misu:physics-debug',(event:any)=>((window as any).__debugEnabled=event.detail.enabled));});
  await continueAt(page,4.5,2.2);await page.keyboard.press('F3');
  await expect.poll(()=>page.evaluate(()=>(window as any).__debugEnabled)).toBe(true);
  await page.keyboard.press('F3');await page.keyboard.down('d');await page.waitForTimeout(1200);await page.keyboard.up('d');
  expect((await world(page)).x).toBeLessThan(5.52);
});

test('closed doorway blocks world-space exit; reopening restores the existing transition',async({page})=>{
  await page.addInitScript(()=>window.addEventListener('misu:player-position',(event:any)=>((window as any).__liveWorldPosition=event.detail.worldPosition3D)));
  await continueAt(page,.85,3.55);await page.keyboard.press('o');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.currentScene)).toBe('lydia-room');
  await page.keyboard.down('a');await page.waitForTimeout(1000);await page.keyboard.up('a');
  expect((await world(page)).x).toBeGreaterThan(.39);
  await page.keyboard.press('o');await page.keyboard.down('a');
  await expect(page.locator('#scene-label')).toContainText('庄园走廊',{timeout:8000});await page.keyboard.up('a');
});

test('movement slides along the bed while the world footprint blocks penetration',async({page})=>{
  await page.addInitScript(()=>window.addEventListener('misu:player-position',(event:any)=>((window as any).__liveWorldPosition=event.detail.worldPosition3D)));
  await continueAt(page,4.8,2.2);await page.keyboard.down('d');await page.keyboard.down('s');await page.waitForTimeout(1000);await page.keyboard.up('d');await page.keyboard.up('s');
  const point=await world(page);expect(point.x).toBeLessThan(5.1);expect(point.z).toBeGreaterThan(2.3);
});

test('rug surface feedback follows the projected world floor region',async({page})=>{
  await page.goto('/');await page.evaluate((state:any)=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state})),savedState(4.7,1.5));
  await page.addInitScript(()=>{(window as any).__surfaceLog=[];window.addEventListener('misu:surface',(event:any)=>(window as any).__surfaceLog.push(event.detail.surface));});
  await page.reload();await page.getByRole('button',{name:/继续案件/}).click();await page.waitForTimeout(350);
  expect(await page.evaluate(()=>((window as any).__surfaceLog as string[]))).toContain('RUG');
});

test('mobile doorway action remains available from its world-space interaction range',async({page})=>{
  await page.setViewportSize({width:390,height:844});await continueAt(page,1.0,3.5);
  const door=page.locator('.touch-door');await expect(door).toBeVisible();await expect(door).toHaveText('关门');
  await door.click();await expect(door).toHaveText('开门');
});
