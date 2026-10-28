const crypto = require('crypto');
const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');
const Division = require('../models/Division');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Industry = require('../models/Industry');
const Enquiry = require('../models/Enquiry');
const { sendEnquiryNotifications } = require('../services/emailService');

function sanitizePublicProduct(productDoc) {
  const obj = productDoc.toObject ? productDoc.toObject() : { ...productDoc };
  // Public API exposes only verified technical specifications
  obj.specifications = Array.isArray(obj.specifications)
    ? obj.specifications.filter((spec) => spec && spec.isVerified === true)
    : [];
  return obj;
}

function sanitizePublicDivision(divisionDoc) {
  const obj = divisionDoc.toObject ? divisionDoc.toObject() : { ...divisionDoc };
  // Public API exposes only approved FAQs
  obj.faqs = Array.isArray(obj.faqs)
    ? obj.faqs.filter((faq) => faq && faq.isApproved === true)
    : [];
  return obj;
}

exports.getPublicSiteSettings = async (_req, res, next) => {
  try {
    let settings = await SiteSettings.findOne({ singletonKey: 'default' }).lean();
    if (!settings) {
      settings = await SiteSettings.create({ singletonKey: 'default' });
      settings = settings.toObject();
    }

    // Never expose internal notification routing config to public clients
    const { notification, singletonKey, __v, ...publicSettings } = settings;
    res.json({
      success: true,
      data: publicSettings,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPublicDivisions = async (_req, res, next) => {
  try {
    const divisions = await Division.find({
      publicationStatus: 'published',
      isArchived: { $ne: true },
    })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: divisions.map(sanitizePublicDivision),
    });
  } catch (err) {
    next(err);
  }
};

exports.getPublicDivisionBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const division = await Division.findOne({
      slug: String(slug).toLowerCase(),
      publicationStatus: 'published',
      isArchived: { $ne: true },
    }).lean();

    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Requested division was not found or is not currently published.',
      });
    }

    const products = await Product.find({
      division: division._id,
      publicationStatus: 'published',
      isArchived: { $ne: true },
    })
      .populate('division', 'name slug code')
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        division: sanitizePublicDivision(division),
        products: products.map(sanitizePublicProduct),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getPublicProducts = async (req, res, next) => {
  try {
    const { division, category, featured, search, limit = 50 } = req.query;
    const filter = {
      publicationStatus: 'published',
      isArchived: { $ne: true },
    };

    if (division) {
      if (mongoose.Types.ObjectId.isValid(division)) {
        filter.division = division;
      } else {
        const divDoc = await Division.findOne({
          slug: String(division).toLowerCase(),
          publicationStatus: 'published',
        }).lean();
        if (divDoc) {
          filter.division = divDoc._id;
        } else {
          return res.json({ success: true, data: [] });
        }
      }
    } else {
      // Ensure products belonging to unpublished divisions are not exposed
      const publishedDivIds = await Division.find({
        publicationStatus: 'published',
        isArchived: { $ne: true },
      }).distinct('_id');
      filter.division = { $in: publishedDivIds };
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: regex },
        { category: regex },
        { shortDescription: regex },
        { applications: regex },
      ];
    }

    const products = await Product.find(filter)
      .populate('division', 'name slug code')
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 100))
      .lean();

    res.json({
      success: true,
      data: products.map(sanitizePublicProduct),
    });
  } catch (err) {
    next(err);
  }
};

exports.getPublicProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const query = mongoose.Types.ObjectId.isValid(slug)
      ? { $or: [{ slug: String(slug).toLowerCase() }, { _id: slug }] }
      : { slug: String(slug).toLowerCase() };

    const product = await Product.findOne({
      ...query,
      publicationStatus: 'published',
      isArchived: { $ne: true },
    })
      .populate('division', 'name slug code shortDescription')
      .lean();

    if (!product || !product.division) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or currently unpublished.',
      });
    }

    res.json({
      success: true,
      data: sanitizePublicProduct(product),
    });
  } catch (err) {
    next(err);
  }
};

