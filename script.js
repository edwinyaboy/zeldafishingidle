// Tab switching logic
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    // Show or hide the Fish! button based on tab
    const fishBtn = document.getElementById('fish-btn');
    if (fishBtn) {
      if (btn.dataset.tab === 'fishing') {
        fishBtn.style.display = '';
      } else {
        fishBtn.style.display = 'none';
      }
    }
  });
});
// On page load, ensure Fish! button is only visible on fishing tab
window.addEventListener('DOMContentLoaded', () => {
  const fishBtn = document.getElementById('fish-btn');
  if (fishBtn) {
    const fishingTab = document.querySelector('.tab-btn.active');
    if (fishingTab && fishingTab.dataset.tab !== 'fishing') {
      fishBtn.style.display = 'none';
    }
  }
});

// Idle fishing mechanic
let fishCount = 0;
let currencyCount = 0;
let gemCount = 0;
let lifetimeFishCount = 0;
const fishCountSpan = document.getElementById('fish-count');
const fishingStatus = document.getElementById('fishing-status');
const coinCountSpan = document.getElementById('coin-count');
const gemCountSpan = document.getElementById('gem-count');
const lifetimeFishCountSpan = document.getElementById('lifetime-fish-count');
const luckPercentageSpan = document.getElementById('luck-percentage');
const shinyPullCountSpan = document.getElementById('shiny-pull-count');

let autoFishUnlocked = false;
let pullsUntilShiny = 500;

// Reel Speed upgrade state
let reelSpeedLevel = 0;
const reelSpeedCosts = [5000, 10000, 15000, 20000, 25000];
const reelSpeedReductions = [0.2, 0.4, 0.6, 0.8, 1.15]; // 20%, 40%, 60%, 80%, 115% reduction

// Luck upgrade state
let luckLevel = 0;
const luckCosts = [7500, 15000, 22500, 30000, 37500];
const luckBonuses = [0.05, 0.10, 0.15, 0.20, 0.25]; // 5%, 10%, 15%, 20%, 25% bonus

// Track 10 most recent caught fish
let recentFish = [];

// Load saved state
function loadState() {
  const saved = JSON.parse(localStorage.getItem('fishingGameState') || '{}');
  if (typeof saved.currencyCount === 'number') currencyCount = saved.currencyCount;
  if (typeof saved.gemCount === 'number') gemCount = saved.gemCount;
  if (typeof saved.fishCount === 'number') fishCount = saved.fishCount;
  if (typeof saved.lifetimeFishCount === 'number') lifetimeFishCount = saved.lifetimeFishCount;
  if (typeof saved.inventory === 'object' && saved.inventory) {
    Object.assign(inventory, saved.inventory);
  }
  if (typeof saved.xp === 'number') xp = saved.xp;
  if (typeof saved.level === 'number') level = saved.level;
  if (typeof saved.autoFishUnlocked === 'boolean') autoFishUnlocked = saved.autoFishUnlocked;
  if (typeof saved.reelSpeedLevel === 'number') reelSpeedLevel = saved.reelSpeedLevel;
  if (typeof saved.luckLevel === 'number') luckLevel = saved.luckLevel;
  if (typeof saved.pullsUntilShiny === 'number') pullsUntilShiny = saved.pullsUntilShiny;
  updateXPBar();
  updateReelSpeedButtons();
  updateLuckButtons();
  updateShinyPullCounter();
  updateReelSpeedCounter();
  // Update UI for lifetime fish count
  if (lifetimeFishCountSpan) lifetimeFishCountSpan.textContent = lifetimeFishCount;
  // Update luck percentage display
  if (luckPercentageSpan) {
    const luckBonus = luckLevel > 0 ? luckBonuses[luckLevel - 1] * 100 : 0;
    luckPercentageSpan.textContent = luckBonus;
  }
}

// Save state
function saveState() {
  localStorage.setItem('fishingGameState', JSON.stringify({
    currencyCount, 
    gemCount, 
    fishCount, 
    lifetimeFishCount,
    inventory, 
    xp, 
    level, 
    autoFishUnlocked,
    reelSpeedLevel,
    luckLevel,
    pullsUntilShiny
  }));
}

// Import fish rarities and fish list
import { fishRarities, fishList } from './fishes.js';

function getRandomRarity() {
  let rand = Math.random();
  let acc = 0;
  
  // Apply luck bonus to rare fish chances
  const luckBonus = luckLevel > 0 ? luckBonuses[luckLevel - 1] : 0;
  
  for (const rarity of fishRarities) {
    // Apply luck bonus to non-common rarities
    let adjustedChance = rarity.name === 'Common' ? 
      rarity.chance * (1 - luckBonus) : 
      rarity.chance * (1 + luckBonus);
    
    acc += adjustedChance;
    if (rand < acc) return rarity;
  }
  return fishRarities[0]; // fallback to common
}

function getRandomFish(rarity) {
  const arr = fishList[rarity.name];
  return arr[Math.floor(Math.random() * arr.length)];
}

// ----------------------------
// TRIFORCE SHARD DISPLAY (Relics)
// ----------------------------

/**
 * Initialize Triforce shards
 */
export const triforceShards = [
  { id: 1, name: 'Shard 1', type: 'reelSpeed', value: 0.05, collected: false },
  { id: 2, name: 'Shard 2', type: 'luck', value: 0.05, collected: false },
  { id: 3, name: 'Shard 3', type: 'reelSpeed', value: 0.05, collected: false },
  { id: 4, name: 'Shard 4', type: 'luck', value: 0.05, collected: false },
  { id: 5, name: 'Shard 5', type: 'reelSpeed', value: 0.05, collected: false },
  { id: 6, name: 'Shard 6', type: 'luck', value: 0.05, collected: false },
  { id: 7, name: 'Shard 7', type: 'reelSpeed', value: 0.05, collected: false },
  { id: 8, name: 'Shard 8', type: 'luck', value: 0.05, collected: false }
];

