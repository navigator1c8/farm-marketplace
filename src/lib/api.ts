import { ApiResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Произошла ошибка');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request<{ user: any; farmer?: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: any; farmer?: any }>('/auth/me');
  }

  // Products methods
  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    farmer?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    isOrganic?: boolean;
    inStock?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/products?${searchParams}`);
  }

  async getProduct(id: string) {
    return this.request<{ product: any }>(`/products/${id}`);
  }

  async getFeaturedProducts() {
    return this.request<{ products: any[] }>('/products/featured');
  }

  async getSeasonalProducts() {
    return this.request<{ products: any[] }>('/products/seasonal');
  }

  // Categories methods
  async getCategories() {
    return this.request<{ categories: any[] }>('/categories');
  }

  async getCategoryTree() {
    return this.request<{ tree: any[] }>('/categories/tree');
  }

  async getCategory(identifier: string) {
    return this.request<{ category: any }>(`/categories/${identifier}`);
  }

  // Farmers methods
  async getFarmers(params?: {
    page?: number;
    limit?: number;
    specialty?: string;
    isOrganic?: boolean;
    isVerified?: boolean;
    region?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/farmers?${searchParams}`);
  }

  async getFarmer(id: string) {
    return this.request<{ farmer: any }>(`/farmers/${id}`);
  }

  async getFeaturedFarmers() {
    return this.request<{ farmers: any[] }>('/farmers/featured');
  }

  // Cart methods
  async getCart() {
    return this.request<{ cart: any }>('/cart');
  }

  async addToCart(productId: string, quantity: number = 1) {
    return this.request<{ cart: any }>('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(productId: string, quantity: number) {
    return this.request<{ cart: any }>(`/cart/item/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(productId: string) {
    return this.request<{ cart: any }>(`/cart/item/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request<{ cart: any }>('/cart/clear', {
      method: 'DELETE',
    });
  }

  async getCartSummary() {
    return this.request<{ summary: any }>('/cart/summary');
  }

  // Orders methods
  async createOrder(orderData: {
    items: Array<{ product: string; quantity: number }>;
    delivery: any;
    payment: any;
    notes?: string;
  }) {
    return this.request<{ order: any }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getUserOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/orders/my-orders?${searchParams}`);
  }

  async getOrder(id: string) {
    return this.request<{ order: any }>(`/orders/${id}`);
  }

  // Reviews methods
  async getProductReviews(productId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<any>>(`/reviews/product/${productId}?${searchParams}`);
  }

  async createReview(reviewData: {
    productId: string;
    orderId: string;
    rating: number;
    title?: string;
    comment?: string;
  }) {
    return this.request<{ review: any }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Promo codes methods
  async validatePromoCode(code: string, orderData: {
    orderAmount: number;
    items: any[];
  }) {
    return this.request<any>(`/promo-codes/validate/${code}`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Pickup points methods
  async getPickupPoints(params?: {
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<{ pickupPoints: any[] }>(`/pickup-points?${searchParams}`);
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;