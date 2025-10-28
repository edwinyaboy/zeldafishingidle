// xpLogic.js
// XP logic for fishing simulator: set XP requirements for each level.

// You can customize the XP required for each level here.
// Example: {1: 0, 2: 100, 3: 250, 4: 500, ...}
export const xpTable = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 900,
  6: 1500,
  7: 2300,
  8: 3300,
  9: 4500,
  10: 6000
  // Add more levels as needed
};

// Get required XP for the next levelexport function getXpForLevel(level) {
  return xpTable[level] !== undefined ? xpTable[level] : (xpTable[Object.keys(xpTable).length] || 0);
}

// Get the max level defined
export function getMaxLevel() {
  return Math.max(...Object.keys(xpTable).map(Number));
}
