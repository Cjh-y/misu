# Phase 1.11 — Manor Corridor Reconstruction Plan

**状态：Phase 1.11 已完成首轮重建与集成；本计划记录原型审计和最终实施映射。**

本计划以当前仓库代码为准。走廊视觉可以重建，场景 ID、入口触发条件、跳转位置、存档和证据逻辑必须保持不变。

## 1. 审计来源

- `src/game/scenes/WorldScene.ts`：走廊绘制、人物比例、fallback 碰撞、镜头和深度行为。
- `src/game/rooms/physicalRooms.ts`：走廊当前 `PhysicalRoomDefinition`。
- `src/data/cases/silver-whistle/scenes.ts`：场景 ID、名称和尺寸。
- `src/main.ts`：221B → 走廊、走廊 → Lydia Bedroom、Lydia Bedroom → 走廊以及走廊 → 221B 的跳转条件。
- `src/data/cases/silver-whistle/interactables.ts`：E06、E08、E09 热点。
- `tests/browser/narrative-opening.spec.ts`、`tests/browser/physical-room-system.spec.ts`、`tests/browser/lydia-physicalization.spec.ts`：当前走廊通行和 Bedroom 证据相关覆盖。
- `VISUAL_BIBLE.md`、`SCENE_PHYSICALIZATION_SYSTEM.md`、`221B_ART_RECONSTRUCTION_PLAN.md`、`221B_COMPOSITION_PLAN.md`。
- 现有素材：`victorian-interior-tiles.png`、`manor-corridor-decor.png`、`lydia-bedroom-props.png`。
- 现有验收画面：`screenshots/phase-1-10-1/08-manor-arrival.png`。

## A. Current Layout Audit

### A1. 场景、尺寸与镜头

| 项目 | 当前实现 |
|---|---|
| Scene ID / 名称 | `hall` / `庄园走廊`，保持此身份。 |
| 世界边界 | `720 × 320` world units，即 45 × 20 个 16-unit 格。`physicalRooms.ts` 与 `scenes.ts` 尺寸一致。 |
| 镜头 | 依 viewport 尺寸用 `max(widthRatio, heightRatio)` 覆盖式缩放；平滑跟随 Holmes，镜头限制在世界边界内。不同屏幕比例会裁切横向或纵向视野。 |
| 起始位置 | 221B 出发后到达 `(100,160)`；从 Lydia Bedroom 返回也到达 `(100,160)`。 |
| 人物显示尺寸 | 走廊尚未启用 Phase 1.9.1 使用的 Holmes 美术尺寸；当前使用 `WORLD_SCALE.character` 的 `16 × 24`，脚部碰撞为 `10 × 8`。 |
| 人物光影 | Hall 的 `PhysicalRoomDefinition` 对象存在，因此有脚底阴影、`WOOD` 表面事件和环境 tint；该房间 `lights: []`，所以无局部暖光/冷光变化，Holmes 使用固定的 Hall ambient tint。 |

### A2. 边界、碰撞和可走区域

`PHYSICAL_ROOMS[HALL]` 当前是空配置：`walls / props / surfaces / lights / doors / exits / occlusion / propVisuals` 均为空。`WorldScene.wallRects()` 为走廊提供 fallback 碰撞。

| 碰撞段 | 中心与尺寸 | 实际阻挡范围 |
|---|---:|---:|
| 北墙 | `(360,8)`, `720×16` | 全宽 `y=0..16` |
| 南墙 | `(360,312)`, `720×16` | 全宽 `y=304..320` |
| 东墙 | `(712,160)`, `16×320` | 全高 `x=704..720` |
| 西墙上段 | `(8,68)`, `16×120` | `x=0..16`, `y=8..128` |
| 西墙下段 | `(8,252)`, `16×136` | `x=0..16`, `y=184..320` |

除上述边界墙外，fallback 几何没有走廊家具或门的碰撞。基本可走区域为 `x=16..704`、`y=16..304`，包括视觉上的静态门口、console table 和蜡烛附近。墙体绘制由 `drawPerimeter()` 的 tile strips 单独完成，并未与独立配置化的房间墙段/门洞对应。

Hall 的 F3 物理可视化目前不可用：调试图层只在物理房间配置了门时创建，而 Hall 的 `doors` 为空。

### A3. 门和场景跳转

