// Intelligent Multi-field E-Commerce Search Engine

// Category and Keyword Synonyms Map
export const SEARCH_SYNONYMS = {
  mobiles: [
    'mobile', 'mobiles', 'phone', 'phones', 'smartphone', 'smartphones',
    'cellphone', 'cellphones', 'android', 'iphone', 'ios', 'cellular',
    'handset', 'handsets', '5g phone', '5g mobile', 'tablet', 'tablets',
    'ipad', 'galaxy', 'oneplus', 'pixel'
  ],
  electronics: [
    'electronic', 'electronics', 'gadget', 'gadgets', 'tech', 'device', 'devices'
  ],
  audio: [
    'headphone', 'headphones', 'earphone', 'earphones', 'earbud', 'earbuds',
    'airpods', 'tws', 'audio', 'sound', 'speaker', 'speakers', 'soundbar',
    'bluetooth', 'wireless audio', 'headset', 'anc'
  ],
  laptops: [
    'laptop', 'laptops', 'notebook', 'notebooks', 'computer', 'computers',
    'pc', 'macbook', 'ultrabook', 'chromebook'
  ],
  tv: [
    'tv', 'tvs', 'television', 'televisions', 'oled', 'qled', 'led',
    'smart tv', 'screen', 'display', 'monitor', '4k'
  ],
  fashion: [
    'fashion', 'clothing', 'clothes', 'apparel', 'shirt', 'shirts', 'tshirt',
    't-shirt', 'pants', 'trousers', 'jeans', 'denim', 'wear', 'ethnic',
    'cotton', 'dress', 'outfit'
  ],
  footwear: [
    'shoe', 'shoes', 'sneaker', 'sneakers', 'footwear', 'sandal', 'sandals',
    'running', 'boots', 'loafers', 'trainers'
  ],
  home: [
    'home', 'kitchen', 'cookware', 'cook', 'fryer', 'airfryer', 'air fryer',
    'appliances', 'appliance', 'refrigerator', 'fridge', 'oven', 'mixer',
    'blender', 'microwave'
  ],
  appliances: [
    'appliance', 'appliances', 'refrigerator', 'fridge', 'washer', 'washing machine',
    'microwave', 'air conditioner', 'ac', 'inverter'
  ],
  beauty: [
    'beauty', 'grooming', 'serum', 'skincare', 'skin', 'cosmetics',
    'niacinamide', 'face', 'cream', 'lotion', 'face wash'
  ]
};

// Stemming / Plural normalization helper
export function normalizeToken(term) {
  if (!term) return '';
  let t = term.trim().toLowerCase();

  // Common singularizations
  if (t.endsWith('ies') && t.length > 4) {
    t = t.slice(0, -3) + 'y';
  } else if (t.endsWith('es') && t.length > 4 && !t.endsWith('tes')) {
    t = t.slice(0, -2);
  } else if (t.endsWith('s') && !t.endsWith('ss') && t.length > 3) {
    t = t.slice(0, -1);
  }
  return t;
}

// Word matching helper with boundaries
function matchesWord(text, word) {
  if (!text || !word) return false;
  // If word is surrounded by non-letters or start/end of string
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
  return regex.test(text);
}

