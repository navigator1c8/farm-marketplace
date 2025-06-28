import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import PickupPoint from '../models/PickupPoint.js';
import PromoCode from '../models/PromoCode.js';

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB подключена');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
  }
};

// Sample data
const createSampleUsers = async () => {
  const users = [
    {
      firstName: 'Михаил',
      lastName: 'Иванов',
      email: 'mikhail.ivanov@example.com',
      password: await bcrypt.hash('password123', 12),
      phone: '+7-900-123-45-67',
      role: 'farmer',
      isVerified: true,
      isActive: true
    },
    {
      firstName: 'Анна',
      lastName: 'Петрова',
      email: 'anna.petrova@example.com',
      password: await bcrypt.hash('password123', 12),
      phone: '+7-900-234-56-78',
      role: 'farmer',
      isVerified: true,
      isActive: true
    },
    {
      firstName: 'Сергей',
      lastName: 'Козлов',
      email: 'sergey.kozlov@example.com',
      password: await bcrypt.hash('password123', 12),
      phone: '+7-900-345-67-89',
      role: 'farmer',
      isVerified: true,
      isActive: true
    },
    {
      firstName: 'Елена',
      lastName: 'Смирнова',
      email: 'elena.smirnova@example.com',
      password: await bcrypt.hash('password123', 12),
      phone: '+7-900-456-78-90',
      role: 'customer',
      isVerified: true,
      isActive: true
    },
    {
      firstName: 'Администратор',
      lastName: 'Системы',
      email: 'admin@fermamarket.ru',
      password: await bcrypt.hash('admin123', 12),
      phone: '+7-900-000-00-00',
      role: 'admin',
      isVerified: true,
      isActive: true
    }
  ];

  return await User.create(users);
};

const sampleCategories = [
  {
    name: 'Овощи',
    slug: 'vegetables',
    description: 'Свежие овощи с фермы',
    icon: '🥕',
    level: 0,
    sortOrder: 1,
    isActive: true
  },
  {
    name: 'Фрукты',
    slug: 'fruits',
    description: 'Сезонные фрукты и ягоды',
    icon: '🍎',
    level: 0,
    sortOrder: 2,
    isActive: true
  },
  {
    name: 'Молочные продукты',
    slug: 'dairy',
    description: 'Натуральные молочные продукты',
    icon: '🥛',
    level: 0,
    sortOrder: 3,
    isActive: true
  },
  {
    name: 'Мёд и продукты пчеловодства',
    slug: 'honey',
    description: 'Натуральный мёд и продукты пчеловодства',
    icon: '🍯',
    level: 0,
    sortOrder: 4,
    isActive: true
  },
  {
    name: 'Зелень и травы',
    slug: 'herbs',
    description: 'Свежая зелень и пряные травы',
    icon: '🌿',
    level: 0,
    sortOrder: 5,
    isActive: true
  },
  {
    name: 'Орехи',
    slug: 'nuts',
    description: 'Орехи и семена',
    icon: '🥜',
    level: 0,
    sortOrder: 6,
    isActive: true
  }
];

const samplePickupPoints = [
  {
    name: 'Пункт выдачи "Центральный"',
    address: {
      street: 'ул. Тверская, 15',
      city: 'Москва',
      region: 'Московская область',
      postalCode: '125009',
      coordinates: {
        latitude: 55.7558,
        longitude: 37.6176
      }
    },
    workingHours: {
      monday: { start: '09:00', end: '21:00' },
      tuesday: { start: '09:00', end: '21:00' },
      wednesday: { start: '09:00', end: '21:00' },
      thursday: { start: '09:00', end: '21:00' },
      friday: { start: '09:00', end: '21:00' },
      saturday: { start: '10:00', end: '20:00' },
      sunday: { start: '10:00', end: '18:00' }
    },
    contact: {
      phone: '+7-495-123-45-67',
      email: 'central@fermamarket.ru'
    },
    capacity: 200,
    facilities: ['parking', 'wheelchair_access', 'refrigeration'],
    isActive: true
  },
  {
    name: 'Пункт выдачи "Северный"',
    address: {
      street: 'ул. Дмитровское шоссе, 89',
      city: 'Москва',
      region: 'Московская область',
      postalCode: '127015',
      coordinates: {
        latitude: 55.8431,
        longitude: 37.6156
      }
    },
    workingHours: {
      monday: { start: '08:00', end: '22:00' },
      tuesday: { start: '08:00', end: '22:00' },
      wednesday: { start: '08:00', end: '22:00' },
      thursday: { start: '08:00', end: '22:00' },
      friday: { start: '08:00', end: '22:00' },
      saturday: { start: '09:00', end: '21:00' },
      sunday: { start: '09:00', end: '19:00' }
    },
    contact: {
      phone: '+7-495-234-56-78',
      email: 'north@fermamarket.ru'
    },
    capacity: 150,
    facilities: ['parking', 'refrigeration'],
    isActive: true
  }
];

