import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    default: 'Мой список желаний'
  },
  description: String
}, {
  timestamps: true
});

// Ensure unique products in wishlist
wishlistSchema.index({ user: 1, 'items.product': 1 }, { unique: true });

// Virtual for items count
wishlistSchema.virtual('itemsCount').get(function() {
  return this.items.length;
});

export default mongoose.model('Wishlist', wishlistSchema);