/**
 * Update Relics UI
 */
export function updateRelicsUI() {
  const container = document.getElementById('relics-container');
  if (!container) return;

  container.innerHTML = ''; // clear current display

  triforceShards.forEach(shard => {
    const shardDiv = document.createElement('div');
    shardDiv.className = 'triforce-shard';
    shardDiv.textContent = shard.name;
    shardDiv.style.width = '80px';
    shardDiv.style.height = '80px';
    shardDiv.style.margin = '5px';
    shardDiv.style.display = 'inline-flex';
    shardDiv.style.alignItems = 'center';
    shardDiv.style.justifyContent = 'center';
    shardDiv.style.border = '2px solid gold';
    shardDiv.style.borderRadius = '10px';
    shardDiv.style.backgroundColor = shard.collected ? '#ffd700' : '#333';
    shardDiv.style.color = shard.collected ? '#000' : '#888';
    shardDiv.title = shard.collected ? `Collected: +${shard.value * 100}% ${shard.type}` : 'Not collected';
    container.appendChild(shardDiv);
  });
}

/**
 * Call this when a shard is caught
 */
export function collectShard(shardId) {
  const shard = triforceShards.find(s => s.id === shardId);
  if (!shard || shard.collected) return;

  shard.collected = true;
  updateRelicsUI();
}

// Inventory system
const inventory = {};

