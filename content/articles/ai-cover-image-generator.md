---
title: "用 Tiny Stable Diffusion + Pillow 生成带文字的 AI 封面图"
date: 2026-03-05
tags:
  - "Stable Diffusion"
  - "Pillow"
  - "AI图像生成"
  - "Python"
description: "所有 AI 图片产品的通用方案：用 Tiny SD 生成背景，再用 Pillow 精确渲染文字。本文完整实现这套流程，一条命令生成可直接用于博客的封面图。"
cover:
  image: "/articles/sd-cover.png"
  alt: "AI 封面图生成方案"
  caption: "由本文介绍的方案生成"
showToc: true
TocOpen: true
---

AI 生成的图片有个公认的死穴——**文字**。无论是 Stable Diffusion、DALL-E 还是 Midjourney，生成的文字几乎不可用：乱码、拼写错误、字母变形，根本原因是扩散模型的"文字生成"本质是像素预测，没有字形约束。

但 Canva、各种 AI 海报工具的封面图里都有清晰的文字，它们是怎么做的？

答案很简单：**AI 只负责画背景，程序负责写字**。这是所有 AI 图片产品的真实方案，本文完整实现这套流程。

## 方案架构

```text
用户输入
  ├── 背景 prompt（描述画面风格）
  ├── 标题文字
  └── 副标题文字
        │
        ▼
  Tiny Stable Diffusion
  生成 512×512 背景图
  （negative_prompt 里排除文字）
        │
        ▼
  Pillow / ImageDraw
  ├── 渐变遮罩层（提升文字可读性）
  ├── 标题（PingFang / Arial Bold）
  └── 副标题
        │
        ▼
  cover.png（可直接用于博客）
```

## 为什么用 Tiny SD 而不是 SD 1.5

| 对比项 | SD 1.5 | Tiny SD |
|---|---|---|
| 模型大小 | ~4 GB | ~700 MB |
| 推理速度（M2 MPS） | ~40s/图 | ~10s/图 |
| 图像质量 | 高 | 中等（做背景够用） |
| 核心技术 | 原版 | 知识蒸馏（层数从 72→37） |

对于"只是个背景"的场景，Tiny SD 是最合适的选择：下载快、内存占用低、速度快。

## 环境准备

### 前提条件

- Python 3.10+
- macOS Apple Silicon（MPS 加速）或 Linux + CUDA GPU
- 磁盘空间 ~1.5 GB（模型缓存）

### 安装依赖

```bash
pip install diffusers transformers accelerate Pillow torch
```

> **Apple Silicon 用户**：`torch` 已内置 MPS 支持，无需额外安装。CUDA 用户安装对应 CUDA 版本的 `torch` 即可，代码中的 `mps` 会自动降级到 `cuda`。

## 完整代码

将以下代码保存为 `generate_image.py`：

