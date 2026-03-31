## ADDED Requirements

### Requirement: 商品列表展示
系统 SHALL 从数据库读取所有 `is_active = true` 的商品，返回至少 5 件商品（初始数据由 seed 脚本写入），每件商品展示名称、主图、价格。支持按关键词搜索（模糊匹配商品名称）。

#### Scenario: 正常获取商品列表
- **WHEN** 用户访问商品列表页（GET /api/v1/products）
- **THEN** 返回 HTTP 200，数组包含至少 5 件商品，每件含 id/name/image_url/price 字段

#### Scenario: 关键词搜索
- **WHEN** 请求携带 `?search=<keyword>` 参数
- **THEN** 返回名称中包含该关键词的商品列表（不区分大小写），不含关键词的商品不出现在结果中

#### Scenario: 无商品时返回空数组
- **WHEN** 数据库中无 is_active 商品
- **THEN** 返回 HTTP 200，data 为空数组

---

### Requirement: 商品详情展示
系统 SHALL 根据商品 ID 返回完整商品信息，包含名称、描述、图片 URL、价格、库存数量。

#### Scenario: 获取存在商品详情
- **WHEN** GET /api/v1/products/:id，该商品存在且 is_active 为 true
- **THEN** 返回 HTTP 200，包含 id/name/description/image_url/price/stock 字段

#### Scenario: 商品不存在
- **WHEN** GET /api/v1/products/:id，该 id 不存在或 is_active 为 false
- **THEN** 返回 HTTP 404，错误信息为"商品不存在"

---

### Requirement: 管理后台商品管理
系统 SHALL 允许管理员查看全部商品（含下架）、新增商品、编辑商品信息。

#### Scenario: 管理员查看全部商品
- **WHEN** 管理员调用 GET /api/v1/admin/products
- **THEN** 返回所有商品（含 is_active=false），包含 id/name/price/stock/is_active 字段

#### Scenario: 管理员新增商品
- **WHEN** 管理员 POST /api/v1/admin/products，body 包含 name/description/image_url/price/stock
- **THEN** 返回 HTTP 201，数据库新增一条商品记录，is_active 默认为 true

#### Scenario: 新增商品缺少必填字段
- **WHEN** body 缺少 name 或 price
- **THEN** 返回 HTTP 400，说明缺少的字段

#### Scenario: 管理员编辑商品
- **WHEN** 管理员 PUT /api/v1/admin/products/:id，body 包含需修改的字段
- **THEN** 返回 HTTP 200，数据库中该商品记录更新，返回最新商品数据