function updateInventoryDisplay(searchTerm = '') {
  const inventoryList = document.getElementById('inventory-list');
  if (!inventoryList) return;
  if (Object.keys(inventory).length === 0) {
    inventoryList.textContent = 'No items yet.';
    return;
  }

  // Get active filters
  const activeRarities = Array.from(document.querySelectorAll('.rarity-filter:checked')).map(cb => cb.dataset.rarity);
  const showShinyOnly = document.getElementById('shiny-filter').checked;

  // Create table
  let table = document.createElement('table');
  table.className = 'inventory-table';
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  // Header
  let thead = document.createElement('thead');
  let headerRow = document.createElement('tr');
  
  // Sort state
  const sortState = {
    column: localStorage.getItem('inventorySortColumn') || '',
    direction: localStorage.getItem('inventorySortDirection') || 'asc'
  };

  // Create sortable headers
  const headers = [
    { text: 'Fish Name', key: 'name' },
    { text: 'Rarity', key: 'rarity' },
    { text: 'Count', key: 'count' },
    { text: 'Make Shiny', key: 'shiny' }
  ];

  headers.forEach(header => {
    let th = document.createElement('th');
    if (header.key !== 'shiny') {
      th.style.cursor = 'pointer';
      th.style.position = 'relative';
      th.innerHTML = `
        ${header.text}
        <svg class="sort-icon" style="width: 16px; height: 16px; margin-left: 5px; vertical-align: middle; opacity: ${sortState.column === header.key ? '1' : '0.3'};" viewBox="0 0 490 490" fill="#ffffff">
          <g>
            <polygon points="85.877,154.014 85.877,428.309 131.706,428.309 131.706,154.014 180.497,221.213 217.584,194.27 108.792,44.46 0,194.27 37.087,221.213"></polygon>
            <polygon points="404.13,335.988 404.13,61.691 358.301,61.691 358.301,335.99 309.503,268.787 272.416,295.73 381.216,445.54 490,295.715 452.913,268.802"></polygon>
          </g>
        </svg>
      `;
      th.addEventListener('click', () => {
        if (sortState.column === header.key) {
          sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
          sortState.column = header.key;
          sortState.direction = 'asc';
        }
        localStorage.setItem('inventorySortColumn', sortState.column);
        localStorage.setItem('inventorySortDirection', sortState.direction);
        updateInventoryDisplay(searchTerm);
      });
    } else {
      th.textContent = header.text;
    }
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Body
  let tbody = document.createElement('tbody');
  let hasResults = false;
  
  // Convert inventory to array for sorting
  let inventoryArray = Object.entries(inventory).map(([fishKey, entry]) => ({
    key: fishKey,
    ...entry
  }));

  // Filter by search term and active filters
  inventoryArray = inventoryArray.filter(entry => {
    const isShiny = entry.fishName.endsWith(' (shiny)');
    
    // Apply search filter
    if (searchTerm && !entry.fishName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply shiny filter
    if (showShinyOnly && !isShiny) {
      return false;
    }
    
    // Apply rarity filters
    if (activeRarities.length > 0 && !activeRarities.includes(entry.rarity.name)) {
      return false;
    }
    
    return true;
  });

  // Sort the array
  if (sortState.column) {
    inventoryArray.sort((a, b) => {
      let comparison = 0;
      switch (sortState.column) {
        case 'name':
          comparison = a.fishName.localeCompare(b.fishName);
          break;
        case 'rarity':
          // Get rarity indices from fishRarities array
          const rarityA = fishRarities.findIndex(r => r.name === a.rarity.name);
          const rarityB = fishRarities.findIndex(r => r.name === b.rarity.name);
          // Check if either fish is shiny
          const isShinyA = a.fishName.endsWith(' (shiny)');
          const isShinyB = b.fishName.endsWith(' (shiny)');
          
          // If rarity filters are active, always put shiny fish at the top
          if (activeRarities.length > 0) {
            if (isShinyA !== isShinyB) {
              return isShinyA ? -1 : 1;
            }
          }
          
          // If both are shiny or both are normal, compare by rarity
          if (isShinyA === isShinyB) {
            comparison = rarityA - rarityB;
          } else {
            // Shiny fish are always considered rarer
            comparison = isShinyA ? 1 : -1;
          }
          break;
        case 'count':
          comparison = a.count - b.count;
          break;
      }
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }

  inventoryArray.forEach(entry => {
    hasResults = true;
    let row = document.createElement('tr');
    // Fish Name
    const isShiny = entry.fishName.endsWith(' (shiny)');
    const shinyLabel = isShiny ? ` <span class="shiny-glow">(shiny)</span>` : '';
    let nameTd = document.createElement('td');
    nameTd.innerHTML = `<span style="color:${entry.rarity.color};font-weight:bold;">${entry.fishName.replace(' (shiny)','')}</span>${shinyLabel}`;
    row.appendChild(nameTd);
    // Rarity
    let rarityTd = document.createElement('td');
    rarityTd.innerHTML = `<span style="color:${entry.rarity.color};font-weight:bold;">${entry.rarity.name}</span>`;
    row.appendChild(rarityTd);
    // Count
    let countTd = document.createElement('td');
    countTd.textContent = entry.count;
    row.appendChild(countTd);
    // Make Shiny Button
    let shinyTd = document.createElement('td');
    if (!isShiny) {
      const btn = document.createElement('button');
      btn.className = 'shiny-craft-btn';
      btn.textContent = 'Make Shiny';
      btn.disabled = entry.count < 10;
      btn.onclick = () => {
        if (entry.count >= 10) {
          // Update the count in the inventory
          inventory[entry.key].count -= 10;
          
          // Remove the fish from inventory if count reaches 0
          if (inventory[entry.key].count <= 0) {
            delete inventory[entry.key];
          }
          
          const shinyKey = `${entry.rarity.name}|${entry.fishName.replace(' (shiny)', '')} (shiny)`;
          if (!inventory[shinyKey]) {
            inventory[shinyKey] = { 
              fishName: entry.fishName.replace(' (shiny)', '') + ' (shiny)', 
              rarity: entry.rarity, 
              count: 1,
              key: shinyKey
            };
          } else {
            inventory[shinyKey].count++;
          }
          
          // Force update the inventory display
          updateInventoryDisplay(document.getElementById('fish-search')?.value || '');
          saveState();
        }
      };
      shinyTd.appendChild(btn);
    } else {
      shinyTd.textContent = '-';
    }
    row.appendChild(shinyTd);
    tbody.appendChild(row);
  });
  
  if (!hasResults) {
    inventoryList.textContent = 'No matching fish found.';
    return;
  }
  
  table.appendChild(tbody);
  inventoryList.innerHTML = '';
  inventoryList.appendChild(table);
}

// ------------------ INDEX DISPLAY ------------------
function updateIndexDisplay() {
  const indexList = document.getElementById('index-list');
  if (!indexList) return;

  if (Object.keys(inventory).length === 0) {
    indexList.textContent = 'No fish collected yet.';
    return;
  }

  // Clear previous content
  indexList.innerHTML = '';

  // Create a sorted list by rarity
  fishRarities.forEach(rarity => {
    const rarityFish = Object.values(inventory)
      .filter(f => f.rarity.name === rarity.name)
      .sort((a, b) => a.fishName.localeCompare(b.fishName));

    if (rarityFish.length === 0) return; // skip empty rarities

    // Rarity header
    const rarityHeader = document.createElement('h3');
    rarityHeader.textContent = rarity.name;
    rarityHeader.style.color = rarity.color;
    rarityHeader.style.margin = '0.5em 0 0.2em 0';
    indexList.appendChild(rarityHeader);

    // List of fish
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.paddingLeft = '1em';
    rarityFish.forEach(fish => {
      const li = document.createElement('li');
      const isShiny = fish.fishName.endsWith(' (shiny)');
      li.innerHTML = `<span style="color:${rarity.color};font-weight:bold;">${fish.fishName.replace(' (shiny)','')}</span> (${fish.count})${isShiny ? ' ✨' : ''}`;
      ul.appendChild(li);
    });
    indexList.appendChild(ul);
  });
}

// Add search and filter functionality
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('fish-search');
  const searchBtn = document.getElementById('search-btn');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const rarityFilters = document.querySelectorAll('.rarity-filter');
  const shinyFilter = document.getElementById('shiny-filter');
  
  // Function to update display with current filters
  const updateWithFilters = () => {
    updateInventoryDisplay(searchInput?.value || '');
  };

  // Function to reset all filters
  const resetFilters = () => {
    // Clear search input
    if (searchInput) searchInput.value = '';
    
    // Uncheck all rarity filters
    rarityFilters.forEach(filter => {
      filter.checked = false;
    });
    
    // Uncheck shiny filter
    if (shinyFilter) shinyFilter.checked = false;
    
    // Set default sort to rarity (ascending)
    localStorage.setItem('inventorySortColumn', 'rarity');
    localStorage.setItem('inventorySortDirection', 'asc');
    
    // Update the display
    updateInventoryDisplay();
  };
  
  if (searchInput && searchBtn) {
    searchBtn.addEventListener('click', updateWithFilters);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        updateWithFilters();
      }
    });
  }

  // Add reset button functionality
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetFilters);
  }
  
  // Add event listeners for all filters
  rarityFilters.forEach(filter => {
    filter.addEventListener('change', updateWithFilters);
  });
  
  if (shinyFilter) {
    shinyFilter.addEventListener('change', updateWithFilters);
  }
});

// Player coins
let coins = 10000; // example starting coins

// Active potions store end times
let activePotions = {
  luck: 0,
  reel: 0
};

// Potion durations in milliseconds (5 min each)
const potionDuration = 5 * 60 * 1000;

// Buy potion function
function buyPotion(type) {
  const cost = type === 'luck' ? 3000 : 5000;

  if (coins < cost) {
    alert("Not enough coins!");
    return;
  }

  coins -= cost;
  const now = Date.now();
  activePotions[type] = now + potionDuration;

  alert(`${type === 'luck' ? "Luck Potion" : "Reel Speed Potion"} activated for 5 minutes!`);
  updatePotionEffects(type, true);
  updateTimers(); // immediate update
}

