## Why

当前交易系统只有商品浏览和购买功能，用户缺乏社交互动场景，停留时长和回访率偏低。新增社区系统可以让用户发布种草内容、晒单和商品体验，将社交流量引导至商品转化，同时提升用户归属感和平台粘性。

## What Changes

- 客户端 App 品牌升级：改名为「淘好物 APP」，设计新 Logo（渐变购物袋图标）
- 新增社区模块（帖子/内容流）：用户可发布图文帖子，帖子可关联一个或多个商品
- 客户端底部导航新增「社区」Tab，作为独立首页级入口
- 后台管理新增社区管理平台：帖子审核、违规下架、数据统计
- 初始化社区内容：预置若干示例帖子（含图片和商品关联）作为冷启动内容
- 商品详情页新增「相关帖子」入口，展示提及该商品的社区内容

## Capabilities

### New Capabilities

- `community-posts`: 社区帖子的创建、浏览、点赞、评论功能；帖子可关联商品
- `community-feed`: 客户端社区首页信息流，支持推荐和最新两种排序
- `community-admin`: 后台社区内容管理（列表、审核、下架）
- `app-branding`: 客户端品牌标识（App 名称、Logo、主题色调整）

### Modified Capabilities

## Impact

- **后端**：新增 `posts`、`post_products`（关联表）数据库表；新增 `/api/v1/posts` 系列接口；新增 `/api/v1/admin/posts` 管理接口
- **客户端**：新增 `CommunityPage.tsx`、`PostDetailPage.tsx`；`BottomNav` 新增社区 Tab；`ProductDetailPage` 新增相关帖子区块；品牌资源（Logo SVG/PNG）更新
- **管理后台**：新增 `CommunityPage.tsx` 路由及侧边栏入口
- **依赖**：图片上传（帖子配图）复用现有 OSS/本地存储方案
