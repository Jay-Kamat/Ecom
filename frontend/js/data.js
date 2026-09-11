// NovaMart Product Catalog, Categories, Reviews, Users & Initial Data
export const CATEGORIES = [
  { 
    id: 'all', 
    name: 'All Categories', 
    icon: '🛍️',
    subcategories: ['Top Offers', 'New Arrivals', 'Clearance Deals', 'Bestsellers']
  },
  { 
    id: 'mobiles', 
    name: 'Mobiles & Tablets', 
    icon: '📱',
    subcategories: ['Flagship 5G Phones', 'Budget Smartphones', 'Tablets & iPads', 'Power Banks', 'Cases & Covers']
  },
  { 
    id: 'electronics', 
    name: 'Electronics & Audio', 
    icon: '🎧',
    subcategories: ['Wireless Headphones', 'Bluetooth Speakers', 'Smart TVs', 'Gaming Consoles', 'Smartwatches']
  },
  { 
    id: 'fashion', 
    name: 'Fashion & Apparel', 
    icon: '👕',
    subcategories: ['Men Cotton Shirts', 'Athletic Footwear', 'Casual Denim', 'Women Ethnic Wear', 'Watches & Accessories']
  },
  { 
    id: 'home', 
    name: 'Home & Kitchen', 
    icon: '🍳',
    subcategories: ['Smart Air Fryers', 'Cookware Sets', 'Dinner Sets', 'Bed Linen', 'Home Organization']
  },
  { 
    id: 'appliances', 
    name: 'Appliances', 
    icon: '🧊',
    subcategories: ['Inverter Refrigerators', 'Front Load Washers', 'Split Air Conditioners', 'Microwave Ovens']
  },
  { 
    id: 'beauty', 
    name: 'Beauty & Grooming', 
    icon: '✨',
    subcategories: ['Face Serums', 'Sunscreen Lotions', 'Beard Trimmers', 'Fragrances & Perfumes', 'Hair Care']
  }
];

export const BRANDS = [
  'NovaTech',
  'SonicWave',
  'AuraCraft',
  'MasterChef',
  'FrostKing',
  'GlowRadiance'
];

