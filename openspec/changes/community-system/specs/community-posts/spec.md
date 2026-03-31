## ADDED Requirements

### Requirement: 用户可发布图文帖子
已登录用户 SHALL 能够创建包含文字和图片的帖子，并可选择关联 1-9 个商品。

#### Scenario: 成功发布帖子
- **WHEN** 已登录用户提交标题、内容、图片 URL 数组和商品 ID 列表
- **THEN** 系统创建帖子记录，状态为 `active`，返回完整帖子对象

#### Scenario: 发布时标题为空
- **WHEN** 用户提交的标题为空字符串或未提供
- **THEN** 系统返回 400 错误，提示"标题不能为空"

#### Scenario: 未登录用户尝试发布
- **WHEN** 请求未携带有效 JWT Token
- **THEN** 系统返回 401 错误

### Requirement: 用户可查看帖子详情
任何访客（含未登录）SHALL 能够通过帖子 ID 获取帖子完整内容，包括作者信息、关联商品列表和点赞数。

#### Scenario: 查看存在的帖子
- **WHEN** 请求 `GET /api/v1/posts/:id`，帖子状态为 `active`
- **THEN** 返回帖子详情，包含 `author`（id、昵称）、`image_urls`、`products`（id、name、price、image_url）、`like_count`、`is_liked`（已登录时）

#### Scenario: 查看已下架帖子
- **WHEN** 请求的帖子 `status` 为 `removed`
- **THEN** 返回 404 错误

### Requirement: 用户可点赞/取消点赞帖子
已登录用户 SHALL 能够对帖子进行点赞或取消点赞（Toggle 模式）。

#### Scenario: 对未点赞帖子点赞
- **WHEN** 已登录用户 POST `/api/v1/posts/:id/like`，当前未点赞
- **THEN** 创建点赞记录，`posts.like_count` 加 1，返回 `{is_liked: true, like_count: N}`

#### Scenario: 对已点赞帖子取消点赞
- **WHEN** 已登录用户 POST `/api/v1/posts/:id/like`，当前已点赞
- **THEN** 删除点赞记录，`posts.like_count` 减 1，返回 `{is_liked: false, like_count: N}`

### Requirement: 作者可删除自己的帖子
帖子作者 SHALL 能够软删除自己发布的帖子（`status` 改为 `removed`）。

#### Scenario: 作者删除帖子
- **WHEN** 已登录用户 DELETE `/api/v1/posts/:id`，且该用户是帖子作者
- **THEN** 帖子 `status` 更新为 `removed`，返回 200

#### Scenario: 非作者尝试删除
- **WHEN** 已登录用户尝试删除他人帖子
- **THEN** 返回 403 错误
