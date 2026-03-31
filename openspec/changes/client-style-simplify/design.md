## Context

用户端基于 React 18 + Vite，样式分两层：全局 CSS（`apps/client/src/styles/global.css`，约 810 行）和各页面组件内联样式。当前视觉存在两个问题：主题色泛滥（导航栏/背景/装饰条）；整体调性偏国产促销风（红色价格、渐变按钮、圆润色块 Tab）。目标是通过最小改动路径实现"欧式极简"升级。

## Goals / Non-Goals

**Goals:**
- 主题色收敛到有语义的交互元素（active、主要按钮、spinner）
- 背景色调由冷灰改为暖米白，提升质感
- 价格颜色由促销红改为墨黑，传递品质感
- 引入 Cormorant Garamond 字体用于数字排版（价格、评分），中文保持系统字体
- 分类 Tab 由填充 pill 改为文字+底线，减少视觉噪点
- 按钮去渐变、卡片去重阴影，整体扁平化
- 用户头像去主题色渐变

**Non-Goals:**
- 不修改任何业务逻辑、API 调用、路由
- 不调整整体布局结构和间距系统
- 不改动后台管理端
- 不引入 CSS 变量/主题机制（只改具体色值，保持改动可审查）

## Decisions

**字体：Cormorant Garamond，仅用于数字**
> 中文用系统字体（PingFang SC）体验已足够好。欧式衬线字体在中文上作用有限，但在价格数字（¥ 199.00）、评分数字（4.8）上能产生强烈的奢品目录感。通过在 `index.html` 引入 Google Fonts，在 CSS 中仅对价格/评分元素设置 `font-family: 'Cormorant Garamond', serif`。

**背景：`#FAF8F5` 暖米白**
> 纯白 `#fff` 太刺眼，冷灰 `#f5f5f5` 工具感太强。`#FAF8F5` 是含极少量暖黄的米白，接近高端纸张质感。卡片背景保持纯白 `#fff`，与页面背景形成微妙区分。

**价格颜色：`#1a1a1a` 墨黑**
> 红色价格是国内电商"实惠/促销"的视觉语言。改为墨黑后，价格变成商品本身的一部分（数量信息），而非促销信号——这是 LVMH、Net-a-Porter 等高端电商的通用做法。促销折扣仍用灰色划线原价表示，不需要颜色强调。

**按钮：去渐变，保持色相**
> `.btn-primary` 从 `linear-gradient(90deg, #01c2c3, #00a8a9)` → 纯色 `#01c2c3`。`.btn-orange`（立即购买）从橙红渐变 → 深炭色 `#1a1a1a`，更沉稳。渐变感是 2018 年的设计语言，扁平单色更现代。

**分类 Tab：文字+底线**
> 填充 pill 在每次切换时会产生大色块跳变，视觉噪点高。改为底部 2px 细线指示器 + 文字加粗，与 tab 切换的语义更匹配，也是欧系电商网站的标准做法。

**卡片：细边框代替阴影**
> `box-shadow: 0 2px 8px rgba(0,0,0,0.07)` → `border: 1px solid #EBEBEB`。暖米白背景上，细边框产生的层次感比阴影更干净。radius 从 14px → 8px，减少圆润感。

**用户头像：石灰色方块**
> 原先的 teal 渐变圆头像是主题色在非交互场景的滥用。改为 `background: #F0EDE8`（暖灰）+ 深灰字母，简洁且不抢注意力。

## Risks / Trade-offs

- [Google Fonts 网络依赖] 若用户网络无法访问 Google Fonts，价格数字降级到系统衬线字体 → 可接受，功能不受影响
- [价格颜色] 墨黑价格对习惯红色电商的用户可能短暂不适应 → 属于预期的视觉语言升级
- [多文件改动] 涉及 5 个文件，需要逐一核查内联色值 → 按文件逐一处理，风险可控

## Migration Plan

1. 修改 `index.html` 引入 Google Fonts
2. 修改 `global.css`（背景、价格CSS类、按钮、卡片、navbar）
3. 修改 `ProductListPage.tsx`（分类tab、搜索框focus）
4. 修改 `ProductDetailPage.tsx`（头像、价格内联色、链接色、textarea）
5. 修改 `CartPage.tsx` 和 `FavoritesPage.tsx`（价格内联色值）
6. 本地目测验证所有页面
7. 无后端变更，可随时 git revert