const createSamplePromoCodes = (adminUserId) => [
  {
    code: 'WELCOME10',
    name: 'Скидка для новых пользователей',
    description: 'Скидка 10% на первый заказ',
    type: 'percentage',
    value: 10,
    minOrderAmount: 1000,
    maxDiscountAmount: 500,
    usageLimit: {
      total: 1000,
      perUser: 1
    },
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    userRestrictions: {
      newUsersOnly: true
    },
    isActive: true,
    createdBy: adminUserId
  },
  {
    code: 'ORGANIC20',
    name: 'Скидка на органические продукты',
    description: 'Скидка 20% на органические продукты',
    type: 'percentage',
    value: 20,
    minOrderAmount: 2000,
    maxDiscountAmount: 1000,
    usageLimit: {
      total: 500,
      perUser: 3
    },
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    isActive: true,
    createdBy: adminUserId
  },
  {
    code: 'FREESHIP',
    name: 'Бесплатная доставка',
    description: 'Бесплатная доставка при заказе от 1500₽',
    type: 'free_shipping',
    value: 0,
    minOrderAmount: 1500,
    usageLimit: {
      total: null,
      perUser: 5
    },
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    isActive: true,
    createdBy: adminUserId
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Начинаем заполнение базы данных...');

    // Clear existing data
    await User.deleteMany({});
    await Farmer.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await PickupPoint.deleteMany({});
    await PromoCode.deleteMany({});
    console.log('🗑️ Очистили существующие данные');

    // Create users
    const users = await createSampleUsers();
    console.log('👥 Создали пользователей:', users.length);

    // Create categories
    const categories = await Category.create(sampleCategories);
    console.log('📂 Создали категории:', categories.length);

    // Create farmers (link to users)
    const sampleFarmers = [
      {
        user: users[0]._id,
        farmName: 'Эко-ферма Иванова',
        description: 'Семейная ферма, специализирующаяся на выращивании органических овощей и зелени.',
        specialties: ['vegetables', 'herbs'],
        isOrganic: true,
        isVerified: true,
        farmLocation: {
          address: 'д. Зеленая, ул. Полевая, 15',
          city: 'Подольск',
          region: 'Московская область',
          coordinates: {
            latitude: 55.4319,
            longitude: 37.5447
          }
        },
        deliveryRadius: 50,
        rating: {
          average: 4.9,
          count: 127
        },
        totalSales: 1250000
      },
      {
        user: users[1]._id,
        farmName: 'Молочная ферма Петровых',
        description: 'Производим натуральные молочные продукты и мёд.',
        specialties: ['dairy', 'honey'],
        isOrganic: true,
        isVerified: true,
        farmLocation: {
          address: 'с. Молочное, ул. Фермерская, 8',
          city: 'Тула',
          region: 'Тульская область',
          coordinates: {
            latitude: 54.1961,
            longitude: 37.6182
          }
        },
        deliveryRadius: 40,
        rating: {
          average: 4.8,
          count: 89
        },
        totalSales: 980000
      },
      {
        user: users[2]._id,
        farmName: 'Фруктовый сад Козлова',
        description: 'Выращиваем сезонные фрукты, орехи и делаем домашние консервы.',
        specialties: ['fruits', 'nuts'],
        isOrganic: false,
        isVerified: true,
        farmLocation: {
          address: 'д. Садовая, ул. Яблоневая, 22',
          city: 'Калуга',
          region: 'Калужская область',
          coordinates: {
            latitude: 54.5293,
            longitude: 36.2754
          }
        },
        deliveryRadius: 60,
        rating: {
          average: 4.7,
          count: 156
        },
        totalSales: 750000
      }
    ];

    const farmers = await Farmer.create(sampleFarmers);
    console.log('🚜 Создали фермеров:', farmers.length);

    // Create pickup points
    const pickupPoints = await PickupPoint.create(samplePickupPoints);
    console.log('📍 Создали точки выдачи:', pickupPoints.length);

    // Create promo codes
    const promoCodesData = createSamplePromoCodes(users[4]._id); // Admin user
    const promoCodes = await PromoCode.create(promoCodesData);
    console.log('🎫 Создали промокоды:', promoCodes.length);

    // Create sample products
    const sampleProducts = [
      {
        name: 'Помидоры черри',
        description: 'Сладкие органические помидоры черри, выращенные в теплице.',
        farmer: farmers[0]._id,
        category: categories[0]._id, // Овощи
        price: { amount: 350, unit: 'kg' },
        images: [{
          url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop',
          alt: 'Помидоры черри',
          isPrimary: true
        }],
        availability: { inStock: true, quantity: 50 },
        characteristics: { isOrganic: true, isLocal: true, isGMOFree: true },
        rating: { average: 4.9, count: 45 },
        totalSold: 120,
        tags: ['органик', 'свежие', 'местные']
      },
      {
        name: 'Молоко коровье',
        description: 'Свежее цельное молоко от коров, пасущихся на экологически чистых лугах.',
        farmer: farmers[1]._id,
        category: categories[2]._id, // Молочные продукты
        price: { amount: 80, unit: 'l' },
        images: [{
          url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop',
          alt: 'Молоко коровье',
          isPrimary: true
        }],
        availability: { inStock: true, quantity: 100 },
        characteristics: { isOrganic: true, isLocal: true, isGMOFree: true },
        rating: { average: 4.9, count: 78 },
        totalSold: 450,
        tags: ['органик', 'свежее', 'натуральное']
      },
      {
        name: 'Яблоки Антоновка',
        description: 'Классические русские яблоки сорта Антоновка.',
        farmer: farmers[2]._id,
        category: categories[1]._id, // Фрукты
        price: { amount: 120, unit: 'kg' },
        images: [{
          url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&h=300&fit=crop',
          alt: 'Яблоки Антоновка',
          isPrimary: true
        }],
        availability: { inStock: true, quantity: 200 },
        seasonality: { isSeasonalProduct: true, availableMonths: [8, 9, 10, 11, 12, 1, 2] },
        characteristics: { isOrganic: false, isLocal: true, isGMOFree: true },
        rating: { average: 4.6, count: 89 },
        totalSold: 340,
        tags: ['сезонные', 'антоновка', 'русские']
      }
    ];

    const products = await Product.create(sampleProducts);
    console.log('🥕 Создали продукты:', products.length);

    console.log('✅ База данных успешно заполнена!');
    console.log('\n📊 Статистика:');
    console.log(`- Пользователей: ${users.length}`);
    console.log(`- Категорий: ${categories.length}`);
    console.log(`- Фермеров: ${farmers.length}`);
    console.log(`- Продуктов: ${products.length}`);
    console.log(`- Точек выдачи: ${pickupPoints.length}`);
    console.log(`- Промокодов: ${promoCodes.length}`);

    console.log('\n🔐 Тестовые аккаунты:');
    console.log('Администратор:');
    console.log('- admin@fermamarket.ru / admin123');
    console.log('Фермеры:');
    console.log('- mikhail.ivanov@example.com / password123');
    console.log('- anna.petrova@example.com / password123');
    console.log('- sergey.kozlov@example.com / password123');
    console.log('Покупатель:');
    console.log('- elena.smirnova@example.com / password123');

    console.log('\n🎫 Промокоды для тестирования:');
    console.log('- WELCOME10 (10% скидка для новых пользователей)');
    console.log('- ORGANIC20 (20% скидка на органические продукты)');
    console.log('- FREESHIP (бесплатная доставка от 1500₽)');

  } catch (error) {
    console.error('❌ Ошибка заполнения базы данных:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Подключение к базе данных закрыто');
  }
};

// Run seeding
connectDB().then(seedDatabase);