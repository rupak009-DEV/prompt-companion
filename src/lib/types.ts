export interface TargetModel {
  id: string;
  label: string;
  category: "chat" | "image" | "code";
  description: string;
  icon: string;
}

export const TARGET_MODELS: TargetModel[] = [
  { id: "chatgpt", label: "ChatGPT", category: "chat", description: "OpenAI's conversational AI", icon: "💬" },
  { id: "claude", label: "Claude", category: "chat", description: "Anthropic's thoughtful AI", icon: "🧠" },
  { id: "gemini", label: "Gemini", category: "chat", description: "Google's multimodal AI", icon: "✨" },
  { id: "copilot", label: "GitHub Copilot", category: "code", description: "AI pair programmer", icon: "🤖" },
  { id: "cursor", label: "Cursor", category: "code", description: "AI-first code editor", icon: "⌨️" },
  { id: "midjourney", label: "Midjourney", category: "image", description: "Artistic image generation", icon: "🎨" },
  { id: "dalle", label: "DALL·E", category: "image", description: "OpenAI image generation", icon: "🖼️" },
  { id: "stable-diffusion", label: "Stable Diffusion", category: "image", description: "Open-source image AI", icon: "🌀" },
];

export interface PromptParameters {
  language: string;
  wordLimit: string;
}

export interface WizardData {
  intent: string;
  audience: string;
  tone: string;
  format: string;
  constraints: string;
}

export interface EnhancementRecord {
  id: string;
  originalPrompt: string;
  enhancedPrompt: string;
  targetModel: string;
  mode: "quick" | "wizard";
  wizardData?: WizardData;
  timestamp: number;
  isFavorite: boolean;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
