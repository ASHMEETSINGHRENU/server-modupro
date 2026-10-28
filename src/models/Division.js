const mongoose = require('mongoose');

const faqItemSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    isApproved: { type: Boolean, default: false },
  },
  { _id: true }
);

const divisionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Division name is required'],
      trim: true,
      maxlength: 140,
    },
    slug: {
      type: String,
      required: [true, 'Division slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      trim: true,
      default: '01',
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    brandSpellingNote: {
      type: String,
      trim: true,
      default: '',
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: 400,
    },
    fullDescription: {
      type: String,
      required: [true, 'Full description is required'],
      trim: true,
    },
    heroImage: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    categories: [
      {
        type: String,
        trim: true,
      },
    ],
    applications: [
      {
        type: String,
        trim: true,
      },
    ],
    serviceHighlights: [
      {
        type: String,
        trim: true,
      },
    ],
    faqs: [faqItemSchema],
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    publicationStatus: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    seo: {
      metaTitle: { type: String, trim: true, default: '' },
      metaDescription: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Division', divisionSchema);