下列门框位置来自 `WorldScene.drawRoom()`。前三处以 `interior-tiles` 的同一 `doorway` atlas frame 绘制；West connector 使用旋转后的同一 frame。

| 视觉入口 | 当前视觉锚点 / bounds | Gameplay 语义 |
|---|---|---|
| 221B connector | 中心 `(28,160)`，`34×48`，旋转 `π/2` | 玩家位于 `x < 42 && abs(y-160) < 52` 时按 E / mobile action 返回 221B，落点 `(430,160)`。反向离开 221B 时走剧情转场，落点 `(100,160)`。 |
| Lydia Bedroom 入口 | 中心 `(210,160)`，`38×54` | 角色进入严格范围 `150 < x < 274 && 104 < y < 220` 时自动进入 Lydia Bedroom，落点 `(75,224)`。不是按 E 开门；当前区域比可见门框大得多。 |
| 走廊装饰门 A | 中心 `(405,100)`，`38×54` | 仅视觉，不触发跳转。 |
| 走廊装饰门 B | 中心 `(565,100)`，`38×54` | 仅视觉，不触发跳转。 |
| Lydia Bedroom 返回口 | Lydia 配置中的门中心 `(39,216)`；开门状态初始为 open | 从 Bedroom 的 `x < 28 && 162 < y < 256` 返回走廊，落点 `(100,160)`。门叶/碰撞属于 Bedroom 配置，不属于 Hall。 |

Hall 没有 `DoorDefinition`、独立出口 footprint 或 door-state 动画。静态门画面目前可直接穿过。实现阶段必须原样保留上述自动跳转语义和落点；尤其不能把 Lydia 门的宽触发区缩到绘制边框而造成路线回归。

### A4. 墙体、地毯、家具和灯

| 元素 | 当前绘制/坐标 |
|---|---|
| 地面 | `floor-boards` tile frame 在 `720×320` 全幅 tileSprite 上重复铺设，tile scale `.1`。 |
| 固定墙边 | 北/南墙各一条 `wall-panel` tile strip；西墙按入口留空拆两段；东墙整段。尺寸取自 `drawPerimeter()`，tile scale `.1`，深度 `-18`。西墙上段绘制范围 y=8..124，而碰撞到 y=128；现有视觉开口约 60 units，碰撞开口 56 units。 |
| Runner ×4 | 均从 `lydia-bedroom-props.png` 同一 rug crop `(449,525,578,294)` 绘制；中心 `(120,160)`,`(300,160)`,`(480,160)`,`(650,160)`，每条 `128×34`。图案、长度和纵向位置完全相同。 |
| Wall sconce A/B | corridor atlas 两种蜡烛壁灯，中心约 `(102,43)` 与 `(598,43)`，尺寸约 `26×30`、`24×30`。灯光只烘在素材视觉内。 |
| 肖像组 | Lady `(240,50) 24×36`、Gentleman `(296,50) 24×36`、Lady 2 `(352,50) 24×36`，连续等距排在北墙附近。 |
| Console / vase / candlestick | console `(438,66) 72×29`；花瓶 `(444,49) 15×21`；烛台 `(493,51) 12×22`。均为独立图像，无碰撞或前景 crop。 |
| 运行时灯源 | Hall 配置 `lights: []`。壁灯 atlas 自带暖色亮部，但 Holmes 不会随其位置获得不同 tint。 |
| 走廊调查点 | `INTERACTABLES` 没有 Hall 项；走廊不新增剧情或证据。E06/E08/E09 均由 Lydia Bedroom 现有互动负责。 |

现有走廊素材 atlas `manor-corridor-decor.png` 为 `1536×1024`，包含两款壁灯、三幅肖像、console table、花瓶、独立烛台，以及长 runner 与端头 runner。`victorian-interior-tiles.png` atlas 含地板、wall-panel、通用 doorway 和墙体/转角/饰条片段。当前没有独立 Manor Corridor room-base、专用门叶或门口凹龛资产。

## B. Problems

