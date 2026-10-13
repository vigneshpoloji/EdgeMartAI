// ==========================================
// 1. UNIVERSAL THEMES & DEPARTMENT TAXONOMY
// ==========================================
export const DEPARTMENT_THEMES = {
  electronics: { bg: '#ffffff', accent: '#ea580c', heroGrad: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)', pillActive: '#ea580c', cardBorder: '#e2e8f0' },
  plants: { bg: '#ffffff', accent: '#15803d', heroGrad: 'linear-gradient(135deg, #15803d 0%, #052e16 100%)', pillActive: '#15803d', cardBorder: '#e2e8f0' },
  vegetables: { bg: '#ffffff', accent: '#16a34a', heroGrad: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', pillActive: '#16a34a', cardBorder: '#e2e8f0' },
  fruits: { bg: '#ffffff', accent: '#e11d48', heroGrad: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', pillActive: '#e11d48', cardBorder: '#e2e8f0' },
  food: { bg: '#ffffff', accent: '#dc2626', heroGrad: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)', pillActive: '#dc2626', cardBorder: '#e2e8f0' },
  jewellery: { bg: '#ffffff', accent: '#b45309', heroGrad: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', pillActive: '#b45309', cardBorder: '#e2e8f0' },
  pharmacy: { bg: '#ffffff', accent: '#059669', heroGrad: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', pillActive: '#059669', cardBorder: '#e2e8f0' },
  groceries: { bg: '#ffffff', accent: '#0284c7', heroGrad: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)', pillActive: '#0284c7', cardBorder: '#e2e8f0' },
  books: { bg: '#ffffff', accent: '#78350f', heroGrad: 'linear-gradient(135deg, #92400e 0%, #451a03 100%)', pillActive: '#78350f', cardBorder: '#e2e8f0' },
  meat: { bg: '#ffffff', accent: '#be123c', heroGrad: 'linear-gradient(135deg, #fb7185 0%, #9f1239 100%)', pillActive: '#be123c', cardBorder: '#e2e8f0' }
};

export const departments = [
  { id: 'electronics', name: 'Electronics', sla: 'Open-Box Inspection Delivery', hero: '/images/hero-electronics.jpg' },
  { id: 'plants', name: 'Plants & Garden', sla: 'Breathable Protective Crates', hero: '/images/hero-plants.jpg' },
  { id: 'vegetables', name: 'Fresh Vegetables', sla: 'Farm Harvest Morning Slot', hero: '/images/hero-vegetables.jpg' },
  { id: 'fruits', name: 'Seasonal Fruits', sla: 'Chilled Produce Delivery', hero: '/images/hero-fruits.jpg' },
  { id: 'food', name: 'Food Order', sla: 'Sub-35 Min Kitchen SLA', hero: '/images/hero-food.jpg' },
  { id: 'jewellery', name: 'Gold & Jewellery', sla: 'Armored Vault Courier', hero: '/images/hero-jewellery.jpg' },
  { id: 'pharmacy', name: 'Pharmacy (Rx)', sla: 'Licensed Pharmacist Verification', hero: '/images/hero-pharmacy.jpg' },
  { id: 'groceries', name: 'Groceries & Pantry', sla: 'Scheduled Slot Delivery', hero: '/images/hero-groceries.jpg' },
  { id: 'books', name: 'Books & Literary', sla: 'Bubble-Padded Mailer', hero: '/images/hero-books.jpg' },
  { id: 'meat', name: 'Meat & Seafood', sla: 'Cold-Chain Chilled Vacuum', hero: '/images/hero-meat.jpg' }
];

export const CATEGORIES = departments;

// ==========================================
// 2. ELECTRONICS DATA (AMAZON STYLE)
// ==========================================
export const ELECTRONICS_PRODUCTS = [
  {
    id: 'e0',
    name: 'XP-Pen Deco01 V3 Digital Graphics Drawing Pen Tablet (10" x 6.25", 16384 Levels of Pressure Sensitivity, Battery-Free Passive Stylus, Black)',
    brand: 'XP-Pen',
    category: 'electronics',
    subCategory: 'Computer Peripherals',
    price: 6495,
    originalPrice: 7999,
    discountPercent: 19,
    rating: 4.4,
    ratingsCount: 14890,
    boughtPastMonth: '500+ bought in past month',
    image: '/images/products/e0.jpg',
    images: [
      '/images/products/e0.jpg',
      '/images/products/e0_angle.jpg',
      '/images/products/e0_pen.jpg',
      '/images/products/e0_lifestyle.jpg',
      '/images/products/e0_box.jpg'
    ],
    inStock: true,
    primeDelivery: true,
    deliveryDate: 'Tomorrow by 2 PM',
    tag: 'EdgeMart Choice',
    dealOfDay: true,
    variants: {
      colors: [
        { name: 'Black', hex: '#111827', img: '/images/products/e0.jpg' },
        { name: 'Green', hex: '#86efac', img: '/images/products/e0.jpg' },
        { name: 'Pink', hex: '#f472b6', img: '/images/products/e0.jpg' }
      ]
    },
    bankOffers: [
      'Flat ₹750 Instant Discount on HDFC & ICICI Credit Cards',
      'No Cost EMI available starting at ₹315/month',
      'Get GST invoice and save up to 18% on business purchases'
    ],
    exchangeMaxVal: 1500,
    featuresTable: {
      'Brand': 'XP-Pen',
      'Connectivity': 'USB Type-C',
      'Pressure Sensitivity': '16384 Levels',
      'Operating System': 'Android 6.0 Marshmallow, Windows 11/10/8/7, macOS, ChromeOS',
      'Special Feature': '60° Tilt Support, Android Support, Battery-Free Stylus, 8 Shortcut Keys',
      'Active Area': '10 x 6.25 Inches'
    },
    aboutItem: [
      '[Large Active Area]: The XPPen Deco 01 V3 features a generous 10 x 6.25-inch (254 x 158.8 mm) active drawing surface, offering ample space for both artistic creation and digital writing sessions. Ideal for both digital drawing and online teaching.',
      '[16,384 Pressure Sensitivity Levels]: With 16384 levels of pressure sensitivity, the stylus offers pin-on-paper precision, drawing delicate lines with natural weight and shading.',
      '[Battery-Free Passive Stylus]: Stylus works just like a real pen—no battery and no charging required. Features two programmable side shortcut switches.',
      '[60° Tilt Function]: Supports up to 60 degrees of tilt brush effect, mimicking real pencil sketching techniques smoothly.',
      '[8 Customizable Express Keys]: Eight round shortcut keys (arranged in two groups of 4) are fully programmable and easily reachable for both right- and left-handed users.'
    ],
    boxContents: [
      '1x Deco 01 V3 Pen Tablet',
      '1x P03 Battery-Free Passive Pen',
      '8x Replacement Nibs',
      '1x Pen Stand',
      '1x USB-C to USB-A Cable',
      '1x USB to USB-C Adapter',
      '1x Anti-Fouling Drawing Glove',
      '1x Protective Surface Film'
    ],
    frequentlyBoughtTogether: [
      { id: 'acc1', name: 'Anti-Fouling Two-Finger Lycra Artist Glove for Drawing Tablet', price: 399, originalPrice: 699, image: '/images/products/e0_pen.jpg' },
      { id: 'acc2', name: 'AC48 Carrying Protective Hard Pouch Sleeve Case for 10-inch Tablets', price: 1295, originalPrice: 1999, image: '/images/products/e0_box.jpg' }
    ],
    specs: {
      'Model Name': 'Deco 01 V3',
      'Resolution': '5080 LPI',
      'Report Rate': '220 RPS (max)',
      'Thickness': '8 mm Ultra-thin',
      'Warranty': '1 Year Brand Domestic Warranty'
    },
    openBoxDelivery: true,
    returnDays: 7
  },
  {
    id: 'e1',
    name: 'Sony WH-1000XM5 Wireless Active Noise-Canceling Headphones',
    brand: 'Sony',
    category: 'electronics',
    subCategory: 'Audio & Headphones',
    price: 26990,
    originalPrice: 34990,
    discountPercent: 23,
    rating: 4.8,
    ratingsCount: 4210,
    image: '/images/products/e1.jpg',
    images: ['/images/products/e1.jpg', '/images/products/e3.jpg', '/images/products/e4.jpg'],
    inStock: true,
    primeDelivery: true,
    deliveryDate: 'Tomorrow by 2 PM',
    tag: 'Amazon Choice',
    dealOfDay: true,
    variants: {
      colors: [
        { name: 'Silver Platinum', hex: '#d1d5db', img: '/images/products/e1.jpg' },
        { name: 'Midnight Black', hex: '#0f172a', img: '/images/products/e1.jpg' },
        { name: 'Navy Blue', hex: '#1e3a8a', img: '/images/products/e1.jpg' }
      ]
    },
    bankOffers: [
      'Flat ₹2,500 Instant Discount on HDFC & ICICI Credit Cards',
      'Up to ₹1,250 No-Cost EMI on major credit cards',
      '5% Unlimited Cashback on Axis Bank Credit Card'
    ],
    exchangeMaxVal: 6500,
    specs: {
      'Brand': 'Sony',
      'Model Name': 'WH-1000XM5',
      'Color': 'Silver Platinum',
      'Form Factor': 'Over Ear',
      'Battery Life': '30 Hours with ANC',
      'Connectivity': 'Bluetooth 5.2, 3.5mm AUX',
      'Microphone': '8 Mics with AI Voice Pickup',
      'Warranty': '1 Year Manufacturer Warranty'
    },
    openBoxDelivery: true,
    imeiRequired: false,
    returnDays: 7
  },
  {
    id: 'e2',
    name: 'Keychron K2 V2 Wireless Mechanical Keyboard (RGB Backlit)',
    brand: 'Keychron',
    category: 'electronics',
    subCategory: 'Keyboards & Mice',
    price: 7499,
    originalPrice: 9999,
    discountPercent: 25,
    rating: 4.7,
    ratingsCount: 1850,
    image: '/images/products/e2.jpg',
    images: ['/images/products/e2.jpg', '/images/products/e3.jpg'],
    inStock: true,
    primeDelivery: true,
    deliveryDate: '2 Days Delivery',
    tag: 'Best Seller',
    dealOfDay: false,
    variants: {
      switches: [
        { type: 'Gateron Red (Linear)', priceDelta: 0 },
        { type: 'Gateron Brown (Tactile)', priceDelta: 200 },
        { type: 'Gateron Blue (Clicky)', priceDelta: 0 }
      ]
    },
    bankOffers: [
      '10% Instant Discount up to ₹1,000 on SBI Cards',
      'Flat ₹500 off using UPI transaction on checkout'
    ],
    exchangeMaxVal: 1200,
    specs: {
      'Brand': 'Keychron',
      'Layout': '75% Compact (84 Keys)',
      'Connectivity': 'Bluetooth 5.1 & Type-C Wired',
      'Battery': '4000 mAh Rechargeable Li-polymer',
      'OS Compatibility': 'macOS / Windows / iOS / Android',
      'Warranty': '1 Year Brand Domestic Warranty'
    },
    openBoxDelivery: true,
    imeiRequired: false,
    returnDays: 7
  },
  {
    id: 'e3',
    name: 'Logitech MX Master 3S Wireless Performance Ergonomic Mouse',
    brand: 'Logitech',
    category: 'electronics',
    subCategory: 'Keyboards & Mice',
    price: 8995,
    originalPrice: 10995,
    discountPercent: 18,
    rating: 4.9,
    ratingsCount: 8940,
    image: '/images/products/e3.jpg',
    images: ['/images/products/e3.jpg', '/images/products/e2.jpg'],
    inStock: true,
    primeDelivery: true,
    deliveryDate: 'Tomorrow by 11 AM',
    tag: 'Amazon Choice',
    dealOfDay: false,
    variants: {
      colors: [
        { name: 'Graphite Black', hex: '#1e293b', img: '/images/products/e3.jpg' },
        { name: 'Pale Grey', hex: '#e2e8f0', img: '/images/products/e3.jpg' }
      ]
    },
    bankOffers: [
      'Flat ₹750 Instant Discount with Federal Bank Debit Cards'
    ],
    exchangeMaxVal: 1500,
    specs: {
      'Sensor': 'Darkfield 8000 DPI (Tracks on glass)',
      'Buttons': '7 buttons with gesture button & thumb wheel',
      'Scroll Wheel': 'MagSpeed Electromagnetic scrolling (1000 lines/sec)',
      'Battery': 'Up to 70 days on full charge',
      'Warranty': '1 Year Limited Hardware Warranty'
    },
    openBoxDelivery: true,
    imeiRequired: false,
    returnDays: 7
  },
  {
    id: 'e4',
    name: 'Elgato Facecam Pro 4K60 Ultra HD Auto-Focus Studio Webcam',
    brand: 'Elgato',
    category: 'electronics',
    subCategory: 'Cameras & Streaming',
    price: 29999,
    originalPrice: 35999,
    discountPercent: 17,
    rating: 4.6,
    ratingsCount: 620,
    image: '/images/products/e4.jpg',
    images: ['/images/products/e4.jpg', '/images/products/e1.jpg'],
    inStock: true,
    primeDelivery: false,
    deliveryDate: '3-4 Days Delivery',
    tag: 'Studio Grade',
    dealOfDay: false,
    bankOffers: [
      'No Cost EMI starting at ₹2,500/month',
      '₹2,000 instant bank discount on ICICI cards'
    ],
    exchangeMaxVal: 4000,
    specs: {
      'Resolution': '4K at 60 FPS uncompressed video',
      'Optics': 'Elgato Prime Lens f/2.0 21mm',
      'Sensor': 'Sony STARVIS CMOS Sensor',
      'Interface': 'USB 3.0 Type-C',
      'Warranty': '2 Year Global Brand Warranty'
    },
    openBoxDelivery: true,
    imeiRequired: true,
    returnDays: 7
  }
];

// ==========================================
// 3. PLANTS & GARDEN DATA (NURSERYLIVE STYLE)
// ==========================================
export const NURSERY_CLUB_PLANS = [
  {
    id: 'club_starter',
    name: 'Green Thumb Starter',
    price: 499,
    cadence: '/month',
    badge: 'Popular for Beginners',
    perks: [
      '1 Curated Exotic Air-Purifying Plant / month',
      'Free Premium Ceramic Planter with drainage tray',
      'Monthly slow-release nutrient stick pack',
      'Free 48-hr Plant Transit Insurance'
    ]
  },
  {
    id: 'club_enthusiast',
    name: 'Urban Jungle VIP Club',
    price: 999,
    cadence: '/month',
    badge: 'Best Value',
    perks: [
      '2 Rare Botanical Flora / month',
      'Handcrafted Italian Terracotta or Self-Watering Pots',
      'Bi-weekly Organic Neem Oil spray & enriched potting mix',
      'Dedicated WhatsApp Video Call with Certified Horticulturist',
      'Zero delivery fee across all plant orders'
    ]
  }
];

export const POT_OPTIONS = [
  { id: 'pot_terracotta', name: 'Artisan Porous Terracotta', price: 180 },
  { id: 'pot_ceramic', name: 'Glazed Matte White Ceramic', price: 250 },
  { id: 'pot_selfwater', name: 'Smart Self-Watering Hydro-Pot', price: 320 }
];

export const SOIL_ADDONS = [
  { id: 'soil_perlite', name: 'Organic Perlite & Cocopeat Blend (2kg)', price: 140 },
  { id: 'fert_neem', name: 'Cold-Pressed Neem Oil Spray (500ml)', price: 199 },
  { id: 'nutri_sticks', name: 'Slow-Release Nitrogen Fertilizer Sticks (Pack of 10)', price: 99 }
];

export const PLANTS_PRODUCTS = [
  {
    id: 'p1',
    name: 'Ficus Lyrata (Bambino Fiddle Leaf Fig)',
    botanicalName: 'Ficus lyrata',
    category: 'plants',
    subCategory: 'Indoor Air-Purifiers',
    price: 1299,
    originalPrice: 1699,
    rating: 4.9,
    reviewsCount: 1420,
    image: '/images/products/o1.jpg',
    tag: 'NASA Air-Purifier',
    inStock: true,
    care: { light: 'Bright Indirect Sunlight (4-6 hrs)', water: 'Once a week', petSafe: false },
    specs: { 'Plant Height': '14 - 18 Inches', 'Pot Diameter': '6 Inch Pot', 'Toxins Removed': 'Formaldehyde, Benzene' },
    returnDays: 2
  },
  {
    id: 'p2',
    name: 'Monstera Deliciosa (Swiss Cheese Plant)',
    botanicalName: 'Monstera deliciosa',
    category: 'plants',
    subCategory: 'Exotic Foliage',
    price: 899,
    originalPrice: 1299,
    rating: 4.8,
    reviewsCount: 2310,
    image: '/images/hero-plants.jpg',
    tag: 'Trending Living Decor',
    inStock: true,
    care: { light: 'Medium to Low Filtered Light', water: 'Every 8-10 days', petSafe: false },
    specs: { 'Plant Height': '12 - 16 Inches', 'Pot Diameter': '5.5 Inch Pot', 'Toxins Removed': 'Carbon monoxide, VOCs' },
    returnDays: 2
  },
  {
    id: 'p3',
    name: 'Sansevieria Trifasciata (Golden Snake Plant)',
    botanicalName: 'Dracaena trifasciata',
    category: 'plants',
    subCategory: 'Bedroom Plants',
    price: 499,
    originalPrice: 799,
    rating: 4.9,
    reviewsCount: 3890,
    image: '/images/hero-plants.jpg',
    tag: '24/7 Oxygen Booster',
    inStock: true,
    care: { light: 'Low light to Direct Sun', water: 'Every 2-3 weeks', petSafe: false },
    specs: { 'Plant Height': '10 - 14 Inches', 'Pot Diameter': '4.5 Inch Planter', 'Oxygen Output': 'Nocturnal oxygen production' },
    returnDays: 2
  },
  {
    id: 'p4',
    name: 'Chlorophytum Comosum (Variegated Spider Plant)',
    botanicalName: 'Chlorophytum comosum',
    category: 'plants',
    subCategory: 'Pet-Friendly',
    price: 349,
    originalPrice: 499,
    rating: 4.7,
    reviewsCount: 890,
    image: '/images/products/o1.jpg',
    tag: '100% Non-Toxic & Pet-Safe',
    inStock: true,
    care: { light: 'Bright Dappled Shade', water: 'Twice a week', petSafe: true },
    specs: { 'Plant Height': '8 - 10 Inches', 'Pot Diameter': '4 Inch Planter', 'Toxicity': 'Safe for Dogs & Cats' },
    returnDays: 2
  }
];

// ==========================================
// 4. FRESH VEGETABLES DATA (BLINKIT STYLE)
// ==========================================
export const VEGETABLE_CATEGORIES = [
  { id: 'all', name: 'All Vegetables', icon: '🧺' },
  { id: 'daily', name: 'Daily Essentials', icon: '🧅' },
  { id: 'leafy', name: 'Leafy Greens & Herbs', icon: '🥬' },
  { id: 'exotic', name: 'Exotic & Salad', icon: '🥦' },
  { id: 'roots', name: 'Roots & Tubers', icon: '🥕' }
];

export const VEGETABLES_PRODUCTS = [
  {
    id: 'v1',
    name: 'Fresh Hybrid Tomato',
    scientific: 'Solanum lycopersicum',
    category: 'vegetables',
    subCategory: 'daily',
    rating: 4.8,
    image: '/images/hero-vegetables.jpg',
    tag: 'Farm Picked Today',
    shelfLife: '4-5 Days at room temp',
    weights: [
      { label: '500 g', price: 24, originalPrice: 35 },
      { label: '1 kg', price: 44, originalPrice: 65 }
    ]
  },
  {
    id: 'v2',
    name: 'New Crop Red Onion',
    scientific: 'Allium cepa',
    category: 'vegetables',
    subCategory: 'daily',
    rating: 4.9,
    image: '/images/hero-vegetables.jpg',
    tag: 'Kitchen Staple',
    shelfLife: '2-3 Weeks dry storage',
    weights: [
      { label: '1 kg', price: 38, originalPrice: 50 },
      { label: '2 kg', price: 72, originalPrice: 95 },
      { label: '5 kg (Bag)', price: 175, originalPrice: 240 }
    ]
  },
  {
    id: 'v3',
    name: 'Tender Green Coriander / Cilantro',
    scientific: 'Coriandrum sativum',
    category: 'vegetables',
    subCategory: 'leafy',
    rating: 4.7,
    image: '/images/hero-vegetables.jpg',
    tag: 'Hydroponic Wash',
    shelfLife: '3 Days chilled',
    weights: [
      { label: '100 g Bunch', price: 12, originalPrice: 20 },
      { label: '250 g Bunch', price: 26, originalPrice: 40 }
    ]
  },
  {
    id: 'v4',
    name: 'Organic Crisp Broccoli Crown',
    scientific: 'Brassica oleracea',
    category: 'vegetables',
    subCategory: 'exotic',
    rating: 4.8,
    image: '/images/hero-vegetables.jpg',
    tag: 'Residue Free',
    shelfLife: '5-6 Days refrigerated',
    weights: [
      { label: '1 pc (350-450g)', price: 79, originalPrice: 110 },
      { label: 'Pack of 2', price: 149, originalPrice: 210 }
    ]
  },
  {
    id: 'v5',
    name: 'Farm-Fresh English Cucumber',
    scientific: 'Cucumis sativus',
    category: 'vegetables',
    subCategory: 'exotic',
    rating: 4.6,
    image: '/images/hero-vegetables.jpg',
    tag: 'Zero Bitterness',
    shelfLife: '5 Days chilled',
    weights: [
      { label: '500 g', price: 29, originalPrice: 45 },
      { label: '1 kg', price: 54, originalPrice: 85 }
    ]
  },
  {
    id: 'v6',
    name: 'Sweet Crunchy Ooty Carrots',
    scientific: 'Daucus carota',
    category: 'vegetables',
    subCategory: 'roots',
    rating: 4.9,
    image: '/images/hero-vegetables.jpg',
    tag: 'High Beta-Carotene',
    shelfLife: '10 Days chilled',
    weights: [
      { label: '500 g', price: 39, originalPrice: 55 },
      { label: '1 kg', price: 72, originalPrice: 105 }
    ]
  }
];

// ==========================================
// 5. FRESH FRUITS DATA (PUNCHKART STYLE)
// ==========================================
export const FRUITS_CATEGORIES = [
  { id: 'all', name: 'All Fresh Fruits', icon: '🍎' },
  { id: 'daily', name: 'Daily Essentials', icon: '🍌' },
  { id: 'exotic', name: 'Exotics & Melons', icon: '🥑' },
  { id: 'citrus', name: 'Citrus & Berries', icon: '🍊' },
  { id: 'boxes', name: 'Curated Fruit Combos & Boxes', icon: '🧺' }
];

export const FRUITS_PRODUCTS = [
  {
    id: 'f1',
    name: 'Shimla Royal Gala Apple (Crunchy & Sweet)',
    botanical: 'Malus domestica',
    category: 'fruits',
    subCategory: 'daily',
    price: 189,
    originalPrice: 240,
    rating: 4.9,
    reviewsCount: 1820,
    image: '/images/products/f1.jpg',
    images: ['/images/products/f1.jpg', '/images/hero-fruits.jpg'],
    tag: 'Grade-A Orchard Picked',
    origin: 'Kinnaur & Shimla Orchards, HP',
    ripeness: 'Crisp & Ready to Eat',
    nutrients: 'High Dietary Fiber • Natural Vitamin C',
    shelfLife: '6-8 Days chilled',
    packSizes: [
      { label: '500 g (approx. 3-4 pcs)', price: 99, originalPrice: 125 },
      { label: '1 kg (approx. 6-7 pcs)', price: 189, originalPrice: 240 },
      { label: '2 kg Value Family Pack', price: 360, originalPrice: 460 }
    ],
    comboItems: null,
    returnDays: 0
  },
  {
    id: 'f2',
    name: 'Nagpur Sweet Juicy Oranges (Table Grade)',
    botanical: 'Citrus reticulata',
    category: 'fruits',
    subCategory: 'citrus',
    price: 129,
    originalPrice: 175,
    rating: 4.8,
    reviewsCount: 940,
    image: '/images/products/f2.jpg',
    images: ['/images/products/f2.jpg', '/images/hero-fruits.jpg'],
    tag: '100% Juicy Table Fruit',
    origin: 'Nagpur Direct Farm Clusters, MH',
    ripeness: 'Plump & Juicy',
    nutrients: 'Natural Vitamin C • Hydrating Electrolytes',
    shelfLife: '5-7 Days at room temp',
    packSizes: [
      { label: '1 kg (approx. 5-6 pcs)', price: 129, originalPrice: 175 },
      { label: '2 kg Pack', price: 245, originalPrice: 330 }
    ],
    comboItems: null,
    returnDays: 0
  },
  {
    id: 'f3',
    name: 'Robusta Yelakki Mini Bananas (Naturally Ripened)',
    botanical: 'Musa acuminata',
    category: 'fruits',
    subCategory: 'daily',
    price: 69,
    originalPrice: 95,
    rating: 4.9,
    reviewsCount: 2950,
    image: '/images/products/f3.jpg',
    images: ['/images/products/f3.jpg', '/images/products/f1.jpg'],
    tag: 'Carb-Free Carbide-Free',
    origin: 'Anantapur Natural Plantations, AP',
    ripeness: 'Naturally Sweet & Golden',
    nutrients: 'Potassium Rich • Instant Energy',
    shelfLife: '3-4 Days at room temp',
    packSizes: [
      { label: '500 g (approx. 6-7 pcs)', price: 39, originalPrice: 55 },
      { label: '1 kg (1 Dozen)', price: 69, originalPrice: 95 }
    ],
    comboItems: null,
    returnDays: 0
  },
  {
    id: 'f4',
    name: 'Mahabaleshwar Fresh Sweet Strawberries',
    botanical: 'Fragaria ananassa',
    category: 'fruits',
    subCategory: 'citrus',
    price: 199,
    originalPrice: 260,
    rating: 4.9,
    reviewsCount: 1420,
    image: '/images/products/f4.jpg',
    images: ['/images/products/f4.jpg', '/images/hero-fruits.jpg'],
    tag: 'Chilled Air Dispatch',
    origin: 'Mahabaleshwar Valley, MH',
    ripeness: 'Plump Scarlet Red',
    nutrients: 'Antioxidants • Low Glycemic Index',
    shelfLife: '3-4 Days refrigerated',
    packSizes: [
      { label: '200 g Punnet Box', price: 109, originalPrice: 140 },
      { label: '400 g Pack (2 Punnets)', price: 199, originalPrice: 260 }
    ],
    comboItems: null,
    returnDays: 0
  },
  {
    id: 'f5',
    name: 'Punchkart Immunity & Energy Wellness Fruit Box',
    botanical: 'Curated Farm Mix',
    category: 'fruits',
    subCategory: 'boxes',
    price: 449,
    originalPrice: 580,
    rating: 5.0,
    reviewsCount: 620,
    image: '/images/hero-fruits.jpg',
    images: ['/images/hero-fruits.jpg', '/images/products/f1.jpg'],
    tag: 'Punchkart Signature Combo',
    origin: 'Curated Certified Farms',
    ripeness: 'Hand-sorted Morning Pack',
    nutrients: 'Complete Daily Multi-Vitamin Serving',
    shelfLife: '5-7 Days chilled',
    packSizes: [
      { label: 'Standard Box (Apples 500g, Oranges 1kg, Bananas 500g, Grapes 250g)', price: 449, originalPrice: 580 },
      { label: 'Jumbo Family Box (Double Serving + Seasonal Berries)', price: 820, originalPrice: 1050 }
    ],
    comboItems: ['Royal Gala Apples', 'Nagpur Oranges', 'Yelakki Bananas', 'Green Seedless Grapes'],
    returnDays: 0
  }
];

// ==========================================
// 6. FOODZ CLOUD KITCHEN FOOD DATA
// ==========================================
export const FOOD_CATEGORIES = [
  { id: 'all', name: 'All Menu Items', icon: '🍽️' },
  { id: 'starters', name: 'Starters & Tandoor', icon: '🍢' },
  { id: 'main', name: 'Curries & Gravies', icon: '🍲' },
  { id: 'biryani', name: 'Biryani & Rice Bowls', icon: '🍚' },
  { id: 'pizzas', name: 'Wood-Fired Pizzas', icon: '🍕' },
  { id: 'desserts', name: 'Desserts & Shakes', icon: '🍨' }
];

export const FOOD_PRODUCTS = [
  {
    id: 'fd1',
    name: 'Artisan Wood-Fired Margherita Pizza',
    category: 'food',
    subCategory: 'pizzas',
    isVeg: true,
    price: 399,
    originalPrice: 479,
    rating: 4.9,
    reviewsCount: 1420,
    image: "/images/products/o3.jpg",
    images: ['/images/hero-food.jpg'],
    tag: 'Best Seller',
    prepTime: '20-25 mins',
    portion: 'Serves 2 (11 inches)',
    allergens: 'Dairy, Gluten',
    description: 'Slow-fermented sourdough crust topped with San Marzano tomato sauce, fresh buffalo mozzarella, and aromatic basil leaves.',
    customizations: {
      portions: [
        { label: 'Regular 8"', priceDelta: 0 },
        { label: 'Medium 11"', priceDelta: 120 },
        { label: 'Large 14"', priceDelta: 240 }
      ],
      spices: ['Mild Authentic', 'Medium Herb', 'Spicy Jalapeno'],
      addons: [
        { name: 'Extra Buffalo Mozzarella', price: 60 },
        { name: 'Herb Garlic Dip (50g)', price: 35 },
        { name: 'Sliced Black Olives & Jalapenos', price: 45 }
      ]
    },
    tamperProofPack: true,
    returnDays: 0
  },
  {
    id: 'fd2',
    name: 'Creamy Paneer Butter Masala Handi Bowl',
    category: 'food',
    subCategory: 'main',
    isVeg: true,
    price: 280,
    originalPrice: 340,
    rating: 4.8,
    reviewsCount: 2310,
    image: '/images/hero-food.jpg',
    images: ['/images/hero-food.jpg'],
    tag: 'Chef Recommendation',
    prepTime: '15-20 mins',
    portion: 'Serves 2 (500 ml Bowl)',
    allergens: 'Dairy, Cashews',
    description: 'Soft cottage cheese cubes slow-cooked in a rich, buttery tomato gravy infused with roasted kasuri methi and fresh cream.',
    customizations: {
      portions: [
        { label: 'Standard 500 ml Handi', priceDelta: 0 },
        { label: 'Jumbo 750 ml Family Pack', priceDelta: 90 }
      ],
      spices: ['Mild Sweet-Tangy', 'Medium Spiced', 'Desi Spicy'],
      addons: [
        { name: 'Butter Garlic Naan (2 pcs)', price: 70 },
        { name: 'Jeera Basmati Rice Bowl', price: 90 },
        { name: 'Boondi Raita (200 ml)', price: 40 }
      ]
    },
    tamperProofPack: true,
    returnDays: 0
  },
  {
    id: 'fd3',
    name: 'Dum Pukht Hyderabadi Chicken Biryani',
    category: 'food',
    subCategory: 'biryani',
    isVeg: false,
    price: 349,
    originalPrice: 420,
    rating: 4.9,
    reviewsCount: 4890,
    image: '/images/hero-food.jpg',
    images: ['/images/hero-food.jpg'],
    tag: 'Hyderabadi Classic',
    prepTime: '20-25 mins',
    portion: 'Serves 1-2 (with Mirchi ka Salan & Raita)',
    allergens: 'Dairy',
    description: 'Fragrant long-grain aged basmati rice cooked on slow dum with tender marinated chicken cuts, saffron, and traditional spices.',
    customizations: {
      portions: [
        { label: 'Single Serving (500g)', priceDelta: 0 },
        { label: 'Full Special (800g with 2 boiled eggs)', priceDelta: 110 }
      ],
      spices: ['Medium Nizam Style', 'Fiery Spicy Dum'],
      addons: [
        { name: 'Extra Boiled Egg (2 pcs)', price: 30 },
        { name: 'Double Ka Meetha (100g)', price: 65 },
        { name: 'Extra Gravy (Mirchi ka Salan)', price: 35 }
      ]
    },
    tamperProofPack: true,
    returnDays: 0
  },
  {
    id: 'fd4',
    name: 'Smoked Angaara Tandoori Paneer Tikka',
    category: 'food',
    subCategory: 'starters',
    isVeg: true,
    price: 260,
    originalPrice: 310,
    rating: 4.7,
    reviewsCount: 880,
    image: '/images/hero-food.jpg',
    images: ['/images/hero-food.jpg'],
    tag: 'Charcoal Smoked',
    prepTime: '15-18 mins',
    portion: '6 Large Chunks + Onions & Chutney',
    allergens: 'Dairy, Mustard',
    description: 'Charcoal grilled cottage cheese marinated in hung curd, yellow mustard oil, Kashmiri degi mirch, and roasted spices.',
    customizations: {
      portions: [
        { label: '6 Chunks Platter', priceDelta: 0 },
        { label: '10 Chunks Party Platter', priceDelta: 120 }
      ],
      spices: ['Mild Smoky', 'Charcoal Zesty Spicy'],
      addons: [
        { name: 'Tandoori Roti (2 pcs)', price: 40 },
        { name: 'Mint Chutney & Spiced Laccha Onion', price: 25 }
      ]
    },
    tamperProofPack: true,
    returnDays: 0
  },
  {
    id: 'fd5',
    name: 'Warm Gulab Jamun with Rabdi Sundae',
    category: 'food',
    subCategory: 'desserts',
    isVeg: true,
    price: 149,
    originalPrice: 190,
    rating: 4.9,
    reviewsCount: 710,
    image: '/images/hero-food.jpg',
    images: ['/images/hero-food.jpg'],
    tag: 'Sweet Indulgence',
    prepTime: '5-10 mins',
    portion: '2 Warm Jamuns with 100ml Chilled Rabdi',
    allergens: 'Dairy, Nuts',
    description: 'Melt-in-mouth khoya gulab jamuns dipped in green cardamom sugar syrup, served warm over chilled saffron pistachio rabdi.',
    customizations: {
      portions: [
        { label: 'Standard (2 Jamuns + Rabdi)', priceDelta: 0 },
        { label: 'Family Box (4 Jamuns + Double Rabdi)', priceDelta: 110 }
      ],
      spices: ['Classic Cardamom & Rose Water'],
      addons: [
        { name: 'Crushed Almonds & Pistachio Garnish', price: 30 }
      ]
    },
    tamperProofPack: true,
    returnDays: 0
  }
];

// ==========================================
// 7. APOLLO-INSPIRED PHARMACY DATA
// ==========================================
export const PHARMACY_CATEGORIES = [
  { id: 'all', name: 'All Healthcare', icon: '💊' },
  { id: 'medicines', name: 'Medicines (Rx)', icon: '🩺' },
  { id: 'devices', name: 'Devices & Diagnostics', icon: '🌡️' },
  { id: 'wellness', name: 'Vitamins & Supplements', icon: '✨' },
  { id: 'ayurveda', name: 'Ayurveda & Immunity', icon: '🌿' }
];

export const PHARMACY_PRODUCTS = [
  {
    id: 'ph1',
    name: 'Metformin Hydrochloride 500mg Tablets (Strip of 10)',
    brand: 'Glycomet (USV Pharma)',
    category: 'pharmacy',
    subCategory: 'medicines',
    price: 180,
    originalPrice: 220,
    rating: 4.8,
    reviewsCount: 3410,
    image: "/images/products/p1.jpg",
    images: ['/images/hero-pharmacy.jpg', '/images/products/o2.jpg'],
    tag: 'Prescription Mandatory',
    rxRequired: true,
    scheduleH: true,
    coldChain: false,
    saltComposition: 'Metformin Hydrochloride IP 500mg',
    dosageForm: 'Oral Sustained Release Tablet',
    manufacturer: 'USV Private Limited',
    uses: 'Management of Type 2 Diabetes Mellitus under clinical supervision.',
    sideEffects: 'Mild nausea, stomach upset, metallic taste in mouth.',
    packSize: '10 Tablets in 1 Strip',
    returnDays: 0
  },
  {
    id: 'ph2',
    name: 'Insulin Glargine 100 IU/mL Disposable Injection Cartridge',
    brand: 'Lantus (Sanofi India)',
    category: 'pharmacy',
    subCategory: 'medicines',
    price: 1250,
    originalPrice: 1480,
    rating: 4.9,
    reviewsCount: 1890,
    image: "/images/hero-pharmacy.jpg",
    images: ['/images/products/o2.jpg', '/images/hero-pharmacy.jpg'],
    tag: 'Cold Chain 2°C - 8°C',
    rxRequired: true,
    scheduleH: true,
    coldChain: true,
    saltComposition: 'Insulin Glargine Recombinant DNA 100 IU/mL',
    dosageForm: 'Subcutaneous Ready Solution',
    manufacturer: 'Sanofi India Healthcare',
    uses: 'Long-acting baseline glycemic control in diabetic care.',
    sideEffects: 'Hypoglycemia if administered without timely meal intake.',
    packSize: '3 mL Pre-filled Cartridge Pack',
    returnDays: 0
  },
  {
    id: 'ph3',
    name: 'Smart Bluetooth Digital Upper Arm Blood Pressure Monitor',
    brand: 'Omron Healthcare',
    category: 'pharmacy',
    subCategory: 'devices',
    price: 2499,
    originalPrice: 3290,
    rating: 4.8,
    reviewsCount: 4210,
    image: "/images/products/p3.jpg",
    images: ['/images/products/o2.jpg'],
    tag: 'Clinically Validated',
    rxRequired: false,
    scheduleH: false,
    coldChain: false,
    saltComposition: 'Oscillometric Sensor Circuitry with IntelliSense Cuff',
    dosageForm: 'Medical Diagnostic Hardware Device',
    manufacturer: 'Omron Healthcare Co. Ltd.',
    uses: 'Accurate home monitoring of systolic, diastolic, and pulse rates.',
    sideEffects: 'None. Clean cuff after multiple uses.',
    packSize: '1 Monitor + IntelliSense Cuff + 4 AA Batteries + 3-Year Warranty',
    returnDays: 7
  },
  {
    id: 'ph4',
    name: 'Zincovit Daily Multivitamin & Essential Minerals (Strip of 15)',
    brand: 'Apex Laboratories',
    category: 'pharmacy',
    subCategory: 'wellness',
    price: 110,
    originalPrice: 135,
    rating: 4.9,
    reviewsCount: 6890,
    image: "/images/products/p1.jpg",
    images: ['/images/hero-pharmacy.jpg'],
    tag: 'Daily Immunity Booster',
    rxRequired: false,
    scheduleH: false,
    coldChain: false,
    saltComposition: 'Multivitamins, Minerals, Grape Seed Extract, Zinc 15mg',
    dosageForm: 'Nutritional Dietary Supplement Tablet',
    manufacturer: 'Apex Laboratories Pvt Ltd',
    uses: 'Overcoming nutritional deficiencies, fatigue, and bolstering immune response.',
    sideEffects: 'Safe for daily use following standard serving guidelines.',
    packSize: '15 Film Coated Tablets',
    returnDays: 0
  },
  {
    id: 'ph5',
    name: 'Dabur Pure Ayurvedic Organic Chyawanprash (1kg)',
    brand: 'Dabur India',
    category: 'pharmacy',
    subCategory: 'ayurveda',
    price: 395,
    originalPrice: 460,
    rating: 4.8,
    reviewsCount: 5120,
    image: "/images/hero-pharmacy.jpg",
    images: ['/images/hero-pharmacy.jpg'],
    tag: 'Authentic Ayurvedic Formulation',
    rxRequired: false,
    scheduleH: false,
    coldChain: false,
    saltComposition: 'Amla (Indian Gooseberry), Ashwagandha, Giloy, 40+ Herbs',
    dosageForm: 'Ayurvedic Herbal Paste / Rasayana',
    manufacturer: 'Dabur India Limited',
    uses: 'Seasonal respiratory defense, digestion, and daily vitality.',
    sideEffects: 'None reported. 100% Herbal composition.',
    packSize: '1000 g Airtight Jar Pack',
    returnDays: 0
  }
];

// ==========================================
// 8. FRESHTOHOME-INSPIRED MEAT & SEAFOOD DATA
// ==========================================
export const MEAT_CATEGORIES = [
  { id: 'all', name: 'All Fresh Cuts', icon: '🥩' },
  { id: 'chicken', name: 'Chicken & Poultry', icon: '🍗' },
  { id: 'mutton', name: 'Tender Lamb & Goat', icon: '🍖' },
  { id: 'fish', name: 'Fresh Seafood & Fish', icon: '🐟' },
  { id: 'ready', name: 'Ready to Cook & Marinated', icon: '🍢' }
];

export const MEAT_PRODUCTS = [
  {
    id: 'm1',
    name: 'Prime Tender Rich Lamb Curry Cut (Bone-In)',
    category: 'meat',
    subCategory: 'mutton',
    price: 490,
    originalPrice: 560,
    rating: 4.9,
    reviewsCount: 2840,
    image: "/images/hero-meat.jpg",
    images: ['/images/products/m1.jpg', '/images/products/m2.jpg'],
    tag: '100% Halal & Pasture-Raised',
    origin: 'Telangana Grass-Fed Farms',
    cutType: 'Curry Cut (Shoulder & Ribs)',
    grossWeight: '550g',
    netWeight: '500g (Approx. 12-14 pcs)',
    temperatureZone: '0°C to 4°C Fresh Chilled',
    packaging: 'Nitrogen-Flushed Sealed Tray',
    description: 'Tender, pasture-fed young lamb cuts trimmed by master butchers. Balanced mix of bone and succulent meat ideal for slow-simmered rich curries.',
    serves: 'Serves 2-3 people',
    cookingTime: '40-45 mins on medium heat',
    certifications: 'Certified Halal • Antibiotic & Hormone-Free • Zero Chemical Preservatives',
    packSizes: [
      { label: '500g Net Weight (Pack of 1)', price: 490, originalPrice: 560 },
      { label: '1kg Value Family Pack (Two 500g Trays)', price: 940, originalPrice: 1100 }
    ],
    returnDays: 0
  },
  {
    id: 'm2',
    name: 'Fresh Farm Chicken Curry Cut (Skinless)',
    category: 'meat',
    subCategory: 'chicken',
    price: 185,
    originalPrice: 220,
    rating: 4.8,
    reviewsCount: 6190,
    image: '/images/products/m2.jpg',
    images: ['/images/products/m2.jpg', '/images/products/m1.jpg'],
    tag: 'Antibiotic-Residue Free',
    origin: 'Bio-Secured Poultry Farms',
    cutType: 'Curry Cut with Tender Drumsticks',
    grossWeight: '550g',
    netWeight: '500g (Approx. 14-16 pcs)',
    temperatureZone: '0°C to 4°C Fresh Chilled',
    packaging: 'Vacuum Tray with Moisture Absorber Pad',
    description: 'Fresh antibiotic-free farm chicken, meticulously cleaned and washed. Evenly proportioned pieces of breast, leg, and wings.',
    serves: 'Serves 2-3 people',
    cookingTime: '20-25 mins',
    certifications: '100% Halal Cut • Zero Growth Promoters • Ammonia-Free Washing',
    packSizes: [
      { label: '500g Net Weight', price: 185, originalPrice: 220 },
      { label: '1kg Family Savings Pack', price: 350, originalPrice: 420 }
    ],
    returnDays: 0
  },
  {
    id: 'm3',
    name: 'Fresh Atlantic Pink Salmon Steaks (Thick Cut)',
    category: 'meat',
    subCategory: 'fish',
    price: 890,
    originalPrice: 1050,
    rating: 4.9,
    reviewsCount: 1320,
    image: '/images/products/m3.jpg',
    images: ['/images/products/m3.jpg', '/images/products/m4.jpg'],
    tag: 'Chemical-Free Catch',
    origin: 'Sustainably Farmed Atlantic Waters',
    cutType: 'Center-Cut Steaks with Bone',
    grossWeight: '450g',
    netWeight: '400g (3-4 Thick Slices)',
    temperatureZone: '0°C to 4°C Iced Cold-Chain',
    packaging: 'Thermoformed Oxygen Barrier Packaging',
    description: 'Rich pink Atlantic Salmon cuts loaded with heart-healthy Omega-3 fatty acids. Flaky and delicate, ideal for pan-searing and grilling.',
    serves: 'Serves 2 people',
    cookingTime: '8-10 mins pan sear',
    certifications: 'Zero Formalin • Zero Ammonia • Tested via Multi-Parameter Gas Chromatography',
    packSizes: [
      { label: '400g (3-4 Steaks)', price: 890, originalPrice: 1050 },
      { label: '800g Value Pack', price: 1720, originalPrice: 2050 }
    ],
    returnDays: 0
  },
  {
    id: 'm4',
    name: 'Tender Chicken Breast Boneless Fillet',
    category: 'meat',
    subCategory: 'chicken',
    price: 240,
    originalPrice: 285,
    rating: 4.8,
    reviewsCount: 3910,
    image: "/images/products/m2.jpg",
    images: ['/images/products/m4.jpg', '/images/products/m2.jpg'],
    tag: 'High Protein Fitness Cut',
    origin: 'Bio-Secured Farm Clusters',
    cutType: 'Whole Boneless Clean Breast Fillets',
    grossWeight: '500g',
    netWeight: '480g - 500g (2-3 Breasts)',
    temperatureZone: '0°C to 4°C Fresh Chilled',
    packaging: 'Airtight Vacuum Tray',
    description: 'Lean, skinless and completely deboned tender breast portions. High in lean protein, perfect for meal-prep salads, stir-fries, or baking.',
    serves: 'Serves 2-3 people',
    cookingTime: '12-15 mins',
    certifications: 'Halal Certified • Antibiotic Residue-Free • Tested for Chemical Residues',
    packSizes: [
      { label: '500g Net Weight', price: 240, originalPrice: 285 },
      { label: '1kg Bulk Gym Meal-Prep Pack', price: 460, originalPrice: 550 }
    ],
    returnDays: 0
  },
  {
    id: 'm5',
    name: 'Spiced Peri-Peri Chicken Wings (Ready-to-Cook)',
    category: 'meat',
    subCategory: 'ready',
    price: 220,
    originalPrice: 265,
    rating: 4.9,
    reviewsCount: 890,
    image: "/images/products/ember-wings.jpg",
    images: ['/images/products/m2.jpg'],
    tag: 'Chef Marinated (No Cooking Prep)',
    origin: 'In-House Culinary Kitchen',
    cutType: 'Split Wings Marinated in African Birdseye Chili',
    grossWeight: '380g',
    netWeight: '350g (6-8 Whole Wings)',
    temperatureZone: '0°C to 4°C Chilled',
    packaging: 'Nitrogen-Flushed Oven-Ready Tray',
    description: 'Fresh chicken wings marinated in spicy crushed Peri-Peri peppers, garlic, and citrus herbs. Pan-fry or air-fry directly from the pack in 12 minutes.',
    serves: 'Serves 2 people',
    cookingTime: '10-12 mins air-fry or pan-toss',
    certifications: '100% Halal • Zero Artificial Food Colors • No MSG Added',
    packSizes: [
      { label: '350g Marinade Tray', price: 220, originalPrice: 265 }
    ],
    returnDays: 0
  }
];

// ==========================================
// 9. ZEPTO-INSPIRED GROCERIES & PANTRY DATA
// ==========================================
export const GROCERIES_CATEGORIES = [
  { id: 'all', name: 'All Pantry Items', icon: '🛒' },
  { id: 'oils', name: 'Oils, Ghee & Vanaspati', icon: '🫒' },
  { id: 'staples', name: 'Atta, Rice & Dal', icon: '🌾' },
  { id: 'dryfruits', name: 'Dry Fruits, Nuts & Seeds', icon: '🥜' },
  { id: 'beverages', name: 'Tea, Coffee & Health Drinks', icon: '☕' },
  { id: 'spices', name: 'Spices, Masalas & Salt', icon: '🧂' }
];

export const GROCERIES_PRODUCTS = [
  {
    id: 'g1',
    name: 'Fortune Sunlite Refined Sunflower Oil',
    brand: 'Fortune (Adani Wilmar)',
    category: 'groceries',
    subCategory: 'oils',
    price: 139,
    originalPrice: 175,
    rating: 4.8,
    reviewsCount: 8420,
    image: '/images/products/g1.jpg',
    images: ['/images/products/g1.jpg'],
    tag: 'Zepto Super Saver',
    shelfLife: '9 Months from packaging',
    storage: 'Store in a cool and dry place away from direct sunlight',
    packSizes: [
      { label: '1 L Pouch', price: 139, originalPrice: 175 },
      { label: '5 L Jar (Save ₹110)', price: 685, originalPrice: 875 }
    ],
    returnDays: 0
  },
  {
    id: 'g2',
    name: 'Aashirvaad Superior Sharbati Shudh Whole Wheat Atta',
    brand: 'Aashirvaad (ITC)',
    category: 'groceries',
    subCategory: 'staples',
    price: 260,
    originalPrice: 310,
    rating: 4.9,
    reviewsCount: 14210,
    image: '/images/hero-groceries.jpg',
    images: ['/images/hero-groceries.jpg'],
    tag: '100% MP Sharbati Wheat',
    shelfLife: '6 Months',
    storage: 'Keep in an airtight container',
    packSizes: [
      { label: '5 kg Bag', price: 260, originalPrice: 310 },
      { label: '10 kg Value Bag (Save ₹90)', price: 499, originalPrice: 620 }
    ],
    returnDays: 0
  },
  {
    id: 'g3',
    name: 'Organic Coorg Whole Roasted Dark Arabica Coffee Beans',
    brand: 'Blue Tokai / Coorg Estate',
    category: 'groceries',
    subCategory: 'beverages',
    price: 499,
    originalPrice: 620,
    rating: 4.9,
    reviewsCount: 3120,
    image: '/images/products/g3.jpg',
    images: ['/images/products/g3.jpg'],
    tag: 'Single-Origin Artisan',
    shelfLife: '12 Months',
    storage: 'Airtight one-way degassing valve pack',
    packSizes: [
      { label: '250g Zip Pouch', price: 260, originalPrice: 320 },
      { label: '500g Fresh Pack', price: 499, originalPrice: 620 }
    ],
    returnDays: 0
  },
  {
    id: 'g4',
    name: 'Himalayan Raw Wild Forest Honey (Unpasteurized)',
    brand: 'Dabur Honey / Organic India',
    category: 'groceries',
    subCategory: 'staples',
    price: 380,
    originalPrice: 480,
    rating: 4.8,
    reviewsCount: 4210,
    image: '/images/products/g4.jpg',
    images: ['/images/products/g4.jpg'],
    tag: '100% Pure & NMR Tested',
    shelfLife: '18 Months',
    storage: 'Do not refrigerate. Natural crystallization may occur.',
    packSizes: [
      { label: '500g Glass Jar', price: 380, originalPrice: 480 },
      { label: '1kg Squeezy Pack', price: 710, originalPrice: 940 }
    ],
    returnDays: 0
  },
  {
    id: 'g5',
    name: 'Happilo Premium California Whole Roasted Almonds',
    brand: 'Happilo International',
    category: 'groceries',
    subCategory: 'dryfruits',
    price: 389,
    originalPrice: 499,
    rating: 4.9,
    reviewsCount: 5420,
    image: "/images/hero-groceries.jpg",
    images: ['/images/products/g2.jpg'],
    tag: 'High Protein & Gluten-Free',
    shelfLife: '12 Months',
    storage: 'Resealable moisture-lock pouch',
    packSizes: [
      { label: '500g Pouch', price: 389, originalPrice: 499 },
      { label: '1kg Economy Pack', price: 740, originalPrice: 990 }
    ],
    returnDays: 0
  }
];

// ==========================================
// 10. JEWELLERY DATA (TANISHQ STYLE)
// ==========================================
export const JEWELLERY_CATEGORIES = [
  { id: 'all', name: 'All Jewellery', icon: '✨' },
  { id: 'rings', name: 'Finger Rings', icon: '💍' },
  { id: 'necklaces', name: 'Necklaces & Chokers', icon: '📿' },
  { id: 'earrings', name: 'Earrings & Jhumkas', icon: '💎' },
  { id: 'bangles', name: 'Bangles & Kadas', icon: '🪙' },
  { id: 'mangalsutras', name: 'Mangalsutras', icon: '⚜️' }
];

export const GOLD_RATES = {
  purity22k: 7380, // ₹ per gram
  purity24k: 8050,
  updated: 'Today, 10:00 AM IST'
};

export const JEWELLERY_PRODUCTS = [
  {
    id: 'j1',
    name: 'Auspicious Blossom 22k Gold Finger Ring',
    category: 'jewellery',
    subCategory: 'rings',
    price: 34999,
    originalPrice: 38500,
    rating: 4.9,
    reviewsCount: 384,
    image: '/images/products/j1.jpg',
    images: ['/images/products/j1.jpg', '/images/products/j2.jpg'],
    tag: 'BIS Hallmarked 916',
    metal: 'Yellow Gold',
    purity: '22 KT',
    grossWeight: '4.82 g',
    diamondWeight: 'N/A',
    makingCharges: '14%',
    collection: 'Utsava Festive Edit',
    sizes: ['10', '12', '14', '16', '18'],
    certAgency: 'BIS 916 Hallmarked & Certified by Tanishq Assay Centers',
    vaultDelivery: true,
    returnDays: 7
  },
  {
    id: 'j2',
    name: 'Celestial Dew 18k Rose Gold Diamond Layered Pendant',
    category: 'jewellery',
    subCategory: 'necklaces',
    price: 48500,
    originalPrice: 53900,
    rating: 4.9,
    reviewsCount: 512,
    image: '/images/products/j2.jpg',
    images: ['/images/products/j2.jpg', '/images/products/j1.jpg'],
    tag: 'Certified Natural Diamond',
    metal: 'Rose Gold',
    purity: '18 KT',
    grossWeight: '3.95 g',
    diamondWeight: '0.24 ct (VVS-VS Clarity, GH Color)',
    makingCharges: '12%',
    collection: 'Mia Everyday Workwear',
    sizes: ['Free Size (16" + 2" Extension)'],
    certAgency: 'IGI (International Gemological Institute) Certified',
    vaultDelivery: true,
    returnDays: 7
  },
  {
    id: 'j3',
    name: 'Royal Heritage Kundan & Pearl Jhumka Earrings',
    category: 'jewellery',
    subCategory: 'earrings',
    price: 68900,
    originalPrice: 76000,
    rating: 4.8,
    reviewsCount: 294,
    image: '/images/products/j3.jpg',
    images: ['/images/products/j3.jpg', '/images/products/j4.jpg'],
    tag: 'Handcrafted Heritage',
    metal: 'Yellow Gold & Kundan',
    purity: '22 KT',
    grossWeight: '8.40 g',
    diamondWeight: 'Polki Uncut Stone Inlay',
    makingCharges: '16%',
    collection: 'Rivaah Bridal Royal Line',
    sizes: ['Standard Drop (4.2 cm)'],
    certAgency: 'BIS Hallmarked with Certified Freshwater Cultured Pearls',
    vaultDelivery: true,
    returnDays: 7
  },
  {
    id: 'j4',
    name: 'Timeless Elegance 22k Gold Floral Filigree Bangle',
    category: 'jewellery',
    subCategory: 'bangles',
    price: 89400,
    originalPrice: 97500,
    rating: 4.9,
    reviewsCount: 418,
    image: '/images/products/j4.jpg',
    images: ['/images/products/j4.jpg', '/images/products/j3.jpg'],
    tag: 'Best Seller',
    metal: 'Yellow Gold',
    purity: '22 KT',
    grossWeight: '11.85 g',
    diamondWeight: 'N/A',
    makingCharges: '13%',
    collection: 'Padmavat Classic Filigree',
    sizes: ['2.4', '2.6', '2.8'],
    certAgency: 'BIS 916 Hallmarked Gold',
    vaultDelivery: true,
    returnDays: 7
  }
];

// ==========================================
// 11. GENERAL CATALOG FOR REMAINING VERTICALS
// ==========================================
export const GENERAL_PRODUCTS = [
  // Books
  {
    id: 'b1', name: 'System Architecture & Cloud Patterns', category: 'books', price: 899, rating: 4.8, image: '/images/products/b1.jpg', tag: 'Bestseller Edition',
    description: 'Essential field-tested blueprint for distributed enterprise workflows and event meshes.',
    bookMeta: { format: 'Paperback (480 pgs)', isbn: '978-0134685991', author: 'Dr. Aaron Meyer' },
    giftWrapAvailable: true, returnDays: 10
  },
  { id: 'b2', name: 'Clean Code: Handbook of Agile Craft', category: 'books', price: 920, rating: 4.8, image: '/images/products/b4.jpg', description: 'Industry-standard practices for writing refactorable code.' }
];

// ==========================================
// 12. MASTER CATALOG (COMBINED)
// ==========================================
export const PRODUCTS = [
  ...ELECTRONICS_PRODUCTS,
  ...PLANTS_PRODUCTS,
  ...VEGETABLES_PRODUCTS,
  ...FRUITS_PRODUCTS,
  ...FOOD_PRODUCTS,
  ...PHARMACY_PRODUCTS,
  ...MEAT_PRODUCTS,
  ...GROCERIES_PRODUCTS,
  ...JEWELLERY_PRODUCTS,
  ...GENERAL_PRODUCTS
];