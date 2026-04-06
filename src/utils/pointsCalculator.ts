/**
 * Points Calculation System
 * Handles points earned from purchases and donations based on price tiers and item counts
 */

// Points configuration
export const POINTS_CONFIG = {
  // Shopping points based on purchase amount
  SHOPPING: {
    tiers: [
      { minAmount: 0, maxAmount: 499, pointsPerRupee: 0.1, bonusPoints: 0 }, // 10% of amount
      { minAmount: 500, maxAmount: 1499, pointsPerRupee: 0.15, bonusPoints: 25 }, // 15% + 25 bonus
      { minAmount: 1500, maxAmount: 2999, pointsPerRupee: 0.2, bonusPoints: 50 }, // 20% + 50 bonus
      { minAmount: 3000, maxAmount: 4999, pointsPerRupee: 0.25, bonusPoints: 100 }, // 25% + 100 bonus
      { minAmount: 5000, maxAmount: Infinity, pointsPerRupee: 0.3, bonusPoints: 200 } // 30% + 200 bonus
    ],
    basePoints: 5 // Minimum points for any purchase
  },
  
  // Donation points based on item types and quantities
  DONATION: {
    // Points per item type (base points + quantity multiplier)
    itemPoints: {
      'clothes': { basePoints: 5, perItem: 3, maxMultiplier: 10 }, // 5 + 3 per item, max 10x
      'books': { basePoints: 8, perItem: 4, maxMultiplier: 8 }, // 8 + 4 per book, max 8x
      'toys': { basePoints: 6, perItem: 2, maxMultiplier: 15 }, // 6 + 2 per toy, max 15x
      'electronics': { basePoints: 15, perItem: 10, maxMultiplier: 5 }, // 15 + 10 per item, max 5x
      'furniture': { basePoints: 20, perItem: 15, maxMultiplier: 4 }, // 20 + 15 per item, max 4x
      'food': { basePoints: 3, perItem: 1, maxMultiplier: 20 }, // 3 + 1 per item, max 20x
      'medicine': { basePoints: 12, perItem: 8, maxMultiplier: 6 }, // 12 + 8 per item, max 6x
      'school': { basePoints: 10, perItem: 6, maxMultiplier: 8 }, // 10 + 6 per item, max 8x
      'blanket': { basePoints: 7, perItem: 4, maxMultiplier: 12 }, // 7 + 4 per blanket, max 12x
      'shoes': { basePoints: 10, perItem: 7, maxMultiplier: 6 }, // 10 + 7 per pair, max 6x
      'kitchen': { basePoints: 8, perItem: 5, maxMultiplier: 8 }, // 8 + 5 per item, max 8x
      'sports': { basePoints: 9, perItem: 6, maxMultiplier: 7 }, // 9 + 6 per item, max 7x
      'general': { basePoints: 5, perItem: 2, maxMultiplier: 10 } // Default for uncategorized items
    },
    // Bonus points for quantity tiers
    quantityBonus: [
      { minQuantity: 1, maxQuantity: 4, bonusPoints: 0 }, // No bonus for 1-4 items
      { minQuantity: 5, maxQuantity: 9, bonusPoints: 10 }, // +10 bonus for 5-9 items
      { minQuantity: 10, maxQuantity: 19, bonusPoints: 25 }, // +25 bonus for 10-19 items
      { minQuantity: 20, maxQuantity: 49, bonusPoints: 50 }, // +50 bonus for 20-49 items
      { minQuantity: 50, maxQuantity: Infinity, bonusPoints: 100 } // +100 bonus for 50+ items
    ],
    basePoints: 10 // Minimum points for any donation
  }
};

/**
 * Calculate points earned from shopping
 * @param amount - Purchase amount in rupees
 * @returns Points breakdown object
 */
