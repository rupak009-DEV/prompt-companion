import { useState, useRef, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TARGET_MODELS, WizardData, PromptParameters } from "@/lib/types";
import { streamEnhance } from "@/lib/stream-chat";
import { toast } from "@/hooks/use-toast";
import { Wand2, Square, BookOpen, Paperclip, X, FileIcon, AlertTriangle, ChevronDown, Rocket, SearchCheck, Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { motion } from "framer-motion";
import { WizardPanel } from "@/components/WizardPanel";
import { ParametersPanel } from "@/components/ParametersPanel";
import { EnhancedOutput } from "@/components/EnhancedOutput";
import { TemplateProvider } from "@/lib/template-context";
import { AssistedPanel } from "@/components/AssistedPanel";
import { MODEL_ICONS } from "@/components/ModelIcons";
import { supabase } from "@/integrations/supabase/client";

const EnhancePage = () => {
  const [mode, setMode] = useState<"quick" | "wizard" | "assisted">("quick");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [targetModel, setTargetModel] = useState("chatgpt");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiModelUsed, setAiModelUsed] = useState("");
  const [generationTimeMs, setGenerationTimeMs] = useState<number | undefined>();
  const [wizardData, setWizardData] = useState<WizardData>({
    intent: "", audience: "", tone: "", format: "", constraints: ""
  });
  const [parameters, setParameters] = useState<PromptParameters>({
    language: "English", wordLimit: ""
  });
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const voiceBaseRef = useRef("");

  const speech = useSpeechRecognition({
    onResult: (transcript) => {
      setOriginalPrompt(voiceBaseRef.current + transcript);
    },
    onEnd: () => {},
  });

  const handleMicToggle = () => {
    if (speech.isListening) {
      speech.stop();
    } else {
      voiceBaseRef.current = originalPrompt ? originalPrompt + " " : "";
      speech.start();
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTemplateSelect = useCallback((prompt: string, model: string) => {
    setOriginalPrompt(prompt);
    setTargetModel(model);
  }, []);

  const handleEnhance = async () => {
    if (!originalPrompt.trim()) {
      toast({ title: "Please enter a prompt first", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setIsStreaming(false);
    setEnhancedPrompt("");
    setGenerationTimeMs(undefined);
    const startTime = Date.now();

    // Fetch active AI model name for rating tracking
    try {
      const { data: settingsData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "active_model")
        .maybeSingle();
      if (settingsData?.value) {
        const val = settingsData.value as { model_id?: string };
        setAiModelUsed(val.model_id || "");
      }
    } catch {}

    const controller = new AbortController();
    abortRef.current = controller;

    const selectedModel = TARGET_MODELS.find((m) => m.id === targetModel);

    await streamEnhance({
      originalPrompt,
      targetModel: selectedModel?.label || targetModel,
      wizardData: mode === "wizard" ? wizardData : undefined,
      parameters,
      onDelta: (chunk) => {
        setIsLoading(false);
        setIsStreaming(true);
        setEnhancedPrompt((prev) => prev + chunk);
      },
      onDone: () => {
        setIsStreaming(false);
        setIsLoading(false);
        setGenerationTimeMs(Date.now() - startTime);
      },
      onError: (err) => {
        setIsStreaming(false);
        setIsLoading(false);
        toast({ title: "Enhancement failed", description: err, variant: "destructive" });
      },
      signal: controller.signal
    });
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setIsLoading(false);
  };

  const handleReEnhance = () => {
    setOriginalPrompt(enhancedPrompt);
    setEnhancedPrompt("");
  };

  const selectedModel = TARGET_MODELS.find((m) => m.id === targetModel);
  const ModelIcon = selectedModel ? MODEL_ICONS[selectedModel.id] : undefined;

  return (
    <TemplateProvider value={handleTemplateSelect}>
      <AppLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl sm:text-2xl font-bold">Enhance Your Prompt</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Transform lazy prompts into powerful, model-optimized instructions
          </p>
        </motion.div>

        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "quick" | "wizard" | "assisted")}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <TabsList className="grid w-full sm:max-w-md grid-cols-3">
              <TabsTrigger value="quick" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Quick
              </TabsTrigger>
              <TabsTrigger value="assisted" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <SearchCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden xs:inline">User </span>Assisted
              </TabsTrigger>
              <TabsTrigger value="wizard" className="gap-1 sm:gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                Wizard
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Target AI:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 text-sm h-8">
                    {ModelIcon && <ModelIcon className="h-4 w-4" />}
                    <span>{selectedModel?.label || "Select Model"}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {TARGET_MODELS.map((m) => {
                      const Icon = MODEL_ICONS[m.id];
                      return (
                        <DropdownMenuItem
                          key={m.id}
                          onClick={() => setTargetModel(m.id)}
                          className={`gap-2 ${targetModel === m.id ? "bg-primary/10 text-foreground" : ""}`}>
                          
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{m.label}</span>
                      </DropdownMenuItem>);

                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {selectedModel?.category === "image" &&
            <div className="flex items-start gap-2 px-3 py-2.5 mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed">
                This model ({selectedModel.label}) is specialized for visual generation. Text-based outputs might be sub-optimal for non-visual tasks.
              </p>
            </div>
            }

          {/* Assisted Mode - full width */}
          <TabsContent value="assisted" className="mt-4">
            <AssistedPanel
                targetModel={targetModel}
                targetModelLabel={selectedModel?.label || targetModel}
                parameters={parameters} />
              
          </TabsContent>

          {/* Quick & Wizard modes - two column layout */}
          {mode !== "assisted" &&
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 mt-4">
            {/* Left: Input */}
            <div className="space-y-4">
              {/* Prompt Input */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Your Prompt</label>
                <div className="relative">
                <Textarea
                      value={originalPrompt}
                      onChange={(e) => setOriginalPrompt(e.target.value)}
                      placeholder="Type your lazy prompt here... e.g. 'write me a blog post about AI'"
                      className="min-h-[120px] sm:min-h-[160px] font-mono text-sm resize-none bg-card pr-10" />
                    
                  <div className="absolute right-2 bottom-2 flex items-center gap-0.5">
                    {speech.isSupported && (
                      <button
                        type="button"
                        onClick={handleMicToggle}
                        className={`p-1.5 rounded-md transition-colors ${
                          speech.isListening
                            ? "text-destructive bg-destructive/10 animate-pulse"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        title={speech.isListening ? "Stop voice input" : "Start voice input"}
                      >
                        {speech.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Attach file"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileAttach}
                      accept=".txt,.md,.csv,.json,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" />
                    
                </div>
                {/* Attached files */}
                {attachedFiles.length > 0 &&
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachedFiles.map((file, i) =>
                    <div
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/50 text-xs text-foreground">
                      
                        <FileIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  }
              </div>

              {/* Wizard Panel */}
              <TabsContent value="wizard" className="mt-0 p-0">
                <WizardPanel data={wizardData} onChange={setWizardData} />
              </TabsContent>

              <TabsContent value="quick" className="mt-0 p-0">
                <div />
              </TabsContent>

              {/* Enhance Button + Parameters */}
              <div className="flex gap-2">
                {isStreaming ?
                  <Button variant="destructive" onClick={handleStop} className="gap-1.5 flex-1 sm:flex-none">
                    <Square className="h-3.5 w-3.5" />
                    Stop
                  </Button> :

                  <>
                    <ParametersPanel data={parameters} onChange={setParameters} />
                    <Button onClick={handleEnhance} className="gap-1.5 flex-1 text-xs sm:text-sm" size="default">
                      <Wand2 className="h-4 w-4 shrink-0" />
                      <span className="truncate">Enhance for {selectedModel?.label || "AI"}</span>
                    </Button>
                    {(originalPrompt.trim() || enhancedPrompt) && (
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => {
                          setOriginalPrompt("");
                          setEnhancedPrompt("");
                          setAttachedFiles([]);
                          setWizardData({ intent: "", audience: "", tone: "", format: "", constraints: "" });
                          setGenerationTimeMs(undefined);
                        }}
                        className="gap-1.5 text-xs sm:text-sm shrink-0"
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </>
                  }
              </div>
            </div>

            {/* Right: Output */}
            <div>
              <EnhancedOutput
                  enhancedPrompt={enhancedPrompt}
                  isStreaming={isStreaming}
                  isLoading={isLoading}
                  originalPrompt={originalPrompt}
                  targetModel={targetModel}
                  mode={mode as "quick" | "wizard" | "assisted"}
                  aiModelUsed={aiModelUsed}
                  generationTimeMs={generationTimeMs}
                  onReEnhance={handleReEnhance} />
                
            </div>
          </div>
            }
        </Tabs>
      </div>
      </AppLayout>
    </TemplateProvider>);

};

export default EnhancePage;