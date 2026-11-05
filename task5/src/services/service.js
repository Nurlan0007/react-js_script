/**
 * services/service.js
 * Centralized API Service Layer for TechVault Catalog & Analytics.
 *
 * Implements an asynchronous REST-like Fake API (plus optional live DummyJSON REST API sync)
 * that supports:
 *  - Full-text search (q)
 *  - Multi-parameter filtering (category, status, minRating, maxPrice, brand)
 *  - Multi-field sorting (price-asc, price-desc, rating-desc, title-asc, title-desc, discount-desc, stock-desc)
 *  - Server-side style pagination (page, limit, total, totalPages)
 *  - Fetching single items by ID with validation and AbortSignal cancellation (prevents stale requests)
 *  - Fetching full dataset for Dashboard real-time statistics & breakdowns
 */

// Helper to create crisp, reliable SVG product artwork data URIs so images never break offline or online
function createProductSvg(title, category, accentColor, secondaryColor, iconSymbol) {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeCategory = category.toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420" width="600" height="420">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${accentColor}" />
        <stop offset="100%" stop-color="${secondaryColor}" />
      </linearGradient>
      <linearGradient id="card" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.18)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.04)" />
      </linearGradient>
    </defs>
    <rect width="600" height="420" rx="20" fill="url(#bg)" />
    <circle cx="510" cy="80" r="140" fill="rgba(255,255,255,0.07)" />
    <circle cx="90" cy="360" r="160" fill="rgba(0,0,0,0.15)" />
    <rect x="44" y="40" width="512" height="340" rx="18" fill="url(#card)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
    <text x="74" y="84" fill="rgba(255,255,255,0.75)" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="700" letter-spacing="2">${safeCategory}</text>
    <text x="300" y="215" text-anchor="middle" font-size="88">${iconSymbol}</text>
    <text x="300" y="315" text-anchor="middle" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700">${safeTitle}</text>
    <text x="300" y="346" text-anchor="middle" fill="rgba(255,255,255,0.75)" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="500">TechVault Verified Hardware</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Comprehensive database of 24 hardware & electronics items with 14+ meaningful attributes each
