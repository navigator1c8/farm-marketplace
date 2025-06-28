import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Get user cart
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name price images availability farmer',
        populate: {
          path: 'farmer',
          select: 'farmName'
        }
      });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.status(200).json({
      status: 'success',
      data: { cart }
    });

  } catch (error) {
    console.error('Ошибка получения корзины:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product || !product.availability.inStock) {
      return res.status(400).json({
        status: 'error',
        message: 'Продукт недоступен'
      });
    }

    if (quantity > product.availability.quantity) {
      return res.status(400).json({
        status: 'error',
        message: 'Недостаточно товара на складе'
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.availability.quantity) {
        return res.status(400).json({
          status: 'error',
          message: 'Недостаточно товара на складе'
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.currentPrice;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.currentPrice
      });
    }

    await cart.save();

    // Populate cart for response
    await cart.populate({
      path: 'items.product',
      select: 'name price images availability farmer',
      populate: {
        path: 'farmer',
        select: 'farmName'
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Товар добавлен в корзину',
      data: { cart }
    });

  } catch (error) {
    console.error('Ошибка добавления в корзину:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update cart item
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Количество должно быть больше 0'
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Корзина не найдена'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Товар не найден в корзине'
      });
    }

    // Validate product availability
    const product = await Product.findById(productId);
    if (!product || quantity > product.availability.quantity) {
      return res.status(400).json({
        status: 'error',
        message: 'Недостаточно товара на складе'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.currentPrice;

    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name price images availability farmer',
      populate: {
        path: 'farmer',
        select: 'farmName'
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Корзина обновлена',
      data: { cart }
    });

  } catch (error) {
    console.error('Ошибка обновления корзины:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Корзина не найдена'
      });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name price images availability farmer',
      populate: {
        path: 'farmer',
        select: 'farmName'
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Товар удален из корзины',
      data: { cart }
    });

  } catch (error) {
    console.error('Ошибка удаления из корзины:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({
        status: 'error',
        message: 'Корзина не найдена'
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Корзина очищена',
      data: { cart }
    });

  } catch (error) {
    console.error('Ошибка очистки корзины:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get cart summary
export const getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    
    const summary = {
      itemsCount: cart ? cart.totalItems : 0,
      totalPrice: cart ? cart.totalPrice : 0,
      isEmpty: !cart || cart.items.length === 0
    };

    res.status(200).json({
      status: 'success',
      data: { summary }
    });

  } catch (error) {
    console.error('Ошибка получения сводки корзины:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};