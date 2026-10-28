const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: 'default',
      unique: true,
    },
    companyName: {
      type: String,
      default: 'Modu Pro Innovation Pvt. Ltd.',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Faithfully Delivering Excellence',
      trim: true,
    },
    adhesiBrandSpelling: {
      type: String,
      default: 'Adhesi Pro',
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '/assets/logo/modu-pro-logo.png',
      trim: true,
    },
    contact: {
      address: {
        type: String,
        default: 'Plot No. 27, Hanuman Daal Mill Road, opposite Royal Touch, Nagpur – 440008',
        trim: true,
      },
      email: {
        type: String,
        default: 'moduproinnovations2805@gmail.com',
        trim: true,
      },
      phones: {
        type: [String],
        default: ['+91 86230 41894', '+91 86258 32095'],
      },
      businessHours: {
        type: String,
        default: 'Monday – Saturday: 10:00 AM – 7:00 PM IST (Subject to Client Confirmation)',
        trim: true,
      },
      isContactVerified: {
        type: Boolean,
        default: false,
      },
      mapEmbedUrl: {
        type: String,
        default: '',
        trim: true,
      },
    },
    notification: {
      enquiryRecipientEmail: {
        type: String,
        default: 'moduproinnovations2805@gmail.com',
        trim: true,
      },
      sendCustomerAcknowledgement: {
        type: Boolean,
        default: true,
      },
    },
    hero: {
      heading: {
        type: String,
        default: 'Complete Solutions for Woodworking and Modular Industries',
        trim: true,
      },
      supportingText: {
        type: String,
        default:
          'Modu Pro Innovation Pvt. Ltd. brings together adhesive products, precision woodworking blades, panel-processing machinery and furniture hardware to support manufacturers across the woodworking and modular-furniture industry.',
        trim: true,
      },
      primaryCtaLabel: {
        type: String,
        default: 'Explore Our Divisions',
        trim: true,
      },
      secondaryCtaLabel: {
        type: String,
        default: 'Discuss Your Requirement',
        trim: true,
      },
    },
    aboutContent: {
      overviewParagraphOne: {
        type: String,
        default:
          'Modu Pro Innovation Pvt. Ltd. serves the needs of modular furniture, kitchen, door and woodworking manufacturers through a focused range of products and industry solutions. The company brings together adhesive products, woodworking blades, panel-processing machinery and furniture hardware under one business, helping customers explore related products and services through a single point of contact.',
        trim: true,
      },
      overviewParagraphTwo: {
        type: String,
        default:
          'Our goal is to support manufacturers with relevant products, dependable communication and practical assistance for their woodworking requirements.',
        trim: true,
      },
      approachText: {
        type: String,
        default:
          'Every manufacturing floor operates with distinct panel substrates, production volumes, and machinery setups. Rather than offering generic off-the-shelf packages, our four divisions coordinate to help furniture, kitchen, and door manufacturers identify suitable adhesives, tooling, panel-processing equipment, spare parts, and hardware fittings through structured consultation.',
        trim: true,
      },
    },
    footer: {
      summaryText: {
        type: String,
        default:
          'Integrated industrial solutions across Adhesi Pro adhesives, PCD & TCT woodworking saw blades, panel-processing machinery, and PVC edge-banding tapes & furniture hardware.',
        trim: true,
      },
      copyrightText: {
        type: String,
        default: '© Modu Pro Innovation Pvt. Ltd. All rights reserved.',
        trim: true,
      },
    },
    socialLinks: {
      linkedin: { type: String, default: '', trim: true },
      instagram: { type: String, default: '', trim: true },
      youtube: { type: String, default: '', trim: true },
      whatsapp: { type: String, default: '+918623041894', trim: true },
    },
    seoDefaults: {
      defaultTitle: {
        type: String,
        default: 'Modu Pro Innovation Pvt. Ltd. | Complete Solutions for Woodworking & Modular Industries',
        trim: true,
      },
      defaultDescription: {
        type: String,
        default:
          'Modu Pro Innovation Pvt. Ltd. supplies industrial woodworking adhesives (Adhesi Pro), PCD pre-milling & grooving saw blades, panel-processing machinery, and PVC edge-banding tapes & furniture hardware in Nagpur, India.',
        trim: true,
      },
      canonicalBaseUrl: {
        type: String,
        default: 'https://modupro.in',
        trim: true,
      },
    },
    privacyNotice: {
      type: String,
      default:
        'Information submitted through our enquiry forms is used solely by Modu Pro Innovation Pvt. Ltd. to review and respond to your business requirement and route your enquiry to the relevant division.',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
