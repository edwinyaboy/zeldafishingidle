// Tab switching logic
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    const fishBtn = document.getElementById('fish-btn');
    if (fishBtn) {
      if (btn.dataset.tab === 'fishing') {
        fishBtn.style.display = '';
      } else {
        fishBtn.style.display = 'none';
      }
    }
    updateAutoFishUIButton();
  });
});

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
let timesFished = 0;
const fishCountSpan = document.getElementById('fish-count');
const fishingStatus = document.getElementById('fishing-status');
const coinCountSpan = document.getElementById('coin-count');
const gemCountSpan = document.getElementById('gem-count');
const lifetimeFishCountSpan = document.getElementById('lifetime-fish-count');
const luckPercentageSpan = document.getElementById('luck-percentage');
const shinyPullCountSpan = document.getElementById('shiny-pull-count');

let autoFishUnlocked = false;
let pullsUntilShiny = 500;

// Reel Speed upgrade state (3 tiers totaling +25)
let reelSpeedLevel = 0;
const reelSpeedCosts = [5000, 10000, 15000];
const reelSpeedBonuses = [8, 8, 9]; // Total: 25

// Luck upgrade state (3 tiers totaling 10%)
let luckLevel = 0;
const luckCosts = [7500, 15000, 22500];
const luckBonuses = [0.0333, 0.0333, 0.0334]; // Total: 10%

// Triforce shards collected
let collectedShards = {};

// Track 10 most recent caught fish
let recentFish = [];

// Anti-autoclicker
let lastClickTime = 0;
let clickCount = 0;

// Load saved state
function loadState() {
  const saved = JSON.parse(localStorage.getItem('fishingGameState') || '{}');
  if (typeof saved.currencyCount === 'number') currencyCount = saved.currencyCount;
  if (typeof saved.gemCount === 'number') gemCount = saved.gemCount;
  if (typeof saved.fishCount === 'number') fishCount = saved.fishCount;
  if (typeof saved.lifetimeFishCount === 'number') lifetimeFishCount = saved.lifetimeFishCount;
  if (typeof saved.timesFished === 'number') timesFished = saved.timesFished;
  if (typeof saved.inventory === 'object' && saved.inventory) {
    Object.assign(inventory, saved.inventory);
  }
  if (typeof saved.xp === 'number') xp = saved.xp;
  if (typeof saved.level === 'number') level = saved.level;
  if (typeof saved.autoFishUnlocked === 'boolean') autoFishUnlocked = saved.autoFishUnlocked;
  if (typeof saved.reelSpeedLevel === 'number') reelSpeedLevel = saved.reelSpeedLevel;
  if (typeof saved.luckLevel === 'number') luckLevel = saved.luckLevel;
  if (typeof saved.pullsUntilShiny === 'number') pullsUntilShiny = saved.pullsUntilShiny;
  if (typeof saved.collectedShards === 'object' && saved.collectedShards) {
    collectedShards = saved.collectedShards;
  }
  updateXPBar();
  updateReelSpeedButtons();
  updateLuckButtons();
  updateShinyPullCounter();
  updateReelSpeedCounter();
  updateTriforceUI();
  if (lifetimeFishCountSpan) lifetimeFishCountSpan.textContent = lifetimeFishCount;
  updateLuckDisplay();
}

// Save state
function saveState() {
  localStorage.setItem('fishingGameState', JSON.stringify({
    currencyCount, 
    gemCount, 
    fishCount, 
    lifetimeFishCount,
    timesFished,
    inventory, 
    xp, 
    level, 
    autoFishUnlocked,
    reelSpeedLevel,
    luckLevel,
    pullsUntilShiny,
    collectedShards
  }));
}

// Import fish rarities and fish list
import { fishRarities, fishList } from './fishes.js';

// Add Mon values to rarities if not present
fishRarities.forEach(rarity => {
  if (!rarity.monValue) {
    const monValues = {
      'Common': 1,
      'Rare': 3,
      'Unique': 5,
      'Epic': 10,
      'Legendary': 15,
      'Mythical': 25,
      'Secret': 50,
      'Triforce': 0
    };
    rarity.monValue = monValues[rarity.name] || 1;
  }
});

// Calculate total luck (capped at 100%)
function getTotalLuck() {
  let totalLuck = 0;
  
  // From upgrades (max 10%)
  for (let i = 0; i < luckLevel; i++) {
    totalLuck += luckBonuses[i];
  }
  
  // From triforce shards (4 shards x 5% = 20%)
  Object.values(collectedShards).forEach(shard => {
    if (shard.type === 'luck') {
      totalLuck += shard.value;
    }
  });
  
  // From potion (10%)
  if (activePotions.luck > Date.now()) {
    totalLuck += 0.10;
  }
  
  // Cap at 100%
  return Math.min(totalLuck, 1.0);
}