const FAKE_API_ITEMS = [
  {
    id: 1,
    title: 'MacBook Pro 16" M3 Max',
    sku: 'TV-LPT-001',
    category: 'Laptops',
    brand: 'Apple',
    price: 3499,
    discountPercentage: 8,
    rating: 4.92,
    stock: 18,
    availabilityStatus: 'In Stock',
    weight: '2.14 kg',
    dimensions: '35.57 x 24.81 x 1.68 cm',
    warrantyInformation: '2 Years AppleCare+ Enterprise Warranty',
    shippingInformation: 'Ships within 24 hours via Express Air',
    returnPolicy: '30-day no-questions-asked return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: true,
    tags: ['laptop', 'apple', 'm3-max', 'workstation', 'pro'],
    specs: '16-core CPU, 40-core GPU, 48GB Unified Memory, 1TB NVMe SSD, Liquid Retina XDR Display',
    description:
      'Engineered for demanding workflows including 8K video rendering, 3D simulation, and local LLM compilation. Features a Liquid Retina XDR mini-LED display with 120Hz ProMotion and up to 22 hours of battery life.',
    thumbnail: createProductSvg('MacBook Pro 16" M3 Max', 'Laptops', '#0f172a', '#1e3a8a', '💻'),
    reviews: [
      { reviewerName: 'Alisher K.', rating: 5, date: '2026-10-12', comment: 'Compiles huge Docker + Rust workspaces in seconds. Best workstation laptop.' },
      { reviewerName: 'Elena V.', rating: 5, date: '2026-09-28', comment: 'Display brightness and battery life are unmatched for daily dev work.' }
    ]
  },
  {
    id: 2,
    title: 'ThinkPad X1 Carbon Gen 12',
    sku: 'TV-LPT-002',
    category: 'Laptops',
    brand: 'Lenovo',
    price: 1899,
    discountPercentage: 12,
    rating: 4.78,
    stock: 25,
    availabilityStatus: 'In Stock',
    weight: '1.09 kg',
    dimensions: '31.28 x 21.47 x 1.49 cm',
    warrantyInformation: '3 Years Premier Onsite Support',
    shippingInformation: 'Ships in 1–2 business days',
    returnPolicy: '30-day free return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: true,
    tags: ['laptop', 'ultrabook', 'lenovo', 'linux-ready', 'business'],
    specs: 'Intel Core Ultra 7 165U, 32GB LPDDR5X, 1TB PCIe Gen4 SSD, 14" 2.8K OLED 120Hz',
    description:
      'Ultralight carbon-fiber weave chassis paired with the legendary tactile ThinkPad keyboard, MIL-STD-810H durability certification, hardware privacy shutters, and seamless Linux/Windows compatibility.',
    thumbnail: createProductSvg('ThinkPad X1 Carbon Gen 12', 'Laptops', '#18181b', '#3f3f46', '🖤'),
    reviews: [
      { reviewerName: 'Nurlan T.', rating: 5, date: '2026-10-19', comment: 'Runs Ubuntu and Docker containers effortlessly. Keyboard is phenomenal.' },
      { reviewerName: 'Timur S.', rating: 4.5, date: '2026-10-02', comment: 'Featherlight for university and office travel.' }
    ]
  },
  {
    id: 3,
    title: 'ASUS ROG Zephyrus G16 OLED',
    sku: 'TV-LPT-003',
    category: 'Laptops',
    brand: 'ASUS',
    price: 2299,
    discountPercentage: 10,
    rating: 4.81,
    stock: 7,
    availabilityStatus: 'Low Stock',
    weight: '1.85 kg',
    dimensions: '35.4 x 24.6 x 1.49 cm',
    warrantyInformation: '2 Years International Manufacturer Warranty',
    shippingInformation: 'Ships within 48 hours',
    returnPolicy: '14-day exchange or refund',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: false,
    tags: ['laptop', 'gaming', 'oled', 'rtx-4080', 'asus'],
    specs: 'Intel Core Ultra 9 185H, NVIDIA RTX 4080 12GB, 32GB RAM, 16" 240Hz G-SYNC OLED',
    description:
      'Precision CNC-machined aluminum unibody gaming and creator laptop featuring a 240Hz Nebula OLED panel, tri-fan vapor chamber cooling, and studio-grade 6-speaker audio array.',
    thumbnail: createProductSvg('ROG Zephyrus G16 OLED', 'Laptops', '#31102f', '#701a75', '🎮'),
    reviews: [
      { reviewerName: 'Dias M.', rating: 5, date: '2026-10-14', comment: 'Handles Unreal Engine 5 and Blender scenes without thermal throttling.' }
    ]
  },
  {
    id: 4,
    title: 'Dell XPS 15 9530 Creator Edition',
    sku: 'TV-LPT-004',
    category: 'Laptops',
    brand: 'Dell',
    price: 1649,
    discountPercentage: 15,
    rating: 4.56,
    stock: 14,
    availabilityStatus: 'In Stock',
    weight: '1.86 kg',
    dimensions: '34.44 x 23.01 x 1.80 cm',
    warrantyInformation: '1 Year Dell ProSupport',
    shippingInformation: 'Ships in 2 business days',
    returnPolicy: '30-day standard return',
    minimumOrderQuantity: 1,
    releaseYear: 2024,
    featured: false,
    tags: ['laptop', 'dell', 'creator', 'infinity-edge'],
    specs: 'Intel Core i7-13700H, RTX 4060, 16GB DDR5, 512GB SSD, 15.6" 3.5K OLED Touch',
    description:
      'Four-sided InfinityEdge OLED touch display with 100% DCI-P3 color gamut coverage, carbon fiber palm rest, and precision haptic glass touchpad.',
    thumbnail: createProductSvg('Dell XPS 15 Creator', 'Laptops', '#0c4a6e', '#0284c7', '🖥️'),
    reviews: [
      { reviewerName: 'Aigerim B.', rating: 4.5, date: '2026-09-15', comment: 'Gorgeous bezel-less screen for UI/UX design work.' }
    ]
  },
  {
    id: 5,
    title: 'Framework Laptop 16 Modular',
    sku: 'TV-LPT-005',
    category: 'Laptops',
    brand: 'Framework',
    price: 1799,
    discountPercentage: 5,
    rating: 4.74,
    stock: 4,
    availabilityStatus: 'Low Stock',
    weight: '2.10 kg',
    dimensions: '35.6 x 29.0 x 1.79 cm',
    warrantyInformation: '2 Years Modular Component Warranty',
    shippingInformation: 'Ships in 3–5 business days',
    returnPolicy: '30-day satisfaction guarantee',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: false,
    tags: ['laptop', 'modular', 'repairable', 'amd-ryzen', 'open-source'],
    specs: 'AMD Ryzen 9 7940HS, Hot-swappable Expansion Bay GPU, 32GB DDR5, 1TB NVMe',
    description:
      'Fully upgradeable and repairable high-performance laptop with hot-swappable I/O expansion cards, customizable QMK input modules, and replaceable graphics bay.',
    thumbnail: createProductSvg('Framework Laptop 16', 'Laptops', '#431407', '#ea580c', '🔧'),
    reviews: [
      { reviewerName: 'Maxat R.', rating: 5, date: '2026-10-05', comment: 'Swapping USB-C and HDMI ports to whichever side I need is genius.' }
    ]
  },
  {
    id: 6,
    title: 'iPhone 16 Pro Max 512GB',
    sku: 'TV-SMP-006',
    category: 'Smartphones',
    brand: 'Apple',
    price: 1399,
    discountPercentage: 6,
    rating: 4.89,
    stock: 32,
    availabilityStatus: 'In Stock',
    weight: '0.227 kg',
    dimensions: '16.3 x 7.76 x 0.82 cm',
    warrantyInformation: '1 Year Apple Limited Warranty',
    shippingInformation: 'Same-day dispatch available',
    returnPolicy: '14-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: true,
    tags: ['smartphone', 'apple', 'titanium', '5g', 'camera'],
    specs: 'A18 Pro 3nm Chip, 6.9" Super Retina XDR, 48MP Fusion + 5x Telephoto, Titanium Frame',
    description:
      'Grade 5 titanium design featuring the A18 Pro chip, dedicated Camera Control button, 4K 120fps Dolby Vision ProRes capture, and studio-quality four-mic array.',
    thumbnail: createProductSvg('iPhone 16 Pro Max', 'Smartphones', '#1e1b4b', '#4338ca', '📱'),
    reviews: [
      { reviewerName: 'Zarina A.', rating: 5, date: '2026-10-20', comment: '5x telephoto lens and battery life easily last two full days.' }
    ]
  },
  {
    id: 7,
    title: 'Samsung Galaxy S25 Ultra 5G',
    sku: 'TV-SMP-007',
    category: 'Smartphones',
    brand: 'Samsung',
    price: 1299,
    discountPercentage: 10,
    rating: 4.85,
    stock: 21,
    availabilityStatus: 'In Stock',
    weight: '0.232 kg',
    dimensions: '16.23 x 7.9 x 0.86 cm',
    warrantyInformation: '2 Years Official Samsung Care',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '30-day return guarantee',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: true,
    tags: ['smartphone', 'samsung', 's-pen', 'android', 'ai'],
    specs: 'Snapdragon 8 Gen 4, 12GB RAM, 512GB Storage, 200MP Quad Tele System, Built-in S-Pen',
    description:
      'Anti-reflective Gorilla Armor titanium flagship with integrated Bluetooth S-Pen, 200MP adaptive pixel sensor, Samsung DeX desktop mode, and on-device Galaxy AI.',
    thumbnail: createProductSvg('Galaxy S25 Ultra 5G', 'Smartphones', '#042f2e', '#0d9488', '✨'),
    reviews: [
      { reviewerName: 'Bekzat S.', rating: 5, date: '2026-10-18', comment: 'Anti-reflective screen is readable even under direct midday sunlight.' }
    ]
  },
  {
    id: 8,
    title: 'Google Pixel 9 Pro XL',
    sku: 'TV-SMP-008',
    category: 'Smartphones',
    brand: 'Google',
    price: 1099,
    discountPercentage: 14,
    rating: 4.72,
    stock: 9,
    availabilityStatus: 'Low Stock',
    weight: '0.221 kg',
    dimensions: '16.28 x 7.66 x 0.85 cm',
    warrantyInformation: '2 Years Google Hardware Warranty',
    shippingInformation: 'Ships in 1–2 business days',
    returnPolicy: '15-day return window',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: false,
    tags: ['smartphone', 'google', 'pixel', 'android', 'computational-photography'],
    specs: 'Google Tensor G4, 16GB RAM, 256GB UFS 4.0, 6.8" Super Actua LTPO OLED, 7 Years Updates',
    description:
      'Pure Android experience backed by 7 years of OS and security updates, pro-level triple rear camera bar with 50MP main sensor, and ultra-bright 3000-nit Super Actua display.',
    thumbnail: createProductSvg('Google Pixel 9 Pro XL', 'Smartphones', '#14532d', '#16a34a', '📸'),
    reviews: [
      { reviewerName: 'Arman K.', rating: 4.7, date: '2026-09-30', comment: 'Cleanest Android UI and night sight photos are unbeatable.' }
    ]
  },
  {
    id: 9,
    title: 'OnePlus 13 Flagship 512GB',
    sku: 'TV-SMP-009',
    category: 'Smartphones',
    brand: 'OnePlus',
    price: 899,
    discountPercentage: 11,
    rating: 4.68,
    stock: 19,
    availabilityStatus: 'In Stock',
    weight: '0.213 kg',
    dimensions: '16.33 x 7.58 x 0.89 cm',
    warrantyInformation: '1 Year Manufacturer Warranty',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '30-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: false,
    tags: ['smartphone', 'oneplus', 'fast-charging', 'hasselblad'],
    specs: '100W SUPERVOOC Charging, 6000mAh Silicon-Carbon Battery, 16GB LPDDR5X, Hasselblad Optics',
    description:
      'Charges from 1% to 100% in 26 minutes with 100W SUPERVOOC technology, paired with a massive 6000mAh dual-cell battery and 4th-Gen Hasselblad camera tuning.',
    thumbnail: createProductSvg('OnePlus 13 Flagship', 'Smartphones', '#450a0a', '#dc2626', '⚡'),
    reviews: [
      { reviewerName: 'Ruslan D.', rating: 4.8, date: '2026-10-09', comment: '100W charger included in the box is a game changer.' }
    ]
  },
  {
    id: 10,
    title: 'Nothing Phone (3) Transparent Edition',
    sku: 'TV-SMP-010',
    category: 'Smartphones',
    brand: 'Nothing',
    price: 699,
    discountPercentage: 7,
    rating: 4.51,
    stock: 0,
    availabilityStatus: 'Pre-Order',
    weight: '0.201 kg',
    dimensions: '16.1 x 7.6 x 0.83 cm',
    warrantyInformation: '1 Year Official Warranty',
    shippingInformation: 'Pre-order dispatches in 7 days',
    returnPolicy: '30-day cancellation & return',
    minimumOrderQuantity: 1,
    releaseYear: 2026,
    featured: false,
    tags: ['smartphone', 'nothing', 'glyph-interface', 'minimalist'],
    specs: 'Programmable Glyph Matrix LED Interface, Snapdragon 8s Gen 3, 12GB RAM, 256GB ROM',
    description:
      'Iconic transparent glass back with 36-zone programmable Glyph LED notifications, monochrome Nothing OS widgets, and dual 50MP optically stabilized sensors.',
    thumbnail: createProductSvg('Nothing Phone (3)', 'Smartphones', '#1f2937', '#4b5563', '🔆'),
    reviews: [
      { reviewerName: 'Dana Y.', rating: 4.5, date: '2026-10-01', comment: 'Unique industrial aesthetic and zero bloatware.' }
    ]
  },
  {
    id: 11,
    title: 'iPad Pro 13" M4 Tandem OLED',
    sku: 'TV-TBL-011',
    category: 'Tablets',
    brand: 'Apple',
    price: 1299,
    discountPercentage: 9,
    rating: 4.91,
    stock: 15,
    availabilityStatus: 'In Stock',
    weight: '0.579 kg',
    dimensions: '28.16 x 21.55 x 0.51 cm',
    warrantyInformation: '1 Year Apple Warranty',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '14-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: true,
    tags: ['tablet', 'ipad', 'm4', 'oled', 'apple-pencil-pro'],
    specs: 'Apple M4 Chip, Ultra Retina XDR Tandem OLED, 5.1mm Ultra-Thin Profile, Thunderbolt / USB 4',
    description:
      'Impossibly thin 5.1mm enclosure housing the breakthrough Ultra Retina XDR dual-layer Tandem OLED display and desktop-class M4 silicon for digital artists and engineers.',
    thumbnail: createProductSvg('iPad Pro 13" M4 OLED', 'Tablets', '#1e293b', '#3b82f6', '🎨'),
    reviews: [
      { reviewerName: 'Kamila T.', rating: 5, date: '2026-10-16', comment: 'Tandem OLED contrast makes illustration work breathtaking.' }
    ]
  },
  {
    id: 12,
    title: 'Samsung Galaxy Tab S10 Ultra',
    sku: 'TV-TBL-012',
    category: 'Tablets',
    brand: 'Samsung',
    price: 1199,
    discountPercentage: 15,
    rating: 4.76,
    stock: 6,
    availabilityStatus: 'Low Stock',
    weight: '0.718 kg',
    dimensions: '32.64 x 20.86 x 0.54 cm',
    warrantyInformation: '2 Years Samsung Warranty',
    shippingInformation: 'Ships in 1–2 business days',
    returnPolicy: '30-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: false,
    tags: ['tablet', 'samsung', 'amoled', 's-pen-included', 'ip68'],
    specs: '14.6" Dynamic AMOLED 2X 120Hz, IP68 Water/Dust Resistant, Included S-Pen, 16GB RAM',
    description:
      'Expansive 14.6-inch canvas with IP68 water and dust resistance on both the tablet and bundled S-Pen, multi-window DeX workstation mode, and microSD expandability.',
    thumbnail: createProductSvg('Galaxy Tab S10 Ultra', 'Tablets', '#172554', '#2563eb', '📋'),
    reviews: [
      { reviewerName: 'Olzhas N.', rating: 4.8, date: '2026-09-22', comment: 'Having S-Pen included in the box saves $130 right away.' }
    ]
  },
  {
    id: 13,
    title: 'reMarkable Paper Pro Color E-Ink',
    sku: 'TV-TBL-013',
    category: 'Tablets',
    brand: 'reMarkable',
    price: 579,
    discountPercentage: 5,
    rating: 4.64,
    stock: 12,
    availabilityStatus: 'In Stock',
    weight: '0.525 kg',
    dimensions: '27.41 x 19.66 x 0.51 cm',
    warrantyInformation: '1 Year Connect Protection',
    shippingInformation: 'Ships in 2–3 business days',
    returnPolicy: '100-day risk-free trial',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: false,
    tags: ['tablet', 'e-ink', 'notes', 'pdf-reader', 'distraction-free'],
    specs: '11.8" Canvas Color E-Ink Display, Adjustable Reading Light, Marker Plus, 2-Week Battery',
    description:
      'Distraction-free digital paper tablet with a textured low-latency color E-Ink display designed for annotating technical PDFs, system architecture diagrams, and lecture notes.',
    thumbnail: createProductSvg('reMarkable Paper Pro', 'Tablets', '#292524', '#78716c', '📝'),
    reviews: [
      { reviewerName: 'Sanzhar B.', rating: 4.6, date: '2026-10-08', comment: 'Best device for reading System Design books without eye strain.' }
    ]
  },
  {
    id: 14,
    title: 'Sony WH-1000XM5 Wireless ANC',
    sku: 'TV-AUD-014',
    category: 'Audio',
    brand: 'Sony',
    price: 399,
    discountPercentage: 18,
    rating: 4.87,
    stock: 42,
    availabilityStatus: 'In Stock',
    weight: '0.250 kg',
    dimensions: '22.4 x 18.5 x 7.8 cm',
    warrantyInformation: '2 Years Sony Audio Warranty',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '30-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2024,
    featured: true,
    tags: ['audio', 'headphones', 'anc', 'sony', 'ldac'],
    specs: '8-Mic Auto NC Optimizer, 30mm Carbon Fiber Drivers, LDAC Hi-Res Audio, 30h Battery',
    description:
      'Industry-leading active noise cancellation powered by dual processors and eight microphones, multipoint Bluetooth pairing across laptop and phone, and plush soft-fit leather earcups.',
    thumbnail: createProductSvg('Sony WH-1000XM5 ANC', 'Audio', '#0f172a', '#475569', '🎧'),
    reviews: [
      { reviewerName: 'Aidan M.', rating: 5, date: '2026-10-11', comment: 'Blocks out coffee shop and open-office chatter completely.' }
    ]
  },
  {
    id: 15,
    title: 'AirPods Pro (2nd Gen) USB-C',
    sku: 'TV-AUD-015',
    category: 'Audio',
    brand: 'Apple',
    price: 249,
    discountPercentage: 12,
    rating: 4.88,
    stock: 55,
    availabilityStatus: 'In Stock',
    weight: '0.061 kg',
    dimensions: '6.06 x 4.52 x 2.17 cm',
    warrantyInformation: '1 Year Apple Limited Warranty',
    shippingInformation: 'Same-day dispatch',
    returnPolicy: '14-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2024,
    featured: false,
    tags: ['audio', 'earbuds', 'apple', 'spatial-audio', 'usb-c'],
    specs: 'Apple H2 Chip, Adaptive Audio, Conversation Awareness, IP54 MagSafe USB-C Case',
    description:
      'H2-powered active noise cancellation with Adaptive Transparency, Personalized Spatial Audio, precision U1 Find My speaker case, and dust/sweat resistance.',
    thumbnail: createProductSvg('AirPods Pro 2 USB-C', 'Audio', '#1e3a8a', '#3b82f6', '🎵'),
    reviews: [
      { reviewerName: 'Madina K.', rating: 4.9, date: '2026-10-03', comment: 'Seamless switching between MacBook and iPhone.' }
    ]
  },
  {
    id: 16,
    title: 'Sennheiser HD 660S2 Audiophile Open-Back',
    sku: 'TV-AUD-016',
    category: 'Audio',
    brand: 'Sennheiser',
    price: 599,
    discountPercentage: 20,
    rating: 4.82,
    stock: 5,
    availabilityStatus: 'Low Stock',
    weight: '0.260 kg',
    dimensions: '24.0 x 21.0 x 10.5 cm',
    warrantyInformation: '2 Years Sennheiser Global Warranty',
    shippingInformation: 'Ships in 1–2 business days',
    returnPolicy: '30-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2024,
    featured: false,
    tags: ['audio', 'audiophile', 'open-back', 'sennheiser', 'studio'],
    specs: '300-Ohm Ultralight Aluminum Voice Coil, 8Hz–41,500Hz Frequency Response, Made in Ireland',
    description:
      'Reference-grade open-back headphones delivering natural spatial imaging, extended sub-bass response, and zero-fatigue velour cushions for long coding and mixing sessions.',
    thumbnail: createProductSvg('Sennheiser HD 660S2', 'Audio', '#3b0764', '#9333ea', '🎼'),
    reviews: [
      { reviewerName: 'Daniyar O.', rating: 5, date: '2026-09-19', comment: 'Incredible soundstage and comfort for 8-hour home office sessions.' }
    ]
  },
  {
    id: 17,
    title: 'Shure MV7+ Podcast & Streaming Mic',
    sku: 'TV-AUD-017',
    category: 'Audio',
    brand: 'Shure',
    price: 279,
    discountPercentage: 7,
    rating: 4.79,
    stock: 16,
    availabilityStatus: 'In Stock',
    weight: '0.574 kg',
    dimensions: '16.9 x 9.0 x 16.4 cm',
    warrantyInformation: '2 Years Shure Pro Warranty',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '30-day return guarantee',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: false,
    tags: ['audio', 'microphone', 'usb-c', 'xlr', 'podcast'],
    specs: 'Hybrid USB-C & XLR Outputs, Onboard DSP Denoiser, Digital Popper Stopper, LED Touch Mute',
    description:
      'Broadcast-grade dynamic microphone with both USB-C and XLR connectivity, voice isolation technology for untreated rooms, and customizable LED live meter strip.',
    thumbnail: createProductSvg('Shure MV7+ Dynamic Mic', 'Audio', '#064e3b', '#10b981', '🎙️'),
    reviews: [
      { reviewerName: 'Yerlan Z.', rating: 4.8, date: '2026-10-14', comment: 'Team standups and technical demos sound like a radio studio.' }
    ]
  },
  {
    id: 18,
    title: 'Keychron Q1 Max QMK/VIA Mechanical Keyboard',
    sku: 'TV-ACC-018',
    category: 'Accessories',
    brand: 'Keychron',
    price: 219,
    discountPercentage: 10,
    rating: 4.90,
    stock: 28,
    availabilityStatus: 'In Stock',
    weight: '1.724 kg',
    dimensions: '32.75 x 14.5 x 3.58 cm',
    warrantyInformation: '1 Year Keychron Warranty',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '30-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: true,
    tags: ['accessories', 'keyboard', 'mechanical', 'qmk', 'wireless'],
    specs: 'Full CNC 6063 Aluminum Body, Double-Gasket Mount, 2.4GHz 1000Hz + Bluetooth 5.1, Hot-Swappable',
    description:
      'Custom-grade 75% layout all-metal mechanical keyboard with open-source QMK/VIA key remapping, multi-layer acoustic IXPE/latex foams, and Gateron Jupiter Banana tactile switches.',
    thumbnail: createProductSvg('Keychron Q1 Max QMK', 'Accessories', '#1e1b4b', '#6366f1', '⌨️'),
    reviews: [
      { reviewerName: 'Nurlan T.', rating: 5, date: '2026-10-22', comment: 'Heavy CNC aluminum build and VIA macro layers boosted my IDE workflow.' }
    ]
  },
  {
    id: 19,
    title: 'Logitech MX Master 3S Wireless Mouse',
    sku: 'TV-ACC-019',
    category: 'Accessories',
    brand: 'Logitech',
    price: 99,
    discountPercentage: 15,
    rating: 4.86,
    stock: 64,
    availabilityStatus: 'In Stock',
    weight: '0.141 kg',
    dimensions: '12.49 x 8.43 x 5.1 cm',
    warrantyInformation: '2 Years Logitech Hardware Warranty',
    shippingInformation: 'Same-day dispatch',
    returnPolicy: '30-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2024,
    featured: false,
    tags: ['accessories', 'mouse', 'ergonomic', 'productivity', 'logitech'],
    specs: '8000 DPI Darkfield Glass Sensor, MagSpeed Electromagnetic Wheel, Quiet Clicks, 3-Device Flow',
    description:
      'Ergonomic sculpted wireless mouse capable of scrolling 1,000 lines of code per second with its MagSpeed electromagnetic steel wheel and tracking on any surface including glass.',
    thumbnail: createProductSvg('Logitech MX Master 3S', 'Accessories', '#0f172a', '#0284c7', '🖱️'),
    reviews: [
      { reviewerName: 'Askar D.', rating: 4.9, date: '2026-09-25', comment: 'Horizontal thumb wheel is essential for wide spreadsheets and timelines.' }
    ]
  },
  {
    id: 20,
    title: 'CalDigit TS4 Thunderbolt 4 Dock (18-Port)',
    sku: 'TV-ACC-020',
    category: 'Accessories',
    brand: 'CalDigit',
    price: 399,
    discountPercentage: 5,
    rating: 4.83,
    stock: 8,
    availabilityStatus: 'Low Stock',
    weight: '0.640 kg',
    dimensions: '14.1 x 11.3 x 4.2 cm',
    warrantyInformation: '2 Years CalDigit Warranty',
    shippingInformation: 'Ships in 1–2 business days',
    returnPolicy: '30-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2024,
    featured: false,
    tags: ['accessories', 'thunderbolt-4', 'dock', '2.5gbe', 'workstation'],
    specs: '18 Ports, 98W Host Charging, 2.5GbE Ethernet, Dual 6K 60Hz Display Support, UHS-II SD 4.0',
    description:
      'Single-cable workstation hub offering 18 ports of connectivity including three Thunderbolt 4 (40Gb/s) ports, 2.5 Gigabit Ethernet, 98W power delivery, and dual 6K monitor support.',
    thumbnail: createProductSvg('CalDigit TS4 TB4 Dock', 'Accessories', '#1c1917', '#57534e', '🔌'),
    reviews: [
      { reviewerName: 'Baurzhan K.', rating: 4.8, date: '2026-10-04', comment: 'Rock-solid connection to two 4K monitors and 2.5GbE NAS with one cable.' }
    ]
  },
  {
    id: 21,
    title: 'LG UltraFine 32" 4K OLED Pro Monitor',
    sku: 'TV-ACC-021',
    category: 'Accessories',
    brand: 'LG',
    price: 999,
    discountPercentage: 16,
    rating: 4.77,
    stock: 11,
    availabilityStatus: 'In Stock',
    weight: '5.50 kg',
    dimensions: '72.6 x 51.2 x 23.9 cm',
    warrantyInformation: '3 Years Zero Bright Dot Panel Warranty',
    shippingInformation: 'Scheduled freight courier delivery',
    returnPolicy: '30-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: false,
    tags: ['accessories', 'monitor', '4k', 'oled', 'usb-c'],
    specs: '31.5" 4K UHD (3840x2160) OLED, 99% DCI-P3, 90W USB-C PD, Hardware Calibration, KVM Switch',
    description:
      'Pixel-level dimming 4K OLED monitor with built-in KVM switch, 90W USB-C upstream power delivery, and hardware color calibration for software development and media mastering.',
    thumbnail: createProductSvg('LG UltraFine 32" 4K OLED', 'Accessories', '#312e81', '#4f46e5', '🖥️'),
    reviews: [
      { reviewerName: 'Tamerlan I.', rating: 4.8, date: '2026-10-17', comment: 'Dark mode IDE themes look incredible with true OLED black levels.' }
    ]
  },
  {
    id: 22,
    title: 'Apple Watch Ultra 2 Black Titanium',
    sku: 'TV-WRB-022',
    category: 'Wearables',
    brand: 'Apple',
    price: 799,
    discountPercentage: 6,
    rating: 4.89,
    stock: 22,
    availabilityStatus: 'In Stock',
    weight: '0.061 kg',
    dimensions: '4.9 x 4.4 x 1.44 cm',
    warrantyInformation: '1 Year Apple Warranty',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '14-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: true,
    tags: ['wearables', 'smartwatch', 'apple', 'titanium', 'gps'],
    specs: '49mm Satin Black Titanium Case, 3000-Nit Sapphire Display, Dual-Frequency L1+L5 GPS, 100m WR',
    description:
      'Rugged 49mm aerospace titanium smartwatch engineered for endurance athletes and alpine explorers with 72-hour low-power battery life, siren, depth gauge, and customizable Action button.',
    thumbnail: createProductSvg('Apple Watch Ultra 2', 'Wearables', '#090d16', '#ea580c', '⌚'),
    reviews: [
      { reviewerName: 'Yerdaulet M.', rating: 5, date: '2026-10-15', comment: 'Dual-frequency GPS tracks mountain trails in Almaty with pinpoint accuracy.' }
    ]
  },
  {
    id: 23,
    title: 'Garmin Fenix 8 AMOLED Sapphire 47mm',
    sku: 'TV-WRB-023',
    category: 'Wearables',
    brand: 'Garmin',
    price: 1099,
    discountPercentage: 8,
    rating: 4.84,
    stock: 3,
    availabilityStatus: 'Low Stock',
    weight: '0.073 kg',
    dimensions: '4.7 x 4.7 x 1.38 cm',
    warrantyInformation: '2 Years Garmin Outdoor Warranty',
    shippingInformation: 'Ships in 1–2 business days',
    returnPolicy: '30-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    featured: false,
    tags: ['wearables', 'garmin', 'multisport', 'sapphire', 'navigation'],
    specs: '16-Day Battery Life, Built-in LED Flashlight, Offline TopoActive Maps, Dive-Rated Inductive Buttons',
    description:
      'Multisport GPS adventure watch featuring a scratch-resistant sapphire lens, titanium bezel, offline topographic maps, voice command support, and 16 days of continuous battery life.',
    thumbnail: createProductSvg('Garmin Fenix 8 Sapphire', 'Wearables', '#14532d', '#059669', '🧭'),
    reviews: [
      { reviewerName: 'Alen O.', rating: 4.9, date: '2026-09-29', comment: 'Only charging twice a month with full health metrics is unbeatable.' }
    ]
  },
  {
    id: 24,
    title: 'Meta Quest 3S Mixed Reality Headset 256GB',
    sku: 'TV-WRB-024',
    category: 'Wearables',
    brand: 'Meta',
    price: 499,
    discountPercentage: 10,
    rating: 4.62,
    stock: 0,
    availabilityStatus: 'Pre-Order',
    weight: '0.515 kg',
    dimensions: '18.4 x 16.0 x 9.8 cm',
    warrantyInformation: '1 Year Meta Hardware Warranty',
    shippingInformation: 'Pre-order ships in 5 business days',
    returnPolicy: '30-day return policy',
    minimumOrderQuantity: 1,
    releaseYear: 2026,
    featured: false,
    tags: ['wearables', 'vr', 'mixed-reality', 'spatial-computing', 'meta'],
    specs: 'Snapdragon XR2 Gen 2, Full-Color Passthrough, Touch Plus Controllers, Multi-Screen Virtual Desk',
    description:
      'Standalone mixed-reality headset capable of spawning three virtual ultrawide monitors for your laptop anywhere, alongside full-color high-definition passthrough and spatial gaming.',
    thumbnail: createProductSvg('Meta Quest 3S MR 256GB', 'Wearables', '#1e1b4b', '#7c3aed', '🥽'),
    reviews: [
      { reviewerName: 'Birzhan O.', rating: 4.6, date: '2026-10-06', comment: 'Great for virtual multi-monitor coding when traveling.' }
    ]
  }
];

