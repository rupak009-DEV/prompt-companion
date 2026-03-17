import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert prompt engineer. Your job is to take a user's simple, lazy, or vague prompt and transform it into a highly effective, detailed prompt optimized for the specified target AI model.

Rules:
1. ONLY output the enhanced prompt text — no explanations, no commentary, no prefixes like "Here's the enhanced prompt:".
2. Tailor the prompt to the target model's strengths and expected input format.
3. Add specificity: context, role, constraints, output format, examples where helpful.
4. For image models (Midjourney, DALL·E, Stable Diffusion): use the model's specific syntax, parameters, and style keywords.
5. For code models (Copilot, Cursor): structure as clear technical instructions with language, framework, and constraints.
6. For chat models (ChatGPT, Claude, Gemini): use structured prompting with role, task, context, and format.
7. If wizard context is provided, incorporate intent, audience, tone, format, and constraints naturally.
8. Preserve the user's core intent — enhance, don't change the meaning.
9. If a language is specified, write the enhanced prompt in that language.
10. If a word limit is specified, ensure the enhanced prompt stays within that limit.`;

const JSON_CONVERT_SYSTEM_PROMPT = `You are a universal prompt normalizer. Your job is to convert an enhanced text prompt into a structured JSON object by intelligently extracting keys and values.

Rules:
1. ONLY output valid JSON — no explanations, no commentary, no markdown code fences.
2. Analyze the prompt using reasoning to identify: task/intent, topic, entities, attributes, constraints, tone, format, audience, style, output requirements, sections, and any other relevant dimensions.
3. Keys must be meaningful, consistent, and machine-readable (snake_case).
4. Values must be derived directly from the prompt text. Support strings, arrays, numbers, booleans, and nested objects as appropriate.
5. Handle missing fields gracefully — only include keys that are present or can be reasonably inferred from the text.
6. Do NOT hallucinate requirements not present in the prompt.
7. Do NOT lose information during transformation — preserve full semantic meaning.
8. Output must always be valid, well-formatted JSON.
9. Automatically normalize tone, style, and output type into consistent key names.
10. Support creative, technical, marketing, and coding prompts equally well.`;

const ASSISTED_QUESTIONS_PROMPT = `You are an expert prompt engineer conducting a structured interview to build the perfect prompt. Based on the user's description, generate 4-6 clarifying questions that will help you understand exactly what they need.

Rules:
1. Output ONLY a valid JSON array of question objects. No explanations, no markdown fences.
2. Each object has: "id" (string, q1/q2/etc), "question" (string), "type" ("select"), "options" (string array, ALWAYS 3-5 options).
3. EVERY question MUST be "select" type with multiple-choice options. No text-only questions.
4. Cover: intent/goal, audience, tone/style, output format, constraints, and context.
5. Questions should be specific to the user's description, not generic.
6. Keep questions concise and actionable.
7. The user will have the option to type a custom answer if none of the options fit, so don't include generic options like "Other" or "Custom".`;

const ASSISTED_DEEP_DIVE_PROMPT = `You are an expert prompt engineer conducting a deep-dive follow-up interview. Based on the user's original description and their first round of answers, generate 3-5 deeper clarifying questions to refine the prompt further.

Rules:
1. Output ONLY a valid JSON array of question objects. No explanations, no markdown fences.
2. Each object has: "id" (string, d1/d2/etc), "question" (string), "type" ("select"), "options" (string array, ALWAYS 3-5 options).
3. EVERY question MUST be "select" type with multiple-choice options. No text-only questions.
4. Ask about edge cases, examples, specific preferences, quality criteria, or nuances not covered.
5. Build on their previous answers — don't repeat similar questions.
6. These questions should extract the finer details that make a prompt truly excellent.
7. The user will have the option to type a custom answer if none of the options fit, so don't include generic options like "Other" or "Custom".`;

const ASSISTED_GENERATE_PROMPT = `You are an expert prompt engineer. Based on the user's description and their detailed answers to clarifying questions, generate the perfect, comprehensive prompt optimized for the specified target AI model.

Rules:
1. ONLY output the enhanced prompt text — no explanations, no commentary.
2. Incorporate ALL information from the user's answers naturally.
3. Follow all the same rules as standard prompt enhancement (model-specific formatting, role, constraints, etc).
4. The prompt should be significantly better than what a user would write on their own.`;

