import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import PickupPoint from '../models/PickupPoint.js';

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

// Clear database
const clearDatabase = async () => {
  try {
    console.log('🗑️ Начинаем очистку базы данных...');

    // Clear all collections
    await User.deleteMany({});
    console.log('✅ Пользователи удалены');

    await Farmer.deleteMany({});
    console.log('✅ Фермеры удалены');

    await Product.deleteMany({});
    console.log('✅ Продукты удалены');

    await Order.deleteMany({});
    console.log('✅ Заказы удалены');

    await Review.deleteMany({});
    console.log('✅ Отзывы удалены');

    await PickupPoint.deleteMany({});
    console.log('✅ Точки выдачи удалены');

    console.log('🎉 База данных успешно очищена!');

  } catch (error) {
    console.error('❌ Ошибка очистки базы данных:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Подключение к базе данных закрыто');
  }
};

// Run clearing
connectDB().then(clearDatabase);