// Potion effect activation placeholder
function updatePotionEffects(type, isActive) {
  if (type === 'luck') {
    // Apply luck effect
    console.log("Luck potion is active:", isActive);
  } else if (type === 'reel') {
    // Apply reel speed effect
    console.log("Reel speed potion is active:", isActive);
  }
}

// Update timers every second
function updateTimers() {
  const now = Date.now();

  // Luck potion
  const luckElem = document.getElementById('luck-timer');
  if (activePotions.luck > now) {
    const seconds = Math.ceil((activePotions.luck - now) / 1000);
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    luckElem.textContent = `Luck Potion: ${min}:${sec.toString().padStart(2,'0')} remaining`;
  } else {
    luckElem.textContent = 'Inactive';
    updatePotionEffects('luck', false);
  }

  // Reel potion
  const reelElem = document.getElementById('reel-timer');
  if (activePotions.reel > now) {
    const seconds = Math.ceil((activePotions.reel - now) / 1000);
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    reelElem.textContent = `Reel Speed Potion: ${min}:${sec.toString().padStart(2,'0')} remaining`;
  } else {
    reelElem.textContent = 'Inactive';
    updatePotionEffects('reel', false);
  }
}

// Run timer update every second
setInterval(updateTimers, 1000);

// Returns the fishing time in ms, using current reel speed and random base
function getFishingTime() {
  const baseTime = 5000; // 5 seconds
  if (reelSpeedLevel === 0) return baseTime;
  const reduction = reelSpeedReductions[reelSpeedLevel - 1];
  return baseTime * (1 - reduction);
}

function catchFish() {
  const fishBtn = document.getElementById('fish-btn');
  if (fishBtn) fishBtn.disabled = true;
  fishingStatus.textContent = 'Fishing...';
  
  // Pulse the fish image
  const fishImg = document.getElementById('main-fish-img');
  if (fishImg) {
    fishImg.classList.remove('pulse');
    // Force reflow to restart animation
    void fishImg.offsetWidth;
    fishImg.classList.add('pulse');
  }
  
  // Use unified fishing time
  const fishingTime = getFishingTime();
  
  setTimeout(() => {
    fishCount++;
    lifetimeFishCount++;
    pullsUntilShiny--;
    
    // Show only the last draw (always 1)
    const lastCatchCountSpan = document.getElementById('last-catch-count');
    if (lastCatchCountSpan) lastCatchCountSpan.textContent = 1;
    if (lifetimeFishCountSpan) lifetimeFishCountSpan.textContent = lifetimeFishCount;
    
    const rarity = getRandomRarity();
    let fishName = getRandomFish(rarity);
    
    // Determine display name
	let displayName = fishName;
	if (typeof fishName === 'object' && fishName.name) {
	  displayName = fishName.name;
	}

	// Check if this is the guaranteed shiny pull
	let isShiny = false;
	if (pullsUntilShiny <= 0) {
	  isShiny = true;
	  pullsUntilShiny = 500; // Reset counter
	  displayName += ' (shiny)';
	}

	// Update fishing status
	fishingStatus.innerHTML = `Caught a <span style="color:${rarity.color}; font-weight:bold;">${rarity.name}</span> <span style="font-style:italic">${displayName}</span>!`;

	// Update currency
	currencyCount += rarity.baseCurrency;
	coinCountSpan.textContent = formatNumber(currencyCount);
    
    // XP gain
    if (typeof rarity.xp === 'number') {
      xp += rarity.xp;
      if (xp >= 100) {
        xp = xp - 100;
        level = Math.min(level + 1, maxLevel);
      }
      updateXPBar();
    }
    
    updateCoinAndAutoFishTile();
    updateAutoFishCostColor();
    updateReelSpeedButtons();
    updateShinyPullCounter();
	updateIndexDisplay();
    saveState();
    
    // Animate +amount outside (to the right of) the coin counter box
    const coinDiv = coinCountSpan.parentElement;
    let animContainer = document.getElementById('coin-anim-container');
    if (!animContainer) {
      animContainer = document.createElement('div');
      animContainer.id = 'coin-anim-container';
      animContainer.style.position = 'absolute';
      animContainer.style.left = '100%';
      animContainer.style.top = '50%';
      animContainer.style.transform = 'translateY(-50%)';
      animContainer.style.pointerEvents = 'none';
      animContainer.style.width = '70px';
      animContainer.style.height = '32px';
      coinDiv.style.position = 'relative';
      coinDiv.appendChild(animContainer);
    }
    const animation = document.createElement('span');
    animation.textContent = `+${rarity.baseCurrency}`;
    animation.style.color = '#ffd700';
    animation.style.fontSize = '1.1em';
    animation.style.fontWeight = 'bold';
    animation.style.position = 'absolute';
    animation.style.left = '0';
    animation.style.top = '0';
    animation.style.opacity = '1';
    animation.style.transition = 'opacity 1s, transform 1s';
    animContainer.appendChild(animation);
    setTimeout(() => {
      animation.style.opacity = '0';
      animation.style.transform = 'translateY(-24px)';
    }, 20);
    setTimeout(() => {
      animation.remove();
    }, 1020);
    
    // Add wobble animation to coin counter number
    if (coinCountSpan) {
      coinCountSpan.classList.add('counter-number');
      wobbleElement(coinCountSpan);
    }
    
    // Update inventory
    const fishKey = `${rarity.name}|${fishName}`;
    if (!inventory[fishKey]) {
      inventory[fishKey] = { fishName, rarity, count: 1 };
    } else {
      inventory[fishKey].count++;
    }
    // Add to recent fish
    addRecentFish(fishName, 1);
    updateInventoryDisplay();
    saveState(); // Save after inventory update
    animateRecentFish();
    setTimeout(() => {
      fishingStatus.textContent = 'Waiting to catch fish...';
      if (fishBtn) fishBtn.disabled = false;
    }, 1200);
  }, fishingTime);
}