export const CATEGORIES = ['Laptops', 'Smartphones', 'Tablets', 'Audio', 'Accessories', 'Wearables'];
export const AVAILABILITY_STATUSES = ['In Stock', 'Low Stock', 'Pre-Order'];

// Simulated network delay that respects AbortSignal (just like native fetch)
function simulateNetworkDelay(ms = 260, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      const abortErr = new DOMException('The operation was aborted.', 'AbortError');
      return reject(abortErr);
    }

    const timer = setTimeout(() => {
      if (signal?.aborted) {
        const abortErr = new DOMException('The operation was aborted.', 'AbortError');
        reject(abortErr);
      } else {
        resolve();
      }
    }, ms);

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        },
        { once: true }
      );
    }
  });
}

/**
 * Fetch paginated, filtered, and sorted items from the Fake API.
 * Behaves identically to a REST endpoint: GET /api/items?q=...&category=...&status=...&minRating=...&sort=...&page=...&limit=...
 */
export async function fetchItems(params = {}, options = {}) {
  const {
    q = '',
    category = 'all',
    status = 'all',
    minRating = '0',
    sort = 'featured',
    page = 1,
    limit = 6,
    simulateError = false
  } = params;

  const { signal } = options;

  await simulateNetworkDelay(260, signal);

  if (simulateError) {
    throw new Error('503 Service Unavailable: Simulated API network error. Click Retry to recover.');
  }

  let filtered = [...FAKE_API_ITEMS];

  // 1. Search query (title, brand, category, sku, description, tags)
  const trimmedQuery = String(q).trim().toLowerCase();
  if (trimmedQuery) {
    filtered = filtered.filter((item) => {
      const searchableText = [
        item.title,
        item.brand,
        item.category,
        item.sku,
        item.description,
        item.specs,
        ...(item.tags || [])
      ]
        .join(' ')
        .toLowerCase();
      return searchableText.includes(trimmedQuery);
    });
  }

  // 2. Filter 1: Category
  if (category && category !== 'all') {
    filtered = filtered.filter(
      (item) => item.category.toLowerCase() === String(category).toLowerCase()
    );
  }

  // 3. Filter 2: Availability Status
  if (status && status !== 'all') {
    filtered = filtered.filter(
      (item) => item.availabilityStatus.toLowerCase() === String(status).toLowerCase()
    );
  }

  // 4. Filter 3: Minimum Rating
  const parsedMinRating = parseFloat(minRating) || 0;
  if (parsedMinRating > 0) {
    filtered = filtered.filter((item) => item.rating >= parsedMinRating);
  }

  // 5. Sorting
  filtered.sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'rating-desc':
        return b.rating - a.rating;
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'discount-desc':
        return b.discountPercentage - a.discountPercentage;
      case 'stock-desc':
        return b.stock - a.stock;
      case 'featured':
      default:
        return Number(b.featured) - Number(a.featured) || a.id - b.id;
    }
  });

  // 6. Pagination
  const safeLimit = Math.max(1, parseInt(limit, 10) || 6);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(Math.max(1, parseInt(page, 10) || 1), totalPages);
  const startIndex = (safePage - 1) * safeLimit;
  const paginatedItems = filtered.slice(startIndex, startIndex + safeLimit);

  return {
    items: paginatedItems,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    categories: CATEGORIES,
    statuses: AVAILABILITY_STATUSES
  };
}

