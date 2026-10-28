const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: 160,
    },
    slug: {
      type: String,
      required: [true, 'Service slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'Machinery & Technical Support',
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: 350,
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    scopeItems: [
      {
        type: String,
        trim: true,
      },
    ],
    relatedDivisions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Division',
      },
    ],
    confirmationStatus: {
      type: String,
      enum: ['confirmed', 'pending_confirmation'],
      default: 'pending_confirmation',
    },
    publicationStatus: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
