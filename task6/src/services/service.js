/**
 * src/services/service.js
 * Centralized Hardware Catalog API Service integrated with QueryCacheService.
 *
 * Features:
 * - 24 Flagship Hardware SKUs across 6 Categories with 14+ technical attributes
 * - Self-contained SVG vector thumbnails (zero external broken image dependencies)
 * - Cached queries with structured query keys:
 *     ['products', 'list', { category, limit, minRating, page, q, sort, status }]
 *     ['products', 'detail', { id }]
 *     ['products', 'dashboard', 'all']
 * - Automatic cache invalidation (`queryCache.invalidateQueries(['products'])`)
 *   on Create (`createItem`), Update (`updateItem`), Delete (`deleteItem`), and Reset (`resetCatalogToDefault`)
 * - Full AbortController (`signal`) support to prevent stale request race conditions
 */
import { queryCache } from './cacheService.js';

const CATALOG_STORAGE_KEY = 'techvault_catalog_items_v2';

export const PRODUCT_CATEGORIES = [
  'Laptops',
  'Smartphones',
  'Tablets',
  'Audio',
  'Accessories',
  'Wearables',
];

export const AVAILABILITY_STATUSES = ['In Stock', 'Low Stock', 'Pre-Order'];

const CATEGORY_PALETTES = {
  Laptops: { bg1: '#0f172a', bg2: '#1e3a8a', accent: '#38bdf8', icon: 'LAPTOP' },
  Smartphones: { bg1: '#1e1b4b', bg2: '#312e81', accent: '#a78bfa', icon: 'PHONE' },
  Tablets: { bg1: '#042f2e', bg2: '#115e59', accent: '#2dd4bf', icon: 'TABLET' },
  Audio: { bg1: '#3b0764', bg2: '#581c87', accent: '#e879f9', icon: 'AUDIO' },
  Accessories: { bg1: '#1c1917', bg2: '#3f3f46', accent: '#fbbf24', icon: 'GEAR' },
  Wearables: { bg1: '#064e3b', bg2: '#065f46', accent: '#34d399', icon: 'WATCH' },
};

/**
 * Generates a crisp, self-contained SVG data URI thumbnail for any hardware SKU
 */