// XP bar state
let xp = 0;
let level = 1;
const maxLevel = 100;
// Load state from localStorage
loadState();

function updateXPBar() {
  const progress = document.getElementById('xp-progress');
  const levelSpan = document.getElementById('xp-level');
  const progressText = document.getElementById('xp-progress-text');
  if (!progress || !levelSpan || !progressText) return;
  // Ensure level doesn't exceed max
  level = Math.min(level, maxLevel);
  // Fill percent: xp/100 (assuming 100 XP per level)
  let percent = Math.max(0, Math.min(100, xp));
  progress.style.width = percent + '%';
  levelSpan.textContent = level;
  progressText.textContent = xp + '/100';
}

// On page load, set XP bar
updateXPBar();

// Initialize counters and inventory display on page load
function formatNumber(n) {
  if (n < 10000) return n.toLocaleString();
  if (n < 1000000) return Math.floor(n / 1000) + 'k'; // 10k - 999k
  if (n < 1000000000) return Math.floor(n / 1000000) + 'M'; // 1M - 999M
  return n.toLocaleString();
}

coinCountSpan.textContent = formatNumber(currencyCount);
gemCountSpan.textContent = formatNumber(gemCount);
updateInventoryDisplay();

// --- Upgrade Table: Auto Fish Cost Color ---
function updateAutoFishCostColor() {
  const costSpan = document.getElementById('auto-fish-cost');
  if (!costSpan) return;
  if (autoFishUnlocked) {
    costSpan.classList.remove('cost-red');
    costSpan.classList.add('cost-white');
  } else if (currencyCount >= 15000) {
    costSpan.classList.remove('cost-red');
    costSpan.classList.add('cost-white');
  } else {
    costSpan.classList.add('cost-red');
    costSpan.classList.remove('cost-white');
  }
}
window.updateAutoFishCostColor = updateAutoFishCostColor;
updateAutoFishCostColor();

// --- Upgrade Map: Auto Fish Tile Logic ---
const autoFishTile = document.getElementById('auto-fish-tile');
const autoFishBtn = document.getElementById('auto-fish-purchase');
const autoFishLock = autoFishTile && autoFishTile.querySelector('.lock-icon');

// Upgrade Map: Upgrade Button Logic
const autoFishUpgradeBtn = document.getElementById('auto-fish-upgrade-btn');
function updateUpgradeMapButton() {
  if (!autoFishUpgradeBtn) return;
  if (autoFishUnlocked) {
    autoFishUpgradeBtn.textContent = 'Unlocked';
    autoFishUpgradeBtn.classList.remove('green');
    autoFishUpgradeBtn.disabled = true;
  } else if (currencyCount >= 15000) {
    autoFishUpgradeBtn.textContent = 'Buy';
    autoFishUpgradeBtn.classList.add('green');
    autoFishUpgradeBtn.disabled = false;
  } else {
    autoFishUpgradeBtn.textContent = 'Locked';
    autoFishUpgradeBtn.classList.remove('green');
    autoFishUpgradeBtn.disabled = true;
  }
}
autoFishUpgradeBtn && autoFishUpgradeBtn.addEventListener('click', function() {
  if (!autoFishUnlocked && currencyCount >= 15000) {
    currencyCount -= 15000;
    autoFishUnlocked = true;
    saveState();
    updateUpgradeMapButton();
    updateAutoFishTile && updateAutoFishTile();
    coinCountSpan.textContent = formatNumber(currencyCount);
    updateAutoFishCostColor && updateAutoFishCostColor();
    updateAutoFishUIButton && updateAutoFishUIButton(); // Ensure button appears
  }
});
// Update on page load and after fishing
updateUpgradeMapButton();

function updateAutoFishTile() {
  if (!autoFishTile || !autoFishBtn) return;
  if (autoFishUnlocked) {
    autoFishTile.classList.remove('locked');
    autoFishTile.classList.add('unlocked');
    autoFishBtn.style.display = 'none';
    if (autoFishLock) autoFishLock.classList.add('unlocked');
  } else {
    autoFishTile.classList.add('locked');
    autoFishTile.classList.remove('unlocked');
    autoFishBtn.style.display = '';
    if (autoFishLock) autoFishLock.classList.remove('unlocked');
    if (currencyCount >= 15000) {
      autoFishBtn.classList.remove('red');
      autoFishBtn.classList.add('white');
      autoFishBtn.disabled = false;
    } else {
      autoFishBtn.classList.add('red');
      autoFishBtn.classList.remove('white');
      autoFishBtn.disabled = true;
    }
  }
}

if (autoFishBtn) {
  autoFishBtn.addEventListener('click', () => {
    if (currencyCount >= 15000 && !autoFishUnlocked) {
      currencyCount -= 15000;
      coinCountSpan.textContent = formatNumber(currencyCount);
      autoFishUnlocked = true;
      saveState();
      updateAutoFishTile();
    }
  });
}

updateAutoFishTile();

// Update tile state on coin changes
function updateCoinAndAutoFishTile() {
  coinCountSpan.textContent = formatNumber(currencyCount);
  updateAutoFishTile();
}
// --- END Upgrade Map ---

