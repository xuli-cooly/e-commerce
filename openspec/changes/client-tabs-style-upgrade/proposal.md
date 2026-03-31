## Why

`client-style-simplify` 已完成首页（商品列表）、商品详情、购物车和收藏页的欧式极简升级。剩余三个 Tab 页面——社区（CommunityPage）、购物车补全（CartPage 部分样式）、个人中心（ProfilePage）——仍存在大面积主题色装饰和过度阴影/圆角问题，与已改造页面视觉语言不一致。

## What Changes

**CommunityPage（社区 Tab）**
- 排序 Tab 文字颜色：`#01c2c3` active 色 → `#1a1a1a`，底部指示条同步改为 `#1a1a1a`
- 排序 Tab 背景：`#fff` → `#FAF8F5`，底边框改为 `#EBEBEB`
- 帖子卡片：`border-radius: 16px` + `box-shadow` → `border-radius: 8px` + `border: 1px solid #EBEBEB`
- SkeletonPost 卡片同步调整圆角和阴影
- FAB（发布按钮）：主题色渐变背景+彩色阴影 → 纯黑 `#1a1a1a`，去掉彩色 box-shadow
- 帖子内商品关联标签：`color: '#01c2c3'` → `color: '#888'`

**ProfilePage（我的 Tab）**
- 用户头部横幅：主题色渐变 `linear-gradient(135deg, #01c2c3…)` → 暖米白 `#FAF8F5`，文字颜色从白色改为深色 `#1a1a1a` / `#666`
- 用户头像圆：半透明白色圆 → `background: #EBEBEB`，图标色从白色改为 `#555`
- 菜单卡片：`border-radius: 16px` + `box-shadow` → `border-radius: 8px` + `border: 1px solid #EBEBEB`
- 密码输入框图标：`color: '#01c2c3'` → `color: '#999'`
- 退出登录按钮：去掉 `box-shadow`，保持红色边框（这是语义色，保留）
- 菜单卡片圆角图标背景适度调整（保留彩色语义背景，仅微调）

## Capabilities

### New Capabilities

（无新能力，纯样式收敛）

### Modified Capabilities

- `client-style-token`: 扩展覆盖范围至社区页和个人中心页

## Impact

- `apps/client/src/pages/CommunityPage.tsx`
- `apps/client/src/pages/ProfilePage.tsx`
- 不涉及逻辑、API、后端
