document.getElementById('saveBtn').addEventListener('click', () => {
  const active = document.getElementById('activeTime').value;
  const lock = document.getElementById('lockTime').value;

  // Save to Chrome storage
  chrome.storage.local.set({ 
    activeMins: parseInt(active), 
    lockMins: parseInt(lock),
    isLocked: false 
  }, () => {
    alert("Focus settings saved!");
  });
});