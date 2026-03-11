// 1. Listen for when a tab is updated (e.g., user types a URL or clicks a link)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  
  // We only run our logic once the page is fully loaded
  if (changeInfo.status === 'complete' && tab.url) {
    
    console.log("🕵️ Monitoring URL: " + tab.url);

    // Flexible keywords to catch subdomains like 'in.pinterest.com'
    const sites = ["instagram", "facebook", "pinterest", "threads"];
    const isDistraction = sites.some(site => tab.url.includes(site));

    if (isDistraction) {
      console.log("🚩 Distraction detected!");

      chrome.storage.local.get(['activeMins', 'lockMins', 'isLocked', 'lockoutUntil'], (data) => {
        const now = Date.now();

        // CHECK 1: Is the user currently in a Lockout period?
        if (data.isLocked && now < data.lockoutUntil) {
          console.log("⛔ SITE LOCKED. Redirecting...");
          chrome.tabs.update(tabId, { url: "https://www.wikipedia.org" });
          return;
        }

        // CHECK 2: If we are past the lockout time, reset the lock
        if (data.isLocked && now >= data.lockoutUntil) {
          console.log("✅ Lockout expired. Resetting status.");
          chrome.storage.local.set({ isLocked: false });
        }

        // CHECK 3: Start the 'Active' timer if not already running
        if (!data.isLocked) {
          const activeTime = data.activeMins || 1; // Default to 1 min if not set
          console.log(`⏱️ Timer started! You have ${activeTime} minute(s) before freeze.`);
          
          // Create a Chrome Alarm (more reliable than setTimeout)
          chrome.alarms.create("focusLockAlarm", { delayInMinutes: parseFloat(activeTime) });
          
          // Save the Tab ID so we know which one to redirect later
          chrome.storage.local.set({ targetTabId: tabId });
        }
      });
    }
  }
});

// 2. This part runs when the Alarm goes off
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "focusLockAlarm") {
    console.log("⏰ ALARM TRIGGERED! Locking site now.");

    chrome.storage.local.get(['lockMins', 'targetTabId'], (data) => {
      const lockDuration = data.lockMins || 5; // Default to 5 mins if not set
      const lockoutEndTime = Date.now() + (lockDuration * 60000);

      // Save the lock state
      chrome.storage.local.set({ 
        isLocked: true, 
        lockoutUntil: lockoutEndTime 
      }, () => {
        console.log(`🔒 Site locked until: ${new Date(lockoutEndTime).toLocaleTimeString()}`);
        
        // Redirect the user
        if (data.targetTabId) {
          chrome.tabs.update(data.targetTabId, { url: "https://www.wikipedia.org" });
        }
      });
    });
  }
});