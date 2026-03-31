## Why

当前用户端视觉风格存在两个层次的问题：第一，主题色 `#01c2c3` 大面积装饰性出现（NavBar背景、页面背景渐变、装饰条），导致品牌色泛滥；第二，整体调性偏向"国产电商促销风"——鲜红价格、橙红渐变按钮、圆润色块分类标签、多层阴影——使应用缺乏高级感。需要通过色彩收敛、字体引入和关键组件样式调整，将整体视觉语言升级为欧式极简风格。

## What Changes

**主题色收敛**
- **NavBar**：全主题色背景 → 白底深色文字，去主题色阴影
- **根节点背景**：青绿渐变 → 暖米白（`#FAF8F5`）
- **装饰条**：`section-title::before` 从主题色改为深灰

**欧式极简升级（Level 2）**
- **背景色调**：冷灰 `#f5f5f5` → 暖米白 `#FAF8F5`，营造材质感
- **价格颜色**：鲜红 `#ff4d4f` → 墨黑 `#1a1a1a`（全局CSS类 + 各页内联样式）
- **按钮**：去掉 `.btn-primary` / `.btn-orange` 的渐变，改为纯色扁平
- **卡片圆角**：14px → 8px，更建筑感
- **阴影**：大幅减少 `box-shadow`，改用极细边框 `1px solid #EBEBEB`
- **字体**：引入 `Cormorant Garamond`（Google Fonts），用于价格数字和评分数字，中文保持 PingFang SC
- **分类 Tab**：填充色块 pill → 文字 + 底部细线指示器（ProductListPage.tsx）
- **用户头像**：teal 渐变圆 → 石灰色方块背景（ProductDetailPage.tsx）
- **交互 focus 状态**：搜索框、textarea 的 focus ring 从主题色光晕改为中性灰
- **次要链接**：`color: #01c2c3` 的文字链接（"全部>"等）改为 `#888`

**保留不变**
- bottom-nav active 指示器和图标颜色（主题色）
- `.btn-primary` / `.btn-outline` 按钮色（主题色，仅去渐变）
- `.spinner` 加载器（主题色）

## Capabilities

### New Capabilities

- `client-style-token`: 定义视觉语言规则：主题色仅限 active/主要按钮/加载器；价格用墨黑；背景用暖米白；引入 Cormorant Garamond 用于数字排版

### Modified Capabilities

（无需修改已有 spec，样式优化属于实现层变更）

## Impact

- `apps/client/src/styles/global.css`（主要改动）
- `apps/client/src/pages/ProductListPage.tsx`（分类tab、搜索框）
- `apps/client/src/pages/ProductDetailPage.tsx`（头像、价格、链接、textarea focus）
- `apps/client/src/pages/CartPage.tsx`（价格内联色值）
- `apps/client/src/pages/FavoritesPage.tsx`（价格内联色值）
- 不涉及任何 API、后端服务或路由逻辑
