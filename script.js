// ============================================
// ZELDA FISHING GAME - COMPLETE MODULE REWRITE
// ============================================

import { fishRarities, fishList, catchTriforceShard, playerStats } from './fishes.js';

// ----------------------------
// Game state
// ----------------------------
export let gameState = {
  rupees: 0,
  mon: 0,
  xp: 0,
  level: 1,
  lifetimeFish: 0,
  timesFished: 0,
  inventory: {},
  fishIndex: {},
  autoFishUnlocked: false,
  reelSpeedLevel: 0,
  luckLevel: 0,
  collectedShards: {},
  pullsUntilShiny: 500,
  achievements: {},
  currentLure: null,
  comboCount: 0,
  lastFishType: null,
  sameTypeCombo: 0,
  perfectHits: 0,
  totalSpent: 0,
  monSpent: 0,
  activePotions: { luck: 0, reel: 0 },
  temporaryBoosts: { luck: 0, reelSpeed: 0 }
};

// ----------------------------
// Lure tiers
// ----------------------------
export const LURE_TIERS = [
  { level: 0, name: 'Starter Lure', tier: 0, greenZone: 0.15, icon: 'starter' },
  { level: 5, name: 'Coral Earring', tier: 1, greenZone: 0.25, icon: 'coral' },
  { level: 10, name: 'Frog Lure', tier: 2, greenZone: 0.35, icon: 'frog' },
  { level: 20, name: 'Sinking Lure', tier: 3, greenZone: 0.45, icon: 'sink' }
];

// ----------------------------
// Tier-based rarity selection
// ----------------------------
export function getAvailableRaritiesForTier(tier) {
  switch (tier) {
    case 0: return ['Common', 'Rare'];
    case 1: return ['Common', 'Rare', 'Unique', 'Epic'];
    case 2: return ['Common', 'Rare', 'Unique', 'Epic', 'Legendary', 'Mythical'];
    case 3: return ['Common', 'Rare', 'Unique', 'Epic', 'Legendary', 'Mythical', 'Secret', 'Triforce'];
    default: return ['Common', 'Rare'];
  }
}

export function getFishByLureTier(tier) {
  const allowedRarities = getAvailableRaritiesForTier(tier);
  const availableRarities = fishRarities.filter(r => allowedRarities.includes(r.name));

  const totalChance = availableRarities.reduce((sum, r) => sum + r.chance, 0);
  let rand = Math.random() * totalChance;
  let selectedRarity = availableRarities[0];

  for (const rarity of availableRarities) {
    rand -= rarity.chance;
    if (rand <= 0) {
      selectedRarity = rarity;
      break;
    }
  }

  const pool = fishList[selectedRarity.name];
  if (selectedRarity.name === 'Triforce') {
    const shard = pool[Math.floor(Math.random() * pool.length)];
    catchTriforceShard(shard);
    return { rarity: selectedRarity, fishName: shard.name, raw: shard };
  } else {
    const name = pool[Math.floor(Math.random() * pool.length)];
    return { rarity: selectedRarity, fishName: name };
  }
}

// ACHIEVEMENTS DATA
const ACHIEVEMENTS = {
  catch: {
    firstCatch: { name: 'First Catch', desc: 'Catch your first fish', reward: 5, unlocked: false },
    collector: { name: 'Collector', desc: 'Catch 10 different species', reward: 20, unlocked: false },
    anglerMaster: { name: 'Angler Master', desc: 'Catch all fish', reward: 100, unlocked: false },
    rareCatch: { name: 'Rare Catch', desc: 'Catch a Rare fish', reward: 10, unlocked: false },
    uniqueCatch: { name: 'Unique Catch', desc: 'Catch a Unique fish', reward: 15, unlocked: false },
    epicCatch: { name: 'Epic Catch', desc: 'Catch an Epic fish', reward: 25, unlocked: false },
    legendaryCatch: { name: 'Legendary Catch', desc: 'Catch a Legendary fish', reward: 40, unlocked: false },
    mythicalCatch: { name: 'Mythical Catch', desc: 'Catch a Mythical fish', reward: 50, unlocked: false },
    secretCatch: { name: 'Secret Catch', desc: 'Catch the Secret fish', reward: 100, unlocked: false }
  },
  shiny: {
    shinyHunter: { name: 'Shiny Hunter', desc: 'Catch your first shiny', reward: 30, unlocked: false },
    shinyCollector: { name: 'Shiny Collector', desc: 'Catch 10 shinies', reward: 50, unlocked: false },
    shinyMaster: { name: 'Shiny Master', desc: 'Catch all shiny fish', reward: 150, unlocked: false }
  },
  quantity: {
    busyBeaver: { name: 'Busy Beaver', desc: 'Catch 100 fish total', reward: 25, unlocked: false },
    fishingFrenzy: { name: 'Fishing Frenzy', desc: 'Catch 500 fish total', reward: 50, unlocked: false },
    lifetimeAngler: { name: 'Lifetime Angler', desc: 'Catch 1000 fish total', reward: 100, unlocked: false }
  },
  lure: {
    baitBeginner: { name: 'Bait Beginner', desc: 'Unlock Coral Earring', reward: 10, unlocked: false },
    lurePro: { name: 'Lure Pro', desc: 'Unlock Frog Lure', reward: 20, unlocked: false },
    lureMaster: { name: 'Lure Master', desc: 'Unlock Sinking Lure', reward: 30, unlocked: false }
  },
  skill: {
    perfectSlider: { name: 'Perfect Slider', desc: 'Hit green zone perfectly 5 times', reward: 50, unlocked: false },
    reelSpeedDemon: { name: 'Reel Speed Demon', desc: 'Max out Reel Speed', reward: 40, unlocked: false },
    luckyAngler: { name: 'Lucky Angler', desc: 'Max out Luck', reward: 40, unlocked: false }
  },
  upgrade: {
    autoFishOwner: { name: 'Auto-Fish Owner', desc: 'Buy Auto Fish', reward: 25, unlocked: false },
    bigSpender: { name: 'Big Spender', desc: 'Spend 50,000 rupees', reward: 75, unlocked: false },
    monSpender: { name: '420 Mon', desc: 'Spend 1,000 Mon', reward: 69, unlocked: false }
  },
  triforce: {
    courageComplete: { name: 'Triforce of Courage', desc: 'Collect all shards', reward: 200, unlocked: false }
  }
};

// UI ELEMENTS
const elements = {
  rupees: document.getElementById('coin-count'),
  mon: document.getElementById('gem-count'),
  lifetimeFish: document.getElementById('lifetime-fish-count'),
  luck: document.getElementById('luck-percentage'),
  reelSpeed: document.getElementById('reel-speed-level'),
  shinyPull: document.getElementById('shiny-pull-count'),
  xpLevel: document.getElementById('xp-level'),
  xpProgress: document.getElementById('xp-progress'),
  xpText: document.getElementById('xp-progress-text'),
  fishingStatus: document.getElementById('fishing-status'),
  fishBtn: null,
  autoFishBtn: null
};

// SLIDER STATE
let sliderState = {
  active: false,
  position: 0,
  greenStart: 0,
  greenEnd: 0,
  speed: 2,
  direction: 1,
  animFrame: null,
  pendingFish: null
};

// FISHING STATE
let isFishing = false;

// LOAD/SAVE
function loadState() {
  const saved = localStorage.getItem('zeldaFishingV2');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.assign(gameState, data);

      // Sync ACHIEVEMENTS unlocked status from saved gameState
      Object.keys(gameState.achievements).forEach(key => {
        const [category, achKey] = key.split('_');
        if (ACHIEVEMENTS[category] && ACHIEVEMENTS[category][achKey]) {
          ACHIEVEMENTS[category][achKey].unlocked = true;
        }
      });

      updateAllUI();
    } catch (e) {
      console.error('Load failed', e);
    }
  }
}

function saveState() {
  localStorage.setItem('zeldaFishingV2', JSON.stringify(gameState));
}

// CALCULATIONS
function getTotalLuck() {
  let total = 0;
  const tierBonuses = [0.0333, 0.0333, 0.0334];
  for (let i = 0; i < gameState.luckLevel; i++) total += tierBonuses[i];
  Object.values(gameState.collectedShards).forEach(s => {
    if (s.type === 'luck') total += s.value;
  });
  if (Date.now() < gameState.activePotions.luck) total += 0.10;
  total += gameState.temporaryBoosts.luck;
  return Math.min(total, 1.0);
}

