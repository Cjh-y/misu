# 谜溯：银哨之后

《谜溯：银哨之后》是一款以福尔摩斯与华生为主角的浏览器叙事推理游戏原型。玩家从贝克街 221B 接受委托，前往庄园调查莉迪亚旧房中的线索，并在案件笔记与推理板中整理证据和假设。

当前仓库包含一段可玩的案件开场与调查切片，重点在叙事交互、房间探索、证据记录，以及莉迪亚卧室的 2.5D 世界空间和家具碰撞验证。它还不是完整案件或正式发行版本。

## 开始运行

需要 Node.js 20.19+ 或 22.12+（与 Vite 7 的运行要求一致）。

```sh
npm install
npm run dev
```

Vite 会在终端显示本地开发地址，通常是 `http://localhost:5173`。开发服务器监听 `0.0.0.0`，可供同一网络中的移动设备访问。

生产构建与本地预览：

```sh
npm run build
npm run preview
```

### 手机单文件版本

运行 `npm run build:standalone` 会生成 `dist/misu-standalone.html`。这个文件会把游戏代码、样式和运行所需的图片全部嵌入 HTML，可下载到手机后尝试用支持本地 HTML 脚本的浏览器打开，不需要在手机上运行 Node.js 或启动服务器。文件会比较大；`file://` 下的存档也取决于浏览器权限，若浏览器禁止本地 HTML 执行脚本或存储，需要改用网页托管方式访问。

## 开始游戏

在标题页选择“开始调查”。开场包含 9 句对白，之后玩家留在 221B，可以自由移动、与华生交谈并调查少量环境对象。和华生交谈后，东南出口会允许玩家前往庄园。

庄园走廊连接 221B 与莉迪亚旧房。进入卧室后可调查 E06「房门与窗锁」、E08「通气孔与细密铁网」和 E09「床头假铃绳」。证据可在案件笔记中查看，并用于案件推理板上的假设整理。存档支持继续案件。

## 操作

| 操作 | 键盘 / 鼠标 | 移动设备 |
|---|---|---|
| 移动 | WASD 或方向键 | 虚拟摇杆 |
| 交谈、调查、使用出口 | E | 屏幕上的交互按钮 |
| 打开案件笔记 | J | HUD 上的“案件笔记” |
| 打开推理板 | K | HUD 上的“推理板” |
| 关闭当前界面 | Esc | 点击界面内的关闭控件或返回操作 |
| 开关附近的门 | O | 可用时出现门控件 |

调试快捷键：

- **F3**：开启或关闭当前房间的调试覆盖层。
- **F4**：切换 Lydia Bedroom 的投影网格。
- **F5**：切换 Lydia Bedroom 的碰撞 footprint。
- **F6**：切换 Lydia Bedroom 的交互范围。
- **F7**：切换 Lydia Bedroom 的 3D 世界示意图与体积信息。
- **F8**：切换 Lydia Bedroom 家具的相机投影轴检查。

F4–F8 的专用视图面向 Lydia Bedroom 的开发验收；F3 在其他房间显示各自的物理调试信息。

## 当前内容与空间系统

- **221B Baker Street**：完整房间美术、家具碰撞与遮挡、室内灯光、Holmes 和 Watson 世界角色、短对话、环境观察及出发流程。
- **Manor Corridor**：庄园走廊场景、门与房间转换、走廊碰撞和视觉调试。
- **Lydia Bedroom**：独立房间建筑底图与家具素材；家具以场景实体数据表达位置、尺寸、地面 footprint、占用体积、使用锚点和遮挡关系。房间使用自己的 `WorldProjection`，角色位置和 E06/E08/E09 交互距离以 world X/Z 为依据。
- **证据与推理**：保留 E01、E02、E06、E08、E09 的数据、证据关系、假设和存档状态。
- **输入适配**：桌面键盘与移动端虚拟摇杆、交互按钮共用游戏状态和场景逻辑。

Lydia Bedroom 的 2.5D scene graph 是本仓库的空间验证实现，不代表 221B 或 Manor Corridor 已迁移到同一 world-space 模型。其他房间继续使用共享 Phaser 场景和各自的物理房间配置。

## 项目结构

```text
src/
  core/                 游戏状态、ID、类型与存档
  data/cases/           银哨之后的对白、场景、证据与交互数据
  data/art/             美术资源清单
  game/scenes/          Phaser 世界场景与运行逻辑
  game/rooms/           房间物理配置
  game/world/           Lydia Bedroom 投影、世界房间与 3D scene graph
  systems/              对话、环境交互与推理系统
public/assets/art/      游戏内美术资源
tests/unit/             Vitest 单元测试
tests/browser/          Playwright 浏览器测试
screenshots/            各阶段开发验收截图
```

## 开发与验证

```sh
npm test                 # 单元测试
npm run build            # TypeScript 检查与生产构建
npx playwright install chromium
npm run test:browser     # 浏览器回归测试
```

常用浏览器测试可单独运行：

```sh
npx playwright test tests/browser/narrative-opening.spec.ts
npx playwright test tests/browser/physical-room-system.spec.ts
npx playwright test tests/browser/lydia-scene-graph.spec.ts
npx playwright test tests/browser/lydia-investigation.spec.ts
```

浏览器测试覆盖开场与移动端操作、走廊和房间导航、卧室空间投影与家具体积、物理稳定性、证据调查及相机锁定美术检查。完整套件需要安装 Playwright Chromium。

## 设计与实现文档

- [场景物理化系统](SCENE_PHYSICALIZATION_SYSTEM.md)：共享房间配置和物理场景约定。
- [场景物理化测试路线](SCENE_PHYSICALIZATION_TESTS.md)：手动验证步骤与回归检查。
- [视觉规范](VISUAL_BIBLE.md)：像素美术、视角、比例与光照基准。
- [美术资源需求](ART_ASSET_REQUESTS.md)：资源清单与尚待处理的美术需求。
- [221B 美术重建计划](221B_ART_RECONSTRUCTION_PLAN.md) 与 [221B 构图计划](221B_COMPOSITION_PLAN.md)：221B 空间与美术决策记录。
- [庄园走廊重建计划](MANOR_CORRIDOR_RECONSTRUCTION_PLAN.md)：走廊布局、建筑和美术规划。
- [Lydia 相机锁定资产审查](LYDIA_CAMERA_LOCKED_ASSET_AUDIT.md)：Bedroom 投影基准与家具资产检查。
- [叙事运行时审计](NARRATIVE_RUNTIME_AUDIT.md)：叙事功能的历史审计记录；若与当前实现不一致，应以源码和浏览器行为为准。

## 技术栈

TypeScript、Phaser 3、Vite、HTML/CSS、Vitest 和 Playwright。Phaser 负责游戏场景、角色、输入与物理呈现；HTML/CSS 负责标题、对白、案件笔记、推理板及移动端界面。