export function buildHardwareSvgThumbnail(item) {
  const palette = CATEGORY_PALETTES[item.category] || CATEGORY_PALETTES.Laptops;
  const safeTitle = String(item.title || 'Hardware SKU')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 28);
  const safeBrand = String(item.brand || 'TechVault')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeSku = String(item.sku || 'TV-SKU')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300" width="480" height="300">
    <defs>
      <linearGradient id="g_${item.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg1}" />
        <stop offset="100%" stop-color="${palette.bg2}" />
      </linearGradient>
    </defs>
    <rect width="480" height="300" rx="18" fill="url(#g_${item.id})" />
    <circle cx="410" cy="60" r="95" fill="${palette.accent}" opacity="0.12" />
    <circle cx="75" cy="250" r="80" fill="${palette.accent}" opacity="0.08" />
    <rect x="28" y="24" width="110" height="28" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.18)" />
    <text x="83" y="42" fill="${palette.accent}" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle">${safeSku}</text>
    <rect x="165" y="68" width="150" height="104" rx="14" fill="rgba(15,23,42,0.55)" stroke="${palette.accent}" stroke-width="2" />
    <line x1="190" y1="100" x2="290" y2="100" stroke="${palette.accent}" stroke-width="2" opacity="0.65" />
    <line x1="205" y1="122" x2="275" y2="122" stroke="#e2e8f0" stroke-width="2" opacity="0.45" />
    <text x="240" y="150" fill="${palette.accent}" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="800" text-anchor="middle" letter-spacing="2">${palette.icon}</text>
    <text x="240" y="218" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle" letter-spacing="1">${safeBrand.toUpperCase()}</text>
    <text x="240" y="244" fill="#f8fafc" font-family="Inter, system-ui, sans-serif" font-size="17" font-weight="700" text-anchor="middle">${safeTitle}</text>
    <text x="240" y="270" fill="${palette.accent}" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">$${Number(item.price || 0).toLocaleString()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const INITIAL_RAW_ITEMS = [
  {
    id: 1,
    title: 'MacBook Pro 16" M3 Max',
    sku: 'TV-LPT-001',
    category: 'Laptops',
    brand: 'Apple',
    price: 3499,
    discountPercentage: 8,
    rating: 4.95,
    stock: 14,
    availabilityStatus: 'In Stock',
    weight: '2.16 kg',
    dimensions: '35.57 x 24.81 x 1.68 cm',
    warrantyInformation: '3-Year AppleCare+ Enterprise Protection',
    shippingInformation: 'Ships within 24 hours via Express Courier',
    returnPolicy: '30-Day Zero-Restocking-Fee Return',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: '16-core CPU, 40-core GPU, 48GB Unified RAM, 1TB NVMe SSD, Liquid Retina XDR',
    description:
      'Flagship workstation laptop engineered for 3D rendering, large language model compilation, and studio mastering with 22-hour battery endurance.',
    tags: ['workstation', 'm3-max', 'oled-xdr', 'creator', 'flagship'],
    reviews: [
      {
        reviewer: 'Aidar K.',
        rating: 5,
        date: '2026-09-14',
        comment: 'Compiles full Docker + Rust microservices in half the time of our previous workstation.',
      },
      {
        reviewer: 'Elena V.',
        rating: 5,
        date: '2026-10-02',
        comment: 'Silent fan acoustics even under heavy Blender GPU viewport rendering.',
      },
    ],
  },
  {
    id: 2,
    title: 'ThinkPad X1 Carbon Gen 12',
    sku: 'TV-LPT-002',
    category: 'Laptops',
    brand: 'Lenovo',
    price: 1899,
    discountPercentage: 12,
    rating: 4.82,
    stock: 22,
    availabilityStatus: 'In Stock',
    weight: '1.09 kg',
    dimensions: '31.28 x 21.47 x 1.49 cm',
    warrantyInformation: '3-Year Premier Onsite Next-Business-Day Warranty',
    shippingInformation: 'Ships in 1-2 business days',
    returnPolicy: '30-Day Commercial Return Guarantee',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Intel Core Ultra 7 165U vPro, 32GB LPDDR5X, 1TB PCIe Gen4 SSD, 14" 2.8K OLED 120Hz',
    description:
      'Ultralight MIL-STD-810H carbon-fiber weave executive notebook featuring tactile TrackPoint controls, hardware TPM 2.0, and dual Thunderbolt 4.',
    tags: ['ultrabook', 'oled', 'business', 'linux-ready', 'lightweight'],
    reviews: [
      {
        reviewer: 'Timur S.',
        rating: 5,
        date: '2026-08-29',
        comment: 'Best keyboard travel in the industry and runs Ubuntu + Windows dual-boot effortlessly.',
      },
    ],
  },
  {
    id: 3,
    title: 'ROG Zephyrus G16 OLED',
    sku: 'TV-LPT-003',
    category: 'Laptops',
    brand: 'ASUS',
    price: 2399,
    discountPercentage: 10,
    rating: 4.86,
    stock: 7,
    availabilityStatus: 'Low Stock',
    weight: '1.85 kg',
    dimensions: '35.40 x 24.60 x 1.49 cm',
    warrantyInformation: '2-Year International Hardware Warranty',
    shippingInformation: 'Ships in 2-3 business days',
    returnPolicy: '14-Day Factory Sealed & Defective Exchange',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Intel Core Ultra 9 185H, RTX 4080 12GB, 32GB RAM, 2TB SSD, 16" 240Hz Nebula OLED',
    description:
      'CNC-milled aluminum gaming and AI engineering powerhouse combining a 240Hz G-SYNC OLED panel with vapor chamber liquid-metal cooling.',
    tags: ['gaming', 'oled', 'rtx-4080', 'high-refresh', 'creator'],
    reviews: [
      {
        reviewer: 'Daniyar M.',
        rating: 5,
        date: '2026-09-21',
        comment: 'The 240Hz OLED panel and 6-speaker array rival dedicated desktop setups.',
      },
    ],
  },
  {
    id: 4,
    title: 'XPS 14 Developer Edition',
    sku: 'TV-LPT-004',
    category: 'Laptops',
    brand: 'Dell',
    price: 1699,
    discountPercentage: 14,
    rating: 4.68,
    stock: 18,
    availabilityStatus: 'In Stock',
    weight: '1.68 kg',
    dimensions: '32.00 x 21.59 x 1.80 cm',
    warrantyInformation: '2-Year ProSupport Plus with Accidental Damage',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '30-Day Risk-Free Return Policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Intel Core Ultra 7 155H, RTX 4050, 32GB LPDDR5X, 1TB SSD, 14.5" 3.2K InfinityEdge OLED',
    description:
      'Precision-machined aluminum and Gorilla Glass Victus chassis with seamless haptic glass touchpad and edge-to-edge OLED clarity.',
    tags: ['oled', 'developer', 'infinity-edge', 'compact'],
    reviews: [
      {
        reviewer: 'Alisher B.',
        rating: 4.7,
        date: '2026-10-05',
        comment: 'Gorgeous build quality and color accuracy out of the box.',
      },
    ],
  },
  {
    id: 5,
    title: 'iPhone 16 Pro Max 512GB',
    sku: 'TV-SMP-005',
    category: 'Smartphones',
    brand: 'Apple',
    price: 1399,
    discountPercentage: 5,
    rating: 4.93,
    stock: 28,
    availabilityStatus: 'In Stock',
    weight: '0.227 kg',
    dimensions: '16.30 x 7.76 x 0.82 cm',
    warrantyInformation: '2-Year AppleCare+ Coverage Included',
    shippingInformation: 'Same-day dispatch on orders before 16:00',
    returnPolicy: '14-Day Standard Retail Return Policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'A18 Pro 3nm Chip, 6.9" Super Retina XDR 120Hz, 48MP Fusion + 5x Tetraprism, USB-C 10Gbps',
    description:
      'Grade 5 titanium flagship smartphone featuring dedicated Camera Control, 4K120 ProRes video recording directly to external SSDs, and Wi-Fi 7.',
    tags: ['5g', 'titanium', 'prores', 'flagship', 'usb-c'],
    reviews: [
      {
        reviewer: 'Madina N.',
        rating: 5,
        date: '2026-10-12',
        comment: 'Battery easily lasts two full workdays and 4K120 video stabilization is unmatched.',
      },
    ],
  },
  {
    id: 6,
    title: 'Galaxy S25 Ultra 512GB',
    sku: 'TV-SMP-006',
    category: 'Smartphones',
    brand: 'Samsung',
    price: 1299,
    discountPercentage: 9,
    rating: 4.89,
    stock: 19,
    availabilityStatus: 'In Stock',
    weight: '0.232 kg',
    dimensions: '16.23 x 7.90 x 0.86 cm',
    warrantyInformation: '2-Year Samsung Care+ Authorized Warranty',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '30-Day Satisfaction Return Guarantee',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Snapdragon 8 Gen 4 for Galaxy, 12GB RAM, 6.8" Dynamic AMOLED 2X Anti-Reflective, S-Pen',
    description:
      'Anti-reflective Gorilla Armor titanium smartphone with integrated Bluetooth S-Pen, 200MP quad-telephoto camera array, and Samsung DeX desktop mode.',
    tags: ['amoled', 's-pen', '200mp', 'android', 'flagship'],
    reviews: [
      {
        reviewer: 'Ruslan K.',
        rating: 5,
        date: '2026-09-19',
        comment: 'The anti-reflective display coating makes outdoor reading effortless.',
      },
    ],
  },
  {
    id: 7,
    title: 'Pixel 9 Pro XL 256GB',
    sku: 'TV-SMP-007',
    category: 'Smartphones',
    brand: 'Google',
    price: 1099,
    discountPercentage: 11,
    rating: 4.81,
    stock: 9,
    availabilityStatus: 'Low Stock',
    weight: '0.221 kg',
    dimensions: '16.28 x 7.66 x 0.85 cm',
    warrantyInformation: '2-Year Google Preferred Care Warranty',
    shippingInformation: 'Ships in 1-2 business days',
    returnPolicy: '15-Day Easy Return Window',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Google Tensor G4, 16GB RAM, 6.8" Super Actua LTPO OLED (3000 nits), Triple 50MP/48MP/48MP',
    description:
      'Reference Android engineering device with 7 years of guaranteed OS & security updates, 3000-nit Super Actua OLED, and on-device Gemini Nano.',
    tags: ['pixel', 'android', 'camera', 'oled', 'ai-native'],
    reviews: [
      {
        reviewer: 'Sanzhar T.',
        rating: 4.8,
        date: '2026-10-08',
        comment: 'Still photography dynamic range and skin tone accuracy are extraordinary.',
      },
    ],
  },
  {
    id: 8,
    title: 'Xperia 1 VI Creator Edition',
    sku: 'TV-SMP-008',
    category: 'Smartphones',
    brand: 'Sony',
    price: 1199,
    discountPercentage: 7,
    rating: 4.72,
    stock: 0,
    availabilityStatus: 'Pre-Order',
    weight: '0.192 kg',
    dimensions: '16.20 x 7.40 x 0.82 cm',
    warrantyInformation: '2-Year Sony Pro Imaging Warranty',
    shippingInformation: 'Pre-Order batch dispatches in 7 business days',
    returnPolicy: '30-Day Pre-Order Cancellation & Return',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Snapdragon 8 Gen 3, 12GB RAM, 512GB + microSDXC, Continuous 85-170mm Optical Telephoto, 3.5mm DAC',
    description:
      'Built for Alpha camera cinematographers with a true continuous optical zoom lens, two-stage physical shutter button, and audiophile 3.5mm jack.',
    tags: ['creator', 'optical-zoom', 'audiophile', 'pre-order'],
    reviews: [
      {
        reviewer: 'Viktor P.',
        rating: 4.7,
        date: '2026-08-15',
        comment: 'Works as an external 4K OLED monitor for my Sony A7 IV camera via USB-C.',
      },
    ],
  },
  {
    id: 9,
    title: 'iPad Pro 13" M4 Tandem OLED',
    sku: 'TV-TBL-009',
    category: 'Tablets',
    brand: 'Apple',
    price: 1499,
    discountPercentage: 6,
    rating: 4.94,
    stock: 16,
    availabilityStatus: 'In Stock',
    weight: '0.579 kg',
    dimensions: '28.16 x 21.55 x 0.51 cm',
    warrantyInformation: '2-Year AppleCare+ Coverage',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '30-Day Return Guarantee',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Apple M4 10-core CPU/GPU, 16GB RAM, 512GB SSD, Ultra Retina XDR Tandem OLED, 5.1mm thin',
    description:
      'Ultra-thin 5.1mm slate featuring breakthrough Tandem OLED dual-layer luminance, Apple Pencil Pro squeeze/barrel-roll haptics, and Thunderbolt 4.',
    tags: ['tandem-oled', 'm4', 'stylus', 'creator', 'ulkeslim'],
    reviews: [
      {
        reviewer: 'Kamila A.',
        rating: 5,
        date: '2026-09-30',
        comment: 'Tandem OLED contrast makes HDR photo grading and illustration pure joy.',
      },
    ],
  },
  {
    id: 10,
    title: 'Galaxy Tab S10 Ultra 14.6"',
    sku: 'TV-TBL-010',
    category: 'Tablets',
    brand: 'Samsung',
    price: 1199,
    discountPercentage: 10,
    rating: 4.84,
    stock: 12,
    availabilityStatus: 'In Stock',
    weight: '0.718 kg',
    dimensions: '32.64 x 20.86 x 0.54 cm',
    warrantyInformation: '2-Year Samsung Authorized Warranty',
    shippingInformation: 'Ships in 1-2 business days',
    returnPolicy: '30-Day Return Policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: '14.6" Dynamic AMOLED 2X 120Hz, 12GB RAM, 512GB Storage, IP68 Water Resistant, S-Pen Included',
    description:
      'Expansive 14.6-inch IP68 water-and-dust resistant AMOLED canvas bundled with a low-latency S-Pen for multi-window engineering diagrams.',
    tags: ['amoled', 's-pen', 'ip68', 'large-screen'],
    reviews: [
      {
        reviewer: 'Nurlan T.',
        rating: 5,
        date: '2026-10-18',
        comment: 'Having the S-Pen included in the box and IP68 durability makes it unbeatable for lectures.',
      },
    ],
  },
  {
    id: 11,
    title: 'Surface Pro 11 OLED Business',
    sku: 'TV-TBL-011',
    category: 'Tablets',
    brand: 'Microsoft',
    price: 1349,
    discountPercentage: 11,
    rating: 4.75,
    stock: 6,
    availabilityStatus: 'Low Stock',
    weight: '0.895 kg',
    dimensions: '28.70 x 20.90 x 0.93 cm',
    warrantyInformation: '3-Year Microsoft Complete Commercial Plan',
    shippingInformation: 'Ships in 2 business days',
    returnPolicy: '30-Day Commercial Return Policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Snapdragon X Elite 12-Core, 16GB LPDDR5X, 512GB Removable Gen4 SSD, 13" 120Hz OLED Kickstand',
    description:
      '2-in-1 detachable workstation tablet with integrated 165-degree fluid kickstand, user-replaceable M.2 SSD bay, and dual USB4 ports.',
    tags: ['2-in-1', 'oled', 'windows-11', 'detachable'],
    reviews: [
      {
        reviewer: 'Askar D.',
        rating: 4.8,
        date: '2026-09-11',
        comment: 'Runs full desktop VS Code and Docker containers with 14 hours of real battery life.',
      },
    ],
  },
  {
    id: 12,
    title: 'Wacom Movink 13 OLED Pen Display',
    sku: 'TV-TBL-012',
    category: 'Tablets',
    brand: 'Wacom',
    price: 749,
    discountPercentage: 5,
    rating: 4.88,
    stock: 15,
    availabilityStatus: 'In Stock',
    weight: '0.420 kg',
    dimensions: '31.95 x 20.52 x 0.40 cm',
    warrantyInformation: '2-Year Wacom Pro Care Warranty',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '30-Day Studio Return Policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: '13.3" Samsung OLED 100% DCI-P3 Pantone Validated, Wacom Pro Pen 3 (8192 levels), 4mm profile',
    description:
      'Professional creative pen display featuring zero-parallax Corning Gorilla Glass, 10-bit Pantone calibrated color, and battery-free Pro Pen 3.',
    tags: ['wacom', 'oled', 'illustration', 'pantone'],
    reviews: [
      {
        reviewer: 'Zarina M.',
        rating: 4.9,
        date: '2026-10-01',
        comment: 'At 420 grams it slips right next to my laptop in the same sleeve.',
      },
    ],
  },
  {
    id: 13,
    title: 'WH-1000XM5 Wireless ANC Studio',
    sku: 'TV-AUD-013',
    category: 'Audio',
    brand: 'Sony',
    price: 399,
    discountPercentage: 15,
    rating: 4.91,
    stock: 34,
    availabilityStatus: 'In Stock',
    weight: '0.250 kg',
    dimensions: '22.48 x 18.50 x 7.62 cm',
    warrantyInformation: '2-Year Sony Audio Warranty',
    shippingInformation: 'Same-day dispatch',
    returnPolicy: '30-Day Risk-Free Audition Return',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: '8-Mic Auto NC Optimizer, Integrated V1 + QN1 Processors, 30mm Carbon Fiber Driver, LDAC 990kbps',
    description:
      'Industry-benchmark active noise-canceling over-ear headphones with multipoint Bluetooth 5.3, 30-hour battery life, and crystal-clear beamforming mics.',
    tags: ['anc', 'ldac', 'wireless', 'headphones', 'bestseller'],
    reviews: [
      {
        reviewer: 'Olzhas R.',
        rating: 5,
        date: '2026-10-14',
        comment: 'Blocks out open-office chatter and airplane cabin roar completely.',
      },
    ],
  },
  {
    id: 14,
    title: 'AirPods Max USB-C Lossless',
    sku: 'TV-AUD-014',
    category: 'Audio',
    brand: 'Apple',
    price: 549,
    discountPercentage: 7,
    rating: 4.78,
    stock: 11,
    availabilityStatus: 'In Stock',
    weight: '0.384 kg',
    dimensions: '18.73 x 16.86 x 8.34 cm',
    warrantyInformation: '2-Year AppleCare+ for Headphones',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '14-Day Standard Return Policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Apple H2 Acoustic Architecture, Anodized Aluminum Cups, Personalized Spatial Audio, USB-C Audio',
    description:
      'Acoustically engineered over-ear headphones with breathable knit-mesh canopy, Digital Crown volume precision, and theatrical Dolby Atmos Spatial Audio.',
    tags: ['spatial-audio', 'usb-c', 'anc', 'aluminum'],
    reviews: [
      {
        reviewer: 'Dana K.',
        rating: 4.8,
        date: '2026-09-25',
        comment: 'Transparency mode sounds completely natural during long remote pair-programming calls.',
      },
    ],
  },
  {
    id: 15,
    title: 'Sennheiser HD 660S2 Open-Back',
    sku: 'TV-AUD-015',
    category: 'Audio',
    brand: 'Sennheiser',
    price: 599,
    discountPercentage: 12,
    rating: 4.92,
    stock: 8,
    availabilityStatus: 'Low Stock',
    weight: '0.260 kg',
    dimensions: '24.00 x 19.50 x 10.50 cm',
    warrantyInformation: '2-Year Sennheiser Audiophile Global Warranty',
    shippingInformation: 'Ships in 1-2 business days',
    returnPolicy: '30-Day Audiophile Home Trial',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: '300-Ohm Ultra-Light Aluminum Voice Coil, 38mm Airflow Transducer, 4.4mm Pentaconn Balanced + 6.3mm',
    description:
      'Reference open-back audiophile headphones crafted in Ireland with extended sub-bass resonance, velour earpads, and zero listener fatigue.',
    tags: ['audiophile', 'open-back', 'balanced', 'reference'],
    reviews: [
      {
        reviewer: 'Maxim L.',
        rating: 5,
        date: '2026-08-19',
        comment: 'Soundstage imaging and midrange vocals are breathtaking on a desktop DAC/Amp.',
      },
    ],
  },
  {
    id: 16,
    title: 'Shure SM7dB Active Preamp Mic',
    sku: 'TV-AUD-016',
    category: 'Audio',
    brand: 'Shure',
    price: 499,
    discountPercentage: 6,
    rating: 4.96,
    stock: 20,
    availabilityStatus: 'In Stock',
    weight: '0.837 kg',
    dimensions: '19.80 x 13.40 x 9.60 cm',
    warrantyInformation: '2-Year Shure Broadcast Hardware Warranty',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '30-Day Studio Return Policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Cardioid Dynamic Capsule, Built-in +18dB/+28dB Klark Teknik Preamp, XLR Phantom Power, Air Suspension',
    description:
      'Legendary broadcast dynamic vocal microphone upgraded with an active inline preamp that delivers up to +28dB of clean, ultra-low-noise gain.',
    tags: ['microphone', 'broadcast', 'xlr', 'studio'],
    reviews: [
      {
        reviewer: 'Arman Z.',
        rating: 5,
        date: '2026-10-03',
        comment: 'No external Cloudlifter needed anymore—plugs straight into our Focusrite interface.',
      },
    ],
  },
  {
    id: 17,
    title: 'Keychron Q1 Max QMK/VIA Custom',
    sku: 'TV-ACC-017',
    category: 'Accessories',
    brand: 'Keychron',
    price: 219,
    discountPercentage: 10,
    rating: 4.90,
    stock: 26,
    availabilityStatus: 'In Stock',
    weight: '1.724 kg',
    dimensions: '32.75 x 14.50 x 3.58 cm',
    warrantyInformation: '1-Year Keychron Mechanical Warranty',
    shippingInformation: 'Same-day dispatch',
    returnPolicy: '30-Day Return Guarantee',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Full CNC 6063 Aluminum, Double-Gasket Mount, 2.4GHz 1000Hz + Bluetooth 5.1 + USB-C, Hot-Swappable',
    description:
      'Heavy-duty 75% custom mechanical keyboard with open-source QMK/VIA keymap firmware, double-shot PBT keycaps, and multi-layer acoustic foam.',
    tags: ['keyboard', 'mechanical', 'qmk', 'aluminum', 'wireless'],
    reviews: [
      {
        reviewer: 'Nurlan T.',
        rating: 5,
        date: '2026-10-20',
        comment: 'Deep thocky acoustics right out of the box and browser-based VIA key remapping is instant.',
      },
    ],
  },
  {
    id: 18,
    title: 'MX Master 3S Performance Mouse',
    sku: 'TV-ACC-018',
    category: 'Accessories',
    brand: 'Logitech',
    price: 99,
    discountPercentage: 15,
    rating: 4.88,
    stock: 45,
    availabilityStatus: 'In Stock',
    weight: '0.141 kg',
    dimensions: '12.49 x 8.43 x 5.10 cm',
    warrantyInformation: '2-Year Logitech Hardware Warranty',
    shippingInformation: 'Same-day dispatch',
    returnPolicy: '30-Day Return Guarantee',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: '8000 DPI Darkfield Glass Sensor, MagSpeed Electromagnetic Wheel, Quiet Click Switches, Logi Bolt',
    description:
      'Ergonomic sculpted productivity mouse capable of scrolling 1,000 lines per second silently and tracking flawlessly on 4mm clear glass desks.',
    tags: ['mouse', 'ergonomic', 'magspeed', 'developer', 'bestseller'],
    reviews: [
      {
        reviewer: 'Bekzat K.',
        rating: 5,
        date: '2026-09-07',
        comment: 'Horizontal thumb scroll wheel is essential for wide spreadsheets and timelines.',
      },
    ],
  },
  {
    id: 19,
    title: 'CalDigit TS4 Thunderbolt 4 Dock',
    sku: 'TV-ACC-019',
    category: 'Accessories',
    brand: 'CalDigit',
    price: 399,
    discountPercentage: 8,
    rating: 4.92,
    stock: 5,
    availabilityStatus: 'Low Stock',
    weight: '0.640 kg',
    dimensions: '14.10 x 11.30 x 4.20 cm',
    warrantyInformation: '2-Year CalDigit Pro Dock Warranty',
    shippingInformation: 'Ships in 1-2 business days',
    returnPolicy: '30-Day Return Policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: '18 Total Ports, 98W Host Charging, 2.5GbE Ethernet, Dual 6K 60Hz Display Support, UHS-II SD 4.0',
    description:
      'Single-cable workstation hub delivering 98W power delivery, 2.5 Gigabit Ethernet, three Thunderbolt 4 downstream ports, and 20W front USB-C PD.',
    tags: ['thunderbolt-4', 'dock', '2.5gbe', 'workstation'],
    reviews: [
      {
        reviewer: 'Serik M.',
        rating: 5,
        date: '2026-10-11',
        comment: 'Drives dual 4K 144Hz monitors and charges my 16-inch MacBook Pro over one cable.',
      },
    ],
  },
  {
    id: 20,
    title: 'Samsung T9 4TB USB 3.2x2 SSD',
    sku: 'TV-ACC-020',
    category: 'Accessories',
    brand: 'Samsung',
    price: 349,
    discountPercentage: 18,
    rating: 4.87,
    stock: 31,
    availabilityStatus: 'In Stock',
    weight: '0.122 kg',
    dimensions: '8.80 x 6.00 x 1.40 cm',
    warrantyInformation: '5-Year Samsung Limited SSD Warranty',
    shippingInformation: 'Same-day dispatch',
    returnPolicy: '30-Day Return Policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: '4TB NVMe Flash, 2000 MB/s Read & Write, Dynamic Thermal Guard, 3-Meter Drop Resistant, AES 256-bit',
    description:
      'Pocket-sized rugged external NVMe SSD sustaining 2,000 MB/s sequential throughput for raw 8K video libraries and virtual machine snapshots.',
    tags: ['ssd', 'nvme', 'storage', '4tb', 'usb-c'],
    reviews: [
      {
        reviewer: 'Yerkebulan A.',
        rating: 4.9,
        date: '2026-09-28',
        comment: 'Sustains full write speed without thermal throttling during 300GB backups.',
      },
    ],
  },
  {
    id: 21,
    title: 'Apple Watch Ultra 2 Black Titanium',
    sku: 'TV-WRB-021',
    category: 'Wearables',
    brand: 'Apple',
    price: 799,
    discountPercentage: 6,
    rating: 4.91,
    stock: 17,
    availabilityStatus: 'In Stock',
    weight: '0.061 kg',
    dimensions: '4.90 x 4.40 x 1.44 cm',
    warrantyInformation: '2-Year AppleCare+ for Apple Watch Ultra',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '14-Day Standard Return Policy',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: '49mm Satin Black Grade 5 Titanium, 3000-Nit Sapphire Display, Dual-Frequency L1+L5 GPS, 100m Dive',
    description:
      'Rugged endurance smartwatch featuring a customizable Action button, EN13319 dive computer certification, 86dB emergency siren, and 72-hour low-power mode.',
    tags: ['titanium', 'gps', 'smartwatch', 'dive', 'rugged'],
    reviews: [
      {
        reviewer: 'Kuanysh B.',
        rating: 5,
        date: '2026-10-16',
        comment: 'Dual-frequency GPS tracks mountain trail switchbacks in Almaty with pinpoint accuracy.',
      },
    ],
  },
  {
    id: 22,
    title: 'Garmin Fenix 8 AMOLED Sapphire 47mm',
    sku: 'TV-WRB-022',
    category: 'Wearables',
    brand: 'Garmin',
    price: 1099,
    discountPercentage: 5,
    rating: 4.94,
    stock: 9,
    availabilityStatus: 'Low Stock',
    weight: '0.073 kg',
    dimensions: '4.70 x 4.70 x 1.38 cm',
    warrantyInformation: '2-Year Garmin Adventure Warranty',
    shippingInformation: 'Ships in 1-2 business days',
    returnPolicy: '30-Day Return Guarantee',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: '1.4" Sapphire AMOLED, 16-Day Battery Life, Built-in LED Flashlight, Leakproof Inductive Buttons',
    description:
      'Multisport expedition GPS watch with preloaded TopoActive maps, dive-rated inductive metal buttons, voice command speaker/mic, and 16-day battery.',
    tags: ['garmin', 'amoled', 'expedition', 'gps', 'sapphire'],
    reviews: [
      {
        reviewer: 'Dastan E.',
        rating: 5,
        date: '2026-09-22',
        comment: 'Two full weeks of battery life with AMOLED and an integrated LED flashlight I use daily.',
      },
    ],
  },
  {
    id: 23,
    title: 'Oura Ring Gen 4 Brushed Titanium',
    sku: 'TV-WRB-023',
    category: 'Wearables',
    brand: 'Oura',
    price: 399,
    discountPercentage: 8,
    rating: 4.76,
    stock: 21,
    availabilityStatus: 'In Stock',
    weight: '0.004 kg',
    dimensions: '2.10 x 2.10 x 0.28 cm',
    warrantyInformation: '2-Year Oura Hardware Protection',
    shippingInformation: 'Ships within 24 hours',
    returnPolicy: '30-Day Size Exchange & Return Guarantee',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'All-Titanium Recessed Sensor Interior, 18-Path Smart Sensing PPG, SpO2, HRV & Skin Temp, 8-Day Battery',
    description:
      'Screen-free biometric smart ring utilizing 18-path recessed optical sensors for clinical-grade sleep staging, heart-rate variability, and recovery tracking.',
    tags: ['smart-ring', 'biometrics', 'titanium', 'sleep-tracking'],
    reviews: [
      {
        reviewer: 'Aigerim S.',
        rating: 4.8,
        date: '2026-10-09',
        comment: 'Completely flush interior sensors feel just like a normal wedding band.',
      },
    ],
  },
  {
    id: 24,
    title: 'XREAL Air 2 Ultra AR Spatial Glasses',
    sku: 'TV-WRB-024',
    category: 'Wearables',
    brand: 'XREAL',
    price: 699,
    discountPercentage: 10,
    rating: 4.73,
    stock: 0,
    availabilityStatus: 'Pre-Order',
    weight: '0.080 kg',
    dimensions: '14.85 x 5.14 x 4.60 cm',
    warrantyInformation: '1-Year XREAL Developer Hardware Warranty',
    shippingInformation: 'Pre-Order dispatches in 5 business days',
    returnPolicy: '30-Day Pre-Order Return Guarantee',
    minimumOrderQuantity: 1,
    releaseYear: 2025,
    specs: 'Dual Sony Micro-OLED 120Hz, 52° FOV, 6DoF Dual 3D Environment Sensors, Electrochromic Dimming',
    description:
      'Titanium-frame 6DoF spatial computing glasses projecting a virtual triple-monitor 120Hz workspace from any USB-C DisplayPort laptop or handheld.',
    tags: ['ar-glasses', 'micro-oled', 'spatial', 'pre-order'],
    reviews: [
      {
        reviewer: 'Nurlan T.',
        rating: 4.8,
        date: '2026-10-04',
        comment: 'Three virtual floating terminal monitors on a plane seat without anyone peeking.',
      },
    ],
  },
];

