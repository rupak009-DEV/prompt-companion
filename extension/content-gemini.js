// Content script for Gemini (gemini.google.com)
(function () {
  const ICON_WAND = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 4-1.4 1.4M5.5 18.5 18 6l-1-1L4.5 17.5l1 1z"/><path d="m14.5 6.5 3 3"/></svg>`;
  const ICON_SIDEBAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`;

  let btnRowRef = null;
  let lastInputEl = null;

  function getInputEl() {
    // Gemini uses various contenteditable and textarea elements
    const selectors = [
      // Rich text editor variants
      '.ql-editor[contenteditable="true"]',
      'rich-textarea .ql-editor[contenteditable="true"]',
      'rich-textarea div[contenteditable="true"]',
      'div.ql-editor[contenteditable="true"]',
      // Aria-label based selectors
      'div[contenteditable="true"][aria-label*="Enter a prompt"]',
      'div[contenteditable="true"][aria-label*="prompt"]',
      'div[contenteditable="true"][aria-label*="Ask"]',
      'div[contenteditable="true"][aria-label*="enter"]',
      // Data attribute selectors
      'div[contenteditable="true"][data-placeholder]',
      // Role-based
      'div[contenteditable="true"][role="textbox"]',
      // Textarea fallback
      '.text-input-field textarea',
      'textarea[aria-label*="prompt"]',
      'textarea[aria-label*="Ask"]',
      'textarea[placeholder]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }
    // Last resort: any visible contenteditable with reasonable size
    const all = document.querySelectorAll('div[contenteditable="true"]');
    for (const el of all) {
      if (el.offsetParent !== null && el.clientHeight > 15 && el.clientWidth > 100) return el;
    }
    return null;
  }

  function getPromptText(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value;
    return el.innerText || el.textContent || "";
  }

  function setPromptText(el, text) {
    if (!el) return;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      el.value = text;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      el.focus();
      el.innerHTML = "";
      const p = document.createElement("p");
      p.textContent = text;
      el.appendChild(p);
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    }
  }

  function findInsertionPoint(inputEl) {
    // Walk up to find a suitable container
    let el = inputEl;
    for (let i = 0; i < 15; i++) {
      if (!el.parentElement) break;
      el = el.parentElement;
      const tag = el.tagName.toLowerCase();
      // Look for form-like containers
      if (tag === "form") return el;
      if (tag === "rich-textarea") return el;
      // Look for containers with specific class patterns
      if (el.classList.contains("input-area") ||
          el.classList.contains("input-area-container") ||
          el.classList.contains("text-input-field") ||
          el.classList.contains("input-wrapper")) return el;
      // Check if this element contains the rich-textarea
      if (el.querySelector("rich-textarea")) return el;
      // Look for footer-like containers near the input
      if (el.querySelector('[aria-label*="Send"]') || el.querySelector('button[aria-label*="Send"]')) return el;
    }
    // Fallback: use the input's closest form or nearest ancestor
    return inputEl.closest("form") || inputEl.parentElement?.parentElement?.parentElement || inputEl.parentElement;
  }

  function createButtons(inputEl) {
    // Remove stale reference
    if (btnRowRef && !document.body.contains(btnRowRef)) {
      btnRowRef = null;
    }
    if (btnRowRef) return;

    const row = document.createElement("div");
    row.className = "pe-btn-row";
    row.id = "pe-gemini-btn-row";
    // Force visibility with aggressive inline styles
    row.style.cssText = `
      position: relative !important;
      z-index: 2147483647 !important;
      display: flex !important;
      padding: 6px 8px !important;
      margin: 4px 0 !important;
      gap: 6px !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      height: auto !important;
      overflow: visible !important;
      max-height: none !important;
      transform: none !important;
      clip: auto !important;
    `;

    // Push to Sidebar button
    const sidebarBtn = mkBtn(ICON_SIDEBAR + " Sidebar", "pe-btn pe-btn--quick", "Push prompt to sidebar");
    sidebarBtn.style.cssText += "background: linear-gradient(135deg, #059669, #0d9488) !important; color: #fff !important;";
    sidebarBtn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const prompt = getPromptText(inputEl);
      if (!prompt.trim()) return;
      chrome.runtime.sendMessage({ type: "OPEN_SIDEBAR", prompt, mode: "quick" });
    });

    const quickBtn = mkBtn(ICON_WAND + " Enhance", "pe-btn pe-btn--quick", "Quick enhance prompt");
    quickBtn.addEventListener("click", async (e) => {
      e.preventDefault(); e.stopPropagation();
      const prompt = getPromptText(inputEl);
      if (!prompt.trim()) return;
      quickBtn.classList.add("pe-btn--loading");
      quickBtn.innerHTML = `⏳ Enhancing...`;
      try {
        const enhanced = await quickEnhance(prompt, "Gemini");
        setPromptText(inputEl, enhanced);
      } catch (err) {
        console.error("PE: quick enhance failed", err);
      }
      quickBtn.classList.remove("pe-btn--loading");
      quickBtn.innerHTML = ICON_WAND + " Enhance";
    });

    const assistedBtn = mkBtn("🔍 Assisted", "pe-btn pe-btn--assisted", "Open Assisted mode in sidebar");
    assistedBtn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const prompt = getPromptText(inputEl);
      if (!prompt.trim()) return;
      chrome.runtime.sendMessage({ type: "OPEN_SIDEBAR", prompt, mode: "assisted", autoEnhance: true });
    });

    const wizardBtn = mkBtn("📖 Wizard", "pe-btn pe-btn--wizard", "Open Wizard mode in sidebar");
    wizardBtn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const prompt = getPromptText(inputEl);
      if (!prompt.trim()) return;
      chrome.runtime.sendMessage({ type: "OPEN_SIDEBAR", prompt, mode: "wizard", autoEnhance: true });
    });

    row.appendChild(sidebarBtn);
    row.appendChild(quickBtn);
    row.appendChild(assistedBtn);
    row.appendChild(wizardBtn);

    // Insert the row after the input container
    const container = findInsertionPoint(inputEl);
    if (container && container.parentElement) {
      container.parentElement.insertBefore(row, container.nextSibling);
    } else if (container) {
      container.appendChild(row);
    } else {
      // Last resort: append after input's parent
      inputEl.parentElement?.appendChild(row);
    }

    btnRowRef = row;
    lastInputEl = inputEl;
  }

  function mkBtn(html, className, title) {
    const btn = document.createElement("button");
    btn.className = className;
    btn.innerHTML = html;
    btn.title = title;
    btn.type = "button";
    // Inline styles to prevent Gemini CSS from hiding buttons
    btn.style.cssText = `
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 5px 12px !important;
      border-radius: 8px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      border: none !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      line-height: 1.4 !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      height: auto !important;
      width: auto !important;
      position: static !important;
      overflow: visible !important;
      color: #fff !important;
    `;
    return btn;
  }

  async function quickEnhance(prompt, targetModel) {
    const config = await chrome.storage.local.get(["session", "supabaseUrl", "supabaseKey"]);
    const url = config.supabaseUrl || "https://gvvkcbsdvhclmkxplsvj.supabase.co";
    const key = config.supabaseKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmtjYnNkdmhjbG1reHBsc3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTEzNzUsImV4cCI6MjA4OTMyNzM3NX0.P9mbTItt7iLnRHarEXPycwmEcJ09JM2s-5xSAPmNCKI";
    const session = config.session;

    const resp = await fetch(`${url}/functions/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || key}`,
      },
      body: JSON.stringify({
        originalPrompt: prompt,
        targetModel: targetModel || "Gemini",
        parameters: { language: "English", wordLimit: "" },
      }),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "", result = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") break;
        try {
          const parsed = JSON.parse(json);
          const c = parsed.choices?.[0]?.delta?.content;
          if (c) result += c;
        } catch {}
      }
    }
    return result;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "REPLACE_PROMPT") {
      const el = lastInputEl || getInputEl();
      if (el) setPromptText(el, msg.enhancedPrompt);
    }
  });

  function tryInject() {
    const el = getInputEl();
    if (!el) return;
    // Re-inject if our buttons were removed
    if (!btnRowRef || !document.body.contains(btnRowRef)) {
      btnRowRef = null;
      createButtons(el);
    }
  }

  // Use MutationObserver with requestAnimationFrame for stability
  const observer = new MutationObserver(() => {
    if (observer._raf) cancelAnimationFrame(observer._raf);
    observer._raf = requestAnimationFrame(tryInject);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Backup polling in case observer misses changes
  setInterval(tryInject, 2000);

  // Initial attempts with delays for SPA navigation
  tryInject();
  setTimeout(tryInject, 1000);
  setTimeout(tryInject, 2500);
  setTimeout(tryInject, 5000);
})();
