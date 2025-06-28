import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import { validationResult } from 'express-validator';
import { sendEmail } from '../utils/email.js';
import crypto from 'crypto';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register new user
export const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибки валидации',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      verificationToken
    });

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Подтверждение регистрации - ФермаМаркет',
        template: 'verification',
        data: {
          firstName,
          verificationToken,
          verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
        }
      });
    } catch (emailError) {
      console.error('Ошибка отправки email:', emailError);
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      status: 'success',
      message: 'Пользователь успешно зарегистрирован. Проверьте email для подтверждения.',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Ошибки валидации',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Неверный email или пароль'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Неверный email или пароль'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Get farmer profile if user is a farmer
    let farmerProfile = null;
    if (user.role === 'farmer') {
      farmerProfile = await Farmer.findOne({ user: user._id });
    }

    res.status(200).json({
      status: 'success',
      message: 'Успешный вход в систему',
      data: {
        user,
        farmer: farmerProfile,
        token
      }
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Недействительный или истекший токен'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email успешно подтвержден'
    });

  } catch (error) {
    console.error('Ошибка подтверждения email:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Пользователь с таким email не найден'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send reset email
    try {
      await sendEmail({
        to: email,
        subject: 'Сброс пароля - ФермаМаркет',
        template: 'resetPassword',
        data: {
          firstName: user.firstName,
          resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Инструкции по сбросу пароля отправлены на email'
      });

    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      console.error('Ошибка отправки email:', emailError);
      res.status(500).json({
        status: 'error',
        message: 'Ошибка отправки email'
      });
    }

  } catch (error) {
    console.error('Ошибка сброса пароля:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Недействительный или истекший токен'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Пароль успешно изменен'
    });

  } catch (error) {
    console.error('Ошибка сброса пароля:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    let farmerProfile = null;
    if (user.role === 'farmer') {
      farmerProfile = await Farmer.findOne({ user: user._id });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        farmer: farmerProfile
      }
    });

  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({
      status: 'error',
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Logout (client-side token removal)
export const logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Успешный выход из системы'
  });
};