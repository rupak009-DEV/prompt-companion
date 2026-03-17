import { WizardData, PromptParameters } from "./types";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// ── Error logging helper ────────────────────────────────────────────────────
async function logEnhancementError(opts: {
  errorType: string;
  errorMessage: string;
  errorCode?: number;
  mode?: string;
  modelUsed?: string;
  provider?: string;
  context?: Record<string, unknown>;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("error_logs" as any).insert({
      user_id: user?.id || null,
      error_type: opts.errorType,
      error_message: opts.errorMessage,
      error_code: opts.errorCode || null,
      mode: opts.mode || null,
      model_used: opts.modelUsed || null,
      provider: opts.provider || null,
      request_context: opts.context || null,
    });
  } catch {
    // silently fail — don't block the user flow
  }
}

function categorizeError(status: number, message: string): string {
  if (status === 429) return "rate_limit";
  if (status === 402) return "usage_limit";
  if (status === 401 || status === 403) return "auth_error";
  if (status === 500) return "server_error";
  if (status === 502 || status === 503 || status === 504) return "upstream_error";
  if (message.toLowerCase().includes("api key")) return "api_key_error";
  if (message.toLowerCase().includes("timeout")) return "timeout";
  return "unknown_error";
}

export async function convertToStructuredJson(enhancedPrompt: string): Promise<Record<string, unknown>> {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ originalPrompt: enhancedPrompt, mode: "convert_to_json" }),
  });

  if (!resp.ok) {
    const errorMsg = `Conversion failed: ${resp.statusText}`;
    await logEnhancementError({
      errorType: categorizeError(resp.status, errorMsg),
      errorMessage: errorMsg,
      errorCode: resp.status,
      mode: "convert_to_json",
    });
    throw new Error(errorMsg);
  }

  return resp.json();
}

export interface AssistedQuestion {
  id: string;
  question: string;
  type: "text" | "select";
  options?: string[];
}

export async function fetchAssistedQuestions(
  originalPrompt: string,
  mode: "assisted_questions" | "assisted_deep_dive",
  answers?: Record<string, string>,
): Promise<AssistedQuestion[]> {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ originalPrompt, mode, answers }),
  });

  if (!resp.ok) {
    const errorMsg = `Failed to get questions: ${resp.statusText}`;
    await logEnhancementError({
      errorType: categorizeError(resp.status, errorMsg),
      errorMessage: errorMsg,
      errorCode: resp.status,
      mode,
    });
    throw new Error(errorMsg);
  }
  const data = await resp.json();
  return data.questions || [];
}

export async function streamAssistedGenerate({
  originalPrompt,
  targetModel,
  answers,
  deepAnswers,
  parameters,
  onDelta,
  onDone,
  onError,
  signal,
}: {
  originalPrompt: string;
  targetModel: string;
  answers: Record<string, string>;
  deepAnswers?: Record<string, string>;
  parameters?: PromptParameters;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        originalPrompt,
        targetModel,
        answers,
        deepAnswers,
        parameters,
        mode: "assisted_generate",
      }),
      signal,
    });

    if (resp.status === 429) {
      await logEnhancementError({ errorType: "rate_limit", errorMessage: "Rate limit exceeded", errorCode: 429, mode: "assisted_generate", context: { targetModel } });
      onError("Rate limit exceeded. Please wait."); return;
    }
    if (resp.status === 402) {
      await logEnhancementError({ errorType: "usage_limit", errorMessage: "Usage limit reached", errorCode: 402, mode: "assisted_generate", context: { targetModel } });
      onError("Usage limit reached."); return;
    }
    if (!resp.ok || !resp.body) {
      const text = await resp.text();
      const errorMsg = text || resp.statusText;
      await logEnhancementError({ errorType: categorizeError(resp.status, errorMsg), errorMessage: errorMsg, errorCode: resp.status, mode: "assisted_generate", context: { targetModel } });
      onError(`Error: ${errorMsg}`);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") { onDone(); return; }
    const errorMsg = e instanceof Error ? e.message : "Unknown error";
    await logEnhancementError({ errorType: "client_error", errorMessage: errorMsg, mode: "assisted_generate", context: { targetModel } });
    onError(errorMsg);
  }
}

export async function streamEnhance({
  originalPrompt,
  targetModel,
  wizardData,
  parameters,
  onDelta,
  onDone,
  onError,
  signal,
}: {
  originalPrompt: string;
  targetModel: string;
  wizardData?: WizardData;
  parameters?: PromptParameters;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ originalPrompt, targetModel, wizardData, parameters }),
      signal,
    });

    if (resp.status === 429) {
      await logEnhancementError({ errorType: "rate_limit", errorMessage: "Rate limit exceeded", errorCode: 429, mode: wizardData ? "wizard" : "quick", modelUsed: targetModel });
      onError("Rate limit exceeded. Please wait and try again."); return;
    }
    if (resp.status === 402) {
      await logEnhancementError({ errorType: "usage_limit", errorMessage: "Usage limit reached", errorCode: 402, mode: wizardData ? "wizard" : "quick", modelUsed: targetModel });
      onError("Usage limit reached. Please add credits."); return;
    }
    if (!resp.ok || !resp.body) {
      const text = await resp.text();
      const errorMsg = text || resp.statusText;
      await logEnhancementError({ errorType: categorizeError(resp.status, errorMsg), errorMessage: errorMsg, errorCode: resp.status, mode: wizardData ? "wizard" : "quick", modelUsed: targetModel });
      onError(`Error: ${errorMsg}`);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") { onDone(); return; }
    const errorMsg = e instanceof Error ? e.message : "Unknown error";
    await logEnhancementError({ errorType: "client_error", errorMessage: errorMsg, mode: wizardData ? "wizard" : "quick", modelUsed: targetModel });
    onError(errorMsg);
  }
}
