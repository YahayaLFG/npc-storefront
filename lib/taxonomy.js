export const COLLECTIONS = ['Men', 'Women', 'Accessories'];

export const CATEGORIES = [
  'Denim',
  'Jackets',
  'Shirts',
  'Shorts',
  'Pants',
  'Hoodies',
  'Outerwear',
  'Jerseys',
  'Shoes',
  'Bags',
  'Jewelry',
];

export const NAV_STRUCTURE = {
  Men: CATEGORIES.filter((c) => c !== 'Jewelry'),
  Women: CATEGORIES.filter((c) => c !== 'Jewelry'),
  Accessories: ['Bags', 'Shoes', 'Jewelry'],
};

export const AUTHENTICITY_TAGS = [
  { value: 'NPC Archive', description: 'Authentic' },
  { value: 'NPC Studio', description: 'Premium Sourced' },
  { value: 'NPC Drop', description: 'Limited Release' },
];

const TOPS_TEMPLATE = ['Chest', 'Shoulder', 'Length', 'Sleeve'];
const BOTTOMS_TEMPLATE = ['Waist', 'Hip', 'Thigh', 'Length'];
const FOOTWEAR_TEMPLATE = ['EU', 'Foot Length'];

export const STANDARD_SIZE_FIELDS = [
  'Chest',
  'Shoulder',
  'Length',
  'Sleeve',
  'Waist',
  'Hip',
  'Thigh',
  'EU',
  'Foot Length',
];

export const SIZE_GUIDE_TEMPLATES = {
  Shirts: TOPS_TEMPLATE,
  Jackets: TOPS_TEMPLATE,
  Hoodies: TOPS_TEMPLATE,
  Jerseys: TOPS_TEMPLATE,
  Outerwear: TOPS_TEMPLATE,

  Pants: BOTTOMS_TEMPLATE,
  Denim: BOTTOMS_TEMPLATE,
  Shorts: BOTTOMS_TEMPLATE,
  Bottoms: BOTTOMS_TEMPLATE,

  Shoes: FOOTWEAR_TEMPLATE,
  Sneakers: FOOTWEAR_TEMPLATE,
};

export function getSizeGuideTemplate(category) {
  return SIZE_GUIDE_TEMPLATES[category] || [];
}
