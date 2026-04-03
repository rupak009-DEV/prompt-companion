// Content script for Gemini (gemini.google.com)
(function () {
  const ICON_WAND = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 4-1.4 1.4M5.5 18.5 18 6l-1-1L4.5 17.5l1 1z"/><path d="m14.5 6.5 3 3"/></svg>`;

  let injected = false;

  function getInputEl() {
    // Gemini uses a rich text editor (contenteditable or a specific element)
    return document.querySelector('.ql-editor[contenteditable="true"]') ||
           document.querySelector('div[contenteditable="true"][aria-label]') ||
           document.querySelector('.text-input-field_textarea-wrapper textarea') ||
           document.querySelector('rich-textarea div[contenteditable="true"]') ||
           document.querySelector('div[contenteditable="true"]');
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
      el.innerHTML = "";
      const p = document.createElement("p");
      p.textContent = text;
      el.appendChild(p);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function createButtons(inputEl) {
    if (document.querySelector('.pe-btn-row')) return;

    const row = document.createElement("div");
    row.className = "pe-btn-row";

    const quickBtn = document.createElement("button");
    quickBtn.className = "pe-btn pe-btn--quick";
    quickBtn.innerHTML = `${ICON_WAND} Enhance`;
    quickBtn.title = "Quick enhance prompt";
    quickBtn.addEventListener("click", async () => {
      const prompt = getPromptText(inputEl);
      if (!prompt.trim()) return;
      quickBtn.classList.add("pe-btn--loading");
      quickBtn.innerHTML = `⏳ Enhancing...`;
      try {
        const enhanced = await quickEnhance(prompt, "Gemini");
        setPromptText(inputEl, enhanced);
      } catch (e) {
        console.error("PE: quick enhance failed", e);
      }
      quickBtn.classList.remove("pe-btn--loading");
      quickBtn.innerHTML = `${ICON_WAND} Enhance`;
    });

    const assistedBtn = document.createElement("button");
    assistedBtn.className = "pe-btn pe-btn--assisted";
    assistedBtn.textContent = "🔍 Assisted";
    assistedBtn.title = "Open Assisted mode in sidebar";
    assistedBtn.addEventListener("click", () => {
      const prompt = getPromptText(inputEl);
      chrome.runtime.sendMessage({ type: "OPEN_SIDEBAR", prompt, mode: "assisted" });
    });

    const wizardBtn = document.createElement("button");
    wizardBtn.className = "pe-btn pe-btn--wizard";
    wizardBtn.textContent = "📖 Wizard";
    wizardBtn.title = "Open Wizard mode in sidebar";
    wizardBtn.addEventListener("click", () => {
      const prompt = getPromptText(inputEl);
      chrome.runtime.sendMessage({ type: "OPEN_SIDEBAR", prompt, mode: "wizard" });
    });

    row.appendChild(quickBtn);
    row.appendChild(assistedBtn);
    row.appendChild(wizardBtn);

    const container = inputEl.closest("form") || inputEl.parentElement;
    if (container) {
      container.parentElement.insertBefore(row, container.nextSibling);
    }
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
    let buf = "";
    let result = "";

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
    if (el && !injected) {
      injected = true;
      createButtons(el);
    }
  }

  const observer = new MutationObserver(tryInject);
  observer.observe(document.body, { childList: true, subtree: true });
  tryInject();
})();
