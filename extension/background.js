// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "OPEN_SIDEBAR") {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    // Store the prompt + mode for the sidebar to pick up
    chrome.storage.local.set({
      pendingPrompt: msg.prompt,
      pendingMode: msg.mode,
      pendingTabId: sender.tab.id,
    });
    sendResponse({ ok: true });
  }

  if (msg.type === "PUSH_TO_PAGE") {
    // Forward enhanced prompt to the content script on the active tab
    chrome.tabs.sendMessage(msg.tabId, {
      type: "REPLACE_PROMPT",
      enhancedPrompt: msg.enhancedPrompt,
    });
    sendResponse({ ok: true });
  }

  return true; // keep channel open for async
});
