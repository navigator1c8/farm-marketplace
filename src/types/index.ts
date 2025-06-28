export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'customer' | 'farmer' | 'admin';
  avatar?: string;
  address?: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Farmer {
  _id: string;
  user: User;
  farmName: string;
  description: string;
  specialties: string[];
  certifications: Array<{
    name: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate: string;
    certificateNumber: string;
    document?: string;
  }>;
  isOrganic: boolean;
  isVerified: boolean;
  farmLocation: {
    address: string;
    city: string;
    region: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  deliveryRadius: number;
  rating: {
    average: number;
    count: number;
  };
  totalSales: number;
  socialMedia?: {
    website?: string;
    instagram?: string;
    facebook?: string;
    telegram?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: {
    url: string;
    alt: string;
  };
  icon?: string;
  parent?: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  subcategories?: Category[];
  productsCount?: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  farmer: Farmer;
  category: Category;
  subcategory?: string;
  price: {
    amount: number;
    unit: string;
  };
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  availability: {
    inStock: boolean;
    quantity: number;
    minOrderQuantity: number;
    maxOrderQuantity?: number;
  };
  seasonality: {
    isSeasonalProduct: boolean;
    availableMonths: number[];
    harvestDate?: string;
    expiryDate?: string;
  };
  characteristics: {
    isOrganic: boolean;
    isLocal: boolean;
    isGMOFree: boolean;
    shelfLife?: string;
    storageConditions?: string;
  };
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    vitamins: string[];
    minerals: string[];
  };
  rating: {
    average: number;
    count: number;
  };
  totalSold: number;
  tags: string[];
  isActive: boolean;
  isPreorder: boolean;
  preorderDate?: string;
  discounts: Array<{
    type: 'percentage' | 'fixed';
    value: number;
    startDate: string;
    endDate: string;
    minQuantity?: number;
    isActive: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  addedAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  lastUpdated: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: User;
  items: Array<{
    product: Product;
    farmer: Farmer;
    quantity: number;
    price: number;
    unit: string;
  }>;
  pricing: {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
  };
  delivery: {
    type: 'delivery' | 'pickup';
    address?: {
      street: string;
      city: string;
      region: string;
      postalCode: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      instructions?: string;
    };
    pickupLocation?: string;
    scheduledDate: string;
    timeSlot?: {
      start: string;
      end: string;
    };
    actualDeliveryDate?: string;
  };
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled';
  payment: {
    method: 'cash' | 'card' | 'online';
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    transactionId?: string;
    paidAt?: string;
  };
  notes?: {
    customer?: string;
    farmer?: string;
    admin?: string;
  };
  tracking: Array<{
    status: string;
    timestamp: string;
    note?: string;
    updatedBy: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  customer: User;
  product: Product;
  farmer: Farmer;
  order: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: Array<{
    url: string;
    alt: string;
  }>;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  response?: {
    text: string;
    respondedAt: string;
    respondedBy: string;
  };
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCode {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit: {
    total?: number;
    perUser: number;
  };
  usageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export interface PickupPoint {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  workingHours: {
    [key: string]: { start: string; end: string };
  };
  contact: {
    phone?: string;
    email?: string;
  };
  capacity: number;
  isActive: boolean;
  description?: string;
  facilities: string[];
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: {
    items?: T[];
    pagination: PaginationInfo;
  } & T;
}