function getReelSpeedBonus() {
  let bonus = 0;
  const tierBonuses = [8, 8, 9];
  for (let i = 0; i < gameState.reelSpeedLevel; i++) bonus += tierBonuses[i];
  Object.values(gameState.collectedShards).forEach(s => {
    if (s.type === 'reelSpeed') bonus += s.value;
  });
  if (Date.now() < gameState.activePotions.reel) bonus += 20;
  bonus += gameState.temporaryBoosts.reelSpeed;
  return bonus;
}

function getCurrentLure() {
  let current = null;
  LURE_TIERS.forEach(lure => {
    if (gameState.level >= lure.level) current = lure;
  });
  return current;
}

function getLureIcon() {
  const lure = getCurrentLure();
  if (!lure) return 'assets/starter_lure.png';
  const icons = {
    0: 'assets/starter_lure.png',
    1: 'assets/coral_earring.png',
    2: 'assets/frog_lure.png',
    3: 'assets/sinking_lure.png'
  };
  return icons[lure.tier] || 'assets/starter_lure.png';
}

function getTotalInventoryCount() {
  return Object.values(gameState.inventory).reduce((sum, fish) => sum + fish.count, 0);
}

function formatNumber(n) {
  n = n || 0;
  if (n < 10000) return n.toLocaleString();
  if (n < 1000000) return Math.floor(n / 1000) + 'k';
  return Math.floor(n / 1000000) + 'M';
}

function getFishImage(fishName) {
  if (fishName === 'Hyrule Bass') return 'assets/fish.png';
  const cleanName = fishName.replace(' (shiny)', '').replace(/ /g, '_');
  return `assets/${cleanName}.png`;
}

// ACHIEVEMENTS
function unlockAchievement(category, key) {
  if (!ACHIEVEMENTS[category] || !ACHIEVEMENTS[category][key]) return;
  const ach = ACHIEVEMENTS[category][key];
  if (gameState.achievements[`${category}_${key}`]) {
    ach.unlocked = true;
    return;
  }

  ach.unlocked = true;
  gameState.achievements[`${category}_${key}`] = true;
  gameState.mon += ach.reward;

  showNotification(`🏆 ${ach.name} unlocked! +${ach.reward} Mon`);
  updateAllUI();
  saveState();
}

function checkAchievements() {
  if (gameState.lifetimeFish >= 1) unlockAchievement('catch', 'firstCatch');
  if (gameState.lifetimeFish >= 100) unlockAchievement('quantity', 'busyBeaver');
  if (gameState.lifetimeFish >= 500) unlockAchievement('quantity', 'fishingFrenzy');
  if (gameState.lifetimeFish >= 1000) unlockAchievement('quantity', 'lifetimeAngler');
  
  const uniqueSpecies = Object.keys(gameState.fishIndex).filter(k => !k.includes('(shiny)')).length;
  if (uniqueSpecies >= 10) unlockAchievement('catch', 'collector');
  
  const allFish = [];
  Object.keys(fishList).forEach(rarity => {
    if (rarity !== 'Triforce') {
      fishList[rarity].forEach(f => {
        if (typeof f === 'string') allFish.push(f);
      });
    }
  });
  if (allFish.every(f => gameState.fishIndex[f])) unlockAchievement('catch', 'anglerMaster');
  
  const shinyCount = Object.keys(gameState.inventory).filter(k => k.includes('(shiny)')).length;
  if (shinyCount >= 1) unlockAchievement('shiny', 'shinyHunter');
  if (shinyCount >= 10) unlockAchievement('shiny', 'shinyCollector');
  
  if (gameState.reelSpeedLevel >= 3) unlockAchievement('skill', 'reelSpeedDemon');
  if (gameState.luckLevel >= 3) unlockAchievement('skill', 'luckyAngler');
  if (gameState.perfectHits >= 5) unlockAchievement('skill', 'perfectSlider');
  
  if (gameState.autoFishUnlocked) unlockAchievement('upgrade', 'autoFishOwner');
  if (gameState.totalSpent >= 50000) unlockAchievement('upgrade', 'bigSpender');
  if (gameState.monSpent >= 1000) unlockAchievement('upgrade', 'monSpender');
  
  if (Object.keys(gameState.collectedShards).length === 8) unlockAchievement('triforce', 'courageComplete');
  
  const lure = getCurrentLure();
  if (lure) {
    if (lure.tier >= 1) unlockAchievement('lure', 'baitBeginner');
    if (lure.tier >= 2) unlockAchievement('lure', 'lurePro');
    if (lure.tier >= 3) unlockAchievement('lure', 'lureMaster');
  }
}

// NOTIFICATIONS
const notifications = [];

