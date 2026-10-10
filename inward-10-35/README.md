# INWARD — 10⁰ → 10⁻³⁵

40 秒程序化视觉短片。1280 × 720，30 fps，H.264 / AAC。

所有画面由代码逐帧生成，没有使用静态图、素材视频、生成式图像或场景交叉溶解。

## 视觉结构

摄影机以指数曲线持续向原点靠近。十四层嵌套几何共用空间中心，相邻层尺寸比为 0.115。远处结构始终存在，随镜头接近而展开；已经穿越的结构继续留在近景，随后离开视野。微小的侧向漂移、缓慢滚转、近景失焦及悬浮粒子提供深度线索。

膜状表面和纤维 → 细胞与组织 → 双螺旋与分子环 → 概率云与核子 → 粒子轨迹 → 弯曲场面。

五处简短尺度标记：10⁰、10⁻⁶、10⁻¹⁰、10⁻¹⁵、10⁻³⁵。它们是艺术化尺度路标；几何结构和镜头速度并非严格的物理尺度模拟。最后的场结构是抽象表达。

声音由正弦振荡器、滤波噪声与连续下沉的低频合成，无配音。

## 复现

需要 Python 3.10+、FFmpeg、支持 EGL 的 OpenGL 3.3 环境（Mesa 软件渲染亦可），以及 DejaVu Sans 字体。默认配置面向 Linux；其他系统需调整 `Renderer.font` 与 OpenGL context backend。

```sh
python -m pip install -r requirements.txt
python render.py --width 1280 --height 720 --fps 30
```

输出文件：`output/INWARD_10-35.mp4`。

检查静帧：

```sh
python render.py --preview --width 960 --height 540
python render.py --sample 18.5 --width 1280 --height 720
```

随机种子固定，可以复现。修改 `DURATION` 时须同步修改 FFmpeg 输出时长；镜头推进由 `BASE`、`PERIOD` 控制。源代码中 `make_layer` 定义几何，GLSL 着色器定义材质、景深和后期，`audio` 定义声音。
