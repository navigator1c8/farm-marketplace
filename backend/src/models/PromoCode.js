import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: Number,
  usageLimit: {
    total: {
      type: Number,
      default: null // null = unlimited
    },
    perUser: {
      type: Number,
      default: 1
    }
  },
  usageCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableFarmers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer'
  }],
  excludedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  userRestrictions: {
    newUsersOnly: {
      type: Boolean,
      default: false
    },
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    discountAmount: Number
  }]
}, {
  timestamps: true
});

// Virtual to check if promo code is currently valid
promoCodeSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.validFrom && 
         now <= this.validUntil &&
         (this.usageLimit.total === null || this.usageCount < this.usageLimit.total);
});

// Method to check if user can use this promo code
promoCodeSchema.methods.canUserUse = function(userId) {
  // Check if user has already used this code
  const userUsageCount = this.usedBy.filter(usage => 
    usage.user.toString() === userId.toString()
  ).length;
  
  if (userUsageCount >= this.usageLimit.perUser) {
    return false;
  }
  
  // Check if code is restricted to specific users
  if (this.userRestrictions.specificUsers.length > 0) {
    return this.userRestrictions.specificUsers.some(user => 
      user.toString() === userId.toString()
    );
  }
  
  return true;
};

// Index for better performance
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
promoCodeSchema.index({ createdBy: 1 });

export default mongoose.model('PromoCode', promoCodeSchema);