| 问题 | 分类 | 影响与依据 |
|---|---|---|
| 720×320 单一长方形全铺木地板，地板 tile 和 wall strips 都靠重复 atlas | 视觉 / 重复 tile | 缺少空间变化与建筑纵深，tile pattern 横跨整个室内均匀重复。 |
| 四条相同 runner 等距铺开 | 视觉 / 重复 tile / 导航 | 形成“地毯轨道”而非一条庄园主走廊；Lydia 的地毯素材也暴露了跨场景复用。 |
| 西侧上墙绘制边界为 y=124，碰撞到 y=128 | 视觉/碰撞轻微不一致 | opening 上边缘相差 4 units；重建时将 threshold 视觉边缘贴齐既有碰撞边界，但不扩大或缩窄通行范围。 |
| Lydia 门框在 `(210,160)`，无独立墙体凹龛或门槛层 | 视觉 / 视觉-物理不一致 | 入口看起来像压在地面上的门 sprite；几何触发区为 `124×116`，明显大于 `38×54` 视觉门框。可能造成进入侧门前就自动切场景。 |
| Lydia 门视觉 anchor 在 corridor 中段 `(210,160)` | 建筑结构 / 导航 | 它不落在当前四周 perimeter wall 线上，周围没有单独的回墙/凹龛或地板 threshold；这是需要在美术重建中解释的建筑关系，不能简单将门挪到外墙而保留原触发区不变。 |
| 其它两扇门与 Lydia 门使用同一通用框，且可直接穿过 | 视觉 / 物理不一致 | 装饰门没有独立门叶、墙深或过渡；若未加说明，玩家可能将它们误判成可进入区域。它们当前没有场景映射，不能新增映射。 |
| 只有外围墙碰撞 | 物理 / 导航 | console 和门没有 footprint；玩家可以穿过视觉上的家具/关闭门。当前可走区域本身连续，但视觉阻挡和物理占位不一致。 |
| Hall 物理配置为空，collision 仍硬编码在 `wallRects()` fallback | 物理 / 工程映射 | 表面、灯源、门框、家具 footprint 与 occlusion 无法通过当前 room config 审查；F3 调试也无法打开。 |
| 墙面装饰等距且扎堆 | 视觉 | 三幅肖像集中在北侧中段，两盏灯分居左右端，console/摆件又紧邻成组；节奏单一且没有留白变化。 |
| 走廊没有定义灯源 | 视觉 / 角色嵌入 | 壁灯本身有像素高光，但人物只响应固定 Hall ambient；没有灯池、灯间暗区或地面反射变化。 |
| Hall 没有配置 foreground occlusion | 视觉 / 角色嵌入 | 墙边、门框、柱面和 console 均没有明确的前景 crop。现有 sprite 仅按单一 `y` 深度排序，不能表达 frame jamb 在角色前后分层。 |
| Holmes 使用 `16×24` 默认显示尺寸 | 尺度 / 角色嵌入 | 显著小于 Phase 1.9.1 221B 的 `34.8×51.6` 显示尺寸，场景切换时人物比例突变。脚部碰撞仍保持 `10×8`。 |
| 走廊中央 Lydia trigger 是位置事件自动传送 | 导航 | 这是既定玩法语义，不能改成 E 交互；但更清楚的凹龛、门槛和短 approach runner 可以使触发范围容易理解。 |
| 摄像机宽高覆盖缩放随屏幕比例裁切走廊端部 | 导航 / 构图 | 16:9 viewport 不一定同时显示 720-unit 全宽，Hall 应以滚动长廊方式构图，关键地标要能在跟随镜头中逐段出现。 |

**严重冲突复核：** 当前唯一通往 Bedroom 的触发范围与 Lydia 门视觉中心大致重叠，但触发范围远宽于画框；入口周围的 artwork 必须清楚地把 threshold 与 trigger 中心关联起来。其它门不对应任何 transition，重建时不能为它们臆造剧情用途。

## C. New Spatial Interpretation

保留 `720×320` 世界尺寸和现有路线，将走廊表现为一条正式住宅中的横向主廊：纵深由连续地板透视、墙脚/护墙板、上墙阴影、局部墙体凹龛、透视一致的门框、单条主 runner 和局部暖光建立。空间不是一张均匀铺满装饰的长方形。

### C1. 三段视觉节奏