export const PRODUCTS = [
  {
    id: 'prod-1',
    title: 'NovaPro 15 Ultra 5G (Phantom Titanium, 256 GB)',
    category: 'mobiles',
    brand: 'NovaTech',
    price: 69999,
    mrp: 84999,
    discount: 18,
    rating: 4.8,
    ratingCount: 14230,
    reviewsCount: 2840,
    inStock: true,
    stockCount: 24,
    badge: 'Trending Deal',
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80'
    ],
    variants: {
      color: ['Phantom Titanium', 'Deep Ocean Blue', 'Midnight Obsidian'],
      storage: ['128 GB', '256 GB', '512 GB']
    },
    description: 'Experience ultra-fast 5G connectivity with the flagship NovaPro 15 Ultra. Featuring a 6.8-inch Dynamic AMOLED 120Hz display, ProGrade 200MP camera system, and all-day 5000mAh battery with 68W fast charge.',
    specs: [
      { key: 'Processor', value: 'Octa-Core Snapdragon 8 Gen 3' },
      { key: 'Display', value: '6.8-inch QHD+ 120Hz Dynamic AMOLED' },
      { key: 'Camera', value: '200MP Main + 50MP Periscope + 12MP Ultra-wide' },
      { key: 'Battery', value: '5000 mAh with 68W HyperCharge' },
      { key: 'Warranty', value: '1 Year Manufacturer Warranty' }
    ],
    offers: [
      'Bank Offer: Flat ₹4,000 instant discount on HDFC Bank Credit Cards',
      'Special Price: Get extra 10% off (price inclusive of discount)',
      'No Cost EMI available from ₹5,833/month'
    ],
    reviews: [
      { author: 'Vikram Mehta', rating: 5, date: '05 Sep 2026', title: 'Absolute powerhouse phone!', text: 'Camera quality matches DSLRs and the battery easily lasts 1.5 days. Unboxing and delivery by NovaMart was spotless.' },
      { author: 'Ananya Roy', rating: 5, date: '01 Sep 2026', title: 'Top notch display and build', text: 'Titanium finish feels incredibly premium in hand. Highly recommend!' }
    ]
  },
  {
    id: 'prod-2',
    title: 'SonicWave Elite Active Noise Cancelling Headphones',
    category: 'electronics',
    brand: 'SonicWave',
    price: 14999,
    mrp: 24999,
    discount: 40,
    rating: 4.6,
    ratingCount: 8430,
    reviewsCount: 1210,
    inStock: true,
    stockCount: 42,
    badge: 'Super Saver',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80'
    ],
    variants: {
      color: ['Matte Black', 'Silver Frost', 'Midnight Navy']
    },
    description: 'Premium wireless headphones with industry-leading hybrid ANC, 40-hour playtime, Hi-Res LDAC audio decoding, and ultra-plush memory foam earcups for unmatched all-day comfort.',
    specs: [
      { key: 'Driver Size', value: '40mm Custom Titanium Drivers' },
      { key: 'Battery Life', value: '40 Hours (ANC on) / 60 Hours (ANC off)' },
      { key: 'Connectivity', value: 'Bluetooth 5.3 + 3.5mm Aux' },
      { key: 'Weight', value: '254g Ultra Lightweight' },
      { key: 'Warranty', value: '1 Year Replacement Warranty' }
    ],
    offers: [
      'Apply coupon NOVA20 for an extra 20% off at checkout',
      'Free Express Delivery within 24 hours'
    ],
    reviews: [
      { author: 'Karan Malhotra', rating: 5, date: '08 Sep 2026', title: 'Noise cancellation is magic', text: 'Blocks out all airplane drone and office chatter effortlessly. Cushions are super soft.' },
      { author: 'Sneha Patel', rating: 4, date: '29 Aug 2026', title: 'Great sound clarity', text: 'Bass is punchy without overpowering vocals. Great mic for Zoom calls too.' }
    ]
  },
  {
    id: 'prod-3',
    title: 'AuraCraft Pure Cotton Casual Slim Fit Shirt',
    category: 'fashion',
    brand: 'AuraCraft',
    price: 1299,
    mrp: 2999,
    discount: 57,
    rating: 4.4,
    ratingCount: 3120,
    reviewsCount: 520,
    inStock: true,
    stockCount: 80,
    badge: 'Bestseller',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80'
    ],
    variants: {
      size: ['S', 'M', 'L', 'XL', 'XXL'],
      color: ['Oxford Blue', 'Crisp White', 'Olive Sage']
    },
    description: 'Tailored to perfection from 100% breathable organic combed cotton. Features a spread collar, mother-of-pearl buttons, and durable double-needle stitching suitable for office and weekend wear.',
    specs: [
      { key: 'Material', value: '100% Combed Organic Cotton' },
      { key: 'Fit', value: 'Modern Slim Fit' },
      { key: 'Care', value: 'Machine wash cold, tumble dry low' },
      { key: 'Origin', value: 'Ethically crafted in India' }
    ],
    offers: [
      'Buy 2 Get Additional 15% Off automatically in Cart',
      '7-Day Hassle-Free Returns & Exchange'
    ],
    reviews: [
      { author: 'Rohan Joshi', rating: 5, date: '04 Sep 2026', title: 'Perfect office shirt', text: 'Fabric has a great handfeel and does not wrinkle easily. True to size fit.' }
    ]
  },
  {
    id: 'prod-4',
    title: 'MasterChef Smart Rapid Air Fryer (5.5 Liters, 1500W)',
    category: 'home',
    brand: 'MasterChef',
    price: 5499,
    mrp: 9999,
    discount: 45,
    rating: 4.7,
    ratingCount: 5690,
    reviewsCount: 940,
    inStock: true,
    stockCount: 15,
    badge: 'Limited Stock',
    images: [
      'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
    ],
    variants: {
      color: ['Piano Black', 'Brushed Stainless']
    },
    description: 'Crisp, healthy meals with up to 90% less oil. Equipped with 360-degree rapid vortex heat circulation, 8 preset touch cooking modes, non-stick dishwasher-safe basket, and auto shut-off safety protection.',
    specs: [
      { key: 'Capacity', value: '5.5 Liters (serves 4-6)' },
      { key: 'Power', value: '1500 Watts High Efficiency' },
      { key: 'Temperature', value: '80°C - 200°C Adjustable' },
      { key: 'Presets', value: '8 One-Touch Cooking Programs' },
      { key: 'Warranty', value: '2 Years Comprehensive Warranty' }
    ],
    offers: [
      'Complimentary Recipe E-Book with 100+ Chef Recipes',
      'Bank Offer: 5% Unlimited Cashback with Axis Bank'
    ],
    reviews: [
      { author: 'Deepa Narang', rating: 5, date: '02 Sep 2026', title: 'Crispy samosas without oil!', text: 'Best kitchen purchase this year. French fries and paneer tikka come out restaurant-grade.' }
    ]
  },
  {
    id: 'prod-5',
    title: 'FrostKing 340L Double Door Inverter Refrigerator',
    category: 'appliances',
    brand: 'FrostKing',
    price: 32490,
    mrp: 44990,
    discount: 28,
    rating: 4.5,
    ratingCount: 2190,
    reviewsCount: 380,
    inStock: false,
    stockCount: 0,
    badge: 'Out of Stock',
    images: [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80'
    ],
    variants: {
      color: ['Stainless Steel', 'Mirror Black']
    },
    description: 'Advanced 3-Star energy rated Frost-Free double door refrigerator powered by an intelligent inverter compressor. Keeps fruits and vegetables garden-fresh for up to 15 days.',
    specs: [
      { key: 'Capacity', value: '340 Liters' },
      { key: 'Energy Rating', value: '3 Star (BEE Compliant)' },
      { key: 'Cooling Technology', value: 'Multi-Air Flow with Deodorizer' },
      { key: 'Compressor Warranty', value: '10 Years on Digital Inverter' }
    ],
    offers: [
      'Exchange Offer: Up to ₹4,000 off on exchange of old refrigerator',
      'Free scheduled installation by brand technician'
    ],
    reviews: [
      { author: 'Rajesh Nair', rating: 4, date: '15 Aug 2026', title: 'Silent and cools fast', text: 'Hardly makes any noise. Veggies stay crisp for two weeks.' }
    ]
  },
  {
    id: 'prod-6',
    title: 'GlowRadiance 10% Niacinamide & Zinc Face Serum (30ml)',
    category: 'beauty',
    brand: 'GlowRadiance',
    price: 599,
    mrp: 999,
    discount: 40,
    rating: 4.9,
    ratingCount: 19800,
    reviewsCount: 4520,
    inStock: true,
    stockCount: 120,
    badge: 'Dermatologist Approved',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608248597359-5f2571c667bc?auto=format&fit=crop&w=800&q=80'
    ],
    variants: {
      volume: ['30 ml', '60 ml']
    },
    description: 'Clinically formulated to visibly minimize pores, balance sebum production, fade dark spots, and repair the skin barrier. Fragrance-free, paraben-free, non-comedogenic.',
    specs: [
      { key: 'Key Ingredients', value: '10% Pure Niacinamide + 1% Zinc PCA' },
      { key: 'Skin Type', value: 'All Skin Types (Acne-Prone Friendly)' },
      { key: 'Usage', value: 'Day & Night post cleansing' },
      { key: 'Certification', value: 'Cruelty-Free, FDA Approved' }
    ],
    offers: [
      'Buy 3 Pay for 2 Combo offer automatically applied',
      'Includes complimentary travel dropper bottle'
    ],
    reviews: [
      { author: 'Kavita Singh', rating: 5, date: '07 Sep 2026', title: 'Cleared my stubborn marks', text: 'Visible difference in 2 weeks. Very light and non-sticky.' }
    ]
  },
  {
    id: 'prod-7',
    title: 'QuantumView 55-inch 4K Ultra HD Smart QLED TV',
    category: 'electronics',
    brand: 'NovaTech',
    price: 42999,
    mrp: 69999,
    discount: 38,
    rating: 4.7,
    ratingCount: 6340,
    reviewsCount: 1150,
    inStock: true,
    stockCount: 18,
    badge: 'Mega Deal',
    images: [
      'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80'
    ],
    variants: {
      displaySize: ['43 Inch', '55 Inch', '65 Inch']
    },
    description: 'Breathtaking 4K Quantum Dot visuals with 1 Billion True-Tone colors, Dolby Vision IQ, and 30W Dolby Atmos sound. Powered by Google TV with hands-free voice assistant.',
    specs: [
      { key: 'Resolution', value: '4K Ultra HD (3840 x 2160)' },
      { key: 'Refresh Rate', value: '120Hz MEMC Smooth Motion' },
      { key: 'Audio', value: '30W Stereo with Dolby Atmos' },
      { key: 'Smart OS', value: 'Google TV with Play Store' }
    ],
    offers: [
      '1 Year Comprehensive + 1 Year Additional Panel Warranty',
      'Free Wall Mount Installation included'
    ],
    reviews: [
      { author: 'Amit Saxena', rating: 5, date: '06 Sep 2026', title: 'Cinematic picture quality', text: 'Blacks are deep and colors are vibrant. The Google TV interface is silky smooth.' }
    ]
  },
  {
    id: 'prod-8',
    title: 'UrbanStride Breathable Athletic Running Sneakers',
    category: 'fashion',
    brand: 'AuraCraft',
    price: 2499,
    mrp: 4999,
    discount: 50,
    rating: 4.3,
    ratingCount: 4510,
    reviewsCount: 680,
    inStock: true,
    stockCount: 60,
    badge: 'Popular Pick',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80'
    ],
    variants: {
      size: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
      color: ['Ruby Red', 'Midnight Charcoal', 'All-White']
    },
    description: 'Engineered for distance running and everyday streetwear. Features lightweight breathable fly-knit upper, high-rebound cushioned midsole, and skid-resistant rubber traction outsole.',
    specs: [
      { key: 'Upper Material', value: 'Engineered Breathable Mesh' },
      { key: 'Sole', value: 'High-Rebound Air-Infused EVA' },
      { key: 'Weight', value: '230g per shoe' },
      { key: 'Closure', value: 'Adaptive Lace-Up' }
    ],
    offers: [
      'Get free pair of sports performance socks with purchase',
      '30 Days Return & Size Exchange guarantee'
    ],
    reviews: [
      { author: 'Tarun Verma', rating: 4, date: '03 Sep 2026', title: 'Super comfortable cushion', text: 'Ran a 10k in these right out of the box with zero blisters.' }
    ]
  }
];

