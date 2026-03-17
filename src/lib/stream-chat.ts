import { WizardData, PromptParameters } from "./types";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

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
    throw new Error(`Conversion failed: ${resp.statusText}`);
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

  if (!resp.ok) throw new Error(`Failed to get questions: ${resp.statusText}`);
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

    if (resp.status === 429) { onError("Rate limit exceeded. Please wait."); return; }
    if (resp.status === 402) { onError("Usage limit reached."); return; }
    if (!resp.ok || !resp.body) {
      const text = await resp.text();
      onError(`Error: ${text || resp.statusText}`);
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
    onError(e instanceof Error ? e.message : "Unknown error");
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

    if (resp.status === 429) { onError("Rate limit exceeded. Please wait and try again."); return; }
    if (resp.status === 402) { onError("Usage limit reached. Please add credits."); return; }
    if (!resp.ok || !resp.body) {
      const text = await resp.text();
      onError(`Error: ${text || resp.statusText}`);
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
    onError(e instanceof Error ? e.message : "Unknown error");
  }
}
