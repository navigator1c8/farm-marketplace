import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
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
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true
    }
  }],
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  delivery: {
    type: {
      type: String,
      enum: ['delivery', 'pickup'],
      required: true
    },
    address: {
      street: String,
      city: String,
      region: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      instructions: String
    },
    pickupLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PickupPoint'
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    timeSlot: {
      start: String, // "09:00"
      end: String    // "12:00"
    },
    actualDeliveryDate: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'online'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  notes: {
    customer: String,
    farmer: String,
    admin: String
  },
  tracking: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    refundAmount: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `FM${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Virtual for farmers involved in order
orderSchema.virtual('farmers').get(function() {
  return [...new Set(this.items.map(item => item.farmer.toString()))];
});

// Index for better performance
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'delivery.scheduledDate': 1 });

export default mongoose.model('Order', orderSchema);