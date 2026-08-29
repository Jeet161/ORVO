const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('orvo_token');
}

type FetchOptions = RequestInit & { skipAuth?: boolean };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorBody.message || `HTTP ${res.status}`);
  }

  // No content
  if (res.status === 204) return undefined as T;

  return res.json() as T;
}

// ─── Auth ──────────────────────────────────────────
export const authApi = {
  register: (email: string, name: string, password: string, otpCode?: string) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password, otpCode }),
      skipAuth: true,
    }),
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }),
  loginGoogle: (idToken: string) =>
    apiFetch<{ accessToken: string; user: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      skipAuth: true,
    }),
  me: () => apiFetch<{ user: User }>('/auth/me'),
};

// ─── Products ──────────────────────────────────────
export const productsApi = {
  getAll: (params?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sellerRegion?: string;
    search?: string;
    sortBy?: string;
  }) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = String(val);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return apiFetch<Product[]>(`/products?${query}`, { skipAuth: true });
  },
  getBySlug: (slug: string) =>
    apiFetch<Product>(`/products/detail/${slug}`, { skipAuth: true }),
  getSellerProducts: () => apiFetch<Product[]>('/products/seller/me'),
  create: (data: any) =>
    apiFetch('/products/seller/me', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiFetch(`/products/seller/me/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiFetch(`/products/seller/me/${id}`, { method: 'DELETE' }),
  getPending: () => apiFetch<Product[]>('/products/admin/pending'),
  review: (id: string, status: string) =>
    apiFetch(`/products/admin/${id}/review`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// ─── Categories ────────────────────────────────────
export const categoriesApi = {
  getAll: () => apiFetch<Category[]>('/categories', { skipAuth: true }),
  create: (data: { name: string; slug: string; parentId?: string }) =>
    apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Cart ──────────────────────────────────────────
export const cartApi = {
  get: () => apiFetch<Cart>('/cart'),
  addItem: (productId: string, quantity: number) =>
    apiFetch('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateItem: (productId: string, quantity: number) =>
    apiFetch(`/cart/items/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeItem: (productId: string) =>
    apiFetch(`/cart/items/${productId}`, { method: 'DELETE' }),
  clear: () => apiFetch('/cart', { method: 'DELETE' }),
};

// ─── Wishlist ──────────────────────────────────────
export const wishlistApi = {
  get: () => apiFetch<WishlistItem[]>('/wishlist'),
  add: (productId: string) =>
    apiFetch(`/wishlist/${productId}`, { method: 'POST' }),
  remove: (productId: string) =>
    apiFetch(`/wishlist/${productId}`, { method: 'DELETE' }),
};

// ─── Orders ────────────────────────────────────────
export const ordersApi = {
  checkout: (data: { addressId: string; paymentMethod: string; idempotencyKey?: string }) =>
    apiFetch('/orders/checkout', { method: 'POST', body: JSON.stringify(data) }),
  buyNow: (data: { productId: string; quantity: number; addressId: string; paymentMethod: string; idempotencyKey?: string }) =>
    apiFetch('/orders/buy-now', { method: 'POST', body: JSON.stringify(data) }),
  getMyOrders: () => apiFetch<Order[]>('/orders/my-orders'),
  getSellerOrders: () => apiFetch<Order[]>('/orders/seller/my-orders'),
  getById: (id: string) => apiFetch<Order>(`/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    apiFetch(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// ─── Payments ──────────────────────────────────────
export const paymentsApi = {
  process: (orderId: string) =>
    apiFetch(`/payments/order/${orderId}/process`, { method: 'POST' }),
};

// ─── Users / Addresses ─────────────────────────────
export const usersApi = {
  getAddresses: () => apiFetch<Address[]>('/users/addresses'),
  addAddress: (data: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    isDefault?: boolean;
  }) => apiFetch<Address>('/users/addresses', { method: 'POST', body: JSON.stringify(data) }),
  updateAddress: (id: string, data: Partial<Address>) =>
    apiFetch<Address>(`/users/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAddress: (id: string) =>
    apiFetch(`/users/addresses/${id}`, { method: 'DELETE' }),
};

// ─── Sellers ───────────────────────────────────────
export const sellersApi = {
  apply: (data: any) =>
    apiFetch('/sellers/apply', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => apiFetch('/sellers/profile/me'),
  getAnalytics: () => apiFetch<SellerAnalytics>('/sellers/analytics/me'),
  getPendingApplications: () => apiFetch<SellerProfile[]>('/sellers/admin/applications'),
  reviewApplication: (id: string, status: string, rejectionReason?: string) =>
    apiFetch(`/sellers/admin/applications/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectionReason }),
    }),
};

// ─── Reviews ───────────────────────────────────────
export const reviewsApi = {
  getByProduct: (productId: string) =>
    apiFetch(`/reviews/product/${productId}`, { skipAuth: true }),
  create: (productId: string, rating: number, comment?: string) =>
    apiFetch(`/reviews/product/${productId}`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
};

// ─── Notifications ─────────────────────────────────
export const notificationsApi = {
  getAll: () => apiFetch<Notification[]>('/notifications'),
  getUnreadCount: () => apiFetch<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiFetch('/notifications/read-all', { method: 'PUT' }),
};

// ─── Admin ─────────────────────────────────────────
export const adminApi = {
  getDashboard: () => apiFetch<AdminDashboard>('/admin/dashboard'),
  getPendingSellers: () => apiFetch<SellerProfile[]>('/admin/pending-sellers'),
  getPendingProducts: () => apiFetch<Product[]>('/admin/pending-products'),
  getAllOrders: () => apiFetch<Order[]>('/admin/orders'),
};

// ─── Types ─────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
}
export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  status: string;
  tags?: string;
  images: { url: string; isPrimary: boolean }[];
  category: { name: string; slug: string };
  seller?: { shopName: string; shopSlug: string; region: string; isVerified: boolean };
  reviews?: Review[];
}
export interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}
export interface Cart {
  id: string;
  items: CartItem[];
}
export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}
export interface WishlistItem {
  id: string;
  product: Product;
}
export interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  shippingAddress: Record<string, string>;
  items: OrderItem[];
  payments?: Payment[];
  createdAt: string;
}
export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: Product;
  seller?: { shopName: string };
}
export interface Payment {
  id: string;
  method: string;
  status: string;
  amount: number;
}
export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}
export interface Review {
  id: string;
  rating: number;
  comment?: string;
  user: { name: string };
  createdAt: string;
}
export interface SellerProfile {
  id: string;
  shopName: string;
  shopSlug: string;
  region: string;
  status: string;
  isVerified: boolean;
  user?: { name: string; email: string };
}
export interface SellerAnalytics {
  totalSales: number;
  totalOrders: number;
  productsSold: number;
  avgOrderValue: number;
  pendingOrders: number;
  totalProducts: number;
}
export interface AdminDashboard {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  pendingSellers: number;
  pendingProducts: number;
  totalRevenue: number;
}
export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
