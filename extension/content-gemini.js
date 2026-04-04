// Content script for Gemini (gemini.google.com)
(function () {
  const ICON_WAND = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 4-1.4 1.4M5.5 18.5 18 6l-1-1L4.5 17.5l1 1z"/><path d="m14.5 6.5 3 3"/></svg>`;
  const ICON_SIDEBAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`;

  let btnRowRef = null;

  function getInputEl() {
    // Try multiple selectors for Gemini's evolving DOM
    const selectors = [
      '.ql-editor[contenteditable="true"]',
      'rich-textarea .ql-editor[contenteditable="true"]',
      'rich-textarea div[contenteditable="true"]',
      'div.ql-editor[contenteditable="true"]',
      'div[contenteditable="true"][aria-label*="Enter a prompt"]',
      'div[contenteditable="true"][aria-label*="prompt"]',
      'div[contenteditable="true"][aria-label*="Ask"]',
      '.text-input-field textarea',
      'div[contenteditable="true"][data-placeholder]',
      'div[contenteditable="true"][role="textbox"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) return el;
    }
    // Last resort: any visible contenteditable
    const all = document.querySelectorAll('div[contenteditable="true"]');
    for (const el of all) {
      if (el.offsetParent !== null && el.clientHeight > 20) return el;
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
    // Walk up to find a suitable parent to append after
    let el = inputEl;
    for (let i = 0; i < 12; i++) {
      if (!el.parentElement) break;
      el = el.parentElement;
      const tag = el.tagName.toLowerCase();
      if (tag === "form" || tag === "rich-textarea" || 
          el.classList.contains("input-area") ||
          el.classList.contains("input-area-container") ||
          el.querySelector("rich-textarea")) {
        return el;
      }
    }
    // Fallback: use the input's grandparent
    return inputEl.closest("form") || inputEl.parentElement?.parentElement || inputEl.parentElement;
  }

  function createButtons(inputEl) {
    if (btnRowRef && document.body.contains(btnRowRef)) return;

    const row = document.createElement("div");
    row.className = "pe-btn-row";
    row.id = "pe-gemini-btn-row";
    row.style.cssText = "position:relative !important; z-index:99999 !important; display:flex !important; padding:6px 8px !important; margin:4px 0 !important;";

    // Push to Sidebar button
    const sidebarBtn = document.createElement("button");
    sidebarBtn.className = "pe-btn pe-btn--quick";
    sidebarBtn.innerHTML = `${ICON_SIDEBAR} Sidebar`;
    sidebarBtn.title = "Push prompt to sidebar (Quick mode)";
    sidebarBtn.style.cssText = "background: linear-gradient(135deg, #059669, #0d9488) !important; color: #fff !important;";
    sidebarBtn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const prompt = getPromptText(inputEl);
      if (!prompt.trim()) return;
      chrome.runtime.sendMessage({ type: "OPEN_SIDEBAR", prompt, mode: "quick" });
    });

    const quickBtn = document.createElement("button");
    quickBtn.className = "pe-btn pe-btn--quick";
    quickBtn.innerHTML = `${ICON_WAND} Enhance`;
    quickBtn.title = "Quick enhance prompt";
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
      quickBtn.innerHTML = `${ICON_WAND} Enhance`;
    });

    const assistedBtn = document.createElement("button");
    assistedBtn.className = "pe-btn pe-btn--assisted";
    assistedBtn.textContent = "🔍 Assisted";
    assistedBtn.title = "Open Assisted mode in sidebar (auto-enhances)";
    assistedBtn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      const prompt = getPromptText(inputEl);
      if (!prompt.trim()) return;
      chrome.runtime.sendMessage({ type: "OPEN_SIDEBAR", prompt, mode: "assisted", autoEnhance: true });
    });

    const wizardBtn = document.createElement("button");
    wizardBtn.className = "pe-btn pe-btn--wizard";
    wizardBtn.textContent = "📖 Wizard";
    wizardBtn.title = "Open Wizard mode in sidebar (auto-enhances)";
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

    const container = findInsertionPoint(inputEl);
    if (container && container.parentElement) {
      container.parentElement.insertBefore(row, container.nextSibling);
    } else if (container) {
      container.appendChild(row);
    }

    btnRowRef = row;
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
      const el = getInputEl();
      if (el) setPromptText(el, msg.enhancedPrompt);
    }
  });

  function tryInject() {
    const el = getInputEl();
    if (!el) return;
    if (!btnRowRef || !document.body.contains(btnRowRef)) {
      btnRowRef = null;
      createButtons(el);
    }
  }

  const observer = new MutationObserver(() => {
    clearTimeout(observer._timer);
    observer._timer = setTimeout(tryInject, 500);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(tryInject, 1500);
  setTimeout(tryInject, 1000);
  setTimeout(tryInject, 3000);
  tryInject();
})();
