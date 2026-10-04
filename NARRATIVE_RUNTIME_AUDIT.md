# Narrative Runtime Audit

审计基准：当前仓库工作区代码与数据。本文区分已保留并可运行的 Phase 1.5 垂直切片，与当前源码中没有定义、无法在不新增剧情资料的前提下恢复的内容。没有修改剧情、场景代码或美术资产。

## Feature audit

| Feature | Exists? | Data exists? | Runtime exists? | Currently reachable? | Problem |
|---|---|---|---|---|---|
| 221B opening | Yes | Yes：`OPENING_DIALOGUE` 共 9 句，涉及 Watson、Erin Vale、Holmes 与系统；末段发放 E01/E02 | Yes：New Game 建立 opening modal；逐句应用对白 effect，结束后将玩家送到 Hall | Yes：Title → New Game 可完整播放；开场结束立即切到 Hall | 这是屏幕对白覆盖在 221B 场景上的开场，不是有角色走位、镜头调度或淡入淡出的世界内过场。开场对白以外没有 221B 调查/交互数据。 |
| NPC dialogue | Partial | Partial：只有 opening 的说话人和静态文本；没有独立 NPC 对话树、选择分支或世界坐标 | Partial：通用对白条件/effect helper 存在，但 UI 只消费 opening 列表；没有靠近 NPC、显示提示、按键交谈的通用流程 | Only opening is reachable | Watson 角色表已加载但未创建为世界角色；Erin 只有头像和对白提及。当前无 NPC actor 定义、场景放置、脚部碰撞、深度排序、遮挡或场景光照接入。 |
| Cutscene | No | No：未发现独立 cutscene、blocking 或场景调度数据 | No：未发现淡入淡出、地点/时间卡、脚本移动、镜头控制或统一输入锁定的过场控制器 | No | Opening 是 modal 对话；最后一句后直接 `changeScene` 到 Hall。没有可恢复的过场序列。 |
| Environmental investigation | Partial | Partial：仅 Lydia Bedroom 的 E06/E08/E09 三个调查对象；没有 221B 壁炉、书桌、小提琴、化学桌、书柜、窗户或文件的调查文本/定义 | Partial：现有 interactable 列表、距离提示和 E/mobile 调查入口可处理已定义对象 | Lydia Bedroom objects are reachable; 221B investigation is not | 交互判定按欧氏距离筛选，没有视线/墙体遮挡判定，不能满足“不能隔墙触发”。走廊另有通用方向说明面板，不是证据调查。 |
| Evidence collection | Yes | Yes：E01/E02/E06/E08/E09；另有证据关系、假设数据 | Yes：对白 effect 与调查对象可更新 GameState；Notebook、详情和 reasoning UI 读取状态；save/continue 持久化状态 | Yes：E01/E02 由开场发放；E06 可从实际流程收集；E08/E09 有已定义触发器 | 当前属于小型垂直切片证据流程，不含更完整的案件章节/证据链剧情。浏览器 smoke 用真实移动验证 E06；E08/E09 的物理房间测试通过存档定位到目标附近后触发，不能据此声称完整步行路线已验收。 |
| Manor transition | Partial | Yes：场景 ID 包含 221B、Hall、Lydia Bedroom；没有章节级过场数据 | Yes：New Game 开场后切至 Hall；Hall 区域可进入 Lydia；Lydia 出口区可返回 Hall；Hall 左侧 E 可回 221B | Yes, with coordinate-based transitions | 221B 当前房门的物理门状态不是通往 Hall 的剧情门触发。Hall ↔ Lydia 主要由位置区间自动切换，不是门交互/过场。开场结束直接落到 Hall。 |
| Lydia Bedroom | Yes | Yes：场景元数据、物理布局以及 E06/E08/E09 调查定义 | Yes：房间、碰撞、调查对象、证据详情及返回走廊流程存在 | Yes：从 New Game → Hall 区域可进入；E06 的真实流程已由 smoke 覆盖 | 有可玩的调查切片，但未发现额外的 Lydia NPC 对话、章节演出或独立序列定义。 |
| E06 | Yes | Yes：对象、文本、观察、证据 ID 和房间坐标均存在 | Yes：范围提示、按键/移动端触发、证据更新与详情/笔记流程存在 | Yes：真实 Title → New Game smoke 中到达 Lydia 后完成；重复触发规则也已定义 | 目前是单个环境调查节点，不是完整章节流程。 |
| E08 | Yes | Yes：对象、文本、观察、证据 ID 和房间坐标均存在 | Yes：共用调查与证据 runtime | Yes：定义在 Lydia Bedroom，物理房间测试可通过定位状态触发 | 完整 New Game 步行到达并交互的浏览器路径未覆盖。 |
| E09 | Yes | Yes：对象、文本、观察、证据 ID 和房间坐标均存在 | Yes：共用调查与证据 runtime | Yes：定义在 Lydia Bedroom，物理房间测试可通过定位状态触发 | 完整 New Game 步行到达并交互的浏览器路径未覆盖。 |

