// Sidebar logic for Prompt Enhancer Chrome Extension
const SUPABASE_URL = "https://gvvkcbsdvhclmkxplsvj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmtjYnNkdmhjbG1reHBsc3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTEzNzUsImV4cCI6MjA4OTMyNzM3NX0.P9mbTItt7iLnRHarEXPycwmEcJ09JM2s-5xSAPmNCKI";
const CHAT_URL = `${SUPABASE_URL}/functions/v1/chat`;

let session = null;
let currentMode = "quick";
let pendingTabId = null;

// ─── DOM refs ────────────────────────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const loginView = $("#login-view");
const mainView = $("#main-view");
const loginForm = $("#login-form");
const loginError = $("#login-error");
const logoutBtn = $("#logout-btn");
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

logoutBtn.addEventListener("click", async () => {
  session = null;
  await chrome.storage.local.remove(["session"]);
  showLogin();
});

// ─── Tabs ────────────────────────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentMode = tab.dataset.mode;
    document.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
    $(`#panel-${currentMode}`).classList.remove("hidden");
  });
});

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
});

$("#quick-push").addEventListener("click", () => pushToPage($("#quick-output").textContent));
$("#quick-copy").addEventListener("click", () => {
  navigator.clipboard.writeText($("#quick-output").textContent);
  showStatus("📋 Copied!");
});

// ─── Wizard Mode ─────────────────────────────────────────────────────────────
$("#wizard-enhance").addEventListener("click", async () => {
  const input = $("#wizard-input").value.trim();
  if (!input) return;
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
});

$("#wizard-push").addEventListener("click", () => pushToPage($("#wizard-output").textContent));
$("#wizard-copy").addEventListener("click", () => {
  navigator.clipboard.writeText($("#wizard-output").textContent);
  showStatus("📋 Copied!");
});

// ─── Assisted Mode ───────────────────────────────────────────────────────────
let assistedAnswers = {};
let assistedQuestions = [];

$("#assisted-start").addEventListener("click", async () => {
  const input = $("#assisted-input").value.trim();
  if (!input) return;
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
  assistedAnswers = {};
});

$("#assisted-push").addEventListener("click", () => pushToPage($("#assisted-output").textContent));
$("#assisted-copy").addEventListener("click", () => {
  navigator.clipboard.writeText($("#assisted-output").textContent);
  showStatus("📋 Copied!");
});

// ─── Check for pending prompt from content script ────────────────────────────
async function checkPending() {
  const data = await chrome.storage.local.get(["pendingPrompt", "pendingMode", "pendingTabId"]);
  if (data.pendingPrompt) {
    pendingTabId = data.pendingTabId || null;
    const mode = data.pendingMode || "quick";
    // Switch to the right tab
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelector(`.tab[data-mode="${mode}"]`).classList.add("active");
    document.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
    $(`#panel-${mode}`).classList.remove("hidden");
    currentMode = mode;

    // Fill prompt
    if (mode === "quick") {
      $("#quick-input").value = data.pendingPrompt;
    } else if (mode === "wizard") {
      $("#wizard-input").value = data.pendingPrompt;
    } else if (mode === "assisted") {
      $("#assisted-input").value = data.pendingPrompt;
    }

    // Clear pending
    await chrome.storage.local.remove(["pendingPrompt", "pendingMode", "pendingTabId"]);
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────
initSession().then(() => {
  if (session) checkPending();
});