function hydrateCatalogItems(items) {
  return items.map((item) => ({
    ...item,
    thumbnail: buildHardwareSvgThumbnail(item),
  }));
}

function loadCatalogFromStore() {
  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return hydrateCatalogItems(parsed);
      }
    }
  } catch {
    // Fallback to initial items
  }
  const initial = hydrateCatalogItems(INITIAL_RAW_ITEMS);
  saveCatalogToStore(initial);
  return initial;
}

function saveCatalogToStore(items) {
  try {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

let catalogMemoryStore = null;

function getCatalogStore() {
  if (!catalogMemoryStore) {
    catalogMemoryStore = loadCatalogFromStore();
  }
  return catalogMemoryStore;
}

function updateCatalogStore(nextItems) {
  catalogMemoryStore = hydrateCatalogItems(nextItems);
  saveCatalogToStore(catalogMemoryStore);
  return catalogMemoryStore;
}

/**
 * Simulates realistic network delay with AbortSignal support
 */
function simulateNetworkDelay(ms = 250, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      resolve();
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
 * Fetches filtered, sorted, and paginated catalog items using QueryCacheService.
 * Query Key: ['products', 'list', { category, limit, minRating, page, q, sort, status }]
 */
export async function fetchItems(params = {}, options = {}) {
  const { signal, forceRefresh = false } = options;

  if (params.simulateError) {
    await simulateNetworkDelay(220, signal);
    const err = new Error(
      'Simulated 503 Gateway Timeout: Unable to reach the TechVault inventory cluster.'
    );
    err.code = 'NETWORK_ERROR';
    throw err;
  }

  const normalizedParams = {
    q: String(params.q || '').trim().toLowerCase(),
    category: params.category || 'all',
    status: params.status || 'all',
    minRating: Number(params.minRating || 0),
    sort: params.sort || 'featured',
    page: Math.max(1, Number(params.page || 1)),
    limit: Math.max(1, Number(params.limit || 6)),
  };

  const queryKey = ['products', 'list', normalizedParams];

  const cacheResult = await queryCache.fetchQuery({
    queryKey,
    forceRefresh,
    signal,
    queryFn: async ({ signal: fnSignal }) => {
      await simulateNetworkDelay(260, fnSignal);
      const sourceItems = [...getCatalogStore()];

      const filtered = sourceItems.filter((item) => {
        if (normalizedParams.q) {
          const haystack = [
            item.title,
            item.brand,
            item.category,
            item.sku,
            item.specs,
            item.description,
            ...(item.tags || []),
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(normalizedParams.q)) return false;
        }
        if (
          normalizedParams.category !== 'all' &&
          item.category.toLowerCase() !== normalizedParams.category.toLowerCase()
        ) {
          return false;
        }
        if (
          normalizedParams.status !== 'all' &&
          item.availabilityStatus.toLowerCase() !== normalizedParams.status.toLowerCase()
        ) {
          return false;
        }
        if (normalizedParams.minRating > 0 && item.rating < normalizedParams.minRating) {
          return false;
        }
        return true;
      });

      filtered.sort((a, b) => {
        switch (normalizedParams.sort) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'rating-desc':
            return b.rating - a.rating;
          case 'rating-asc':
            return a.rating - b.rating;
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'stock-desc':
            return b.stock - a.stock;
          case 'featured':
          default:
            return a.id - b.id;
        }
      });

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / normalizedParams.limit));
      const safePage = Math.min(normalizedParams.page, totalPages);
      const startIndex = (safePage - 1) * normalizedParams.limit;
      const paginatedItems = filtered.slice(startIndex, startIndex + normalizedParams.limit);

      return {
        items: paginatedItems,
        total,
        page: safePage,
        limit: normalizedParams.limit,
        totalPages,
      };
    },
  });

  return {
    ...cacheResult.data,
    cacheMeta: {
      source: cacheResult.source,
      queryKey: cacheResult.queryKey,
      keyStr: cacheResult.keyStr,
      updatedAt: cacheResult.updatedAt,
      expiresAt: cacheResult.expiresAt,
      remainingTtlMs: cacheResult.remainingTtlMs,
    },
  };
}

