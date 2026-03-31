## 1. CommunityPage.tsx — 排序 Tab

- [x] 1.1 排序 Tab 容器背景：`background: '#fff'` → `'#FAF8F5'`，`borderBottom: '1px solid #f0f0f0'` → `'1px solid #EBEBEB'`
- [x] 1.2 排序 Tab active 文字颜色：`color: sort === s ? '#01c2c3' : '#bbb'` → `color: sort === s ? '#1a1a1a' : '#bbb'`
- [x] 1.3 排序 Tab active 底部指示条：`background: '#01c2c3'` → `background: '#1a1a1a'`

## 2. CommunityPage.tsx — 帖子卡片与 FAB

- [x] 2.1 `PostCard` 卡片样式：`borderRadius: 16` → `8`，`boxShadow: '0 2px 8px rgba(0,0,0,0.07)'` → `border: '1px solid #EBEBEB'`，去掉 `boxShadow`
- [x] 2.2 `SkeletonPost` 卡片样式：同步改 `borderRadius: 16` → `8`，`boxShadow` → `border: '1px solid #EBEBEB'`
- [x] 2.3 帖子内商品关联标签：`color: '#01c2c3'` → `color: '#888'`
- [x] 2.4 FAB 发布按钮：`background: 'linear-gradient(135deg, #01c2c3, #00a8a9)'` → `background: '#1a1a1a'`，`boxShadow: '0 4px 16px rgba(1,194,195,0.45)'` → `boxShadow: '0 4px 16px rgba(0,0,0,0.2)'`

## 3. ProfilePage.tsx — 用户头部横幅

- [x] 3.1 头部横幅容器：`background: 'linear-gradient(135deg, #01c2c3 0%, #00a8a9 100%)'` → `background: '#FAF8F5'`，添加 `borderBottom: '1px solid #EBEBEB'`
- [x] 3.2 用户名文字颜色：`color: '#fff'` → `color: '#1a1a1a'`
- [x] 3.3 「欢迎回来」副文字颜色：`color: 'rgba(255,255,255,0.8)'` → `color: '#999'`
- [x] 3.4 头像圆圈：`background: 'rgba(255,255,255,0.25)'`，`border: '2px solid rgba(255,255,255,0.4)'` → `background: '#EBEBEB'`，`border: '2px solid #D8D8D8'`
- [x] 3.5 头像图标颜色：`color: '#fff'` → `color: '#666'`

## 4. ProfilePage.tsx — 菜单卡片与其他

- [x] 4.1 菜单卡片容器：`borderRadius: 16` → `8`，`boxShadow: '0 2px 12px rgba(0,0,0,0.06)'` → `border: '1px solid #EBEBEB'`
- [x] 4.2 密码输入框图标：`color: '#01c2c3'` → `color: '#999'`
- [x] 4.3 退出登录按钮：移除 `boxShadow: '0 2px 8px rgba(255,77,79,0.1)'`（保留红色边框，语义色不变）

## 5. 目测验证

- [x] 5.1 社区页：排序 Tab active 为黑色，帖子卡片扁平细边框，FAB 为黑色圆形
- [x] 5.2 个人中心页：头部为暖白深色文字，菜单卡片无阴影，整体简洁
- [x] 5.3 确认 bottom-nav active 和 `.btn-primary` 仍为主题色
