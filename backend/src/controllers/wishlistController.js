import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// Get user wishlist
export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name price images availability farmer rating',
        populate: {
          path: 'farmer',
          select: 'farmName'
        }
      });

    if (!wishlist) {
      wishlist = await Wishlist.create({ 
        user: req.user.id, 
        items: [] 
      });
    }

    res.status(200).json({
      status: 'success',
      data: { wishlist }
    });

  } catch (error) {
    console.error('Ошибка получения списка желаний:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Add item to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId, notes, priority = 'medium' } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Продукт не найден'
      });
    }

    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, items: [] });
    }

    // Check if item already exists
    const existingItemIndex = wishlist.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update existing item
      wishlist.items[existingItemIndex].notes = notes || wishlist.items[existingItemIndex].notes;
      wishlist.items[existingItemIndex].priority = priority;
    } else {
      // Add new item
      wishlist.items.push({
        product: productId,
        notes,
        priority
      });
    }

    await wishlist.save();

    // Populate for response
    await wishlist.populate({
      path: 'items.product',
      select: 'name price images availability farmer rating',
      populate: {
        path: 'farmer',
        select: 'farmName'
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Товар добавлен в список желаний',
      data: { wishlist }
    });

  } catch (error) {
    console.error('Ошибка добавления в список желаний:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({
        status: 'error',
        message: 'Список желаний не найден'
      });
    }

    wishlist.items = wishlist.items.filter(
      item => item.product.toString() !== productId
    );

    await wishlist.save();

    await wishlist.populate({
      path: 'items.product',
      select: 'name price images availability farmer rating',
      populate: {
        path: 'farmer',
        select: 'farmName'
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Товар удален из списка желаний',
      data: { wishlist }
    });

  } catch (error) {
    console.error('Ошибка удаления из списка желаний:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update wishlist item
export const updateWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { notes, priority } = req.body;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({
        status: 'error',
        message: 'Список желаний не найден'
      });
    }

    const itemIndex = wishlist.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Товар не найден в списке желаний'
      });
    }

    if (notes !== undefined) wishlist.items[itemIndex].notes = notes;
    if (priority !== undefined) wishlist.items[itemIndex].priority = priority;

    await wishlist.save();

    await wishlist.populate({
      path: 'items.product',
      select: 'name price images availability farmer rating',
      populate: {
        path: 'farmer',
        select: 'farmName'
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Элемент списка желаний обновлен',
      data: { wishlist }
    });

  } catch (error) {
    console.error('Ошибка обновления списка желаний:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Clear wishlist
export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({
        status: 'error',
        message: 'Список желаний не найден'
      });
    }

    wishlist.items = [];
    await wishlist.save();

    res.status(200).json({
      status: 'success',
      message: 'Список желаний очищен',
      data: { wishlist }
    });

  } catch (error) {
    console.error('Ошибка очистки списка желаний:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update wishlist settings
export const updateWishlistSettings = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({
        status: 'error',
        message: 'Список желаний не найден'
      });
    }

    if (name !== undefined) wishlist.name = name;
    if (description !== undefined) wishlist.description = description;
    if (isPublic !== undefined) wishlist.isPublic = isPublic;

    await wishlist.save();

    res.status(200).json({
      status: 'success',
      message: 'Настройки списка желаний обновлены',
      data: { wishlist }
    });

  } catch (error) {
    console.error('Ошибка обновления настроек списка желаний:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get public wishlist
export const getPublicWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlist = await Wishlist.findOne({ 
      user: userId, 
      isPublic: true 
    })
      .populate({
        path: 'items.product',
        select: 'name price images availability farmer rating',
        populate: {
          path: 'farmer',
          select: 'farmName'
        }
      })
      .populate('user', 'firstName lastName');

    if (!wishlist) {
      return res.status(404).json({
        status: 'error',
        message: 'Публичный список желаний не найден'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { wishlist }
    });

  } catch (error) {
    console.error('Ошибка получения публичного списка желаний:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};