1. **西侧来路 / 221B threshold（约 x=16–145）**：保留 `(28,160)` 连接口和 `(100,160)` 到达点。门口以窄门套、地板 threshold 和较暗侧墙建立从 Baker Street 进入庄园的过渡；墙开口仍对应现有 56-unit 通行带。
2. **Lydia 入口重点区（x=150–274，中心 `(210,160)`）**：该段是唯一 Bedroom 入口。为门做较深的门洞、厚门套、门槛和轻微暖光；主 runner 在门前转成/连接一小段 approach runner，视觉中心保持与现有自动跳转区相合。不得改触发框、出入口条件或落点。
3. **东侧肖像廊 / 静态门区（约 x=274–704）**：保留更远的装饰门作为不可进入的房间界面；通过肖像、壁灯和少量 console 构成不规则节奏。放弃等距装饰列，让一段墙留空、另一段形成小组。东端可在不挡可走区域的位置压暗，作为视线终点。

房间可有南/北两侧墙面的错列开口感，但不得把静态门改成跳转门。Lydia doorway 的 `y=160` 是其视觉和路线 anchor；实现时需通过墙段/凹龛结构解释这一 anchor，并避免用视觉墙横断目前连续的步行路线。

### C2. 视觉强弱与导航

- 221B、西侧门框和 Lydia 门为三个可辨识的路线锚点；Lydia 门的门套/threshold/短 rug approach 最清楚。
- 只设置一条主 runner，再用与其有关系的一段较短门口 runner；不再等距重复同尺寸地毯。
- 裸木走道保持连续可读；runner 表面代码区与可见边界一一映射。
- 亮区集中在壁灯和 Lydia 门前；两个灯池之间保留低亮度段，边角更暗但可行走轮廓仍可读。
- 肖像用少量、不同尺寸/相框形式；console、花瓶、钟或烛台择少布置，不沿墙每隔固定距离重复。
- 走廊气质正式、安静、克制，比 221B 更规整、更冷；不添加 NPC、剧情或调查对白。

### C3. 尺度和角色

- Hall 使用与 221B 一致的 Phase 1.9.1 Holmes sprite/display scale；建议目标 `34.8×51.6`，脚部 collider 继续 `10×8`。这是纯视觉尺寸，不改变触发距离或移动。
- 门 leaf 的可见高度参考 VISUAL_BIBLE 中约 48–54 logical-unit 范围，门框整体可以更高；用 221B 角色比例校准门和护墙板。
- 保留现有脚底阴影体系；新增的 Hall warm emitters 只通过现有 light response 调 tint，不把整张图做成全屏光圈。

## D. Coordinate and Transition Preservation Map

| 目标对象 / 路线 | 当前权威坐标 | 重建处理 | Gameplay 坐标是否变更 |
|---|---|---|---|
| Hall 世界边界 | `720×320` | 房间底图严格对应此 bounds 和当前 camera-follow 世界；不改场景 ID/尺寸。 | 否 |
| 221B 入口门框 | `(28,160)`, `34×48`, `rotation=π/2` | 重新表现厚侧墙、门框与地板门槛；对齐现有西侧 opening。 | 否 |
| 221B 返回触发 | `x<42 && abs(y-160)<52` | 保留；视觉通道不得在 x 16–42/y 108–212 挡路。 | 否 |
| Hall 入场 spawn | `(100,160)` | 保留为西侧起步区；确保 runner 不遮掉角色脚点。 | 否 |
| Lydia 入口门框 | `(210,160)`, `38×54` | 做本场主要 recessed doorway；设计上把 threshold 对齐到触发中心，凹龛边缘与 `124×116` 触发范围相容。 | 否 |
| Hall → Lydia 自动触发 | `150<x<274`, `104<y<220` | 原样保留且继续自动进入；不增加按键交互。Visual approach 负责让大范围触发可理解。 | 否 |
| Lydia 入场 spawn | `(75,224)` | 保持。 | 否 |
| Lydia → Hall 返回 | Lydia 内 `x<28`, `162<y<256` | 保持 Bedroom 门/碰撞与 return condition；Hall 接收落点仍为 `(100,160)`。 | 否 |
| 返回 Hall spawn | `(100,160)` | 保持西侧来路通道清晰。 | 否 |
| 静态装饰门 A | `(405,100)`, `38×54` | 可做差异化 frame/门面；不添加 transition。 | 不涉及玩法；视觉可重构 |
| 静态装饰门 B | `(565,100)`, `38×54` | 与 A 使用不同门面/框饰或墙侧光，不复制同款组合；不添加 transition。 | 不涉及玩法；视觉可重构 |
| E06 / E08 / E09 | Lydia hotspots 分别 `(48,216)`, `(309,30)`, `(309,60)` | 只做 Hall→Bedroom 来回冒烟回归；不改这三个定义。 | 否 |