export const calculateShoppingPoints = (amount: number) => {
  if (!amount || amount <= 0) {
    return { basePoints: 0, tieredPoints: 0, bonusPoints: 0, totalPoints: 0, tier: null };
  }

  const tier = POINTS_CONFIG.SHOPPING.tiers.find(t => amount >= t.minAmount && amount <= t.maxAmount);
  const basePoints = POINTS_CONFIG.SHOPPING.basePoints;
  const tieredPoints = Math.floor(amount * (tier?.pointsPerRupee || 0.1));
  const bonusPoints = tier?.bonusPoints || 0;
  const totalPoints = basePoints + tieredPoints + bonusPoints;

  return {
    basePoints,
    tieredPoints,
    bonusPoints,
    totalPoints,
    tier: tier ? {
      range: `₹${tier.minAmount} - ${tier.maxAmount === Infinity ? '∞' : tier.maxAmount}`,
      rate: `${(tier.pointsPerRupee * 100).toFixed(0)}%`,
      bonus: tier.bonusPoints
    } : null
  };
};

/**
 * Calculate points earned from donation based on items and quantity
 * @param items - Description of donated items
 * @param quantity - Number of items donated
 * @returns Points breakdown object
 */
export const calculateDonationPoints = (items: string, quantity: number = 1) => {
  if (!items || quantity <= 0) {
    return { basePoints: 0, itemPoints: 0, quantityBonus: 0, totalPoints: 0, itemType: null, quantityTier: null };
  }

  // Detect item type from items description
  const detectedType = detectItemType(items);
  const itemConfig = POINTS_CONFIG.DONATION.itemPoints[detectedType] || POINTS_CONFIG.DONATION.itemPoints.general;
  
  // Calculate item points with quantity multiplier
  const multiplier = Math.min(quantity, itemConfig.maxMultiplier);
  const itemPoints = itemConfig.basePoints + (itemConfig.perItem * multiplier);
  
  // Find quantity bonus tier
  const quantityTier = POINTS_CONFIG.DONATION.quantityBonus.find(t => 
    quantity >= t.minQuantity && quantity <= t.maxQuantity
  );
  const quantityBonus = quantityTier?.bonusPoints || 0;
  
  const basePoints = POINTS_CONFIG.DONATION.basePoints;
  const totalPoints = basePoints + itemPoints + quantityBonus;

  return {
    basePoints,
    itemPoints,
    quantityBonus,
    totalPoints,
    itemType: detectedType,
    itemConfig,
    quantityTier: quantityTier ? {
      range: `${quantityTier.minQuantity} - ${quantityTier.maxQuantity === Infinity ? '∞' : quantityTier.maxQuantity} items`,
      bonus: quantityTier.bonusPoints
    } : null
  };
};

/**
 * Detect item type from description
 * @param items - Items description string
 * @returns Detected item type key
 */
const detectItemType = (items: string): string => {
  const lowerItems = items.toLowerCase();
  
  // Check for specific item types in order of specificity
  const typeChecks = [
    { keywords: ['clothes', 'shirt', 'pants', 'dress', 'jacket', 't-shirt', 'jeans', 'saree', 'kurta'], type: 'clothes' },
    { keywords: ['books', 'book', 'notebook', 'textbook', 'story', 'novel'], type: 'books' },
    { keywords: ['toys', 'toy', 'game', 'puzzle', 'doll', 'car'], type: 'toys' },
    { keywords: ['electronics', 'phone', 'laptop', 'computer', 'tablet', 'charger', 'headphone'], type: 'electronics' },
    { keywords: ['furniture', 'chair', 'table', 'bed', 'sofa', 'cupboard', 'almirah'], type: 'furniture' },
    { keywords: ['food', 'rice', 'wheat', 'oil', 'sugar', 'salt', 'grains'], type: 'food' },
    { keywords: ['medicine', 'tablet', 'capsule', 'ointment', 'bandage', 'first aid'], type: 'medicine' },
    { keywords: ['school', 'pencil', 'pen', 'notebook', 'bag', 'uniform', 'stationery'], type: 'school' },
    { keywords: ['blanket', 'bedsheet', 'pillow', 'quilt'], type: 'blanket' },
    { keywords: ['shoes', 'sandals', 'slippers', 'boots'], type: 'shoes' },
    { keywords: ['kitchen', 'plate', 'bowl', 'spoon', 'cooker', 'vessel'], type: 'kitchen' },
    { keywords: ['sports', 'ball', 'bat', 'racket', 'helmet'], type: 'sports' }
  ];
  
  for (const { keywords, type } of typeChecks) {
    if (keywords.some(keyword => lowerItems.includes(keyword))) {
      return type;
    }
  }
  
  return 'general'; // Default type if no specific match
};

