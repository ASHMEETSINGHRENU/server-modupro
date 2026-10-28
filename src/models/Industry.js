const mongoose = require('mongoose');

const industrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Industry name is required'],
      trim: true,
      maxlength: 160,
    },
    slug: {
      type: String,
      required: [true, 'Industry slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: 350,
    },
    description: {
      type: String,
      required: [true, 'Industry description is required'],
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    keyApplications: [
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

module.exports = mongoose.model('Industry', industrySchema);
