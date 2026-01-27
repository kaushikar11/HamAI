/**
 * Shared utility for category color management
 * Ensures consistent colors across all components
 */

// Predefined palette of distinct colors (excluding pink as requested)
const colorPalette = [
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#0ea5e9', // Sky Blue
  '#a855f7', // Purple
  '#14b8a6', // Teal
  '#ef4444', // Red
  '#6366f1', // Indigo
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#64748b', // Slate
  '#14b8a6', // Turquoise
  '#f43f5e', // Rose
  '#0d9488', // Teal Dark
  '#7c3aed', // Purple Dark
  '#dc2626', // Red Dark
  '#059669', // Emerald Dark
  '#0284c7', // Sky Blue Dark
  '#c026d3', // Fuchsia
  '#ea580c', // Orange Dark
  '#65a30d', // Lime Dark
  '#0891b2', // Cyan Dark
  '#9333ea', // Purple Dark
  '#be123c'  // Rose Dark
];

/**
 * Get or assign a unique color for a category
 * @param {string} category - The category name
 * @param {Object} categoryColorMap - Current color mapping (from state/localStorage)
 * @param {Function} setCategoryColorMap - Function to update color mapping (optional)
 * @returns {string} - Hex color code
 */
export const getCategoryColor = (category, categoryColorMap = {}, setCategoryColorMap = null) => {
  const c = (category || 'other').toLowerCase();
  
  // If category already has a color, return it
  if (categoryColorMap[c]) {
    return categoryColorMap[c];
  }
  
  // Find the next available color that's not already used
  const usedColors = new Set(Object.values(categoryColorMap));
  let newColor = null;
  
  for (const color of colorPalette) {
    if (!usedColors.has(color)) {
      newColor = color;
      break;
    }
  }
  
  // If all colors are used, generate a random color
  if (!newColor) {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 60 + Math.floor(Math.random() * 30); // 60-90%
    const lightness = 45 + Math.floor(Math.random() * 15); // 45-60%
    newColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  
  // If setter function provided, update the map and localStorage
  if (setCategoryColorMap) {
    const newMap = { ...categoryColorMap, [c]: newColor };
    setCategoryColorMap(newMap);
    localStorage.setItem('categoryColorMap', JSON.stringify(newMap));
  }
  
  return newColor;
};

/**
 * Initialize category color map from localStorage
 * @returns {Object} - Category color mapping
 */
export const initializeCategoryColorMap = () => {
  const stored = localStorage.getItem('categoryColorMap');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse categoryColorMap from localStorage', e);
    }
  }
  // Default 3 categories with 3 default colors
  return {
    grocery: '#22c55e',      // Green
    utilities: '#3b82f6',     // Blue
    rent: '#f97316'           // Orange
  };
};

/**
 * Ensure all categories have colors assigned
 * Uses functional update to avoid dependency issues
 * @param {Array} categories - List of category names
 * @param {Function} setCategoryColorMap - Function to update color mapping
 */
export const ensureCategoryColors = (categories, setCategoryColorMap) => {
  if (!categories || categories.length === 0) return;
  
  setCategoryColorMap(prevMap => {
    const updatedMap = { ...prevMap };
    let mapUpdated = false;
    
    categories.forEach(cat => {
      const catLower = cat.toLowerCase();
      if (!updatedMap[catLower]) {
        // Find next available color
        const usedColors = new Set(Object.values(updatedMap));
        for (const color of colorPalette) {
          if (!usedColors.has(color)) {
            updatedMap[catLower] = color;
            mapUpdated = true;
            break;
          }
        }
        // If all palette colors used, generate random color
        if (!updatedMap[catLower]) {
          const hue = Math.floor(Math.random() * 360);
          const saturation = 60 + Math.floor(Math.random() * 30);
          const lightness = 45 + Math.floor(Math.random() * 15);
          updatedMap[catLower] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          mapUpdated = true;
        }
      }
    });
    
    if (mapUpdated) {
      localStorage.setItem('categoryColorMap', JSON.stringify(updatedMap));
      return updatedMap;
    }
    
    return prevMap;
  });
};

export { colorPalette };