## 实际 New Game 路径

真实 Title → New Game 浏览器流程已执行，`tests/browser/smoke.spec.ts` 结果为 3/3 通过（桌面真实开局与调查、移动端横屏、移动端竖屏）。桌面用例实际走过的顺序如下：

```text
Title
  → New Game
  → 221B 场景上的 9 句 opening modal dialogue（期间输入锁定）
  → 直接切至 Manor Hall（初始坐标约 x=100, y=160）
  → 玩家移动进入 Hall 中段自动切换区域
  → Lydia Bedroom（入口落点约 x=75, y=224）
  → 探查 E06 并将证据加入 Notebook
  → 打开 Notebook / reasoning
  → reload 后 Continue 恢复存档状态
```

E08/E09 的数据与 runtime 存在，但本轮真实 New Game smoke 没有逐个步行至两处并交互；其当前测试使用已定位到目标区域的房间状态。不得把这项测试覆盖描述成完整剧情路线验收。

因此，New Game **不会**在 opening 后直接把玩家留在 221B 自由移动：它播放九句对白后立即把玩家送入 Hall。但 221B 开场结束即离开该房间，后续也没有已定义的 221B 角色会面或环境调查流程。

## 数据与 runtime 核查

- `README.md` 将当前产品范围明确写为 Phase 1.5 浏览器垂直切片：221B opening、庄园走廊、Lydia Bedroom、E06/E08/E09；E01/E02 由 opening 发放。它没有声称包含后续案件章节。
- `src/data/cases/silver-whistle/scenes.ts` 提供场景元数据，不是章节/过场脚本。
- `src/data/cases/silver-whistle/dialogues.ts` 只定义 opening 的九句对白。`src/systems/dialogue/dialogue.ts` 的对白条件/effect helper 被 opening 使用，但当前没有通用 NPC conversation runtime。
- `src/data/cases/silver-whistle/interactables.ts` 只定义 Lydia Bedroom 的 E06、E08、E09。`evidence.ts`、`relations.ts` 中的证据与推理内容仍在。
- `src/game/scenes/WorldScene.ts` 管理物理房间、角色移动、门、碰撞、光照和调查调试显示；没有 NPC actor 创建、角色交谈扫描或 cutscene 控制器。`watson.png` 在 asset manifest 中定义并由场景 preload，但没有被实例化；Erin 目前只有 opening portrait 使用。
- `GameState` 和 save/continue 保留当前场景/位置、证据、调查对象、对白/剧情 flags、推理状态等切片状态；没有章节进度模型或 NPC conversation state。
- 221B 的家具/门与物理布局属于场景系统。本审计未改动或重置 Phase 1.9.1 已验收的构图、美术、碰撞、地毯、门、遮挡、灯光或 Holmes 表现。

## 缺失分类与实施门槛

**仓库中保留且当前可运行：** opening 文本与 E01/E02 发放、证据/推理 UI、Hall/Lydia 场景转移、E06/E08/E09 交互、GameState 存档继续。这些不是 rebuild 中整体丢失的内容。

**当前仓库没有、标记为 MISSING：** 221B 世界 NPC 定义/放置位置、NPC 对话数据与交谈触发、221B 环境调查条目、cutscene/角色 blocking/地点时间卡/淡入淡出、章节级剧情推进。Watson sprite 的存在不能推导出其应出现的位置或剧情行为；Erin portrait 也不能证明她应作为当前场景 NPC 出现。

**源码中发现的交互缺陷：** opening 完成后，在 221B 按 E 会走入通用 dialogue modal 分支，而 opening index 已到列表末尾；渲染逻辑仍会读取 `OPENING_DIALOGUE[openingIndex]`。这可能导致未定义对白访问。由于 221B 没有交互数据，这属于残留入口/错误处理问题，不是可恢复的既有调查内容；本轮未改代码。

### 结论

当前剧情没有整体从 rebuild 消失：仓库实际包含并可运行一个有限的 Phase 1.5 推理垂直切片。Phase 1.10 所要求恢复的 NPC 场景对话、221B 调查和过场系统则没有足够的既有数据或 runtime 可接回。按“不新增无依据 NPC、不创作剧情”的边界，本轮止于审计，不实施这些缺失部分，也不伪造验收截图。

继续 Phase 1.10 前需要先明确缺失内容的来源：提供既有 NPC/对白/过场/221B 调查资料或其仓库位置；若这些从未存在，则确认后续阶段是否允许基于新剧情资料创作。当前代码不足以安全推断角色放置、交谈内容或剧情时序。
