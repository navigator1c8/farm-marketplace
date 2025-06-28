import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['delivery', 'pickup'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_transit', 'delivered', 'failed', 'cancelled'],
    default: 'pending'
  },
  driver: {
    name: String,
    phone: String,
    vehicle: String,
    licensePlate: String
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
  actualPickupTime: Date,
  actualDeliveryTime: Date,
  estimatedDeliveryTime: Date,
  deliveryFee: {
    type: Number,
    default: 0
  },
  distance: Number, // in kilometers
  route: [{
    latitude: Number,
    longitude: Number,
    timestamp: Date
  }],
  notes: String,
  proof: {
    signature: String,
    photo: String,
    recipientName: String
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    ratedAt: Date
  }
}, {
  timestamps: true
});

// Index for better performance
deliverySchema.index({ order: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ scheduledDate: 1 });
deliverySchema.index({ 'driver.phone': 1 });

export default mongoose.model('Delivery', deliverySchema);