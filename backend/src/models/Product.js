import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название продукта обязательно'],
    trim: true,
    maxlength: [100, 'Название продукта не может быть длиннее 100 символов']
  },
  description: {
    type: String,
    required: [true, 'Описание продукта обязательно'],
    maxlength: [1000, 'Описание не может быть длиннее 1000 символов']
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  price: {
    amount: {
      type: Number,
      required: [true, 'Цена обязательна'],
      min: [0, 'Цена не может быть отрицательной']
    },
    unit: {
      type: String,
      required: [true, 'Единица измерения обязательна'],
      enum: ['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'bunch']
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  availability: {
    inStock: {
      type: Boolean,
      default: true
    },
    quantity: {
      type: Number,
      min: 0,
      default: 0
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1
    },
    maxOrderQuantity: {
      type: Number,
      default: null
    }
  },
  seasonality: {
    isSeasonalProduct: {
      type: Boolean,
      default: false
    },
    availableMonths: [{
      type: Number,
      min: 1,
      max: 12
    }],
    harvestDate: Date,
    expiryDate: Date
  },
  characteristics: {
    isOrganic: {
      type: Boolean,
      default: false
    },
    isLocal: {
      type: Boolean,
      default: true
    },
    isGMOFree: {
      type: Boolean,
      default: true
    },
    shelfLife: String, // e.g., "7 days", "2 weeks"
    storageConditions: String
  },
  nutritionalInfo: {
    calories: Number, // per 100g
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    vitamins: [String],
    minerals: [String]
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalSold: {
    type: Number,
    default: 0
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isPreorder: {
    type: Boolean,
    default: false
  },
  preorderDate: Date,
  discounts: [{
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    value: Number,
    startDate: Date,
    endDate: Date,
    minQuantity: Number,
    isActive: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product'
});

// Virtual for current price with discount
productSchema.virtual('currentPrice').get(function() {
  const activeDiscount = this.discounts.find(discount => 
    discount.isActive && 
    new Date() >= discount.startDate && 
    new Date() <= discount.endDate
  );

  if (activeDiscount) {
    if (activeDiscount.type === 'percentage') {
      return this.price.amount * (1 - activeDiscount.value / 100);
    } else {
      return Math.max(0, this.price.amount - activeDiscount.value);
    }
  }

  return this.price.amount;
});

// Index for better performance
productSchema.index({ farmer: 1, isActive: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ 'availability.inStock': 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);