门移动建议：Hall gameplay 入口 trigger 保持不动；即使将 Lydia doorway 视觉构图重新做成完整墙龛，也让门槛与 `(210,160)` 路径锚点注册。两个没有 trigger 的背景门属于纯视觉物件，可在已确认路线不受影响时重排，但本计划建议优先保留中心、改变 frame/尺寸/墙面组合，以减少导航风险。

## E. Asset Breakdown

### Static / Room Base

**建议：`manor_corridor_room_base.png`，2160×960（按当前 720×320、3×源像素密度）。**

包含连续木地板及其细微磨损、主墙体/side wall 厚度、固定护墙板、dado rail、踢脚线、cornice、pilaster 的后层结构、墙角阴影、固定 wall recess、门洞内侧背板、非交互永久装饰以及克制的烛光环境底色。Room base 负责形成“一间建筑”，不要把人物会穿越的全部门框前边、console、蜡烛或 runner 都烘进底图。

### Independent Sprites

| 资产建议 | 用法 |
|---|---|
| `manor_hall_lydia_door_leaf.png` | Lydia 主入口门叶；静态或保持 runtime 所需状态。当前 Hall 没有 toggle-door 语义，不得新增交互。 |
| `manor_hall_secondary_door_a.png` / `..._b.png` | 两扇背景门做视觉差异；仅装饰，无 scene transition。 |
| `manor_hall_sconce_a.png` / `..._b.png` | 优先评估复用现有 corridor atlas 两种壁灯；若更新，维持蜡烛式暖光。 |
| `manor_hall_portrait_a/b/c.png` | 复用现有三幅肖像并改变尺寸/位置/墙面分组，或仅替换不适配的内容。 |
| `manor_hall_console.png`, `manor_hall_vase.png` | 复用现有 side table 与 vase，放在实际墙边；新增 footprint 只在确实需要阻挡时配置。 |
| `manor_hall_runner_main.png` | 一条主要连续 runner；独立图层，能与 runner `SurfaceRegion` 精确对齐。 |
| `manor_hall_runner_lydia_approach.png` | 可选短 runner，与主 runner 形成入口引导；不在每扇静态门前复制铺设。 |
| `manor_hall_threshold_221b.png` | 西侧 connector 的视觉 threshold，可纳入 base 或作为局部小 sprite；不能改变 56-unit gap。 |

### Foreground / Occlusion

- `manor_hall_lydia_frame_fg.png`：只含入口厚门套靠玩家侧的 jamb/trim，深度锚点落在门槛 y 附近。
- `manor_hall_pilaster_fg.png`：若配置柱/墙段深入走道，只将朝前的窄面裁为 foreground，不把整个柱子重复画两次。
- `manor_hall_wall_edge_fg.png`：只在镜头内确实会遮挡 Holmes 的两端 wall edge 使用。
- `manor_hall_console_fg.png`：仅 console 有可走到其后的空间时拆前沿；否则用单 sprite 加相应 footprint。

固定墙画和绝大部分墙面装饰可留在背景层。不要为了“有层次”机械地给每扇门生成 foreground crop。

### Lighting / Physical Data

- Hall 由当前空 `PhysicalRoomDefinition` 补为显式配置；现有五段边界 collision 原样转入 `walls`，玩法边界不变。
- `defaultSurface: WOOD`；主 runner 与 Lydia approach 的可见 footprint 在 `surfaces` 中分别映射为 `RUG`。如果贴图是单个连续 rug，surface region 同样连续；如果有裸地缝，则不可跨越视觉边界。
- 配置约 2–3 个 warm `RoomLight`，对应可见壁灯/入口灯；低强度、有限半径，在灯池间保留暗部。具体 emitter 数值在视觉稿和当前 Holmes tint scale 校准后再定。
- F3 调试入口应能显示 corridor footprint/surface/light，而不要求为装饰门创建不存在的 gameplay door；这需要检查调试层当前“仅有 DoorDefinition 才创建”的约束，避免伪造 door logic。
- 将 corridor decor 纳入物理配置 asset 类型前，明确只有真正挡路的独立对象才获得 footprint；门框 ornament、壁灯和肖像不应生成地面碰撞。

