import { expect, test } from '@playwright/test';

const hallState=(x:number,y:number)=>({
  currentScene:'hall',playerPosition:{x,y},discoveredEvidence:[],investigatedObjects:[],dialogueFlags:{},
  storyFlags:{started:true,openingComplete:true,watsonSpoken:true},dialogueProgress:{opening:9},hypotheses:[],hypothesisState:{},
  unlockedLocations:['221b','hall','lydia-room'],
});

async function continueAt(page:any,x:number,y:number){
  await page.goto('/');
  await page.evaluate((state:any)=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state})),hallState(x,y));
  await page.reload();
  await page.getByRole('button',{name:/继续案件/}).click();
  await expect(page.locator('#scene-label')).toContainText('庄园走廊');
  await page.waitForTimeout(300);
}

test('Manor corridor rebuilt view, surfaces, lights and Lydia doorway transition',async({page})=>{
  test.setTimeout(60_000);
  await page.setViewportSize({width:1440,height:640});
  await page.addInitScript(()=>{window.addEventListener('misu:surface',(e:any)=>{const w=window as any;(w.__hallSurface??=[]).push(e.detail.surface);});});
  await continueAt(page,100,160);
  await page.locator('#game canvas').screenshot({path:'screenshots/phase-1-11/01-corridor-clean.png'});
  await page.keyboard.press('F3');
  await page.locator('#game canvas').screenshot({path:'screenshots/phase-1-11/02-corridor-physics-debug.png'});
  await page.keyboard.press('F3');

  await continueAt(page,390,210);
  await expect.poll(()=>page.evaluate(()=>((window as any).__hallSurface as string[]).at(-1))).toBe('WOOD');

  await continueAt(page,615,108);
  await page.screenshot({path:'screenshots/phase-1-11/06-holmes-behind-console.png'});

  await continueAt(page,111,110);
  await page.screenshot({path:'screenshots/phase-1-11/07-holmes-under-sconce.png'});

  await continueAt(page,148,160);
  await page.screenshot({path:'screenshots/phase-1-11/08-holmes-near-lydia-entrance.png'});

  await continueAt(page,390,160);
  await page.screenshot({path:'screenshots/phase-1-11/09-holmes-corridor-center.png'});

  await page.setViewportSize({width:480,height:480});
  await continueAt(page,145,160);
  await page.locator('#game canvas').screenshot({path:'screenshots/phase-1-11/11-doorway-threshold-close.png'});
  await continueAt(page,211,160);
  await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房',{timeout:8000});
  await page.screenshot({path:'screenshots/phase-1-11/04-lydia-entry.png'});

  // Holmes stores his sprite center while Watson is authored by feetY; offset Holmes
  // by half his 51.6-unit height so both characters share the same floor-contact row.
  await page.evaluate(()=>{const save=JSON.parse(localStorage.getItem('misu.save.v1')??'{}');save.state.currentScene='221b';save.state.playerPosition={x:244,y:140.2};save.state.storyFlags={...(save.state.storyFlags??{}),openingComplete:true};localStorage.setItem('misu.save.v1',JSON.stringify(save));});
  await page.setViewportSize({width:1440,height:640});
  await page.reload();await page.getByRole('button',{name:/继续案件/}).click();
  await expect(page.locator('#scene-label')).toContainText('221B');
  await page.waitForTimeout(300);
  await page.locator('#game canvas').screenshot({path:'screenshots/phase-1-11/10-holmes-watson-side-by-side.png'});
});

test('Manor corridor stays navigable and mobile interaction controls remain present',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await continueAt(page,100,265);
  await expect(page.locator('.touch-controls')).toBeVisible();
  const bounds=await page.locator('.stick').boundingBox();
  if(!bounds)throw new Error('virtual joystick is unavailable');
  const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+24,y,{steps:3});
  await page.waitForTimeout(500);await page.mouse.up();await page.waitForTimeout(350);
  const position=await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.playerPosition);
  expect(position.x).toBeGreaterThan(100);
  await page.screenshot({path:'screenshots/phase-1-11/05-corridor-mobile.png'});
});

test('Manor and Lydia door return semantics remain unchanged',async({page})=>{
  await page.setViewportSize({width:1280,height:720});
  const bedroom={...hallState(25,216),currentScene:'lydia-room',playerWorldPosition3D:{x:.35,y:0,z:3.55}};
  await page.goto('/');
  await page.evaluate((state:any)=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state})),bedroom);
  await page.reload();await page.getByRole('button',{name:/继续案件/}).click();
  await expect(page.locator('#scene-label')).toContainText('庄园走廊',{timeout:8000});

  await page.evaluate((state:any)=>localStorage.setItem('misu.save.v1',JSON.stringify({schemaVersion:1,caseId:'silver-whistle',savedAt:Date.now(),state})),hallState(28,160));
  await page.reload();await page.getByRole('button',{name:/继续案件/}).click();
  await expect(page.locator('#nearby')).toContainText('返回贝克街',{timeout:8000});
  await page.keyboard.press('e');
  await expect(page.locator('#scene-label')).toContainText('贝克街',{timeout:8000});
});
