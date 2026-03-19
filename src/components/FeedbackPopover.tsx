import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageSquare, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  disabled?: boolean;
  originalPrompt?: string;
  enhancedPrompt?: string;
  targetModel?: string;
  mode?: string;
  aiModelUsed?: string;
  generationTimeMs?: number;
  qualityScore?: number | null;
  onFeedbackRated?: (rating: number) => void;
}

export function FeedbackPopover({
  disabled,
  originalPrompt,
  enhancedPrompt,
  targetModel,
  mode,
  aiModelUsed,
  generationTimeMs,
  qualityScore,
  onFeedbackRated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitted(true);
    setOpen(false);

    // Save rating to DB if we have prompt data
    if (rating > 0 && enhancedPrompt) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("prompt_ratings" as any).insert({
          user_id: user?.id || null,
          rating,
          original_prompt: originalPrompt?.slice(0, 2000) || null,
          enhanced_prompt: enhancedPrompt.slice(0, 5000),
          target_model: targetModel || null,
          mode: mode || null,
          action_type: "feedback",
          ai_model_used: aiModelUsed || null,
          generation_time_ms: generationTimeMs || null,
          quality_score: qualityScore ?? null,
        } as any);
        onFeedbackRated?.(rating);
      } catch {
        // silently fail
      }
    }

    toast({ title: "Thanks for your feedback!" });
  };

  if (submitted) {
    return (
      <Button size="sm" variant="secondary" className="gap-1.5 text-xs" disabled>
        <MessageSquare className="h-3.5 w-3.5" />
        Thanks!
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" disabled={disabled}>
          <MessageSquare className="h-3.5 w-3.5" />
          Feedback
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3 p-4">
        {/* Star Rating */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-1.5">Rate Quality</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-5 w-5 transition-colors ${
                    star <= (hovered || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Suggestions</p>
          </div>
          <Textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="How could we improve this?"
            className="min-h-[80px] text-sm resize-none"
          />
        </div>

        <Button onClick={handleSubmit} className="w-full" size="sm">
          Submit Feedback
        </Button>
      </PopoverContent>
    </Popover>
  );
}
