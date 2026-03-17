import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ArrowRight, Loader2, Sparkles, RotateCcw, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import {
  fetchAssistedQuestions,
  streamAssistedGenerate,
  AssistedQuestion,
} from "@/lib/stream-chat";
import { PromptParameters } from "@/lib/types";
import { EnhancedOutput } from "@/components/EnhancedOutput";

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese", "Italian",
  "Dutch", "Russian", "Chinese", "Japanese", "Korean", "Arabic",
  "Hindi", "Turkish", "Polish", "Swedish", "Vietnamese", "Thai",
];

interface Props {
  targetModel: string;
  targetModelLabel: string;
  parameters: PromptParameters;
}

type Step = "input" | "questions" | "deep_dive" | "generating" | "done";

export function AssistedPanel({ targetModel, targetModelLabel, parameters }: Props) {
  const [step, setStep] = useState<Step>("input");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState(parameters.language || "English");
  const [diveDeep, setDiveDeep] = useState(false);
  const [questions, setQuestions] = useState<AssistedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [deepQuestions, setDeepQuestions] = useState<AssistedQuestion[]>([]);
  const [deepAnswers, setDeepAnswers] = useState<Record<string, string>>({});
  const [deepCustomInputs, setDeepCustomInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const CUSTOM_VALUE = "__custom__";

  const mergedParams: PromptParameters = { ...parameters, language };

  const handleStartAnalysis = async () => {
    if (!description.trim()) {
      toast({ title: "Please describe what you want to achieve", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const qs = await fetchAssistedQuestions(description, "assisted_questions");
      setQuestions(qs);
      setStep("questions");
    } catch (e) {
      toast({ title: "Failed to generate questions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getResolvedAnswers = (raw: Record<string, string>, custom: Record<string, string>) => {
    const resolved: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      resolved[k] = v === CUSTOM_VALUE ? (custom[k] || "") : v;
    }
    return resolved;
  };

  const handleSubmitAnswers = async () => {
    const resolved = getResolvedAnswers(answers, customInputs);
    const unanswered = questions.filter((q) => !resolved[q.id]?.trim());
    if (unanswered.length > 0) {
      toast({ title: "Please answer all questions", variant: "destructive" });
      return;
    }

    if (diveDeep) {
      setLoading(true);
      try {
        const dqs = await fetchAssistedQuestions(description, "assisted_deep_dive", resolved);
        setDeepQuestions(dqs);
        setStep("deep_dive");
      } catch {
        toast({ title: "Failed to generate deep dive questions", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    } else {
      generatePrompt();
    }
  };

  const handleSubmitDeepAnswers = () => {
    generatePrompt();
  };

  const generatePrompt = async () => {
    setStep("generating");
    setEnhancedPrompt("");
    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const resolvedAnswers = getResolvedAnswers(answers, customInputs);
    const resolvedDeep = getResolvedAnswers(deepAnswers, deepCustomInputs);

    await streamAssistedGenerate({
      originalPrompt: description,
      targetModel: targetModelLabel,
      answers: resolvedAnswers,
      deepAnswers: Object.keys(resolvedDeep).length > 0 ? resolvedDeep : undefined,
      parameters: mergedParams,
      onDelta: (chunk) => setEnhancedPrompt((prev) => prev + chunk),
      onDone: () => {
        setIsStreaming(false);
        setStep("done");
      },
      onError: (err) => {
        setIsStreaming(false);
        setStep("done");
        toast({ title: "Generation failed", description: err, variant: "destructive" });
      },
      signal: controller.signal,
    });
  };

  const handleReset = () => {
    setStep("input");
    setDescription("");
    setQuestions([]);
    setAnswers({});
    setCustomInputs({});
    setDeepQuestions([]);
    setDeepAnswers({});
    setDeepCustomInputs({});
    setEnhancedPrompt("");
    setIsStreaming(false);
    setDiveDeep(false);
  };

  const handleReEnhance = () => {
    setEnhancedPrompt("");
    generatePrompt();
  };

  const renderQuestion = (
    q: AssistedQuestion,
    i: number,
    currentAnswers: Record<string, string>,
    setCurrentAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    currentCustom: Record<string, string>,
    setCurrentCustom: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  ) => {
    const options = q.options || [];
    const selected = currentAnswers[q.id] || "";

    return (
      <motion.div
        key={q.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05 }}
      >
        <Card className="p-3 space-y-2.5">
          <label className="text-sm font-medium">{q.question}</label>
          <RadioGroup
            value={selected}
            onValueChange={(v) => setCurrentAnswers((prev) => ({ ...prev, [q.id]: v }))}
            className="space-y-1.5"
          >
            {options.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                <Label htmlFor={`${q.id}-${opt}`} className="text-sm cursor-pointer font-normal">
                  {opt}
                </Label>
              </div>
            ))}
            <div className="flex items-start gap-2">
              <RadioGroupItem value={CUSTOM_VALUE} id={`${q.id}-custom`} className="mt-2.5" />
              <div className="flex-1 space-y-1">
                <Label htmlFor={`${q.id}-custom`} className="text-sm cursor-pointer font-normal">
                  Other (custom)
                </Label>
                {selected === CUSTOM_VALUE && (
                  <Input
                    value={currentCustom[q.id] || ""}
                    onChange={(e) => setCurrentCustom((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Type your answer..."
                    className="text-sm"
                    autoFocus
                  />
                )}
              </div>
            </div>
          </RadioGroup>
        </Card>
      </motion.div>
    );
  };

  // Sidebar showing user prompt (visible after step 1)
  const renderPromptSidebar = () => (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Your Prompt</h4>
        <Card className="p-3">
          <p className="text-sm font-mono whitespace-pre-wrap break-words">{description}</p>
        </Card>
      </div>
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Target Model</h4>
        <p className="text-sm font-medium">{targetModelLabel}</p>
      </div>
      <div>
        <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Language</h4>
        <p className="text-sm font-medium">{language}</p>
      </div>
    </div>
  );

  const languageSelector = (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className="w-[140px] h-9 text-xs gap-1">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang} value={lang} className="text-xs">{lang}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* Step 1: Input */}
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 py-2 sm:py-4">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h2 className="text-base sm:text-lg font-bold">Assisted Prompt Engineering</h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                Describe what you want to achieve, and our AI will ask clarifying questions to build the perfect prompt for you.
              </p>
            </div>

            <Card className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. I need a python script to scrape a website..."
                className="min-h-[120px] sm:min-h-[160px] font-mono text-sm resize-none"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="dive-deep"
                    checked={diveDeep}
                    onCheckedChange={(v) => setDiveDeep(v === true)}
                  />
                  <label htmlFor="dive-deep" className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Dive Deep
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  {languageSelector}
                  <Button onClick={handleStartAnalysis} disabled={loading} className="gap-1.5 flex-1 sm:flex-none">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Start Analysis
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Clarifying Questions */}
        {step === "questions" && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Clarifying Questions</h3>
                    <p className="text-xs text-muted-foreground">Help us understand your needs better</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Step 1{diveDeep ? " of 2" : ""}</span>
                </div>

                <div className="space-y-3">
                  {questions.map((q, i) => renderQuestion(q, i, answers, setAnswers, customInputs, setCustomInputs))}
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
                  <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">Back</Button>
                  <Button onClick={handleSubmitAnswers} disabled={loading} className="gap-1.5 w-full sm:w-auto">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {diveDeep ? "Continue to Deep Dive" : "Generate Prompt"}
                  </Button>
                </div>
              </div>
              <div className="hidden lg:block">
                {renderPromptSidebar()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Deep Dive Questions */}
        {step === "deep_dive" && (
          <motion.div
            key="deep_dive"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Deep Dive Questions
                    </h3>
                    <p className="text-xs text-muted-foreground">Let's refine the details further</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Step 2 of 2</span>
                </div>

                <div className="space-y-3">
                  {deepQuestions.map((q, i) => renderQuestion(q, i, deepAnswers, setDeepAnswers, deepCustomInputs, setDeepCustomInputs))}
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
                  <Button variant="outline" onClick={() => setStep("questions")} className="w-full sm:w-auto">Back</Button>
                  <Button onClick={handleSubmitDeepAnswers} className="gap-1.5 w-full sm:w-auto">
                    <Sparkles className="h-4 w-4" />
                    Generate Prompt
                  </Button>
                </div>
              </div>
              <div className="hidden lg:block">
                {renderPromptSidebar()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Generating / Done */}
        {(step === "generating" || step === "done") && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Generated Prompt</h3>
                  <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
                    <RotateCcw className="h-3 w-3" />
                    Start Over
                  </Button>
                </div>

                <EnhancedOutput
                  enhancedPrompt={enhancedPrompt}
                  isStreaming={isStreaming}
                  originalPrompt={description}
                  targetModel={targetModel}
                  mode="wizard"
                  onReEnhance={handleReEnhance}
                />
              </div>
              <div className="hidden lg:block">
                {renderPromptSidebar()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
