import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  paymentId: {
    type: String,
    unique: true,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'RUB'
  },
  method: {
    type: String,
    enum: ['card', 'cash', 'bank_transfer', 'digital_wallet', 'cryptocurrency'],
    required: true
  },
  provider: {
    type: String,
    enum: ['stripe', 'yandex_money', 'sberbank', 'tinkoff', 'qiwi', 'paypal'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: String,
  providerTransactionId: String,
  description: String,
  metadata: {
    cardLast4: String,
    cardBrand: String,
    receiptUrl: String,
    failureReason: String,
    refundReason: String
  },
  fees: {
    platformFee: {
      type: Number,
      default: 0
    },
    processingFee: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  refunds: [{
    amount: Number,
    reason: String,
    refundId: String,
    processedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed']
    }
  }],
  processedAt: Date,
  failedAt: Date,
  cancelledAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

// Generate payment ID before saving
paymentSchema.pre('save', async function(next) {
  if (!this.paymentId) {
    const count = await mongoose.model('Payment').countDocuments();
    this.paymentId = `PAY${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Index for better performance
paymentSchema.index({ order: 1 });
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: -1 });

export default mongoose.model('Payment', paymentSchema);