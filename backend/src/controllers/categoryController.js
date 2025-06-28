import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { validationResult } from 'express-validator';

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const { parent, level, includeInactive } = req.query;

    const filter = {};
    if (parent !== undefined) {
      filter.parent = parent === 'null' ? null : parent;
    }
    if (level !== undefined) {
      filter.level = parseInt(level);
    }
    if (!includeInactive) {
      filter.isActive = true;
    }

    const categories = await Category.find(filter)
      .populate('subcategories')
      .populate('productsCount')
      .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      status: 'success',
      data: { categories }
    });

  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get category by ID or slug
export const getCategory = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to find by ID first, then by slug
    let category = await Category.findById(identifier)
      .populate('subcategories')
      .populate('productsCount');

    if (!category) {
      category = await Category.findOne({ slug: identifier })
        .populate('subcategories')
        .populate('productsCount');
    }

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Категория не найдена'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { category }
    });

  } catch (error) {
    console.error('Ошибка получения категории:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Create category (admin only)
export const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибки валидации',
        errors: errors.array()
      });
    }

    const categoryData = req.body;

    // Generate slug if not provided
    if (!categoryData.slug) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Set level based on parent
    if (categoryData.parent) {
      const parentCategory = await Category.findById(categoryData.parent);
      if (parentCategory) {
        categoryData.level = parentCategory.level + 1;
      }
    }

    const category = await Category.create(categoryData);

    res.status(201).json({
      status: 'success',
      message: 'Категория создана',
      data: { category }
    });

  } catch (error) {
    console.error('Ошибка создания категории:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Update category (admin only)
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Категория не найдена'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Категория обновлена',
      data: { category }
    });

  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Delete category (admin only)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productsCount = await Product.countDocuments({ category: id });
    if (productsCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Нельзя удалить категорию с продуктами'
      });
    }

    // Check if category has subcategories
    const subcategoriesCount = await Category.countDocuments({ parent: id });
    if (subcategoriesCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Нельзя удалить категорию с подкategoriями'
      });
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Категория не найдена'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Категория удалена'
    });

  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get category tree
export const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ level: 1, sortOrder: 1, name: 1 });

    // Build tree structure
    const tree = buildCategoryTree(categories);

    res.status(200).json({
      status: 'success',
      data: { tree }
    });

  } catch (error) {
    console.error('Ошибка получения дерева категорий:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Helper function to build category tree
const buildCategoryTree = (categories) => {
  const categoryMap = {};
  const tree = [];

  // Create a map of categories
  categories.forEach(category => {
    categoryMap[category._id] = {
      ...category.toObject(),
      children: []
    };
  });

  // Build the tree
  categories.forEach(category => {
    if (category.parent) {
      const parent = categoryMap[category.parent];
      if (parent) {
        parent.children.push(categoryMap[category._id]);
      }
    } else {
      tree.push(categoryMap[category._id]);
    }
  });

  return tree;
};