```python
"""
AI 封面图生成器
流程：Tiny Stable Diffusion 生成背景  →  Pillow 写文字
"""

import argparse
import os
import textwrap

import torch
from diffusers import StableDiffusionPipeline
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ── 字体路径（macOS）──────────────────────────
FONT_ZH = "/System/Library/Fonts/PingFang.ttc"
FONT_EN = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def has_cjk(text: str) -> bool:
    return any("\u4e00" <= c <= "\u9fff" for c in text)


def best_font(text: str, size: int) -> ImageFont.FreeTypeFont:
    return load_font(FONT_ZH if has_cjk(text) else FONT_EN, size)


# ── 文字渲染层 ────────────────────────────────
def add_text_overlay(
    bg: Image.Image,
    title: str,
    subtitle: str = "",
    position: str = "bottom",   # "bottom" | "center" | "top"
) -> Image.Image:
    W, H = bg.size
    img = bg.copy().convert("RGBA")

    # 渐变遮罩（底部区域）
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_ov = ImageDraw.Draw(overlay)
    grad_h = int(H * 0.55)
    grad_start = H - grad_h
    for y in range(grad_h):
        alpha = int(200 * (y / grad_h) ** 1.5)   # 非线性渐变
        draw_ov.line([(0, grad_start + y), (W, grad_start + y)],
                     fill=(0, 0, 0, alpha))
    img = Image.alpha_composite(img, overlay)

    draw = ImageDraw.Draw(img)

    # 标题
    title_size = max(28, W // 14)
    title_font = best_font(title, title_size)
    max_chars  = max(8, W // (title_size // 2 + 2))
    title_lines = textwrap.wrap(title, width=max_chars) or [title]
    line_h   = title_size + 8
    total_th = line_h * len(title_lines)

    # 副标题
    sub_size = max(18, title_size - 10)
    sub_font = best_font(subtitle, sub_size) if subtitle else None
    sub_h    = sub_size + 6 if subtitle else 0

    # 定位
    pad = 36
    if position == "bottom":
        text_bottom = H - pad
        sub_y   = text_bottom - sub_h
        title_y = sub_y - total_th - (12 if subtitle else 0)
    elif position == "center":
        block_h = total_th + (sub_h + 12 if subtitle else 0)
        title_y = (H - block_h) // 2
        sub_y   = title_y + total_th + 12
    else:  # top
        title_y = pad
        sub_y   = title_y + total_th + 12

    # 绘制标题（居中 + 阴影）
    for i, line in enumerate(title_lines):
        bbox = draw.textbbox((0, 0), line, font=title_font)
        lw = bbox[2] - bbox[0]
        x  = (W - lw) // 2
        y  = title_y + i * line_h
        draw.text((x + 2, y + 2), line, font=title_font, fill=(0, 0, 0, 180))
        draw.text((x, y),         line, font=title_font, fill=(255, 255, 255, 255))

    # 绘制副标题
    if subtitle and sub_font:
        bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
        sw = bbox[2] - bbox[0]
        sx = (W - sw) // 2
        draw.text((sx + 1, sub_y + 1), subtitle, font=sub_font, fill=(0, 0, 0, 160))
        draw.text((sx, sub_y),         subtitle, font=sub_font, fill=(220, 220, 220, 230))

    return img.convert("RGB")


# ── Tiny SD 背景生成 ──────────────────────────
_PIPE = None  # 全局缓存，避免重复加载

def get_pipe():
    global _PIPE
    if _PIPE is None:
        device = "mps" if torch.backends.mps.is_available() else \
                 "cuda" if torch.cuda.is_available() else "cpu"
        print(f"使用设备: {device}")
        _PIPE = StableDiffusionPipeline.from_pretrained(
            "segmind/tiny-sd",
            torch_dtype=torch.float32,
        ).to(device)
        _PIPE.enable_attention_slicing()
    return _PIPE


def generate_background(prompt: str, steps: int, seed: int) -> Image.Image:
    pipe   = get_pipe()
    device = pipe.device
    neg    = "text, letters, words, watermark, blurry, low quality, ugly"
    gen    = torch.Generator(device=device).manual_seed(seed)
    result = pipe(
        prompt=prompt,
        negative_prompt=neg,
        num_inference_steps=steps,
        guidance_scale=7.5,
        width=512, height=512,
        generator=gen,
    )
    return result.images[0]


# ── 主入口 ────────────────────────────────────
DEFAULT_PROMPT = (
    "abstract technology background, flowing digital particles and light streaks, "
    "deep blue and purple tones, futuristic, no text, minimalist, 4k"
)

def main():
    parser = argparse.ArgumentParser(description="AI 封面图生成器")
    parser.add_argument("--title",    required=True)
    parser.add_argument("--subtitle", default="")
    parser.add_argument("--prompt",   default=DEFAULT_PROMPT)
    parser.add_argument("--output",   default="static/images/cover.png")
    parser.add_argument("--steps",    type=int, default=25)
    parser.add_argument("--seed",     type=int, default=42)
    parser.add_argument("--position", default="bottom",
                        choices=["bottom", "center", "top"])
    args = parser.parse_args()

    bg    = generate_background(args.prompt, args.steps, args.seed)
    final = add_text_overlay(bg, args.title, args.subtitle, args.position)
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    final.save(args.output)
    print(f"✅ 已保存: {args.output}")

if __name__ == "__main__":
    main()
```

## 使用方法

### 基础用法

```bash
# 最简调用，使用默认科技感背景
python3 generate_image.py \
  --title "RAG 入门" \
  --subtitle "检索增强生成完全指南"
```

