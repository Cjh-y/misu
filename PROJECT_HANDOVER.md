# Codex / Agent 工作交接 —《谜溯：银哨之后》

这是一份给接手本仓库的 Codex 或其他编码 Agent 的运行上下文与工作约束，不是面向一般开发者的项目介绍。请先读完，再响应用户的下一条具体任务。

## 接手起点

- 仓库：`https://github.com/Cjh-y/misu`
- 工作分支：`codex/rebuild`
- 交接文档同步前的代码基准：`7d96f44`；其后只有交接文档提交。**每次接手仍须读取实际远端 HEAD、当前分支和 `git status`，以仓库最新提交为准。** 不恢复旧 Codex Task，不假定工作区与本文件编写时相同。
- 用户当前主要通过手机使用项目，无法在手机上执行 Node/npm 脚本。仓库根目录有已构建的 `misu-standalone.html`，用户需要时可从 GitHub 下载。
- 最新任务是 2026-10-07 的体验修复，范围与验证见 `EXPERIENCE_FIXES.md`。后续开发范围以用户最新指令为准；每轮完成后的提交、推送授权见下文。

## 协作要求

1. 开始改动前检查 `git status`、当前分支、最新 commits 和相关代码/文档；不要从历史对话记忆替代仓库事实。
2. 用户通常会明确说明阶段范围和禁止项。遵守当前最新指令；不要擅自扩写剧情、证据、房间或系统，也不要把用户已验收的场景推倒重做。
3. 用户于 2026-10-07 明确要求每轮修改完成后提交并推送远端；这项授权持续有效。完成相关测试、更新交付文件后提交并推送当前开发分支，后续无需重复询问；若用户变更授权，以最新指令为准。
4. 绝不要把聊天中的访问令牌复制进源码、文档、Git remote URL、命令输出或提交。远端认证优先使用环境已有的安全凭据。
5. 不要声称完整回归通过，除非确实运行并记录了对应测试。当前阶段构建成功不代表浏览器回归已通过。

## 当前实现快照

当前游戏切片的真实可玩路线为：

```text
Title
→ 221B 九句 opening dialogue
→ 221B 自由探索、与 Watson 对话、少量环境观察
→ 东南出口出发
→ Manor Corridor
→ Lydia Bedroom
→ 调查 E06 / E08 / E09，使用案件笔记与推理板
```

案件数据还包括 opening 获取的 E01/E02、证据关系、假设和 Continue 存档。项目仍是可玩案件切片，不是完整案件章节。

已实现且应当保留的阶段结果：

- **221B（Phase 1.9–1.10.2）**：正式房间美术、家具分布、碰撞、门、地毯、遮挡、灯光和 Holmes 可读性；Watson 作为世界角色加入，具备短交谈；可调查少量环境对象并从出口前往庄园；叙事 UI 已做轻量化。
- **Manor Corridor（Phase 1.11–1.11.2）**：走廊建筑表现、节奏与视觉主次调整；地毯透视、门槛和角色比例问题已处理；保留门到场景的功能映射。
- **Lydia Bedroom（Phase 1.12–1.16）**：调查 E06/E08/E09；稳定碰撞与反复进出；world X/Y/Z、地板投影、家具 Scene Graph、occupied volumes/clearance、统一深度关系、F7 体积示意和 F8 相机轴检查；相机锁定家具 PNG 与视觉审查记录。
- Lydia Bedroom 是唯一使用 world-space 2.5D Scene Graph 的参考房间。**221B 和 Manor Corridor 没有迁移到该模型**；迁移范围以用户最新任务为准。

Phase 1.16 的资产和实现已经在仓库，但不要仅凭已有截图/代码推断用户已完成最终视觉验收。继续之前应以用户最新反馈为准。

## 重要代码入口

| 文件 | 接手时关注点 |
|---|---|
| `src/main.ts` | New Game/Continue、对白与观察 UI、笔记/推理、交互分发、存档和场景推进 |
| `src/game/scenes/WorldScene.ts` | Phaser 场景、角色与 Watson、输入、碰撞、渲染、调试层、门和切换 |
| `src/game/rooms/physicalRooms.ts` | 221B 与走廊的房间尺寸、footprints、表面、灯光、门、遮挡和家具视觉配置 |
| `src/game/world/WorldProjection.ts` | Lydia Bedroom 的 world-to-screen 投影 |
| `src/game/world/lydiaWorldRoom.ts` | Lydia world 尺寸、唯一相机基准、布局组、实体、footprint、occupied volume 和互动位置 |
| `src/game/world/sceneGraph3D.ts` | Lydia 实体/体积/深度关系模型 |
| `src/data/cases/silver-whistle/` | 剧情对白、Watson 和环境互动、E01/E02/E06/E08/E09、证据和推理数据 |
| `src/core/save/save.ts` | Continue 持久化；本地 `file://` 无法访问 Storage 时用内存 fallback，不能保证刷新后保留存档 |
| `src/data/art/assetManifest.ts` | 游戏资源键和值；新增资源接入时检查实际路径与 preload |
| `scripts/build-standalone.mjs` | 从 Vite 输出生成无外部资源引用的单文件 HTML |

