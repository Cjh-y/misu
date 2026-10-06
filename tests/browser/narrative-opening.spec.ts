import { expect, test } from '@playwright/test';

async function startNewGame(page:any){
  await page.goto('/');
  await page.getByRole('button',{name:'开始调查'}).click();
  for(let i=0;i<9;i++)await page.locator('.dialogue-box button').click();
  await expect(page.locator('.dialogue-wrap')).toHaveCount(0);
  await expect(page.locator('#scene-label')).toContainText('221B');
}

async function moveOnStick(page:any,dx:number,dy:number,milliseconds:number){
  const bounds=await page.locator('.stick').boundingBox();
  if(!bounds)throw new Error('virtual joystick is unavailable');
  const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx*27,y+dy*27,{steps:3});
  await page.waitForTimeout(milliseconds);await page.mouse.up();await page.waitForTimeout(500);
}

function saveAt(page:any,x:number,y:number){
  return page.evaluate(({x,y}:any)=>{const save=JSON.parse(localStorage.getItem('misu.save.v1')??'{}');save.state.playerPosition={x,y};localStorage.setItem('misu.save.v1',JSON.stringify(save));},{x,y});
}

test('Title → New Game → 221B playable opening → Watson → investigation → manor → Lydia/E06',async({page})=>{
  test.setTimeout(90_000);
  await page.setViewportSize({width:844,height:390});
  await startNewGame(page);
  await page.locator('#game canvas').screenshot({path:'screenshots/phase-1-10-1/01-holmes-and-watson.png'});
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.storyFlags.openingComplete)).toBe(true);

  // The opening releases movement and the journal remains available from the first room.
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.playerPosition.x);
  await moveOnStick(page,1,0,400);
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.playerPosition.x);
  expect(after).toBeGreaterThan(before);
  await page.keyboard.press('j');
  await expect(page.getByRole('heading',{name:'案件笔记'})).toBeVisible();
  await page.screenshot({path:'screenshots/phase-1-10-1/00-notebook-shortcut.png'});
  await page.getByRole('button',{name:'×'}).click();

  await saveAt(page,449,286);await page.reload();await page.getByRole('button',{name:'继续案件'}).click();
  await expect(page.locator('#nearby')).toContainText('也许该先和 Watson 谈谈',{timeout:8000});
  await expect(page.locator('.touch-interact')).toHaveText('提示');
  await page.screenshot({path:'screenshots/phase-1-10-1/05-departure-locked.png'});
  await page.locator('.touch-interact').click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.currentScene)).toBe('221b');

  // Continue the New Game save at the authored NPC interaction point to verify proximity behavior.
  await saveAt(page,222,160);await page.reload();await page.getByRole('button',{name:'继续案件'}).click();
  await page.waitForTimeout(500);
  await expect(page.locator('#nearby')).toContainText('华生',{timeout:8000});
  await expect(page.locator('.touch-interact')).toHaveText('交谈');
  await page.screenshot({path:'screenshots/phase-1-10-1/02-watson-interaction-prompt.png'});
  await page.locator('.touch-interact').click();
  await expect(page.locator('.dialogue-box')).toContainText('福尔摩斯');
  const locked=await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.playerPosition);
  await page.keyboard.down('d');await page.waitForTimeout(350);await page.keyboard.up('d');await page.waitForTimeout(550);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.playerPosition)).toEqual(locked);
  await page.locator('.dialogue-box button').click();
  await expect(page.locator('.dialogue-box')).toContainText('华生');
  await page.screenshot({path:'screenshots/phase-1-10-1/03-watson-dialogue.png'});
  for(let i=0;i<2;i++)await page.locator('.dialogue-box button').click();
  await expect(page.locator('.dialogue-wrap')).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.storyFlags.watsonSpoken)).toBe(true);

  // One optional object can be inspected; it adds no evidence and is recorded only once.
  await expect(page.locator('#nearby')).toContainText('小提琴盒',{timeout:8000});
  await page.locator('.touch-interact').click();
  await expect(page.locator('.observation-note h2')).toContainText('小提琴盒');
  await page.screenshot({path:'screenshots/phase-1-10-1/04-environment-investigation.png'});
  await page.locator('.observation-wrap').click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state.discoveredEvidence)).toHaveLength(2);

  // Resume at the authored departure point after the optional observation. Movement itself is
  // covered above and by the physical-room navigation suite; this keeps the narrative route deterministic.
  await saveAt(page,449,286);await page.reload();await page.getByRole('button',{name:'继续案件'}).click();
  await expect(page.locator('#nearby')).toContainText('前往庄园',{timeout:8000});
  await expect(page.locator('.touch-interact')).toHaveText('出发');
  await page.screenshot({path:'screenshots/phase-1-10-1/06-departure-ready.png'});
  await page.locator('.touch-interact').click();
  await expect(page.locator('.transition-wrap')).toBeVisible();
  await expect.poll(()=>page.locator('.transition-wrap').getAttribute('data-stage'),{timeout:8000}).toBe('card');
  await page.screenshot({path:'screenshots/phase-1-10-1/07-transition-location-card.png'});
  await expect(page.locator('#scene-label')).toContainText('庄园走廊',{timeout:8000});
  await expect(page.locator('.transition-wrap')).toHaveCount(0,{timeout:8000});
  await page.screenshot({path:'screenshots/phase-1-10-1/08-manor-arrival.png'});

  await moveOnStick(page,1,0,1300);
  await expect(page.locator('#scene-label')).toContainText('莉迪亚旧房',{timeout:8000});
  await expect(page.locator('.touch-interact')).toHaveText('调查');
  await page.locator('.touch-interact').click();
  await expect(page.locator('.evidence-reveal h2')).toContainText('房门与窗锁');
  await page.locator('.evidence-reveal .close').click();
  await page.getByRole('button',{name:/案件笔记/}).click();
  await expect(page.locator('.evidence-card')).toHaveCount(3);
});

test('mobile Continue preserves the opening and Watson touch interaction',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await startNewGame(page);
  await saveAt(page,222,160);await page.reload();await page.getByRole('button',{name:'继续案件'}).click();
  await expect(page.locator('#nearby')).toContainText('华生',{timeout:8000});
  await page.locator('.touch-interact').click();
  await expect(page.locator('.dialogue-box')).toContainText('福尔摩斯');
  for(let i=0;i<3;i++)await page.locator('.dialogue-box button').click();
  await expect(page.locator('.dialogue-wrap')).toHaveCount(0);
  await expect.poll(async()=>JSON.parse((await page.evaluate(()=>localStorage.getItem('misu.save.v1')))??'{}').state?.storyFlags?.watsonSpoken).toBe(true);
});
