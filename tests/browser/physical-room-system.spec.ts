import { expect, test } from '@playwright/test';

const stateAt=(scene:string,x:number,y:number)=>({
  currentScene:scene,playerPosition:{x,y},discoveredEvidence:[],investigatedObjects:[],dialogueFlags:{},
  storyFlags:{started:true,openingComplete:true},dialogueProgress:{opening:9},hypotheses:[],hypothesisState:{},
  unlockedLocations:['221b','hall','lydia-room'],
});

async function loadRoom(page:any,scene:string,x:number,y:number){
  await page.goto('/');
  await page.evaluate((state:any)=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state})),stateAt(scene,x,y));
  await page.reload();
  await page.getByRole('button',{name:/继续案件/}).click();
  await expect(page.locator('#scene-label')).toContainText(scene==='221b'?'贝克街':'莉迪亚旧房');
  await page.waitForTimeout(300);
  await page.evaluate(()=>{(window as any).__positions=[];window.addEventListener('misu:player-position',(e:any)=>(window as any).__positions.push({x:e.detail.x,y:e.detail.y}));});
  await expect.poll(()=>latest(page)).not.toBeUndefined();
}

const latest=(page:any)=>page.evaluate(()=>((window as any).__positions as {x:number;y:number}[]).at(-1));

test('221B uses the shared physical room system and emits rug surface',async({page})=>{
  await page.goto('/');
  await page.evaluate((state:any)=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state})),stateAt('221b',240,180));
  await page.reload();
  await page.evaluate(()=>window.addEventListener('misu:surface',(e:any)=>(window as any).__surface=e.detail.surface));
  await page.getByRole('button',{name:/继续案件/}).click();
  await expect(page.locator('#scene-label')).toContainText('贝克街');
  await expect.poll(()=>page.evaluate(()=>(window as any).__surface)).toBe('RUG');
  await expect.poll(()=>page.evaluate(()=>(window as any).__surface)).toBe('RUG');
  await page.keyboard.press('F3');
  await page.screenshot({path:'screenshots/phase-1-8/02-221b-physical-debug.png'});
  await page.keyboard.press('F3');
  await page.screenshot({path:'screenshots/phase-1-8/01-221b-physicalized.png'});
});

test('221B fireplace and desk footprints block while open floor remains navigable',async({page})=>{
  await loadRoom(page,'221b',104,145);
  await page.keyboard.down('w');await page.waitForTimeout(900);await page.keyboard.up('w');
  const fireplace=await latest(page);
  expect(fireplace.y).toBeGreaterThan(112);
  await loadRoom(page,'221b',180,250);
  await page.keyboard.down('a');await page.waitForTimeout(500);await page.keyboard.up('a');
  const desk=await latest(page);
  expect(desk.x).toBeGreaterThan(155);
});

test('221B door state controls its threshold collision and permits the open passage',async({page})=>{
  await loadRoom(page,'221b',449,280);
  await page.evaluate(()=>{(window as any).__door=[];window.addEventListener('misu:door-state',(e:any)=>(window as any).__door.push(e.detail.state));});
  await page.keyboard.press('o');await expect.poll(()=>page.evaluate(()=>(window as any).__door?.at(-1))).toBe('closed');
  await page.keyboard.down('s');await page.waitForTimeout(750);await page.keyboard.up('s');
  const closed=await latest(page);
  await page.keyboard.press('o');await expect.poll(()=>page.evaluate(()=>(window as any).__door?.at(-1))).toBe('open');
  await page.keyboard.down('s');await page.waitForTimeout(750);await page.keyboard.up('s');
  const opened=await latest(page);
  expect(opened.y).toBeGreaterThan(closed.y);
});

test('221B actor is correctly depth sorted behind and in front of an armchair',async({page})=>{
  await loadRoom(page,'221b',360,50);
  await page.screenshot({path:'screenshots/phase-1-8/03-holmes-behind-armchair.png'});
  await loadRoom(page,'221b',360,142);
  await page.screenshot({path:'screenshots/phase-1-8/04-holmes-in-front-of-armchair.png'});
});

test('221B warm, cool and dark zones produce distinct actor light responses',async({page})=>{
  await loadRoom(page,'221b',104,120);
  await page.evaluate(()=>{(window as any).__light=[];window.addEventListener('misu:light-response',(e:any)=>(window as any).__light.push(e.detail));});
  await expect.poll(()=>page.evaluate(()=>((window as any).__light as any[]).at(-1))).not.toBeUndefined();
  const fireplace=await page.evaluate(()=>((window as any).__light as any[]).at(-1));
  await page.screenshot({path:'screenshots/phase-1-8/05-holmes-fireplace-light.png'});
  await loadRoom(page,'221b',48,250);
  await page.evaluate(()=>{(window as any).__light=[];window.addEventListener('misu:light-response',(e:any)=>(window as any).__light.push(e.detail));});
  await expect.poll(()=>page.evaluate(()=>((window as any).__light as any[]).at(-1))).not.toBeUndefined();
  const dark=await page.evaluate(()=>((window as any).__light as any[]).at(-1));
  expect(fireplace.warm).toBeGreaterThan(dark.warm);
  await loadRoom(page,'221b',263,58);
  await page.evaluate(()=>{(window as any).__light=[];window.addEventListener('misu:light-response',(e:any)=>(window as any).__light.push(e.detail));});
  await expect.poll(()=>page.evaluate(()=>((window as any).__light as any[]).at(-1))).not.toBeUndefined();
  const windowFill=await page.evaluate(()=>((window as any).__light as any[]).at(-1));
  expect(windowFill.cool).toBeGreaterThan(dark.cool);
  await page.screenshot({path:'screenshots/phase-1-8/06-holmes-window-light.png'});
});

test('221B mobile view keeps interaction and doorway touch controls available',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await loadRoom(page,'221b',449,280);
  await expect(page.locator('.touch-interact')).toBeVisible();
  const door=page.locator('.touch-door');
  await expect(door).toBeVisible();
  await expect(door).toHaveText('关门');
  await door.click();
  await expect(door).toHaveText('开门');
});

test('Lydia Bedroom shared system regression keeps the evidence records intact',async({page})=>{
  for(const [x,y,id] of [[48,216,'E06'],[309,30,'E08'],[309,60,'E09']] as [number,number,string][]){
    await loadRoom(page,'lydia-room',x,y);
    await page.keyboard.press('e');
    await page.waitForTimeout(250);
    await page.keyboard.press('Escape');
    const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state);
    expect(save.discoveredEvidence).toContain(id);
  }
});