## 手机单文件交付

- 构建命令：`npm run build:standalone`。
- 构建输出：`dist/misu-standalone.html`。
- GitHub 下载副本：仓库根目录 `misu-standalone.html`。
- 当前下载副本约 **59.05 MiB**，内嵌 32 张 PNG。GitHub 已接受该文件，但提示大于其建议的 50 MiB；小于 100 MiB 单文件上限。
- 修改源码或资源后，如用户需要更新手机文件，须重建、检查生成结果、将新的 `dist/misu-standalone.html` 同步到仓库根目录，再按用户要求提交推送。不要只更新构建脚本而忘记下载副本。
- 目前构建器把 JS/CSS 和所有被代码引用的 PNG 内嵌；构建结果曾通过 HTML 结构检查，确认无外部脚本、样式表或图像 URL。
- 手机浏览器是否允许直接执行下载的 `file://` HTML 因平台而异。若目标浏览器禁止运行脚本，单文件本身不能绕过限制，需要用户授权后改用 HTTPS 托管。

## 2026-10-07 体验修复

用户要求优先修复碰撞、横屏触控、UI 关闭、闪烁、门朝向、过宽的走廊触发及转场/声音。当前修改、测试和交付记录见 [EXPERIENCE_FIXES.md](EXPERIENCE_FIXES.md)。221B/走廊依然是平面地面模型，但角色移动由固定脚底 footprint 的分步碰撞检查驱动，不再依赖随动画帧变化的 Arcade velocity。Lydia 保持 world-space 模型。新增 `src/systems/input/device.ts`、`src/systems/audio/audio.ts` 和专项浏览器/碰撞单元测试。

## 历史验证记录

- 在 `85ad186` 之后运行过 `npm run build:standalone`：TypeScript 检查与 Vite 生产构建成功；生成约 59.1 MiB 文件，HTML 检查结果为一个内联脚本、一个内联样式表、无外部资源引用。
- 这不是目标手机上的实际运行验收。没有在最近单文件更新后运行完整 Vitest/Playwright 套件。
- 相关验证命令：`npm test`、`npm run build`、`npm run test:browser`（需先安装 Playwright Chromium）。按实际改动运行对应检查，并准确汇报范围。

## 历史文档陷阱

- `NARRATIVE_RUNTIME_AUDIT.md` 是 Phase 1.10.1 实施前的审计，其中“Watson 未入场”“221B 无自由探索”等描述已经过时。当前行为以最新 `src/main.ts`、`WorldScene.ts` 和 `roomNarrative.ts` 为准。
- `ART_ASSET_REQUESTS.md`、`VISUAL_BIBLE.md`、各房间 Reconstruction Plan 包含各自阶段的历史要求。若与后续用户指令、现代码或正式资源冲突，不要把旧计划直接当成当前授权。
- Lydia Bedroom 的屏幕坐标 `playerPosition` 在旧场景和存档兼容中仍存在；Bedroom authoritative position 是 `playerWorldPosition3D`。不得由 sprite 屏幕坐标反推其真实 world position。

## 建议的接手动作

收到下一项工作后，先确认具体范围和用户验收要求；随后检查相关实现和测试。若用户继续处理单文件手机运行问题，优先在实际目标浏览器验证下载文件；若暂时无法验证，应明确说明这一点，不要把静态检查当作设备验收。除此之外，等待用户明确指定下一阶段，不主动扩建游戏内容。

## 2026-10-07 世界迁移与正式剧情依据

用户继续授权全场景世界迁移、动画/地毯修复及机制、剧情、UI 扩展，并提供完整剧本，明确允许按剧情自主选择增加内容。上文“等待指定下一阶段、不主动扩建内容”不再适用于这次授权范围。

- `STORY_REFERENCE.md` 保存用户十页完整剧本，是后续剧情因果、E01—E22、守夜分支与结局的正式依据。
- `WORLD_MIGRATION.md` 描述本轮世界坐标、角色图集和推演系统的实现边界。
- 221B、走廊新增 `RoomWorld3D`：以米计的 X/Z 移动、站立体积与碰撞、家具实体和地面层级；三个房间的世界位置现在都会保存。二维位置只保留作 UI 投影与旧档兼容。
- `characterAtlas.ts` 在加载时提取完整连通人物，避免不等行高图集裁切带来的帽子截断/跨帧残片；统一帧大小和脚底，四方向 12 fps 行走。
- 正式剧本 E07、E10 已补入旧房；残液待检，不能未收集原药就生成检验报告。推演选择（包括待解释项）保存在 `hypothesisState`，笔记与推理板可复查、修改。
- 本轮不宣称已完成全案或自由镜头的网格 3D 渲染。其余房间、E03—E22 中尚未实现的内容和守夜结局依照正式剧本逐步开发。