/**
 * Get points tier information for display
 * @param type - 'SHOPPING' or 'DONATION'
 * @returns Array of tier information
 */
export const getPointsTiers = (type: 'SHOPPING' | 'DONATION') => {
  if (type === 'SHOPPING') {
    const config = POINTS_CONFIG.SHOPPING;
    return config.tiers.map((tier, index) => ({
      level: index + 1,
      range: `₹${tier.minAmount} - ${tier.maxAmount === Infinity ? '∞' : tier.maxAmount}`,
      rate: `${(tier.pointsPerRupee * 100).toFixed(0)}%`,
      bonus: tier.bonusPoints,
      description: `Earn ${(tier.pointsPerRupee * 100).toFixed(0)}% of amount${tier.bonusPoints > 0 ? ` + ${tier.bonusPoints} bonus points` : ''}`
    }));
  } else {
    // Return donation item types information
    const itemTypes = Object.entries(POINTS_CONFIG.DONATION.itemPoints).map(([type, config]) => ({
      type,
      basePoints: config.basePoints,
      perItem: config.perItem,
      maxMultiplier: config.maxMultiplier,
      description: `${config.basePoints} + ${config.perItem} per item (max ${config.maxMultiplier}x)`
    }));
    
    const quantityTiers = POINTS_CONFIG.DONATION.quantityBonus.map((tier, index) => ({
      level: index + 1,
      range: `${tier.minQuantity} - ${tier.maxQuantity === Infinity ? '∞' : tier.maxQuantity} items`,
      bonus: tier.bonusPoints,
      description: `+${tier.bonusPoints} bonus points`
    }));
    
    return { itemTypes, quantityTiers };
  }
};

/**
 * Format points for display
 * @param points - Number of points
 * @returns Formatted string
 */
export const formatPoints = (points: number): string => {
  return points.toLocaleString('en-IN');
};

/**
 * Get points breakdown message
 * @param breakdown - Points calculation result
 * @param type - 'shopping' or 'donation'
 * @returns Human readable message
 */
export const getPointsBreakdownMessage = (breakdown: any, type: 'shopping' | 'donation'): string => {
  const { basePoints, totalPoints } = breakdown;
  
  if (type === 'shopping') {
    const { tieredPoints, bonusPoints, tier } = breakdown;
    let message = `Earned ${formatPoints(totalPoints)} points!`;
    
    if (tier) {
      message += ` (${tier.rate} rate`;
      if (bonusPoints > 0) {
        message += ` + ${formatPoints(bonusPoints)} bonus`;
      }
      message += ')';
    }
    
    if (basePoints > 0 && tieredPoints > 0) {
      message += ` - Base: ${formatPoints(basePoints)}, Tiered: ${formatPoints(tieredPoints)}`;
    }
    
    return message;
  } else {
    const { itemPoints, quantityBonus, itemType, quantityTier } = breakdown;
    let message = `Earned ${formatPoints(totalPoints)} points for ${itemType} donation!`;
    
    if (quantityTier) {
      message += ` (${quantityTier.range} - +${formatPoints(quantityBonus)} bonus)`;
    }
    
    message += ` - Base: ${formatPoints(basePoints)}, Items: ${formatPoints(itemPoints)}`;
    
    return message;
  }
};