### 自定义背景风格

`--prompt` 参数控制 SD 生成的背景画面，可以自由发挥：

```bash
# 宇宙星空风格
python3 generate_image.py \
  --title "大模型推理加速" \
  --subtitle "量化、蒸馏与投机解码" \
  --prompt "cosmic nebula, stars, deep space, dark blue and gold, cinematic"

# 赛博朋克
python3 generate_image.py \
  --title "Prompt Engineering" \
  --subtitle "Chain-of-Thought 实战手册" \
  --prompt "cyberpunk city, neon lights, rain, dark atmosphere, no text"

# 极简几何
python3 generate_image.py \
  --title "向量数据库原理" \
  --prompt "minimalist geometric shapes, gradient blue, clean, abstract, no text"
```

### 完整参数

| 参数 | 说明 | 默认值 |
|---|---|---|
| `--title` | 主标题（必填） | — |
| `--subtitle` | 副标题 | 空 |
| `--prompt` | 背景风格描述 | 科技粒子风 |
| `--output` | 输出路径 | `static/images/cover.png` |
| `--steps` | 推理步数，越高越精细 | 25 |
| `--seed` | 随机种子，相同值可复现 | 42 |
| `--position` | 文字位置：`bottom` / `center` / `top` | `bottom` |

## 集成到 Hugo 博客

生成图片后，在文章 frontmatter 里加上 `cover` 字段即可（以 PaperMod 主题为例）：

```yaml
---
title: "你的文章标题"
cover:
  image: "/images/cover.png"
  alt: "封面图描述"
  caption: "由 Tiny Stable Diffusion 生成"
---
```

> `static/images/` 目录里的文件会被 Hugo 直接映射到 `/images/`，不需要额外配置。

## 关键设计细节

### 1. negative_prompt 里必须排除文字

```python
neg = "text, letters, words, watermark, blurry, low quality, ugly"
```

这一行是整个方案的核心前提。SD 背景里一旦出现模糊的"伪文字"，再叠加 Pillow 文字后视觉会很乱。加入 negative_prompt 后，模型会主动回避文字区域。

### 2. 渐变遮罩提升可读性

直接在背景上写字，遇到亮色背景会完全看不清。解决方案是在文字区域叠加一层从透明到黑色的渐变：

```python
alpha = int(200 * (y / grad_h) ** 1.5)  # 非线性渐变更自然
```

指数 `1.5` 让过渡更平滑，底部才是完全遮挡，不会显得突兀。

### 3. 文字阴影

```python
# 先画 (x+2, y+2) 的黑色阴影，再画 (x, y) 的白色主体
draw.text((x + 2, y + 2), line, font=font, fill=(0, 0, 0, 180))
draw.text((x, y),         line, font=font, fill=(255, 255, 255, 255))
```

2px 偏移的阴影是增强文字立体感最简单的做法，成本极低但效果明显。

### 4. 模型全局缓存

```python
_PIPE = None

def get_pipe():
    global _PIPE
    if _PIPE is None:
        _PIPE = StableDiffusionPipeline.from_pretrained(...)
    return _PIPE
```

如果在脚本里循环生成多张图，模型只加载一次（约 2 秒），后续每张只需推理时间（约 10 秒）。

## 性能参考（Apple M2）

| 场景 | 时间 |
|---|---|
| 首次运行（下载 + 加载 + 推理） | ~5 分钟 |
| 后续运行（加载缓存 + 推理） | ~12 秒 |
| 仅文字叠加（跳过 SD） | <1 秒 |

模型文件缓存在 `~/.cache/huggingface/hub/`，总大小约 700 MB。

## 扩展方向

- **批量生成**：在脚本里循环调用 `generate_background` + `add_text_overlay`，为所有文章一次性生成封面
- **更换模型**：把 `segmind/tiny-sd` 换成 `stabilityai/stable-diffusion-2-1`（需要更多显存）可得到更高质量背景
- **加 Logo**：在 `add_text_overlay` 里用 `Image.paste()` 贴入站点 Logo
- **调色滤镜**：`ImageEnhance.Color(img).enhance(0.8)` 降低饱和度，让背景更沉稳
