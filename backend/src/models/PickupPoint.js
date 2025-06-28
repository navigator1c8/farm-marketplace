import mongoose from 'mongoose';

const pickupPointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название точки выдачи обязательно'],
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    region: {
      type: String,
      required: true
    },
    postalCode: String,
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  workingHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  contact: {
    phone: String,
    email: String
  },
  capacity: {
    type: Number,
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: String,
  facilities: [String], // ['parking', 'wheelchair_access', 'refrigeration']
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for geospatial queries
pickupPointSchema.index({ 'address.coordinates': '2dsphere' });

export default mongoose.model('PickupPoint', pickupPointSchema);