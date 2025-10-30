export function setupSettingsPanel({ saveState, updateUI }) {
  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const closeSettingsBtn = document.getElementById('close-settings-btn');

  if (settingsBtn && settingsPanel && closeSettingsBtn) {
    settingsBtn.addEventListener('click', () => {
      settingsPanel.style.display = 'block';
    });
    closeSettingsBtn.addEventListener('click', () => {
      settingsPanel.style.display = 'none';
    });
  }
  saveState();
  updateUI();
}
