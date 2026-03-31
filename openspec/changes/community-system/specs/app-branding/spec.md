## ADDED Requirements

### Requirement: 客户端 App 品牌标识更新
客户端应用 SHALL 展示更新后的品牌标识：名称「淘好物 APP」及对应 Logo。

#### Scenario: 页面标题显示品牌名
- **WHEN** 用户访问客户端任意页面
- **THEN** 浏览器标签页标题显示「淘好物」

#### Scenario: 登录页展示新 Logo
- **WHEN** 用户访问登录页
- **THEN** 页面顶部展示淘好物 Logo（渐变购物袋图标）和品牌名「淘好物」

#### Scenario: 导航栏品牌色保持一致
- **WHEN** 用户浏览任意页面
- **THEN** 导航栏、按钮、高亮元素使用品牌主色 `#01c2c3`（已有，无需变更）