/**
 * Fetch a single item by ID from the API.
 * Validates the ID format, checks existence, and returns related items from the same category.
 */
export async function fetchItemById(rawId, options = {}) {
  const { signal, simulateError = false } = options;

  await simulateNetworkDelay(280, signal);

  if (simulateError) {
    throw new Error('500 Internal Server Error: Failed to load item details from API.');
  }

  // Validate ID format (must be positive integer)
  const idStr = String(rawId ?? '').trim();
  if (!/^\d+$/.test(idStr)) {
    const invalidError = new Error(`Invalid item ID "${rawId}". Item IDs must be numeric (e.g., 1 to 24).`);
    invalidError.code = 'INVALID_ID';
    invalidError.status = 400;
    throw invalidError;
  }

  const parsedId = Number(idStr);
  const foundItem = FAKE_API_ITEMS.find((item) => item.id === parsedId);

  if (!foundItem) {
    const notFoundError = new Error(`Item with ID #${parsedId} was not found in the catalog.`);
    notFoundError.code = 'NOT_FOUND';
    notFoundError.status = 404;
    throw notFoundError;
  }

  const relatedItems = FAKE_API_ITEMS.filter(
    (item) => item.category === foundItem.category && item.id !== foundItem.id
  ).slice(0, 3);

  return {
    item: foundItem,
    relatedItems
  };
}

/**
 * Fetch full catalog dataset for Dashboard analytics & interactive calculations.
 */
export async function fetchAllItemsForDashboard(options = {}) {
  const { signal } = options;
  await simulateNetworkDelay(240, signal);
  return {
    items: [...FAKE_API_ITEMS],
    categories: CATEGORIES,
    statuses: AVAILABILITY_STATUSES,
    lastUpdated: new Date().toISOString()
  };
}