function showNotification(message) {
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2a2f44;
    color: #ffd700;
    padding: 1em 1.5em;
    border-radius: 8px;
    border: 2px solid #ffd700;
    z-index: 9999;
    font-family: 'Press Start 2P', monospace;
    font-size: 0.8em;
    margin-top: 0.5em;
    opacity: 0;
    transform: translateX(100%);
    transition: transform 0.3s ease, opacity 0.3s ease;
  `;

  document.body.appendChild(notif);
  notifications.push(notif);

  notifications.forEach((n, i) => {
    n.style.top = `${20 + i * 60}px`;
  });

  requestAnimationFrame(() => {
    notif.style.opacity = 1;
    notif.style.transform = 'translateX(0)';
  });

  setTimeout(() => {
    notif.style.opacity = 0;
    notif.style.transform = 'translateX(100%)';
    setTimeout(() => {
      notif.remove();
      notifications.splice(notifications.indexOf(notif), 1);
      notifications.forEach((n, i) => {
        n.style.top = `${20 + i * 60}px`;
      });
    }, 300);
  }, 3000);
}

// FISHING SLIDER
function initSlider(fishData) {
  const lure = getCurrentLure();
  const greenZoneSize = lure ? lure.greenZone : 0.20;
  
  sliderState.greenStart = 0.15 + Math.random() * (0.85 - greenZoneSize - 0.15);
  sliderState.greenEnd = sliderState.greenStart + greenZoneSize;
  sliderState.position = 0;
  sliderState.direction = 1;
  sliderState.speed = 0.5 + Math.random() * 0.3;
  sliderState.active = true;
  sliderState.pendingFish = fishData;
  
  drawSlider();
  animateSlider();
}

function drawSlider() {
  let sliderUI = document.getElementById('fishing-slider');
  if (!sliderUI) {
    sliderUI = document.createElement('div');
    sliderUI.id = 'fishing-slider';
    sliderUI.style.cssText = `
      position: relative;
      width: 100%;
      max-width: 400px;
      height: 60px;
      background: #2a2f44;
      border: 3px solid #4a90a4;
      border-radius: 8px;
      margin: 20px auto;
      overflow: hidden;
    `;
    document.getElementById('character-area').appendChild(sliderUI);
  }
  
  const lureIcon = getLureIcon();
  
  sliderUI.innerHTML = `
    <div style="position: absolute; left: ${sliderState.greenStart * 100}%; width: ${(sliderState.greenEnd - sliderState.greenStart) * 100}%; height: 100%; background: #23d160; opacity: 0.5;"></div>
    <div id="slider-marker" style="position: absolute; left: ${sliderState.position * 100}%; top: 50%; transform: translate(-50%, -50%);">
      <img src="${lureIcon}" style="width: 40px; height: 40px; image-rendering: pixelated; object-fit: contain;">
    </div>
  `;
}

function animateSlider() {
  if (!sliderState.active) return;
  
  sliderState.position += sliderState.direction * sliderState.speed * 0.005;
  
  if (sliderState.position >= 1) {
    sliderState.position = 1;
    sliderState.direction = -1;
  } else if (sliderState.position <= 0) {
    sliderState.position = 0;
    sliderState.direction = 1;
  }
  
  const marker = document.getElementById('slider-marker');
  if (marker) {
    marker.style.left = (sliderState.position * 100) + '%';
  }
  
  sliderState.animFrame = requestAnimationFrame(animateSlider);
}

function stopSlider(success) {
  sliderState.active = false;
  if (sliderState.animFrame) {
    cancelAnimationFrame(sliderState.animFrame);
    sliderState.animFrame = null;
  }
  
  const sliderUI = document.getElementById('fishing-slider');
  if (sliderUI) {
    setTimeout(() => sliderUI.remove(), 100);
  }
  
  if (success) {
    completeCatch(sliderState.pendingFish);
  } else {
    gameState.comboCount = 0;
    gameState.sameTypeCombo = 0;
    elements.fishingStatus.textContent = '❌ Missed!';
    setTimeout(() => {
      elements.fishingStatus.textContent = 'Ready to fish!';
      if (elements.fishBtn) elements.fishBtn.disabled = false;
      isFishing = false; // Reset fishing state
    }, 1500);
  }
  
  sliderState.pendingFish = null;
}

function clickSlider() {
  if (!sliderState.active) return;
  
  const inGreen = sliderState.position >= sliderState.greenStart && sliderState.position <= sliderState.greenEnd;
  const midPoint = (sliderState.greenStart + sliderState.greenEnd) / 2;
  const perfect = Math.abs(sliderState.position - midPoint) < 0.05;
  
  if (perfect) {
    gameState.perfectHits++;
    checkAchievements();
  }
  
  stopSlider(inGreen);
}

// Helper to add fish to inventory
function addFishToInventory(fishName, rarity, count = 1) {
  const key = `${rarity.name}|${fishName}`;

  // Clone rarity so all fields exist
  const rarityCopy = { ...fishRarities.find(r => r.name === rarity.name) };

  if (!gameState.inventory[key]) {
    gameState.inventory[key] = { fishName, rarity: rarityCopy, count: 0 };
  }

  gameState.inventory[key].count += count;
  if (gameState.inventory[key].count > 50) gameState.inventory[key].count = 50;

  // Update fishIndex
  if (!gameState.fishIndex[fishName]) {
    gameState.fishIndex[fishName] = { rarity: rarityCopy, count: 0, unlocked: true };
  }
  gameState.fishIndex[fishName].count += count;
  
  // Cap fishIndex count
  if (gameState.fishIndex[fishName].count > 9999) {
    gameState.fishIndex[fishName].count = 9999;
  }
}

// ---------------- FISHING ----------------
function startFishing() {
  // Prevent any fishing action if already in progress
  if (isFishing || sliderState.active) {
    if (sliderState.active) clickSlider();
    return;
  }

  // Prevent fishing if button is disabled
  if (elements.fishBtn && elements.fishBtn.disabled) return;

  isFishing = true;
  if (elements.fishBtn) elements.fishBtn.disabled = true;
  elements.fishingStatus.textContent = 'Casting...';
  gameState.timesFished++;

  setTimeout(() => {
    const lure = getCurrentLure();
    const tierResult = getFishByLureTier(lure ? lure.tier : 0);
    const rarity = tierResult.rarity;
    let fishName = tierResult.fishName;
    const fishData = tierResult.raw || fishName;
    let isTriforce = rarity.name === 'Triforce';

    let isShiny = false;
    if (gameState.pullsUntilShiny <= 1 && !isTriforce) {
      isShiny = true;
      gameState.pullsUntilShiny = 500;
      fishName += ' (shiny)';
    } else if (!isTriforce) {
      gameState.pullsUntilShiny--;
    }

    elements.fishingStatus.innerHTML =
      'Click <span style="color: #4a90a4; font-weight: bold;">Fish!</span> button to catch!';
    if (elements.fishBtn) elements.fishBtn.disabled = false;
    initSlider({ rarity, fishName, fishData, isShiny, isTriforce });
  }, 1000);
}

function completeCatch(data) {
  const { rarity, fishName, fishData, isTriforce } = data;
  const { comboCount, sameTypeCombo, lastFishType } = gameState;

  // --- Base values ---
  let rupees = rarity.baseCurrency;
  let xp = rarity.xp;
  gameState.lifetimeFish++;

  // --- Combo System ---
  const comboMultiplier = 1 + Math.min(comboCount * 0.1, 1.0);
  gameState.comboCount++;

  if (fishName === lastFishType) {
    gameState.sameTypeCombo++;
  } else {
    gameState.sameTypeCombo = 1;
    gameState.lastFishType = fishName;
  }

  const sameTypeMultiplier = 1 + Math.min((gameState.sameTypeCombo - 1) * 0.1, 1.0);

  // --- Apply multipliers ---
  rupees = Math.floor(rupees * comboMultiplier * sameTypeMultiplier);
  xp = Math.floor(xp * comboMultiplier);

  // --- Update stats ---
  gameState.rupees += rupees;
  gameState.xp += xp;

  // --- Level up logic ---
  if (gameState.xp >= 100) {
    gameState.xp -= 100;
    gameState.level++;
    showNotification(`⭐ Level Up! Now level ${gameState.level}`);
  }

  // --- Triforce shard collection ---
  if (isTriforce && !gameState.collectedShards[fishData.id]) {
    gameState.collectedShards[fishData.id] = fishData;

    // Pick correct shard image (1–8)
    const shardNum = Math.min(fishData.id + 1, 8);
    const shardImg = `assets/Triforce_Shard_${shardNum}.png`;

    showNotification(`
      <img src="${shardImg}" alt="Triforce Shard" style="height:20px; vertical-align:middle; margin-right:4px;">
      Triforce Shard collected!
    `);
  }

  // --- Inventory ---
  if (getTotalInventoryCount() >= 100) {
    showNotification('Inventory full! (100 fish max)');
  } else {
    addFishToInventory(fishName, rarity);
  }

  // --- Achievements ---
  const rarityAchievements = ['Rare', 'Unique', 'Epic', 'Legendary', 'Mythical', 'Secret'];
  if (rarityAchievements.includes(rarity.name)) {
    unlockAchievement('catch', `${rarity.name.toLowerCase()}Catch`);
  }

  // --- Bonus text ---
  const bonusLines = [];
  if (comboMultiplier > 1) bonusLines.push(`💥 ${comboMultiplier.toFixed(1)}x Combo`);
  if (sameTypeMultiplier > 1) bonusLines.push(`🔥 ${sameTypeMultiplier.toFixed(1)}x Streak`);

  // --- Display catch info ---
  elements.fishingStatus.innerHTML = `
   Caught <span style="color:${rarity.color}">${fishName}</span>!<br>
   <span style="font-size:0.9em; display:inline-flex; align-items:center; gap:6px; color:#ffd700;">
     +${rupees} <img src="assets/coin.png" alt="Rupee" style="height:16px; vertical-align:middle;">
   </span><br>
   <span style="color:#4db8ff; font-size:0.9em;">+${xp} XP</span>
    ${bonusLines.length ? `<br><span style="color:#ff6b6b; font-size:0.85em;">${bonusLines.join('<br>')}</span>` : ''}
  `;

  // --- Final updates ---
  checkAchievements();
  updateAllUI();
  saveState();

  // --- Reset state ---
  setTimeout(() => {
    elements.fishingStatus.textContent = 'Ready to fish!';
    if (elements.fishBtn) elements.fishBtn.disabled = false;
    isFishing = false;
  }, 2500);
}

// ---------------- RANDOM ----------------
function getRandomRarity() {
  const luck = getTotalLuck();
  let rand = Math.random();
  let acc = 0;

  for (const rarity of fishRarities) {
    let chance = rarity.chance;
    if (rarity.name !== 'Common') chance *= (1 + luck);
    else chance *= (1 - luck * 0.5);

    acc += chance;
    if (rand < acc) return rarity;
  }
  return fishRarities[0];
}

function getRandomFishByRarity(rarity) {
  const arr = fishList[rarity.name];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------- AUTO FISH ----------------
let autoFishInterval = null;
let autoFishTimer = 30;
let autoFishCountdown = null;

function toggleAutoFish() {
  if (autoFishInterval) stopAutoFish();
  else startAutoFish();
}

function startAutoFish() {
  if (!gameState.autoFishUnlocked) return;

  autoFishTimer = 30;
  updateAutoFishTimer();

  autoFishInterval = setInterval(() => {
    if (!sliderState.active && elements.fishBtn && !elements.fishBtn.disabled) autoCatchFish();
  }, 3000);

  autoFishCountdown = setInterval(() => {
    autoFishTimer--;
    updateAutoFishTimer();
    if (autoFishTimer <= 0) stopAutoFish();
  }, 1000);

  if (elements.autoFishBtn) {
    elements.autoFishBtn.textContent = `Stop (${autoFishTimer}s)`;
    elements.autoFishBtn.style.background = '#e74c3c';
  }
}

function autoCatchFish() {
  // Prevent auto-fishing if manual fishing is in progress
  if (isFishing) return;
  
  if (elements.fishBtn) elements.fishBtn.disabled = true;
  gameState.timesFished++;

  const lure = getCurrentLure();
  const tierResult = getFishByLureTier(lure ? lure.tier : 0);
  const rarity = tierResult.rarity;
  let fishName = tierResult.fishName;
  const fishData = tierResult.raw || fishName;
  let isTriforce = rarity.name === 'Triforce';

  let isShiny = false;
  if (gameState.pullsUntilShiny <= 1 && !isTriforce) {
    isShiny = true;
    gameState.pullsUntilShiny = 500;
    fishName += ' (shiny)';
  } else if (!isTriforce) gameState.pullsUntilShiny--;

  const rupees = Math.floor(rarity.baseCurrency * 0.75);
  const xp = Math.floor(rarity.xp * 0.75);

  gameState.rupees += rupees;
  gameState.xp += xp;
  gameState.lifetimeFish++;

  if (gameState.xp >= 100) {
    gameState.xp -= 100;
    gameState.level++;
  }

  if (isTriforce && !gameState.collectedShards[fishData.id]) {
    gameState.collectedShards[fishData.id] = fishData;
  }

  if (getTotalInventoryCount() < 100) addFishToInventory(fishName, rarity);

  elements.fishingStatus.innerHTML = `
    Auto-caught <span style="color:${rarity.color}">${fishName}</span>!
    <br>
    <span style="color:#ffd700; font-size:0.8em; display:inline-flex; align-items:center; gap:4px;">
      +${rupees}
      <img src="assets/coin.png" alt="Rupee" style="height:14px; vertical-align:middle;">
      <img src="assets/gem.png" alt="Gem" style="height:14px; vertical-align:middle;">
      +${xp} <span style="color:#4db8ff;">XP (75%)</span>
    </span>
  `;

  checkAchievements();
  updateAllUI();
  saveState();

  setTimeout(() => {
    if (elements.fishBtn) elements.fishBtn.disabled = false;
  }, 500);
}

function stopAutoFish() {
  if (autoFishInterval) clearInterval(autoFishInterval);
  if (autoFishCountdown) clearInterval(autoFishCountdown);
  autoFishInterval = null;
  autoFishCountdown = null;

  if (elements.autoFishBtn) {
    elements.autoFishBtn.textContent = 'Auto Fish';
    elements.autoFishBtn.style.background = '#8e44ad';
  }
}

function updateAutoFishTimer() {
  if (elements.autoFishBtn && autoFishInterval) {
    elements.autoFishBtn.textContent = `Stop (${autoFishTimer}s)`;
  }
}

// UI UPDATES
function updateAllUI() {
  if (elements.rupees) elements.rupees.textContent = formatNumber(gameState.rupees);
  if (elements.mon) elements.mon.textContent = formatNumber(gameState.mon);
  if (elements.lifetimeFish) elements.lifetimeFish.textContent = gameState.lifetimeFish;
  if (elements.luck) elements.luck.textContent = (getTotalLuck() * 100).toFixed(1);
  if (elements.reelSpeed) elements.reelSpeed.textContent = 100 + getReelSpeedBonus();
  if (elements.shinyPull) elements.shinyPull.textContent = gameState.pullsUntilShiny;
  
  if (elements.xpLevel) elements.xpLevel.textContent = gameState.level;
  if (elements.xpProgress) elements.xpProgress.style.width = gameState.xp + '%';
  if (elements.xpText) elements.xpText.textContent = `${gameState.xp}/100`;
  
  updateUpgradesTab();
  updateInventoryTab();
  updateIndexTab();
  updateTriforceTab();
  updateAchievementsTab();
  updateChestsTab();
  updateShopTab();
  
  if (gameState.autoFishUnlocked && !elements.autoFishBtn) {
    const container = document.getElementById('fish-btn-container');
    if (container && !document.getElementById('auto-fish-btn')) {
      elements.autoFishBtn = document.createElement('button');
      elements.autoFishBtn.id = 'auto-fish-btn';
      elements.autoFishBtn.className = 'pixel-btn';
      elements.autoFishBtn.style.cssText = 'font-size: 1.2em; padding: 1em 2.5em; background: #8e44ad;';
      elements.autoFishBtn.textContent = 'Auto Fish';
      elements.autoFishBtn.addEventListener('click', toggleAutoFish);
      container.appendChild(elements.autoFishBtn);
    }
  }
}

function updateIndexTab() {
  const container = document.getElementById('index-list');
  if (!container) return;
  
  const searchInput = document.getElementById('index-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  
  if (Object.keys(gameState.fishIndex).length === 0) {
    container.innerHTML = `
      <div class="inventory-search" style="margin-bottom: 1em; display: flex; gap: 0.5em; justify-content: center;">
        <input type="text" id="index-search" placeholder="Search fish..." style="padding: 0.5em 1em; font-family: 'Press Start 2P', Arial, sans-serif; font-size: 0.85em; background: #181c24; color: #fff; border: 2px solid #00bcd4; border-radius: 4px; outline: none; width: 300px;">
        <button id="index-search-btn" class="pixel-btn" style="padding: 0.5em 1.2em; font-size: 0.85em;">Search</button>
        <button id="index-reset-btn" class="pixel-btn" style="padding: 0.5em 1.2em; font-size: 0.85em; background: #23283a; border-color: #666; color: #999;">Reset</button>
      </div>
      <div class="inventory-filters" style="display: flex; flex-wrap: wrap; gap: 1em; justify-content: center; margin-bottom: 1em; padding: 0.5em; background: #1d2232; border-radius: 4px;">
        <label class="material-checkbox">
          <input type="checkbox" class="index-rarity-filter" data-rarity="Common">
          <span class="checkmark"></span>
          <span style="color: #b0c4b1;">Common</span>
        </label>
        <label class="material-checkbox">
          <input type="checkbox" class="index-rarity-filter" data-rarity="Rare">
          <span class="checkmark"></span>
          <span style="color: #4299e1;">Rare</span>
        </label>
        <label class="material-checkbox">
          <input type="checkbox" class="index-rarity-filter" data-rarity="Unique">
          <span class="checkmark"></span>
          <span style="color: #8e44ad;">Unique</span>
        </label>
        <label class="material-checkbox">
          <input type="checkbox" class="index-rarity-filter" data-rarity="Epic">
          <span class="checkmark"></span>
          <span style="color: #e67e22;">Epic</span>
        </label>
        <label class="material-checkbox">
          <input type="checkbox" class="index-rarity-filter" data-rarity="Legendary">
          <span class="checkmark"></span>
          <span style="color: #ffd700;">Legendary</span>
        </label>
        <label class="material-checkbox">
          <input type="checkbox" class="index-rarity-filter" data-rarity="Mythical">
          <span class="checkmark"></span>
          <span style="color: #e84393;">Mythical</span>
        </label>
        <label class="material-checkbox">
          <input type="checkbox" class="index-rarity-filter" data-rarity="Secret">
          <span class="checkmark"></span>
          <span style="color: #00bcd4; text-shadow: 0 0 8px #00bcd4, 0 0 12px #00bcd4;">Secret</span>
        </label>
        <label class="material-checkbox">
          <input type="checkbox" id="index-shiny-filter">
          <span class="checkmark"></span>
          <span class="shiny-glow">Shiny</span>
        </label>
      </div>
      <div style="padding: 2em; text-align: center; color: #aaa;">No fish collected yet!</div>
    `;
    
    const newSearchBtn = document.getElementById('index-search-btn');
    const newResetBtn = document.getElementById('index-reset-btn');
    const newSearchInput = document.getElementById('index-search');
    
    if (newSearchBtn && newSearchInput) {
      newSearchBtn.addEventListener('click', () => updateIndexTab());
      newSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') updateIndexTab();
      });
    }
    
    if (newResetBtn) {
      newResetBtn.addEventListener('click', () => {
        if (newSearchInput) newSearchInput.value = '';
        document.querySelectorAll('.index-rarity-filter').forEach(f => f.checked = false);
        const shinyFilter = document.getElementById('index-shiny-filter');
        if (shinyFilter) shinyFilter.checked = false;
        updateIndexTab();
      });
    }
    return;
  }
  
  const activeRarities = Array.from(document.querySelectorAll('.index-rarity-filter:checked')).map(cb => cb.dataset.rarity);
  const showShinyOnly = document.getElementById('index-shiny-filter')?.checked || false;
  
  const filtered = Object.entries(gameState.fishIndex).filter(([name, data]) => {
    const isShiny = name.includes('(shiny)');
    
    if (searchTerm && !name.toLowerCase().includes(searchTerm)) {
      return false;
    }
    
    if (showShinyOnly && !isShiny) {
      return false;
    }
    
    if (activeRarities.length > 0 && !activeRarities.includes(data.rarity.name)) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    const rarityA = fishRarities.findIndex(r => r.name === a[1].rarity.name);
    const rarityB = fishRarities.findIndex(r => r.name === b[1].rarity.name);
    return rarityB - rarityA;
  });
  
  container.innerHTML = `
    <div class="inventory-search" style="margin-bottom: 1em; display: flex; gap: 0.5em; justify-content: center;">
      <input type="text" id="index-search" placeholder="Search fish..." value="${searchTerm}" style="padding: 0.5em 1em; font-family: 'Press Start 2P', Arial, sans-serif; font-size: 0.85em; background: #181c24; color: #fff; border: 2px solid #00bcd4; border-radius: 4px; outline: none; width: 300px;">
      <button id="index-search-btn" class="pixel-btn" style="padding: 0.5em 1.2em; font-size: 0.85em;">Search</button>
      <button id="index-reset-btn" class="pixel-btn" style="padding: 0.5em 1.2em; font-size: 0.85em; background: #23283a; border-color: #666; color: #999;">Reset</button>
    </div>
    <div class="inventory-filters" style="display: flex; flex-wrap: wrap; gap: 1em; justify-content: center; margin-bottom: 1em; padding: 0.5em; background: #1d2232; border-radius: 4px;">
      <label class="material-checkbox">
        <input type="checkbox" class="index-rarity-filter" data-rarity="Common" ${activeRarities.includes('Common') ? 'checked' : ''}>
        <span class="checkmark"></span>
        <span style="color: #b0c4b1;">Common</span>
      </label>
      <label class="material-checkbox">
        <input type="checkbox" class="index-rarity-filter" data-rarity="Rare" ${activeRarities.includes('Rare') ? 'checked' : ''}>
        <span class="checkmark"></span>
        <span style="color: #4299e1;">Rare</span>
      </label>
      <label class="material-checkbox">
        <input type="checkbox" class="index-rarity-filter" data-rarity="Unique" ${activeRarities.includes('Unique') ? 'checked' : ''}>
        <span class="checkmark"></span>
        <span style="color: #8e44ad;">Unique</span>
      </label>
      <label class="material-checkbox">
        <input type="checkbox" class="index-rarity-filter" data-rarity="Epic" ${activeRarities.includes('Epic') ? 'checked' : ''}>
        <span class="checkmark"></span>
        <span style="color: #e67e22;">Epic</span>
      </label>
      <label class="material-checkbox">
        <input type="checkbox" class="index-rarity-filter" data-rarity="Legendary" ${activeRarities.includes('Legendary') ? 'checked' : ''}>
        <span class="checkmark"></span>
        <span style="color: #ffd700;">Legendary</span>
      </label>
      <label class="material-checkbox">
        <input type="checkbox" class="index-rarity-filter" data-rarity="Mythical" ${activeRarities.includes('Mythical') ? 'checked' : ''}>
        <span class="checkmark"></span>
        <span style="color: #e84393;">Mythical</span>
      </label>
      <label class="material-checkbox">
        <input type="checkbox" class="index-rarity-filter" data-rarity="Secret" ${activeRarities.includes('Secret') ? 'checked' : ''}>
        <span class="checkmark"></span>
        <span style="color: #00bcd4; text-shadow: 0 0 8px #00bcd4, 0 0 12px #00bcd4;">Secret</span>
      </label>
      <label class="material-checkbox">
        <input type="checkbox" id="index-shiny-filter" ${showShinyOnly ? 'checked' : ''}>
        <span class="checkmark"></span>
        <span class="shiny-glow">Shiny</span>
      </label>
    </div>
    <div id="index-results" style="width: 100%; height: 550px; overflow-y: auto; padding-right: 10px;" class="style-7"></div>
  `;
  
  const resultsDiv = document.getElementById('index-results');
  
  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<div style="padding: 2em; text-align: center; color: #aaa;">No matching fish found.</div>';
  } else {
    filtered.forEach(([name, data]) => {
      const isShiny = name.includes('(shiny)');
      const cleanName = name.replace(' (shiny)', '');
      
      const div = document.createElement('div');
      div.style.cssText = `
        background: rgba(0,0,0,0.3);
        padding: 1em;
        margin-bottom: 0.8em;
        border-radius: 8px;
        border: 2px solid ${data.rarity.color};
        ${isShiny ? 'box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);' : ''}
        display: flex;
        align-items: center;
        gap: 1em;
      `;
      
      div.innerHTML = `
        <img src="${getFishImage(cleanName)}" alt="${cleanName}" 
          style="width: 48px; height: 48px; image-rendering: pixelated;">
        <div style="flex: 1;">
          <div style="color: ${data.rarity.color}; font-weight: bold; margin-bottom: 0.3em;">
            ${isShiny ? '✨ ' : ''}${cleanName}
          </div>
          <div style="color: #aaa; font-size: 0.85em;">
            Rarity: ${data.rarity.name} | Caught: ${data.count} times
          </div>
        </div>
      `;
      
      resultsDiv.appendChild(div);
    });
  }
  
  const newSearchBtn = document.getElementById('index-search-btn');
  const newResetBtn = document.getElementById('index-reset-btn');
  const newSearchInput = document.getElementById('index-search');
  
  if (newSearchBtn && newSearchInput) {
    newSearchBtn.addEventListener('click', () => updateIndexTab());
    newSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') updateIndexTab();
    });
  }
  
  if (newResetBtn) {
    newResetBtn.addEventListener('click', () => {
      if (newSearchInput) newSearchInput.value = '';
      document.querySelectorAll('.index-rarity-filter').forEach(f => f.checked = false);
      const shinyFilter = document.getElementById('index-shiny-filter');
      if (shinyFilter) shinyFilter.checked = false;
      updateIndexTab();
    });
  }
  
  document.querySelectorAll('.index-rarity-filter').forEach(filter => {
    filter.addEventListener('change', () => updateIndexTab());
  });
  
  const shinyFilter = document.getElementById('index-shiny-filter');
  if (shinyFilter) {
    shinyFilter.addEventListener('change', () => updateIndexTab());
  }
}

function updateUpgradesTab() {
  const container = document.getElementById('upgrade-list');
  if (!container) return;
  
  const upgrades = [
    { 
      name: 'Auto Fish', 
      desc: 'Automatically catches fish every 3 seconds',
      cost: 50000, 
      level: gameState.autoFishUnlocked ? 1 : 0, 
      max: 1,
      buy: () => {
        gameState.rupees -= 50000;
        gameState.totalSpent += 50000;
        gameState.autoFishUnlocked = true;
        updateAllUI();
        saveState();
        checkAchievements();
      }
    },
    {
      name: `Reel Speed`,
      desc: `Reduces fishing time by ${[32, 64, 100][gameState.reelSpeedLevel] || 32}%`,
      cost: [10000, 25000, 50000][gameState.reelSpeedLevel],
      level: gameState.reelSpeedLevel,
      max: 3,
      buy: () => {
        const cost = [10000, 25000, 50000][gameState.reelSpeedLevel];
        gameState.rupees -= cost;
        gameState.totalSpent += cost;
        gameState.reelSpeedLevel++;
        updateAllUI();
        saveState();
        checkAchievements();
      }
    },
    {
      name: `Luck`,
      desc: `Increases rare fish chance by ${((gameState.luckLevel + 1) * 3.33).toFixed(1)}%`,
      cost: [15000, 30000, 75000][gameState.luckLevel],
      level: gameState.luckLevel,
      max: 3,
      buy: () => {
        const cost = [15000, 30000, 75000][gameState.luckLevel];
        gameState.rupees -= cost;
        gameState.totalSpent += cost;
        gameState.luckLevel++;
        updateAllUI();
        saveState();
        checkAchievements();
      }
    }
  ];
  
  container.innerHTML = '<h3 style="margin-bottom: 1em;">Upgrades</h3>';
  const grid = document.createElement('div');
  grid.style.cssText = 'display: grid; gap: 1em;';
  
  upgrades.forEach(up => {
    const canAfford = gameState.rupees >= up.cost;
    const isMaxed = up.level >= up.max;
    
    const div = document.createElement('div');
    div.style.cssText = `
      background: rgba(0,0,0,0.3);
      padding: 1.5em;
      border-radius: 8px;
      border: 2px solid ${isMaxed ? '#23d160' : '#4a90a4'};
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1em;
    `;
    
    const romanNumerals = ['I', 'II', 'III'];
    const displayName = up.max > 1 && up.level < up.max ? `${up.name} ${romanNumerals[up.level]}` : up.name;
    
  div.innerHTML = `
    <div>
      <div style="font-size: 1.2em; margin-bottom: 0.3em;">${displayName}</div>
      <div style="color: #aaa; font-size: 0.85em; margin-bottom: 0.5em;">${up.desc}</div>
      <div style="color: ${isMaxed ? '#23d160' : '#ffd700'}; font-size: 0.9em; display:flex; align-items:center; gap:4px;">
        ${isMaxed
          ? 'MAX LEVEL'
          : `Cost: ${formatNumber(up.cost)} <img src="assets/gem.png" alt="Gem" style="height:14px; vertical-align:middle;">`}
      </div>
    </div>
    <button class="pixel-btn" ${isMaxed || !canAfford ? 'disabled' : ''} 
      style="padding: 0.8em 1.5em; background: ${isMaxed ? '#666' : canAfford ? '#23d160' : '#666'};">
      ${isMaxed ? 'Maxed' : canAfford ? 'Buy' : 'Locked'}
    </button>
  `;
    
    const btn = div.querySelector('button');
    if (!isMaxed && canAfford) {
      btn.addEventListener('click', up.buy);
    }
    
    grid.appendChild(div);
  });
  
  container.appendChild(grid);
}

function updateInventoryTab() {
  const container = document.getElementById('inventory-list');
  if (!container) return;
  
  const entries = Object.entries(gameState.inventory)
    .filter(([_, fish]) => fish.count > 0)
    .sort((a, b) => {
      const rarityA = fishRarities.findIndex(r => r.name === a[1].rarity.name);
      const rarityB = fishRarities.findIndex(r => r.name === b[1].rarity.name);
      return rarityB - rarityA;
    });
  
  if (entries.length === 0) {
    container.innerHTML = '<div style="padding: 2em; text-align: center; color: #aaa;">No fish yet!</div>';
    return;
  }
  
  container.innerHTML = '';
  
  entries.forEach(([key, fish]) => {
    const isShiny = fish.fishName.includes('(shiny)');
    const isTriforce = fish.rarity.name === 'Triforce';
    const cleanName = fish.fishName.replace(' (shiny)', '');
    
    const div = document.createElement('div');
    div.style.cssText = `
      background: rgba(0,0,0,0.3);
      padding: 1em;
      margin-bottom: 0.8em;
      border-radius: 8px;
      border: 2px solid ${fish.rarity.color};
      ${isShiny ? 'box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);' : ''}
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1em;
      flex-wrap: wrap;
    `;
    
    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1em;">
        <img src="${getFishImage(cleanName)}" alt="${cleanName}" 
          style="width: 48px; height: 48px; image-rendering: pixelated;">
        <div>
          <div style="color: ${fish.rarity.color}; font-weight: bold;">
            ${isShiny ? '✨ ' : ''}${cleanName}
          </div>
          <div style="color: #aaa; font-size: 0.9em;">Count: ${fish.count}/50</div>
        </div>
      </div>
      <div style="display: flex; gap: 0.5em;">
        ${!isShiny && !isTriforce && fish.count >= 10 ? `
          <button class="pixel-btn shiny-craft-btn" data-key="${key}" 
            style="padding: 0.5em 1em; background: #8e44ad;">
            Make Shiny
          </button>
        ` : ''}
      </div>
    `;
    
    container.appendChild(div);
  });
  
  document.querySelectorAll('.shiny-craft-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const fish = gameState.inventory[key];
      
      if (!fish || fish.count < 10) return; // Prevent exploit
      
      gameState.inventory[key].count -= 10;
      if (gameState.inventory[key].count === 0) {
        delete gameState.inventory[key];
      }
      
      const shinyKey = `${fish.rarity.name}|${fish.fishName} (shiny)`;
      if (!gameState.inventory[shinyKey]) {
        gameState.inventory[shinyKey] = {
          fishName: fish.fishName + ' (shiny)',
          rarity: fish.rarity,
          count: 1
        };
      } else {
        gameState.inventory[shinyKey].count++;
        if (gameState.inventory[shinyKey].count > 50) {
          gameState.inventory[shinyKey].count = 50;
        }
      }
      
      // Update fishIndex for shiny
      const shinyName = fish.fishName + ' (shiny)';
      if (!gameState.fishIndex[shinyName]) {
        gameState.fishIndex[shinyName] = { rarity: fish.rarity, count: 0, unlocked: true };
      }
      gameState.fishIndex[shinyName].count++;
      
      checkAchievements();
      updateAllUI();
      saveState();
    });
  });
}