## F. 资产制作与接入顺序

1. 先根据本计划确认架构分层和 Lydia doorway 视觉注册。
2. 先生成/验证 `manor_corridor_room_base.png`、一组 Lydia doorway frame/leaf、一款 sconce、一条 runner；其他现有 atlas 内容先复用，不整批重画。
3. 在保留 `720×320` world 与触发区的运行场景内校准镜头比例、Holmes 显示尺寸、door threshold、墙体厚度、地毯边界和灯光节奏。
4. 只在第一组空间验证通过后，补做差异化的两扇背景门、少量墙画和必需的前景 crop。
5. 再把 Hall 配置成显式的物理房间，沿用共享的 movement、footprint、surface、lighting、shadow、depth 和 F3 系统；`main.ts` transition 条件保持原样。

### 统一生成方向

采用本请求提供的 MASTER STYLE PROMPT：3/4 top-down painterly pixel art、Victorian formal manor、暗色木材、褪色 burgundy、aged cream、brass、局部暖烛光与暗处留白。Hall 比 221B 更克制、更安静；避免重复 tile、酒店走廊感、现代灯、等间距门/地毯、空白 showroom 和夸张对称宫殿。

Room-base prompt 要明确：`720×320` 横向游戏空间；west connector 在 `(28,160)`，Lydia doorway anchor 在 `(210,160)`，两扇不可进入的背景门对应 `(405,100)` / `(565,100)`；只要求这些位置对应的空间关系，不能复制旧 tile 图案。门叶/runner/壁灯等独立透明资产要标注透明背景、无额外地板、共享 3/4 视角和相同像素密度。

## G. Navigation / Composition Review

1. **West entry clearance：** 西端 `(28,160)` 至 spawn `(100,160)` 必须保持连通；不能把入口 runner、门叶、墙厚或 foreground crop 延伸到旧 opening 的通行带中。
2. **Lydia automatic trigger：** 保留现有宽阈值 `150<x<274 && 104<y<220`。门槛、光池、短 runner 和门框都围绕这块范围建构；避免在其外另造会被误认为 Bedroom 门的门框。
3. **Secondary doors：** `(405,100)` / `(565,100)` 不是 transition。明确以门叶关闭、frame depth 和 floor continuity 表达“背景房门”；不要增加提示、interaction 或证据热点。
4. **Walkable floor vs decor：** 当前 console/vase/candlestick 无碰撞。重建后若视觉表现为大型落地家具，必须给对应小 footprint；若保持可从旁边通行，则 artwork 不能延伸覆盖中央路线。
5. **Runner/surface boundary：** 新 rug 的画面 bounds 与 RUG surface rectangles 对齐；threshold 和裸木 floor gap 要同时可见、可走。
6. **Depth：** 靠墙的壁灯、肖像和背景门始终在人物之后；入口 jamb、端墙和确需遮挡的 console front 独立排序在 Holmes 前方。
7. **Camera：** 由于 hallway 是长场景，不要求所有 720 units 同屏，但每一 viewport 比例都要能分辨当前进程方向；Lydia 的 doorway 应在到达自动触发前进入可见范围。
8. **人物比例：** 当前 Hall 的 16×24 Holmes 是已知不一致点。将 Hall 转为 Phase 1.9.1 视觉尺寸时维持原 10×8 脚底 collider、移动速度和 interact range。

目前确认的是视觉构图/物理映射风险，没有提出必须改变的剧情或入口坐标。除既有 Lydia trigger 本身比 artwork 大这一问题外，没有发现 E06/E08/E09 在 Corridor 内的触发风险，因为这三个热点都属于 Lydia Bedroom。

## H. Phase 1.11 Implementation Verification Plan

重建接入后使用浏览器逐项验证，保持以下条件：

