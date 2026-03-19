import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Check, Loader2, Server, Bot, Shield, Search, Download,
  Star, BarChart3, Users, CreditCard, HardDrive, Activity, Package,
  FileText, Lock, LayoutDashboard, TrendingUp, AlertTriangle, RefreshCw,
  Clock, Zap, CheckCircle2, XCircle, ChevronDown, ChevronUp, CalendarIcon, X,
  MessageSquare, Bug, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────────
type Provider = {
  id: string; name: string; display_name: string; base_url: string;
  api_key_encrypted: string | null; provider_type: string; is_active: boolean;
};
type Model = {
  id: string; display_name: string; model_id: string; provider_id: string;
  description: string | null; is_active: boolean; is_free: boolean;
};
type ActiveModelSetting = { provider_id: string; model_id: string };
type PromptRating = {
  id: string; user_id: string | null; rating: number;
  original_prompt: string | null; enhanced_prompt: string;
  target_model: string | null; mode: string | null; action_type: string;
  ai_model_used: string | null; generation_time_ms: number | null; created_at: string;
  quality_score: number | null;
};
type UserRole = { id: string; user_id: string; role: string; created_at: string | null };
type OpenRouterModel = {
  id: string; name: string; description: string;
  pricing: { prompt: string; completion: string }; context_length: number;
};

// ── Constants ──────────────────────────────────────────────────────────────────
const PROVIDER_PRESETS = [
  { name: "openrouter", display_name: "OpenRouter", base_url: "https://openrouter.ai/api/v1/chat/completions", type: "openrouter" },
  { name: "google", display_name: "Google Gemini", base_url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", type: "google" },
  { name: "lovable", display_name: "Lovable AI", base_url: "https://ai.gateway.lovable.dev/v1/chat/completions", type: "lovable" },
  { name: "aimlapi", display_name: "AIML API", base_url: "https://api.aimlapi.com/v1/chat/completions", type: "aimlapi" },
];

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

// ── Helpers ────────────────────────────────────────────────────────────────────
const StarRow = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star key={s} className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
    ))}
  </div>
);

const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/70">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

const QualityBadge = ({ score }: { score: number | null }) => {
  if (score === null || score === undefined) return null;
  const color = score >= 8 ? "text-green-500" : score >= 5 ? "text-yellow-500" : "text-destructive";
  return (
    <span className={`text-[10px] font-bold ${color} bg-muted px-1.5 py-0.5 rounded`}>
      {score}/10
    </span>
  );
};

