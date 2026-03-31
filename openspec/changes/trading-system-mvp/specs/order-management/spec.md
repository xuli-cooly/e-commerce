## ADDED Requirements

### Requirement: 用户下单（Mock 支付）
系统 SHALL 允许已登录用户提交订单，订单创建后状态为 `PENDING`。用户点击"立即支付"后，系统 SHALL 将订单状态更新为 `PAID`，并在前端显示"支付成功"。订单数据 SHALL 持久化到数据库。

#### Scenario: 成功创建订单
- **WHEN** 已登录用户 POST /api/v1/orders，body 包含 items（product_id + quantity 数组）
- **THEN** 返回 HTTP 201，订单状态为 PENDING，total_amount 为各商品 unit_price × quantity 之和，order_items 正确写入数据库

#### Scenario: 商品库存不足
- **WHEN** 订单中某商品请求数量超过库存
- **THEN** 返回 HTTP 400，错误信息说明哪件商品库存不足

#### Scenario: 包含不存在商品
- **WHEN** 订单中包含不存在的 product_id
- **THEN** 返回 HTTP 400，错误信息为"商品不存在"

#### Scenario: Mock 支付成功
- **WHEN** 用户 POST /api/v1/orders/:id/pay，且该订单属于当前用户且状态为 PENDING
- **THEN** 返回 HTTP 200，订单状态更新为 PAID，前端展示"支付成功"提示

#### Scenario: 支付他人订单
- **WHEN** 用户尝试支付不属于自己的订单
- **THEN** 返回 HTTP 403

---

### Requirement: 用户查看订单列表
系统 SHALL 返回当前登录用户的所有历史订单，按创建时间倒序，包含订单号、总金额、状态、创建时间。

#### Scenario: 获取订单列表
- **WHEN** 已登录用户 GET /api/v1/orders
- **THEN** 返回 HTTP 200，仅包含当前用户的订单，每条含 id/total_amount/status/created_at

#### Scenario: 无历史订单
- **WHEN** 当前用户从未下单
- **THEN** 返回 HTTP 200，data 为空数组

---

### Requirement: 管理后台订单管理
系统 SHALL 允许管理员查看全平台所有订单，并可修改订单状态（PENDING → PAID → SHIPPED；支持标记为 REFUNDED）。

#### Scenario: 管理员查看所有订单
- **WHEN** 管理员 GET /api/v1/admin/orders
- **THEN** 返回 HTTP 200，包含全平台订单，每条含 id/user_phone/total_amount/status/created_at

#### Scenario: 管理员修改订单状态
- **WHEN** 管理员 PUT /api/v1/admin/orders/:id/status，body 包含合法的 status 值
- **THEN** 返回 HTTP 200，数据库中该订单状态更新为新值

#### Scenario: 状态值非法
- **WHEN** body 中 status 不在 [PENDING, PAID, SHIPPED, REFUNDED] 范围内
- **THEN** 返回 HTTP 400，错误信息说明合法值范围
