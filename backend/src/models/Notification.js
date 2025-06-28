import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'order_created',
      'order_confirmed',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'payment_received',
      'payment_failed',
      'review_received',
      'product_low_stock',
      'farmer_verified',
      'promotion',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    orderId: mongoose.Schema.Types.ObjectId,
    productId: mongoose.Schema.Types.ObjectId,
    farmerId: mongoose.Schema.Types.ObjectId,
    amount: Number,
    url: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channel: {
    type: String,
    enum: ['in_app', 'email', 'sms', 'push'],
    default: 'in_app'
  },
  scheduledFor: Date,
  sentAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

// Index for better performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Notification', notificationSchema);