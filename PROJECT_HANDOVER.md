# 谜溯项目交接

交接基准：`codex/rebuild` 分支，提交 `7d96f44`（`Add downloadable standalone game HTML`）。该提交与 `origin/codex/rebuild` 一致；开始新工作前先执行 `git status` 和 `git log` 确认仓库状态。

## 项目现状

《谜溯：银哨之后》是 TypeScript、Phaser 3、Vite 实现的浏览器叙事推理游戏切片。当前可玩路线为：

```text
Title → 221B 开场九句对白 → 221B 自由探索 / Watson 对话
     → 庄园走廊 → Lydia Bedroom → E06 / E08 / E09 调查
```

案件数据中还包括开场获得的 E01、E02、证据关系、假设、案件笔记、推理板和 Continue 存档。当前内容是可玩切片，不是完整案件章节。

## 阶段状态

- **221B / Phase 1.9–1.10.2**：场景美术与构图已完成；保留家具碰撞、遮挡、地毯、门和室内光照。Phase 1.10.1 加入 Watson 世界角色、短交谈、少量环境调查及前往庄园流程；1.10.2 调整对白、观察、证据、地点卡和笔记界面。
- **Manor Corridor / Phase 1.11–1.11.2**：完成走廊空间重建和构图、地毯透视/门槛整合、人物比例检查；与 Bedroom 的路线和 Lydia 入口保持可用。
- **Lydia Bedroom / Phase 1.12–1.16**：E06、E08、E09 调查与回廊流程保留；逐步加入碰撞稳定性、World X/Y/Z 与 floor projection、家具 scene graph / occupied volumes / clearance、相机锁定家具资产和 F7/F8 开发检查。
- **单文件分发**：`npm run build:standalone` 生成 `dist/misu-standalone.html`；仓库根目录的 `misu-standalone.html` 是已上传的可下载版本。

Lydia Bedroom 是当前 world-space / 2.5D scene graph 验证房间。**221B 和 Manor Corridor 尚未迁移到该模型**，仍使用 `WorldScene` 和 `physicalRooms.ts` 中的共享 2D 屏幕空间房间物理配置。不要在未获授权时把迁移范围扩大到其他房间。

## 重要代码入口

| 文件 | 职责 |
|---|---|
| `src/main.ts` | UI、New Game/Continue、对白、观察、笔记、推理、存档及场景流程协调 |
| `src/game/scenes/WorldScene.ts` | Phaser 场景生命周期、玩家输入、角色/道具渲染、房间切换和调试视图 |
| `src/game/rooms/physicalRooms.ts` | 221B、Manor Corridor、Lydia 的物理房间配置；Lydia 的权威 world collision 数据在 world 模块 |
| `src/game/world/WorldProjection.ts` | Lydia world 与屏幕坐标投影 |
| `src/game/world/lydiaWorldRoom.ts` | Lydia 房间相机参数、建筑、家具组、实体、脚印、occupied volumes、交互位置 |
| `src/game/world/sceneGraph3D.ts` | 场景实体、体积和深度/遮挡关系数据结构与工具 |
| `src/data/cases/silver-whistle/` | 开场对白、Watson 对话、221B 环境互动、证据、交互对象和推理关系 |
| `src/data/art/assetManifest.ts` | 正式美术资源键值和路径 |
| `src/core/save/save.ts` | Continue 存档；若本地文件浏览器不允许 `localStorage`，会退到当前页面生命周期内的内存存储 |
| `scripts/build-standalone.mjs` | 将 Vite JS/CSS 和游戏 PNG 内嵌到单个 HTML |

## 运行方式

开发环境（Node.js 20.19+ 或 22.12+）：

```sh
npm install
npm run dev
```

常用验证命令：

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

单文件 HTML：

```sh
npm run build:standalone
```

生成 `dist/misu-standalone.html`。更新游戏代码或图片后，需要重新生成，并将新的单文件复制到仓库根目录再提交，才能更新 GitHub 上的下载版本。当前 `misu-standalone.html` 约 59.05 MiB，GitHub 接受了推送，但给出了超过 50 MiB 推荐大小的警告。该 HTML 没有外部资源引用；直接用手机打开是否可运行仍取决于手机浏览器是否允许 `file://` 页面执行脚本。受限浏览器需要 HTTPS 托管。若浏览器屏蔽本地存储，存档只在当前页面运行期间有效。

## 当前验证记录与限制

- 最新代码执行过 `npm run build:standalone`，TypeScript 检查和 Vite production build 成功；构建器生成约 59.1 MiB 的 HTML，内嵌 32 张 PNG。HTML 结构检查确认没有外部脚本或样式表引用。
- 上述单文件构建不等于在目标手机浏览器完成了运行验收；下一次接手时应先在实际设备下载并打开根目录单文件，确认启动、New Game、画面资源、交互和存档行为。
- 没有在单文件构建提交后运行整个 Vitest / Playwright 套件。开展代码修改后，按改动范围运行对应验证；不要把构建成功写成全回归通过。
- `NARRATIVE_RUNTIME_AUDIT.md` 是 Phase 1.10.1 之前的历史审计，关于 Watson 未入场、221B 无自由探索等结论已过时。判断现状以当前代码和实际运行结果为准。
- `ART_ASSET_REQUESTS.md`、`VISUAL_BIBLE.md` 与各房间重建计划含有历史阶段记录；若文字和当前实现有差异，以最新代码、资源及用户明确的阶段约束为准。

## 设计与验收文档

- `README.md`：面向开发者与玩家的项目简介和命令。
- `SCENE_PHYSICALIZATION_SYSTEM.md`、`SCENE_PHYSICALIZATION_TESTS.md`：房间物理配置和手动验收路线。
- `LYDIA_CAMERA_LOCKED_ASSET_AUDIT.md`：Lydia Bedroom 相机与家具素材基准。
- `221B_ART_RECONSTRUCTION_PLAN.md`、`221B_COMPOSITION_PLAN.md`：221B 视觉和构图决策。
- `MANOR_CORRIDOR_RECONSTRUCTION_PLAN.md`：走廊空间重建记录。
- `screenshots/phase-*`：各阶段截图，作为历史验收资料，不代表当前设备上的实时渲染结果。

## 继续工作的建议顺序

1. 先在手机实际下载并打开 `misu-standalone.html`。若本地文件被浏览器禁止执行，讨论 HTTPS 托管方式；不要先改游戏玩法或空间布局。
2. 若单文件需要更新，运行 `npm run build:standalone`，核对实际 HTML 后同步根目录下载文件。
3. 新一轮游戏功能或美术阶段开始前，重新检查当前 branch、status、最新提交和对应房间配置。当前没有在本交接文档中授权新的剧情、房间迁移或案件扩写。
