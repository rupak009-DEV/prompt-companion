import { useState, useMemo, useCallback, useRef, useEffect, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy, Check, Download, Save, Wand2,
  ChevronDown, FileText, Code2, Sparkles, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { saveRecord } from "@/lib/storage";
import { EnhancementRecord } from "@/lib/types";
import { convertToStructuredJson } from "@/lib/stream-chat";
import { FeedbackPopover } from "@/components/FeedbackPopover";
import { RatingDialog } from "@/components/RatingDialog";

interface Props {
  enhancedPrompt: string;
  isStreaming: boolean;
  isLoading?: boolean;
  originalPrompt: string;
  targetModel: string;
  mode: "quick" | "wizard" | "assisted";
  aiModelUsed?: string;
  generationTimeMs?: number;
  onReEnhance: () => void;
}

function EnhancedOutputComponent({
  enhancedPrompt,
  isStreaming,
  isLoading = false,
  originalPrompt,
  targetModel,
  mode,
  aiModelUsed,
  generationTimeMs,
  onReEnhance,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"text" | "json">("text");
  const [metricsOpen, setMetricsOpen] = useState(false);
  
  const [structuredJson, setStructuredJson] = useState<string | null>(null);
  const [jsonLoading, setJsonLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Rating gate state
  const [ratingOpen, setRatingOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"copy" | "save" | "export" | null>(null);
  const pendingExportFormat = useRef<"txt" | "md" | "pdf" | "json">("txt");

  const stats = useMemo(() => {
    const text = enhancedPrompt.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    return { words, chars };
  }, [enhancedPrompt]);

  const score = useMemo(() => {
    if (!enhancedPrompt || isStreaming) return null;
    const t = enhancedPrompt;
    let s = 5;
    if (t.length > 100) s += 1;
    if (t.length > 300) s += 1;
    if (/role|act as|you are/i.test(t)) s += 1;
    if (/step|1\.|•|-\s/m.test(t)) s += 1;
    if (/example|e\.g\.|for instance/i.test(t)) s += 0.5;
    if (/format|output|respond/i.test(t)) s += 0.5;
    return Math.min(10, Math.round(s));
  }, [enhancedPrompt, isStreaming]);

  const handleJsonTab = useCallback(async () => {
    setViewMode("json");
    if (structuredJson || jsonLoading) return;
    setJsonLoading(true);
    setJsonError(null);
    try {
      const result = await convertToStructuredJson(enhancedPrompt);
      setStructuredJson(JSON.stringify(result, null, 2));
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Failed to convert");
    } finally {
      setJsonLoading(false);
    }
  }, [enhancedPrompt, structuredJson, jsonLoading]);

  useMemo(() => {
    setStructuredJson(null);
    setJsonError(null);
  }, [enhancedPrompt]);

  const executeCopy = async () => {
    const content = viewMode === "json" && structuredJson ? structuredJson : enhancedPrompt;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const executeSave = () => {
    const record: EnhancementRecord = {
      id: crypto.randomUUID(),
      originalPrompt,
      enhancedPrompt,
      targetModel,
      mode: mode === "assisted" ? "quick" : mode,
      timestamp: Date.now(),
      isFavorite: false,
    };
    saveRecord(record);
    toast({ title: "Saved to history!" });
  };

  const executeExport = (format: "txt" | "md" | "pdf" | "json") => {
    let content = enhancedPrompt;

    if (format === "json" && structuredJson) {
      content = structuredJson;
    } else if (format === "json") {
      content = JSON.stringify({ enhanced_prompt: enhancedPrompt, model: targetModel }, null, 2);
    } else if (viewMode === "json" && structuredJson) {
      content = structuredJson;
    }

    if (format === "pdf") {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`<html><head><title>Enhanced Prompt</title><style>body{font-family:monospace;white-space:pre-wrap;padding:2rem;max-width:800px;}</style></head><body>${content.replace(/\n/g, "<br>")}</body></html>`);
        win.document.close();
        win.print();
      }
      return;
    }

    const finalMime = format === "md" ? "text/markdown" : format === "json" ? "application/json" : "text/plain";
    const blob = new Blob([content], { type: finalMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `enhanced-prompt.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported as .${format}` });
  };

  const handleCopy = () => {
    setPendingAction("copy");
    setRatingOpen(true);
  };

  const handleSave = () => {
    setPendingAction("save");
    setRatingOpen(true);
  };

  const handleExport = (format: "txt" | "md" | "pdf" | "json") => {
    pendingExportFormat.current = format;
    setPendingAction("export");
    setRatingOpen(true);
  };

  const handleRated = () => {
    if (pendingAction === "copy") executeCopy();
    else if (pendingAction === "save") executeSave();
    else if (pendingAction === "export") executeExport(pendingExportFormat.current);
    setPendingAction(null);
  };

  const renderJsonHighlighted = (json: string) => {
    const highlighted = json.replace(
      /("(?:\\.|[^"\\])*")\s*:/g,
      '<span class="text-primary font-semibold">$1</span>:'
    ).replace(
      /:\s*("(?:\\.|[^"\\])*")/g,
      ': <span class="text-green-500 dark:text-green-400">$1</span>'
    ).replace(
      /:\s*(true|false)/g,
      ': <span class="text-amber-500">$1</span>'
    ).replace(
      /:\s*(\d+(?:\.\d+)?)/g,
      ': <span class="text-blue-500">$1</span>'
    ).replace(
      /:\s*(null)/g,
      ': <span class="text-muted-foreground italic">$1</span>'
    );
    return highlighted;
  };

  const metrics = useMemo(() => {
    if (!enhancedPrompt || isStreaming) return null;
    const t = enhancedPrompt;
    return {
      hasRole: /role|act as|you are/i.test(t),
      hasStructure: /step|1\.|•|-\s|\n\n/m.test(t),
      hasConstraints: /must|should|limit|avoid|ensure|do not/i.test(t),
      hasFormat: /format|output|respond|return/i.test(t),
      hasContext: /context|background|given|scenario/i.test(t),
      hasExamples: /example|e\.g\.|for instance|such as/i.test(t),
    };
  }, [enhancedPrompt, isStreaming]);

  const hasContent = !!enhancedPrompt;
  const showLoading = isLoading && !hasContent && !isStreaming;

  return (
    <div className="space-y-2">
      {/* Rating Dialog */}
      <RatingDialog
        open={ratingOpen}
        onOpenChange={(open) => {
          setRatingOpen(open);
          if (!open) setPendingAction(null);
        }}
        actionType={pendingAction || "copy"}
        originalPrompt={originalPrompt}
        enhancedPrompt={enhancedPrompt}
        targetModel={targetModel}
        mode={mode}
        aiModelUsed={aiModelUsed}
        generationTimeMs={generationTimeMs}
        onRated={handleRated}
      />

      {/* Header bar */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enhanced Output</span>
        </div>
        {hasContent && !isStreaming && (
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
            <span>{stats.words} WORDS</span>
            <span>{stats.chars} CHARS</span>
            {score !== null && (
              <span>
                Score: <span className={`font-bold ${score >= 8 ? "text-green-500" : score >= 5 ? "text-yellow-500" : "text-destructive"}`}>{score}/10</span>
              </span>
            )}
          </div>
        )}
      </div>

      <Card className="min-h-[300px] sm:min-h-[400px] relative flex flex-col">
        {/* Toolbar */}
        {hasContent && !isStreaming && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-border px-2 sm:px-3 py-2 gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 self-start">
              <button
                onClick={() => setViewMode("text")}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "text"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3 w-3" />
                Text
              </button>
              <button
                onClick={handleJsonTab}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  viewMode === "json"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 className="h-3 w-3" />
                JSON
              </button>
            </div>

            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={handleCopy} className="gap-1 text-xs h-7 sm:h-8 px-2 sm:px-3">
                {copied ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                <span className="hidden xs:inline">Copy</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="gap-1 text-xs h-7 sm:h-8 px-2 sm:px-3">
                    <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden xs:inline">Export</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("txt")}>.txt (Text)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("json")}>.json (JSON)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("md")}>.md (Markdown)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>.pdf (PDF)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" onClick={handleSave} className="gap-1 text-xs h-7 sm:h-8 px-2 sm:px-3">
                <Save className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">Save</span>
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <CardContent className="p-3 sm:p-4 flex-1 overflow-y-auto max-h-[400px] sm:max-h-[500px]">
          <AnimatePresence mode="wait">
            {showLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[250px] sm:h-[350px] text-muted-foreground"
              >
                <div className="relative mb-6">
                  <div className="h-12 w-12 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
                  <Sparkles className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm font-medium text-foreground">Enhancing your prompt…</p>
                <p className="text-xs mt-1 text-muted-foreground">AI is crafting the perfect prompt for you</p>
                <div className="flex gap-1 mt-4">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : hasContent ? (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {viewMode === "text" ? (
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-card-foreground">
                    {enhancedPrompt}
                    {isStreaming && (
                      <span className="inline-block w-2 h-4 bg-primary animate-pulse-glow ml-0.5" />
                    )}
                  </pre>
                ) : jsonLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm">Converting to structured JSON…</p>
                  </div>
                ) : jsonError ? (
                  <div className="flex flex-col items-center justify-center py-16 text-destructive gap-2">
                    <p className="text-sm">{jsonError}</p>
                    <Button size="sm" variant="outline" onClick={handleJsonTab} className="text-xs">
                      Retry
                    </Button>
                  </div>
                ) : structuredJson ? (
                  <div className="relative">
                    <pre
                      className="whitespace-pre-wrap text-sm font-mono leading-relaxed rounded-lg bg-muted/50 p-4 overflow-auto max-h-[600px]"
                      dangerouslySetInnerHTML={{ __html: renderJsonHighlighted(structuredJson) }}
                    />
                  </div>
                ) : null}

                {!isStreaming && viewMode === "text" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between pt-3 border-t border-border"
                  >
                    <Button size="sm" variant="outline" onClick={onReEnhance} className="text-xs">
                      Re-enhance
                    </Button>
                    <FeedbackPopover />
                  </motion.div>
                )}

                {!isStreaming && viewMode === "json" && structuredJson && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between pt-3 border-t border-border"
                  >
                    <Button size="sm" variant="outline" onClick={onReEnhance} className="text-xs">
                      Re-enhance
                    </Button>
                    <FeedbackPopover />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[250px] sm:h-[350px] text-muted-foreground"
              >
                <Wand2 className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Your enhanced prompt will appear here</p>
                <p className="text-xs mt-1">Select a target AI and click Enhance</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {/* AI Analysis & Metrics */}
        {hasContent && !isStreaming && metrics && (
          <div className="border-t border-border">
            <Collapsible open={metricsOpen} onOpenChange={setMetricsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-medium hover:bg-muted/50 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-primary">AI Analysis & Metrics</span>
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${metricsOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                  {[
                    { label: "Role Definition", active: metrics.hasRole },
                    { label: "Structure", active: metrics.hasStructure },
                    { label: "Constraints", active: metrics.hasConstraints },
                    { label: "Output Format", active: metrics.hasFormat },
                    { label: "Context", active: metrics.hasContext },
                    { label: "Examples", active: metrics.hasExamples },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md border ${
                        m.active
                          ? "border-primary/30 bg-primary/10 text-foreground"
                          : "border-border bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${m.active ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                      {m.label}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </Card>
    </div>
  );
}

export const EnhancedOutput = memo(EnhancedOutputComponent);
