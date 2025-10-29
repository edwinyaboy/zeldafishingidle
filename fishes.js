export const fishRarities = [
  { name: 'Common', color: '#b0c4b1', chance: 0.60, baseCurrency: 10, xp: 1 },
  { name: 'Rare', color: '#4299e1', chance: 0.20, baseCurrency: 50, xp: 3 },
  { name: 'Unique', color: '#8e44ad', chance: 0.08, baseCurrency: 100, xp: 5 },
  { name: 'Epic', color: '#e67e22', chance: 0.06, baseCurrency: 250, xp: 10 },
  { name: 'Legendary', color: '#ffd700', chance: 0.04, baseCurrency: 1000, xp: 15 },
  { name: 'Mythical', color: '#e84393', chance: 0.015, baseCurrency: 5000, xp: 20 },
  { name: 'Secret', color: '#00bcd4', chance: 0.005, baseCurrency: 10000, xp: 30 },
  { name: 'Triforce', color: '#ffcc00', chance: 0.001, baseCurrency: 0, xp: 0 }
];

export const fishList = {
  Common: [
    'Hyrule Bass',
    'Hearty Bass',
    'Hearty Salmon',
    'Chillfin Trout',
    'Sizzlefin Trout',
    'Armored Carp',
    'Armored Porgy'
  ],
  Rare: [
    'Voltfin Trout',
    'Staminoka Bass',
    'Stealthfin Trout',
    'Greengill',
    'Toona'
  ],
  Unique: [
    'Reekfish',
    'Ordon Catfish',
    'Loovar'
  ],
  Epic: [
    'Mighty Carp',
    'Mighty Porgy',
    'Hylian Pike'
  ],
  Legendary: [
    'Hylian Loach',
    'Sanke Carp',
    'Ancient Arowana'
  ],
  Mythical: [
    'Fairy Fish'
  ],
  Secret: [
    'Hylian Loach (Baby)'
  ],
  Triforce: [
    { id: 1, name: 'Triforce Shard 1', type: 'reelSpeed', value: 0.05 },
    { id: 2, name: 'Triforce Shard 2', type: 'luck', value: 0.05 },
    { id: 3, name: 'Triforce Shard 3', type: 'reelSpeed', value: 0.05 },
    { id: 4, name: 'Triforce Shard 4', type: 'luck', value: 0.05 },
    { id: 5, name: 'Triforce Shard 5', type: 'reelSpeed', value: 0.05 },
    { id: 6, name: 'Triforce Shard 6', type: 'luck', value: 0.05 },
    { id: 7, name: 'Triforce Shard 7', type: 'reelSpeed', value: 0.05 },
    { id: 8, name: 'Triforce Shard 8', type: 'luck', value: 0.05 }
  ]
};

// Track which shards the player has caught
export let ownedShards = {};

// Apply shard bonuses to the player
export let playerStats = {
  reelSpeed: 1,
  luck: 1
};

/**
 * Call when a Triforce shard is caught
 */
export function catchTriforceShard(shard) {
  if (!shard || ownedShards[shard.id]) return null;

  ownedShards[shard.id] = shard;

  if (shard.type === 'reelSpeed') playerStats.reelSpeed += shard.value;
  if (shard.type === 'luck') playerStats.luck += shard.value;

  return shard;
}