// Add click event to fish button
import { setupSettingsPanel } from './settings.js';
setupSettingsPanel({
  getState: () => ({ currencyCount, gemCount, fishCount, inventory, xp, level, autoFishUnlocked, reelSpeedLevel, luckLevel }),
  setState: (updates) => {
    if ('currencyCount' in updates) currencyCount = updates.currencyCount;
    if ('gemCount' in updates) gemCount = updates.gemCount;
    if ('fishCount' in updates) fishCount = updates.fishCount;
    if ('inventory' in updates) inventory = updates.inventory;
    if ('xp' in updates) xp = updates.xp;
    if ('level' in updates) level = updates.level;
    if ('autoFishUnlocked' in updates) autoFishUnlocked = updates.autoFishUnlocked;
    if ('lifetimeFishCount' in updates) lifetimeFishCount = updates.lifetimeFishCount;
    if ('reelSpeedLevel' in updates) reelSpeedLevel = updates.reelSpeedLevel;
    if ('luckLevel' in updates) luckLevel = updates.luckLevel;
  },
  saveState,
  updateUI: () => {
    if (typeof coinCountSpan !== 'undefined') coinCountSpan.textContent = formatNumber(currencyCount);
    if (typeof gemCountSpan !== 'undefined') gemCountSpan.textContent = formatNumber(gemCount);
    if (typeof lifetimeFishCountSpan !== 'undefined') lifetimeFishCountSpan.textContent = lifetimeFishCount;
    if (typeof updateUpgradeMapButton === 'function') updateUpgradeMapButton();
    if (typeof updateAutoFishTile === 'function') updateAutoFishTile();
    if (typeof updateLuckButtons === 'function') updateLuckButtons();
  },
  updateAutoFishUIButton: (typeof updateAutoFishUIButton === 'function') ? updateAutoFishUIButton : undefined,
  updateAutoFishCostColor: (typeof updateAutoFishCostColor === 'function') ? updateAutoFishCostColor : undefined,
  updateReelSpeedButtons: (typeof updateReelSpeedButtons === 'function') ? updateReelSpeedButtons : undefined,
  updateLuckButtons: (typeof updateLuckButtons === 'function') ? updateLuckButtons : undefined
});

// --- Fish Button Flex Container ---
let fishBtn = document.getElementById('fish-btn');
let fishBtnContainer = document.getElementById('fish-btn-container');
if (!fishBtnContainer) {
  fishBtnContainer = document.createElement('div');
  fishBtnContainer.id = 'fish-btn-container';
  fishBtnContainer.style.display = 'flex';
  fishBtnContainer.style.gap = '32px';
  fishBtnContainer.style.alignItems = 'center';
  fishBtnContainer.style.justifyContent = 'center';
  fishBtnContainer.style.position = 'fixed';
  fishBtnContainer.style.left = '50%';
  fishBtnContainer.style.bottom = '32px';
  fishBtnContainer.style.transform = 'translateX(-50%)';
  fishBtnContainer.style.zIndex = '1000';
  document.body.appendChild(fishBtnContainer);
}
if (!fishBtn) {
  fishBtn = document.createElement('button');
  fishBtn.id = 'fish-btn';
  fishBtn.className = 'pixel-btn';
  fishBtn.style.fontSize = '1.2em';
  fishBtn.style.padding = '1em 2.5em';
  fishBtn.textContent = 'Fish!';
  fishBtnContainer.appendChild(fishBtn);
}

// --- Auto Fish UI Button ---
let autoFishBtnEl = null;
let autoFishActive = false;
let autoFishInterval = null;
function updateAutoFishUIButton() {
  if (!fishBtn) return;
  // Only show if unlocked and on fishing tab
  const fishingTabBtn = document.querySelector('.tab-btn.active');
  const onFishingTab = fishingTabBtn && fishingTabBtn.dataset.tab === 'fishing';
  if (!autoFishUnlocked || !onFishingTab) {
    if (autoFishBtnEl) {
      autoFishBtnEl.style.display = 'none';
    }
    return;
  }
  if (!autoFishBtnEl) {
    autoFishBtnEl = document.createElement('button');
    autoFishBtnEl.id = 'auto-fish-btn';
    autoFishBtnEl.className = 'pixel-btn';
    autoFishBtnEl.style.fontSize = '1.2em';
    autoFishBtnEl.style.padding = '1em 2.5em';
    autoFishBtnEl.textContent = 'Auto Fish';
    fishBtnContainer.appendChild(autoFishBtnEl);
    autoFishBtnEl.addEventListener('click', () => {
      if (autoFishActive) {
        clearInterval(autoFishInterval);
        autoFishActive = false;
        autoFishBtnEl.textContent = 'Auto Fish';
      } else {
        function autoFishLoop() {
          if (fishBtn && !fishBtn.disabled) fishBtn.click();
          if (autoFishActive) {
            autoFishInterval = setTimeout(autoFishLoop, Math.max(300, getFishingTime()));
          }
        }
        autoFishActive = true;
        autoFishBtnEl.textContent = 'Stop Auto';
        autoFishLoop();
      }
    });
  }
  autoFishBtnEl.style.display = '';
}

// Ensure auto fish button visibility updates on tab change
if (typeof updateAutoFishUIButton === 'function') {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      updateAutoFishUIButton();
    });
  });
}

updateAutoFishUIButton();
// Update UI when upgrade is bought
function onAutoFishUnlock() {
  updateAutoFishUIButton();
}
if (fishBtn) {
  fishBtn.addEventListener('click', catchFish);
}