// ─── Dynamic model config ───────────────────────────────────────────────────

type ModelConfig = {
  baseUrl: string;
  apiKey: string | null;
  modelId: string;
  providerType: string;
};

async function getActiveModelConfig(): Promise<ModelConfig | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return null;

  const db = createClient(supabaseUrl, serviceKey);

  const { data: setting } = await db
    .from("app_settings")
    .select("value")
    .eq("key", "active_model")
    .maybeSingle();

  if (!setting?.value) return null;
  const { provider_id, model_id } = setting.value as { provider_id: string; model_id: string };

  const { data: provider } = await db
    .from("ai_providers")
    .select("base_url, api_key_encrypted, provider_type")
    .eq("id", provider_id)
    .eq("is_active", true)
    .single();

  if (!provider) return null;

  return {
    baseUrl: provider.base_url,
    apiKey: provider.api_key_encrypted,
    modelId: model_id,
    providerType: provider.provider_type,
  };
}

function buildAuthHeader(config: ModelConfig): string {
  // Lovable AI uses LOVABLE_API_KEY; others use their own key
  if (config.providerType === "lovable") {
    const key = Deno.env.get("LOVABLE_API_KEY");
    return `Bearer ${key}`;
  }
  return `Bearer ${config.apiKey}`;
}

function buildExtraHeaders(config: ModelConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  if (config.providerType === "openrouter") {
    headers["HTTP-Referer"] = "https://promptengineer.app";
  }
  return headers;
}

// Extract a user-friendly error message from upstream API response
async function extractUpstreamError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      // OpenRouter error format
      if (json.error?.message) return json.error.message;
      if (json.error && typeof json.error === "string") return json.error;
      if (json.message) return json.message;
    } catch { /* not JSON */ }
    return text.slice(0, 200) || `Upstream error (${response.status})`;
  } catch {
    return `Upstream error (${response.status})`;
  }
}

async function callAI(
  config: ModelConfig,
  messages: { role: string; content: string }[],
  stream: boolean,
  temperature = 0.7,
  maxTokens = 4096,
  maxRetries = 3,
): Promise<Response> {
  const reqOptions = {
    method: "POST",
    headers: {
      Authorization: buildAuthHeader(config),
      "Content-Type": "application/json",
      ...buildExtraHeaders(config),
    } as Record<string, string>,
    body: JSON.stringify({
      model: config.modelId,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
    }),
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(config.baseUrl, reqOptions);

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      let delayMs = 0;
      if (retryAfter) {
        const parsed = parseInt(retryAfter, 10);
        delayMs = !isNaN(parsed) ? parsed * 1000 : Math.max(0, new Date(retryAfter).getTime() - Date.now());
      }
      if (delayMs <= 0) {
        delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      }
      console.log(`Rate limited (429), waiting ${Math.round(delayMs)}ms before retry ${attempt + 1}`);
      await response.text(); // consume body
      await new Promise((r) => setTimeout(r, Math.min(delayMs, 30000)));
      continue;
    }

    return response;
  }

  return new Response(JSON.stringify({ error: "Rate limit exceeded after retries." }), {
    status: 429,
    headers: { "Content-Type": "application/json" },
  });
}

// Helper to build error response with upstream details
async function buildErrorResponse(response: Response, corsH: Record<string, string>): Promise<Response> {
  if (response.status === 429) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
      status: 429, headers: { ...corsH, "Content-Type": "application/json" },
    });
  }
  if (response.status === 402) {
    return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
      status: 402, headers: { ...corsH, "Content-Type": "application/json" },
    });
  }
  const errorMsg = await extractUpstreamError(response);
  console.error("AI error:", response.status, errorMsg);
  return new Response(JSON.stringify({ error: `Model error: ${errorMsg}` }), {
    status: 502, headers: { ...corsH, "Content-Type": "application/json" },
  });
}

// Fallback config using Lovable AI
function getLovableFallback(): ModelConfig {
  return {
    baseUrl: "https://ai.gateway.lovable.dev/v1/chat/completions",
    apiKey: null,
    modelId: "google/gemini-3-flash-preview",
    providerType: "lovable",
  };
}