- New Game opening / Watson / departure cutscene 抵达 Hall 仍进入 `(100,160)`。
- Continue 直接恢复在 Hall 时场景 ID、saved position、camera 和 UI label 正常。
- 从 Hall 西侧既有范围按 E / mobile action 返回 221B；不改变出现地点和存档语义。
- 经过 Lydia doorway 原触发区后进入 Bedroom `(75,224)`；Bedroom 原 door leaf/collider 仍能开关。
- 从 Lydia Bedroom 原区域返回 Hall `(100,160)`。
- Hall 中控件、E 交互和移动端仍工作；静态装饰门不触发新逻辑。
- 墙体、实际家具 footprint、surface region、灯源和 foreground occlusion 在 F3 可见；runner 与 WOOD/RUG 事件一致。
- 在 Hall 走廊的暗区、壁灯附近、Lydia 门前对比角色颜色、脚底阴影和尺度。
- Lydia E06/E08/E09 仍分别在 `(48,216)`、`(309,30)`、`(309,60)` 可获取；不改 evidence ID/内容。

建议截图：全景 gameplay、F3 collision/surface/light debug、Lydia 门前、壁灯暖光、从 foreground jamb/柱后通过、Hall↔Lydia transition、移动端长廊。

## I. Phase 1.11 Implementation Record

### I1. Integrated art and composition

- `public/assets/art/environments/rooms/manor-corridor-room-base.png`：正式走廊底景，1881×836；按 `720×320` world bounds 缩放。包含连续深色木地板、护墙板、dado rail、cornice、厚墙端部与 pilasters、Lydia 入口凹龛、两处次要静态门洞和永久墙面结构。
- `public/assets/art/environments/rooms/layers/manor-corridor-door-leaf.png`：独立透明门叶，仅用于两扇背景门；Lydia 凹龛保持敞开，与原自动入口一致，不额外制造门交互。
- `manor-corridor-decor.png` 中原有壁灯、肖像、console、花瓶、烛台和 runner 被复用，避免破坏与既有像素密度的统一性。
- Hall 采用一条主 runner（视觉约 `(356,235)`, `578×50`）与 Lydia 门前短 runner（约 `(214,148)`, `77×32`），材质区分别注册为 RUG；其余可走地面保持 WOOD。
- 四个可见壁灯分布在 west entrance、Lydia 入口侧和 corridor gallery；对应四个低强度 warm emitter，灯池互有重叠并保留暗部。
- Holmes 使用 Phase 1.9.1 `34.8×51.6` 可见角色比例，脚底碰撞保持原小 footprint，室内阴影、depth sort 与位置 tint 沿用共享 runtime。

### I2. Final collision / trigger mapping

- Room bounds 仍为 `720×320`。
- 西端回 221B 判定仍为 `x<42 && abs(y-160)<52` 并保留 E / mobile action；221B 返回 spawn 仍为 `(430,160)`。庄园到达和 Lydia 返回 spawn 仍为 `(100,160)`。
- Lydia Bedroom 自动进入判定原样保留：`150<x<274 && 104<y<220`；Bedroom spawn 仍为 `(75,224)`。新凹龛和短 runner围绕 `(210,160)` 注册，没有移动 gameplay doorway。
- Fallback 边界碰撞原样纳入显式 Hall room walls；另加入北墙阻挡带、凹龛两侧 jamb footprint、两扇静态门的 threshold footprint 与东侧 console footprint。中心通路和凹龛开口保持连通。
- E06/E08/E09 定义及 Lydia Bedroom 配置未改；Hall 没有新增证据、故事或可触发门逻辑。
- 走廊横屏摄像机在横向可用时 fit-to-width 展示完整 `720` world 宽度；窄屏仍使用跟随镜头 fit-to-height，保留移动端角色可读性。

### I3. Verification artifacts

- `screenshots/phase-1-11/01-corridor-clean.png` — clean corridor view。
- `screenshots/phase-1-11/02-corridor-physics-debug.png` — collision / rug regions / light debug。
- `screenshots/phase-1-11/04-lydia-entry.png` — corridor doorway transition into Lydia Bedroom。
- `screenshots/phase-1-11/05-corridor-mobile.png` — mobile corridor controls。
- `screenshots/phase-1-11/06-holmes-behind-console.png` — foreground depth check。
- `screenshots/phase-1-11/07-holmes-under-sconce.png` — warm local sconce response。
- Browser coverage lives in `tests/browser/manor-corridor.spec.ts`; navigation and Bedroom regression are also covered by the existing narrative and Lydia physicalization specs.

## J. Phase 1.11.1 Composition Pass

No new scene art or gameplay interaction was added. The existing corridor base, door leaves and decor atlas were recomposed:

