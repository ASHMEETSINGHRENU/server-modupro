const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const Division = require('../models/Division');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Industry = require('../models/Industry');
const Enquiry = require('../models/Enquiry');
const Media = require('../models/Media');
const SiteSettings = require('../models/SiteSettings');
const AuditLog = require('../models/AuditLog');
const { slugify } = require('../utils/sanitize');
const { recordAudit } = require('../services/auditService');

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// ==========================================
// 1. DASHBOARD ANALYTICS (REAL MONGODB DATA)
// ==========================================
exports.getDashboardOverview = async (_req, res, next) => {
  try {
    const [
      totalEnquiries,
      newEnquiries,
      inProgressEnquiries,
      respondedEnquiries,
      closedEnquiries,
      enquiriesByDivisionAgg,
      recentEnquiries,
      publishedProducts,
      draftProducts,
      totalProducts,
      activeDivisions,
      publishedServices,
      publishedIndustries,
      recentAuditLogs,
    ] = await Promise.all([
      Enquiry.countDocuments({ isArchived: { $ne: true } }),
      Enquiry.countDocuments({ status: 'New', isArchived: { $ne: true } }),
      Enquiry.countDocuments({ status: 'In Progress', isArchived: { $ne: true } }),
      Enquiry.countDocuments({ status: 'Responded', isArchived: { $ne: true } }),
      Enquiry.countDocuments({ status: 'Closed', isArchived: { $ne: true } }),
      Enquiry.aggregate([
        { $match: { isArchived: { $ne: true } } },
        {
          $group: {
            _id: '$divisionName',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Enquiry.find({ isArchived: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('reference fullName companyName phone email divisionName status createdAt')
        .lean(),
      Product.countDocuments({ publicationStatus: 'published', isArchived: { $ne: true } }),
      Product.countDocuments({
        publicationStatus: { $in: ['draft', 'pending_review'] },
        isArchived: { $ne: true },
      }),
      Product.countDocuments({ isArchived: { $ne: true } }),
      Division.countDocuments({ publicationStatus: 'published', isArchived: { $ne: true } }),
      Service.countDocuments({ publicationStatus: 'published' }),
      Industry.countDocuments({ publicationStatus: 'published' }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const enquiriesByDivision = enquiriesByDivisionAgg.map((item) => ({
      division: item._id || 'General / Multi-Division',
      count: item.count,
    }));

    const enquiriesByStatus = [
      { status: 'New', count: newEnquiries },
      { status: 'In Progress', count: inProgressEnquiries },
      { status: 'Responded', count: respondedEnquiries },
      { status: 'Closed', count: closedEnquiries },
    ];

    res.json({
      success: true,
      data: {
        metrics: {
          totalEnquiries,
          newEnquiries,
          inProgressEnquiries,
          respondedEnquiries,
          closedEnquiries,
          publishedProducts,
          draftProducts,
          totalProducts,
          activeDivisions,
          publishedServices,
          publishedIndustries,
        },
        enquiriesByDivision,
        enquiriesByStatus,
        recentEnquiries,
        recentActivity: recentAuditLogs,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. DIVISION MANAGEMENT
// ==========================================
exports.getDivisions = async (_req, res, next) => {
  try {
    const divisions = await Division.find().sort({ displayOrder: 1, createdAt: 1 }).lean();

    // Attach product & enquiry counts so admin sees referential dependencies
    const divisionsWithCounts = await Promise.all(
      divisions.map(async (div) => {
        const [productCount, enquiryCount] = await Promise.all([
          Product.countDocuments({ division: div._id, isArchived: { $ne: true } }),
          Enquiry.countDocuments({ division: div._id, isArchived: { $ne: true } }),
        ]);
        return { ...div, productCount, enquiryCount };
      })
    );

    res.json({
      success: true,
      data: divisionsWithCounts,
    });
  } catch (err) {
    next(err);
  }
};

exports.createDivision = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (!payload.slug && payload.name) {
      payload.slug = slugify(payload.name);
    }
    const division = await Division.create(payload);

    await recordAudit({
      action: 'CREATE_DIVISION',
      entityType: 'Division',
      entityId: division._id,
      summary: `Created division "${division.name}" (${division.slug})`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Division created successfully.',
      data: division,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateDivision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    if (payload.slug) {
      payload.slug = slugify(payload.slug);
    }

    const division = await Division.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found.',
      });
    }

    await recordAudit({
      action: 'UPDATE_DIVISION',
      entityType: 'Division',
      entityId: division._id,
      summary: `Updated division "${division.name}" (status: ${division.publicationStatus})`,
      req,
    });

    res.json({
      success: true,
      message: 'Division updated successfully.',
      data: division,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteDivision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const division = await Division.findById(id);

    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found.',
      });
    }

    // Prevent accidental deletion if division has referenced products or enquiries
    const [referencedProducts, referencedEnquiries] = await Promise.all([
      Product.countDocuments({ division: division._id }),
      Enquiry.countDocuments({ division: division._id }),
    ]);

    if (referencedProducts > 0 || referencedEnquiries > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete division "${division.name}" because it is referenced by ${referencedProducts} product(s) and ${referencedEnquiries} enquiry record(s). Please archive or unpublish the division instead, or reassign its products first.`,
      });
    }

    await division.deleteOne();

    await recordAudit({
      action: 'DELETE_DIVISION',
      entityType: 'Division',
      entityId: id,
      summary: `Deleted unreferenced division "${division.name}"`,
      req,
    });

    res.json({
      success: true,
      message: 'Division deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 3. PRODUCT MANAGEMENT
// ==========================================
exports.getProducts = async (req, res, next) => {
  try {
    const {
      division,
      category,
      publicationStatus,
      featured,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { isArchived: { $ne: true } };

    if (division && division !== 'all') {
      filter.division = division;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (publicationStatus && publicationStatus !== 'all') {
      filter.publicationStatus = publicationStatus;
    }
    if (featured === 'true') {
      filter.isFeatured = true;
    }
    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: regex }, { category: regex }, { shortDescription: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('division', 'name slug code')
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (!payload.slug && payload.name) {
      payload.slug = slugify(payload.name);
    }

    const product = await Product.create(payload);
    const populated = await Product.findById(product._id)
      .populate('division', 'name slug code')
      .lean();

    await recordAudit({
      action: 'CREATE_PRODUCT',
      entityType: 'Product',
      entityId: product._id,
      summary: `Created product "${product.name}" (${product.publicationStatus})`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    if (payload.slug) {
      payload.slug = slugify(payload.slug);
    }

    const product = await Product.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate('division', 'name slug code');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    await recordAudit({
      action: 'UPDATE_PRODUCT',
      entityType: 'Product',
      entityId: product._id,
      summary: `Updated product "${product.name}" (status: ${product.publicationStatus})`,
      req,
    });

    res.json({
      success: true,
      message: 'Product updated successfully.',
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    await product.deleteOne();

    await recordAudit({
      action: 'DELETE_PRODUCT',
      entityType: 'Product',
      entityId: id,
      summary: `Removed product "${product.name}"`,
      req,
    });

    res.json({
      success: true,
      message: 'Product removed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 4. SERVICE MANAGEMENT
// ==========================================
exports.getServices = async (_req, res, next) => {
  try {
    const services = await Service.find()
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

exports.createService = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (!payload.slug && payload.name) {
      payload.slug = slugify(payload.name);
    }

    const service = await Service.create(payload);
    const populated = await Service.findById(service._id)
      .populate('relatedDivisions', 'name slug code')
      .lean();

    await recordAudit({
      action: 'CREATE_SERVICE',
      entityType: 'Service',
      entityId: service._id,
      summary: `Created service category "${service.name}"`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    if (payload.slug) {
      payload.slug = slugify(payload.slug);
    }

    const service = await Service.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate('relatedDivisions', 'name slug code');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    await recordAudit({
      action: 'UPDATE_SERVICE',
      entityType: 'Service',
      entityId: service._id,
      summary: `Updated service "${service.name}" (${service.publicationStatus}, ${service.confirmationStatus})`,
      req,
    });

    res.json({
      success: true,
      message: 'Service updated successfully.',
      data: service,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    await recordAudit({
      action: 'DELETE_SERVICE',
      entityType: 'Service',
      entityId: id,
      summary: `Deleted service "${service.name}"`,
      req,
    });

    res.json({
      success: true,
      message: 'Service deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 5. INDUSTRY MANAGEMENT
// ==========================================
exports.getIndustries = async (_req, res, next) => {
  try {
    const industries = await Industry.find()
      .populate('relatedDivisions', 'name slug code')
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

exports.createIndustry = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (!payload.slug && payload.name) {
      payload.slug = slugify(payload.name);
    }

    const industry = await Industry.create(payload);
    const populated = await Industry.findById(industry._id)
      .populate('relatedDivisions', 'name slug code')
      .lean();

    await recordAudit({
      action: 'CREATE_INDUSTRY',
      entityType: 'Industry',
      entityId: industry._id,
      summary: `Created industry "${industry.name}"`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Industry created successfully.',
      data: populated,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateIndustry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    if (payload.slug) {
      payload.slug = slugify(payload.slug);
    }

    const industry = await Industry.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate('relatedDivisions', 'name slug code');

    if (!industry) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found.',
      });
    }

    await recordAudit({
      action: 'UPDATE_INDUSTRY',
      entityType: 'Industry',
      entityId: industry._id,
      summary: `Updated industry "${industry.name}"`,
      req,
    });

    res.json({
      success: true,
      message: 'Industry updated successfully.',
      data: industry,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteIndustry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const industry = await Industry.findByIdAndDelete(id);
    if (!industry) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found.',
      });
    }

    await recordAudit({
      action: 'DELETE_INDUSTRY',
      entityType: 'Industry',
      entityId: id,
      summary: `Deleted industry "${industry.name}"`,
      req,
    });

    res.json({
      success: true,
      message: 'Industry deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 6. ENQUIRY CRM MANAGEMENT & CSV EXPORT
// ==========================================
function buildEnquiryFilter(query) {
  const {
    status,
    divisionName,
    search,
    startDate,
    endDate,
    archived = 'false',
  } = query;

  const filter = {
    isArchived: archived === 'true',
  };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (divisionName && divisionName !== 'all') {
    filter.divisionName = divisionName;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (search && String(search).trim()) {
    const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { reference: regex },
      { fullName: regex },
      { companyName: regex },
      { email: regex },
      { phone: regex },
      { message: regex },
    ];
  }

  return filter;
}

exports.getEnquiries = async (req, res, next) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const filter = buildEnquiryFilter(req.query);

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Enquiry.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: enquiries,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.exportEnquiriesCsv = async (req, res, next) => {
  try {
    const filter = buildEnquiryFilter(req.query);
    const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 }).lean();

    const escapeCsv = (val) => {
      const str = String(val ?? '').replace(/\r?\n/g, ' ');
      if (str.includes(',') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Reference',
      'Date (ISO)',
      'Status',
      'Full Name',
      'Company Name',
      'Phone',
      'Email',
      'Division',
      'Service Category',
      'Machine / Product Details',
      'Assigned To',
      'Source Page',
      'Requirement / Message',
    ];

    const rows = enquiries.map((e) =>
      [
        e.reference,
        e.createdAt ? new Date(e.createdAt).toISOString() : '',
        e.status,
        e.fullName,
        e.companyName,
        e.phone,
        e.email,
        e.divisionName,
        e.serviceCategory,
        e.machineOrProductDetails,
        e.assignedTo,
        e.sourcePage,
        e.message,
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');

    await recordAudit({
      action: 'EXPORT_ENQUIRIES_CSV',
      entityType: 'Enquiry',
      summary: `Exported ${enquiries.length} enquiry record(s) to CSV`,
      req,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="modu-pro-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
};

exports.getEnquiryById = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id).lean();
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry record not found.',
      });
    }
    res.json({
      success: true,
      data: enquiry,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, isArchived, statusNote } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry record not found.',
      });
    }

    const previousStatus = enquiry.status;
    if (status && ['New', 'In Progress', 'Responded', 'Closed'].includes(status)) {
      enquiry.status = status;
      if (status !== previousStatus) {
        enquiry.statusHistory.push({
          status,
          changedBy: req.admin ? `${req.admin.name} (${req.admin.email})` : 'Admin',
          note: statusNote || `Status changed from ${previousStatus} to ${status}`,
          changedAt: new Date(),
        });
      }
    }

    if (typeof assignedTo === 'string') {
      enquiry.assignedTo = assignedTo.trim();
    }

    if (typeof isArchived === 'boolean') {
      enquiry.isArchived = isArchived;
    }

    await enquiry.save();

    await recordAudit({
      action: 'UPDATE_ENQUIRY',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      summary: `Updated enquiry ${enquiry.reference} (status: ${enquiry.status}, archived: ${enquiry.isArchived})`,
      req,
    });

    res.json({
      success: true,
      message: 'Enquiry updated successfully.',
      data: enquiry,
    });
  } catch (err) {
    next(err);
  }
};

exports.addEnquiryInternalNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !String(note).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Internal note text is required.',
      });
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry record not found.',
      });
    }

    enquiry.internalNotes.push({
      note: String(note).trim(),
      authorName: req.admin?.name || 'Administrator',
      authorEmail: req.admin?.email || '',
      createdAt: new Date(),
    });

    await enquiry.save();

    await recordAudit({
      action: 'ADD_ENQUIRY_NOTE',
      entityType: 'Enquiry',
      entityId: enquiry._id,
      summary: `Added internal note to enquiry ${enquiry.reference}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Internal note added.',
      data: enquiry,
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 7. MEDIA LIBRARY MANAGEMENT
// ==========================================
exports.getMediaLibrary = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    const media = await Media.find(filter).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: media,
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadMedia = async (req, res, next) => {
  try {
    const { title, altText = '', category = 'product', externalUrl } = req.body;

    // Allow either file upload (multipart/form-data) or registering an approved asset URL
    if (!req.file && !externalUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid image file to upload.',
      });
    }

    let finalUrl = externalUrl || '';
    let publicId = '';
    let storageProvider = 'local';
    let mimeType = req.file?.mimetype || 'image/png';
    let sizeBytes = req.file?.size || 0;

    if (req.file) {
      if (isCloudinaryConfigured()) {
        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          folder: 'modu-pro',
          resource_type: 'image',
        });
        finalUrl = uploaded.secure_url;
        publicId = uploaded.public_id;
        storageProvider = 'cloudinary';
        // Remove temporary local file after Cloudinary upload
        fs.unlink(req.file.path, () => {});
      } else {
        finalUrl = `/uploads/${req.file.filename}`;
        publicId = req.file.filename;
        storageProvider = 'local';
      }
    }

    const mediaDoc = await Media.create({
      title:
        title && String(title).trim()
          ? String(title).trim()
          : req.file?.originalname || 'Uploaded Image Asset',
      altText: String(altText || title || '').trim(),
      url: finalUrl,
      publicId,
      storageProvider,
      mimeType,
      sizeBytes,
      category,
      uploadedBy: req.admin?.email || 'Administrator',
    });

    await recordAudit({
      action: 'UPLOAD_MEDIA',
      entityType: 'Media',
      entityId: mediaDoc._id,
      summary: `Uploaded media asset "${mediaDoc.title}" (${mediaDoc.storageProvider})`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Media asset uploaded successfully.',
      data: mediaDoc,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mediaDoc = await Media.findById(id);

    if (!mediaDoc) {
      return res.status(404).json({
        success: false,
        message: 'Media asset not found.',
      });
    }

    if (mediaDoc.storageProvider === 'cloudinary' && mediaDoc.publicId && isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(mediaDoc.publicId).catch(() => {});
    } else if (mediaDoc.storageProvider === 'local' && mediaDoc.publicId) {
      const localPath = path.resolve(__dirname, '../../uploads', path.basename(mediaDoc.publicId));
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    await mediaDoc.deleteOne();

    await recordAudit({
      action: 'DELETE_MEDIA',
      entityType: 'Media',
      entityId: id,
      summary: `Removed media asset "${mediaDoc.title}"`,
      req,
    });

    res.json({
      success: true,
      message: 'Media asset removed.',
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 8. SITE SETTINGS MANAGEMENT
// ==========================================
exports.getSiteSettings = async (_req, res, next) => {
  try {
    let settings = await SiteSettings.findOne({ singletonKey: 'default' }).lean();
    if (!settings) {
      settings = await SiteSettings.create({ singletonKey: 'default' });
      settings = settings.toObject();
    }
    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSiteSettings = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    delete payload._id;
    delete payload.singletonKey;

    const settings = await SiteSettings.findOneAndUpdate(
      { singletonKey: 'default' },
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    );

    await recordAudit({
      action: 'UPDATE_SITE_SETTINGS',
      entityType: 'SiteSettings',
      entityId: settings._id,
      summary: 'Updated global site settings & contact configuration',
      req,
    });

    res.json({
      success: true,
      message: 'Site settings saved successfully.',
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};
