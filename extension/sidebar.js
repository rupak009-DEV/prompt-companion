// Sidebar logic for Prompt Enhancer Chrome Extension
const SUPABASE_URL = "https://gvvkcbsdvhclmkxplsvj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmtjYnNkdmhjbG1reHBsc3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTEzNzUsImV4cCI6MjA4OTMyNzM3NX0.P9mbTItt7iLnRHarEXPycwmEcJ09JM2s-5xSAPmNCKI";
const CHAT_URL = `${SUPABASE_URL}/functions/v1/chat`;
const APP_URL = "https://id-preview--a8145c84-32b8-42fa-901b-367a8c3ad020.lovable.app";

let session = null;
let currentMode = "quick";
let pendingTabId = null;
let sharedPromptText = ""; // persists across mode switches

// ─── DOM refs ────────────────────────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const loginView = $("#login-view");
const mainView = $("#main-view");
const loginForm = $("#login-form");
const loginError = $("#login-error");
const statusBar = $("#status-bar");

// ─── Auth ────────────────────────────────────────────────────────────────────
async function supabaseAuth(email, password) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify({ email, password }),
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error_description || err.msg || "Login failed");
  }
  return resp.json();
}

async function initSession() {
  const stored = await chrome.storage.local.get(["session"]);
  if (stored.session?.access_token) {
    session = stored.session;
    showMain();
  }
}

function showMain() {
  loginView.classList.add("hidden");
  mainView.classList.remove("hidden");
}

function showLogin() {
  mainView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = $("#login-email").value;
  const pw = $("#login-password").value;
  $("#login-btn").disabled = true;
  try {
    const data = await supabaseAuth(email, pw);
    session = data;
    await chrome.storage.local.set({ session: data });
    showMain();
  } catch (err) {
    loginError.textContent = err.message;
  }
  $("#login-btn").disabled = false;
});

// ─── Footer Navigation ──────────────────────────────────────────────────────
$("#footer-logout").addEventListener("click", async () => {
  session = null;
  await chrome.storage.local.remove(["session"]);
  showLogin();
});

$("#footer-settings").addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_URL}/settings` });
});

$("#footer-history").addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_URL}/history` });
});

$("#footer-templates").addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_URL}/templates` });
});

// ─── Tabs with input persistence ─────────────────────────────────────────────
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    // Save current input before switching
    saveCurrentInput();

    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentMode = tab.dataset.mode;
    document.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
    $(`#panel-${currentMode}`).classList.remove("hidden");

    // Restore shared prompt to new mode's input
    restoreInput();
  });
});

function saveCurrentInput() {
  const inputEl = $(`#${currentMode === "wizard" ? "wizard" : currentMode === "assisted" ? "assisted" : "quick"}-input`);
  if (inputEl && inputEl.value.trim()) {
    sharedPromptText = inputEl.value;
  }
}

function restoreInput() {
  if (!sharedPromptText) return;
  const inputEl = $(`#${currentMode === "wizard" ? "wizard" : currentMode === "assisted" ? "assisted" : "quick"}-input`);
  if (inputEl && !inputEl.value.trim()) {
    inputEl.value = sharedPromptText;
  }
}

// ─── Status helper ───────────────────────────────────────────────────────────
function showStatus(msg) {
  statusBar.textContent = msg;
  statusBar.classList.remove("hidden");
  setTimeout(() => statusBar.classList.add("hidden"), 3000);
}

// ─── API helpers ─────────────────────────────────────────────────────────────
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token || SUPABASE_KEY}`,
  };
}

async function streamEnhance(body, outputEl) {
  outputEl.textContent = "";
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(t || `HTTP ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

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
      if (json === "[DONE]") return outputEl.textContent;
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) outputEl.textContent += c;
      } catch {}
    }
  }
  return outputEl.textContent;
}

async function fetchQuestions(prompt, mode, answers) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ originalPrompt: prompt, mode, answers }),
  });
  if (!resp.ok) throw new Error("Failed to get questions");
  const data = await resp.json();
  return data.questions || [];
}

