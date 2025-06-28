import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByFarmer,
  getFeaturedProducts,
  getSeasonalProducts
} from '../controllers/productController.js';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';
import { validateProduct } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/seasonal', getSeasonalProducts);
router.get('/farmer/:farmerId', getProductsByFarmer);
router.get('/:id', getProduct);

// Protected routes (farmers only)
router.use(protect);
router.post('/', restrictTo('farmer'), validateProduct, createProduct);
router.patch('/:id', restrictTo('farmer'), updateProduct);
router.delete('/:id', restrictTo('farmer'), deleteProduct);

export default router;