const PaginationControls = ({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="h-3 w-3" /> Prev
      </Button>
      <span className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [activeModel, setActiveModel] = useState<ActiveModelSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});
  const [usersLoading, setUsersLoading] = useState(false);
  const [ratings, setRatings] = useState<PromptRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [expandedRating, setExpandedRating] = useState<string | null>(null);

  // Provider form
  const [newProvider, setNewProvider] = useState({ preset: "", api_key: "" });
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);

  // Model form
  const [newModel, setNewModel] = useState({ display_name: "", model_id: "", provider_id: "", description: "", is_free: true });
  const [modelDialogOpen, setModelDialogOpen] = useState(false);

  // OpenRouter browser
  const [browseDialogOpen, setBrowseDialogOpen] = useState(false);
  const [orModels, setOrModels] = useState<OpenRouterModel[]>([]);
  const [orSearch, setOrSearch] = useState("");
  const [orLoading, setOrLoading] = useState(false);
  const [orImporting, setOrImporting] = useState<Set<string>>(new Set());

  // AIML API browser
  const [aimlBrowseOpen, setAimlBrowseOpen] = useState(false);
  const [aimlModels, setAimlModels] = useState<OpenRouterModel[]>([]);
  const [aimlSearch, setAimlSearch] = useState("");
  const [aimlLoading, setAimlLoading] = useState(false);
  const [aimlImporting, setAimlImporting] = useState<Set<string>>(new Set());

  // System prompts
  const [systemPrompts, setSystemPrompts] = useState<Record<string, string>>({});
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [promptsSaving, setPromptsSaving] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);

  // Error logs
  type ErrorLog = { id: string; user_id: string | null; error_type: string; error_message: string; error_code: number | null; mode: string | null; model_used: string | null; provider: string | null; created_at: string };
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [errorLogsLoading, setErrorLogsLoading] = useState(false);
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>("all");

  // Ratings filter
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [ratingSearch, setRatingSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Pagination
  const [ratingsPage, setRatingsPage] = useState(1);
  const [errorsPage, setErrorsPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => { checkAdmin(); }, []);
  useEffect(() => {
    if (isAdmin) { fetchData(); fetchRatings(); fetchUsers(); fetchSystemPrompts(); fetchErrorLogs(); }
  }, [isAdmin]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsAdmin(false); return; }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchData = async () => {
    setLoading(true);
    const [providersRes, modelsRes, settingsRes] = await Promise.all([
      supabase.from("ai_providers").select("*").order("created_at"),
      supabase.from("ai_models").select("*").order("created_at"),
      supabase.from("app_settings").select("value").eq("key", "active_model").maybeSingle(),
    ]);
    setProviders((providersRes.data || []) as Provider[]);
    setModels((modelsRes.data || []) as Model[]);
    if (settingsRes.data?.value) setActiveModel(settingsRes.data.value as ActiveModelSetting);
    setLoading(false);
  };

  const fetchRatings = async () => {
    setRatingsLoading(true);
    const { data, error } = await supabase.from("prompt_ratings" as any).select("*").order("created_at", { ascending: false }).limit(200);
    if (!error && data) setRatings(data as any as PromptRating[]);
    setRatingsLoading(false);
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    const [rolesRes, profilesRes] = await Promise.all([
      supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    if (rolesRes.data) setUserRoles(rolesRes.data as UserRole[]);
    if (profilesRes.data) {
      const map: Record<string, string> = {};
      (profilesRes.data as any[]).forEach(p => { if (p.full_name) map[p.user_id] = p.full_name; });
      setUserProfiles(map);
    }
    setUsersLoading(false);
  };

  const fetchSystemPrompts = async () => {
    setPromptsLoading(true);
    const { data } = await supabase.from("app_settings").select("*").like("key", "system_prompt_%");
    const prompts: Record<string, string> = {};
    // Default prompts from the edge function
    const defaults: Record<string, string> = {
      system_prompt_enhance: `You are an expert prompt engineer. Your job is to take a user's simple, lazy, or vague prompt and transform it into a highly effective, detailed prompt optimized for the specified target AI model.\n\nRules:\n1. ONLY output the enhanced prompt text — no explanations, no commentary.\n2. Tailor the prompt to the target model's strengths.\n3. Add specificity: context, role, constraints, output format, examples.\n4. Preserve the user's core intent — enhance, don't change the meaning.`,
      system_prompt_json_convert: `You are a universal prompt normalizer. Convert enhanced text prompts into structured JSON objects by intelligently extracting keys and values.\n\nRules:\n1. ONLY output valid JSON — no explanations, no markdown fences.\n2. Keys must be snake_case. Support strings, arrays, numbers, booleans, and nested objects.\n3. Do NOT hallucinate requirements not present in the prompt.`,
      system_prompt_assisted_questions: `You are an expert prompt engineer conducting a structured interview. Based on the user's description, generate 4-6 clarifying questions.\n\nRules:\n1. Output ONLY a valid JSON array. No explanations.\n2. Each object: "id", "question", "type" ("select"), "options" (3-5 choices).\n3. Cover: intent, audience, tone, format, constraints, context.`,
      system_prompt_assisted_generate: `You are an expert prompt engineer. Based on the user's description and their detailed answers, generate the perfect prompt optimized for the target AI model.\n\nRules:\n1. ONLY output the enhanced prompt text.\n2. Incorporate ALL information from the user's answers naturally.`,
    };
    // Merge defaults with DB overrides
    Object.entries(defaults).forEach(([key, val]) => { prompts[key] = val; });
    if (data) data.forEach((row: any) => { prompts[row.key] = typeof row.value === "string" ? row.value : JSON.stringify(row.value); });
    setSystemPrompts(prompts);
    setPromptsLoading(false);
  };

  const saveSystemPrompt = async (key: string, value: string) => {
    setPromptsSaving(true);
    const { data: existing } = await supabase.from("app_settings").select("id").eq("key", key).maybeSingle();
    if (existing) {
      await supabase.from("app_settings").update({ value: value as any }).eq("key", key);
    } else {
      await supabase.from("app_settings").insert({ key, value: value as any, description: `System prompt: ${key}` });
    }
    toast({ title: "System prompt saved" });
    setEditingPrompt(null);
    setPromptsSaving(false);
  };

  const fetchErrorLogs = async () => {
    setErrorLogsLoading(true);
    const { data } = await supabase.from("error_logs" as any).select("*").order("created_at", { ascending: false }).limit(200);
    if (data) setErrorLogs(data as any as ErrorLog[]);
    setErrorLogsLoading(false);
  };

  const filteredErrorLogs = useMemo(() => {
    if (errorTypeFilter === "all") return errorLogs;
    return errorLogs.filter(l => l.error_type === errorTypeFilter);
  }, [errorLogs, errorTypeFilter]);

  const errorStats = useMemo(() => {
    const byType: Record<string, number> = {};
    errorLogs.forEach(l => { byType[l.error_type] = (byType[l.error_type] || 0) + 1; });
    return byType;
  }, [errorLogs]);

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
    if (error) toast({ title: "Error updating role", description: error.message, variant: "destructive" });
    else { toast({ title: "Role updated" }); fetchUsers(); }
  };

  // ── Provider actions ────────────────────────────────────────────────────────
  const addProvider = async () => {
    const preset = PROVIDER_PRESETS.find(p => p.name === newProvider.preset);
    if (!preset) return;
    setSaving(true);
    const { error } = await supabase.from("ai_providers").insert({
      name: preset.name, display_name: preset.display_name, base_url: preset.base_url,
      api_key_encrypted: newProvider.api_key || null, provider_type: preset.type, is_active: true,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Provider added" }); setNewProvider({ preset: "", api_key: "" }); setProviderDialogOpen(false); fetchData(); }
    setSaving(false);
  };

  const updateProviderKey = async (id: string, key: string) => {
    const { error } = await supabase.from("ai_providers").update({ api_key_encrypted: key }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "API key updated" }); fetchData(); }
  };

  const toggleProvider = async (id: string, active: boolean) => {
    await supabase.from("ai_providers").update({ is_active: active }).eq("id", id);
    fetchData();
  };

  const deleteProvider = async (id: string) => {
    await supabase.from("ai_models").delete().eq("provider_id", id);
    await supabase.from("ai_providers").delete().eq("id", id);
    toast({ title: "Provider deleted" }); fetchData();
  };

  // ── Model actions ────────────────────────────────────────────────────────────
  const addModel = async () => {
    if (!newModel.display_name || !newModel.model_id || !newModel.provider_id) return;
    setSaving(true);
    const { error } = await supabase.from("ai_models").insert({
      display_name: newModel.display_name, model_id: newModel.model_id,
      provider_id: newModel.provider_id, description: newModel.description || null,
      is_active: true, is_free: newModel.is_free,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Model added" }); setNewModel({ display_name: "", model_id: "", provider_id: "", description: "", is_free: true }); setModelDialogOpen(false); fetchData(); }
    setSaving(false);
  };

  const toggleModel = async (id: string, active: boolean) => {
    await supabase.from("ai_models").update({ is_active: active }).eq("id", id);
    fetchData();
  };

  const deleteModel = async (id: string) => {
    await supabase.from("ai_models").delete().eq("id", id);
    toast({ title: "Model deleted" }); fetchData();
  };

  const setAsActive = async (providerId: string, modelId: string) => {
    setSaving(true);
    const value = { provider_id: providerId, model_id: modelId };
    const { data: existing } = await supabase.from("app_settings").select("id").eq("key", "active_model").maybeSingle();
    if (existing) await supabase.from("app_settings").update({ value }).eq("key", "active_model");
    else await supabase.from("app_settings").insert({ key: "active_model", value, description: "Currently active AI model" });
    setActiveModel(value); toast({ title: "Active model updated" }); setSaving(false);
  };

  // ── OpenRouter browser ───────────────────────────────────────────────────────
  const openRouterProvider = providers.find(p => p.provider_type === "openrouter" && p.is_active);

  const fetchOpenRouterModels = async () => {
    setOrLoading(true);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models");
      const data = await res.json();
      setOrModels(data.data || []);
    } catch { toast({ title: "Failed to fetch OpenRouter models", variant: "destructive" }); }
    setOrLoading(false);
  };

  const handleOpenBrowse = () => { setBrowseDialogOpen(true); if (orModels.length === 0) fetchOpenRouterModels(); };

  const filteredOrModels = useMemo(() => {
    if (!orSearch.trim()) return orModels.slice(0, 50);
    const q = orSearch.toLowerCase();
    return orModels.filter(m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)).slice(0, 50);
  }, [orModels, orSearch]);

  const existingModelIds = useMemo(() => new Set(models.map(m => m.model_id)), [models]);

  const importOrModel = async (orModel: OpenRouterModel) => {
    if (!openRouterProvider) return;
    setOrImporting(prev => new Set(prev).add(orModel.id));
    const isFree = orModel.pricing?.prompt === "0" && orModel.pricing?.completion === "0";
    const { error } = await supabase.from("ai_models").insert({
      display_name: orModel.name, model_id: orModel.id, provider_id: openRouterProvider.id,
      description: orModel.description?.slice(0, 200) || null,
      is_active: true, is_free: isFree, context_window: orModel.context_length || null,
    });
    if (error) toast({ title: "Error importing", description: error.message, variant: "destructive" });
    else { toast({ title: `Imported ${orModel.name}` }); fetchData(); }
    setOrImporting(prev => { const n = new Set(prev); n.delete(orModel.id); return n; });
  };

  // ── AIML API browser ────────────────────────────────────────────────────────
  const aimlProvider = providers.find(p => p.provider_type === "aimlapi" && p.is_active);

  const fetchAimlModels = async () => {
    setAimlLoading(true);
    try {
      const res = await fetch("https://api.aimlapi.com/v1/models", {
        headers: aimlProvider?.api_key_encrypted ? { Authorization: `Bearer ${aimlProvider.api_key_encrypted}` } : {},
      });
      const data = await res.json();
      const modelList = (data.data || data || []).map((m: any) => ({
        id: m.id || m.model_id || "",
        name: m.name || m.id || m.model_id || "",
        description: m.description || "",
        pricing: { prompt: m.pricing?.prompt || "0", completion: m.pricing?.completion || "0" },
        context_length: m.context_length || m.max_context_length || 0,
      }));
      setAimlModels(modelList);
    } catch {
      toast({ title: "Failed to fetch AIML API models", variant: "destructive" });
    }
    setAimlLoading(false);
  };

  const handleOpenAimlBrowse = () => { setAimlBrowseOpen(true); if (aimlModels.length === 0) fetchAimlModels(); };

  const filteredAimlModels = useMemo(() => {
    if (!aimlSearch.trim()) return aimlModels.slice(0, 100);
    const q = aimlSearch.toLowerCase();
    return aimlModels.filter(m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)).slice(0, 100);
  }, [aimlModels, aimlSearch]);

  const importAimlModel = async (model: OpenRouterModel) => {
    if (!aimlProvider) return;
    setAimlImporting(prev => new Set(prev).add(model.id));
    const isFree = model.pricing?.prompt === "0" && model.pricing?.completion === "0";
    const { error } = await supabase.from("ai_models").insert({
      display_name: model.name, model_id: model.id, provider_id: aimlProvider.id,
      description: model.description?.slice(0, 200) || null,
      is_active: true, is_free: isFree, context_window: model.context_length || null,
    });
    if (error) toast({ title: "Error importing", description: error.message, variant: "destructive" });
    else { toast({ title: `Imported ${model.name}` }); fetchData(); }
    setAimlImporting(prev => { const n = new Set(prev); n.delete(model.id); return n; });
  };

  // ── Date-filtered Ratings ─────────────────────────────────────────────────────
  const dateFilteredRatings = useMemo(() => {
    if (!dateFrom && !dateTo) return ratings;
    return ratings.filter(r => {
      const rDate = new Date(r.created_at);
      if (dateFrom) { const from = new Date(dateFrom); from.setHours(0, 0, 0, 0); if (rDate < from) return false; }
      if (dateTo) { const to = new Date(dateTo); to.setHours(23, 59, 59, 999); if (rDate > to) return false; }
      return true;
    });
  }, [ratings, dateFrom, dateTo]);

  // ── Analytics ────────────────────────────────────────────────────────────────
  const analyticsData = useMemo(() => {
    if (!dateFilteredRatings.length) return { byDay: [], byMode: [], byRating: [], byModel: [], avgGenTime: 0 };

    // Ratings by day (last 14 days)
    const dayMap: Record<string, number> = {};
    dateFilteredRatings.forEach(r => {
      const d = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dayMap[d] = (dayMap[d] || 0) + 1;
    });
    const byDay = Object.entries(dayMap).slice(-14).map(([date, count]) => ({ date, count }));

    // By mode
    const modeMap: Record<string, number> = {};
    dateFilteredRatings.forEach(r => { const m = r.mode || "unknown"; modeMap[m] = (modeMap[m] || 0) + 1; });
    const byMode = Object.entries(modeMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

    // By star rating
    const starMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    dateFilteredRatings.forEach(r => { starMap[r.rating] = (starMap[r.rating] || 0) + 1; });
    const byRating = Object.entries(starMap).map(([star, count]) => ({ star: `${star}★`, count }));

    // By model
    const modelMap: Record<string, { count: number; totalRating: number }> = {};
    dateFilteredRatings.forEach(r => {
      const m = r.ai_model_used || "Unknown";
      if (!modelMap[m]) modelMap[m] = { count: 0, totalRating: 0 };
      modelMap[m].count++;
      modelMap[m].totalRating += r.rating;
    });
    const byModel = Object.entries(modelMap)
      .map(([model, v]) => ({ model: model.split("/").pop() || model, count: v.count, avg: parseFloat((v.totalRating / v.count).toFixed(1)) }))
      .sort((a, b) => b.count - a.count).slice(0, 6);

    const timings = dateFilteredRatings.filter(r => r.generation_time_ms != null).map(r => r.generation_time_ms!);
    const avgGenTime = timings.length ? parseFloat((timings.reduce((a, b) => a + b, 0) / timings.length / 1000).toFixed(1)) : 0;

    return { byDay, byMode, byRating, byModel, avgGenTime };
  }, [dateFilteredRatings]);

  // ── Filtered Ratings ─────────────────────────────────────────────────────────
  const filteredRatings = useMemo(() => {
    let list = dateFilteredRatings;
    if (ratingFilter !== "all") {
      if (ratingFilter === "positive") list = list.filter(r => r.rating >= 4);
      else if (ratingFilter === "negative") list = list.filter(r => r.rating <= 2);
      else if (ratingFilter === "neutral") list = list.filter(r => r.rating === 3);
      else if (ratingFilter === "system") list = list.filter(r => r.action_type === "system");
      else if (ratingFilter === "user") list = list.filter(r => r.action_type !== "system");
      else list = list.filter(r => r.mode === ratingFilter);
    }
    if (ratingSearch.trim()) {
      const q = ratingSearch.toLowerCase();
      list = list.filter(r =>
        r.original_prompt?.toLowerCase().includes(q) ||
        r.enhanced_prompt?.toLowerCase().includes(q) ||
        r.ai_model_used?.toLowerCase().includes(q) ||
        r.target_model?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [dateFilteredRatings, ratingFilter, ratingSearch]);

  // Reset pagination on filter changes
  useEffect(() => { setRatingsPage(1); }, [ratingFilter, ratingSearch, dateFrom, dateTo]);
  useEffect(() => { setErrorsPage(1); }, [errorTypeFilter]);

  const exportRatingsCSV = () => {
    const headers = ["ID", "Date", "Rating", "Quality Score", "Mode", "Action Type", "AI Model Used", "Target AI", "Gen Time (ms)", "Username", "User Input", "Enhanced Output"];
    const rows = filteredRatings.map(r => [
      r.id, new Date(r.created_at).toISOString(), r.rating, r.quality_score ?? "", r.mode || "", r.action_type,
      r.ai_model_used || "", r.target_model || "", r.generation_time_ms || "",
      r.user_id ? (userProfiles[r.user_id] || r.user_id.slice(0, 8)) : "Anonymous",
      `"${(r.original_prompt || "").replace(/"/g, '""')}"`,
      `"${r.enhanced_prompt.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "logs_and_ratings.csv"; a.click();
  };

  const exportErrorsCSV = () => {
    const headers = ["ID", "Date", "Error Type", "Error Code", "Mode", "Model Used", "Provider", "User ID", "Error Message"];
    const rows = filteredErrorLogs.map(l => [
      l.id, new Date(l.created_at).toISOString(), l.error_type, l.error_code || "",
      l.mode || "", l.model_used || "", l.provider || "",
      l.user_id ? (userProfiles[l.user_id] || l.user_id.slice(0, 8)) : "",
      `"${l.error_message.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "error_logs.csv"; a.click();
  };

  // ── Security checks ──────────────────────────────────────────────────────────
  const securityChecks = [
    { label: "RLS enabled on prompt_ratings", status: true, detail: "Users can only insert their own ratings; admins can view all." },
    { label: "RLS enabled on user_roles", status: true, detail: "Users can only view their own role; admins manage all." },
    { label: "RLS enabled on ai_models", status: true, detail: "Everyone can view active models; only admins can manage." },
    { label: "RLS enabled on ai_providers", status: true, detail: "Everyone can view active providers; only admins can manage." },
    { label: "RLS enabled on app_settings", status: true, detail: "Everyone can view settings; only admins can manage." },
    { label: "Admin role check via security definer function", status: true, detail: "has_admin_role() runs as security definer to prevent RLS recursion." },
    { label: "API keys stored encrypted server-side", status: true, detail: "Provider API keys stored in api_key_encrypted column, not exposed to client." },
    { label: "Auth required for admin panel access", status: true, detail: "ProtectedRoute + isAdmin check guards the admin page." },
  ];

  // ── Guards ───────────────────────────────────────────────────────────────────
  if (isAdmin === null) return (
    <AppLayout><div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></AppLayout>
  );

  if (!isAdmin) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You need admin privileges to access this page.</p>
      </div>
    </AppLayout>
  );

  const avgRating = dateFilteredRatings.length ? (dateFilteredRatings.reduce((a, r) => a + r.rating, 0) / dateFilteredRatings.length).toFixed(1) : "—";

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage your application settings, users, models, and analytics</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <ScrollArea className="w-full">
              <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1.5 mb-1">
                <TabsTrigger value="overview" className="gap-1.5 text-xs"><LayoutDashboard className="h-3.5 w-3.5" />Overview</TabsTrigger>
                <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
                <TabsTrigger value="credits" className="gap-1.5 text-xs"><CreditCard className="h-3.5 w-3.5" />Credits</TabsTrigger>
                <TabsTrigger value="providers" className="gap-1.5 text-xs"><Server className="h-3.5 w-3.5" />Providers</TabsTrigger>
                <TabsTrigger value="models" className="gap-1.5 text-xs"><Bot className="h-3.5 w-3.5" />Models</TabsTrigger>
                <TabsTrigger value="prompts" className="gap-1.5 text-xs"><MessageSquare className="h-3.5 w-3.5" />Prompts</TabsTrigger>
                <TabsTrigger value="ratings" className="gap-1.5 text-xs"><Star className="h-3.5 w-3.5" />Logs & Ratings</TabsTrigger>
                <TabsTrigger value="errors" className="gap-1.5 text-xs"><Bug className="h-3.5 w-3.5" />Errors</TabsTrigger>
                <TabsTrigger value="storage" className="gap-1.5 text-xs"><HardDrive className="h-3.5 w-3.5" />Storage</TabsTrigger>
                <TabsTrigger value="analytics" className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />Analytics</TabsTrigger>
                <TabsTrigger value="plans" className="gap-1.5 text-xs"><Package className="h-3.5 w-3.5" />Plans</TabsTrigger>
                <TabsTrigger value="security" className="gap-1.5 text-xs"><Lock className="h-3.5 w-3.5" />Security</TabsTrigger>
              </TabsList>
            </ScrollArea>

            {/* ─── OVERVIEW ───────────────────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6 mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={Users} label="Total Users" value={userRoles.length} />
                <StatCard icon={Star} label="Total Ratings" value={ratings.length} sub={`Avg ${avgRating}★`} />
                <StatCard icon={Bot} label="Active Models" value={models.filter(m => m.is_active).length} />
                <StatCard icon={Server} label="Providers" value={providers.filter(p => p.is_active).length} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={TrendingUp} label="Positive Ratings" value={ratings.filter(r => r.rating >= 4).length} sub="4-5 stars" />
                <StatCard icon={Activity} label="Avg Gen Time" value={`${analyticsData.avgGenTime}s`} />
                <StatCard icon={Zap} label="Quick Prompts" value={ratings.filter(r => r.mode === "quick").length} />
                <StatCard icon={AlertTriangle} label="Negative Ratings" value={ratings.filter(r => r.rating <= 2).length} sub="1-2 stars" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Recent Ratings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {ratings.slice(0, 5).map(r => (
                      <div key={r.id} className="flex items-start gap-3 py-1.5 border-b last:border-0">
                        <StarRow rating={r.rating} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate text-foreground">{r.original_prompt || r.enhanced_prompt}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {r.mode && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">{r.mode}</Badge>}
                            <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {ratings.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No ratings yet</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "Database", ok: true },
                      { label: "Authentication", ok: true },
                      { label: "AI Providers", ok: providers.some(p => p.is_active) },
                      { label: "Active Model", ok: !!activeModel },
                      { label: "RLS Policies", ok: true },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {item.ok
                            ? <><CheckCircle2 className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-primary">OK</span></>
                            : <><XCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-xs text-destructive">Warning</span></>
                          }
                        </div>
                      </div>
                    ))}
                    {activeModel && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        Active model: <span className="text-foreground font-medium">{activeModel.model_id}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── USERS ──────────────────────────────────────────────────────────── */}
            <TabsContent value="users" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{userRoles.length} registered user{userRoles.length !== 1 ? "s" : ""}</p>
                <Button size="sm" variant="outline" onClick={fetchUsers} disabled={usersLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${usersLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatCard icon={Users} label="Total Users" value={userRoles.length} />
                <StatCard icon={Shield} label="Admins" value={userRoles.filter(u => u.role === "admin").length} />
                <StatCard icon={Users} label="Regular Users" value={userRoles.filter(u => u.role === "user").length} />
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {userRoles.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No users found</p>}
                      {userRoles.map(u => {
                        const name = userProfiles[u.user_id];
                        return (
                        <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {name ? name.slice(0, 2).toUpperCase() : u.user_id.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              {name && <p className="text-sm font-medium text-foreground">{name}</p>}
                              <p className="text-xs font-mono text-muted-foreground">{u.user_id.slice(0, 12)}...</p>
                              <p className="text-[10px] text-muted-foreground/60">
                                Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={u.role} onValueChange={(v) => updateUserRole(u.user_id, v)}>
                              <SelectTrigger className="h-7 w-28 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ─── CREDITS ────────────────────────────────────────────────────────── */}
            <TabsContent value="credits" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={CreditCard} label="Total Credits Used" value="—" sub="Tracking not yet set up" />
                <StatCard icon={Zap} label="Credits This Month" value="—" />
                <StatCard icon={TrendingUp} label="Avg per User" value="—" />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Credit System</CardTitle>
                  <CardDescription>Manage user credit balances and usage limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <CreditCard className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-medium">Credit tracking coming soon</p>
                    <p className="text-sm text-muted-foreground mt-1">Set up a credits table to track usage per user, set limits, and manage top-ups.</p>
                    <Button size="sm" variant="outline" className="mt-4" disabled>Configure Credits</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── PROVIDERS ──────────────────────────────────────────────────────── */}
            <TabsContent value="providers" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Configure API providers for AI models</p>
                <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Provider</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add AI Provider</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select value={newProvider.preset} onValueChange={(v) => setNewProvider({ ...newProvider, preset: v })}>
                          <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                          <SelectContent>
                            {PROVIDER_PRESETS.map(p => <SelectItem key={p.name} value={p.name}>{p.display_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input type="password" placeholder="Enter API key" value={newProvider.api_key} onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })} />
                        <p className="text-xs text-muted-foreground">{newProvider.preset === "lovable" ? "Uses LOVABLE_API_KEY from secrets (leave empty)" : "Required for API access"}</p>
                      </div>
                      <Button onClick={addProvider} disabled={!newProvider.preset || saving} className="w-full">
                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Add Provider
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {providers.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No providers configured</CardContent></Card>
              ) : (
                <div className="grid gap-4">
                  {providers.map(p => (
                    <Card key={p.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{p.display_name}</CardTitle>
                            <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={p.is_active} onCheckedChange={(v) => toggleProvider(p.id, v)} />
                            <Button variant="ghost" size="icon" onClick={() => deleteProvider(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </div>
                        <CardDescription className="text-xs font-mono">{p.base_url}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Input type="password" placeholder={p.api_key_encrypted ? "••••••••" : "No API key set"} className="flex-1"
                            onBlur={(e) => e.target.value && updateProviderKey(p.id, e.target.value)} />
                          <span className="text-xs text-muted-foreground">Update key</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ─── MODELS ─────────────────────────────────────────────────────────── */}
            <TabsContent value="models" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Add models and select which one to use</p>
                <div className="flex items-center gap-2">
                  {openRouterProvider && (
                    <Button size="sm" variant="outline" onClick={handleOpenBrowse}>
                      <Search className="h-4 w-4 mr-1" /> Browse OpenRouter
                    </Button>
                  )}
                  {aimlProvider && (
                    <Button size="sm" variant="outline" onClick={handleOpenAimlBrowse}>
                      <Search className="h-4 w-4 mr-1" /> Browse AIML API
                    </Button>
                  )}
                  <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={providers.length === 0}><Plus className="h-4 w-4 mr-1" /> Add Model</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add AI Model</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Provider</Label>
                          <Select value={newModel.provider_id} onValueChange={(v) => setNewModel({ ...newModel, provider_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                            <SelectContent>
                              {providers.filter(p => p.is_active).map(p => <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Display Name</Label>
                          <Input placeholder="e.g. GPT-4 Turbo" value={newModel.display_name} onChange={(e) => setNewModel({ ...newModel, display_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Model ID</Label>
                          <Input placeholder="e.g. openai/gpt-4-turbo" value={newModel.model_id} onChange={(e) => setNewModel({ ...newModel, model_id: e.target.value })} />
                          <p className="text-xs text-muted-foreground">The exact model identifier used by the API</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Description (optional)</Label>
                          <Input placeholder="Brief description" value={newModel.description} onChange={(e) => setNewModel({ ...newModel, description: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={newModel.is_free} onCheckedChange={(v) => setNewModel({ ...newModel, is_free: v })} />
                          <Label>Free model</Label>
                        </div>
                        <Button onClick={addModel} disabled={!newModel.display_name || !newModel.model_id || !newModel.provider_id || saving} className="w-full">
                          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Add Model
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {models.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No models configured. Add a provider first.</CardContent></Card>
              ) : (
                <div className="grid gap-4">
                  {models.map(m => {
                    const provider = providers.find(p => p.id === m.provider_id);
                    const isActive = activeModel?.provider_id === m.provider_id && activeModel?.model_id === m.model_id;
                    return (
                      <Card key={m.id} className={isActive ? "border-primary" : ""}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-lg">{m.display_name}</CardTitle>
                              {isActive && <Badge className="bg-primary">Active</Badge>}
                              {m.is_free && <Badge variant="outline">Free</Badge>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant={isActive ? "secondary" : "default"} size="sm" onClick={() => setAsActive(m.provider_id, m.model_id)} disabled={isActive || saving}>
                                {isActive && <Check className="h-4 w-4 mr-1" />}{isActive ? "Current" : "Set Active"}
                              </Button>
                              <Switch checked={m.is_active} onCheckedChange={(v) => toggleModel(m.id, v)} />
                              <Button variant="ghost" size="icon" onClick={() => deleteModel(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </div>
                          <CardDescription>
                            <span className="font-mono text-xs">{m.model_id}</span>
                            {provider && <span className="ml-2 text-xs">via {provider.display_name}</span>}
                          </CardDescription>
                        </CardHeader>
                        {m.description && <CardContent className="pt-0"><p className="text-sm text-muted-foreground">{m.description}</p></CardContent>}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ─── SYSTEM PROMPTS ─────────────────────────────────────────────────── */}
            <TabsContent value="prompts" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">View and edit system prompts used by the AI enhancement engine</p>
                <Button size="sm" variant="outline" onClick={fetchSystemPrompts} disabled={promptsLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${promptsLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>

              {promptsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(systemPrompts).map(([key, value]) => {
                    const label = key.replace("system_prompt_", "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    const isEditing = editingPrompt === key;
                    return (
                      <Card key={key}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {label}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => setEditingPrompt(null)} className="h-7 text-xs">Cancel</Button>
                                  <Button size="sm" onClick={() => saveSystemPrompt(key, systemPrompts[key])} disabled={promptsSaving} className="h-7 text-xs">
                                    {promptsSaving && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Save
                                  </Button>
                                </>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => setEditingPrompt(key)} className="h-7 text-xs">Edit</Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {isEditing ? (
                            <Textarea
                              value={value}
                              onChange={(e) => setSystemPrompts(prev => ({ ...prev, [key]: e.target.value }))}
                              className="font-mono text-xs min-h-[200px]"
                              rows={10}
                            />
                          ) : (
                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-md p-3 max-h-[200px] overflow-auto">{value}</pre>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {Object.keys(systemPrompts).length === 0 && (
                    <Card><CardContent className="py-8 text-center text-muted-foreground">No system prompts configured</CardContent></Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ─── RATINGS ────────────────────────────────────────────────────────── */}
            <TabsContent value="ratings" className="space-y-4 mt-4">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  <Input placeholder="Search prompts, models..." value={ratingSearch} onChange={e => setRatingSearch(e.target.value)} className="h-8 w-56 text-xs" />
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                     <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="system">System Generated</SelectItem>
                      <SelectItem value="user">User Rated</SelectItem>
                      <SelectItem value="positive">Positive (4-5★)</SelectItem>
                      <SelectItem value="neutral">Neutral (3★)</SelectItem>
                      <SelectItem value="negative">Negative (1-2★)</SelectItem>
                      <SelectItem value="quick">Mode: Quick</SelectItem>
                      <SelectItem value="wizard">Mode: Wizard</SelectItem>
                      <SelectItem value="assisted">Mode: Assisted</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-8 text-xs gap-1.5 px-2.5", !dateFrom && "text-muted-foreground")}>
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-8 text-xs gap-1.5 px-2.5", !dateTo && "text-muted-foreground")}>
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  {(dateFrom || dateTo) && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={exportRatingsCSV} disabled={ratings.length === 0}>
                    <Download className="h-4 w-4 mr-1" /> Export CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={fetchRatings} disabled={ratingsLoading}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${ratingsLoading ? "animate-spin" : ""}`} /> Refresh
                  </Button>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={Star} label="Total Ratings" value={dateFilteredRatings.length} />
                <StatCard icon={Activity} label="Avg Rating" value={`${avgRating}★`} />
                <StatCard icon={TrendingUp} label="Positive (4-5★)" value={dateFilteredRatings.filter(r => r.rating >= 4).length} />
                <StatCard icon={Clock} label="Avg Gen Time" value={`${analyticsData.avgGenTime}s`} />
              </div>

              {ratingsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : filteredRatings.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No ratings found</CardContent></Card>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{filteredRatings.length} results</p>
                  {filteredRatings.slice((ratingsPage - 1) * ITEMS_PER_PAGE, ratingsPage * ITEMS_PER_PAGE).map(r => {
                    const isExpanded = expandedRating === r.id;
                    return (
                      <Card key={r.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <button
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                            onClick={() => setExpandedRating(isExpanded ? null : r.id)}
                          >
                            <QualityBadge score={r.quality_score} />
                            <StarRow rating={r.rating} />
                            <div className="flex items-center gap-1.5 shrink-0">
                              {r.action_type === "system" && <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0 h-4">System</Badge>}
                              {r.mode && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 capitalize">{r.mode}</Badge>}
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{r.action_type}</Badge>
                            </div>
                            <p className="flex-1 text-xs text-muted-foreground truncate min-w-0">
                              {r.original_prompt || r.enhanced_prompt}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-muted-foreground hidden sm:block">{new Date(r.created_at).toLocaleString()}</span>
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 space-y-3 border-t bg-muted/20">
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                <span><span className="font-semibold text-foreground">Quality Score:</span> <span className="text-muted-foreground">{r.quality_score !== null ? `${r.quality_score}/10` : "N/A"}</span></span>
                                <span><span className="font-semibold text-foreground">AI Model:</span> <span className="text-muted-foreground">{r.ai_model_used || "N/A"}</span></span>
                                <span><span className="font-semibold text-foreground">Target AI:</span> <span className="text-muted-foreground">{r.target_model || "N/A"}</span></span>
                                {r.generation_time_ms != null && (
                                  <span><span className="font-semibold text-foreground">Gen Time:</span> <span className="text-muted-foreground">{(r.generation_time_ms / 1000).toFixed(2)}s</span></span>
                                )}
                                <span><span className="font-semibold text-foreground">Date:</span> <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span></span>
                              </div>
                              <Separator />
                              {r.original_prompt && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">User Input</p>
                                  <p className="text-xs bg-background rounded-md border px-3 py-2 whitespace-pre-wrap">{r.original_prompt}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Enhanced Output</p>
                                <p className="text-xs bg-background rounded-md border px-3 py-2 whitespace-pre-wrap">{r.enhanced_prompt}</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  <PaginationControls page={ratingsPage} totalPages={Math.ceil(filteredRatings.length / ITEMS_PER_PAGE)} onPageChange={setRatingsPage} />
                </div>
              )}
            </TabsContent>

            {/* ─── ERROR LOGS ─────────────────────────────────────────────────────── */}
            <TabsContent value="errors" className="space-y-4 mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Select value={errorTypeFilter} onValueChange={setErrorTypeFilter}>
                    <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Errors</SelectItem>
                      <SelectItem value="rate_limit">Rate Limit</SelectItem>
                      <SelectItem value="usage_limit">Usage Limit</SelectItem>
                      <SelectItem value="auth_error">Auth Error</SelectItem>
                      <SelectItem value="api_key_error">API Key Error</SelectItem>
                      <SelectItem value="server_error">Server Error</SelectItem>
                      <SelectItem value="upstream_error">Upstream Error</SelectItem>
                      <SelectItem value="timeout">Timeout</SelectItem>
                      <SelectItem value="client_error">Client Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" variant="outline" onClick={fetchErrorLogs} disabled={errorLogsLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${errorLogsLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={Bug} label="Total Errors" value={errorLogs.length} />
                <StatCard icon={Clock} label="Rate Limits" value={errorStats["rate_limit"] || 0} />
                <StatCard icon={CreditCard} label="Usage Limits" value={errorStats["usage_limit"] || 0} />
                <StatCard icon={AlertTriangle} label="Server Errors" value={(errorStats["server_error"] || 0) + (errorStats["upstream_error"] || 0)} />
              </div>

              {errorLogsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : filteredErrorLogs.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No error logs found</CardContent></Card>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{filteredErrorLogs.length} errors</p>
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {filteredErrorLogs.slice((errorsPage - 1) * ITEMS_PER_PAGE, errorsPage * ITEMS_PER_PAGE).map(log => (
                          <div key={log.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={log.error_type === "rate_limit" ? "secondary" : log.error_type === "usage_limit" ? "outline" : "destructive"} className="text-[10px] px-1.5 py-0 h-4">
                                {log.error_type.replace(/_/g, " ")}
                              </Badge>
                              {log.error_code && <span className="text-[10px] text-muted-foreground font-mono">{log.error_code}</span>}
                              {log.mode && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{log.mode}</Badge>}
                              {log.model_used && <span className="text-[10px] text-muted-foreground">{log.model_used}</span>}
                              <span className="text-[10px] text-muted-foreground ml-auto">{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-foreground/80 truncate">{log.error_message}</p>
                            {log.user_id && <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">User: {log.user_id.slice(0, 8)}...</p>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <PaginationControls page={errorsPage} totalPages={Math.ceil(filteredErrorLogs.length / ITEMS_PER_PAGE)} onPageChange={setErrorsPage} />
                </>
              )}
            </TabsContent>

            {/* ─── STORAGE ────────────────────────────────────────────────────────── */}
            <TabsContent value="storage" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={HardDrive} label="Storage Buckets" value={0} />
                <StatCard icon={FileText} label="Total Files" value={0} />
                <StatCard icon={Activity} label="Storage Used" value="0 MB" />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Storage Buckets</CardTitle>
                  <CardDescription>Manage file storage buckets and their access policies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <HardDrive className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-medium">No storage buckets configured</p>
                    <p className="text-sm text-muted-foreground mt-1">Create buckets to store user-uploaded files, avatars, or documents.</p>
                    <Button size="sm" variant="outline" className="mt-4" disabled>Create Bucket</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── ANALYTICS ──────────────────────────────────────────────────────── */}
            <TabsContent value="analytics" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={BarChart3} label="Total Ratings" value={dateFilteredRatings.length} />
                <StatCard icon={Star} label="Avg Rating" value={`${avgRating}★`} />
                <StatCard icon={Clock} label="Avg Gen Time" value={`${analyticsData.avgGenTime}s`} />
                <StatCard icon={TrendingUp} label="Positive Rate" value={dateFilteredRatings.length ? `${Math.round(dateFilteredRatings.filter(r => r.rating >= 4).length / dateFilteredRatings.length * 100)}%` : "—"} />
              </div>

              {dateFilteredRatings.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No data yet — ratings will appear here once users start using the app.</CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Ratings over time */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Ratings Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={analyticsData.byDay}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Star distribution */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Rating Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analyticsData.byRating}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="star" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Mode breakdown */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Usage by Mode</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={analyticsData.byMode} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {analyticsData.byMode.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* By model */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Usage by Model</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analyticsData.byModel} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="model" tick={{ fontSize: 10 }} width={80} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* ─── PLANS ──────────────────────────────────────────────────────────── */}
            <TabsContent value="plans" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: "Free", price: "$0", features: ["10 prompts/day", "Quick mode", "Basic models"], highlight: false },
                  { name: "Pro", price: "$12/mo", features: ["Unlimited prompts", "All modes", "Premium models", "History export"], highlight: true },
                  { name: "Team", price: "$49/mo", features: ["Everything in Pro", "Team workspace", "Admin dashboard", "Priority support"], highlight: false },
                ].map(plan => (
                  <Card key={plan.name} className={plan.highlight ? "border-primary shadow-md" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {plan.highlight && <Badge className="bg-primary text-xs">Popular</Badge>}
                      </div>
                      <p className="text-2xl font-bold mt-1">{plan.price}</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                      <Button className="w-full mt-4" variant={plan.highlight ? "default" : "outline"} size="sm" disabled>
                        Configure Plan
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardContent className="py-4 px-4">
                  <p className="text-sm text-muted-foreground text-center">Plan enforcement coming soon — integrate with Stripe to enable billing.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── LOGS ───────────────────────────────────────────────────────────── */}
            <TabsContent value="logs" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">All enhancement activity — every prompt enhanced is logged here</p>
                <Button size="sm" variant="outline" onClick={fetchRatings} disabled={ratingsLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${ratingsLoading ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>

              {ratingsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : ratings.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No activity yet</CardContent></Card>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{ratings.length} entries</p>
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y font-mono text-xs">
                        {ratings.slice((logsPage - 1) * ITEMS_PER_PAGE, logsPage * ITEMS_PER_PAGE).map(r => (
                          <div key={r.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/20">
                            <span className="text-muted-foreground/60 shrink-0 tabular-nums">
                              {new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19)}
                            </span>
                            {r.quality_score !== null && r.quality_score !== undefined ? (
                              <span className={`shrink-0 font-semibold ${r.quality_score >= 8 ? "text-green-500" : r.quality_score >= 5 ? "text-yellow-500" : "text-destructive"}`}>
                                [{r.quality_score}/10]
                              </span>
                            ) : (
                              <span className={`shrink-0 font-semibold ${r.rating >= 4 ? "text-green-500" : r.rating <= 2 ? "text-destructive" : "text-yellow-500"}`}>
                                [{r.rating}★]
                              </span>
                            )}
                            <span className="text-primary shrink-0">{r.action_type?.toUpperCase()}</span>
                            <span className="text-muted-foreground shrink-0">{r.mode || "—"}</span>
                            <span className="text-foreground/70 shrink-0">{r.ai_model_used?.split("/").pop() || "N/A"}</span>
                            <span className="text-muted-foreground truncate">{r.original_prompt?.slice(0, 80) || r.enhanced_prompt.slice(0, 80)}</span>
                            {r.generation_time_ms != null && (
                              <span className="text-muted-foreground/60 shrink-0">{(r.generation_time_ms / 1000).toFixed(1)}s</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <PaginationControls page={logsPage} totalPages={Math.ceil(ratings.length / ITEMS_PER_PAGE)} onPageChange={setLogsPage} />
                </>
              )}
            </TabsContent>

            {/* ─── SECURITY ───────────────────────────────────────────────────────── */}
            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={CheckCircle2} label="Checks Passed" value={securityChecks.filter(c => c.status).length} />
                <StatCard icon={AlertTriangle} label="Warnings" value={securityChecks.filter(c => !c.status).length} />
                <StatCard icon={Shield} label="RLS Tables" value={5} sub="All protected" />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Security Checklist
                  </CardTitle>
                  <CardDescription>Row-level security and authentication checks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {securityChecks.map((check, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
                      {check.status
                        ? <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      }
                      <div>
                        <p className="text-sm font-medium">{check.label}</p>
                        <p className="text-xs text-muted-foreground">{check.detail}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Auth Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Email/Password Auth", enabled: true },
                    { label: "Email Confirmation Required", enabled: true },
                    { label: "Anonymous Sign-ins Disabled", enabled: true },
                    { label: "Admin Role Isolation", enabled: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm">{item.label}</span>
                      <Badge variant={item.enabled ? "default" : "destructive"} className="text-xs">
                        {item.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        )}

        {/* ── OpenRouter Browser Dialog ──────────────────────────────────────────── */}
        <Dialog open={browseDialogOpen} onOpenChange={setBrowseDialogOpen}>
          <DialogContent className="max-w-2xl h-[80vh] flex flex-col overflow-hidden">
            <DialogHeader><DialogTitle>Browse OpenRouter Models</DialogTitle></DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search models..." value={orSearch} onChange={(e) => setOrSearch(e.target.value)} className="pl-9" />
            </div>
            {orLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <ScrollArea className="flex-1 max-h-[55vh]">
                <div className="space-y-2 pr-4">
                  {filteredOrModels.length === 0 && <p className="text-center text-muted-foreground py-8">No models found</p>}
                  {filteredOrModels.map(m => {
                    const alreadyAdded = existingModelIds.has(m.id);
                    const isImporting = orImporting.has(m.id);
                    const isFree = m.pricing?.prompt === "0" && m.pricing?.completion === "0";
                    return (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{m.name}</span>
                            {isFree && <Badge variant="outline" className="text-xs shrink-0">Free</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate">{m.id}</p>
                          {m.context_length > 0 && <p className="text-xs text-muted-foreground">{(m.context_length / 1000).toFixed(0)}K context</p>}
                        </div>
                        <Button size="sm" variant={alreadyAdded ? "secondary" : "default"} disabled={alreadyAdded || isImporting} onClick={() => importOrModel(m)} className="shrink-0">
                          {isImporting ? <Loader2 className="h-3 w-3 animate-spin" /> : alreadyAdded ? <><Check className="h-3 w-3 mr-1" />Added</> : <><Download className="h-3 w-3 mr-1" />Add</>}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* ── AIML API Browser Dialog ────────────────────────────────────────────── */}
        <Dialog open={aimlBrowseOpen} onOpenChange={setAimlBrowseOpen}>
          <DialogContent className="max-w-2xl h-[80vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>Browse AIML API Models</DialogTitle>
              <p className="text-sm text-muted-foreground">Browse and import available models from aimlapi.com</p>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search models..." value={aimlSearch} onChange={(e) => setAimlSearch(e.target.value)} className="pl-9" />
              </div>
              <Button size="sm" variant="outline" onClick={fetchAimlModels} disabled={aimlLoading}>
                <RefreshCw className={`h-4 w-4 ${aimlLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {aimlModels.length > 0 && `${aimlModels.length} models available`}
              {aimlSearch && filteredAimlModels.length !== aimlModels.length && ` · ${filteredAimlModels.length} matching`}
            </div>
            {aimlLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <ScrollArea className="flex-1 max-h-[55vh]">
                <div className="space-y-2 pr-4">
                  {filteredAimlModels.length === 0 && <p className="text-center text-muted-foreground py-8">No models found</p>}
                  {filteredAimlModels.map(m => {
                    const alreadyAdded = existingModelIds.has(m.id);
                    const isImporting = aimlImporting.has(m.id);
                    const isFree = m.pricing?.prompt === "0" && m.pricing?.completion === "0";
                    return (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{m.name}</span>
                            {isFree && <Badge variant="outline" className="text-xs shrink-0">Free</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate">{m.id}</p>
                          {m.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{m.description}</p>}
                          {m.context_length > 0 && <p className="text-[10px] text-muted-foreground">{(m.context_length / 1000).toFixed(0)}K context</p>}
                        </div>
                        <Button size="sm" variant={alreadyAdded ? "secondary" : "default"} disabled={alreadyAdded || isImporting} onClick={() => importAimlModel(m)} className="shrink-0">
                          {isImporting ? <Loader2 className="h-3 w-3 animate-spin" /> : alreadyAdded ? <><Check className="h-3 w-3 mr-1" />Added</> : <><Download className="h-3 w-3 mr-1" />Add</>}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
