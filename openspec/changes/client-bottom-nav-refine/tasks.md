## 1. global.css — bottom-nav 样式更新

- [x] 1.1 active 颜色：`.bottom-nav-item.active` 的 `color` 从 `#01c2c3` 改为 `#1a1a1a`
- [x] 1.2 active 指示点改为 pill 背景：`.bottom-nav-item.active::before` 改为 `width: 40px; height: 28px; border-radius: 12px; background: #EBEBEB; top: 6px; left: 50%; transform: translateX(-50%); z-index: 0`（不再是顶部细条）
- [x] 1.3 移除 active icon 放大：删除 `.bottom-nav-item.active .nav-icon` 的 `transform: scale(1.15)`
- [x] 1.4 icon z-index：`.bottom-nav-item .nav-icon` 添加 `position: relative; z-index: 1`，使图标层叠在 pill 背景之上

## 2. 目测验证

- [ ] 2.1 四个 Tab 切换时 active 颜色为黑色，inactive 为灰色，无顶部小点
- [ ] 2.2 active Tab 图标下方有淡灰 pill 背景，图标正常大小
- [ ] 2.3 购物车 Badge 数字正常显示（颜色不受影响）
