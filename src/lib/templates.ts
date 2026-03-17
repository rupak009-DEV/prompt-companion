export interface PromptTemplate {
  id: string;
  icon: string;
  label: string;
  prompt: string;
  model: string;
  category: "chat" | "code" | "image" | "marketing";
  isCustom?: boolean;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "blog-post",
    icon: "✍️",
    label: "Blog Post",
    prompt: "Write a comprehensive, SEO-optimized blog post about artificial intelligence trends in 2026. Include an engaging introduction, at least 5 key trends with detailed explanations, real-world examples, expert predictions, and a forward-looking conclusion. Use subheadings, bullet points, and a conversational yet authoritative tone. Target length: 1500-2000 words.",
    model: "chatgpt",
    category: "chat",
  },
  {
    id: "cold-email",
    icon: "📧",
    label: "Cold Email",
    prompt: "Write a personalized cold outreach email to a VP of Engineering at a mid-size tech company for a SaaS developer productivity tool. Include: a compelling subject line, a hook referencing a specific pain point (slow CI/CD pipelines), a concise value proposition with one measurable result, social proof (e.g., 'used by 200+ engineering teams'), a soft CTA asking for a 15-minute call, and a professional sign-off. Keep it under 150 words.",
    model: "chatgpt",
    category: "marketing",
  },
  {
    id: "python-scraper",
    icon: "🐍",
    label: "Python Scraper",
    prompt: "Write a production-ready Python web scraper using BeautifulSoup and requests that: extracts product name, price, rating, and availability from an e-commerce product listing page; handles pagination automatically; implements retry logic with exponential backoff for failed requests; respects robots.txt; uses rotating User-Agent headers; saves results to both CSV and JSON formats; includes proper error handling, logging, and type hints. Add docstrings and usage examples.",
    model: "copilot",
    category: "code",
  },
  {
    id: "logo-design",
    icon: "🎨",
    label: "Logo Design",
    prompt: "Design a modern minimalist logo for a tech startup called 'NexaFlow' — a workflow automation platform. Style: clean geometric shapes, abstract flowing lines suggesting connectivity and movement. Color palette: deep electric blue (#1E40AF) with a vibrant teal accent (#06B6D4). The logo should work at small sizes (favicon) and large (billboard). White background, vector-style, no text in the logo mark itself. Professional, trustworthy, innovative feel.",
    model: "midjourney",
    category: "image",
  },
  {
    id: "resume-summary",
    icon: "📝",
    label: "Resume Summary",
    prompt: "Write 3 variations of a professional resume summary for a Senior Software Engineer with 8+ years of experience. Background: full-stack development (React, Node.js, Python), cloud architecture (AWS), team leadership (managed 5-person team), and a track record of reducing system latency by 40%. Each variation should target a different angle: (1) technical leadership focus, (2) product impact focus, (3) innovation/architecture focus. Keep each to 3-4 sentences. Use strong action verbs and quantified achievements.",
    model: "claude",
    category: "chat",
  },
  {
    id: "debug-react",
    icon: "🛠️",
    label: "Debug React",
    prompt: "Help me debug a React component that re-renders infinitely. Context: I have a parent component passing an object as a prop, and the child component uses useEffect with that object in the dependency array. The useEffect updates parent state via a callback. Walk me through: (1) why this causes infinite re-renders, (2) how to identify this with React DevTools Profiler, (3) three different solutions (useMemo, useCallback, useRef) with code examples for each, (4) best practices to prevent this pattern in the future.",
    model: "cursor",
    category: "code",
  },
  {
    id: "app-ui",
    icon: "📱",
    label: "App UI Concept",
    prompt: "Create a sleek mobile app interface design for a premium fitness tracking app called 'PulseCore'. Show the main dashboard screen with: a circular progress ring for daily step goal, heart rate monitor with live graph, calorie burn counter, weekly activity chart, and a bottom navigation bar with Home/Workouts/Nutrition/Profile icons. Style: dark mode with glassmorphism cards, neon green (#39FF14) accent on matte black, SF Pro Display typography, subtle gradients, smooth rounded corners. iPhone 15 Pro frame.",
    model: "dalle",
    category: "image",
  },
  {
    id: "data-analysis",
    icon: "📊",
    label: "Data Analysis",
    prompt: "Analyze the following quarterly sales dataset and provide: (1) Executive summary with top 3 insights, (2) Revenue breakdown by product category and region with percentage changes vs. previous quarter, (3) Identify the top 5 and bottom 5 performing SKUs with explanations, (4) Customer segmentation analysis (new vs. returning, average order value trends), (5) Seasonal patterns and anomaly detection, (6) 3 actionable recommendations with projected impact. Present findings with clear headers, tables where appropriate, and suggest specific chart types for visualization.",
    model: "gemini",
    category: "chat",
  },
  {
    id: "marketing-copy",
    icon: "🎯",
    label: "Marketing Copy",
    prompt: "Write a complete ad copy package for launching 'AquaPure' — a premium eco-friendly stainless steel water bottle made from 100% recycled ocean plastic. Include: (1) A punchy headline (under 10 words), (2) Three Facebook/Instagram ad variations (short, medium, long) each with different emotional hooks (environmental guilt, health benefits, lifestyle/status), (3) A Google Search ad with 3 headline options and 2 descriptions, (4) A 30-second video script for TikTok/Reels. Target audience: health-conscious millennials, 25-35, urban. Brand voice: bold, eco-warrior, premium.",
    model: "chatgpt",
    category: "marketing",
  },
  {
    id: "landscape-art",
    icon: "🌄",
    label: "Landscape Art",
    prompt: "Generate a breathtaking photorealistic landscape: a pristine alpine lake at golden hour with mirror-perfect reflections. Snow-capped mountain peaks in the background with dramatic cloud formations painted in warm oranges, pinks, and purples. Foreground: wildflowers (lupines and Indian paintbrush) along a rocky shoreline. A lone pine tree silhouetted on a small island. Atmosphere: volumetric god rays piercing through clouds, slight mist rising from the lake surface. Shot on Hasselblad medium format, 24mm wide angle, f/11, hyper-detailed, 8K resolution.",
    model: "stable-diffusion",
    category: "image",
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: "all", label: "All", icon: "📋" },
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "code", label: "Code", icon: "⌨️" },
  { id: "image", label: "Image", icon: "🖼️" },
  { id: "marketing", label: "Marketing", icon: "📣" },
  { id: "custom", label: "My Templates", icon: "⭐" },
] as const;

const CUSTOM_TEMPLATES_KEY = "promptforge_custom_templates";

export function getCustomTemplates(): PromptTemplate[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: PromptTemplate): void {
  const existing = getCustomTemplates();
  existing.push({ ...template, isCustom: true });
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(existing));
}

export function updateCustomTemplate(template: PromptTemplate): void {
  const existing = getCustomTemplates().map((t) =>
    t.id === template.id ? { ...template, isCustom: true } : t
  );
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(existing));
}

export function deleteCustomTemplate(id: string): void {
  const existing = getCustomTemplates().filter((t) => t.id !== id);
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(existing));
}

export function getAllTemplates(customTemplates: PromptTemplate[]): PromptTemplate[] {
  return [...PROMPT_TEMPLATES, ...customTemplates];
}
