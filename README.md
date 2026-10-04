# 谜溯：银哨之后 · Phase 1.5

Phase 1 是从零搭建的浏览器垂直切片，使用 TypeScript、Phaser 3、HTML/CSS、Vite、Vitest 与 Playwright。Phaser 处理像素世界、角色移动、碰撞、摄像机和交互位置；HTML/CSS 处理对话、案件笔记、推理面板及触控控制。

## 开发

```sh
npm install
npm run dev
```

桌面使用 WASD/方向键移动、E 调查、J 打开案件笔记、K 打开推理板。移动端使用虚拟摇杆与调查按钮。走廊与莉迪亚旧房共用同一世界单位和地图网格。

## 美术资源

正式 PNG 集中在 `public/assets/art/`，路径与资源类别登记在 [`src/data/art/assetManifest.ts`](src/data/art/assetManifest.ts)。世界基线保持 Tile 16×16、角色视觉尺寸 16×24、脚部碰撞 10×8；Phaser 使用 `pixelArt` / `roundPixels`，CSS Canvas 使用 `image-rendering: pixelated`。

当前已接入维多利亚木地板与墙面图块、莉迪亚房间家具道具、假铃绳、庄园走廊装饰、221B 家具与雨夜窗户、Holmes / Watson 角色表、人物头像图集、E06/E08/E09 证据图集和雨夜标题背景。未提供的美术只保留基础 fallback，并登记在 [`ART_ASSET_REQUESTS.md`](ART_ASSET_REQUESTS.md)。

## 验证

```sh
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

单元测试覆盖 GameState、重复证据、假设状态、证据关系和存档往返；浏览器冒烟测试覆盖桌面调查路径、Continue 恢复、移动端横屏/竖屏操作、案件笔记和重置存档。

## 当前切片边界

已实现 221B 开场、庄园走廊、莉迪亚旧房以及 E06/E08/E09 数据。E01/E02 只由开场剧情发放。Phase 1.5 不扩展案件玩法：环境艺术仍需补齐可复用的完整房间图块与庄园走廊装饰，当前请求见 `ART_ASSET_REQUESTS.md`。E06/E08/E09 的视觉资源按现有证据 ID 与逻辑对应。
