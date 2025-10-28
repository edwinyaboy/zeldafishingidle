// Settings panel logic and cheat console
export function setupSettingsPanel({ getState, setState, saveState, updateUI, updateAutoFishUIButton, updateAutoFishCostColor, updateReelSpeedButtons, updateLuckButtons }) {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const cheatForm = document.getElementById('cheat-form');
  const cheatInput = document.getElementById('cheat-input');
  const cheatOutput = document.getElementById('cheat-output');

  if (settingsBtn && settingsPanel && closeSettingsBtn) {
    settingsBtn.addEventListener('click', () => {
      settingsPanel.style.display = 'block';
    });
    closeSettingsBtn.addEventListener('click', () => {
      settingsPanel.style.display = 'none';
    });
  }

  if (cheatForm && cheatInput && cheatOutput) {
    cheatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const command = cheatInput.value.trim();
      const parts = command.split(' ');
      
      if (parts[0] === '/set') {
        if (parts[1] === 'coins') {
          const amount = parseInt(parts[2]);
          if (!isNaN(amount) && amount >= 0) {
            setState({ currencyCount: amount });
            cheatOutput.textContent = `Set coins to ${formatNumber(amount)}`;
          } else {
            cheatOutput.textContent = 'Invalid amount';
          }
        } else if (parts[1] === 'gems') {
          const amount = parseInt(parts[2]);
          if (!isNaN(amount) && amount >= 0) {
            setState({ gemCount: amount });
            cheatOutput.textContent = `Set gems to ${formatNumber(amount)}`;
            // Add wobble animation to gem counter number
            const gemCount = document.querySelector('#gem-count');
            if (gemCount) {
              gemCount.classList.add('counter-number');
              gemCount.style.animation = 'none';
              void gemCount.offsetWidth;
              gemCount.style.animation = 'wobble 0.5s cubic-bezier(.36,.07,.19,.97) both';
            }
          } else {
            cheatOutput.textContent = 'Invalid amount';
          }
        } else if (parts[1] === 'fish') {
          const amount = parseInt(parts[2]);
          if (!isNaN(amount) && amount >= 0) {
            setState({ fishCount: amount });
            cheatOutput.textContent = `Set fish count to ${formatNumber(amount)}`;
          } else {
            cheatOutput.textContent = 'Invalid amount';
          }
        } else if (parts[1] === 'level') {
          const amount = parseInt(parts[2]);
          if (!isNaN(amount) && amount >= 1 && amount <= 100) {
            setState({ level: amount });
            cheatOutput.textContent = `Set level to ${amount}`;
          } else {
            cheatOutput.textContent = 'Invalid level (1-100)';
          }
        } else if (parts[1] === 'xp') {
          const amount = parseInt(parts[2]);
          if (!isNaN(amount) && amount >= 0 && amount <= 100) {
            setState({ xp: amount });
            cheatOutput.textContent = `Set XP to ${amount}`;
          } else {
            cheatOutput.textContent = 'Invalid XP (0-100)';
          }
        } else if (parts[1] === 'lifetime') {
          const amount = parseInt(parts[2]);
          if (!isNaN(amount) && amount >= 0) {
            setState({ lifetimeFishCount: amount });
            cheatOutput.textContent = `Set lifetime fish to ${formatNumber(amount)}`;
          } else {
            cheatOutput.textContent = 'Invalid amount';
          }
        } else {
          cheatOutput.textContent = 'Invalid command. Available: coins, gems, fish, level, xp, lifetime';
        }
      } else if (parts[0] === '/remove') {
        if (parts[1] === 'upgrades') {
          // Reset all upgrade states
          const resetState = {
            autoFishUnlocked: false,
            reelSpeedLevel: 0,
            luckLevel: 0 // Add future upgrades here as they are added to the game
          };
          setState(resetState);
          
          // Update all UI elements
          if (typeof updateUI === 'function') updateUI();
          if (typeof updateAutoFishUIButton === 'function') updateAutoFishUIButton();
          if (typeof updateAutoFishCostColor === 'function') updateAutoFishCostColor();
          if (typeof updateReelSpeedButtons === 'function') updateReelSpeedButtons();
          if (typeof updateLuckButtons === 'function') updateLuckButtons();
          
          cheatOutput.textContent = 'All upgrades have been removed';
        } else {
          cheatOutput.textContent = 'Invalid command. Available: upgrades';
        }
      } else {
        cheatOutput.textContent = 'Invalid command. Available commands: /set, /remove';
      }
      
      cheatInput.value = '';
      saveState();
      updateUI();
    });
  }
}