exports.getPublicServices = async (_req, res, next) => {
  try {
    const services = await Service.find({
      publicationStatus: 'published',
    })
      .populate('relatedDivisions', 'name slug code')
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: services,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPublicIndustries = async (_req, res, next) => {
  try {
    const industries = await Industry.find({
      publicationStatus: 'published',
    })
      .populate('relatedDivisions', 'name slug code shortDescription')
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    res.json({
      success: true,
      data: industries,
    });
  } catch (err) {
    next(err);
  }
};

exports.submitPublicEnquiry = async (req, res, next) => {
  try {
    const {
      fullName,
      companyName,
      phone,
      email,
      enquiryType = 'general',
      divisionId,
      divisionSlug,
      divisionName,
      serviceCategory = '',
      machineOrProductDetails = '',
      message,
      sourcePage = '/contact',
      consentAccepted,
      websiteHoneypot, // anti-spam honeypot field
    } = req.body;

    // Silent rejection if bot fills honeypot
    if (websiteHoneypot) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission detected.',
      });
    }

    const errors = [];
    if (!fullName || String(fullName).trim().length < 2) {
      errors.push('Please enter your full name (at least 2 characters).');
    }
    if (!companyName || String(companyName).trim().length < 2) {
      errors.push('Please enter your company or business name.');
    }
    if (!phone || !/^[+\d\s\-()]{7,20}$/.test(String(phone).trim())) {
      errors.push('Please enter a valid contact phone number.');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      errors.push('Please enter a valid business email address.');
    }
    if (!message || String(message).trim().length < 10) {
      errors.push('Please describe your requirement (at least 10 characters).');
    }
    if (consentAccepted === false || consentAccepted === 'false') {
      errors.push('Please accept the privacy notice to submit your enquiry.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    // Resolve division reference if provided
    let resolvedDivisionId = null;
    let resolvedDivisionName = divisionName || 'General / Multi-Division';

    if (divisionId && mongoose.Types.ObjectId.isValid(divisionId)) {
      const divDoc = await Division.findById(divisionId).lean();
      if (divDoc) {
        resolvedDivisionId = divDoc._id;
        resolvedDivisionName = divDoc.name;
      }
    } else if (divisionSlug) {
      const divDoc = await Division.findOne({ slug: String(divisionSlug).toLowerCase() }).lean();
      if (divDoc) {
        resolvedDivisionId = divDoc._id;
        resolvedDivisionName = divDoc.name;
      }
    }

    // Duplicate submission protection within 2 minutes
    const fingerprintHash = crypto
      .createHash('sha256')
      .update(
        `${String(email).toLowerCase().trim()}|${resolvedDivisionName}|${String(message).trim()}`
      )
      .digest('hex');

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const duplicate = await Enquiry.findOne({
      fingerprintHash,
      createdAt: { $gte: twoMinutesAgo },
    }).lean();

    if (duplicate) {
      return res.status(429).json({
        success: false,
        message: `This enquiry was already received moments ago under reference ${duplicate.reference}.`,
        data: { reference: duplicate.reference },
      });
    }

    // Generate unique reference
    let reference = Enquiry.generateReference();
    for (let attempt = 0; attempt < 4; attempt++) {
      const exists = await Enquiry.exists({ reference });
      if (!exists) break;
      reference = Enquiry.generateReference();
    }

    const enquiry = await Enquiry.create({
      reference,
      fullName: String(fullName).trim(),
      companyName: String(companyName).trim(),
      phone: String(phone).trim(),
      email: String(email).toLowerCase().trim(),
      enquiryType,
      division: resolvedDivisionId,
      divisionName: resolvedDivisionName,
      serviceCategory: String(serviceCategory || '').trim(),
      machineOrProductDetails: String(machineOrProductDetails || '').trim(),
      message: String(message).trim(),
      status: 'New',
      statusHistory: [
        {
          status: 'New',
          changedBy: 'Public Website Submission',
          note: `Submitted via ${sourcePage}`,
          changedAt: new Date(),
        },
      ],
      sourcePage: String(sourcePage || '/contact').trim(),
      consentAccepted: true,
      consentTimestamp: new Date(),
      fingerprintHash,
    });

    // Optional non-blocking email notification
    const siteSettings = await SiteSettings.findOne({ singletonKey: 'default' }).lean();
    sendEnquiryNotifications(enquiry, siteSettings).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Thank you. Your enquiry has been recorded under reference ${enquiry.reference}.`,
      data: {
        reference: enquiry.reference,
        fullName: enquiry.fullName,
        companyName: enquiry.companyName,
        divisionName: enquiry.divisionName,
        createdAt: enquiry.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};
