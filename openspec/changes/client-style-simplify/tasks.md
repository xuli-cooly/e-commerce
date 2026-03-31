## 1. 字体引入（index.html）

- [ ] 1.1 在 `apps/client/index.html` 的 `<head>` 中添加 Google Fonts 预连接和 Cormorant Garamond 字体链接（weights: 300, 400, 600）
- [ ] 1.2 将 `<meta name="theme-color" content="#01c2c3">` 改为 `#1a1a1a`

## 2. global.css — 背景与整体色调

- [ ] 2.1 将 `#root` 背景从 `linear-gradient(160deg, #e0f7f7 0%, #e8e8e8 40%)` 改为纯色 `#FAF8F5`
- [ ] 2.2 将 `html, body` 背景从 `#e8e8e8` 改为 `#FAF8F5`
- [ ] 2.3 将 `.app-shell` 背景从 `#f5f5f5` 改为 `#FAF8F5`
- [ ] 2.4 将 `.search-bar` 背景从 `#f5f5f5` 改为 `#FAF8F5`

## 3. global.css — NavBar 简洁化

- [ ] 3.1 `.navbar` 背景从 `rgba(1,194,195,0.96)` 改为 `rgba(255,255,255,0.97)`
- [ ] 3.2 `.navbar` 文字颜色从 `color: #fff` 改为 `color: #1a1a1a`
- [ ] 3.3 `.navbar` box-shadow 从主题色阴影改为 `0 1px 0 rgba(0,0,0,0.08)`
- [ ] 3.4 `.navbar` 添加 `border-bottom: 1px solid rgba(0,0,0,0.07)`（去掉 box-shadow 改用细线）
- [ ] 3.5 `.navbar-back` 背景从 `rgba(255,255,255,0.2)` 改为 `rgba(0,0,0,0.05)`，active 状态从 `rgba(255,255,255,0.35)` 改为 `rgba(0,0,0,0.09)`
- [ ] 3.6 `.navbar-title` 添加 `letter-spacing: 0.5px`

## 4. global.css — 价格与按钮

- [ ] 4.1 `.product-card-price` 颜色从 `#ff4d4f` 改为 `#1a1a1a`，添加 `font-family: 'Cormorant Garamond', serif`，font-weight 改为 `500`
- [ ] 4.2 `.cart-item-subtotal` 颜色从 `#ff4d4f` 改为 `#1a1a1a`，添加 `font-family: 'Cormorant Garamond', serif`
- [ ] 4.3 `.btn-primary` 背景从渐变 `linear-gradient(90deg, #01c2c3, #00a8a9)` 改为纯色 `#01c2c3`，去掉 box-shadow（或减弱为 `0 2px 8px rgba(1,194,195,0.2)`）
- [ ] 4.4 `.btn-primary:active` 的 box-shadow 也相应简化
- [ ] 4.5 `.btn-orange` 背景从橙红渐变改为 `#1a1a1a`（深炭黑），去掉 box-shadow
- [ ] 4.6 `.promo-tag` 从红色渐变改为 `background: #1a1a1a; color: #fff`（黑底白字，克制感）

## 5. global.css — 卡片与阴影扁平化

- [ ] 5.1 `.product-card` border-radius 从 `14px` 改为 `8px`，box-shadow 改为 `border: 1px solid #EBEBEB`（去掉阴影）
- [ ] 5.2 `.cart-item` border-radius 从 `14px` 改为 `8px`，box-shadow 改为 `border: 1px solid #EBEBEB`
- [ ] 5.3 `.card` 通用卡片 box-shadow 从 `0 2px 12px rgba(0,0,0,0.06)` 改为 `border: 1px solid #EBEBEB`，radius 改为 `8px`
- [ ] 5.4 `.order-card` box-shadow 改为 `border: 1px solid #EBEBEB`，radius 改为 `8px`
- [ ] 5.5 `.section-title::before` 颜色从 `#01c2c3` 改为 `#1a1a1a`
- [ ] 5.6 `.section-title` 添加 `letter-spacing: 0.3px`

## 6. ProductListPage.tsx — 分类 Tab 和搜索框

- [ ] 6.1 分类 tab active 样式：移除 `background: '#01c2c3'`，改为 `background: 'transparent'`；移除 `boxShadow`；添加 `borderBottom: active ? '2px solid #1a1a1a' : '2px solid transparent'`；padding 改为 `'6px 12px'`；`borderRadius` 改为 `0`
- [ ] 6.2 分类 tab 非 active 样式：`background: 'transparent'`，`color: active ? '#1a1a1a' : '#999'`
- [ ] 6.3 分类 tab 容器背景：`background: '#fff'` 改为 `background: '#FAF8F5'`，`borderBottom` 改为 `1px solid #EBEBEB`
- [ ] 6.4 搜索框 focused 状态的 box-shadow：将 `rgba(1,194,195,0.2)` 光晕改为 `rgba(0,0,0,0.1)`

## 7. ProductDetailPage.tsx — 价格、头像、链接

- [ ] 7.1 商品详情价格颜色：`color: '#ff4d4f'`（两处：¥符号和价格数字）改为 `color: '#1a1a1a'`，价格数字添加 `fontFamily: "'Cormorant Garamond', serif"`, `fontWeight: 400`
- [ ] 7.2 相关商品卡片价格：`color: '#ff4d4f'` 改为 `color: '#1a1a1a'`
- [ ] 7.3 用户评价头像：`background: 'linear-gradient(135deg, #01c2c3, #00a8a9)'` 改为 `background: '#F0EDE8'`，`color: '#fff'` 改为 `color: '#777'`
- [ ] 7.4 "相关种草"全部链接：`color: '#01c2c3'` 改为 `color: '#888'`
- [ ] 7.5 "查看全部评价"链接：`color: '#01c2c3'` 改为 `color: '#888'`
- [ ] 7.6 评价 textarea focus 状态：`e.target.style.borderColor = '#01c2c3'` 改为 `'#aaa'`

## 8. CartPage.tsx — 合计价格

- [ ] 8.1 购物车合计金额两处 `color: '#ff4d4f'` 改为 `color: '#1a1a1a'`，添加 `fontFamily: "'Cormorant Garamond', serif"`

## 9. FavoritesPage.tsx — 价格与卡片

- [ ] 9.1 收藏列表商品价格：`color: '#ff4d4f'` 改为 `color: '#1a1a1a'`，添加 `fontFamily: "'Cormorant Garamond', serif"`
- [ ] 9.2 收藏卡片：`borderRadius: 14` 改为 `8`，`boxShadow: '0 1px 6px rgba(0,0,0,0.05)'` 改为 `border: '1px solid #EBEBEB'`
- [ ] 9.3 收藏卡片图片：`borderRadius: 10` 改为 `6`
- [ ] 9.4 收藏页面外层 div 背景：`background: '#f5f5f5'` 改为 `background: '#FAF8F5'`

## 10. 目测验证

- [ ] 10.1 启动客户端开发服务器，检查首页：价格为墨黑 Cormorant 字体、分类 Tab 为文字+下划线、背景为暖米白
- [ ] 10.2 检查商品详情页：价格墨黑大号衬线字体、头像为灰白方块、"全部>" 为灰色文字链接
- [ ] 10.3 检查购物车：合计金额为墨黑 Cormorant 字体
- [ ] 10.4 检查收藏页：价格墨黑、卡片扁平边框
- [ ] 10.5 验证 bottom-nav active、`.btn-primary`、`.btn-outline`、spinner 仍为主题色 `#01c2c3`
- [ ] 10.6 验证 `.btn-orange`（立即购买）为深炭黑，不再是橙红渐变
