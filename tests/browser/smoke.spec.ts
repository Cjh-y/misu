import { expect, test } from '@playwright/test';

test('desktop: new game remains in 221B after opening and notebook/reasoning continue', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'谜溯'})).toBeVisible();
  await page.getByRole('button',{name:'开始调查'}).click();
  for(let i=0;i<9;i++) await page.locator('.dialogue-hitarea').click();
  await expect(page.locator('.dialogue-wrap')).toHaveCount(0);
  await expect(page.locator('#scene-label')).toContainText('221B');
  await expect.poll(async()=>JSON.parse((await page.evaluate(()=>localStorage.getItem('misu.save.v1')))??'{}').state?.currentScene).toBe('221b');
  await page.getByRole('button',{name:/案件笔记/}).click();
  await expect(page.locator('.evidence-card')).toHaveCount(2);
  await page.getByRole('button',{name:'×'}).click(); await page.getByRole('button',{name:/推理板/}).click();
  await page.getByRole('button',{name:'采用为我的假设'}).click();
  await expect(page.locator('.hypothesis-card')).toContainText('尚无关联证据');
  await page.getByRole('button',{name:/查看证据关系/}).click();
  await expect(page.locator('.relations')).toContainText('没有已发现');
  await page.reload();
  await page.getByRole('button',{name:'继续案件'}).click();
  await expect(page.locator('#scene-label')).toContainText('221B');
  await page.getByRole('button',{name:/案件笔记/}).click();
  await expect(page.locator('.evidence-card')).toHaveCount(2);
  await page.getByRole('button',{name:'×'}).click();
  await page.getByRole('button',{name:/推理板/}).click();
  await expect(page.locator('.hypothesis-card')).toContainText('某种动物通过通气孔');
});

test('mobile landscape: dialogue and touch controls fit without covering each other', async ({ page }) => {
  await page.setViewportSize({width:844,height:390});
  await page.goto('/');
  await page.getByRole('button',{name:'开始调查'}).click();
  await expect(page.locator('.dialogue-box')).toBeVisible();
  await expect(page.locator('.touch-controls')).toBeHidden();
  for(let i=0;i<9;i++) await page.locator('.dialogue-hitarea').click();
  await expect(page.locator('.touch-controls')).toBeVisible();
  const game=await page.locator('.game-frame').boundingBox();
  const joystick=await page.locator('.stick').boundingBox();
  expect(game&&joystick&&joystick.x>=game.x&&joystick.y+joystick.height<=game.y+game.height).toBeTruthy();
  await page.getByRole('button',{name:/案件笔记/}).click();
  await expect(page.getByRole('heading',{name:'案件笔记'})).toBeVisible();
  await page.getByRole('button',{name:'×'}).click();
  await page.getByRole('button',{name:'设置'}).click();
  await page.getByRole('button',{name:'重置存档'}).click();
  await expect(page.getByRole('heading',{name:'谜溯'})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('misu.save.v1'))).toBeNull();
});

test('mobile portrait: controls remain reachable and touch can move the player', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'开始调查'}).click();
  for(let i=0;i<9;i++) await page.locator('.dialogue-hitarea').click();
  await expect(page.locator('.touch-controls')).toBeVisible();
  const stick=page.locator('.stick');
  const rect=await stick.boundingBox();
  if(!rect) throw new Error('virtual joystick is not laid out');
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
  await page.mouse.down();
  await page.mouse.move(rect.x+rect.width/2-28,rect.y+rect.height/2,{steps:4});
  await page.waitForTimeout(800);
  await page.mouse.up();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('misu.save.v1')??'{}').state);
  expect(saved.playerPosition.x).toBeLessThan(245);
});
