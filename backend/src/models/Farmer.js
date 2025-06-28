import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  farmName: {
    type: String,
    required: [true, 'Название фермы обязательно'],
    trim: true,
    maxlength: [100, 'Название фермы не может быть длиннее 100 символов']
  },
  description: {
    type: String,
    maxlength: [1000, 'Описание не может быть длиннее 1000 символов']
  },
  specialties: [{
    type: String,
    enum: ['vegetables', 'fruits', 'dairy', 'meat', 'grains', 'herbs', 'honey', 'eggs', 'nuts', 'berries']
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateNumber: String,
    document: String // URL to certificate document
  }],
  isOrganic: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  farmLocation: {
    address: String,
    city: String,
    region: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  deliveryRadius: {
    type: Number, // in kilometers
    default: 50
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
  totalSales: {
    type: Number,
    default: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  socialMedia: {
    website: String,
    instagram: String,
    facebook: String,
    telegram: String
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    accountHolder: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for products
farmerSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'farmer'
});

// Virtual for reviews
farmerSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'farmer'
});

// Index for better performance
farmerSchema.index({ 'farmLocation.coordinates': '2dsphere' });
farmerSchema.index({ isVerified: 1, isActive: 1 });
farmerSchema.index({ specialties: 1 });
farmerSchema.index({ 'rating.average': -1 });

export default mongoose.model('Farmer', farmerSchema);