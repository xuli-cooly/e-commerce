## Context

延续 `client-style-simplify` 变更的欧式极简语言：暖米白背景 `#FAF8F5`、墨黑文字、细边框代替阴影、主题色仅用于 active/主要按钮/spinner。本次针对社区页和个人中心页补全同样的处理。

## Goals / Non-Goals

**Goals:**
- CommunityPage：排序 Tab 改暗色指示，帖子卡片扁平化，FAB 改黑色
- ProfilePage：头部横幅从主题色改为暖白+深色文字，菜单卡片扁平化

**Non-Goals:**
- 不改逻辑、路由、API
- 不改 PostDetailPage / CreatePostPage / OrderListPage（不在 Tab 直接页面）
- 不改 LoginPage

## Decisions

**ProfilePage 头部横幅改暖白而非保留彩色**
> 头部大横幅是页面最大色块，主题色渐变在此处产生最大视觉污染。改为 `#FAF8F5` 暖白配深色文字后，头像用浅灰边框圆，整体更接近 Muji / A.P.C. 的个人页风格。

**FAB 改黑色而非主题色**
> FAB 是功能性操作按钮，使用深炭黑 `#1a1a1a` 与"立即购买"按钮语言统一，彩色 FAB 在简约页面上显得突兀。

**排序 Tab 指示条改黑色**
> 与 ProductListPage 分类 Tab 的改动保持一致，全局统一"active = 底部黑色细线"的交互语言。

## Risks / Trade-offs

- [ProfilePage 头部] 从彩色横幅改白色，页面顶部视觉重量降低，可能看起来"平"——通过保留头像的圆形结构和适当间距弥补
- 改动仅两个文件，风险极低，可随时回滚
