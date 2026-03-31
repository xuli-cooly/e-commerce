## ADDED Requirements

### Requirement: 客户端展示社区信息流
客户端 SHALL 提供社区信息流页面，展示状态为 `active` 的帖子列表，支持无限滚动分页。

#### Scenario: 首次加载信息流
- **WHEN** 用户进入社区 Tab，默认排序 `latest`
- **THEN** 展示最新 20 条帖子，每条帖子显示封面图（首张图）、标题、作者昵称、点赞数、关联商品数

#### Scenario: 切换排序为热门
- **WHEN** 用户点击「热门」Tab
- **THEN** 请求 `GET /api/v1/posts?sort=hot`，重新渲染列表

#### Scenario: 滚动到底部加载更多
- **WHEN** 用户滚动到列表底部，且 `hasMore` 为 true
- **THEN** 自动请求下一页，追加帖子到列表末尾

#### Scenario: 没有更多帖子
- **WHEN** 所有帖子已加载完毕（`total <= products.length`）
- **THEN** 底部显示"已经到底了"文字，不再触发加载

### Requirement: 信息流支持按关联商品筛选
商品详情页 SHALL 展示「相关帖子」入口，点击后进入以该商品 ID 筛选的社区信息流。

#### Scenario: 从商品详情进入相关帖子
- **WHEN** 用户在商品详情页点击「X 篇相关种草」入口
- **THEN** 进入社区页，请求 `GET /api/v1/posts?product_id=<id>`，仅显示关联该商品的帖子

#### Scenario: 该商品无相关帖子
- **WHEN** 请求返回 total=0
- **THEN** 显示空状态"暂无相关种草，快来第一个发布吧"