// Calculate total reel speed bonus
function getReelSpeedBonus() {
  let bonus = 0;
  
  // From upgrades (max 25)
  for (let i = 0; i < reelSpeedLevel; i++) {
    bonus += reelSpeedBonuses[i];
  }
  
  // From triforce shards (4 shards x 5 = 20)
  Object.values(collectedShards).forEach(shard => {
    if (shard.type === 'reelSpeed') {
      bonus += shard.value;
    }
  });
  
  // From potion (20)
  if (activePotions.reel > Date.now()) {
    bonus += 20;
  }
  
  return bonus;
}

// Update luck display
function updateLuckDisplay() {
  if (luckPercentageSpan) {
    const totalLuck = getTotalLuck() * 100;
    luckPercentageSpan.textContent = totalLuck.toFixed(1);
  }
}

function getRandomRarity() {
  let rand = Math.random();
  let acc = 0;
  
  const luckBonus = getTotalLuck();
  
  for (const rarity of fishRarities) {
    let adjustedChance = rarity.chance;
    
    if (rarity.name !== 'Common') {
      adjustedChance *= (1 + luckBonus);
    } else {
      adjustedChance *= (1 - luckBonus * 0.5);
    }
    
    acc += adjustedChance;
    if (rand < acc) return rarity;
  }
  return fishRarities[0];
}

function getRandomFish(rarity) {
  const arr = fishList[rarity.name];
  return arr[Math.floor(Math.random() * arr.length)];
}

