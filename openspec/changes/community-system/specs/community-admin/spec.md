## ADDED Requirements

### Requirement: 管理员可查看全部帖子列表
后台管理员 SHALL 能够分页查看所有帖子（含已下架），支持按状态筛选。

#### Scenario: 查看全部帖子
- **WHEN** 管理员访问 `GET /api/v1/admin/posts`
- **THEN** 返回分页帖子列表，包含 id、标题、作者、状态、like_count、created_at

#### Scenario: 按状态筛选
- **WHEN** 请求携带 `status=removed` 参数
- **THEN** 只返回已下架帖子

### Requirement: 管理员可下架帖子
管理员 SHALL 能够将任意帖子的状态修改为 `removed`。

#### Scenario: 下架正常帖子
- **WHEN** 管理员 PATCH `/api/v1/admin/posts/:id`，body `{status: "removed"}`
- **THEN** 帖子状态更新为 `removed`，返回 200；该帖子对普通用户不可见

#### Scenario: 恢复已下架帖子
- **WHEN** 管理员 PATCH `/api/v1/admin/posts/:id`，body `{status: "active"}`
- **THEN** 帖子状态更新为 `active`，返回 200

### Requirement: 管理员可强制删除帖子
管理员 SHALL 能够硬删除帖子（物理删除，不可恢复）。

#### Scenario: 强制删除帖子
- **WHEN** 管理员 DELETE `/api/v1/admin/posts/:id`
- **THEN** 帖子及其关联数据（post_products、post_likes）被物理删除，返回 200