// Check if a category matches a query term or synonym
export function matchCategorySynonym(category, queryTerm, productTitle = '') {
  const normTerm = normalizeToken(queryTerm);
  const cat = (category || '').toLowerCase();
  const title = (productTitle || '').toLowerCase();

  // Mobile / Smartphone category
  if (cat === 'mobiles' || cat === 'smartphones') {
    const mobileSynonyms = SEARCH_SYNONYMS.mobiles.map(normalizeToken);
    if (mobileSynonyms.includes(normTerm) || mobileSynonyms.some(s => normTerm.includes(s))) {
      return true;
    }
  }

  // Audio category (headphones, earbuds, speakers)
  if (cat === 'audio' || (cat === 'electronics' && (matchesWord(title, 'headphones') || matchesWord(title, 'headphone') || matchesWord(title, 'earbuds') || matchesWord(title, 'speaker')))) {
    const audioSynonyms = SEARCH_SYNONYMS.audio.map(normalizeToken);
    if (audioSynonyms.includes(normTerm) || audioSynonyms.some(s => normTerm.includes(s))) {
      return true;
    }
  }

  // TV / Television
  if (matchesWord(title, 'tv') || matchesWord(title, 'television')) {
    const tvSynonyms = SEARCH_SYNONYMS.tv.map(normalizeToken);
    if (tvSynonyms.includes(normTerm) || tvSynonyms.some(s => normTerm.includes(s))) {
      return true;
    }
  }

  // Laptops / Computers
  if (cat === 'laptops' || matchesWord(title, 'laptop') || matchesWord(title, 'macbook') || matchesWord(title, 'ultrabook')) {
    const laptopSynonyms = SEARCH_SYNONYMS.laptops.map(normalizeToken);
    if (laptopSynonyms.includes(normTerm) || laptopSynonyms.some(s => normTerm.includes(s))) {
      return true;
    }
  }

  // Footwear (shoes, sneakers, sandals)
  if (matchesWord(title, 'sneakers') || matchesWord(title, 'sneaker') || matchesWord(title, 'shoes') || matchesWord(title, 'shoe')) {
    const footwearSynonyms = SEARCH_SYNONYMS.footwear.map(normalizeToken);
    if (footwearSynonyms.includes(normTerm) || footwearSynonyms.some(s => normTerm.includes(s))) {
      return true;
    }
  }

  // Direct match with category name
  if (matchesWord(cat, normTerm) || cat === normTerm) return true;

  return false;
}

// Evaluate match score for a product against search query
export function scoreProductMatch(product, rawQuery) {
  if (!rawQuery || !rawQuery.trim()) return 1;

  const query = rawQuery.trim().toLowerCase();
  const tokens = query.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) return 1;

  const titleLower = (product.title || '').toLowerCase();
  const brandLower = (product.brand || '').toLowerCase();
  const catLower = (product.category || '').toLowerCase();
  const descLower = (product.description || '').toLowerCase();
  const badgeLower = (product.badge || '').toLowerCase();
  
  // Specs string
  const specsText = Array.isArray(product.specs) 
    ? product.specs.map(s => `${s.key || ''} ${s.value || ''}`).join(' ').toLowerCase()
    : '';

  // Variants string
  const variantsText = product.variants 
    ? Object.values(product.variants).flat().join(' ').toLowerCase() 
    : '';

  const fullText = `${titleLower} ${brandLower} ${catLower} ${descLower} ${badgeLower} ${specsText} ${variantsText}`;

  let score = 0;

  if (titleLower === query) score += 200;
  else if (titleLower.startsWith(query)) score += 100;
  else if (titleLower.includes(query)) score += 80;

  if (brandLower === query) score += 70;
  else if (brandLower.includes(query)) score += 40;

  let allTokensMatched = true;

  for (const token of tokens) {
    const normToken = normalizeToken(token);
    
    // Prevent "phone" matching inside "headphone"
    const matchedInTitle = matchesWord(titleLower, token) || matchesWord(titleLower, normToken);
    const matchedInBrand = matchesWord(brandLower, token) || brandLower.includes(token);
    const matchedInSpecs = matchesWord(specsText, token) || specsText.includes(token);
    const matchedInDesc = matchesWord(descLower, token) || matchesWord(descLower, normToken);
    const matchedCategory = matchCategorySynonym(catLower, token, titleLower);

    if (matchedInTitle || matchedInBrand || matchedCategory || matchedInSpecs || matchedInDesc) {
      if (matchedInTitle) {
        score += 40;
      }
      if (matchedInBrand) {
        score += 30;
      }
      if (matchedCategory) {
        score += 50; // High boost for category matching (e.g. 'mobile' brings all mobiles)
      }
      if (matchedInSpecs) {
        score += 15;
      }
      if (matchedInDesc) {
        score += 10;
      }
    } else {
      allTokensMatched = false;
      break;
    }
  }

  if (!allTokensMatched) return 0;

  // Rating boost
  score += Math.min(10, (product.rating || 0) * 2);

  return score;
}

// Filter and rank product list by query
export function filterAndRankProducts(products, query) {
  if (!query || !query.trim()) return products;

  const scored = [];
  for (const p of products) {
    const score = scoreProductMatch(p, query);
    if (score > 0) {
      scored.push({ product: p, score });
    }
  }

  // Sort by highest relevance score first
  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => s.product);
}