// Update Triforce UI
function updateTriforceUI() {
  const container = document.getElementById('relics-list');
  if (!container) return;

  container.innerHTML = '<h3 style="margin-bottom: 1em;">Triforce Shards</h3>';
  
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
  grid.style.gap = '1em';

  fishList.Triforce.forEach(shard => {
    const isCollected = !!collectedShards[shard.id];
    const shardDiv = document.createElement('div');
    shardDiv.style.padding = '1em';
    shardDiv.style.border = '2px solid gold';
    shardDiv.style.borderRadius = '10px';
    shardDiv.style.backgroundColor = isCollected ? '#ffd700' : '#333';
    shardDiv.style.color = isCollected ? '#000' : '#888';
    shardDiv.style.textAlign = 'center';
    shardDiv.style.fontSize = '0.8em';
    
    shardDiv.innerHTML = `
      <div style="margin-bottom: 0.5em;">
        <img src="assets/Triforce_Shard_${shard.id}.png" alt="Shard ${shard.id}" style="width: 64px; height: 64px; image-rendering: pixelated; ${isCollected ? '' : 'filter: grayscale(100%) brightness(0.5);'}">
      </div>
      <div>${shard.name}</div>
      ${isCollected ? `<div style="margin-top: 0.5em; color: #666;">${shard.type === 'luck' ? `+${shard.value * 100}% Luck` : `+${shard.value} Speed`}</div>` : ''}
    `;
    
    grid.appendChild(shardDiv);
  });
  
  container.appendChild(grid);
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

  const activeRarities = Array.from(document.querySelectorAll('.rarity-filter:checked')).map(cb => cb.dataset.rarity);
  const showShinyOnly = document.getElementById('shiny-filter')?.checked;

  let table = document.createElement('table');
  table.className = 'inventory-table';
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  
  let thead = document.createElement('thead');
  let headerRow = document.createElement('tr');
  
  const sortState = {
    column: localStorage.getItem('inventorySortColumn') || '',
    direction: localStorage.getItem('inventorySortDirection') || 'asc'
  };

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
  
  let tbody = document.createElement('tbody');
  let hasResults = false;
  
  let inventoryArray = Object.entries(inventory).map(([fishKey, entry]) => ({
    key: fishKey,
    ...entry
  }));

  inventoryArray = inventoryArray.filter(entry => {
    const isShiny = entry.fishName.endsWith(' (shiny)');
    const isTriforce = entry.rarity.name === 'Triforce';
    
    if (searchTerm && !entry.fishName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (showShinyOnly && !isShiny) {
      return false;
    }
    
    if (activeRarities.length > 0 && !activeRarities.includes(entry.rarity.name)) {
      return false;
    }
    
    return true;
  });

  if (sortState.column) {
    inventoryArray.sort((a, b) => {
      let comparison = 0;
      switch (sortState.column) {
        case 'name':
          comparison = a.fishName.localeCompare(b.fishName);
          break;
        case 'rarity':
          const rarityA = fishRarities.findIndex(r => r.name === a.rarity.name);
          const rarityB = fishRarities.findIndex(r => r.name === b.rarity.name);
          const isShinyA = a.fishName.endsWith(' (shiny)');
          const isShinyB = b.fishName.endsWith(' (shiny)');
          
          if (activeRarities.length > 0) {
            if (isShinyA !== isShinyB) {
              return isShinyA ? -1 : 1;
            }
          }
          
          if (isShinyA === isShinyB) {
            comparison = rarityA - rarityB;
          } else {
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
    const isShiny = entry.fishName.endsWith(' (shiny)');
    const isTriforce = entry.rarity.name === 'Triforce';
    const shinyLabel = isShiny ? ` <span class="shiny-glow">(shiny)</span>` : '';
    let nameTd = document.createElement('td');
    nameTd.innerHTML = `<span style="color:${entry.rarity.color};font-weight:bold;">${entry.fishName.replace(' (shiny)','')}</span>${shinyLabel}`;
    row.appendChild(nameTd);
    
    let rarityTd = document.createElement('td');
    rarityTd.innerHTML = `<span style="color:${entry.rarity.color};font-weight:bold;">${entry.rarity.name}</span>`;
    row.appendChild(rarityTd);
    
    let countTd = document.createElement('td');
    countTd.textContent = entry.count;
    row.appendChild(countTd);
    
    let shinyTd = document.createElement('td');
    if (!isShiny && !isTriforce) {
      const btn = document.createElement('button');
      btn.className = 'shiny-craft-btn';
      btn.textContent = 'Make Shiny';
      btn.disabled = entry.count < 10;
      btn.onclick = () => {
        if (entry.count >= 10) {
          inventory[entry.key].count -= 10;
          
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

// INDEX DISPLAY
function updateIndexDisplay() {
  const indexList = document.getElementById('index-list');
  if (!indexList) return;

  if (Object.keys(inventory).length === 0) {
    indexList.textContent = 'No fish collected yet.';
    return;
  }

  indexList.innerHTML = '';

  fishRarities.forEach(rarity => {
    const rarityFish = Object.values(inventory)
      .filter(f => f.rarity.name === rarity.name)
      .sort((a, b) => a.fishName.localeCompare(b.fishName));

    if (rarityFish.length === 0) return;

    const rarityHeader = document.createElement('h3');
    rarityHeader.textContent = rarity.name;
    rarityHeader.style.color = rarity.color;
    rarityHeader.style.margin = '0.5em 0 0.2em 0';
    indexList.appendChild(rarityHeader);

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

// STATS DISPLAY (replacing Mastery)
function updateStatsDisplay() {
  const statsList = document.getElementById('mastery-list');
  if (!statsList) return;
  
  statsList.innerHTML = `
    <h3 style="margin-bottom: 1em;">Fish Statistics</h3>
    <div style="display: grid; gap: 1em;">
      <div style="background: rgba(0,0,0,0.3); padding: 1em; border-radius: 8px;">
        <div style="font-size: 1.5em; color: #ffd700;">🎣 ${timesFished}</div>
        <div style="color: #aaa; font-size: 0.9em;">Times Fished</div>
      </div>
      <div style="background: rgba(0,0,0,0.3); padding: 1em; border-radius: 8px;">
        <div style="font-size: 1.5em; color: #4a90a4;">🐟 ${lifetimeFishCount}</div>
        <div style="color: #aaa; font-size: 0.9em;">Fish Caught</div>
      </div>
      <div style="background: rgba(0,0,0,0.3); padding: 1em; border-radius: 8px;">
        <div style="font-size: 1.5em; color: #8e44ad;">📦 ${Object.keys(inventory).length}</div>
        <div style="color: #aaa; font-size: 0.9em;">Unique Fish</div>
      </div>
    </div>
  `;
}

// Add search and filter functionality
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('fish-search');
  const searchBtn = document.getElementById('search-btn');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const rarityFilters = document.querySelectorAll('.rarity-filter');
  const shinyFilter = document.getElementById('shiny-filter');
  
  const updateWithFilters = () => {
    updateInventoryDisplay(searchInput?.value || '');
  };

  const resetFilters = () => {
    if (searchInput) searchInput.value = '';
    
    rarityFilters.forEach(filter => {
      filter.checked = false;
    });
    
    if (shinyFilter) shinyFilter.checked = false;
    
    localStorage.setItem('inventorySortColumn', 'rarity');
    localStorage.setItem('inventorySortDirection', 'asc');
    
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

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetFilters);
  }
  
  rarityFilters.forEach(filter => {
    filter.addEventListener('change', updateWithFilters);
  });
  
  if (shinyFilter) {
    shinyFilter.addEventListener('change', updateWithFilters);
  }
  
  // Update stats display when tab is clicked
  const masteryTab = document.querySelector('[data-tab="mastery"]');
  if (masteryTab) {
    masteryTab.addEventListener('click', updateStatsDisplay);
  }
});

// Active potions store end times
let activePotions = {
  luck: 0,
  reel: 0
};

const potionDuration = 5 * 60 * 1000;

window.buyPotion = function(type) {
  const cost = type === 'luck' ? 3000 : 5000;

  if (currencyCount < cost) {
    alert("Not enough rupees!");
    return;
  }

  currencyCount -= cost;
  coinCountSpan.textContent = formatNumber(currencyCount);
  const now = Date.now();
  activePotions[type] = now + potionDuration;

  alert(`${type === 'luck' ? "Luck Potion" : "Reel Speed Potion"} activated for 5 minutes!`);
  updateLuckDisplay();
  updateReelSpeedCounter();
  saveState();
  updateTimers();
}

function updateTimers() {
  const now = Date.now();

  const luckElem = document.getElementById('luck-timer');
  if (luckElem) {
    if (activePotions.luck > now) {
      const seconds = Math.ceil((activePotions.luck - now) / 1000);
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      luckElem.textContent = `Luck Potion: ${min}:${sec.toString().padStart(2,'0')} remaining`;
    } else {
      luckElem.textContent = 'Inactive';
    }
  }

  const reelElem = document.getElementById('reel-timer');
  if (reelElem) {
    if (activePotions.reel > now) {
      const seconds = Math.ceil((activePotions.reel - now) / 1000);
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      reelElem.textContent = `Reel Speed Potion: ${min}:${sec.toString().padStart(2,'0')} remaining`;
    } else {
      reelElem.textContent = 'Inactive';
    }
  }
  
  updateLuckDisplay();
  updateReelSpeedCounter();
}

setInterval(updateTimers, 1000);

function getFishingTime() {
  const baseTime = 5000;
  const reelBonus = getReelSpeedBonus();
  const reduction = Math.min(reelBonus * 0.02, 0.90);
  return Math.max(baseTime * (1 - reduction), 500);
}

function catchFish() {
  // Anti-autoclicker
  const now = Date.now();
  if (now - lastClickTime < 100) {
    clickCount++;
    if (clickCount > 10) {
      fishingStatus.textContent = '⚠️ Suspicious clicking detected!';
      setTimeout(() => {
        fishingStatus.textContent = 'Ready to fish!';
      }, 2000);
      return;
    }
  } else {
    clickCount = 0;
  }
  lastClickTime = now;

  const fishBtn = document.getElementById('fish-btn');
  if (fishBtn) fishBtn.disabled = true;
  fishingStatus.textContent = 'Fishing...';
  timesFished++;
  
  const fishImg = document.getElementById('main-fish-img');
  if (fishImg) {
    fishImg.classList.remove('pulse');
    void fishImg.offsetWidth;
    fishImg.classList.add('pulse');
  }
  
  const fishingTime = getFishingTime();
  
  setTimeout(() => {
    fishCount++;
    lifetimeFishCount++;
    pullsUntilShiny--;
    
    if (lifetimeFishCountSpan) lifetimeFishCountSpan.textContent = lifetimeFishCount;
    
    const rarity = getRandomRarity();
    let fishData = getRandomFish(rarity);
    
    let displayName = fishData;
    let isTriforce = false;
    let shardData = null;
    
    if (typeof fishData === 'object' && fishData.name) {
      displayName = fishData.name;
      isTriforce = true;
      shardData = fishData;
      
      // Collect triforce shard
      if (!collectedShards[fishData.id]) {
        collectedShards[fishData.id] = fishData;
        updateTriforceUI();
        updateLuckDisplay();
        updateReelSpeedCounter();
      }
    }

    let isShiny = false;
    if (pullsUntilShiny <= 0 && !isTriforce) {
      isShiny = true;
      pullsUntilShiny = 500;
      displayName += ' (shiny)';
    }

    fishingStatus.innerHTML = `Caught a <span style="color:${rarity.color}; font-weight:bold;">${rarity.name}</span> <span style="font-style:italic">${displayName}</span>!`;

    currencyCount += rarity.baseCurrency;
    coinCountSpan.textContent = formatNumber(currencyCount);
    
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
    updateLuckButtons();
    updateShinyPullCounter();
    updateIndexDisplay();
    updateStatsDisplay();
    saveState();
    
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
    
    if (coinCountSpan) {
      coinCountSpan.classList.add('counter-number');
      wobbleElement(coinCountSpan);
    }
    
    const fishKey = `${rarity.name}|${displayName}`;
    if (!inventory[fishKey]) {
      inventory[fishKey] = { fishName: displayName, rarity, count: 1 };
    } else {
      inventory[fishKey].count++;
    }
    
    addRecentFish(displayName, 1);
    updateInventoryDisplay();
    saveState();
    animateRecentFish();
    
    setTimeout(() => {
      fishingStatus.textContent = 'Ready to fish!';
      if (fishBtn) fishBtn.disabled = false;
    }, 1200);
  }, fishingTime);
}

// CHESTS (replacing Crates)
function setupChests() {
  const cratesList = document.getElementById('crates-list');
  if (!cratesList) return;
  
  cratesList.innerHTML = `
    <h3 style="margin-bottom: 1em;">Treasure Chests</h3>
    <div style="display: grid; gap: 1em;">
      <div style="background: rgba(0,0,0,0.3); padding: 1.5em; border-radius: 8px; border: 2px solid #8B7355;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1em; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 1em;">
            <img src="assets/smallchest.png" alt="Small Chest" style="width: 64px; height: 64px; image-rendering: pixelated;">
            <div>
              <div style="font-size: 1.3em; margin-bottom: 0.3em;">Small Chest</div>
              <div style="color: #aaa; font-size: 0.9em;">Cost: 50 Mon</div>
              <div style="color: #aaa; font-size: 0.8em; margin-top: 0.3em;">Rewards: 100-600 Rupees</div>
            </div>
          </div>
          <button id="buy-small-chest" class="pixel-btn" style="padding: 0.8em 1.5em;">Open</button>
        </div>
      </div>
      
      <div style="background: rgba(0,0,0,0.3); padding: 1.5em; border-radius: 8px; border: 2px solid #C0C0C0;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1em; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 1em;">
            <img src="assets/bigchest.png" alt="Big Chest" style="width: 64px; height: 64px; image-rendering: pixelated;">
            <div>
              <div style="font-size: 1.3em; margin-bottom: 0.3em;">Big Chest</div>
              <div style="color: #aaa; font-size: 0.9em;">Cost: 100 Mon</div>
              <div style="color: #aaa; font-size: 0.8em; margin-top: 0.3em;">Rewards: Mon, Luck Boost, or Rupees</div>
            </div>
          </div>
          <button id="buy-big-chest" class="pixel-btn" style="padding: 0.8em 1.5em;">Open</button>
        </div>
      </div>
      
      <div style="background: rgba(0,0,0,0.3); padding: 1.5em; border-radius: 8px; border: 2px solid #FFD700;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1em; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 1em;">
            <img src="assets/bosschest.png" alt="Boss Chest" style="width: 64px; height: 64px; image-rendering: pixelated;">
            <div>
              <div style="font-size: 1.3em; margin-bottom: 0.3em;">Boss Chest</div>
              <div style="color: #aaa; font-size: 0.9em;">Cost: 250 Mon</div>
              <div style="color: #aaa; font-size: 0.8em; margin-top: 0.3em;">Rewards: Shards, Reel Speed, Luck, or Mon</div>
            </div>
          </div>
          <button id="buy-boss-chest" class="pixel-btn" style="padding: 0.8em 1.5em;">Open</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('buy-small-chest')?.addEventListener('click', () => openChest('small'));
  document.getElementById('buy-big-chest')?.addEventListener('click', () => openChest('big'));
  document.getElementById('buy-boss-chest')?.addEventListener('click', () => openChest('boss'));
}

function openChest(type) {
  const costs = { small: 50, big: 100, boss: 250 };
  const cost = costs[type];
  
  if (gemCount < cost) {
    alert('Not enough Mon!');
    return;
  }
  
  gemCount -= cost;
  gemCountSpan.textContent = formatNumber(gemCount);
  
  let rewardText = '';
  const rand = Math.random();
  
  if (type === 'small') {
    const rupees = Math.floor(Math.random() * 501) + 100;
    currencyCount += rupees;
    rewardText = `${rupees} Rupees`;
  } else if (type === 'big') {
    if (rand < 0.3) {
      const mon = Math.floor(Math.random() * 21) + 10;
      gemCount += mon;
      rewardText = `${mon} Mon`;
    } else if (rand < 0.5) {
      const luck = Math.floor(Math.random() * 5) + 1;
      rewardText = `+${luck}% Luck Boost (temporary - not implemented yet)`;
    } else {
      const rupees = Math.floor(Math.random() * 1001) + 500;
      currencyCount += rupees;
      rewardText = `${rupees} Rupees`;
    }
  } else { // boss
    if (rand < 0.2) {
      const uncollectedShards = fishList.Triforce.filter(s => !collectedShards[s.id]);
      if (uncollectedShards.length > 0) {
        const shard = uncollectedShards[Math.floor(Math.random() * uncollectedShards.length)];
        collectedShards[shard.id] = shard;
        updateTriforceUI();
        updateLuckDisplay();
        updateReelSpeedCounter();
        rewardText = `${shard.name}! (+${shard.type === 'luck' ? (shard.value * 100) + '%' : shard.value} ${shard.type})`;
      } else {
        const mon = Math.floor(Math.random() * 51) + 50;
        gemCount += mon;
        rewardText = `${mon} Mon (all shards collected!)`;
      }
    } else if (rand < 0.4) {
      const speed = Math.floor(Math.random() * 6) + 5;
      rewardText = `+${speed} Reel Speed (temporary - not implemented yet)`;
    } else if (rand < 0.6) {
      const luck = Math.floor(Math.random() * 5) + 1;
      rewardText = `+${luck}% Luck (temporary - not implemented yet)`;
    } else {
      const mon = Math.floor(Math.random() * 51) + 30;
      gemCount += mon;
      rewardText = `${mon} Mon`;
    }
  }
  
  coinCountSpan.textContent = formatNumber(currencyCount);
  gemCountSpan.textContent = formatNumber(gemCount);
  saveState();
  
  alert(`Chest Opened! You received: ${rewardText}`);
}

// SHOP
function setupShop() {
  const shopList = document.getElementById('shop-list');
  if (!shopList) return;
  
  shopList.innerHTML = '<h3 style="margin-bottom: 1em;">Fish Shop</h3><div id="shop-inventory"></div>';
  updateShopDisplay();
}

function updateShopDisplay() {
  const shopInventory = document.getElementById('shop-inventory');
  if (!shopInventory) return;
  
  const sellableFish = Object.entries(inventory).filter(([key, fish]) => {
    return fish.rarity.name !== 'Triforce' && fish.count > 0;
  }).sort((a, b) => {
    const rarityA = fishRarities.findIndex(r => r.name === a[1].rarity.name);
    const rarityB = fishRarities.findIndex(r => r.name === b[1].rarity.name);
    return rarityB - rarityA;
  });
  
  if (sellableFish.length === 0) {
    shopInventory.innerHTML = '<div style="padding: 2em; text-align: center; color: #aaa;">No fish to sell!</div>';
    return;
  }
  
  shopInventory.innerHTML = '';
  
  sellableFish.forEach(([key, fish]) => {
    const fishDiv = document.createElement('div');
    fishDiv.style.background = 'rgba(0,0,0,0.3)';
    fishDiv.style.padding = '1em';
    fishDiv.style.marginBottom = '0.8em';
    fishDiv.style.borderRadius = '8px';
    fishDiv.style.display = 'flex';
    fishDiv.style.justifyContent = 'space-between';
    fishDiv.style.alignItems = 'center';
    fishDiv.style.flexWrap = 'wrap';
    fishDiv.style.gap = '0.5em';
    
    fishDiv.innerHTML = `
      <div>
        <div style="color: ${fish.rarity.color}; font-weight: bold; margin-bottom: 0.3em;">${fish.fishName}</div>
        <div style="color: #aaa; font-size: 0.9em;">Count: ${fish.count}</div>
      </div>
      <div style="display: flex; gap: 0.5em;">
        <button class="sell-rupee-btn pixel-btn" data-key="${key}" style="padding: 0.5em 1em; background: #4a90a4;">
          Sell for ${fish.rarity.baseCurrency} 💰
        </button>
        <button class="sell-mon-btn pixel-btn" data-key="${key}" style="padding: 0.5em 1em; background: #8e44ad;">
          Sell for ${fish.rarity.monValue} 💎
        </button>
      </div>
    `;
    
    shopInventory.appendChild(fishDiv);
  });
  
  document.querySelectorAll('.sell-rupee-btn').forEach(btn => {
    btn.addEventListener('click', () => sellFish(btn.dataset.key, false));
  });
  
  document.querySelectorAll('.sell-mon-btn').forEach(btn => {
    btn.addEventListener('click', () => sellFish(btn.dataset.key, true));
  });
}

function sellFish(fishKey, forMon = false) {
  const fish = inventory[fishKey];
  if (!fish || fish.count === 0) return;
  
  if (fish.rarity.name === 'Triforce') {
    alert("Can't sell Triforce shards!");
    return;
  }
  
  if (forMon) {
    gemCount += fish.rarity.monValue;
    gemCountSpan.textContent = formatNumber(gemCount);
  } else {
    currencyCount += fish.rarity.baseCurrency;
    coinCountSpan.textContent = formatNumber(currencyCount);
  }
  
  inventory[fishKey].count--;
  
  if (inventory[fishKey].count === 0) {
    delete inventory[fishKey];
  }
  
  updateShopDisplay();
  updateInventoryDisplay();
  saveState();
}

// XP bar state
let xp = 0;
let level = 1;
const maxLevel = 100;

loadState();

function updateXPBar() {
  const progress = document.getElementById('xp-progress');
  const levelSpan = document.getElementById('xp-level');
  const progressText = document.getElementById('xp-progress-text');
  if (!progress || !levelSpan || !progressText) return;
  level = Math.min(level, maxLevel);
  let percent = Math.max(0, Math.min(100, xp));
  progress.style.width = percent + '%';
  levelSpan.textContent = level;
  progressText.textContent = xp + '/100';
}

updateXPBar();

function formatNumber(n) {
  if (n < 10000) return n.toLocaleString();
  if (n < 1000000) return Math.floor(n / 1000) + 'k';
  if (n < 1000000000) return Math.floor(n / 1000000) + 'M';
  return n.toLocaleString();
}

coinCountSpan.textContent = formatNumber(currencyCount);
gemCountSpan.textContent = formatNumber(gemCount);
updateInventoryDisplay();

function updateAutoFishCostColor() {
  const costSpan = document.getElementById('auto-fish-cost');
  if (!costSpan) return;
  if (autoFishUnlocked) {
    costSpan.classList.remove('cost-red');
    costSpan.classList.add('cost-white');
    costSpan.textContent = '-';
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

if (autoFishUpgradeBtn) {
  autoFishUpgradeBtn.addEventListener('click', function() {
    if (!autoFishUnlocked && currencyCount >= 15000) {
      currencyCount -= 15000;
      autoFishUnlocked = true;
      saveState();
      updateUpgradeMapButton();
      coinCountSpan.textContent = formatNumber(currencyCount);
      updateAutoFishCostColor();
      updateAutoFishUIButton();
    }
  });
}

updateUpgradeMapButton();

function updateCoinAndAutoFishTile() {
  coinCountSpan.textContent = formatNumber(currencyCount);
  updateUpgradeMapButton();
}

import { setupSettingsPanel } from './settings.js';
setupSettingsPanel({
  getState: () => ({ 
    currencyCount, gemCount, fishCount, inventory, xp, level, 
    autoFishUnlocked, reelSpeedLevel, luckLevel, lifetimeFishCount,
    timesFished, collectedShards
  }),
  setState: (updates) => {
    if ('currencyCount' in updates) currencyCount = updates.currencyCount;
    if ('gemCount' in updates) gemCount = updates.gemCount;
    if ('fishCount' in updates) fishCount = updates.fishCount;
    if ('inventory' in updates) Object.assign(inventory, updates.inventory);
    if ('xp' in updates) xp = updates.xp;
    if ('level' in updates) level = updates.level;
    if ('autoFishUnlocked' in updates) autoFishUnlocked = updates.autoFishUnlocked;
    if ('lifetimeFishCount' in updates) lifetimeFishCount = updates.lifetimeFishCount;
    if ('timesFished' in updates) timesFished = updates.timesFished;
    if ('reelSpeedLevel' in updates) reelSpeedLevel = updates.reelSpeedLevel;
    if ('luckLevel' in updates) luckLevel = updates.luckLevel;
    if ('collectedShards' in updates) collectedShards = updates.collectedShards;
  },
  saveState,
  updateUI: () => {
    if (typeof coinCountSpan !== 'undefined') coinCountSpan.textContent = formatNumber(currencyCount);
    if (typeof gemCountSpan !== 'undefined') gemCountSpan.textContent = formatNumber(gemCount);
    if (typeof lifetimeFishCountSpan !== 'undefined') lifetimeFishCountSpan.textContent = lifetimeFishCount;
    updateUpgradeMapButton();
    updateLuckButtons();
    updateReelSpeedButtons();
    updateAutoFishCostColor();
    updateTriforceUI();
    updateLuckDisplay();
  },
  updateAutoFishUIButton: updateAutoFishUIButton,
  updateAutoFishCostColor: updateAutoFishCostColor,
  updateReelSpeedButtons: updateReelSpeedButtons,
  updateLuckButtons: updateLuckButtons
});

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

let autoFishBtnEl = null;
let autoFishActive = false;
let autoFishInterval = null;

function updateAutoFishUIButton() {
  if (!fishBtn) return;
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
          if (fishBtn && !fishBtn.disabled) {
            catchFish();
          }
        }
        autoFishActive = true;
        autoFishBtnEl.textContent = 'Stop Auto';
        autoFishInterval = setInterval(autoFishLoop, getFishingTime() + 1200);
      }
    });
  }
  autoFishBtnEl.style.display = '';
}

updateAutoFishUIButton();

if (fishBtn) {
  fishBtn.addEventListener('click', catchFish);
}

function updateReelSpeedButtons() {
  const btn = document.getElementById('reel-speed-btn');
  const costSpan = document.getElementById('reel-speed-cost');
  const nameTd = document.getElementById('reel-speed-name');
  if (!btn || !costSpan || !nameTd) return;

  if (reelSpeedLevel >= 3) {
    nameTd.textContent = 'Reel Speed III';
    btn.textContent = 'Max Level';
    btn.disabled = true;
    costSpan.classList.remove('cost-red');
    costSpan.classList.add('cost-white');
    costSpan.textContent = '-';
  } else {
    const levels = ['I', 'II', 'III'];
    nameTd.textContent = `Reel Speed ${levels[reelSpeedLevel]}`;
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

const reelSpeedBtn = document.getElementById('reel-speed-btn');
if (reelSpeedBtn) {
  reelSpeedBtn.addEventListener('click', () => {
    if (reelSpeedLevel < 3 && currencyCount >= reelSpeedCosts[reelSpeedLevel]) {
      currencyCount -= reelSpeedCosts[reelSpeedLevel];
      reelSpeedLevel++;
      saveState();
      updateReelSpeedButtons();
      coinCountSpan.textContent = formatNumber(currencyCount);
      updateReelSpeedCounter();
    }
  });
}

function updateLuckButtons() {
  const btn = document.getElementById('luck-btn');
  const costSpan = document.getElementById('luck-cost');
  const nameTd = document.getElementById('luck-name');
  if (!btn || !costSpan || !nameTd) return;

  if (luckLevel >= 3) {
    nameTd.textContent = 'Luck III';
    btn.textContent = 'Max Level';
    btn.disabled = true;
    costSpan.classList.remove('cost-red');
    costSpan.classList.add('cost-white');
    costSpan.textContent = '-';
  } else {
    const levels = ['I', 'II', 'III'];
    nameTd.textContent = `Luck ${levels[luckLevel]}`;
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
  updateLuckDisplay();
}

const luckBtn = document.getElementById('luck-btn');
if (luckBtn) {
  luckBtn.addEventListener('click', () => {
    if (luckLevel < 3 && currencyCount >= luckCosts[luckLevel]) {
      currencyCount -= luckCosts[luckLevel];
      luckLevel++;
      saveState();
      updateLuckButtons();
      coinCountSpan.textContent = formatNumber(currencyCount);
      updateLuckDisplay();
    }
  });
}

function updateShinyPullCounter() {
  if (shinyPullCountSpan) {
    shinyPullCountSpan.textContent = `${pullsUntilShiny}`;
  }
}

function updateReelSpeedCounter() {
  const reelSpeedLevelSpan = document.getElementById('reel-speed-level');
  if (reelSpeedLevelSpan) {
    const totalSpeed = 100 + getReelSpeedBonus();
    reelSpeedLevelSpan.textContent = totalSpeed;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  updateReelSpeedCounter();
  updateLuckDisplay();
  setupChests();
  setupShop();
  updateStatsDisplay();
  updateTriforceUI();
  
  // Remove "Fish caught: 1" display
  const fishCaughtDiv = document.getElementById('fish-caught');
  if (fishCaughtDiv) {
    fishCaughtDiv.style.display = 'none';
  }
});

function addRecentFish(fishName, count) {
  if (recentFish.length > 0 && recentFish[0].name === fishName) {
    recentFish[0].count += count;
  } else {
    recentFish.unshift({ name: fishName, count });
  }
  if (recentFish.length > 10) recentFish = recentFish.slice(0, 10);
  updateRecentFishDisplay();
}

function updateRecentFishDisplay() {
  const container = document.getElementById('recent-fish-container');
  if (!container) return;
  container.innerHTML = '';
  recentFish.forEach((entry, idx) => {
    const div = document.createElement('div');
    const opacity = 1 - idx * 0.08;
    const fontSize = 1 - idx * 0.05;
    div.style.opacity = opacity;
    div.style.fontSize = fontSize + 'em';
    div.style.transition = 'all 0.5s cubic-bezier(.4,2,.6,1)';
    div.className = 'recent-fish-entry';
    
    let fishName = entry.name;
    let isShiny = false;
    let baseName = fishName;
    if (fishName.endsWith(' (shiny)')) {
      isShiny = true;
      baseName = fishName.replace(' (shiny)', '');
    }
    
    let rarityColor = '#fffbe7';
    for (const rarity of fishRarities) {
      if (fishList[rarity.name]) {
        const found = fishList[rarity.name].find(f => {
          if (typeof f === 'string') return f === baseName;
          if (typeof f === 'object') return f.name === baseName;
          return false;
        });
        if (found) {
          rarityColor = rarity.color;
          break;
        }
      }
    }
    
    let nameHtml = `<span style="color:${rarityColor};font-weight:bold;">${baseName}</span>`;
    if (isShiny) nameHtml += ' <span class="shiny-glow">(shiny)</span>';
    div.innerHTML = `${nameHtml} <span style="color:#ffd700;">x${entry.count}</span>`;
    container.appendChild(div);
  });
}

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

window.addEventListener('DOMContentLoaded', updateRecentFishDisplay);

const bgMusic = document.getElementById('bg-music');
const musicVolumeSlider = document.getElementById('music-volume');

let savedVolume = parseFloat(localStorage.getItem('fishyMusicVolume'));
if (isNaN(savedVolume)) savedVolume = 0.25;
if (bgMusic) bgMusic.volume = savedVolume;
if (musicVolumeSlider) musicVolumeSlider.value = savedVolume;

function enableMusicPlayback() {
  if (bgMusic && bgMusic.paused) {
    bgMusic.play().catch(()=>{});
  }
  window.removeEventListener('pointerdown', enableMusicPlayback);
  window.removeEventListener('keydown', enableMusicPlayback);
}
window.addEventListener('pointerdown', enableMusicPlayback);
window.addEventListener('keydown', enableMusicPlayback);

if (musicVolumeSlider) {
  musicVolumeSlider.addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (bgMusic) bgMusic.volume = v;
    localStorage.setItem('fishyMusicVolume', v);
  });
}

const clickSound = document.getElementById('click-sound');
const closeSound = document.getElementById('close-sound');
const uiVolumeSlider = document.getElementById('ui-volume');

let savedUIVolume = parseFloat(localStorage.getItem('fishyUIVolume'));
if (isNaN(savedUIVolume)) savedUIVolume = 0.5;
if (clickSound) clickSound.volume = savedUIVolume;
if (closeSound) closeSound.volume = savedUIVolume;
if (uiVolumeSlider) uiVolumeSlider.value = savedUIVolume;

if (uiVolumeSlider) {
  uiVolumeSlider.addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (clickSound) clickSound.volume = v;
    if (closeSound) closeSound.volume = v;
    localStorage.setItem('fishyUIVolume', v);
  });
}

document.querySelectorAll('button:not(#close-settings-btn)').forEach(button => {
  button.addEventListener('click', () => {
    if (clickSound) {
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {});
    }
  });
});

const closeSettingsBtn = document.getElementById('close-settings-btn');
if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener('click', () => {
    if (closeSound) {
      closeSound.currentTime = 0;
      closeSound.play().catch(() => {});
    }
  });
}

function wobbleElement(element) {
  if (!element) return;
  element.style.animation = 'none';
  void element.offsetWidth;
  element.style.animation = 'wobble 0.5s cubic-bezier(.36,.07,.19,.97) both';
}

document.querySelectorAll('.rarity-filter, #shiny-filter').forEach(checkbox => {
  checkbox.addEventListener('change', function() {
    const tickSound = document.getElementById('tick-sound');
    if (tickSound) {
      tickSound.currentTime = 0;
      tickSound.play().catch(() => {});
    }
  });
});