/**
 * Fetches a single hardware item by ID using QueryCacheService.
 * Query Key: ['products', 'detail', { id }]
 */
export async function fetchItemById(rawId, options = {}) {
  const { signal, forceRefresh = false } = options;
  const idStr = String(rawId ?? '').trim();

  if (!/^\d+$/.test(idStr)) {
    await simulateNetworkDelay(160, signal);
    const invalidError = new Error(
      `Invalid item ID "${rawId}". Hardware SKU IDs must be numeric (e.g., 1 to 24).`
    );
    invalidError.code = 'INVALID_ID';
    throw invalidError;
  }

  const numericId = Number(idStr);
  const queryKey = ['products', 'detail', { id: numericId }];

  const cacheResult = await queryCache.fetchQuery({
    queryKey,
    forceRefresh,
    signal,
    queryFn: async ({ signal: fnSignal }) => {
      await simulateNetworkDelay(240, fnSignal);
      const sourceItems = getCatalogStore();
      const foundItem = sourceItems.find((item) => item.id === numericId);

      if (!foundItem) {
        const notFoundError = new Error(
          `Hardware item with ID #${idStr} was not found in the TechVault catalog.`
        );
        notFoundError.code = 'NOT_FOUND';
        throw notFoundError;
      }

      const relatedItems = sourceItems
        .filter((item) => item.category === foundItem.category && item.id !== foundItem.id)
        .slice(0, 3);

      return {
        item: foundItem,
        relatedItems,
      };
    },
  });

  return {
    ...cacheResult.data,
    cacheMeta: {
      source: cacheResult.source,
      queryKey: cacheResult.queryKey,
      keyStr: cacheResult.keyStr,
      updatedAt: cacheResult.updatedAt,
      expiresAt: cacheResult.expiresAt,
      remainingTtlMs: cacheResult.remainingTtlMs,
    },
  };
}