export const INITIAL_SAVED_ADDRESSES = [
  {
    id: 'addr-1',
    tag: 'Home',
    name: 'Jay Vardhan',
    phone: '9876543210',
    street: 'Flat 402, Lotus Heights, Outer Ring Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin: '560103',
    isDefault: true
  },
  {
    id: 'addr-2',
    tag: 'Work',
    name: 'Jay Vardhan',
    phone: '9876543210',
    street: 'Building 7B, Embassy TechVillage, Devarabisanahalli',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin: '560103',
    isDefault: false
  }
];

export const INITIAL_USERS = [
  { id: 'usr-1', name: 'Jay Vardhan', email: 'jay@novamart.com', phone: '9876543210', role: 'Customer', status: 'Active', ordersCount: 4, joinedDate: '10 Aug 2026' },
  { id: 'usr-2', name: 'Priya Sharma', email: 'priya@gmail.com', phone: '9811223344', role: 'Customer', status: 'Active', ordersCount: 2, joinedDate: '18 Aug 2026' },
  { id: 'usr-3', name: 'Ravi Teja', email: 'ravi.teja@yahoo.com', phone: '9900112233', role: 'Customer', status: 'Disabled', ordersCount: 0, joinedDate: '01 Sep 2026' },
  { id: 'usr-4', name: 'Admin Store Manager', email: 'admin@novamart.com', phone: '1800123000', role: 'Admin', status: 'Active', ordersCount: 15, joinedDate: '01 Jul 2026' }
];

export const VALID_COUPONS = {
  'NOVA20': { discountPercent: 20, description: '20% off on your entire cart', usageCount: 142, validity: '31 Dec 2026' },
  'FIRST100': { discountFlat: 100, minCart: 500, description: '₹100 flat discount on orders over ₹500', usageCount: 89, validity: '30 Nov 2026' },
  'FESTIVE500': { discountFlat: 500, minCart: 2000, description: '₹500 festive discount on orders above ₹2000', usageCount: 65, validity: '15 Oct 2026' }
};