// ─── Save prompt ─────────────────────────────────────────────────────────────
async function savePrompt(mode) {
  const outputEl = $(`#${mode}-output`);
  const inputEl = $(`#${mode}-input`);
  const enhanced = outputEl?.textContent?.trim();
  const original = inputEl?.value?.trim();
  if (!enhanced) { showStatus("❌ No prompt to save"); return; }

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/prompt_ratings`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        apikey: SUPABASE_KEY,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        enhanced_prompt: enhanced,
        original_prompt: original || null,
        rating: 0,
        action_type: "save",
        mode: mode,
        user_id: session?.user?.id || null,
      }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    showStatus("💾 Prompt saved!");
  } catch (e) {
    showStatus("❌ Save failed: " + e.message);
  }
}

// ─── Push to page ────────────────────────────────────────────────────────────
async function pushToPage(text) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = pendingTabId || tabs[0]?.id;
  if (tabId) {
    chrome.runtime.sendMessage({ type: "PUSH_TO_PAGE", tabId, enhancedPrompt: text });
    showStatus("✅ Pushed to page!");
  } else {
    showStatus("❌ No active tab found");
  }
}

// ─── Quick Mode ──────────────────────────────────────────────────────────────
$("#quick-enhance").addEventListener("click", async () => {
  const input = $("#quick-input").value.trim();
  if (!input) return;
  sharedPromptText = input;
  const btn = $("#quick-enhance");
  btn.disabled = true;
  btn.textContent = "⏳ Enhancing...";
  try {
    await streamEnhance(
      { originalPrompt: input, targetModel: "ChatGPT", parameters: { language: "English", wordLimit: "" } },
      $("#quick-output")
    );
    $("#quick-output-section").classList.remove("hidden");
  } catch (e) {
    showStatus("❌ " + e.message);
  }
  btn.disabled = false;
  btn.textContent = "✨ Enhance";
});

$("#quick-clear").addEventListener("click", () => {
  $("#quick-input").value = "";
  $("#quick-output").textContent = "";
  $("#quick-output-section").classList.add("hidden");
  $("#quick-json-section").classList.add("hidden");
});

$("#quick-push").addEventListener("click", () => pushToPage($("#quick-output").textContent));
$("#quick-copy").addEventListener("click", () => {
  navigator.clipboard.writeText($("#quick-output").textContent);
  showStatus("📋 Copied!");
});
$("#quick-save").addEventListener("click", () => savePrompt("quick"));
$("#quick-json").addEventListener("click", () => convertToJson("quick"));
$("#quick-json-copy").addEventListener("click", () => {
  navigator.clipboard.writeText($("#quick-json-output").textContent);
  showStatus("📋 JSON Copied!");
});
$("#quick-json-push").addEventListener("click", () => pushToPage($("#quick-json-output").textContent));

// ─── Wizard Mode ─────────────────────────────────────────────────────────────
$("#wizard-enhance").addEventListener("click", async () => {
  const input = $("#wizard-input").value.trim();
  if (!input) return;
  sharedPromptText = input;
  const btn = $("#wizard-enhance");
  btn.disabled = true;
  btn.textContent = "⏳ Enhancing...";
  const wizardData = {
    intent: $("#wiz-intent").value,
    audience: $("#wiz-audience").value,
    tone: $("#wiz-tone").value,
    format: $("#wiz-format").value,
    constraints: $("#wiz-constraints").value,
  };
  try {
    await streamEnhance(
      { originalPrompt: input, targetModel: "ChatGPT", wizardData, parameters: { language: "English", wordLimit: "" } },
      $("#wizard-output")
    );
    $("#wizard-output-section").classList.remove("hidden");
  } catch (e) {
    showStatus("❌ " + e.message);
  }
  btn.disabled = false;
  btn.textContent = "✨ Enhance";
});

$("#wizard-clear").addEventListener("click", () => {
  $("#wizard-input").value = "";
  ["wiz-intent", "wiz-audience", "wiz-tone", "wiz-format", "wiz-constraints"].forEach(
    (id) => ($(`#${id}`).value = "")
  );
  $("#wizard-output").textContent = "";
  $("#wizard-output-section").classList.add("hidden");
  $("#wizard-json-section").classList.add("hidden");
});