/**
 * Fetches all catalog items for the Analytics Dashboard using QueryCacheService.
 * Query Key: ['products', 'dashboard', 'all']
 */
export async function fetchAllItemsForDashboard(options = {}) {
  const { signal, forceRefresh = false } = options;
  const queryKey = ['products', 'dashboard', 'all'];

  const cacheResult = await queryCache.fetchQuery({
    queryKey,
    forceRefresh,
    signal,
    queryFn: async ({ signal: fnSignal }) => {
      await simulateNetworkDelay(220, fnSignal);
      return [...getCatalogStore()];
    },
  });

  return {
    items: cacheResult.data,
    cacheMeta: {
      source: cacheResult.source,
      queryKey: cacheResult.queryKey,
      keyStr: cacheResult.keyStr,
      updatedAt: cacheResult.updatedAt,
      expiresAt: cacheResult.expiresAt,
      remainingTtlMs: cacheResult.remainingTtlMs,
    },
  };
}

/**
 * CREATE MUTATION: Adds a new hardware SKU to the catalog and invalidates ['products'] cache.
 */
export async function createItem(payload) {
  await simulateNetworkDelay(240);
  const current = getCatalogStore();
  const nextId = current.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const stockNum = Math.max(0, Number(payload.stock ?? 15));
  const status =
    payload.availabilityStatus ||
    (stockNum === 0 ? 'Pre-Order' : stockNum < 10 ? 'Low Stock' : 'In Stock');

  const newItem = {
    id: nextId,
    title: String(payload.title || 'New TechVault Hardware SKU').trim(),
    sku: String(payload.sku || `TV-NEW-${String(nextId).padStart(3, '0')}`).trim().toUpperCase(),
    category: PRODUCT_CATEGORIES.includes(payload.category) ? payload.category : 'Laptops',
    brand: String(payload.brand || 'TechVault Labs').trim(),
    price: Math.max(1, Number(payload.price || 999)),
    discountPercentage: Math.min(50, Math.max(0, Number(payload.discountPercentage ?? 5))),
    rating: Math.min(5, Math.max(1, Number(payload.rating ?? 4.85))),
    stock: stockNum,
    availabilityStatus: status,
    weight: String(payload.weight || '1.25 kg').trim(),
    dimensions: String(payload.dimensions || '30.0 x 20.0 x 1.5 cm').trim(),
    warrantyInformation: String(
      payload.warrantyInformation || '2-Year TechVault Enterprise Warranty'
    ).trim(),
    shippingInformation: String(
      payload.shippingInformation || 'Ships within 24 hours via Express Courier'
    ).trim(),
    returnPolicy: String(payload.returnPolicy || '30-Day Zero-Restocking-Fee Return').trim(),
    minimumOrderQuantity: 1,
    releaseYear: 2026,
    specs: String(
      payload.specs || 'Custom Configured Silicon, 32GB Unified Memory, 1TB NVMe PCIe 4.0 SSD'
    ).trim(),
    description: String(
      payload.description ||
        'Newly provisioned hardware SKU added to the TechVault enterprise inventory cluster.'
    ).trim(),
    tags: Array.isArray(payload.tags)
      ? payload.tags
      : String(payload.tags || 'new-release, flagship, enterprise')
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
    reviews: [
      {
        reviewer: 'Nurlan T. (Catalog Admin)',
        rating: 5,
        date: new Date().toISOString().slice(0, 10),
        comment: 'Verified hardware telemetry and registered SKU in TechVault inventory.',
      },
    ],
  };

  newItem.thumbnail = buildHardwareSvgThumbnail(newItem);
  updateCatalogStore([newItem, ...current]);

  // Crucial Requirement: Invalidate cached queries after CREATE operation
  queryCache.invalidateQueries(['products']);
  return newItem;
}