function updateTriforceTab() {
  const container = document.getElementById('relics-list');
  if (!container) return;
  
  container.innerHTML = '<h3 style="margin-bottom: 1em;">Triforce Shards</h3>';
  
  const grid = document.createElement('div');
  grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1em;';
  
  fishList.Triforce.forEach(shard => {
    const collected = !!gameState.collectedShards[shard.id];
    
    const div = document.createElement('div');
    div.style.cssText = `
      padding: 1em;
      border: 2px solid ${collected ? '#ffd700' : '#666'};
      border-radius: 10px;
      background: rgba(0,0,0,0.3);
      text-align: center;
      transition: all 0.3s;
    `;
    
    div.innerHTML = `
      <img src="assets/Triforce_Shard_${shard.id}.png" alt="Shard ${shard.id}"
        style="width: 64px; height: 64px; image-rendering: pixelated; 
        ${collected ? '' : 'filter: grayscale(100%) brightness(0.5);'}">
      <div style="margin-top: 0.5em; font-size: 0.8em; color: ${collected ? '#ffd700' : '#aaa'};">${shard.name}</div>
      <div style="margin-top: 0.3em; color: ${collected ? '#ffd700' : '#666'}; font-size: 0.7em;">
        ${shard.type === 'luck' ? `+${shard.value * 100}% Luck` : `+${shard.value} Reel Speed`}
      </div>
    `;
    
    grid.appendChild(div);
  });
  
  container.appendChild(grid);
}

