// xpLogic.js
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
  10: 6000,
  11: 7800,
  12: 9900,
  13: 12300,
  14: 15000,
  15: 18000,
  16: 21300,
  17: 25000,
  18: 29000,
  19: 33400,
  20: 38200,
  21: 43400,
  22: 49000,
  23: 55000,
  24: 61500,
  25: 68500,
  26: 76000,
  27: 84000,
  28: 92500,
  29: 101500,
  30: 111000
};

export function getXpForLevel(level) {
  return xpTable[level] !== undefined ? xpTable[level] : (xpTable[Object.keys(xpTable).length] || 0);
}

export function getMaxLevel() {
  return Math.max(...Object.keys(xpTable).map(Number));
}
