## ADDED Requirements

### Requirement: 管理后台独立入口与路由守卫
系统 SHALL 提供独立的管理后台 Web 应用（或独立路由前缀 `/admin`），所有管理页面 SHALL 要求 ADMIN role 的 JWT，未登录或 role 不符时重定向到管理员登录页。

#### Scenario: 未登录访问管理页面
- **WHEN** 用户未登录（无 token）访问管理后台任意页面
- **THEN** 浏览器重定向到管理员登录页 `/admin/login`

#### Scenario: 普通用户 token 访问管理页面
- **WHEN** 携带 USER role token 访问管理后台页面
- **THEN** 浏览器重定向到管理员登录页，并展示"权限不足"提示

#### Scenario: 管理员登录后跳转
- **WHEN** 管理员成功登录
- **THEN** 浏览器跳转到管理后台首页（商品管理页或数据统计页）

---

### Requirement: 管理后台导航结构
系统 SHALL 在管理后台提供侧边栏或顶部导航，包含：商品管理、订单管理、（可选）数据统计。

#### Scenario: 导航渲染
- **WHEN** 管理员登录后访问任意管理页
- **THEN** 页面展示包含"商品管理"和"订单管理"的导航入口，点击可跳转对应页面