function updateAchievementsTab() {
  const container = document.getElementById('mastery-list');
  if (!container) return;
  
  container.innerHTML = '<h3 style="margin-bottom: 1em;">Achievements</h3>';
  
  Object.keys(ACHIEVEMENTS).forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.style.marginBottom = '2em';
   
    
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; gap: 0.8em;';
    
    Object.values(ACHIEVEMENTS[category]).forEach(ach => {
      const div = document.createElement('div');
      div.style.cssText = `
        background: rgba(0,0,0,0.3);
        padding: 1em;
        border-radius: 8px;
        border: 2px solid ${ach.unlocked ? '#ffd700' : '#666'};
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1em;
        ${ach.unlocked ? 'box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);' : ''}
      `;
      
      div.innerHTML = `
        <div>
          <div style="font-weight: bold; margin-bottom: 0.3em;">
            ${ach.unlocked ? '🏆 ' : '🔒 '}${ach.name}
          </div>
          <div style="color: #aaa; font-size: 0.85em;">${ach.desc}</div>
        </div>
        <div style="color: ${ach.unlocked ? '#ffd700' : '#666'}; font-weight: bold; white-space: nowrap; display: flex; align-items: center; gap: 0.3em;">
          <img src="assets/gem.png" alt="Mon" style="width: 20px; height: 20px; image-rendering: pixelated;">
          ${ach.reward}
        </div>
      `;
      
      grid.appendChild(div);
    });
    
    categoryDiv.appendChild(grid);
    container.appendChild(categoryDiv);
  });
}

