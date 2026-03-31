## MODIFIED Requirements

### Requirement: 主题色仅用于交互语义元素
用户端 CSS 中主题色 `#01c2c3` 及其衍生色 SHALL 仅出现在：active 状态指示器（底部导航高亮）、主要按钮（`.btn-primary`、`.btn-outline`）、加载 spinner。其余装饰性元素 MUST 使用中性色。本次扩展覆盖社区页和个人中心页。

#### Scenario: 社区排序 Tab active 状态不使用主题色
- **WHEN** 用户在社区页切换「最新」或「热门」Tab
- **THEN** active Tab 文字为深色 `#1a1a1a`，底部指示条为深色，不显示主题色

#### Scenario: 社区 FAB 不使用主题色
- **WHEN** 已登录用户浏览社区页
- **THEN** 右下角发布按钮为深炭黑背景，无主题色渐变或彩色阴影

#### Scenario: 个人中心头部不使用主题色横幅
- **WHEN** 用户访问个人中心页
- **THEN** 顶部用户信息区背景为暖米白，文字为深色，无主题色色块

#### Scenario: 帖子卡片扁平化
- **WHEN** 社区页显示帖子卡片列表
- **THEN** 卡片无 box-shadow，使用细边框 `1px solid #EBEBEB`，圆角 ≤ 8px