$("#wizard-push").addEventListener("click", () => pushToPage($("#wizard-output").textContent));
$("#wizard-copy").addEventListener("click", () => {
  navigator.clipboard.writeText($("#wizard-output").textContent);
  showStatus("📋 Copied!");
});
$("#wizard-save").addEventListener("click", () => savePrompt("wizard"));
$("#wizard-json").addEventListener("click", () => convertToJson("wizard"));
$("#wizard-json-copy").addEventListener("click", () => {
  navigator.clipboard.writeText($("#wizard-json-output").textContent);
  showStatus("📋 JSON Copied!");
});
$("#wizard-json-push").addEventListener("click", () => pushToPage($("#wizard-json-output").textContent));

// ─── Assisted Mode ───────────────────────────────────────────────────────────
let assistedAnswers = {};
let assistedQuestions = [];

$("#assisted-start").addEventListener("click", async () => {
  const input = $("#assisted-input").value.trim();
  if (!input) return;
  sharedPromptText = input;
  const btn = $("#assisted-start");
  btn.disabled = true;
  btn.textContent = "⏳ Analyzing...";
  assistedAnswers = {};
  try {
    assistedQuestions = await fetchQuestions(input, "assisted_questions");
    renderQuestions(assistedQuestions);
    $("#assisted-questions").classList.remove("hidden");
    $("#assisted-enhance-section").classList.remove("hidden");
  } catch (e) {
    showStatus("❌ " + e.message);
  }
  btn.disabled = false;
  btn.textContent = "🔍 Analyze & Ask Questions";
});

function renderQuestions(questions) {
  const container = $("#assisted-questions");
  container.innerHTML = "";
  questions.forEach((q) => {
    const block = document.createElement("div");
    block.className = "question-block";
    const p = document.createElement("p");
    p.textContent = q.question;
    block.appendChild(p);

    if (q.type === "select" && q.options?.length) {
      const sel = document.createElement("select");
      sel.dataset.qid = q.id;
      q.options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        sel.appendChild(o);
      });
      sel.addEventListener("change", () => (assistedAnswers[q.id] = sel.value));
      assistedAnswers[q.id] = q.options[0];
      block.appendChild(sel);
    } else {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.placeholder = "Your answer...";
      inp.dataset.qid = q.id;
      inp.addEventListener("input", () => (assistedAnswers[q.id] = inp.value));
      block.appendChild(inp);
    }
    container.appendChild(block);
  });
}

$("#assisted-enhance").addEventListener("click", async () => {
  const input = $("#assisted-input").value.trim();
  if (!input) return;
  const btn = $("#assisted-enhance");
  btn.disabled = true;
  btn.textContent = "⏳ Generating...";
  try {
    await streamEnhance(
      {
        originalPrompt: input,
        targetModel: "ChatGPT",
        answers: assistedAnswers,
        parameters: { language: "English", wordLimit: "" },
        mode: "assisted_generate",
      },
      $("#assisted-output")
    );
    $("#assisted-output-section").classList.remove("hidden");
  } catch (e) {
    showStatus("❌ " + e.message);
  }
  btn.disabled = false;
  btn.textContent = "✨ Generate Enhanced Prompt";
});

$("#assisted-clear").addEventListener("click", () => {
  $("#assisted-input").value = "";
  $("#assisted-questions").innerHTML = "";
  $("#assisted-questions").classList.add("hidden");
  $("#assisted-enhance-section").classList.add("hidden");
  $("#assisted-output").textContent = "";
  $("#assisted-output-section").classList.add("hidden");
  $("#assisted-json-section").classList.add("hidden");
  assistedAnswers = {};
});

