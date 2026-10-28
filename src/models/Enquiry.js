const mongoose = require('mongoose');
const crypto = require('crypto');

const internalNoteSchema = new mongoose.Schema(
  {
    note: { type: String, required: true, trim: true, maxlength: 2000 },
    authorName: { type: String, required: true, trim: true },
    authorEmail: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['New', 'In Progress', 'Responded', 'Closed'],
      required: true,
    },
    changedBy: { type: String, default: 'System' },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const enquirySchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 120,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: 160,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      maxlength: 160,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    enquiryType: {
      type: String,
      enum: ['general', 'division', 'service', 'product'],
      default: 'general',
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      default: null,
      index: true,
    },
    divisionName: {
      type: String,
      trim: true,
      default: 'General / Multi-Division',
    },
    serviceCategory: {
      type: String,
      trim: true,
      default: '',
    },
    machineOrProductDetails: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    message: {
      type: String,
      required: [true, 'Requirement / message is required'],
      trim: true,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ['New', 'In Progress', 'Responded', 'Closed'],
      default: 'New',
      index: true,
    },
    assignedTo: {
      type: String,
      trim: true,
      default: '',
    },
    internalNotes: [internalNoteSchema],
    statusHistory: [statusHistorySchema],
    sourcePage: {
      type: String,
      trim: true,
      default: '/contact',
    },
    consentAccepted: {
      type: Boolean,
      required: true,
      default: true,
    },
    consentTimestamp: {
      type: Date,
      default: Date.now,
    },
    fingerprintHash: {
      type: String,
      index: true,
      select: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

enquirySchema.statics.generateReference = function () {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `MP-${yyyy}${mm}${dd}-${suffix}`;
};

module.exports = mongoose.model('Enquiry', enquirySchema);