// Add Auto Fish button if unlocked
function updateAutoFishButton() {
  let autoBtn = document.getElementById('auto-fish-btn');
  if (!autoFishUnlocked) {
    if (autoBtn) autoBtn.remove();
    return;
  }
  if (!autoBtn) {
    autoBtn = document.createElement('button');
    autoBtn.id = 'auto-fish-btn';
    autoBtn.className = 'pixel-btn';
    autoBtn.style.position = 'fixed';
    autoBtn.style.left = 'calc(50% + 140px)';
    autoBtn.style.bottom = '32px';
    autoBtn.style.transform = 'translateX(-50%)';
    autoBtn.style.zIndex = '1000';
    autoBtn.style.fontSize = '1.2em';
    autoBtn.style.padding = '1em 2.5em';
    autoBtn.textContent = 'Auto Fish';
    document.body.appendChild(autoBtn);
    autoBtn.addEventListener('click', () => {
      if (autoFishActive) {
        clearInterval(autoFishInterval);
        autoFishActive = false;
        autoBtn.textContent = 'Auto Fish';
      } else {
        autoFishInterval = setInterval(() => {
          if (fishBtn && !fishBtn.disabled) catchFish();
        }, 3000);
        autoFishActive = true;
        autoBtn.textContent = 'Stop Auto';
      }
    });
  }
}
updateAutoFishButton();

// When auto-fish is unlocked, show/hide button accordingly
if (autoFishBtn) {
  const observer = new MutationObserver(updateAutoFishButton);
  observer.observe(autoFishTile, { attributes: true, attributeFilter: ['class'] });
}

// Update reel speed button
function updateReelSpeedButtons() {
  const btn = document.getElementById('reel-speed-btn');
  const costSpan = document.getElementById('reel-speed-cost');
  const nameTd = document.getElementById('reel-speed-name');
  if (!btn || !costSpan || !nameTd) return;

  // Update the name to show current level
  if (reelSpeedLevel >= 5) {
    nameTd.textContent = 'Reel Speed V';
  } else {
    nameTd.textContent = `Reel Speed ${['I', 'II', 'III', 'IV', 'V'][reelSpeedLevel]}`;
  }

  if (reelSpeedLevel >= 5) {
    btn.textContent = 'Max Level';
    btn.disabled = true;
    costSpan.classList.remove('cost-red');
    costSpan.classList.add('cost-white');
    costSpan.textContent = '-';
  } else {
    const currentCost = reelSpeedCosts[reelSpeedLevel];
    costSpan.textContent = formatNumber(currentCost);
    
    if (currencyCount >= currentCost) {
      btn.textContent = 'Buy';
      btn.classList.add('green');
      btn.disabled = false;
      costSpan.classList.remove('cost-red');
      costSpan.classList.add('cost-white');
    } else {
      btn.textContent = 'Locked';
      btn.classList.remove('green');
      btn.disabled = true;
      costSpan.classList.add('cost-red');
      costSpan.classList.remove('cost-white');
    }
  }
  updateReelSpeedCounter();
}

// Add click handler for reel speed button
const reelSpeedBtn = document.getElementById('reel-speed-btn');
if (reelSpeedBtn) {
  reelSpeedBtn.addEventListener('click', () => {
    if (reelSpeedLevel < 5 && currencyCount >= reelSpeedCosts[reelSpeedLevel]) {
      currencyCount -= reelSpeedCosts[reelSpeedLevel];
      reelSpeedLevel++;
      saveState();
      updateReelSpeedButtons();
      coinCountSpan.textContent = formatNumber(currencyCount);
      updateReelSpeedCounter();
    }
  });
}

// Update luck button
function updateLuckButtons() {
  const btn = document.getElementById('luck-btn');
  const costSpan = document.getElementById('luck-cost');
  const nameTd = document.getElementById('luck-name');
  if (!btn || !costSpan || !nameTd) return;

  // Update the name to show current level
  if (luckLevel >= 5) {
    nameTd.textContent = 'Luck V';
  } else {
    nameTd.textContent = `Luck ${['I', 'II', 'III', 'IV', 'V'][luckLevel]}`;
  }

  // Update luck percentage display
  if (luckPercentageSpan) {
    const luckBonus = luckLevel > 0 ? luckBonuses[luckLevel - 1] * 100 : 0;
    luckPercentageSpan.textContent = luckBonus;
  }

  if (luckLevel >= 5) {
    btn.textContent = 'Max Level';
    btn.disabled = true;
    costSpan.classList.remove('cost-red');
    costSpan.classList.add('cost-white');
    costSpan.textContent = '-';
  } else {
    const currentCost = luckCosts[luckLevel];
    costSpan.textContent = formatNumber(currentCost);
    
    if (currencyCount >= currentCost) {
      btn.textContent = 'Buy';
      btn.classList.add('green');
      btn.disabled = false;
      costSpan.classList.remove('cost-red');
      costSpan.classList.add('cost-white');
    } else {
      btn.textContent = 'Locked';
      btn.classList.remove('green');
      btn.disabled = true;
      costSpan.classList.add('cost-red');
      costSpan.classList.remove('cost-white');
    }
  }
}

// Add click handler for luck button
const luckBtn = document.getElementById('luck-btn');
if (luckBtn) {
  luckBtn.addEventListener('click', () => {
    if (luckLevel < 5 && currencyCount >= luckCosts[luckLevel]) {
      currencyCount -= luckCosts[luckLevel];
      luckLevel++;
      saveState();
      updateLuckButtons();
      coinCountSpan.textContent = formatNumber(currencyCount);
    }
  });
}

// Update shiny pull counter
function updateShinyPullCounter() {
  if (shinyPullCountSpan) {
    const maxPulls = 500;
    shinyPullCountSpan.textContent = `${pullsUntilShiny}/${maxPulls}`;
  }
}

// Global function to get current reel speed (base 100 + 50 per upgrade, plus future modifiers)
function getReelSpeed() {
  // Placeholder for future potion/bonus modifiers
  let bonus = 0;
  // Example: if (activePotion) bonus += 25;
  return 100 + reelSpeedLevel * 50 + bonus;
}

// Update reel speed counter in UI
function updateReelSpeedCounter() {
  const reelSpeedLevelSpan = document.getElementById('reel-speed-level');
  if (reelSpeedLevelSpan) {
    reelSpeedLevelSpan.textContent = getReelSpeed();
  }
}

