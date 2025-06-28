import { body } from 'express-validator';

// User registration validation
export const validateRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно содержать от 2 до 50 символов'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Фамилия должна содержать от 2 до 50 символов'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Некорректный email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов'),
  
  body('phone')
    .optional()
    .isMobilePhone('ru-RU')
    .withMessage('Некорректный номер телефона'),
  
  body('role')
    .optional()
    .isIn(['customer', 'farmer'])
    .withMessage('Некорректная роль пользователя')
];

// User login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Некорректный email'),
  
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
];

// Product creation validation
export const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Название продукта должно содержать от 2 до 100 символов'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Описание должно содержать от 10 до 1000 символов'),
  
  body('category')
    .isIn(['vegetables', 'fruits', 'dairy', 'meat', 'grains', 'herbs', 'honey', 'eggs', 'nuts', 'berries'])
    .withMessage('Некорректная категория'),
  
  body('price.amount')
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
  
  body('price.unit')
    .isIn(['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'bunch'])
    .withMessage('Некорректная единица измерения'),
  
  body('availability.quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Количество должно быть неотрицательным числом')
];

// Farmer profile validation
export const validateFarmerProfile = [
  body('farmName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Название фермы должно содержать от 2 до 100 символов'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Описание не может быть длиннее 1000 символов'),
  
  body('specialties')
    .isArray({ min: 1 })
    .withMessage('Необходимо указать хотя бы одну специализацию'),
  
  body('specialties.*')
    .isIn(['vegetables', 'fruits', 'dairy', 'meat', 'grains', 'herbs', 'honey', 'eggs', 'nuts', 'berries'])
    .withMessage('Некорректная специализация'),
  
  body('farmLocation.address')
    .trim()
    .notEmpty()
    .withMessage('Адрес фермы обязателен'),
  
  body('farmLocation.city')
    .trim()
    .notEmpty()
    .withMessage('Город обязателен'),
  
  body('farmLocation.region')
    .trim()
    .notEmpty()
    .withMessage('Регион обязателен')
];

// Order validation
export const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Заказ должен содержать хотя бы один товар'),
  
  body('items.*.product')
    .isMongoId()
    .withMessage('Некорректный ID продукта'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Количество должно быть положительным числом'),
  
  body('delivery.type')
    .isIn(['delivery', 'pickup'])
    .withMessage('Некорректный тип доставки'),
  
  body('delivery.scheduledDate')
    .isISO8601()
    .withMessage('Некорректная дата доставки'),
  
  body('payment.method')
    .isIn(['cash', 'card', 'online'])
    .withMessage('Некорректный способ оплаты')
];

// Review validation
export const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Рейтинг должен быть от 1 до 5'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Заголовок не может быть длиннее 100 символов'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Комментарий не может быть длиннее 500 символов')
];