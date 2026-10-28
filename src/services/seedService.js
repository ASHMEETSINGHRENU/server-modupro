const Division = require('../models/Division');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Industry = require('../models/Industry');
const Media = require('../models/Media');
const SiteSettings = require('../models/SiteSettings');

async function seedIfEmpty({ force = false } = {}) {
  if (force) {
    await Promise.all([
      Division.deleteMany({}),
      Product.deleteMany({}),
      Service.deleteMany({}),
      Industry.deleteMany({}),
      Media.deleteMany({ storageProvider: 'static_asset' }),
      SiteSettings.deleteMany({}),
    ]);
  }

  await Promise.all([
    Division.syncIndexes(),
    Product.syncIndexes(),
    Service.syncIndexes(),
    Industry.syncIndexes(),
    Media.syncIndexes(),
    SiteSettings.syncIndexes(),
  ]);

  // 1. Ensure singleton SiteSettings
  let settings = await SiteSettings.findOne({ singletonKey: 'default' });
  if (!settings) {
    settings = await SiteSettings.create({ singletonKey: 'default' });
  }

  // 2. Check if Divisions already exist
  const existingDivisionsCount = await Division.countDocuments();
  if (existingDivisionsCount > 0 && !force) {
    return { seeded: false, message: 'Database already contains initial Modu Pro data.' };
  }

  // 3. Create the Four Core Divisions (Section 9 & 10 of Master Prompt)
  const divisionsData = [
    {
      name: 'Adhesi Pro',
      slug: 'adhesi-pro',
      code: '01',
      subtitle: 'Industrial Woodworking & Modular Furniture Adhesives',
      brandSpellingNote:
        'Configured provisionally as "Adhesi Pro" (brochure packaging also displays "Adhhesi Pro"). Editable via Site Settings.',
      shortDescription:
        'Adhesi Pro is the adhesive brand associated with Modu Pro Innovation Pvt. Ltd. The product range supports furniture, modular-kitchen, door and woodworking applications.',
      fullDescription:
        'Adhesi Pro is the adhesive brand associated with Modu Pro Innovation Pvt. Ltd. The product range supports furniture, modular-kitchen, door and woodworking applications. Formulated for reliable industrial bonding across wood-based panels, laminates, veneers, and edge treatments, the Adhesi Pro portfolio enables manufacturers to source their primary assembly and lamination adhesives through a single point of contact.',
      heroImage: '/assets/products/adhesi-pro/lockpro-wr3-drum.png',
      coverImage: '/assets/products/adhesi-pro/lockpro-808-drum.png',
      categories: [
        'PVAC White Glue',
        'D3 and Commercial D3 Adhesives',
        'D2 Adhesives',
        'PVC/Acrylic Adhesives',
        'PUR Adhesives',
      ],
      applications: [
        'Modular Furniture Carcass & Panel Lamination',
        'Modular Kitchen Water-Resistant Wood Bonding',
        'Flush Door & Engineered Door Assembly',
        'PVC, Acrylic & Veneer Surface Pressing',
      ],
      serviceHighlights: [
        'Application selection guidance based on substrate and pressing method',
        'Bulk drum and industrial bucket packaging options',
        'Direct coordination with panel-processing and pressing workflows',
      ],
      faqs: [
        {
          question: 'Which adhesive categories are offered under the Adhesi Pro brand?',
          answer:
            'The Adhesi Pro range covers PVAC white glue, D3 and Commercial D3 adhesives, D2 adhesives, PVC/Acrylic adhesives, and moisture-curing PUR adhesives for furniture, modular kitchen, door, and woodworking applications.',
          isApproved: true,
        },
        {
          question: 'How can manufacturers request product suitability details for a specific substrate?',
          answer:
            'Submit an enquiry specifying your panel material, laminate or edge finish, and pressing equipment (cold press, hot press, or manual assembly), and our Adhesi Pro division team will guide you to the appropriate product.',
          isApproved: true,
        },
      ],
      displayOrder: 1,
      publicationStatus: 'published',
      seo: {
        metaTitle: 'Adhesi Pro Division | Industrial Woodworking & Modular Furniture Adhesives',
        metaDescription:
          'Explore Adhesi Pro adhesives from Modu Pro Innovation Pvt. Ltd., including PVAC white glue, D3/D2 adhesives, Lockpro WR 3, Lockpro 808, Lockpro 707, and PUR adhesives.',
      },
    },
    {
      name: 'PCD Pre-Milling & Grooving Saw Blades',
      slug: 'pcd-blades',
      code: '02',
      subtitle: 'TCT & PCD Precision Tooling for Panel Processing',
      shortDescription:
        'Explore PCD pre-milling and grooving saw-blade solutions for woodworking and panel-processing applications. This division presents the blade range and helps manufacturers enquire about products suited to their machinery and processing requirements.',
      fullDescription:
        'Explore PCD pre-milling and grooving saw-blade solutions for woodworking and panel-processing applications. This division presents the blade range and helps manufacturers enquire about products suited to their machinery and processing requirements. Supporting both TCT (Tungsten Carbide Tipped) and PCD (Polycrystalline Diamond) tooling requirements, our team works with manufacturers to match cutting tools with their specific panel saws, edge banders, and routing equipment.',
      heroImage: '/assets/products/pcd-blades/pre-milling-cutters.png',
      coverImage: '/assets/products/pcd-blades/grooving-saw-blade.png',
      categories: [
        'PCD Pre-Milling Cutters',
        'Grooving Saw Blades',
        'TCT Panel-Saw Blades',
        'PCD Panel-Saw Blades',
      ],
      applications: [
        'Pre-milling panel edges prior to automated edge banding',
        'Precision grooving and slot cutting on laminated boards',
        'Sizing and dividing engineered wood panels on sliding table and beam saws',
        'High-volume modular furniture and door panel preparation',
      ],
      serviceHighlights: [
        'Consultation to match blade type (TCT or PCD) to panel material and machine spindle',
        'Coordinated tooling supply alongside panel-processing machinery',
        'Enquiry-based verification of bore sizes, diameters, and tooth profiles prior to order',
      ],
      faqs: [
        {
          question: 'Does Modu Pro supply both TCT and PCD panel-saw and grooving blades?',
          answer:
            'Yes. We support woodworking and panel-processing operations with panel-saw blades in both TCT and PCD configurations, as well as pre-milling cutters and grooving saw blades.',
          isApproved: true,
        },
        {
          question: 'How do I confirm compatibility with my existing panel saw or edge bander?',
          answer:
            'Use the division enquiry form to share your machine type and material requirements. Exact blade dimensions, bore sizes, and tooth geometry are confirmed with your team prior to supply.',
          isApproved: true,
        },
      ],
      displayOrder: 2,
      publicationStatus: 'published',
      seo: {
        metaTitle: 'PCD Pre-Milling & Grooving Saw Blades | Modu Pro Innovation Pvt. Ltd.',
        metaDescription:
          'Explore PCD pre-milling cutters, grooving saw blades, and TCT & PCD panel-saw blades for woodworking and modular furniture manufacturing.',
      },
    },
    {
      name: 'Panel Processing Machines Division',
      slug: 'panel-processing',
      code: '03',
      subtitle: 'Woodworking Machinery, Spare Parts & Technical Service Support',
      shortDescription:
        'Modu Pro Innovation Pvt. Ltd. supports woodworking operations with panel-processing machinery, related spare parts and service support.',
      fullDescription:
        'Modu Pro Innovation Pvt. Ltd. supports woodworking operations with panel-processing machinery, related spare parts and service support. From sizing and edge banding to CNC routing, drilling, and laminate pressing, this division helps modular furniture, kitchen, and door manufacturers equip and maintain reliable production lines with ongoing technical assistance.',
      heroImage: '/assets/products/panel-processing/edge-banding-machine.png',
      coverImage: '/assets/products/panel-processing/cnc-nesting-machine.png',
      categories: [
        'Edge-Banding Machines',
        'CNC Machines',
        'Panel-Saw Machines',
        'Cold/Hot-Press Machines',
        'Multi-Boring & Drilling Machines',
        'Machinery Spare Parts & Service Support',
      ],
      applications: [
        'Automated panel sizing and precision crosscutting',
        'Industrial edge banding for modular cabinets and wardrobes',
        'CNC nesting, routing, profiling, and multi-row dowel/hinge boring',
        'Hydraulic cold and hot pressing for doors and laminated boards',
      ],
      serviceHighlights: [
        'Machine installation support',
        'Preventive maintenance & troubleshooting',
        'Mechanical, electrical, and computerized-control servicing',
        'Dedicated machinery spare-parts supply',
      ],
      faqs: [
        {
          question: 'What types of panel-processing machinery are covered by this division?',
          answer:
            'Our machinery division covers edge-banding machines, CNC machines, panel-saw machines, cold/hot-press machines, and multi-boring equipment, alongside related spare parts and technical servicing.',
          isApproved: true,
        },
        {
          question: 'Can we enquire solely for spare parts or maintenance on existing woodworking machinery?',
          answer:
            'Yes. You can submit an enquiry specifying your machine details and required spare parts or service support (installation, preventive maintenance, troubleshooting, mechanical/electrical repair, or computerized-control servicing).',
          isApproved: true,
        },
      ],
      displayOrder: 3,
      publicationStatus: 'published',
      seo: {
        metaTitle: 'Panel Processing Machines Division | Woodworking Machinery & Service',
        metaDescription:
          'Edge-banding machines, CNC routers, panel-saw machines, cold/hot-press machines, spare parts, and technical servicing from Modu Pro Innovation Pvt. Ltd.',
      },
    },
    {
      name: 'PVC Edge-Banding Tapes & Hardware',
      slug: 'edge-banding-hardware',
      code: '04',
      subtitle: 'Edge-Banding Finishes & Modular Furniture Fittings',
      shortDescription:
        'This division brings together PVC edge-banding tapes and selected furniture fittings used in modular furniture and kitchen applications.',
      fullDescription:
        'This division brings together PVC edge-banding tapes and selected furniture fittings used in modular furniture and kitchen applications. By combining woodgrain and solid-colour PVC edge tapes with essential architectural hardware—including 2D and 3D hinges, telescopic drawer channels, Mini Fix connectors, cam fittings, nylon bushes, and bolts—Modu Pro streamlines procurement for furniture and kitchen manufacturers.',
      heroImage: '/assets/products/edge-banding-hardware/pvc-woodgrain-tape.png',
      coverImage: '/assets/products/edge-banding-hardware/telescopic-drawer-channels.png',
      categories: [
        'PVC Edge-Banding Tapes',
        '2D and 3D Hinges',
        'Telescopic Channels',
        'Mini Fix Fittings',
        'Cam Fittings',
        'Nylon Bushes',
        'Bolts and Related Fittings',
      ],
      applications: [
        'Protective and decorative edge sealing on modular cabinets and shutters',
        'Concealed cabinet door hanging with 2D/3D adjustable hinges',
        'Smooth drawer extension in modular kitchens and office furniture',
        'Knock-down (KD) carcass assembly using Mini Fix, cam locks, nylon bushes, and bolts',
      ],
      serviceHighlights: [
        'Woodgrain and solid-colour PVC edge-banding tape options',
        'Coordinated supply with Adhesi Pro edge-banding adhesives and machines',
        'Consolidated hardware sourcing for modular furniture production lines',
      ],
      faqs: [
        {
          question: 'What hardware fittings are available alongside PVC edge-banding tapes?',
          answer:
            'We supply 2D and 3D hinges, spring flap hinges, telescopic drawer channels, Mini Fix fittings, cam fittings, nylon bushes, and connecting bolts for modular furniture and kitchen assembly.',
          isApproved: true,
        },
        {
          question: 'How can we check available tape colours, widths, and hardware finishes?',
          answer:
            'Send an enquiry through this division page with your required shade, tape thickness/width, or hardware fitting requirement, and our team will share current confirmed options.',
          isApproved: true,
        },
      ],
      displayOrder: 4,
      publicationStatus: 'published',
      seo: {
        metaTitle: 'PVC Edge-Banding Tapes & Furniture Hardware | Modu Pro Innovation',
        metaDescription:
          'PVC edge-banding tapes, 2D and 3D hinges, telescopic channels, Mini Fix fittings, cam fittings, nylon bushes, and bolts for modular furniture manufacturers.',
      },
    },
  ];

  const createdDivisions = await Division.insertMany(divisionsData);
  const divMap = {};
  for (const d of createdDivisions) {
    divMap[d.slug] = d._id;
  }

  // 4. Create Products using the exact 20 authentic product images & report-verified items
  const productsData = [
    // --- DIVISION 1: ADHESI PRO ---
    {
      name: 'Lockpro WR 3 (D3 Water-Resistant Adhesive)',
      slug: 'lockpro-wr-3',
      division: divMap['adhesi-pro'],
      category: 'D3 and Commercial D3 Adhesives',
      shortDescription:
        'Water-resistant woodworking adhesive formulated for modular kitchen, door, and furniture bonding applications.',
      fullDescription:
        'Lockpro WR 3 is a key D3 adhesive offering under the Adhesi Pro brand associated with Modu Pro Innovation Pvt. Ltd. Available in both industrial drum and bucket packaging, it supports furniture, modular-kitchen, door, and general woodworking assembly where dependable water-resistant bonding and coverage are required.',
      images: [
        {
          url: '/assets/products/adhesi-pro/lockpro-wr3-drum.png',
          alt: 'Adhesi Pro Lockpro WR 3 Drum Packaging',
          isPrimary: true,
        },
        {
          url: '/assets/products/adhesi-pro/lockpro-wr3-bucket.png',
          alt: 'Adhesi Pro Lockpro WR 3 Bucket Packaging',
          isPrimary: false,
        },
      ],
      specifications: [
        { label: 'Brand Line', value: 'Adhesi Pro — Lockpro Series', isVerified: true },
        { label: 'Adhesive Classification', value: 'D3 Water-Resistant Adhesive', isVerified: true },
        { label: 'Packaging Formats Shown', value: 'Industrial Drum & Pail Bucket', isVerified: true },
      ],
      applications: [
        'Modular kitchen cabinetry and moisture-prone furniture zones',
        'Flush door and engineered wood lamination',
        'High-coverage woodworking assembly',
      ],
      highlights: ['Extra Coverage', 'Extra Durability', 'Fast Dry', 'Extreme Bond'],
      isFeatured: true,
      publicationStatus: 'published',
      displayOrder: 1,
    },
    {
      name: 'Lockpro 808 Industrial Woodworking Adhesive',
      slug: 'lockpro-808',
      division: divMap['adhesi-pro'],
      category: 'PVAC White Glue',
      shortDescription:
        'High-strength industrial woodworking adhesive engineered for spreadability, durability, and reliable panel assembly.',
      fullDescription:
        'Lockpro 808 from Adhesi Pro is formulated for modular furniture, door, and woodworking manufacturers seeking dependable bond strength and consistent spreadability across panel and laminate joints.',
      images: [
        {
          url: '/assets/products/adhesi-pro/lockpro-808-drum.png',
          alt: 'Adhesi Pro Lockpro 808 Industrial Drum',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Brand Line', value: 'Adhesi Pro — Lockpro Series', isVerified: true },
        { label: 'Product Code', value: 'Lockpro 808', isVerified: true },
        { label: 'Packaging Format Shown', value: 'Industrial Drum Container', isVerified: true },
      ],
      applications: [
        'Modular furniture panel lamination',
        'Wood-to-wood and laminate-to-substrate assembly',
        'General industrial woodworking',
      ],
      highlights: ['Extreme Bond', 'Extra Durability', 'Extra Spreadability'],
      isFeatured: true,
      publicationStatus: 'published',
      displayOrder: 2,
    },
    {
      name: 'Lockpro 808 PR Fast-Drying Adhesive',
      slug: 'lockpro-808-pr',
      division: divMap['adhesi-pro'],
      category: 'D3 and Commercial D3 Adhesives',
      shortDescription:
        'Fast-drying industrial adhesive with heat resistance and high spreadability for demanding production schedules.',
      fullDescription:
        'Lockpro 808 PR is part of the Adhesi Pro woodworking adhesive lineup, packaged in convenient handled industrial buckets and designed for woodworking operations requiring fast drying, heat resistance, and smooth spreadability.',
      images: [
        {
          url: '/assets/products/adhesi-pro/lockpro-808-pr-bucket.png',
          alt: 'Adhesi Pro Lockpro 808 PR Bucket',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Brand Line', value: 'Adhesi Pro — Lockpro Series', isVerified: true },
        { label: 'Product Code', value: 'Lockpro 808 PR', isVerified: true },
        { label: 'Packaging Format Shown', value: 'Industrial Pail Bucket with Handle', isVerified: true },
      ],
      applications: [
        'Fast-cycle furniture and cabinet lamination',
        'Laminate pressing and general joinery',
      ],
      highlights: ['Extreme Bond', 'Fast Drying', 'Extra Spreadability', 'Heat Resistance'],
      isFeatured: false,
      publicationStatus: 'published',
      displayOrder: 3,
    },
    {
      name: 'LockPro 707 Woodworking Adhesive',
      slug: 'lockpro-707',
      division: divMap['adhesi-pro'],
      category: 'D2 Adhesives',
      shortDescription:
        'Dependable woodworking adhesive formulated for high spreadability and consistent interior furniture bonding.',
      fullDescription:
        'LockPro 707 supports interior modular furniture, panel lamination, and woodworking assembly requirements with balanced spreadability and dependable bond performance.',
      images: [
        {
          url: '/assets/products/adhesi-pro/lockpro-707-drum.png',
          alt: 'Adhesi Pro LockPro 707 Drum',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Brand Line', value: 'Adhesi Pro — Lockpro Series', isVerified: true },
        { label: 'Product Code', value: 'LockPro 707', isVerified: true },
        { label: 'Packaging Format Shown', value: 'Industrial Drum Container', isVerified: true },
      ],
      applications: [
        'Interior modular furniture assembly',
        'HPL/laminate pressing onto plywood, MDF, and particle board',
      ],
      highlights: ['Extreme Bond', 'Extra Spreadability'],
      isFeatured: false,
      publicationStatus: 'published',
      displayOrder: 4,
    },
    {
      name: 'Adhesi Pro 1K PUR Moisture-Curing Polyurethane Adhesive',
      slug: 'adhesi-pro-1k-pur',
      division: divMap['adhesi-pro'],
      category: 'PUR Adhesives',
      shortDescription:
        'Single-component moisture-curing polyurethane adhesive in an applicator nozzle bottle for waterproof, all-weather bonding.',
      fullDescription:
        'Adhesi Pro 1K PUR is a moisture-curing polyurethane adhesive designed for precision woodworking, door manufacturing, and water-exposed furniture joints.',
      images: [
        {
          url: '/assets/products/adhesi-pro/1k-pur-adhesive.png',
          alt: 'Adhesi Pro 1K PUR Moisture Curing Polyurethane Adhesive Bottle',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Chemistry', value: '1K Moisture-Curing Polyurethane (PUR)', isVerified: true },
        { label: 'Format', value: 'Applicator Bottle with Nozzle', isVerified: true },
      ],
      applications: [
        'Waterproof wood and door joint assembly',
        'Specialized furniture and joinery applications',
      ],
      highlights: ['Waterproof', 'All Weather', 'Non Hazardous'],
      isFeatured: true,
      publicationStatus: 'published',
      displayOrder: 5,
    },
    {
      name: 'VUS Adhesive (PVC / Acrylic Bonding Solution)',
      slug: 'vus-adhesive',
      division: divMap['adhesi-pro'],
      category: 'PVC/Acrylic Adhesives',
      shortDescription:
        'Specialized adhesive solution referenced in the Adhesi Pro portfolio for PVC, acrylic, and decorative surface bonding.',
      fullDescription:
        'VUS Adhesive is part of the Adhesi Pro range supporting PVC, acrylic, and decorative sheet bonding across modular kitchen shutters, wardrobe panels, and interior woodwork. Enquire with our team to confirm grade suitability for your specific substrate.',
      images: [
        {
          url: '/assets/products/adhesi-pro/lockpro-808-pr-bucket.png',
          alt: 'Adhesi Pro VUS Adhesive Representative Packaging',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Brand Line', value: 'Adhesi Pro', isVerified: true },
        { label: 'Category', value: 'PVC/Acrylic & Specialty Adhesives', isVerified: true },
      ],
      applications: [
        'PVC and acrylic laminate bonding',
        'Decorative panel and shutter lamination',
      ],
      highlights: ['Suited for PVC & Acrylic Surface Applications'],
      isFeatured: false,
      publicationStatus: 'published',
      displayOrder: 6,
    },

    // --- DIVISION 2: PCD PRE-MILLING & GROOVING SAW BLADES ---
    {
      name: 'Pre-Milling & Spindle Moulder Cutters',
      slug: 'pcd-pre-milling-cutters',
      division: divMap['pcd-blades'],
      category: 'PCD Pre-Milling Cutters',
      shortDescription:
        'Industrial pre-milling and profile cutter sets engineered for clean, chip-free panel edge preparation prior to edge banding.',
      fullDescription:
        'Precision pre-milling and spindle moulder cutters designed for panel-processing lines and automatic edge banders. Enquire to verify cutter dimensions, bore size, and machine compatibility for your edge-banding or moulding setup.',
      images: [
        {
          url: '/assets/products/pcd-blades/pre-milling-cutters.png',
          alt: 'YASH Industrial Woodworking Pre-Milling & Profile Cutters',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Tooling Category', value: 'Pre-Milling & Profile Cutters', isVerified: true },
        { label: 'Dimensions & Bore Compatibility', value: 'Confirmed upon enquiry per machine setup', isVerified: false },
      ],
      applications: [
        'Edge preparation before PVC edge-banding application',
        'Spindle moulding and panel edge profiling',
      ],
      highlights: ['Precision Balanced Cutter Body', 'Industrial Woodworking Grade'],
      isFeatured: true,
      publicationStatus: 'published',
      displayOrder: 1,
    },
    {
      name: 'Industrial Grooving & Slot Cutter Saw Blade (TCT / PCD)',
      slug: 'industrial-grooving-saw-blade',
      division: divMap['pcd-blades'],
      category: 'Grooving Saw Blades',
      shortDescription:
        'Precision grooving and panel-saw blade solutions available in TCT and PCD configurations for panel-processing applications.',
      fullDescription:
        'Designed for accurate grooving, slotting, and panel sizing across laminated particle board, MDF, and plywood. Modu Pro supplies grooving and panel-saw blades in TCT and PCD options tailored to your machinery and processing requirements.',
      images: [
        {
          url: '/assets/products/pcd-blades/grooving-saw-blade.png',
          alt: 'YASH Industrial Grooving Saw Blade',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Available Tooling Materials', value: 'TCT and PCD Configurations', isVerified: true },
        { label: 'Application Type', value: 'Grooving & Panel Processing', isVerified: true },
      ],
      applications: [
        'Back-panel grooving in modular cabinets and drawers',
        'Precision slot cutting and panel sizing',
      ],
      highlights: ['TCT & PCD Options Available', 'Clean Kerf & Groove Finish'],
      isFeatured: true,
      publicationStatus: 'published',
      displayOrder: 2,
    },

    // --- DIVISION 3: PANEL PROCESSING MACHINES DIVISION ---
    {
      name: 'Automatic Industrial Edge-Banding Machine',
      slug: 'automatic-edge-banding-machine',
      division: divMap['panel-processing'],
      category: 'Edge-Banding Machines',
      shortDescription:
        'Enclosed industrial edge-banding machine with swiveling touchscreen operator console for modular furniture and kitchen panel finishing.',
      fullDescription:
        'Part of Modu Pro Innovation Pvt. Ltd.’s Panel Processing Machines Division, this automatic edge-banding machine supports continuous edge tape application, trimming, and finishing for modular furniture, kitchen, and door manufacturers, backed by spare parts and technical service support.',
      images: [
        {
          url: '/assets/products/panel-processing/edge-banding-machine.png',
          alt: 'Automatic Industrial Edge-Banding Machine',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Machine Category', value: 'Edge-Banding Machines', isVerified: true },
        { label: 'Service & Spare Parts', value: 'Supported by Modu Pro Panel Processing Division', isVerified: true },
      ],
      applications: [
        'Applying PVC and woodgrain edge-banding tapes to furniture panels',
        'Continuous cabinet, wardrobe, and shutter edge finishing',
      ],
      highlights: ['Swivel Touchscreen Control Panel', 'Enclosed Industrial Safety Cabin', 'Spare Parts & Service Support'],
      isFeatured: true,
      publicationStatus: 'published',
      displayOrder: 1,
    },
    {
      name: 'Dual-Spindle CNC Router & Nesting Machine',
      slug: 'dual-spindle-cnc-machine',
      division: divMap['panel-processing'],
      category: 'CNC Machines',
      shortDescription:
        'Heavy-duty flatbed CNC routing and nesting machine with standalone control cabinet for precision panel cutting, profiling, and door machining.',
      fullDescription:
        'Engineered for woodworking and panel-processing facilities, this dual-spindle CNC machine supports automated panel nesting, decorative door routing, and precision contour cutting, complete with Modu Pro installation, troubleshooting, and computerized-control servicing support.',
      images: [
        {
          url: '/assets/products/panel-processing/cnc-nesting-machine.png',
          alt: 'Dual-Spindle CNC Router & Nesting Machine',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Machine Category', value: 'CNC Machines', isVerified: true },
        { label: 'Spindle Configuration Shown', value: 'Dual Vertical Spindles with Dedicated Control Cabinet', isVerified: true },
      ],
      applications: [
        '2D/3D door panel routing and profiling',
        'Full-sheet nesting for modular furniture and kitchen cabinets',
      ],
      highlights: ['Dual-Spindle Gantry Architecture', 'Standalone Control Unit', 'Computerized-Control Servicing Available'],
      isFeatured: true,
      publicationStatus: 'published',
      displayOrder: 2,
    },
    {
      name: 'Sliding Table Panel-Saw Machine',
      slug: 'sliding-table-panel-saw-machine',
      division: divMap['panel-processing'],
      category: 'Panel-Saw Machines',
      shortDescription:
        'Precision sliding table panel saw with anodized aluminum carriage, outrigger crosscut fence, and overhead blade dust hood.',
      fullDescription:
        'Designed for accurate sizing of MDF, HDF, particle board, and plywood sheets in modular furniture and woodworking workshops. Compatible with our TCT and PCD panel-saw blade range.',
      images: [
        {
          url: '/assets/products/panel-processing/sliding-table-panel-saw.png',
          alt: 'Sliding Table Panel-Saw Machine',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Machine Category', value: 'Panel-Saw Machines', isVerified: true },
        { label: 'Carriage Type', value: 'Sliding Table with Outrigger Support Arm', isVerified: true },
      ],
      applications: [
        'Rip and crosscut sizing of laminated and raw wood panels',
        'Precision squaring for modular cabinets and doors',
      ],
      highlights: ['Smooth Anodized Sliding Carriage', 'Overhead Blade Guard & Dust Hood', 'Compatible with TCT & PCD Blades'],
      isFeatured: false,
      publicationStatus: 'published',
      displayOrder: 3,
    },
    {
      name: 'Hydraulic Cold/Hot-Press Machine',
      slug: 'hydraulic-cold-hot-press-machine',
      division: divMap['panel-processing'],
      category: 'Cold/Hot-Press Machines',
      shortDescription:
        'Heavy-duty hydraulic platen press for uniform laminate pressing, flush door manufacturing, and panel bonding.',
      fullDescription:
        'Supporting door manufacturers and panel laminators, our cold/hot-press machinery works seamlessly alongside Adhesi Pro lamination adhesives to deliver uniform pressing across full-size boards and doors.',
      images: [
        {
          url: '/assets/products/panel-processing/hydraulic-cold-press.png',
          alt: 'Hydraulic Cold Press Machine for Wood Panels and Doors',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Machine Category', value: 'Cold/Hot-Press Machines', isVerified: true },
        { label: 'Actuation', value: 'Dual-Cylinder Hydraulic Down-Stroke Platen', isVerified: true },
      ],
      applications: [
        'Flush door and engineered door pressing',
        'High-pressure laminate (HPL), veneer, and PVC/acrylic sheet bonding',
      ],
      highlights: ['Heavy-Duty Welded Frame', 'Integrated Pressure Gauge & Control Box'],
      isFeatured: false,
      publicationStatus: 'published',
      displayOrder: 4,
    },
    {
      name: 'Multi-Head Woodworking Boring & Drilling Machine',
      slug: 'multi-head-boring-machine',
      division: divMap['panel-processing'],
      category: 'Multi-Boring & Drilling Machines',
      shortDescription:
        'Multi-spindle horizontal and vertical boring machine with pneumatic hold-down clamps for precision dowel and Mini Fix hole drilling.',
      fullDescription:
        'Built for modular furniture assembly lines requiring repeatable line boring, dowel drilling, and Mini Fix/cam fitting machining across cabinet sides and shelves.',
      images: [
        {
          url: '/assets/products/panel-processing/multi-boring-machine.png',
          alt: 'Multi-Head Woodworking Boring and Drilling Machine',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Machine Category', value: 'Multi-Boring & Drilling Machines', isVerified: true },
        { label: 'Clamping', value: 'Pneumatic Hold-Down Clamps with Foot Pedal Control', isVerified: true },
      ],
      applications: [
        'Multi-row dowel and system-hole drilling for modular wardrobes and kitchens',
        'Precision boring for Mini Fix, cam fittings, and hinges',
      ],
      highlights: ['Horizontal & Vertical Drilling Banks', 'Pneumatic Workpiece Clamping'],
      isFeatured: false,
      publicationStatus: 'published',
      displayOrder: 5,
    },

    // --- DIVISION 4: PVC EDGE-BANDING TAPES & HARDWARE ---
    {
      name: 'Woodgrain & Solid-Colour PVC Edge-Banding Tapes',
      slug: 'pvc-edge-banding-tapes',
      division: divMap['edge-banding-hardware'],
      category: 'PVC Edge-Banding Tapes',
      shortDescription:
        'PVC edge-banding tapes in natural woodgrain textures and solid colours for modular furniture, kitchen shutters, and panels.',
      fullDescription:
        'Supplied for automated and manual edge-banding operations, our PVC edge-banding tapes protect exposed board edges while matching popular laminate woodgrains and contemporary solid tones. Colours, widths, and thicknesses are confirmed upon enquiry.',
      images: [
        {
          url: '/assets/products/edge-banding-hardware/pvc-woodgrain-tape.png',
          alt: 'Woodgrain PVC Edge-Banding Tape Roll',
          isPrimary: true,
        },
        {
          url: '/assets/products/edge-banding-hardware/pvc-solid-color-tapes.png',
          alt: 'Solid-Colour PVC Edge-Banding Tape Rolls',
          isPrimary: false,
        },
      ],
      specifications: [
        { label: 'Product Category', value: 'PVC Edge-Banding Tapes', isVerified: true },
        { label: 'Finish Options', value: 'Woodgrain & Solid Colours (Confirmed on Enquiry)', isVerified: true },
      ],
      applications: [
        'Edge sealing on modular kitchen cabinets, wardrobes, and office furniture',
        'Automated edge-banding machine processing',
      ],
      highlights: ['Woodgrain & Solid Colour Range', 'Suited for Modular Furniture & Kitchen Panels'],
      isFeatured: true,
      publicationStatus: 'published',
      displayOrder: 1,
    },
    {
      name: '2D & 3D Concealed Cabinet Hinges & Spring Flap Hinges',
      slug: '2d-3d-cabinet-hinges',
      division: divMap['edge-banding-hardware'],
      category: '2D and 3D Hinges',
      shortDescription:
        'Concealed cup hinges (2D and 3D adjustable) and spring-loaded furniture hinges for modular cabinets, wardrobes, and storage units.',
      fullDescription:
        'Selected furniture hinge hardware for modular kitchen shutters, wardrobe doors, and lift/flap cabinets. Finish options and adjustment configurations are confirmed per customer requirement.',
      images: [
        {
          url: '/assets/products/edge-banding-hardware/concealed-cup-hinge.png',
          alt: 'Concealed Cabinet Cup Hinge',
          isPrimary: true,
        },
        {
          url: '/assets/products/edge-banding-hardware/spring-flap-hinge.png',
          alt: 'Spring Furniture Flap Hinge Mechanism',
          isPrimary: false,
        },
      ],
      specifications: [
        { label: 'Product Category', value: '2D and 3D Hinges', isVerified: true },
        { label: 'Variants Shown', value: 'Concealed Cup Hinge & Spring Mechanism Hinge', isVerified: true },
      ],
      applications: [
        'Modular kitchen and wardrobe shutter mounting',
        'Overhead flap and storage cabinet doors',
      ],
      highlights: ['2D & 3D Hinge Options', 'Selected Modular Furniture Fittings'],
      isFeatured: true,
      publicationStatus: 'published',
      displayOrder: 2,
    },
    {
      name: 'Telescopic Drawer Channels',
      slug: 'telescopic-drawer-channels',
      division: divMap['edge-banding-hardware'],
      category: 'Telescopic Channels',
      shortDescription:
        'Ball-bearing telescopic drawer slides in zinc/silver and black finishes for modular kitchens, workstations, and wardrobes.',
      fullDescription:
        'Telescopic drawer channels for smooth drawer movement in modular furniture and kitchen cabinetry. Available lengths, load ratings, and finishes are confirmed upon enquiry.',
      images: [
        {
          url: '/assets/products/edge-banding-hardware/telescopic-drawer-channels.png',
          alt: 'Telescopic Drawer Channels in Silver and Black Finishes',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Product Category', value: 'Telescopic Channels', isVerified: true },
        { label: 'Finishes Shown', value: 'Electro-Zinc Silver & Black Finish', isVerified: true },
      ],
      applications: [
        'Modular kitchen and wardrobe drawers',
        'Office pedestals and commercial storage units',
      ],
      highlights: ['Smooth Ball-Bearing Extension', 'Multiple Finish Options'],
      isFeatured: false,
      publicationStatus: 'published',
      displayOrder: 3,
    },
    {
      name: 'Mini Fix Fittings, Cam Locks, Nylon Bushes & Bolts',
      slug: 'minifix-cam-nylon-bush-bolts',
      division: divMap['edge-banding-hardware'],
      category: 'Mini Fix Fittings',
      shortDescription:
        'Complete knock-down (KD) furniture connector fittings including 6 GMS Cam locks, nylon bushes, and connecting bolts.',
      fullDescription:
        'Essential knock-down assembly fittings for modular furniture manufacturers, combining Mini Fix cam locks (6 GMS Cam), nylon bushes, and connecting bolts for rigid carcass construction.',
      images: [
        {
          url: '/assets/products/edge-banding-hardware/minifix-cam-fittings.jpg',
          alt: 'Mini Fix Connector Set — 6 GMS Cam, Nylon Bush, and Bolt',
          isPrimary: true,
        },
      ],
      specifications: [
        { label: 'Included Components', value: '6 GMS Cam, Nylon Bush & Connecting Bolt', isVerified: true },
        { label: 'Category', value: 'Mini Fix, Cam Fittings, Nylon Bushes & Bolts', isVerified: true },
      ],
      applications: [
        'Knock-down (KD) modular furniture and cabinet assembly',
        'Concealed panel-to-panel structural joints',
      ],
      highlights: ['6 GMS Cam Lock', 'Nylon Bush & Connecting Bolt Set'],
      isFeatured: false,
      publicationStatus: 'published',
      displayOrder: 4,
    },
  ];

  await Product.insertMany(productsData);

  // 5. Create Services & Support Offerings (Section 12 of Master Prompt)
  const panelDivId = divMap['panel-processing'];
  const bladesDivId = divMap['pcd-blades'];

  const servicesData = [
    {
      name: 'Panel-Processing Machinery Supply & Consultation',
      slug: 'panel-processing-machinery-consultation',
      category: 'Panel-Processing Machinery',
      shortDescription:
        'Structured consultation for selecting edge-banding, CNC, panel-saw, and cold/hot-press machinery suited to your factory workflow.',
      description:
        'Modu Pro Innovation Pvt. Ltd. helps woodworking and modular furniture manufacturers evaluate and source panel-processing machinery—including edge-banding machines, CNC machines, panel-saw machines, and cold/hot-press machines—aligned with their production requirements.',
      image: '/assets/products/panel-processing/edge-banding-machine.png',
      scopeItems: [
        'Requirement assessment across sizing, edge banding, CNC routing, and pressing',
        'Coordinated tooling (TCT/PCD blades) and adhesive pairing',
        'Single point of contact for machinery and consumable enquiries',
      ],
      relatedDivisions: [panelDivId, bladesDivId],
      confirmationStatus: 'confirmed',
      publicationStatus: 'published',
      displayOrder: 1,
    },
    {
      name: 'Machinery Spare Parts Supply',
      slug: 'machinery-spare-parts-supply',
      category: 'Machinery Spare Parts',
      shortDescription:
        'Supply of replacement components and wear parts for panel-processing machinery to support operational continuity.',
      description:
        'We assist woodworking manufacturers with sourcing compatible spare parts and consumables for edge-banding machines, panel saws, CNC routers, boring machines, and presses. Share your machine details through our service form to confirm part availability.',
      image: '/assets/products/panel-processing/multi-boring-machine.png',
      scopeItems: [
        'Replacement parts for edge banders, panel saws, and CNC machines',
        'Enquiry-based part identification and compatibility verification',
      ],
      relatedDivisions: [panelDivId],
      confirmationStatus: 'pending_confirmation',
      publicationStatus: 'published',
      displayOrder: 2,
    },
    {
      name: 'Machine Installation Support',
      slug: 'machine-installation-support',
      category: 'Installation Support',
      shortDescription:
        'On-site machine commissioning, alignment, and operator orientation for newly supplied panel-processing equipment.',
      description:
        'Structured installation assistance for panel-processing machinery to ensure proper positioning, electrical/pneumatic hookup verification, and initial test runs. Detailed scope is confirmed per machine enquiry.',
      image: '/assets/products/panel-processing/cnc-nesting-machine.png',
      scopeItems: [
        'Machine leveling, calibration, and initial trial cutting/banding',
        'Operator guidance on safe startup and daily routines',
      ],
      relatedDivisions: [panelDivId],
      confirmationStatus: 'pending_confirmation',
      publicationStatus: 'published',
      displayOrder: 3,
    },
    {
      name: 'Preventive Maintenance',
      slug: 'preventive-maintenance',
      category: 'Preventive Maintenance',
      shortDescription:
        'Scheduled inspection and maintenance support to help keep woodworking machinery operating reliably.',
      description:
        'Periodic inspection of mechanical assemblies, glue pots, pneumatic lines, and cutting spindles to reduce unplanned downtime in woodworking and panel-processing plants.',
      image: '/assets/products/panel-processing/sliding-table-panel-saw.png',
      scopeItems: [
        'Spindle, carriage, and feed-chain inspection',
        'Adhesive application unit cleaning and calibration checks',
      ],
      relatedDivisions: [panelDivId],
      confirmationStatus: 'pending_confirmation',
      publicationStatus: 'published',
      displayOrder: 4,
    },
    {
      name: 'Troubleshooting & Diagnostic Assistance',
      slug: 'troubleshooting-diagnostics',
      category: 'Troubleshooting',
      shortDescription:
        'Enquiry-based technical troubleshooting for panel-processing accuracy, edge-banding defects, and machine faults.',
      description:
        'Practical diagnostic assistance when manufacturers encounter processing issues across panel sizing, edge-banding adhesion, boring alignment, or press operation.',
      image: '/assets/products/panel-processing/hydraulic-cold-press.png',
      scopeItems: [
        'Root-cause assessment across machine, tooling, and adhesive variables',
        'Actionable remediation steps and technician scheduling where applicable',
      ],
      relatedDivisions: [panelDivId],
      confirmationStatus: 'pending_confirmation',
      publicationStatus: 'published',
      displayOrder: 5,
    },
    {
      name: 'Mechanical & Electrical Repairs',
      slug: 'mechanical-electrical-repairs',
      category: 'Mechanical & Electrical Repairs',
      shortDescription:
        'Repair support for mechanical drives, pneumatic assemblies, motors, switchgear, and wiring on panel-processing equipment.',
      description:
        'Technical repair services addressing mechanical wear, pneumatic actuator faults, motor drives, and electrical panels on woodworking machinery.',
      image: '/assets/products/panel-processing/multi-boring-machine.png',
      scopeItems: [
        'Mechanical transmission, bearing, and pneumatic cylinder servicing',
        'Electrical contactor, sensor, and drive diagnostics',
      ],
      relatedDivisions: [panelDivId],
      confirmationStatus: 'pending_confirmation',
      publicationStatus: 'published',
      displayOrder: 6,
    },
    {
      name: 'Computerized-Control Servicing',
      slug: 'computerized-control-servicing',
      category: 'Computerized-Control Servicing',
      shortDescription:
        'Technical assistance for PLC controls, touchscreen operator consoles, and CNC control cabinets.',
      description:
        'Support for computerized controls, HMI touchscreens, and CNC controller cabinets used on automated edge banders and CNC routing centers.',
      image: '/assets/products/panel-processing/cnc-nesting-machine.png',
      scopeItems: [
        'HMI console and parameter configuration support',
        'CNC controller cabinet and drive interface diagnostics',
      ],
      relatedDivisions: [panelDivId],
      confirmationStatus: 'pending_confirmation',
      publicationStatus: 'published',
      displayOrder: 7,
    },
  ];

  await Service.insertMany(servicesData);

  // 6. Create Industries We Serve (Section 11 of Master Prompt)
  const industriesData = [
    {
      name: 'Modular Furniture Manufacturing',
      slug: 'modular-furniture-manufacturing',
      shortDescription:
        'Integrated adhesives, panel-processing machinery, precision blades, PVC edge tapes, and KD fittings for wardrobe, office, and residential furniture factories.',
      description:
        'Modular furniture manufacturers rely on repeatable panel sizing, clean edge banding, dependable adhesive bonding, and accurate knock-down hardware assembly. Modu Pro Innovation Pvt. Ltd. connects all four requirements under one roof—helping manufacturers coordinate Adhesi Pro adhesives, TCT & PCD blades, panel-processing equipment, and PVC edge-banding tapes & fittings through a single point of contact.',
      image: '/assets/products/panel-processing/edge-banding-machine.png',
      keyApplications: [
        'Wardrobe, storage carcass, and office workstation production',
        'Automated panel sizing, pre-milling, and PVC edge-banding workflows',
        'Knock-down (KD) panel assembly using Mini Fix, cam locks, nylon bushes, and hinges',
      ],
      relatedDivisions: [
        divMap['adhesi-pro'],
        divMap['pcd-blades'],
        divMap['panel-processing'],
        divMap['edge-banding-hardware'],
      ],
      publicationStatus: 'published',
      displayOrder: 1,
    },
    {
      name: 'Modular Kitchen Manufacturing',
      slug: 'modular-kitchen-manufacturing',
      shortDescription:
        'Water-resistant D3 & PUR adhesives, precision grooving & pre-milling tooling, automated machinery, and cabinet hardware for modular kitchen producers.',
      description:
        'Kitchen cabinetry and shutters demand moisture-conscious adhesive selection, chip-free panel cutting, sealed PVC edges, and smooth-operating hinges and drawer channels. Our four divisions support modular kitchen manufacturers with relevant products and technical guidance tailored to their production line.',
      image: '/assets/products/edge-banding-hardware/telescopic-drawer-channels.png',
      keyApplications: [
        'Carcass and shutter bonding with D3, Commercial D3, PVC/Acrylic, and PUR adhesives',
        'Chip-free pre-milling and grooving on laminated kitchen boards',
        'Telescopic drawer channels, 2D/3D concealed hinges, and colour-matched PVC edge tapes',
      ],
      relatedDivisions: [
        divMap['adhesi-pro'],
        divMap['pcd-blades'],
        divMap['panel-processing'],
        divMap['edge-banding-hardware'],
      ],
      publicationStatus: 'published',
      displayOrder: 2,
    },
    {
      name: 'Door Manufacturing',
      slug: 'door-manufacturing',
      shortDescription:
        'Industrial lamination adhesives, hydraulic cold/hot presses, CNC profiling machines, and sizing blades for flush and engineered door manufacturers.',
      description:
        'Door manufacturers require consistent platen pressing, reliable wood and skin bonding, and accurate perimeter sizing and surface routing. Modu Pro supports door production units with Adhesi Pro adhesives (including Lockpro WR 3, Lockpro 808, and 1K PUR), hydraulic cold/hot-press machines, dual-spindle CNC routers, and panel-saw blades.',
      image: '/assets/products/panel-processing/hydraulic-cold-press.png',
      keyApplications: [
        'Flush door and decorative laminate door pressing on hydraulic presses',
        'Structural core, frame, and skin bonding with Adhesi Pro adhesives',
        'Automated CNC door surface routing and precision edge sizing',
      ],
      relatedDivisions: [
        divMap['adhesi-pro'],
        divMap['pcd-blades'],
        divMap['panel-processing'],
      ],
      publicationStatus: 'published',
      displayOrder: 3,
    },
    {
      name: 'Woodworking and Panel Processing',
      slug: 'woodworking-and-panel-processing',
      shortDescription:
        'Complete machinery, TCT/PCD tooling, spare parts, technical servicing, and industrial adhesives for commercial woodworking workshops and job-work hubs.',
      description:
        'For dedicated panel-processing centers and commercial woodworking businesses, machine uptime and tooling precision are paramount. Modu Pro provides sliding table panel saws, automatic edge banders, CNC nesting machines, multi-boring equipment, TCT/PCD saw blades, adhesives, and ongoing maintenance and spare-parts support.',
      image: '/assets/products/panel-processing/cnc-nesting-machine.png',
      keyApplications: [
        'High-volume sheet cutting, nesting, grooving, and edge banding',
        'TCT and PCD blade selection for laminated boards, MDF, and plywood',
        'Machinery installation, preventive maintenance, repairs, and spare parts',
      ],
      relatedDivisions: [
        divMap['panel-processing'],
        divMap['pcd-blades'],
        divMap['adhesi-pro'],
        divMap['edge-banding-hardware'],
      ],
      publicationStatus: 'published',
      displayOrder: 4,
    },
  ];

  await Industry.insertMany(industriesData);

  // 7. Populate Media Library with all 20 authentic project assets
  const mediaItems = [
    {
      title: 'Modu Pro Innovation Pvt. Ltd. Official Logo',
      altText: 'Modu Pro Innovation Pvt. Ltd. — Faithfully Delivering Excellence',
      url: '/assets/logo/modu-pro-logo.png',
      category: 'logo',
      storageProvider: 'static_asset',
    },
    {
      title: 'Adhesi Pro — 1K PUR Moisture-Curing Polyurethane Adhesive',
      altText: 'Adhesi Pro 1K PUR Adhesive Nozzle Bottle',
      url: '/assets/products/adhesi-pro/1k-pur-adhesive.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Adhesi Pro — LockPro 707 Industrial Drum',
      altText: 'Adhesi Pro LockPro 707 Drum Mockup',
      url: '/assets/products/adhesi-pro/lockpro-707-drum.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Adhesi Pro — Lockpro 808 Industrial Drum',
      altText: 'Adhesi Pro Lockpro 808 Drum Mockup',
      url: '/assets/products/adhesi-pro/lockpro-808-drum.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Adhesi Pro — Lockpro 808 PR Bucket',
      altText: 'Adhesi Pro Lockpro 808 PR Pail Bucket',
      url: '/assets/products/adhesi-pro/lockpro-808-pr-bucket.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Adhesi Pro — Lockpro WR 3 Bucket',
      altText: 'Adhesi Pro Lockpro WR 3 D3 Water-Resistant Adhesive Bucket',
      url: '/assets/products/adhesi-pro/lockpro-wr3-bucket.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Adhesi Pro — Lockpro WR 3 Industrial Drum',
      altText: 'Adhesi Pro Lockpro WR 3 Drum Mockup',
      url: '/assets/products/adhesi-pro/lockpro-wr3-drum.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'YASH Pre-Milling & Spindle Moulder Cutters',
      altText: 'YASH Red Carbide-Tipped Woodworking Cutters',
      url: '/assets/products/pcd-blades/pre-milling-cutters.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'YASH Circular Grooving Saw Blade',
      altText: 'YASH Green Circular Grooving Saw Blade',
      url: '/assets/products/pcd-blades/grooving-saw-blade.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Multi-Head Woodworking Boring Machine',
      altText: 'Multi-Head Woodworking Boring and Drilling Machine',
      url: '/assets/products/panel-processing/multi-boring-machine.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Dual-Spindle CNC Router & Nesting Machine',
      altText: 'Dual-Spindle CNC Router and Nesting Machine with Control Cabinet',
      url: '/assets/products/panel-processing/cnc-nesting-machine.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Automatic Edge-Banding Machine',
      altText: 'Automatic Industrial Edge-Banding Machine',
      url: '/assets/products/panel-processing/edge-banding-machine.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Sliding Table Panel-Saw Machine',
      altText: 'Industrial Sliding Table Panel Saw',
      url: '/assets/products/panel-processing/sliding-table-panel-saw.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Hydraulic Cold Press Machine',
      altText: 'Industrial Hydraulic Cold Press Machine for Wood Panels',
      url: '/assets/products/panel-processing/hydraulic-cold-press.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Woodgrain PVC Edge-Banding Tape Roll',
      altText: 'Light Oak Woodgrain PVC Edge-Banding Tape Roll',
      url: '/assets/products/edge-banding-hardware/pvc-woodgrain-tape.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Solid-Colour PVC Edge-Banding Tape Rolls',
      altText: 'Four Solid-Colour PVC Edge-Banding Tape Rolls',
      url: '/assets/products/edge-banding-hardware/pvc-solid-color-tapes.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Telescopic Drawer Channels (Silver & Black)',
      altText: 'Pair of Telescopic Drawer Channels in Silver and Black',
      url: '/assets/products/edge-banding-hardware/telescopic-drawer-channels.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Mini Fix Connector Set (6 GMS Cam, Nylon Bush, Bolt)',
      altText: 'Mini Fix Cam Lock, Nylon Bush, and Bolt Furniture Fittings',
      url: '/assets/products/edge-banding-hardware/minifix-cam-fittings.jpg',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Spring Furniture Flap Hinge Mechanism',
      altText: 'Stainless Steel Spring Furniture Flap Hinge',
      url: '/assets/products/edge-banding-hardware/spring-flap-hinge.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
    {
      title: 'Concealed Cabinet Cup Hinge',
      altText: 'Brushed Nickel Concealed Cabinet Cup Hinge',
      url: '/assets/products/edge-banding-hardware/concealed-cup-hinge.png',
      category: 'product',
      storageProvider: 'static_asset',
    },
  ];

  await Media.insertMany(mediaItems);

  return {
    seeded: true,
    counts: {
      divisions: createdDivisions.length,
      products: productsData.length,
      services: servicesData.length,
      industries: industriesData.length,
      media: mediaItems.length,
    },
  };
}

module.exports = { seedIfEmpty };
