## ADDED Requirements

### Requirement: 主题色仅用于交互语义元素
用户端 CSS 中主题色 `#01c2c3` 及其衍生色（渐变、低饱和背景）SHALL 仅出现在以下场景：active 状态指示器（底部导航高亮）、主要按钮（`.btn-primary`、`.btn-outline`）、加载 spinner。其余纯装饰性元素（导航栏背景、页面背景渐变、分节标题装饰条）MUST 使用中性色。

#### Scenario: NavBar 不使用主题色背景
- **WHEN** 用户打开任意页面
- **THEN** 顶部导航栏背景为白色或浅灰，文字/图标为深色（`#333` 或更深），无主题色色块出现在导航栏区域

#### Scenario: 页面背景为中性灰
- **WHEN** 用户打开任意页面
- **THEN** 根节点背景色为纯中性灰，不含青绿色调

#### Scenario: 装饰性左侧条使用中性色
- **WHEN** 页面中出现 `.section-title` 元素
- **THEN** 其左侧装饰条颜色为深灰（`#1a1a1a` 或 `#222`），不显示主题色

#### Scenario: active 状态保留主题色
- **WHEN** 底部导航某 tab 处于选中状态
- **THEN** 该 tab 文字、图标、顶部指示条均显示主题色 `#01c2c3`

#### Scenario: 主要按钮保留主题色
- **WHEN** 页面中存在 `.btn-primary` 或 `.btn-outline` 按钮
- **THEN** 按钮背景/边框/文字正确显示主题色，不受本次改动影响