/**
 * UPDATE MUTATION: Updates an existing hardware SKU and invalidates ['products'] cache.
 */
export async function updateItem(id, updates) {
  await simulateNetworkDelay(220);
  const numericId = Number(id);
  const current = getCatalogStore();
  const idx = current.findIndex((item) => item.id === numericId);

  if (idx === -1) {
    const err = new Error(`Cannot update: Item #${id} not found.`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  const existing = current[idx];
  const nextStock =
    updates.stock !== undefined ? Math.max(0, Number(updates.stock)) : existing.stock;
  const nextStatus =
    updates.availabilityStatus ||
    (nextStock === 0 ? 'Pre-Order' : nextStock < 10 ? 'Low Stock' : 'In Stock');

  const updatedItem = {
    ...existing,
    ...updates,
    id: existing.id,
    price: updates.price !== undefined ? Math.max(1, Number(updates.price)) : existing.price,
    stock: nextStock,
    availabilityStatus: nextStatus,
  };
  updatedItem.thumbnail = buildHardwareSvgThumbnail(updatedItem);

  const nextCatalog = [...current];
  nextCatalog[idx] = updatedItem;
  updateCatalogStore(nextCatalog);

  // Crucial Requirement: Invalidate cached queries after UPDATE operation
  queryCache.invalidateQueries(['products']);
  return updatedItem;
}

/**
 * DELETE MUTATION: Removes a hardware SKU from the catalog and invalidates ['products'] cache.
 */
export async function deleteItem(id) {
  await simulateNetworkDelay(220);
  const numericId = Number(id);
  const current = getCatalogStore();
  const exists = current.some((item) => item.id === numericId);

  if (!exists) {
    const err = new Error(`Cannot delete: Item #${id} not found.`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  const nextCatalog = current.filter((item) => item.id !== numericId);
  updateCatalogStore(nextCatalog);

  // Crucial Requirement: Invalidate cached queries after DELETE operation
  queryCache.invalidateQueries(['products']);
  return { deletedId: numericId, remainingCount: nextCatalog.length };
}

/**
 * RESET MUTATION: Restores the original 24 default hardware SKUs and invalidates ['products'] cache.
 */
export async function resetCatalogToDefault() {
  await simulateNetworkDelay(200);
  const restored = updateCatalogStore(INITIAL_RAW_ITEMS);
  queryCache.invalidateQueries(['products']);
  return restored;
}