// ─── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { originalPrompt, targetModel, wizardData, parameters, mode, answers, deepAnswers } = await req.json();

    // Resolve active model config; fall back to Lovable AI
    const config = (await getActiveModelConfig()) ?? getLovableFallback();

    // Ensure API key is available
    if (config.providerType !== "lovable" && !config.apiKey) {
      return new Response(JSON.stringify({ error: "No API key configured for the active provider." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (config.providerType === "lovable") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    }

    // ── JSON conversion mode ────────────────────────────────────────────────
    if (mode === "convert_to_json") {
      const response = await callAI(
        config,
        [
          { role: "system", content: JSON_CONVERT_SYSTEM_PROMPT },
          { role: "user", content: `Convert this enhanced prompt into structured JSON:\n\n${originalPrompt}` },
        ],
        false, 0.3, 4096,
      );

      if (!response.ok) {
        return await buildErrorResponse(response, corsHeaders);
      }

      const data = await response.json();
      let jsonText = data.choices?.[0]?.message?.content || "{}";
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      try {
        return new Response(JSON.stringify(JSON.parse(jsonText)), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(jsonText, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ── Assisted questions ──────────────────────────────────────────────────
    if (mode === "assisted_questions" || mode === "assisted_deep_dive") {
      const systemPrompt = mode === "assisted_questions" ? ASSISTED_QUESTIONS_PROMPT : ASSISTED_DEEP_DIVE_PROMPT;
      let userMsg = `User's description: ${originalPrompt}`;
      if (mode === "assisted_deep_dive" && answers) {
        userMsg += `\n\nFirst round answers:\n${JSON.stringify(answers, null, 2)}`;
        if (deepAnswers) userMsg += `\n\nContext from previous deep dive:\n${JSON.stringify(deepAnswers, null, 2)}`;
      }

      const response = await callAI(config, [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ], false, 0.5, 4096);

      if (!response.ok) {
        return await buildErrorResponse(response, corsHeaders);
      }

      const data = await response.json();
      let text = data.choices?.[0]?.message?.content || "[]";
      text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      try {
        return new Response(JSON.stringify({ questions: JSON.parse(text) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ questions: [], raw: text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Assisted generate ───────────────────────────────────────────────────
    if (mode === "assisted_generate") {
      let context = `Target AI Model: ${targetModel}\n\nUser's original description: ${originalPrompt}`;
      if (answers) context += `\n\nClarifying Q&A:\n${JSON.stringify(answers, null, 2)}`;
      if (deepAnswers) context += `\n\nDeep Dive Q&A:\n${JSON.stringify(deepAnswers, null, 2)}`;
      if (parameters) {
        if (parameters.language) context += `\n\nOutput Language: ${parameters.language}`;
        if (parameters.wordLimit) context += `\nWord Limit: ${parameters.wordLimit} words maximum`;
      }

      const response = await callAI(config, [
        { role: "system", content: ASSISTED_GENERATE_PROMPT },
        { role: "user", content: context },
      ], true, 0.7, 4096);

      if (!response.ok) {
        return await buildErrorResponse(response, corsHeaders);
      }

      return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // ── Standard enhancement (streaming) ───────────────────────────────────
    let userMessage = `Target AI Model: ${targetModel}\n\nOriginal Prompt:\n${originalPrompt}`;

    if (parameters) {
      userMessage += `\n\nParameters:`;
      if (parameters.language) userMessage += `\n- Output Language: ${parameters.language}`;
      if (parameters.wordLimit) userMessage += `\n- Word Limit: ${parameters.wordLimit} words maximum`;
    }

    if (wizardData) {
      userMessage += `\n\nAdditional Context:`;
      if (wizardData.intent) userMessage += `\n- Intent/Goal: ${wizardData.intent}`;
      if (wizardData.audience) userMessage += `\n- Target Audience: ${wizardData.audience}`;
      if (wizardData.tone) userMessage += `\n- Desired Tone: ${wizardData.tone}`;
      if (wizardData.format) userMessage += `\n- Output Format: ${wizardData.format}`;
      if (wizardData.constraints) userMessage += `\n- Constraints: ${wizardData.constraints}`;
    }

    const response = await callAI(config, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ], true, 0.7, 4096);

    if (!response.ok) {
      return await buildErrorResponse(response, corsHeaders);
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });

  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
