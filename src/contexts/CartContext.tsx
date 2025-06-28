import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart, CartItem, Product } from '@/types';
import api from '@/lib/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const refreshCart = async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.getCart();
      if (response.data) {
        setCart(response.data.cart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated]);

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!isAuthenticated) {
      toast.error('Войдите в аккаунт для добавления товаров в корзину');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.addToCart(product._id, quantity);
      if (response.data) {
        setCart(response.data.cart);
        toast.success(`${product.name} добавлен в корзину`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка добавления в корзину');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await api.updateCartItem(productId, quantity);
      if (response.data) {
        setCart(response.data.cart);
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка обновления корзины');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await api.removeFromCart(productId);
      if (response.data) {
        setCart(response.data.cart);
        toast.success('Товар удален из корзины');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка удаления из корзины');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await api.clearCart();
      if (response.data) {
        setCart(response.data.cart);
        toast.success('Корзина очищена');
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка очистки корзины');
    } finally {
      setIsLoading(false);
    }
  };

  const getCartTotal = () => {
    return cart?.totalPrice || 0;
  };

  const getCartItemsCount = () => {
    return cart?.totalItems || 0;
  };

  const value = {
    cart,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};