- **West connector / arrival segment:** a portrait and sconce form a small wall grouping; console, vase and candlestick create a grounded floor vignette near the east end of the segment. The path from `(28,160)` to `(100,160)` remains clear.
- **Lydia entrance segment:** the existing deep alcove remains the dominant architectural anchor. Its single nearby sconce is at `(279,38)`; the small approach carpet is centered at `(210,148)` and has no glow or marker treatment.
- **East gallery segment:** the static doors remain at `(405,69)` and `(565,69)` with their existing destinations (none). Their decoration differs: the first sits near the center portrait grouping; the second has a local doormat and the console / portrait vignette toward the east wall.
- Wall sconces now form three unevenly spaced light pools at approximately `x=111`, `279`, and `515`. Portraits are spaced as three distinct groupings around `x=145`, `354`, and `629` with small height offsets.
- The former full-length runner is now a shorter main rug centered at `(390,225)`, `310×48`. Lydia’s approach rug is `58×28`; a separate `46×22` mat marks the east static doorway. Surface regions follow each carpet; the rest remains wood.
- Console display and its decorative footprint moved together to the east wall at approximately `(650,130)`. The footprint remains separate from story-door triggers and does not cross the central route.
- Holmes retains the Phase 1.9.1 visible scale and unchanged movement body. Horizontal full-room framing, mobile camera behavior, all corridor bounds, wall segments, door leaf anchors, automatic Lydia entrance range, evidence state, and transition semantics remain unchanged.

Composition screenshots:

- `screenshots/phase-1-11/01-corridor-clean.png`
- `screenshots/phase-1-11/02-corridor-physics-debug.png`
- `screenshots/phase-1-11/05-corridor-mobile.png`
- `screenshots/phase-1-11/08-holmes-near-lydia-entrance.png`
- `screenshots/phase-1-11/09-holmes-corridor-center.png`
- Additional light and console depth views: `07-holmes-under-sconce.png`, `06-holmes-behind-console.png`.

## K. Phase 1.11.2 Perspective & Character Scale Fix

This pass addressed only floor textile perspective, the Lydia threshold seam, and character display proportions. Door mappings, room bounds, story triggers, actor positions, and narrative state remain unchanged.

### K1. Floor textile and threshold

- Removed the long central runner and the east static-door mat. Both reused atlas rugs had a near-flat, top-view read that conflicted with the corridor floor plane. Their surface regions were removed as well, so those areas now report `WOOD`.
- Replaced the Lydia doorway mat with `manor-corridor-lydia-threshold.png`, a single transparent, perspective-foreshortened textile asset. Its visible bounds and `RUG` surface region are registered to the same `54×21` area at `(210,161.5)` and meet the existing recessed doorway threshold.
- The west and east door mappings, Lydia automatic trigger (`150<x<274 && 104<y<220`), and all door-frame/collision coordinates are untouched.

### K2. Character source and world scale

- Holmes uses the same `51.6`-unit world height in 221B and the corridor. Phase16 frame crops now receive a uniform per-frame scale derived from source-frame height, preserving each frame's native shoulder/body ratio rather than stretching it to a fixed width. Hall now uses the Phase16 idle/walk frame path as intended.
- Watson's 4×4 sheet cells are alpha-trimmed when registered as frames. His visible height is `51.6` world units and his scale is uniform; the prior `43.2×64.8` display box stretched his silhouette and made him taller than Holmes.
- Actor feet remain aligned to the authored `feetY`, and their separate contact footprints remain Holmes `18×10` and Watson `10×8`. Watson stays at `(209,166)`; no NPC or player movement logic changed.
- Lydia Bedroom keeps its existing 64.8-unit Holmes height. The player sprite source is not changed, and no NPC asset is regenerated.

### K3. Verification screenshots

- `screenshots/phase-1-11/01-corridor-clean.png` — corridor without the floating central runner.
- `screenshots/phase-1-11/02-corridor-physics-debug.png` — unchanged bounds/props and the one remaining threshold rug surface.
- `screenshots/phase-1-11/09-holmes-corridor-center.png` — Holmes on the wood circulation floor.
- `screenshots/phase-1-11/10-holmes-watson-side-by-side.png` — shared 221B view for height and silhouette comparison.
- `screenshots/phase-1-11/11-doorway-threshold-close.png` — Lydia threshold textile against the recessed entrance.