function updateChestsTab() {
  const container = document.getElementById('crates-list');
  if (!container) return;
  
  const chests = [
    { name: 'Small Chest', cost: 50, img: 'smallchest.png', type: 'small', desc: '100-600 Rupees' },
    { name: 'Big Chest', cost: 100, img: 'bigchest.png', type: 'big', desc: '10-30 Mon or 500-1500 Rupees' },
    { name: 'Boss Chest', cost: 250, img: 'bosschest.png', type: 'boss', desc: 'Triforce Shard or 30-80 Mon' }
  ];
  
  container.innerHTML = '<h3 style="margin-bottom: 1em;">Treasure Chests</h3>';
  
  chests.forEach(chest => {
    const canAfford = gameState.mon >= chest.cost;
    
    const div = document.createElement('div');
    div.style.cssText = `
      background: rgba(0,0,0,0.3);
      padding: 1.5em;
      border-radius: 8px;
      border: 2px solid ${canAfford ? '#8e44ad' : '#666'};
      margin-bottom: 1em;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1em;
      flex-wrap: wrap;
    `;
    
    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1em;">
        <img src="assets/${chest.img}" alt="${chest.name}"
          style="width: 64px; height: 64px; image-rendering: pixelated;">
        <div>
          <div style="font-size: 1.2em; margin-bottom: 0.3em;">${chest.name}</div>
          <div style="color: #aaa; font-size: 0.85em; margin-bottom: 0.5em;">Rewards: ${chest.desc}</div>
          <div style="color: #ffd700; font-size: 0.9em; display: flex; align-items: center; gap: 0.3em;">
            Cost: <img src="assets/gem.png" alt="Mon" style="width: 16px; height: 16px; image-rendering: pixelated;"> ${chest.cost}
          </div>
        </div>
      </div>
      <button class="pixel-btn open-chest-btn" data-type="${chest.type}" ${canAfford ? '' : 'disabled'}
        style="padding: 0.8em 1.5em; background: ${canAfford ? '#8e44ad' : '#666'};">
        ${canAfford ? 'Open' : 'Locked'}
      </button>
    `;
    
    container.appendChild(div);
  });
  
  document.querySelectorAll('.open-chest-btn').forEach(btn => {
    btn.addEventListener('click', () => openChest(btn.dataset.type));
  });
}

function openChest(type) {
  const costs = { small: 50, big: 100, boss: 250 };
  const cost = costs[type];
  
  if (gameState.mon < cost) return;
  
  gameState.mon -= cost;
  gameState.monSpent += cost;
  
  let reward = '';
  const rand = Math.random();
  
  if (type === 'small') {
    const rupees = Math.floor(Math.random() * 501) + 100;
    gameState.rupees += rupees;
    reward = `${rupees} Rupees`;
  } else if (type === 'big') {
    if (rand < 0.3) {
      const luckBoost = (Math.floor(Math.random() * 5) + 1) / 100;
      gameState.temporaryBoosts.luck += luckBoost;
      reward = `+${(luckBoost * 100).toFixed(0)}% Luck Boost`;
    } else if (rand < 0.5) {
      const mon = Math.floor(Math.random() * 21) + 10;
      gameState.mon += mon;
      reward = `${mon} Mon`;
    } else {
      const rupees = Math.floor(Math.random() * 1001) + 500;
      gameState.rupees += rupees;
      reward = `${rupees} Rupees`;
    }
  } else if (type === 'boss') {
    if (rand < 0.2) {
      const uncollected = fishList.Triforce.filter(s => !gameState.collectedShards[s.id]);
      if (uncollected.length > 0) {
        const shard = uncollected[Math.floor(Math.random() * uncollected.length)];
        gameState.collectedShards[shard.id] = shard;
        reward = `${shard.name}!`;
      } else {
        const mon = Math.floor(Math.random() * 51) + 50;
        gameState.mon += mon;
        reward = `${mon} Mon`;
      }
    } else if (rand < 0.4) {
      const speedBoost = Math.floor(Math.random() * 6) + 5;
      gameState.temporaryBoosts.reelSpeed += speedBoost;
      reward = `+${speedBoost} Reel Speed Boost`;
    } else {
      const mon = Math.floor(Math.random() * 51) + 30;
      gameState.mon += mon;
      reward = `${mon} Mon`;
    }
  }
  
  showNotification(`Chest opened! Received: ${reward}`);
  checkAchievements();
  updateAllUI();
  saveState();
}

function updateShopTab() {
  const container = document.getElementById('shop-list');
  if (!container) return;
  
  const sellable = Object.entries(gameState.inventory)
    .filter(([_, fish]) => fish.count > 0 && fish.rarity.name !== 'Triforce')
    .sort((a, b) => {
      const rarityA = fishRarities.findIndex(r => r.name === a[1].rarity.name);
      const rarityB = fishRarities.findIndex(r => r.name === b[1].rarity.name);
      return rarityB - rarityA;
    });
  
  if (sellable.length === 0) {
    container.innerHTML = '<div style="padding: 2em; text-align: center; color: #aaa;">No fish to sell!</div>';
    return;
  }
  
  let totalRupees = 0;
  let totalMon = 0;
  
  sellable.forEach(([_, fish]) => {
    const rupees = fish.rarity.baseCurrency || 0;
    const mon = fish.rarity.monValue || 0;
    totalRupees += rupees * fish.count;
    totalMon += mon * fish.count;
  });
  
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em; flex-wrap: wrap; gap: 0.5em;">
      <h3>Fish Shop</h3>
      <div style="display: flex; gap: 0.5em;">
        <button id="sell-all-rupees-btn" class="pixel-btn" style="padding: 0.8em 1.5em; background: #4a90a4; display: flex; align-items: center; gap: 0.3em;">
          <img src="assets/coin.png" style="width: 20px; height: 20px; image-rendering: pixelated;">
          Sell All (${formatNumber(totalRupees)})
        </button>
        <button id="sell-all-mon-btn" class="pixel-btn" style="padding: 0.8em 1.5em; background: #8e44ad; display: flex; align-items: center; gap: 0.3em;">
          <img src="assets/gem.png" style="width: 20px; height: 20px; image-rendering: pixelated;">
          Sell All (${formatNumber(totalMon)})
        </button>
      </div>
    </div>
  `;
  
  const listDiv = document.createElement('div');
  
  sellable.forEach(([key, fish]) => {
    const div = document.createElement('div');
    div.style.cssText = `
      background: rgba(0,0,0,0.3);
      padding: 1em;
      margin-bottom: 0.8em;
      border-radius: 8px;
      border: 2px solid ${fish.rarity.color};
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1em;
      flex-wrap: wrap;
    `;
    
    div.innerHTML = `
      <div>
        <div style="color: ${fish.rarity.color}; font-weight: bold; margin-bottom: 0.3em;">
          ${fish.fishName}
        </div>
        <div style="color: #aaa; font-size: 0.9em;">Count: ${fish.count}</div>
      </div>
      <div style="display: flex; gap: 0.5em;">
        <button class="pixel-btn sell-rupee-btn" data-key="${key}"
          style="padding: 0.5em 1em; background: #4a90a4; display: flex; align-items: center; gap: 0.3em;">
          <img src="assets/coin.png" style="width: 16px; height: 16px; image-rendering: pixelated;">
          ${fish.rarity.baseCurrency}
        </button>
        <button class="pixel-btn sell-mon-btn" data-key="${key}"
          style="padding: 0.5em 1em; background: #8e44ad; display: flex; align-items: center; gap: 0.3em;">
          <img src="assets/gem.png" style="width: 16px; height: 16px; image-rendering: pixelated;">
          ${fish.rarity.monValue}
        </button>
      </div>
    `;
    
    listDiv.appendChild(div);
  });
  
  container.appendChild(listDiv);
  
  document.getElementById('sell-all-rupees-btn')?.addEventListener('click', () => sellAll('rupees'));
  document.getElementById('sell-all-mon-btn')?.addEventListener('click', () => sellAll('mon'));
  
  document.querySelectorAll('.sell-rupee-btn').forEach(btn => {
    btn.addEventListener('click', () => sellFish(btn.dataset.key, false));
  });
  
  document.querySelectorAll('.sell-mon-btn').forEach(btn => {
    btn.addEventListener('click', () => sellFish(btn.dataset.key, true));
  });
}

function sellFish(key, forMon, sellAll = false) {
  const fish = gameState.inventory[key];
  if (!fish || fish.count === 0) return;

  const amountToSell = sellAll ? fish.count : 1;

  if (forMon) {
    const value = fish.rarity.monValue * amountToSell;
    if (value > 0) gameState.mon += value;
  } else {
    const value = fish.rarity.baseCurrency * amountToSell;
    if (value > 0) gameState.rupees += value;
  }

  fish.count -= amountToSell;
  if (fish.count <= 0) {
    delete gameState.inventory[key];
  }

  updateAllUI();
  saveState();
}

function sellAll(currency) {
  let total = 0;

  Object.entries(gameState.inventory).forEach(([key, fish]) => {
    if (fish.rarity && fish.rarity.name !== 'Triforce' && fish.count > 0) {
      if (currency === 'rupees') {
        total += (fish.rarity.baseCurrency || 0) * fish.count;
      } else {
        total += (fish.rarity.monValue || 0) * fish.count;
      }
      delete gameState.inventory[key];
    }
  });

  if (currency === 'rupees') {
    gameState.rupees += total;
    showNotification(`Sold all fish for ${formatNumber(total)} Rupees!`);
  } else {
    gameState.mon += total;
    showNotification(`Sold all fish for ${formatNumber(total)} Mon!`);
  }

  updateAllUI();
  saveState();
}

// TAB SWITCHING
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    
    if (btn.dataset.tab !== 'fishing') {
      stopAutoFish();
    }
    
    if (elements.fishBtn) {
      elements.fishBtn.style.display = btn.dataset.tab === 'fishing' ? '' : 'none';
    }
    if (elements.autoFishBtn) {
      elements.autoFishBtn.style.display = btn.dataset.tab === 'fishing' && gameState.autoFishUnlocked ? '' : 'none';
    }
  });
});

