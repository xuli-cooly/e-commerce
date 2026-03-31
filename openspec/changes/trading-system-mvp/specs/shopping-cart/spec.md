## ADDED Requirements

### Requirement: 购物车增删查
系统 SHALL 为每个已登录用户维护一个持久化购物车，支持添加商品、删除商品、查看购物车内容（商品名/图片/单价/数量/小计）。

#### Scenario: 添加商品到购物车
- **WHEN** 已登录用户 POST /api/v1/cart/items，body 包含 product_id 和 quantity（≥1）
- **THEN** 返回 HTTP 200，若商品已在车中则累加数量，否则新增一条 cart_item

#### Scenario: 商品不存在或已下架时加购
- **WHEN** product_id 对应商品不存在或 is_active=false
- **THEN** 返回 HTTP 400，错误信息为"商品不存在或已下架"

#### Scenario: 查看购物车
- **WHEN** 已登录用户 GET /api/v1/cart
- **THEN** 返回 HTTP 200，包含 cart_items 数组，每项含 id/product(id/name/image_url/price)/quantity/subtotal

#### Scenario: 删除购物车商品
- **WHEN** 已登录用户 DELETE /api/v1/cart/items/:cartItemId
- **THEN** 返回 HTTP 200，对应 cart_item 从数据库删除；若该 cartItemId 不属于当前用户返回 HTTP 403

---

### Requirement: 从购物车结算下单
系统 SHALL 允许用户将购物车全部商品一键转为订单，下单成功后购物车 SHALL 清空。

#### Scenario: 购物车结算
- **WHEN** 已登录用户 POST /api/v1/orders，body 包含 `from_cart: true`（或不传 items 而依赖购物车）
- **THEN** 系统读取购物车所有 cart_items 创建订单，下单成功后清空该用户购物车，返回新订单信息

#### Scenario: 购物车为空时结算
- **WHEN** 购物车无商品时尝试结算
- **THEN** 返回 HTTP 400，错误信息为"购物车为空"
