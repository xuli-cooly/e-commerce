// API 公共响应结构
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
}

// 用户
export interface User {
  id: number
  phone: string
  role: 'USER' | 'ADMIN'
}

// 商品
export interface Product {
  id: number
  name: string
  description: string
  image_url: string
  price: number
  stock: number
  is_active: boolean
}

// 订单
export interface OrderItem {
  id: number
  product_id: number
  quantity: number
  unit_price: number
}

export interface Order {
  id: number
  user_id: number
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'REFUNDED'
  total_amount: number
  items: OrderItem[]
  created_at: string
}

// 购物车
export interface CartItem {
  id: number
  product: Product
  quantity: number
  subtotal: number
}

export interface Cart {
  items: CartItem[]
  total: number
}

// 统计
export interface DashboardStats {
  total_revenue: number
  total_orders: number
  paid_orders: number
  total_products: number
}