// POTIONS
window.buyPotion = function(type) {
  const cost = type === 'luck' ? 3000 : 5000;
  
  if (gameState.rupees < cost) {
    showNotification('Not enough rupees!');
    return;
  }
  
  // Prevent buying if already active
  if (Date.now() < gameState.activePotions[type]) {
    showNotification('Potion already active!');
    return;
  }
  
  gameState.rupees -= cost;
  gameState.totalSpent += cost;
  gameState.activePotions[type] = Date.now() + 5 * 60 * 1000;
  
  showNotification(`${type === 'luck' ? 'Luck' : 'Reel Speed'} Potion activated!`);
  updateAllUI();
  updatePotionsTab();
  saveState();
  checkAchievements();
}

function updatePotionsTab() {
  const container = document.getElementById('potions');
  if (!container) return;
  
  const potions = [
    { type: 'luck', name: 'Luck Potion', cost: 3000, desc: '+10% Luck for 5 minutes' },
    { type: 'reel', name: 'Reel Speed Potion', cost: 5000, desc: '+20 Reel Speed for 5 minutes' }
  ];
  
  container.innerHTML = '<h2>Potions</h2>';
  
  potions.forEach(potion => {
    const canAfford = gameState.rupees >= potion.cost;
    const isActive = Date.now() < gameState.activePotions[potion.type];
    
    const div = document.createElement('div');
    div.style.cssText = `
      background: rgba(0,0,0,0.3);
      padding: 1.5em;
      border-radius: 8px;
      border: 2px solid ${isActive ? '#23d160' : canAfford ? '#8e44ad' : '#666'};
      margin-bottom: 1em;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1em;
      flex-wrap: wrap;
    `;
    
    let timeRemaining = '';
    if (isActive) {
      const sec = Math.ceil((gameState.activePotions[potion.type] - Date.now()) / 1000);
      timeRemaining = `<div style="color: #23d160; font-size: 0.85em; margin-top: 0.3em;">Active: ${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}</div>`;
    }
    
    div.innerHTML = `
      <div>
        <div style="font-size: 1.2em; margin-bottom: 0.3em;">${potion.name}</div>
        <div style="color: #aaa; font-size: 0.85em; margin-bottom: 0.5em;">${potion.desc}</div>
        <div style="color: #ffd700; font-size: 0.9em; display: flex; align-items: center; gap: 0.3em;">
          Cost: <img src="assets/coin.png" style="width: 16px; height: 16px; image-rendering: pixelated;"> ${formatNumber(potion.cost)}
        </div>
        ${timeRemaining}
      </div>
      <button class="pixel-btn" ${!canAfford || isActive ? 'disabled' : ''} 
        onclick="buyPotion('${potion.type}')"
        style="padding: 0.8em 1.5em; background: ${isActive ? '#666' : canAfford ? '#8e44ad' : '#666'};">
        ${isActive ? 'Active' : canAfford ? 'Buy' : 'Locked'}
      </button>
    `;
    
    container.appendChild(div);
  });
}