// Call updateReelSpeedCounter on load and after upgrades
window.addEventListener('DOMContentLoaded', updateReelSpeedCounter);

function addRecentFish(fishName, count) {
  // If the most recent is the same fish, increment its count
  if (recentFish.length > 0 && recentFish[0].name === fishName) {
    recentFish[0].count += count;
  } else {
    recentFish.unshift({ name: fishName, count });
  }
  // Limit to 10
  if (recentFish.length > 10) recentFish = recentFish.slice(0, 10);
  updateRecentFishDisplay();
}

function updateRecentFishDisplay() {
  const container = document.getElementById('recent-fish-container');
  if (!container) return;
  container.innerHTML = '';
  recentFish.forEach((entry, idx) => {
    const div = document.createElement('div');
    // Gradually decrease opacity and font size
    const opacity = 1 - idx * 0.08;
    const fontSize = 1 - idx * 0.05;
    div.style.opacity = opacity;
    div.style.fontSize = fontSize + 'em';
    div.style.transition = 'all 0.5s cubic-bezier(.4,2,.6,1)';
    div.className = 'recent-fish-entry';
    // Determine rarity and shiny
    let fishName = entry.name;
    let isShiny = false;
    let baseName = fishName;
    if (fishName.endsWith(' (shiny)')) {
      isShiny = true;
      baseName = fishName.replace(' (shiny)', '');
    }
    // Find rarity by searching all fish lists
    let rarityColor = '#fffbe7';
    for (const rarity of fishRarities) {
      if (fishList[rarity.name] && fishList[rarity.name].includes(baseName)) {
        rarityColor = rarity.color;
        break;
      }
    }
    // Build inner HTML
    let nameHtml = `<span style="color:${rarityColor};font-weight:bold;">${baseName}</span>`;
    if (isShiny) nameHtml += ' <span class="shiny-glow">(shiny)</span>';
    div.innerHTML = `${nameHtml} <span style="color:#ffd700;">x${entry.count}</span>`;
    container.appendChild(div);
  });
}

// Animate new entry
function animateRecentFish() {
  const container = document.getElementById('recent-fish-container');
  if (!container) return;
  const first = container.firstChild;
  if (first) {
    first.style.transform = 'translateX(-30px) scale(1.15)';
    first.style.opacity = '0';
    setTimeout(() => {
      first.style.transition = 'all 0.5s cubic-bezier(.4,2,.6,1)';
      first.style.transform = 'translateX(0) scale(1)';
      first.style.opacity = '1';
    }, 10);
  }
}

// On page load, show recent fish if any
window.addEventListener('DOMContentLoaded', updateRecentFishDisplay);

// --- Background Music Logic ---
const bgMusic = document.getElementById('bg-music');
const musicVolumeSlider = document.getElementById('music-volume');

// Load saved volume or default to 0.25
let savedVolume = parseFloat(localStorage.getItem('fishyMusicVolume'));
if (isNaN(savedVolume)) savedVolume = 0.25;
if (bgMusic) bgMusic.volume = savedVolume;
if (musicVolumeSlider) musicVolumeSlider.value = savedVolume;

// Play music on first user interaction (for browser autoplay policy)
function enableMusicPlayback() {
  if (bgMusic && bgMusic.paused) {
    bgMusic.play().catch(()=>{});
  }
  window.removeEventListener('pointerdown', enableMusicPlayback);
  window.removeEventListener('keydown', enableMusicPlayback);
}
window.addEventListener('pointerdown', enableMusicPlayback);
window.addEventListener('keydown', enableMusicPlayback);

// Volume slider logic
if (musicVolumeSlider) {
  musicVolumeSlider.addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (bgMusic) bgMusic.volume = v;
    localStorage.setItem('fishyMusicVolume', v);
  });
}

// --- UI Sounds Logic ---
const clickSound = document.getElementById('click-sound');
const closeSound = document.getElementById('close-sound');
const uiVolumeSlider = document.getElementById('ui-volume');

// Load saved UI volume or default to 0.5
let savedUIVolume = parseFloat(localStorage.getItem('fishyUIVolume'));
if (isNaN(savedUIVolume)) savedUIVolume = 0.5;
if (clickSound) clickSound.volume = savedUIVolume;
if (closeSound) closeSound.volume = savedUIVolume;
if (uiVolumeSlider) uiVolumeSlider.value = savedUIVolume;

// UI Volume slider logic
if (uiVolumeSlider) {
  uiVolumeSlider.addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (clickSound) clickSound.volume = v;
    if (closeSound) closeSound.volume = v;
    localStorage.setItem('fishyUIVolume', v);
  });
}

// Add click sound to all buttons except close settings
document.querySelectorAll('button:not(#close-settings-btn)').forEach(button => {
  button.addEventListener('click', () => {
    if (clickSound) {
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {});
    }
  });
});

// Add close sound to settings close button
const closeSettingsBtn = document.getElementById('close-settings-btn');
if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener('click', () => {
    if (closeSound) {
      closeSound.currentTime = 0;
      closeSound.play().catch(() => {});
    }
  });
}

// Add wobble animation function
function wobbleElement(element) {
  if (!element) return;
  element.style.animation = 'none';
  // Force reflow
  void element.offsetWidth;
  element.style.animation = 'wobble 0.5s cubic-bezier(.36,.07,.19,.97) both';
}

// Add event listeners for filter checkboxes
document.querySelectorAll('.rarity-filter, #shiny-filter').forEach(checkbox => {
  checkbox.addEventListener('change', function() {
    const tickSound = document.getElementById('tick-sound');
    tickSound.currentTime = 0;
    tickSound.play();
    filterInventory();
  });
});




