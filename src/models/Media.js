const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Media title is required'],
      trim: true,
      maxlength: 160,
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 240,
      default: '',
    },
    url: {
      type: String,
      required: [true, 'Media URL is required'],
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
      default: '',
    },
    storageProvider: {
      type: String,
      enum: ['local', 'cloudinary', 'static_asset'],
      default: 'local',
    },
    mimeType: {
      type: String,
      default: 'image/png',
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: ['logo', 'division', 'product', 'service', 'industry', 'general'],
      default: 'product',
      index: true,
    },
    uploadedBy: {
      type: String,
      default: 'System',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);