$("#assisted-push").addEventListener("click", () => pushToPage($("#assisted-output").textContent));
$("#assisted-copy").addEventListener("click", () => {
  navigator.clipboard.writeText($("#assisted-output").textContent);
  showStatus("📋 Copied!");
});
$("#assisted-save").addEventListener("click", () => savePrompt("assisted"));
$("#assisted-json").addEventListener("click", () => convertToJson("assisted"));
$("#assisted-json-copy").addEventListener("click", () => {
  navigator.clipboard.writeText($("#assisted-json-output").textContent);
  showStatus("📋 JSON Copied!");
});
$("#assisted-json-push").addEventListener("click", () => pushToPage($("#assisted-json-output").textContent));

// ─── JSON Conversion ─────────────────────────────────────────────────────────
function convertToJson(mode) {
  const outputEl = $(`#${mode}-output`);
  const jsonSection = $(`#${mode}-json-section`);
  const jsonOutput = $(`#${mode}-json-output`);
  const text = outputEl?.textContent?.trim();
  if (!text) { showStatus("❌ No enhanced prompt to convert"); return; }

  const lines = text.split("\n").filter(l => l.trim());
  const jsonObj = {
    prompt: text,
    sections: [],
    metadata: {
      mode: mode,
      convertedAt: new Date().toISOString(),
      lineCount: lines.length,
      wordCount: text.split(/\s+/).length
    }
  };

  let currentSection = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,3}\s/.test(trimmed) || /^\*\*[^*]+\*\*$/.test(trimmed) ||
        (trimmed.length < 60 && trimmed === trimmed.toUpperCase() && trimmed.length > 3)) {
      if (currentSection) jsonObj.sections.push(currentSection);
      currentSection = { heading: trimmed.replace(/^#+\s*/, "").replace(/\*\*/g, ""), content: [] };
    } else if (currentSection) {
      currentSection.content.push(trimmed);
    } else {
      if (!jsonObj.sections.length) {
        currentSection = { heading: "Main", content: [trimmed] };
      }
    }
  }
  if (currentSection) jsonObj.sections.push(currentSection);

  const formatted = JSON.stringify(jsonObj, null, 2);
  jsonOutput.textContent = formatted;
  jsonSection.classList.remove("hidden");
  showStatus("✅ Converted to JSON");
}

// ─── Check for pending prompt from content script ────────────────────────────
async function checkPending() {
  const data = await chrome.storage.local.get(["pendingPrompt", "pendingMode", "pendingTabId", "pendingAutoEnhance"]);
  if (data.pendingPrompt) {
    pendingTabId = data.pendingTabId || null;
    const mode = data.pendingMode || "quick";
    const autoEnhance = !!data.pendingAutoEnhance;

    // Update shared text
    sharedPromptText = data.pendingPrompt;

    // Switch to the right tab
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelector(`.tab[data-mode="${mode}"]`)?.classList.add("active");
    document.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
    $(`#panel-${mode}`)?.classList.remove("hidden");
    currentMode = mode;

    // Fill prompt
    if (mode === "quick") {
      $("#quick-input").value = data.pendingPrompt;
      if (autoEnhance) {
        setTimeout(() => $("#quick-enhance").click(), 300);
      }
    } else if (mode === "wizard") {
      $("#wizard-input").value = data.pendingPrompt;
      if (autoEnhance) {
        setTimeout(() => $("#wizard-enhance").click(), 300);
      }
    } else if (mode === "assisted") {
      $("#assisted-input").value = data.pendingPrompt;
      if (autoEnhance) {
        setTimeout(() => $("#assisted-start").click(), 300);
      }
    }

    // Clear pending
    await chrome.storage.local.remove(["pendingPrompt", "pendingMode", "pendingTabId", "pendingAutoEnhance"]);
  }
}

// Listen for storage changes to handle sidebar-already-open case
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.pendingPrompt?.newValue) {
    // Sidebar is already open - process the pending prompt
    if (session) {
      setTimeout(checkPending, 100);
    }
  }
});

// ─── Init ────────────────────────────────────────────────────────────────────
initSession().then(() => {
  if (session) checkPending();
});
