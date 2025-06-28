import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Рейтинг обязателен'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    maxlength: [100, 'Заголовок не может быть длиннее 100 символов']
  },
  comment: {
    type: String,
    maxlength: [500, 'Комментарий не может быть длиннее 500 символов']
  },
  images: [{
    url: String,
    alt: String
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  response: {
    text: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure one review per customer per product per order
reviewSchema.index({ customer: 1, product: 1, order: 1 }, { unique: true });

// Index for better performance
reviewSchema.index({ product: 1, isVisible: 1 });
reviewSchema.index({ farmer: 1, isVisible: 1 });
reviewSchema.index({ rating: -1 });

export default mongoose.model('Review', reviewSchema);