// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "OPEN_SIDEBAR") {
    // Always store the pending data first, then open the panel
    const tabId = sender.tab?.id || msg.tabId;
    chrome.storage.local.set({
      pendingPrompt: msg.prompt,
      pendingMode: msg.mode,
      pendingTabId: tabId,
      pendingAutoEnhance: !!msg.autoEnhance,
    }, () => {
      // Open side panel - works whether it's already open or not
      if (tabId) {
        chrome.sidePanel.open({ tabId }).catch(() => {});
      }
      sendResponse({ ok: true });
    });
    return true; // async
  }

  if (msg.type === "PUSH_TO_PAGE") {
    // Forward enhanced prompt to the content script on the active tab
    const tabId = msg.tabId;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: "REPLACE_PROMPT",
        enhancedPrompt: msg.enhancedPrompt,
      });
    }
    sendResponse({ ok: true });
  }

  return true; // keep channel open for async
});