setInterval(() => {
  updatePotionsTab();
}, 1000);

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  
  let fishBtnContainer = document.getElementById('fish-btn-container');
  if (!fishBtnContainer) {
    fishBtnContainer = document.createElement('div');
    fishBtnContainer.id = 'fish-btn-container';
    fishBtnContainer.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 1.5em;
      z-index: 1000;
    `;
    document.body.appendChild(fishBtnContainer);
  }
  
  if (!elements.fishBtn) {
    elements.fishBtn = document.createElement('button');
    elements.fishBtn.id = 'fish-btn';
    elements.fishBtn.className = 'pixel-btn';
    elements.fishBtn.style.cssText = 'font-size: 1.5em; padding: 1.2em 3em; background: #222736; border: 4px solid #181c24;';
    elements.fishBtn.textContent = 'Fish!';
    elements.fishBtn.addEventListener('click', startFishing);
    fishBtnContainer.appendChild(elements.fishBtn);
  }
  
  if (gameState.autoFishUnlocked && !elements.autoFishBtn) {
    elements.autoFishBtn = document.createElement('button');
    elements.autoFishBtn.id = 'auto-fish-btn';
    elements.autoFishBtn.className = 'pixel-btn';
    elements.autoFishBtn.style.cssText = 'font-size: 1.5em; padding: 1.2em 3em; background: #8e44ad;';
    elements.autoFishBtn.textContent = 'Auto Fish';
    elements.autoFishBtn.addEventListener('click', toggleAutoFish);
    fishBtnContainer.appendChild(elements.autoFishBtn);
  }
  
  const fishCaughtDiv = document.getElementById('fish-caught');
  if (fishCaughtDiv) fishCaughtDiv.style.display = 'none';
  
  setupSettings();
  updateAllUI();
  updatePotionsTab();
  checkAchievements();
});

function setupSettings() {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  
  if (settingsBtn && settingsPanel) {
    settingsBtn.addEventListener('click', () => {
      settingsPanel.style.display = 'block';
    });
  }
  
  if (closeSettingsBtn && settingsPanel) {
    closeSettingsBtn.addEventListener('click', () => {
      settingsPanel.style.display = 'none';
    });
  }
  
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Complete Reset';
  resetBtn.className = 'pixel-btn';
  resetBtn.style.cssText = 'background: #e74c3c; width: 100%; margin-top: 1em; padding: 0.8em;';
  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure? This will delete ALL progress!')) {
      localStorage.removeItem('zeldaFishingV2');
      location.reload();
    }
  });
  
  if (settingsPanel) {
    settingsPanel.appendChild(resetBtn);
  }
}

// === Keyboard Shortcut ===
// Allow pressing Spacebar to trigger the Fish! button
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault(); // Prevent page scrolling
    const fishBtn = document.getElementById('fish-btn');
    const activeTab = document.querySelector('.tab-content.active');
    // Only allow fishing if on fishing tab and button is enabled
    if (fishBtn && !fishBtn.disabled && activeTab && activeTab.id === 'fishing') {
      fishBtn.click();
    }
  }
});
