## ADDED Requirements

### Requirement: 管理后台数据统计面板
系统 SHALL 提供统计接口，返回平台核心运营数据：总销售额（PAID + SHIPPED 订单的 total_amount 之和）、总订单数、已支付订单数、商品总数。

#### Scenario: 获取统计数据
- **WHEN** 管理员 GET /api/v1/admin/stats
- **THEN** 返回 HTTP 200，响应体包含 total_revenue(number)/total_orders(number)/paid_orders(number)/total_products(number)

#### Scenario: 无订单时统计
- **WHEN** 数据库无任何订单
- **THEN** 返回 HTTP 200，total_revenue 为 0，total_orders 为 0

---

### Requirement: 管理后台统计面板 UI
系统 SHALL 在管理后台首页或独立统计页中，以卡片形式展示上述 4 项统计数字。

#### Scenario: 统计卡片展示
- **WHEN** 管理员访问统计面板页
- **THEN** 页面展示 4 张统计卡片，分别显示总销售额（格式化为货币）、总订单数、已支付订单数、商品总数，数据从后端实时获取
